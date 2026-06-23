import { normalizePath, TFile, TFolder, type App } from 'obsidian';
import type { ImageFormat, ImageManagerSettings, RenameMoveResult } from '@/types/index';
import type { VariableResolver } from '@/services/variable-resolver';
import { extractImageLinks } from '@/utils/image-links';

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'tif', 'tiff', 'heic']);

export class FileManager {
  constructor(
    private readonly app: App,
    private readonly settings: ImageManagerSettings,
    private readonly variableResolver: VariableResolver
  ) {}

  isImageFile(file: TFile): boolean {
    return IMAGE_EXTENSIONS.has(file.extension.toLowerCase());
  }

  async saveImage(data: ArrayBuffer | Blob, originalName: string, noteFile: TFile, extensionOverride?: ImageFormat): Promise<TFile> {
    const buffer = data instanceof Blob ? await data.arrayBuffer() : data;
    const folder = await this.ensureOutputFolder(noteFile);
    const fileName = this.generateFileName(originalName, noteFile, extensionOverride);
    const path = await this.nextAvailablePath(normalizePath(`${folder}/${fileName}`));
    return this.app.vault.createBinary(path, buffer);
  }

  async renameImage(file: TFile, noteFile: TFile, newName?: string): Promise<RenameMoveResult> {
    const oldPath = file.path;
    const targetName = newName ?? this.generateFileName(file.name, noteFile);
    const folder = file.parent?.path ?? '';
    const newPath = await this.nextAvailablePath(normalizePath(`${folder}/${targetName}`));
    await this.app.fileManager.renameFile(file, newPath);
    await this.updateLinks(noteFile, oldPath, newPath);
    return { oldPath, newPath };
  }

  async moveImage(file: TFile, targetFolder: string, noteFile?: TFile): Promise<RenameMoveResult> {
    const oldPath = file.path;
    await this.ensureFolder(targetFolder);
    const newPath = await this.nextAvailablePath(normalizePath(`${targetFolder}/${file.name}`));
    await this.app.fileManager.renameFile(file, newPath);
    if (noteFile) {
      await this.updateLinks(noteFile, oldPath, newPath);
    }
    return { oldPath, newPath };
  }

  async getImagesInNote(noteFile: TFile): Promise<TFile[]> {
    const content = await this.app.vault.read(noteFile);
    const links = extractImageLinks(content);
    const files: TFile[] = [];
    for (const link of links) {
      const file = this.app.metadataCache.getFirstLinkpathDest(link, noteFile.path);
      if (file instanceof TFile && this.isImageFile(file)) {
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

  generateFileName(originalName: string, noteFile: TFile, extensionOverride?: ImageFormat): string {
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    const extension = extensionOverride ?? originalName.split('.').pop() ?? this.settings.defaultFormat;
    const context = this.variableResolver.createContext(noteFile.basename, baseName);
    const resolved = this.variableResolver.resolve(this.settings.renamePattern, context) || baseName;
    return `${resolved}.${extension}`;
  }

  private async updateLinks(noteFile: TFile, oldPath: string, newPath: string): Promise<void> {
    const content = await this.app.vault.read(noteFile);
    const oldName = oldPath.split('/').pop() ?? oldPath;
    const newName = newPath.split('/').pop() ?? newPath;
    const escapedOldName = this.escapeRegExp(oldName);
    const escapedOldPath = this.escapeRegExp(oldPath);

    const updated = content
      .replace(new RegExp(`!\\[\\[${escapedOldName}([^\\]]*)\\]\\]`, 'g'), `![[${newName}$1]]`)
      .replace(new RegExp(`!\\[\\[${escapedOldPath}([^\\]]*)\\]\\]`, 'g'), `![[${newPath}$1]]`)
      .replace(new RegExp(`(!\\[[^\\]]*]\\()${escapedOldPath}(\\))`, 'g'), `$1${newPath}$2`)
      .replace(new RegExp(`(!\\[[^\\]]*]\\()${escapedOldName}(\\))`, 'g'), `$1${newName}$2`);

    if (updated !== content) {
      await this.app.vault.modify(noteFile, updated);
    }
  }

  private async ensureOutputFolder(noteFile: TFile): Promise<string> {
    const folder = this.settings.outputFolder.trim() || noteFile.parent?.path || '';
    if (folder) {
      await this.ensureFolder(folder);
    }
    return folder;
  }

  private async ensureFolder(folderPath: string): Promise<void> {
    const normalized = normalizePath(folderPath);
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

  private async nextAvailablePath(path: string): Promise<string> {
    if (!this.app.vault.getAbstractFileByPath(path)) {
      return path;
    }

    const extensionIndex = path.lastIndexOf('.');
    const base = extensionIndex >= 0 ? path.slice(0, extensionIndex) : path;
    const extension = extensionIndex >= 0 ? path.slice(extensionIndex) : '';
    let counter = 1;
    let candidate = `${base}-${counter}${extension}`;
    while (this.app.vault.getAbstractFileByPath(candidate)) {
      counter += 1;
      candidate = `${base}-${counter}${extension}`;
    }
    return candidate;
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
