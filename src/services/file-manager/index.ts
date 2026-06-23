import { MarkdownView, TFile, TFolder, type App, type WorkspaceLeaf } from 'obsidian';
import { LinkFormat, type ImageFormat, type ImageManagerSettings, type RenameMoveResult } from '@/types/index';
import type { RecoveryManager } from '@/core/recovery/recovery-manager';
import type { LinkFormatter } from '@/services/link-formatter';
import type { VariableResolver } from '@/services/variable-resolver';
import { extractImageLinks } from '@/utils/image-links';
import {
  getFileStem,
  getParentPath,
  inferPathFormat,
  isNoteScopedPathTemplate,
  isRelocatableOutputFolderTemplate,
  type NextAvailablePathOptions,
  nextAvailablePath,
  normalizeVaultPath,
  resolveNoteScopedPath
} from '@/utils/image-manager';
import { parseTextImageSources, resolveTextImageSource } from '@/utils/pasted-image-source';

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'tif', 'tiff', 'heic']);

interface ImageMovePlan {
  file: TFile;
  oldPath: string;
  newPath: string;
}

interface LinkRewritePlan {
  oldPath: string;
  newPath: string;
}

interface RewriteResult {
  content: string;
  replaced: number;
}

interface NoteImageNormalizationResult {
  replaced: number;
  moved: number;
  downloaded: number;
}

export class FileManager {
  private recoveryManager: RecoveryManager | null = null;

  constructor(
    private readonly app: App,
    private readonly getSettings: () => ImageManagerSettings,
    private readonly variableResolver: VariableResolver,
    private readonly linkFormatter: LinkFormatter
  ) {}

  setRecoveryManager(recoveryManager: RecoveryManager): void {
    this.recoveryManager = recoveryManager;
  }

  isImageFile(file: TFile): boolean {
    return IMAGE_EXTENSIONS.has(file.extension.toLowerCase());
  }

  async saveImage(data: ArrayBuffer | Blob, originalName: string, noteFile: TFile, extensionOverride?: ImageFormat): Promise<TFile> {
    const buffer = data instanceof Blob ? await data.arrayBuffer() : data;
    const folder = await this.ensureOutputFolder(noteFile);
    const fileName = this.generateFileName(originalName, noteFile, extensionOverride);
    const path = this.nextAvailablePath(normalizeVaultPath(`${folder}/${fileName}`), this.getRenameCollisionOptions());
    const created = await this.app.vault.createBinary(path, buffer);
    this.recoveryManager?.recordCreatedFile(created.path);
    return created;
  }

  async saveRemoteImage(url: string, noteFile: TFile, fileName?: string): Promise<TFile> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    const inferredName = fileName ?? decodeURIComponent(url.split('/').pop() ?? `download-${Date.now()}.png`);
    return this.saveImage(buffer, inferredName, noteFile);
  }

  async renameImage(file: TFile, noteFile: TFile, newName?: string): Promise<RenameMoveResult> {
    const oldPath = file.path;
    const targetName = newName ?? this.generateFileName(file.name, noteFile);
    const folder = file.parent?.path ?? '';
    const newPath = this.nextAvailablePath(
      normalizeVaultPath(`${folder}/${targetName}`),
      newName ? undefined : this.getRenameCollisionOptions()
    );
    await this.app.fileManager.renameFile(file, newPath);
    this.recoveryManager?.recordRename(oldPath, newPath);
    await this.updateLinks(noteFile, oldPath, newPath, noteFile.path);
    return { oldPath, newPath };
  }

  async moveImage(file: TFile, targetFolder: string, noteFile?: TFile): Promise<RenameMoveResult> {
    const oldPath = file.path;
    await this.ensureFolder(targetFolder);
    const newPath = this.nextAvailablePath(normalizeVaultPath(`${targetFolder}/${file.name}`));
    await this.app.fileManager.renameFile(file, newPath);
    this.recoveryManager?.recordRename(oldPath, newPath);
    if (noteFile) {
      await this.updateLinks(noteFile, oldPath, newPath, noteFile.path);
    }
    return { oldPath, newPath };
  }

  async replaceFile(file: TFile, data: ArrayBuffer, targetPath = file.path): Promise<TFile> {
    const originalPath = file.path;
    const normalizedTargetPath = normalizeVaultPath(targetPath);
    await this.recoveryManager?.captureBinarySnapshot(file);
    await this.app.vault.modifyBinary(file, data, { mtime: Date.now() });

    if (normalizedTargetPath !== file.path) {
      await this.app.fileManager.renameFile(file, normalizedTargetPath);
      this.recoveryManager?.recordRename(originalPath, normalizedTargetPath);
      await this.updateImageLinksAcrossVault(originalPath, normalizedTargetPath);
    }

    this.refreshOpenLeaves(file, originalPath, normalizedTargetPath);
    return file;
  }

  async restoreBinaryFile(path: string, data: ArrayBuffer): Promise<TFile> {
    const existing = this.app.vault.getAbstractFileByPath(path);
    if (existing instanceof TFile) {
      await this.app.vault.modifyBinary(existing, data, { mtime: Date.now() });
      this.refreshOpenLeaves(existing, path, path);
      return existing;
    }

    await this.ensureParentFolder(path);
    const created = await this.app.vault.createBinary(path, data);
    this.refreshOpenLeaves(created, path, path);
    return created;
  }

  async restoreTextFile(path: string, content: string): Promise<TFile> {
    const existing = this.app.vault.getAbstractFileByPath(path);
    if (existing instanceof TFile) {
      await this.app.vault.modify(existing, content);
      return existing;
    }

    await this.ensureParentFolder(path);
    return this.app.vault.create(path, content);
  }

  async getImagesInNote(noteFile: TFile, sourcePath = noteFile.path): Promise<TFile[]> {
    const content = await this.app.vault.read(noteFile);
    const links = extractImageLinks(content);
    const seenPaths = new Set<string>();
    const files: TFile[] = [];
    for (const link of links) {
      const file = this.app.metadataCache.getFirstLinkpathDest(link, sourcePath);
      if (file instanceof TFile && this.isImageFile(file) && !seenPaths.has(file.path)) {
        seenPaths.add(file.path);
        files.push(file);
      }
    }
    return files;
  }

  getImagesInFolder(folder: TFolder): TFile[] {
    const files: TFile[] = [];
    for (const child of folder.children) {
      if (child instanceof TFile && this.isImageFile(child)) {
        files.push(child);
      }
      if (child instanceof TFolder) {
        files.push(...this.getImagesInFolder(child));
      }
    }
    return files;
  }

  getMarkdownFilesInFolder(folder: TFolder): TFile[] {
    const files: TFile[] = [];
    for (const child of folder.children) {
      if (child instanceof TFile && child.extension.toLowerCase() === 'md') {
        files.push(child);
      }
      if (child instanceof TFolder) {
        files.push(...this.getMarkdownFilesInFolder(child));
      }
    }
    return files;
  }

  getMarkdownFilesInVault(): TFile[] {
    return this.app.vault.getFiles().filter((file) => file.extension.toLowerCase() === 'md');
  }

  async rewriteImageLinksInNote(
    noteFile: TFile,
    allowedNotePaths: ReadonlySet<string> = new Set([noteFile.path])
  ): Promise<NoteImageNormalizationResult> {
    await this.recoveryManager?.captureTextSnapshot(noteFile.path);
    const content = await this.app.vault.read(noteFile);
    const imported = this.getSettings().enableAutoDownloadImagesFromText
      ? await this.downloadAndRewriteExternalImageLinks(content, noteFile)
      : { content, replaced: 0, downloaded: 0 };
    const normalized = this.rewriteLinksForCurrentSettings(imported.content, noteFile, noteFile.path);
    const movePlans = await this.createManagedPlacementPlan(noteFile, allowedNotePaths);
    const movedResult = this.rewriteLinksForMoves(normalized.content, noteFile, noteFile.path, movePlans, {
      preserveOriginalFormat: false
    });

    if (movePlans.length > 0) {
      await this.ensureFolder(this.resolveOutputFolderPath(noteFile.path));
      for (const move of movePlans) {
        if (move.oldPath === move.newPath) {
          continue;
        }

        await this.app.fileManager.renameFile(move.file, move.newPath);
        this.recoveryManager?.recordRename(move.oldPath, move.newPath);
      }
    }

    if (movedResult.content !== content) {
      await this.app.vault.modify(noteFile, movedResult.content);
    }

    return {
      replaced: imported.replaced + normalized.replaced + movedResult.replaced,
      downloaded: imported.downloaded,
      moved: movePlans.filter((move) => move.oldPath !== move.newPath).length
    };
  }

  generateFileName(originalName: string, noteFile: TFile, extensionOverride?: ImageFormat): string {
    const settings = this.getSettings();
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    const extension = extensionOverride ?? originalName.split('.').pop() ?? settings.defaultFormat;
    if (!settings.enableAutoRename) {
      return `${baseName}.${extension}`;
    }

    const context = this.variableResolver.createContext(noteFile.basename, baseName);
    const resolved = this.variableResolver.resolve(settings.renamePattern, context) || baseName;
    return `${resolved}.${extension}`;
  }

  resolveOutputFolderPath(notePath: string): string {
    const template = this.getSettings().outputFolder.trim();
    if (!template) {
      return getParentPath(notePath);
    }

    const noteName = getFileStem(notePath);
    const resolved = this.variableResolver.resolvePath(template, this.variableResolver.createContext(noteName, noteName));
    return resolveNoteScopedPath(resolved, notePath);
  }

  async syncManagedImagesForNote(noteFile: TFile, oldNotePath: string): Promise<number> {
    if (!this.shouldSyncManagedImagesOnNoteRelocate()) {
      return 0;
    }

    const oldFolderPath = this.resolveOutputFolderPath(oldNotePath);
    const newFolderPath = this.resolveOutputFolderPath(noteFile.path);
    const oldFolder = oldFolderPath ? this.app.vault.getAbstractFileByPath(oldFolderPath) : null;
    const referencedImages = await this.getImagesInNote(noteFile, oldNotePath);
    const managedImages = new Map<string, TFile>();

    for (const image of referencedImages) {
      if (!oldFolderPath || image.path === oldFolderPath || image.path.startsWith(`${oldFolderPath}/`)) {
        managedImages.set(image.path, image);
      }
    }

    if (this.isNoteScopedOutputFolder() && oldFolder instanceof TFolder) {
      for (const image of this.getImagesInFolder(oldFolder)) {
        managedImages.set(image.path, image);
      }
    }

    if (managedImages.size === 0) {
      return 0;
    }

    const movePlans = this.createRelocationPlan([...managedImages.values()], noteFile, newFolderPath);
    await this.recoveryManager?.captureTextSnapshot(noteFile.path);
    const content = await this.app.vault.read(noteFile);
    const updated = this.rewriteLinksForMoves(content, noteFile, oldNotePath, movePlans).content;

    await this.ensureFolder(newFolderPath);

    for (const move of movePlans) {
      if (move.oldPath === move.newPath) {
        continue;
      }

      await this.app.fileManager.renameFile(move.file, move.newPath);
      this.recoveryManager?.recordRename(move.oldPath, move.newPath);
    }

    if (updated !== content) {
      await this.app.vault.modify(noteFile, updated);
    }

    if (this.getSettings().outputFolder.trim() && oldFolder instanceof TFolder) {
      this.recoveryManager?.recordDeletedFolder(oldFolder.path);
      await this.deleteFolderIfEmpty(oldFolder);
    }

    return movePlans.filter((move) => move.oldPath !== move.newPath).length;
  }

  private async updateLinks(noteFile: TFile, oldPath: string, newPath: string, sourcePath: string): Promise<void> {
    await this.recoveryManager?.captureTextSnapshot(noteFile.path);
    const content = await this.app.vault.read(noteFile);
    const updated = this.rewriteLinksForMoves(content, noteFile, sourcePath, [{ oldPath, newPath }]).content;

    if (updated !== content) {
      await this.app.vault.modify(noteFile, updated);
    }
  }

  private async downloadAndRewriteExternalImageLinks(
    content: string,
    noteFile: TFile
  ): Promise<{
    content: string;
    replaced: number;
    downloaded: number;
  }> {
    const imageLinkRegex = /!\[\[[^\]]+\]\]|!\[[^\]]*]\(((?:<[^>]+>|[^)])+)\)/g;
    const replacements: {
      index: number;
      length: number;
      replacement: string;
    }[] = [];
    const importedFiles = new Map<string, TFile>();
    let downloaded = 0;
    let replaced = 0;
    const settings = this.getSettings();

    for (const match of content.matchAll(imageLinkRegex)) {
      const fullMatch = match[0];
      const index = match.index;
      if (typeof index !== 'number') {
        continue;
      }

      const parsed = this.linkFormatter.parseLink(fullMatch);
      const rawTarget = parsed?.path ? decodeURIComponent(parsed.path) : '';
      const source = this.parseExternalImageSource(rawTarget);
      if (!parsed || !source) {
        continue;
      }

      try {
        let importedFile = importedFiles.get(rawTarget);
        if (!importedFile) {
          const resolved = await resolveTextImageSource(source);
          importedFile = await this.saveImage(resolved.data, resolved.originalName, noteFile);
          importedFiles.set(rawTarget, importedFile);
          downloaded += 1;
        }

        const replacement = this.linkFormatter.formatLink(importedFile.path, noteFile, {
          format: settings.defaultLinkFormat,
          pathFormat: settings.defaultPathFormat,
          altText: parsed.altText,
          width: parsed.width,
          height: parsed.height,
          title: parsed.title,
          wikiParams: parsed.wikiParams
        });

        if (replacement === fullMatch) {
          continue;
        }

        replacements.push({
          index,
          length: fullMatch.length,
          replacement
        });
        replaced += 1;
      } catch (error) {
        console.error(`Image Manager failed to import external image link "${rawTarget}"`, error);
      }
    }

    if (replacements.length === 0) {
      return {
        content,
        replaced: 0,
        downloaded
      };
    }

    let updated = content;
    for (const replacement of [...replacements].sort((left, right) => right.index - left.index)) {
      updated =
        updated.slice(0, replacement.index) +
        replacement.replacement +
        updated.slice(replacement.index + replacement.length);
    }

    return {
      content: updated,
      replaced,
      downloaded
    };
  }

  private async updateImageLinksAcrossVault(oldPath: string, newPath: string): Promise<void> {
    const sourcePaths = this.getReferencingNotePaths(oldPath);
    for (const sourcePath of sourcePaths) {
      const sourceFile = this.app.vault.getAbstractFileByPath(sourcePath);
      if (!(sourceFile instanceof TFile) || sourceFile.extension.toLowerCase() !== 'md') {
        continue;
      }

      await this.updateLinks(sourceFile, oldPath, newPath, sourceFile.path);
    }
  }

  private async ensureOutputFolder(noteFile: TFile): Promise<string> {
    const folder = this.resolveOutputFolderPath(noteFile.path);
    if (folder) {
      await this.ensureFolder(folder);
    }
    return folder;
  }

  private async ensureFolder(folderPath: string): Promise<void> {
    const normalized = normalizeVaultPath(folderPath);
    if (!normalized || this.app.vault.getAbstractFileByPath(normalized)) {
      return;
    }

    const parts = normalized.split('/');
    let current = '';
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      if (!this.app.vault.getAbstractFileByPath(current)) {
        await this.app.vault.createFolder(current);
      }
    }
  }

  private async ensureParentFolder(path: string): Promise<void> {
    const parentPath = getParentPath(path);
    if (parentPath) {
      await this.ensureFolder(parentPath);
    }
  }

  private createRelocationPlan(images: TFile[], noteFile: TFile, targetFolder: string): ImageMovePlan[] {
    const settings = this.getSettings();
    const existingPaths = new Set(this.app.vault.getFiles().map((file) => file.path));
    const reservedPaths = new Set<string>();
    const plans: ImageMovePlan[] = [];

    for (const image of images) {
      existingPaths.delete(image.path);

      const targetName = settings.renameImagesOnNoteRelocate ? this.generateFileName(image.name, noteFile) : image.name;
      const candidate = normalizeVaultPath(targetFolder ? `${targetFolder}/${targetName}` : targetName);
      const newPath = nextAvailablePath(
        candidate,
        (path) => reservedPaths.has(path) || existingPaths.has(path),
        settings.renameImagesOnNoteRelocate ? this.getRenameCollisionOptions() : undefined
      );

      reservedPaths.add(newPath);
      plans.push({ file: image, oldPath: image.path, newPath });
    }

    return plans;
  }

  private rewriteLinksForMoves(
    content: string,
    noteFile: TFile,
    sourcePath: string,
    movePlans: LinkRewritePlan[],
    options: {
      preserveOriginalFormat: boolean;
    } = {
      preserveOriginalFormat: true
    }
  ): RewriteResult {
    if (movePlans.length === 0) {
      return { content, replaced: 0 };
    }

    const planByOldPath = new Map(movePlans.map((move) => [move.oldPath, move.newPath]));
    return this.rewriteImageLinks(content, (match, rawTarget, parsed, format) => {
      const resolved = this.app.metadataCache.getFirstLinkpathDest(rawTarget, sourcePath);
      const newPath = resolved ? planByOldPath.get(resolved.path) : undefined;
      if (!newPath) {
        return match;
      }

      const settings = this.getSettings();
      return this.linkFormatter.formatLink(newPath, noteFile, {
        format: options.preserveOriginalFormat ? format : settings.defaultLinkFormat,
        pathFormat: options.preserveOriginalFormat ? inferPathFormat(rawTarget) : settings.defaultPathFormat,
        altText: parsed?.altText,
        width: parsed?.width,
        height: parsed?.height,
        title: parsed?.title,
        wikiParams: parsed?.wikiParams
      });
    });
  }

  private rewriteLinksForCurrentSettings(content: string, noteFile: TFile, sourcePath: string): RewriteResult {
    const settings = this.getSettings();
    return this.rewriteImageLinks(content, (match, rawTarget, parsed) => {
      const resolved = this.app.metadataCache.getFirstLinkpathDest(rawTarget, sourcePath);
      if (!(resolved instanceof TFile) || !this.isImageFile(resolved)) {
        return match;
      }

      return this.linkFormatter.formatLink(resolved.path, noteFile, {
        format: settings.defaultLinkFormat,
        pathFormat: settings.defaultPathFormat,
        altText: parsed?.altText,
        width: parsed?.width,
        height: parsed?.height,
        title: parsed?.title,
        wikiParams: parsed?.wikiParams
      });
    });
  }

  private isNoteScopedOutputFolder(): boolean {
    return isNoteScopedPathTemplate(this.getSettings().outputFolder);
  }

  private shouldSyncManagedImagesOnNoteRelocate(): boolean {
    const settings = this.getSettings();
    return settings.enableNoteRenameSync && isRelocatableOutputFolderTemplate(settings.outputFolder);
  }

  private nextAvailablePath(path: string, options?: NextAvailablePathOptions): string {
    return nextAvailablePath(path, (candidate) => this.app.vault.getAbstractFileByPath(candidate) !== null, options);
  }

  private getRenameCollisionOptions(): NextAvailablePathOptions | undefined {
    const settings = this.getSettings();
    if (!settings.enableAutoRename || !this.renamePatternUsesTimeToken(settings.renamePattern)) {
      return undefined;
    }

    return { minDigits: 2 };
  }

  private renamePatternUsesTimeToken(pattern: string): boolean {
    return /(?:\{time\}|\$\{time\})/.test(pattern);
  }

  private async deleteFolderIfEmpty(folder: TFolder): Promise<void> {
    if (folder.children.length > 0) {
      return;
    }

    await this.app.vault.delete(folder, true);
  }

  private rewriteImageLinks(
    content: string,
    replacer: (match: string, rawTarget: string, parsed: ReturnType<LinkFormatter['parseLink']>, format: LinkFormat) => string
  ): RewriteResult {
    const imageLinkRegex = /!\[\[[^\]]+\]\]|!\[[^\]]*]\(((?:<[^>]+>|[^)])+)\)/g;
    let replaced = 0;
    const updated = content.replace(
      imageLinkRegex,
      (match) => {
        const parsed = this.linkFormatter.parseLink(match);
        const rawTarget = parsed?.path ? decodeURIComponent(parsed.path) : '';
        if (!rawTarget) {
          return match;
        }

        const rewritten = replacer(
          match,
          rawTarget,
          parsed,
          parsed?.format ?? LinkFormat.MARKDOWN
        );
        if (rewritten !== match) {
          replaced += 1;
        }
        return rewritten;
      }
    );

    return { content: updated, replaced };
  }

  private parseExternalImageSource(rawTarget: string) {
    const sources = parseTextImageSources(rawTarget);
    return sources.length === 1 ? sources[0] : null;
  }

  private refreshOpenLeaves(file: TFile, originalPath: string, targetPath: string): void {
    this.app.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
      if (leaf.view instanceof MarkdownView && leaf.view.file) {
        void this.refreshMarkdownLeafIfNeeded(leaf.view, originalPath, targetPath);
        return;
      }

      const viewWithFile = leaf.view as { file?: TFile | null };
      if (viewWithFile.file?.path !== originalPath && viewWithFile.file?.path !== targetPath) {
        return;
      }

      void this.reloadLeafFile(leaf, file);
    });
  }

  private async refreshMarkdownLeafIfNeeded(view: MarkdownView, originalPath: string, targetPath: string): Promise<void> {
    const noteFile = view.file;
    if (!noteFile) {
      return;
    }

    const referencedImages = await this.getImagesInNote(noteFile);
    const referencesUpdatedImage = referencedImages.some((image) => image.path === originalPath || image.path === targetPath);
    if (!referencesUpdatedImage) {
      return;
    }

    const viewWithContent = view as MarkdownView & { contentEl?: HTMLElement };
    this.refreshImageElements(viewWithContent.contentEl ?? view.containerEl, targetPath);
    view.previewMode.rerender(true);
    await this.rebuildLeafView(view.leaf);
  }

  private async reloadLeafFile(leaf: WorkspaceLeaf, file: TFile): Promise<void> {
    try {
      await this.rebuildLeafView(leaf);
      this.refreshImageElements((leaf.view as { containerEl?: HTMLElement }).containerEl, file.path);
      await leaf.setViewState(leaf.getViewState(), { focus: false });
      const viewWithFile = leaf.view as { file?: TFile | null };
      if (viewWithFile.file?.path === file.path) {
        return;
      }
    } catch {
      // Fall back to reopening the file when the view state cannot be refreshed in place.
    }

    await leaf.openFile(file).catch(() => undefined);
  }

  private async createManagedPlacementPlan(
    noteFile: TFile,
    allowedNotePaths: ReadonlySet<string>
  ): Promise<ImageMovePlan[]> {
    const referencedImages = await this.getImagesInNote(noteFile);
    const targetFolder = this.resolveOutputFolderPath(noteFile.path);
    const existingPaths = new Set(this.app.vault.getFiles().map((file) => file.path));
    const reservedPaths = new Set<string>();
    const movePlans: ImageMovePlan[] = [];

    for (const image of referencedImages) {
      if (!this.canMoveImageToManagedFolder(image, noteFile, allowedNotePaths)) {
        continue;
      }

      existingPaths.delete(image.path);
      const candidate = normalizeVaultPath(targetFolder ? `${targetFolder}/${image.name}` : image.name);
      const newPath = nextAvailablePath(candidate, (path) => reservedPaths.has(path) || existingPaths.has(path));
      reservedPaths.add(newPath);
      if (newPath !== image.path) {
        movePlans.push({
          file: image,
          oldPath: image.path,
          newPath
        });
      }
    }

    return movePlans;
  }

  private canMoveImageToManagedFolder(
    image: TFile,
    noteFile: TFile,
    allowedNotePaths: ReadonlySet<string>
  ): boolean {
    const referrers = this.getReferencingNotePaths(image.path);
    if (referrers.length === 0) {
      referrers.push(noteFile.path);
    }
    if (referrers.some((notePath) => !allowedNotePaths.has(notePath))) {
      return false;
    }

    const destinationFolders = new Set(
      referrers.map((notePath) => this.resolveOutputFolderPath(notePath))
    );
    return destinationFolders.size <= 1 && destinationFolders.has(this.resolveOutputFolderPath(noteFile.path));
  }

  private getReferencingNotePaths(imagePath: string): string[] {
    const resolvedLinks = this.app.metadataCache?.resolvedLinks ?? {};
    const referrers: string[] = [];
    for (const [sourcePath, links] of Object.entries(resolvedLinks)) {
      if ((links[imagePath] ?? 0) > 0) {
        referrers.push(sourcePath);
      }
    }
    return referrers;
  }

  private async rebuildLeafView(leaf: WorkspaceLeaf): Promise<void> {
    const runtimeLeaf = leaf as WorkspaceLeaf & {
      loadIfDeferred?: () => Promise<void>;
      rebuildView?: () => Promise<void>;
    };

    await runtimeLeaf.loadIfDeferred?.().catch(() => undefined);
    await runtimeLeaf.rebuildView?.().catch(() => undefined);
  }

  private refreshImageElements(containerEl: HTMLElement | undefined, imagePath: string): void {
    if (!containerEl) {
      return;
    }

    const abstract = this.app.vault.getAbstractFileByPath(imagePath);
    if (!(abstract instanceof TFile)) {
      return;
    }

    const freshSrc = this.buildFreshResourcePath(abstract);
    for (const image of containerEl.querySelectorAll('img')) {
      const managedPath = image.getAttribute('data-image-manager-path');
      if (managedPath && managedPath !== imagePath) {
        continue;
      }

      image.setAttribute('src', freshSrc);
    }
  }

  private buildFreshResourcePath(file: TFile): string {
    const base = this.app.vault.getResourcePath(file);
    const separator = base.includes('?') ? '&' : '?';
    return `${base}${separator}image-manager-mtime=${file.stat.mtime}`;
  }
}
