import { Notice, TFile, normalizePath, type App } from 'obsidian';
import type { FileManager } from '@/services/file-manager';
import type {
  RecoveryEntry,
  RecoveryStatus,
  RecoveryTransaction,
  RecoveryTransactionMeta
} from '@/types/index';

interface RecoveryState {
  readonly transactions: RecoveryTransaction[];
}

const HISTORY_FILE_NAME = 'history.json';
const MAX_RECOVERY_TRANSACTIONS = 10;
const MAX_RECOVERY_AGE_MS = 24 * 60 * 60 * 1000;

export class RecoveryManager {
  private readonly historyPath: string;
  private readonly snapshotsPath: string;
  private readonly rootPath: string;
  private history: RecoveryTransaction[] = [];
  private activeTransaction: RecoveryTransaction | null = null;
  private readonly capturedBinaryPaths = new Set<string>();
  private readonly capturedTextPaths = new Set<string>();
  private readonly createdPaths = new Set<string>();
  private initialized = false;

  constructor(
    private readonly app: App,
    pluginId: string,
    private readonly fileManager: FileManager
  ) {
    this.rootPath = normalizePath(`${this.app.vault.configDir}/plugins/${pluginId}/recovery`);
    this.historyPath = normalizePath(`${this.rootPath}/${HISTORY_FILE_NAME}`);
    this.snapshotsPath = normalizePath(`${this.rootPath}/snapshots`);
  }

  async initialize(): Promise<void> {
    await this.ensureDirectory(this.rootPath);
    await this.ensureDirectory(this.snapshotsPath);
    this.history = await this.loadHistory();
    await this.pruneHistory();
    this.initialized = true;
  }

  listTransactions(): RecoveryTransaction[] {
    return this.history.map((transaction) => ({
      ...transaction,
      entries: [...transaction.entries]
    }));
  }

  hasUndoableTransaction(): boolean {
    return this.findLastUndoableTransaction() !== null;
  }

  async runTransaction<T>(meta: RecoveryTransactionMeta, run: () => Promise<T>): Promise<T> {
    if (this.activeTransaction) {
      return run();
    }

    await this.ensureInitialized();
    const transaction: RecoveryTransaction = {
      id: this.createTransactionId(),
      ...meta,
      status: 'recording',
      createdAt: Date.now(),
      entries: []
    };
    this.activeTransaction = transaction;
    this.capturedBinaryPaths.clear();
    this.capturedTextPaths.clear();
    this.createdPaths.clear();

    try {
      const result = await run();
      await this.finishActiveTransaction('committed');
      return result;
    } catch (error) {
      await this.finishActiveTransaction(
        'failed',
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  }

  async captureBinarySnapshot(file: TFile): Promise<void> {
    const transaction = this.activeTransaction;
    if (!transaction) {
      return;
    }

    const normalizedPath = normalizePath(file.path);
    if (this.capturedBinaryPaths.has(normalizedPath)) {
      return;
    }

    const data = await this.app.vault.readBinary(file);
    const snapshotPath = await this.writeBinarySnapshot(transaction.id, normalizedPath, data);
    transaction.entries.push({
      kind: 'binary-snapshot',
      path: normalizedPath,
      snapshotPath
    });
    this.capturedBinaryPaths.add(normalizedPath);
  }

  async captureTextSnapshot(path: string, content?: string): Promise<void> {
    const transaction = this.activeTransaction;
    if (!transaction) {
      return;
    }

    const normalizedPath = normalizePath(path);
    if (this.capturedTextPaths.has(normalizedPath)) {
      return;
    }

    const text = content ?? (await this.app.vault.adapter.read(normalizedPath));
    const snapshotPath = await this.writeTextSnapshot(transaction.id, normalizedPath, text);
    transaction.entries.push({
      kind: 'text-snapshot',
      path: normalizedPath,
      snapshotPath
    });
    this.capturedTextPaths.add(normalizedPath);
  }

  recordCreatedFile(path: string): void {
    const transaction = this.activeTransaction;
    if (!transaction) {
      return;
    }

    const normalizedPath = normalizePath(path);
    if (this.createdPaths.has(normalizedPath)) {
      return;
    }

    transaction.entries.push({
      kind: 'created-file',
      path: normalizedPath
    });
    this.createdPaths.add(normalizedPath);
  }

  recordRename(fromPath: string, toPath: string): void {
    const transaction = this.activeTransaction;
    const normalizedFrom = normalizePath(fromPath);
    const normalizedTo = normalizePath(toPath);
    if (!transaction || normalizedFrom === normalizedTo) {
      return;
    }

    transaction.entries.push({
      kind: 'rename',
      fromPath: normalizedFrom,
      toPath: normalizedTo
    });
  }

  recordDeletedFolder(path: string): void {
    const transaction = this.activeTransaction;
    if (!transaction) {
      return;
    }

    transaction.entries.push({
      kind: 'deleted-folder',
      path: normalizePath(path)
    });
  }

  async undoLastTransaction(): Promise<RecoveryTransaction | null> {
    await this.ensureInitialized();
    if (this.activeTransaction) {
      throw new Error('Cannot undo while a recovery transaction is active');
    }

    const transaction = this.findLastUndoableTransaction();
    if (!transaction) {
      return null;
    }

    transaction.status = 'undoing';
    transaction.errorMessage = undefined;
    await this.saveHistory();

    try {
      await this.restoreDeletedFolders(transaction.entries);
      await this.undoRenames(transaction.entries);
      await this.restoreBinarySnapshots(transaction.entries);
      await this.deleteCreatedFiles(transaction.entries);
      await this.restoreTextSnapshots(transaction.entries);
      transaction.status = 'undone';
      transaction.completedAt = Date.now();
      await this.saveHistory();
      return {
        ...transaction,
        entries: [...transaction.entries]
      };
    } catch (error) {
      transaction.status = 'failed';
      transaction.errorMessage = error instanceof Error ? error.message : String(error);
      await this.saveHistory();
      throw error;
    }
  }

  private async finishActiveTransaction(status: RecoveryStatus, errorMessage?: string): Promise<void> {
    if (!this.activeTransaction) {
      return;
    }

    this.activeTransaction.status = status;
    this.activeTransaction.completedAt = Date.now();
    this.activeTransaction.errorMessage = errorMessage;
    this.history.push(this.activeTransaction);
    this.activeTransaction = null;
    this.capturedBinaryPaths.clear();
    this.capturedTextPaths.clear();
    this.createdPaths.clear();
    await this.saveHistory();
    await this.pruneHistory();
  }

  private async restoreDeletedFolders(entries: readonly RecoveryEntry[]): Promise<void> {
    for (const entry of entries) {
      if (entry.kind !== 'deleted-folder') {
        continue;
      }

      await this.ensureDirectory(entry.path);
    }
  }

  private async undoRenames(entries: readonly RecoveryEntry[]): Promise<void> {
    for (const entry of [...entries].reverse()) {
      if (entry.kind !== 'rename') {
        continue;
      }

      const source = this.app.vault.getAbstractFileByPath(entry.toPath);
      const target = this.app.vault.getAbstractFileByPath(entry.fromPath);
      if (source === null) {
        continue;
      }
      if (target !== null) {
        throw new Error(`Cannot restore ${entry.fromPath} because the path already exists`);
      }
      await this.ensureParentDirectory(entry.fromPath);
      await this.app.fileManager.renameFile(source, entry.fromPath);
    }
  }

  private async restoreBinarySnapshots(entries: readonly RecoveryEntry[]): Promise<void> {
    for (const entry of entries) {
      if (entry.kind !== 'binary-snapshot') {
        continue;
      }

      const data = await this.app.vault.adapter.readBinary(entry.snapshotPath);
      await this.fileManager.restoreBinaryFile(entry.path, data);
    }
  }

  private async deleteCreatedFiles(entries: readonly RecoveryEntry[]): Promise<void> {
    for (const entry of [...entries].reverse()) {
      if (entry.kind !== 'created-file') {
        continue;
      }

      const abstract = this.app.vault.getAbstractFileByPath(entry.path);
      if (abstract instanceof TFile) {
        await this.app.vault.delete(abstract, true);
      } else if (await this.app.vault.adapter.exists(entry.path)) {
        await this.app.vault.adapter.remove(entry.path);
      }
    }
  }

  private async restoreTextSnapshots(entries: readonly RecoveryEntry[]): Promise<void> {
    for (const entry of entries) {
      if (entry.kind !== 'text-snapshot') {
        continue;
      }

      const content = await this.app.vault.adapter.read(entry.snapshotPath);
      await this.fileManager.restoreTextFile(entry.path, content);
    }
  }

  private findLastUndoableTransaction(): RecoveryTransaction | null {
    for (let index = this.history.length - 1; index >= 0; index -= 1) {
      const transaction = this.history[index];
      if (!transaction) {
        continue;
      }
      if (transaction.status === 'committed' || transaction.status === 'failed') {
        return transaction;
      }
    }
    return null;
  }

  private async pruneHistory(): Promise<void> {
    const cutoff = Date.now() - MAX_RECOVERY_AGE_MS;
    const sorted = [...this.history].sort((left, right) => left.createdAt - right.createdAt);
    const removeIds = new Set<string>();

    while (sorted.length > MAX_RECOVERY_TRANSACTIONS) {
      const oldest = sorted.shift();
      if (oldest) {
        removeIds.add(oldest.id);
      }
    }

    for (const transaction of sorted) {
      if (transaction.createdAt < cutoff) {
        removeIds.add(transaction.id);
      }
    }

    if (removeIds.size === 0) {
      return;
    }

    const retained = this.history.filter((transaction) => !removeIds.has(transaction.id));
    const referencedSnapshots = new Set(
      retained.flatMap((transaction) =>
        transaction.entries
          .filter((entry): entry is Extract<RecoveryEntry, { snapshotPath: string }> => 'snapshotPath' in entry)
          .map((entry) => entry.snapshotPath)
      )
    );

    for (const transaction of this.history) {
      if (!removeIds.has(transaction.id)) {
        continue;
      }

      for (const entry of transaction.entries) {
        if ('snapshotPath' in entry && !referencedSnapshots.has(entry.snapshotPath)) {
          await this.removeIfExists(entry.snapshotPath);
        }
      }
    }

    this.history = retained;
    await this.saveHistory();
  }

  private async loadHistory(): Promise<RecoveryTransaction[]> {
    if (!(await this.app.vault.adapter.exists(this.historyPath))) {
      return [];
    }

    try {
      const raw = await this.app.vault.adapter.read(this.historyPath);
      const parsed = JSON.parse(raw) as RecoveryState;
      return Array.isArray(parsed.transactions) ? parsed.transactions : [];
    } catch {
      new Notice('Image Manager recovery history is unreadable and has been reset');
      return [];
    }
  }

  private async saveHistory(): Promise<void> {
    const state: RecoveryState = {
      transactions: this.history
    };
    await this.ensureDirectory(this.rootPath);
    await this.app.vault.adapter.write(this.historyPath, JSON.stringify(state, null, 2));
  }

  private async writeBinarySnapshot(transactionId: string, originalPath: string, data: ArrayBuffer): Promise<string> {
    const snapshotPath = normalizePath(`${this.snapshotsPath}/${transactionId}-${this.slugPath(originalPath)}.bin`);
    await this.app.vault.adapter.writeBinary(snapshotPath, data);
    return snapshotPath;
  }

  private async writeTextSnapshot(transactionId: string, originalPath: string, content: string): Promise<string> {
    const snapshotPath = normalizePath(`${this.snapshotsPath}/${transactionId}-${this.slugPath(originalPath)}.txt`);
    await this.app.vault.adapter.write(snapshotPath, content);
    return snapshotPath;
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await this.initialize();
  }

  private async ensureDirectory(path: string): Promise<void> {
    const normalizedPath = normalizePath(path);
    if (!normalizedPath || (await this.app.vault.adapter.exists(normalizedPath))) {
      return;
    }

    const segments = normalizedPath.split('/');
    let current = '';
    for (const segment of segments) {
      current = current ? `${current}/${segment}` : segment;
      if (!(await this.app.vault.adapter.exists(current))) {
        await this.app.vault.adapter.mkdir(current);
      }
    }
  }

  private async ensureParentDirectory(path: string): Promise<void> {
    const lastSlash = path.lastIndexOf('/');
    if (lastSlash < 0) {
      return;
    }

    await this.ensureDirectory(path.slice(0, lastSlash));
  }

  private async removeIfExists(path: string): Promise<void> {
    if (await this.app.vault.adapter.exists(path)) {
      await this.app.vault.adapter.remove(path);
    }
  }

  private createTransactionId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  private slugPath(path: string): string {
    return path.replace(/[\\/]/g, '_').replace(/[^a-zA-Z0-9._-]/g, '-');
  }
}
