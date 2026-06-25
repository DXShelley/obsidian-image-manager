import { getNoticeCopy } from '@/i18n';
import { Notice, TFile, normalizePath, type App } from 'obsidian';
import type { FileManager } from '@/services/file-manager';
import type {
  ImageManagerSettings,
  RecoveryEntry,
  RecoveryFileKind,
  RecoveryFileState,
  RecoveryStatus,
  RecoveryTransaction,
  RecoveryTransactionMeta,
  RecoveryTransactionState
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
  private readonly createdFolderPaths = new Set<string>();
  private initialized = false;

  constructor(
    private readonly app: App,
    pluginId: string,
    private readonly fileManager: FileManager,
    private readonly getSettings: () => Pick<ImageManagerSettings, 'uiLanguage'>
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

  hasRedoableTransaction(): boolean {
    return this.findNextRedoableTransaction() !== null;
  }

  async runTransaction<T>(meta: RecoveryTransactionMeta, run: () => Promise<T>): Promise<T> {
    if (this.activeTransaction) {
      return run();
    }

    await this.ensureInitialized();
    await this.discardRedoHistory();
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
    this.createdFolderPaths.clear();

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

  recordCreatedFolder(path: string): void {
    const transaction = this.activeTransaction;
    if (!transaction) {
      return;
    }

    const normalizedPath = normalizePath(path);
    if (this.createdFolderPaths.has(normalizedPath)) {
      return;
    }

    transaction.entries.push({
      kind: 'created-folder',
      path: normalizedPath
    });
    this.createdFolderPaths.add(normalizedPath);
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
      const runWithDeferredLeafRefresh =
        typeof this.fileManager.runWithDeferredLeafRefresh === 'function'
          ? this.fileManager.runWithDeferredLeafRefresh.bind(this.fileManager)
          : async <T>(operation: () => Promise<T>) => operation();
      await runWithDeferredLeafRefresh(async () => {
        if (transaction.beforeState) {
          await this.applyTransactionState(transaction.beforeState);
        } else {
          await this.restoreDeletedFolders(transaction.entries);
          await this.undoRenames(transaction.entries);
          await this.restoreBinarySnapshots(transaction.entries);
          await this.deleteCreatedFiles(transaction.entries);
          await this.restoreTextSnapshots(transaction.entries);
        }
      });

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

  async redoLastUndoneTransaction(): Promise<RecoveryTransaction | null> {
    await this.ensureInitialized();
    if (this.activeTransaction) {
      throw new Error('Cannot redo while a recovery transaction is active');
    }

    const transaction = this.findNextRedoableTransaction();
    if (!transaction) {
      return null;
    }

    transaction.status = 'redoing';
    transaction.errorMessage = undefined;
    await this.saveHistory();

    try {
      const afterState = transaction.afterState;
      if (!afterState) {
        throw new Error('This transaction was recorded before redo support was added');
      }

      const runWithDeferredLeafRefresh =
        typeof this.fileManager.runWithDeferredLeafRefresh === 'function'
          ? this.fileManager.runWithDeferredLeafRefresh.bind(this.fileManager)
          : async <T>(operation: () => Promise<T>) => operation();
      await runWithDeferredLeafRefresh(async () => {
        await this.applyTransactionState(afterState);
      });
      transaction.status = 'committed';
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

    const transaction = this.activeTransaction;
    transaction.afterState = await this.captureAfterState(transaction);
    transaction.beforeState = await this.buildBeforeState(transaction);
    transaction.redoable = status === 'committed';
    transaction.status = status;
    transaction.completedAt = Date.now();
    transaction.errorMessage = errorMessage;
    this.history.push(transaction);
    this.activeTransaction = null;
    this.capturedBinaryPaths.clear();
    this.capturedTextPaths.clear();
    this.createdPaths.clear();
    this.createdFolderPaths.clear();
    await this.saveHistory();
    await this.pruneHistory();
  }

  private async buildBeforeState(transaction: RecoveryTransaction): Promise<RecoveryTransactionState> {
    const files = new Map<string, RecoveryFileState>();
    const folders = new Map<string, boolean>();
    const afterStateByPath = new Map((transaction.afterState?.files ?? []).map((state) => [state.path, state]));

    for (const entry of transaction.entries) {
      switch (entry.kind) {
        case 'binary-snapshot':
          files.set(entry.path, {
            path: entry.path,
            kind: 'binary',
            exists: true,
            snapshotPath: entry.snapshotPath
          });
          break;
        case 'text-snapshot':
          files.set(entry.path, {
            path: entry.path,
            kind: 'text',
            exists: true,
            snapshotPath: entry.snapshotPath
          });
          break;
        case 'created-file':
          if (!files.has(entry.path)) {
            files.set(entry.path, {
              path: entry.path,
              kind: this.inferFileKind(entry.path),
              exists: false
            });
          }
          break;
        case 'rename': {
          if (!files.has(entry.fromPath)) {
            const fallback = afterStateByPath.get(entry.toPath);
            files.set(entry.fromPath, {
              path: entry.fromPath,
              kind: fallback?.kind ?? this.inferFileKind(entry.fromPath),
              exists: true,
              snapshotPath: fallback?.snapshotPath
            });
          }
          if (!files.has(entry.toPath)) {
            files.set(entry.toPath, {
              path: entry.toPath,
              kind: this.inferFileKind(entry.toPath),
              exists: false
            });
          }
          break;
        }
        case 'deleted-folder':
          folders.set(entry.path, true);
          break;
        case 'created-folder':
          folders.set(entry.path, false);
          break;
      }
    }

    return {
      files: [...files.values()],
      folders: [...folders.entries()].map(([path, exists]) => ({ path, exists }))
    };
  }

  private async captureAfterState(transaction: RecoveryTransaction): Promise<RecoveryTransactionState> {
    const trackedPaths = new Set<string>();
    const folderPaths = new Set<string>();

    for (const entry of transaction.entries) {
      switch (entry.kind) {
        case 'binary-snapshot':
        case 'text-snapshot':
        case 'created-file':
          trackedPaths.add(entry.path);
          break;
        case 'rename':
          trackedPaths.add(entry.fromPath);
          trackedPaths.add(entry.toPath);
          break;
        case 'deleted-folder':
        case 'created-folder':
          folderPaths.add(entry.path);
          break;
      }
    }

    const files: RecoveryFileState[] = [];
    for (const path of trackedPaths) {
      const abstract = this.app.vault.getAbstractFileByPath(path);
      if (!(abstract instanceof TFile)) {
        files.push({
          path,
          kind: this.inferFileKind(path),
          exists: false
        });
        continue;
      }

      const kind = this.inferFileKind(path);
      const snapshotPath = await this.captureCurrentFileSnapshot(transaction.id, path, kind, abstract);
      files.push({
        path,
        kind,
        exists: true,
        snapshotPath
      });
    }

    return {
      files,
      folders: [...folderPaths].map((path) => ({
        path,
        exists: this.app.vault.getAbstractFileByPath(path) !== null
      }))
    };
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
        await this.app.fileManager.trashFile(abstract);
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

  private async applyTransactionState(state: RecoveryTransactionState): Promise<void> {
    for (const folder of state.folders.filter((item) => item.exists)) {
      await this.ensureDirectory(folder.path);
    }

    for (const file of state.files.filter((item) => item.exists)) {
      if (!file.snapshotPath) {
        throw new Error(`Missing snapshot for ${file.path}`);
      }

      if (file.kind === 'text') {
        const content = await this.app.vault.adapter.read(file.snapshotPath);
        await this.fileManager.restoreTextFile(file.path, content);
        continue;
      }

      const data = await this.app.vault.adapter.readBinary(file.snapshotPath);
      await this.fileManager.restoreBinaryFile(file.path, data);
    }

    for (const file of [...state.files].reverse().filter((item) => !item.exists)) {
      const abstract = this.app.vault.getAbstractFileByPath(file.path);
      if (abstract instanceof TFile) {
        await this.app.fileManager.trashFile(abstract);
      } else if (await this.app.vault.adapter.exists(file.path)) {
        await this.app.vault.adapter.remove(file.path);
      }
    }

    for (const folder of [...state.folders].reverse().filter((item) => !item.exists)) {
      await this.removeDirectoryIfEmpty(folder.path);
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

  private findNextRedoableTransaction(): RecoveryTransaction | null {
    let boundary = -1;
    for (let index = this.history.length - 1; index >= 0; index -= 1) {
      const transaction = this.history[index];
      if (transaction?.status === 'committed' || transaction?.status === 'failed') {
        boundary = index;
        break;
      }
    }

    for (let index = boundary + 1; index < this.history.length; index += 1) {
      const transaction = this.history[index];
      if (!transaction) {
        continue;
      }
      if (transaction.status !== 'undone') {
        break;
      }
      if (this.isTransactionRedoable(transaction)) {
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
    const referencedSnapshots = this.collectReferencedSnapshots(retained);

    for (const transaction of this.history) {
      if (!removeIds.has(transaction.id)) {
        continue;
      }

      for (const snapshotPath of this.collectTransactionSnapshots(transaction)) {
        if (!referencedSnapshots.has(snapshotPath)) {
          await this.removeIfExists(snapshotPath);
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
      new Notice(getNoticeCopy(this.getSettings().uiLanguage).recoveryHistoryReset);
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

  private async removeDirectoryIfEmpty(path: string): Promise<void> {
    const abstract = this.app.vault.getAbstractFileByPath(path);
    if (abstract === null) {
      if (await this.app.vault.adapter.exists(path)) {
        await this.app.vault.adapter.remove(path);
      }
      return;
    }

    const folder = abstract as { children?: unknown[] };
    if (Array.isArray(folder.children) && folder.children.length > 0) {
      return;
    }

    await this.app.vault.adapter.remove(path).catch(() => undefined);
  }

  private async discardRedoHistory(): Promise<void> {
    const undoneTransactions = this.history.filter((transaction) => transaction.status === 'undone');
    if (undoneTransactions.length === 0) {
      return;
    }

    const referencedSnapshots = this.collectReferencedSnapshots(
      this.history.filter((transaction) => transaction.status !== 'undone')
    );

    for (const transaction of undoneTransactions) {
      for (const snapshotPath of this.collectTransactionSnapshots(transaction)) {
        if (!referencedSnapshots.has(snapshotPath)) {
          await this.removeIfExists(snapshotPath);
        }
      }
    }

    this.history = this.history.filter((transaction) => transaction.status !== 'undone');
    await this.saveHistory();
  }

  private async captureCurrentFileSnapshot(
    transactionId: string,
    path: string,
    kind: RecoveryFileKind,
    file: TFile
  ): Promise<string> {
    if (kind === 'text') {
      const content = await this.app.vault.read(file);
      return this.writeTextSnapshot(`${transactionId}-after`, path, content);
    }

    const data = await this.app.vault.readBinary(file);
    return this.writeBinarySnapshot(`${transactionId}-after`, path, data);
  }

  private inferFileKind(path: string): RecoveryFileKind {
    return path.toLowerCase().endsWith('.md') ? 'text' : 'binary';
  }

  private isTransactionRedoable(transaction: RecoveryTransaction): boolean {
    return transaction.redoable ?? transaction.status === 'committed';
  }

  private collectReferencedSnapshots(transactions: readonly RecoveryTransaction[]): Set<string> {
    const snapshots = new Set<string>();
    for (const transaction of transactions) {
      for (const snapshotPath of this.collectTransactionSnapshots(transaction)) {
        snapshots.add(snapshotPath);
      }
    }
    return snapshots;
  }

  private collectTransactionSnapshots(transaction: RecoveryTransaction): string[] {
    const snapshots = new Set<string>();
    for (const entry of transaction.entries) {
      if ('snapshotPath' in entry) {
        snapshots.add(entry.snapshotPath);
      }
    }
    for (const state of [transaction.beforeState, transaction.afterState]) {
      for (const file of state?.files ?? []) {
        if (file.snapshotPath) {
          snapshots.add(file.snapshotPath);
        }
      }
    }
    return [...snapshots];
  }

  private createTransactionId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  private slugPath(path: string): string {
    return path.replace(/[\\/]/g, '_').replace(/[^a-zA-Z0-9._-]/g, '-');
  }
}
