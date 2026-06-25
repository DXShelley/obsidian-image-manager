import { MarkdownView, TFile, TFolder, type App, type WorkspaceLeaf } from 'obsidian';
import { LinkFormat, type ImageFormat, type ImageManagerSettings, type RenameMoveResult } from '@/types/index';
import type { RecoveryManager } from '@/core/recovery/recovery-manager';
import type { LinkFormatter } from '@/services/link-formatter';
import type { VariableResolver } from '@/services/variable-resolver';
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
import { getParsedLinkResolutionCandidates } from '@/utils/link-resolution';
import { parseTextImageSources, resolveTextImageSource, type TextImageSource } from '@/utils/pasted-image-source';

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'tif', 'tiff', 'heic', 'avif']);

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
  deleted: number;
  foldersDeleted: number;
}

interface NoteExternalImageImportResult {
  replaced: number;
  downloaded: number;
}

interface ExternalImageImportLocation {
  readonly lineStart?: number;
  readonly lineEnd?: number;
  readonly occurrence?: number;
}

interface ResolvedLinkedImageFile {
  readonly file: TFile;
  readonly matchedTarget: string;
}

interface PendingLeafRefresh {
  readonly file: TFile;
  readonly originalPath: string;
  readonly targetPath: string;
}

interface OrphanImageCleanupResult {
  readonly deletedImages: number;
  readonly deletedFolders: number;
  readonly relocatedImages: number;
  readonly preservedImages: number;
}

interface DeleteEmptyFolderOptions {
  readonly preservePath?: string;
}

export class FileManager {
  private recoveryManager: RecoveryManager | null = null;
  private deferredLeafRefreshDepth = 0;
  private pendingLeafRefreshes: PendingLeafRefresh[] = [];

  constructor(
    private readonly app: App,
    private readonly getSettings: () => ImageManagerSettings,
    private readonly variableResolver: VariableResolver,
    private readonly linkFormatter: LinkFormatter
  ) {}

  setRecoveryManager(recoveryManager: RecoveryManager): void {
    this.recoveryManager = recoveryManager;
  }

  async runWithDeferredLeafRefresh<T>(operation: () => Promise<T>): Promise<T> {
    this.deferredLeafRefreshDepth += 1;
    try {
      return await operation();
    } finally {
      this.deferredLeafRefreshDepth = Math.max(0, this.deferredLeafRefreshDepth - 1);
      if (this.deferredLeafRefreshDepth === 0) {
        await this.flushPendingLeafRefreshes();
      }
    }
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
    await this.recoveryManager?.captureBinarySnapshot(file);
    await this.app.fileManager.renameFile(file, newPath);
    this.recoveryManager?.recordRename(oldPath, newPath);
    await this.updateLinks(noteFile, oldPath, newPath, noteFile.path);
    return { oldPath, newPath };
  }

  async moveImage(file: TFile, targetFolder: string, noteFile?: TFile): Promise<RenameMoveResult> {
    const oldPath = file.path;
    await this.ensureFolder(targetFolder);
    const newPath = this.nextAvailablePath(normalizeVaultPath(`${targetFolder}/${file.name}`));
    await this.recoveryManager?.captureBinarySnapshot(file);
    await this.app.fileManager.renameFile(file, newPath);
    this.recoveryManager?.recordRename(oldPath, newPath);
    if (noteFile) {
      await this.updateLinks(noteFile, oldPath, newPath, noteFile.path);
    }
    return { oldPath, newPath };
  }

  async replaceFile(file: TFile, data: ArrayBuffer, targetPath = file.path, modifiedAt = Date.now()): Promise<TFile> {
    const originalPath = file.path;
    const normalizedTargetPath = normalizeVaultPath(targetPath);
    await this.recoveryManager?.captureBinarySnapshot(file);
    await this.app.vault.modifyBinary(file, data, { mtime: modifiedAt });

    if (normalizedTargetPath !== file.path) {
      await this.app.fileManager.renameFile(file, normalizedTargetPath);
      this.recoveryManager?.recordRename(originalPath, normalizedTargetPath);
      await this.updateImageLinksAcrossVault(originalPath, normalizedTargetPath);
    }

    await this.refreshOpenLeaves(file, originalPath, normalizedTargetPath);
    return file;
  }

  async restoreBinaryFile(path: string, data: ArrayBuffer): Promise<TFile> {
    const existing = this.app.vault.getAbstractFileByPath(path);
    if (existing instanceof TFile) {
      await this.app.vault.modifyBinary(existing, data, { mtime: Date.now() });
      await this.refreshOpenLeaves(existing, path, path);
      return existing;
    }

    await this.ensureParentFolder(path);
    const created = await this.app.vault.createBinary(path, data);
    await this.refreshOpenLeaves(created, path, path);
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
    const seenPaths = new Set<string>();
    const files: TFile[] = [];
    const imageLinkRegex = /!\[\[[^\]]+\]\]|!\[[^\]]*]\(((?:<[^>]+>|[^)])+)\)/g;
    for (const match of content.matchAll(imageLinkRegex)) {
      const parsed = this.linkFormatter.parseLink(match[0]);
      const file = this.resolveLinkedImageFile(parsed, sourcePath)?.file;
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

  getImagesInVault(): TFile[] {
    return this.app.vault.getFiles().filter((file) => this.isImageFile(file));
  }

  async rewriteImageLinksInNote(
    noteFile: TFile,
    allowedNotePaths: ReadonlySet<string> = new Set([noteFile.path])
  ): Promise<NoteImageNormalizationResult> {
    await this.recoveryManager?.captureTextSnapshot(noteFile.path);
    const content = await this.app.vault.read(noteFile);
    const normalized = this.rewriteLinksForCurrentSettings(content, noteFile, noteFile.path);
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

        await this.recoveryManager?.captureBinarySnapshot(move.file);
        await this.app.fileManager.renameFile(move.file, move.newPath);
        this.recoveryManager?.recordRename(move.oldPath, move.newPath);
      }
    }

    if (movedResult.content !== content) {
      await this.app.vault.modify(noteFile, movedResult.content);
    }

    const cleanupResult = this.getSettings().deleteOrphanImages
      ? await this.deleteOrphanImagesForNote(noteFile, allowedNotePaths)
      : { deletedImages: 0, deletedFolders: 0, relocatedImages: 0, preservedImages: 0 };

    return {
      replaced: normalized.replaced + movedResult.replaced,
      downloaded: 0,
      moved: movePlans.filter((move) => move.oldPath !== move.newPath).length,
      deleted: cleanupResult.deletedImages,
      foldersDeleted: cleanupResult.deletedFolders
    };
  }

  async importExternalImageLinksInNote(noteFile: TFile): Promise<NoteExternalImageImportResult> {
    await this.recoveryManager?.captureTextSnapshot(noteFile.path);
    const content = await this.app.vault.read(noteFile);
    const imported = await this.importExternalImageLinks(content, noteFile);

    if (imported.content !== content) {
      await this.app.vault.modify(noteFile, imported.content);
    }

    return {
      replaced: imported.replaced,
      downloaded: imported.downloaded
    };
  }

  async importExternalImageLinkInNoteBySource(
    noteFile: TFile,
    sourceTarget: string,
    location: ExternalImageImportLocation = {}
  ): Promise<NoteExternalImageImportResult> {
    await this.recoveryManager?.captureTextSnapshot(noteFile.path);
    const content = await this.app.vault.read(noteFile);
    const normalizedTarget = this.normalizeExternalImageSourceValue(sourceTarget);
    if (!normalizedTarget) {
      return {
        replaced: 0,
        downloaded: 0
      };
    }

    const sectionRange = this.getLineRangeOffsets(content, location.lineStart, location.lineEnd);
    const targetOccurrence = location.occurrence ?? 1;
    let matchedCount = 0;
    const imported = await this.importExternalImageLinks(content, noteFile, ({ source, index }) => {
      const normalizedSource = this.normalizeExternalImageSourceValue(source.value);
      if (normalizedSource !== normalizedTarget) {
        return false;
      }

      if (sectionRange && (index < sectionRange.startOffset || index > sectionRange.endOffset)) {
        return false;
      }

      matchedCount += 1;
      return matchedCount === targetOccurrence;
    });

    if (imported.content !== content) {
      await this.app.vault.modify(noteFile, imported.content);
    }

    return {
      replaced: imported.replaced,
      downloaded: imported.downloaded
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
    const content = await this.app.vault.read(noteFile);
    await this.recoveryManager?.captureTextSnapshot(oldNotePath, content);
    this.recoveryManager?.recordRename(oldNotePath, noteFile.path);
    const updated = this.rewriteLinksForMoves(content, noteFile, oldNotePath, movePlans).content;

    await this.ensureFolder(newFolderPath);

    for (const move of movePlans) {
      if (move.oldPath === move.newPath) {
        continue;
      }

      await this.recoveryManager?.captureBinarySnapshot(move.file);
      await this.app.fileManager.renameFile(move.file, move.newPath);
      this.recoveryManager?.recordRename(move.oldPath, move.newPath);
    }

    if (updated !== content) {
      await this.app.vault.modify(noteFile, updated);
    }

    if (oldFolder instanceof TFolder) {
      if (this.getSettings().deleteOrphanImages) {
        await this.deleteOrphanImagesInFolder(oldFolder);
      }
      await this.deleteFolderIfEmpty(oldFolder, {
        preservePath: this.resolveManagedFolderCleanupBoundary(oldNotePath)
      });
    }

    return movePlans.filter((move) => move.oldPath !== move.newPath).length;
  }

  async deleteOrphanImagesForNote(
    noteFile: TFile,
    scopeNotePaths: ReadonlySet<string> = new Set([noteFile.path])
  ): Promise<OrphanImageCleanupResult> {
    const cleanupFolder = this.resolveOrphanCleanupFolderForNote(noteFile);
    if (!(cleanupFolder instanceof TFolder)) {
      return {
        deletedImages: 0,
        deletedFolders: 0,
        relocatedImages: 0,
        preservedImages: 0
      };
    }

    return this.deleteOrphanImages(this.getImagesInFolder(cleanupFolder), scopeNotePaths);
  }

  async deleteOrphanImagesInFolder(folder: TFolder): Promise<OrphanImageCleanupResult> {
    return this.deleteOrphanImages(
      this.getImagesInFolder(folder),
      new Set(this.getMarkdownFilesInFolder(folder).map((file) => file.path))
    );
  }

  async deleteOrphanImagesInVault(): Promise<OrphanImageCleanupResult> {
    return this.deleteOrphanImages(
      this.getImagesInVault(),
      new Set(this.getMarkdownFilesInVault().map((file) => file.path))
    );
  }

  private async updateLinks(noteFile: TFile, oldPath: string, newPath: string, sourcePath: string): Promise<void> {
    await this.recoveryManager?.captureTextSnapshot(noteFile.path);
    const content = await this.app.vault.read(noteFile);
    const updated = this.rewriteLinksForMoves(content, noteFile, sourcePath, [{ oldPath, newPath }]).content;

    if (updated !== content) {
      await this.app.vault.modify(noteFile, updated);
    }
  }

  private async importExternalImageLinks(
    content: string,
    noteFile: TFile,
    filter?: (candidate: {
      readonly fullMatch: string;
      readonly index: number;
      readonly parsed: ReturnType<LinkFormatter['parseLink']>;
      readonly rawTarget: string;
      readonly source: TextImageSource;
    }) => boolean
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
      const rawTarget = parsed?.rawPath ?? parsed?.path ?? '';
      const source = this.parseExternalImageSource(rawTarget);
      if (!parsed || !source) {
        continue;
      }
      if (
        filter &&
        !filter({
          fullMatch,
          index,
          parsed,
          rawTarget,
          source
        })
      ) {
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
          markdownPathEncodingStrategy: settings.markdownPathEncodingStrategy,
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
        this.recoveryManager?.recordCreatedFolder(current);
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
      const resolved = this.resolveLinkedImageFile(parsed, sourcePath);
      const directMatch = parsed
        ? getParsedLinkResolutionCandidates(parsed).find(
            (candidate) => planByOldPath.has(candidate) || planByOldPath.has(candidate.replace(/^\//, ''))
          )
        : undefined;
      const directMatchPath = directMatch
        ? planByOldPath.has(directMatch)
          ? directMatch
          : directMatch.replace(/^\//, '')
        : undefined;
      const newPath = directMatchPath
        ? planByOldPath.get(directMatchPath)
        : resolved
          ? planByOldPath.get(resolved.file.path)
          : undefined;
      if (!resolved || !newPath) {
        return match;
      }

      const settings = this.getSettings();
      return this.linkFormatter.formatLink(newPath, noteFile, {
        format: options.preserveOriginalFormat ? format : settings.defaultLinkFormat,
        pathFormat: options.preserveOriginalFormat ? inferPathFormat(rawTarget) : settings.defaultPathFormat,
        markdownPathEncodingStrategy: settings.markdownPathEncodingStrategy,
        markdownPathPresentation: options.preserveOriginalFormat
          ? this.getPreservedMarkdownPathPresentation(parsed, resolved.matchedTarget)
          : undefined,
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
    return this.rewriteImageLinks(content, (match, _rawTarget, parsed) => {
      const resolved = this.resolveLinkedImageFile(parsed, sourcePath);
      if (!(resolved?.file instanceof TFile) || !this.isImageFile(resolved.file)) {
        return match;
      }

      return this.linkFormatter.formatLink(resolved.file.path, noteFile, {
        format: settings.defaultLinkFormat,
        pathFormat: settings.defaultPathFormat,
        markdownPathEncodingStrategy: settings.markdownPathEncodingStrategy,
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

  private async deleteOrphanImages(
    images: readonly TFile[],
    scopeNotePaths: ReadonlySet<string>
  ): Promise<OrphanImageCleanupResult> {
    const deletedParents = new Set<string>();
    let deletedImages = 0;
    let relocatedImages = 0;
    let preservedImages = 0;

    for (const image of this.deduplicateFilesByPath(images)) {
      const referrers = [...new Set(this.getReferencingNotePaths(image.path))];
      if (referrers.some((notePath) => scopeNotePaths.has(notePath))) {
        continue;
      }

      const externalReferrers = referrers.filter((notePath) => !scopeNotePaths.has(notePath));
      if (externalReferrers.length === 1) {
        const [referencePath] = externalReferrers;
        if (!referencePath) {
          preservedImages += 1;
          continue;
        }

        const referenceNote = this.app.vault.getAbstractFileByPath(referencePath);
        if (referenceNote instanceof TFile && referenceNote.extension.toLowerCase() === 'md') {
          const oldParentPath = image.parent?.path ?? getParentPath(image.path);
          const moved = await this.reassignImageToReferencingNote(image, referenceNote);
          if (oldParentPath) {
            deletedParents.add(oldParentPath);
          }
          if (moved) {
            relocatedImages += 1;
          } else {
            preservedImages += 1;
          }
          continue;
        }

        preservedImages += 1;
        continue;
      }
      if (externalReferrers.length > 1) {
        preservedImages += 1;
        continue;
      }

      const parentPath = image.parent?.path ?? getParentPath(image.path);
      if (parentPath) {
        deletedParents.add(parentPath);
      }

      await this.recoveryManager?.captureBinarySnapshot(image);
      await this.app.vault.delete(image, true);
      deletedImages += 1;
    }

    let deletedFolders = 0;
    for (const folderPath of deletedParents) {
      const abstract = this.app.vault.getAbstractFileByPath(folderPath);
      if (abstract instanceof TFolder) {
        deletedFolders += await this.deleteFolderIfEmpty(abstract);
      }
    }

    return {
      deletedImages,
      deletedFolders,
      relocatedImages,
      preservedImages
    };
  }

  private async reassignImageToReferencingNote(image: TFile, noteFile: TFile): Promise<boolean> {
    const oldPath = image.path;
    const targetFolder = this.resolveOutputFolderPath(noteFile.path);
    if (targetFolder) {
      await this.ensureFolder(targetFolder);
    }

    const candidatePath = normalizeVaultPath(targetFolder ? `${targetFolder}/${image.name}` : image.name);
    const occupiedPaths = new Set(this.app.vault.getFiles().map((file) => file.path));
    occupiedPaths.delete(oldPath);
    const newPath =
      candidatePath === oldPath
        ? oldPath
        : nextAvailablePath(candidatePath, (path) => occupiedPaths.has(path));

    if (newPath === oldPath) {
      return false;
    }

    await this.recoveryManager?.captureBinarySnapshot(image);
    await this.app.fileManager.renameFile(image, newPath);
    this.recoveryManager?.recordRename(oldPath, newPath);
    await this.updateLinks(noteFile, oldPath, newPath, noteFile.path);
    return true;
  }

  private deduplicateFilesByPath(files: readonly TFile[]): TFile[] {
    const byPath = new Map<string, TFile>();
    for (const file of files) {
      byPath.set(file.path, file);
    }
    return [...byPath.values()];
  }

  private resolveOrphanCleanupFolderForNote(noteFile: TFile): TFolder | null {
    const managedFolderPath = this.resolveOutputFolderPath(noteFile.path);
    if (managedFolderPath) {
      const managedFolder = this.app.vault.getAbstractFileByPath(managedFolderPath);
      if (managedFolder instanceof TFolder) {
        return managedFolder;
      }

      if (this.getSettings().outputFolder.trim()) {
        return null;
      }
    }

    const fallbackFolderPath = noteFile.parent?.path ?? getParentPath(noteFile.path);
    if (!fallbackFolderPath) {
      return null;
    }

    const fallbackFolder = this.app.vault.getAbstractFileByPath(fallbackFolderPath);
    return fallbackFolder instanceof TFolder ? fallbackFolder : null;
  }

  private resolveManagedFolderCleanupBoundary(notePath: string): string | undefined {
    const template = this.getSettings().outputFolder.trim();
    if (!template) {
      return getParentPath(notePath) || undefined;
    }

    const noteName = getFileStem(notePath);
    const resolvedTemplate = normalizeVaultPath(
      this.variableResolver.resolvePath(template, this.variableResolver.createContext(noteName, noteName))
    );
    const resolvedFolder = this.resolveOutputFolderPath(notePath);
    if (!resolvedTemplate || !resolvedFolder) {
      return undefined;
    }

    const templateSegments = resolvedTemplate.split('/').filter(Boolean);
    const resolvedSegments = normalizeVaultPath(resolvedFolder).split('/').filter(Boolean);
    if (templateSegments.length === 0 || resolvedSegments.length < templateSegments.length) {
      return undefined;
    }

    const managedRootSegmentCount = resolvedSegments.length - templateSegments.length + 1;
    const managedRootPath = resolvedSegments.slice(0, managedRootSegmentCount).join('/');
    return getParentPath(managedRootPath) || undefined;
  }

  private async deleteFolderIfEmpty(folder: TFolder, options: DeleteEmptyFolderOptions = {}): Promise<number> {
    if (
      !this.getSettings().deleteEmptyFolders ||
      folder.children.length > 0 ||
      folder.path === options.preservePath
    ) {
      return 0;
    }

    const parent = folder.parent instanceof TFolder ? folder.parent : null;
    this.recoveryManager?.recordDeletedFolder(folder.path);
    await this.app.vault.delete(folder, true);
    const parentDeleted = parent ? await this.deleteFolderIfEmpty(parent, options) : 0;
    return 1 + parentDeleted;
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
        const rawTarget = parsed?.rawPath ?? parsed?.path ?? '';
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
    const sources = parseTextImageSources(rawTarget, {
      allowExtensionlessRemote: true
    });
    return sources.length === 1 ? sources[0] : null;
  }

  private normalizeExternalImageSourceValue(value: string): string | null {
    const source = this.parseExternalImageSource(value);
    if (!source) {
      return null;
    }

    switch (source.kind) {
      case 'remote':
      case 'file':
        try {
          return new URL(source.value).toString();
        } catch {
          return source.value.trim();
        }
      case 'data':
        return source.value.replace(/\s+/g, '');
      default:
        return source.value.trim();
    }
  }

  private getLineRangeOffsets(
    content: string,
    lineStart?: number,
    lineEnd?: number
  ): { startOffset: number; endOffset: number } | null {
    if (lineStart === undefined || lineEnd === undefined) {
      return null;
    }

    const lineOffsets = [0];
    for (let index = 0; index < content.length; index += 1) {
      if (content[index] === '\n') {
        lineOffsets.push(index + 1);
      }
    }

    const normalizedLineStart = Math.max(0, lineStart);
    const normalizedLineEnd = Math.max(normalizedLineStart, lineEnd);
    const startOffset = lineOffsets[normalizedLineStart];
    if (startOffset === undefined) {
      return null;
    }

    const nextLineOffset = lineOffsets[normalizedLineEnd + 1];
    return {
      startOffset,
      endOffset: nextLineOffset !== undefined ? Math.max(startOffset, nextLineOffset - 1) : content.length
    };
  }

  private resolveLinkedImageFile(parsed: ReturnType<LinkFormatter['parseLink']>, sourcePath: string): ResolvedLinkedImageFile | null {
    if (!parsed) {
      return null;
    }

    for (const candidate of getParsedLinkResolutionCandidates(parsed)) {
      const resolved = this.app.metadataCache.getFirstLinkpathDest(candidate, sourcePath);
      if (resolved instanceof TFile) {
        return {
          file: resolved,
          matchedTarget: candidate
        };
      }
    }

    return null;
  }

  private getPreservedMarkdownPathPresentation(
    parsed: ReturnType<LinkFormatter['parseLink']>,
    matchedTarget: string
  ): 'encoded' | 'wrapped' | 'plain' | undefined {
    if (parsed?.format !== LinkFormat.MARKDOWN) {
      return undefined;
    }

    if (parsed.markdownPathPresentation === 'wrapped' || parsed.markdownPathPresentation === 'plain') {
      return parsed.markdownPathPresentation;
    }

    if (parsed.markdownPathPresentation === 'encoded' && matchedTarget === parsed.rawPath) {
      return 'plain';
    }

    return parsed.markdownPathPresentation;
  }

  private async refreshOpenLeaves(file: TFile, originalPath: string, targetPath: string): Promise<void> {
    const request: PendingLeafRefresh = {
      file,
      originalPath,
      targetPath
    };
    if (this.deferredLeafRefreshDepth > 0) {
      this.pendingLeafRefreshes.push(request);
      return;
    }

    await this.flushLeafRefreshes([request]);
  }

  private async flushPendingLeafRefreshes(): Promise<void> {
    if (this.pendingLeafRefreshes.length === 0) {
      return;
    }

    const requests = [...this.pendingLeafRefreshes];
    this.pendingLeafRefreshes = [];
    await this.flushLeafRefreshes(requests);
  }

  private async flushLeafRefreshes(requests: readonly PendingLeafRefresh[]): Promise<void> {
    if (requests.length === 0) {
      return;
    }

    const affectedPaths = new Set<string>();
    const filesByPath = new Map<string, TFile>();
    const markdownViews: MarkdownView[] = [];
    const reloadTargets: { leaf: WorkspaceLeaf; file: TFile }[] = [];

    for (const request of requests) {
      affectedPaths.add(request.originalPath);
      affectedPaths.add(request.targetPath);
      filesByPath.set(request.originalPath, request.file);
      filesByPath.set(request.targetPath, request.file);
    }

    this.app.workspace.iterateAllLeaves((leaf: WorkspaceLeaf) => {
      if (leaf.view instanceof MarkdownView && leaf.view.file) {
        markdownViews.push(leaf.view);
        return;
      }

      const path = (leaf.view as { file?: TFile | null }).file?.path;
      if (!path || !affectedPaths.has(path)) {
        return;
      }

      const file = filesByPath.get(path);
      if (file) {
        reloadTargets.push({ leaf, file });
      }
    });

    await Promise.all(markdownViews.map((view) => this.refreshMarkdownLeafIfNeeded(view, affectedPaths)));
    await Promise.all(reloadTargets.map(({ leaf, file }) => this.reloadLeafFile(leaf, file)));
  }

  private async refreshMarkdownLeafIfNeeded(view: MarkdownView, affectedPaths: ReadonlySet<string>): Promise<void> {
    const noteFile = view.file;
    if (!noteFile) {
      return;
    }

    const referencedImages = await this.getImagesInNote(noteFile);
    const matchedPaths = [...new Set(referencedImages.map((image) => image.path).filter((path) => affectedPaths.has(path)))];
    if (matchedPaths.length === 0) {
      return;
    }

    const viewWithContent = view as MarkdownView & { contentEl?: HTMLElement };
    for (const path of matchedPaths) {
      this.refreshImageElements(viewWithContent.contentEl ?? view.containerEl, path);
    }
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
