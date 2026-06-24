import { TFile, normalizePath, type App } from 'obsidian';

export type CompressionRecordStatus = 'compressed' | 'not-beneficial';

interface CompressionRecord {
  readonly path: string;
  readonly size: number;
  readonly mtime: number;
  readonly status: CompressionRecordStatus;
  readonly updatedAt: number;
}

interface CompressionState {
  readonly records: CompressionRecord[];
}

const HISTORY_FILE_NAME = 'compression-history.json';

export class CompressionTracker {
  private readonly rootPath: string;
  private readonly historyPath: string;
  private readonly records = new Map<string, CompressionRecord>();
  private initialized = false;

  constructor(
    private readonly app: App,
    pluginId: string
  ) {
    this.rootPath = normalizePath(`${this.app.vault.configDir}/plugins/${pluginId}`);
    this.historyPath = normalizePath(`${this.rootPath}/${HISTORY_FILE_NAME}`);
  }

  async initialize(): Promise<void> {
    await this.ensureDirectory(this.rootPath);
    await this.loadHistory();
    await this.pruneMissingRecords();
    this.initialized = true;
  }

  async getCurrentStatus(file: TFile): Promise<CompressionRecordStatus | null> {
    await this.ensureInitialized();
    const path = normalizePath(file.path);
    const record = this.records.get(path);
    if (!record) {
      return null;
    }

    if (record.size === file.stat.size && record.mtime === file.stat.mtime) {
      return record.status;
    }

    this.records.delete(path);
    await this.saveHistory();
    return null;
  }

  async markCompressed(path: string, size: number, mtime: number): Promise<void> {
    await this.mark(path, size, mtime, 'compressed');
  }

  async markNotBeneficial(file: TFile): Promise<void> {
    await this.mark(file.path, file.stat.size, file.stat.mtime, 'not-beneficial');
  }

  private async mark(path: string, size: number, mtime: number, status: CompressionRecordStatus): Promise<void> {
    await this.ensureInitialized();
    this.records.set(normalizePath(path), {
      path: normalizePath(path),
      size,
      mtime,
      status,
      updatedAt: Date.now()
    });
    await this.saveHistory();
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await this.initialize();
  }

  private async loadHistory(): Promise<void> {
    this.records.clear();
    if (!(await this.app.vault.adapter.exists(this.historyPath))) {
      return;
    }

    try {
      const raw = await this.app.vault.adapter.read(this.historyPath);
      const parsed = JSON.parse(raw) as CompressionState;
      for (const record of parsed.records ?? []) {
        if (!this.isValidRecord(record)) {
          continue;
        }
        this.records.set(record.path, record);
      }
    } catch {
      this.records.clear();
    }
  }

  private async saveHistory(): Promise<void> {
    const state: CompressionState = {
      records: [...this.records.values()].sort((left, right) => left.path.localeCompare(right.path))
    };
    await this.ensureDirectory(this.rootPath);
    await this.app.vault.adapter.write(this.historyPath, JSON.stringify(state, null, 2));
  }

  private async pruneMissingRecords(): Promise<void> {
    let changed = false;
    for (const [path] of this.records) {
      const existing = this.app.vault.getAbstractFileByPath(path);
      if (existing instanceof TFile) {
        continue;
      }

      this.records.delete(path);
      changed = true;
    }

    if (changed) {
      await this.saveHistory();
    }
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

  private isValidRecord(value: unknown): value is CompressionRecord {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const candidate = value as Partial<CompressionRecord>;
    return (
      typeof candidate.path === 'string' &&
      typeof candidate.size === 'number' &&
      typeof candidate.mtime === 'number' &&
      (candidate.status === 'compressed' || candidate.status === 'not-beneficial') &&
      typeof candidate.updatedAt === 'number'
    );
  }
}
