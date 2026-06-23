export type RecoveryTrigger =
  | 'compress'
  | 'convert'
  | 'resize'
  | 'rotate'
  | 'flip'
  | 'rename'
  | 'move'
  | 'rewrite-links'
  | 'paste-import'
  | 'note-rename-sync'
  | 'settings-rewrite'
  | 'batch'
  | 'context-menu';

export type RecoveryScope = 'single-file' | 'single-note' | 'folder' | 'vault' | 'auto';

export type RecoveryStatus = 'recording' | 'committed' | 'failed' | 'undoing' | 'undone';

export interface RecoveryTransactionMeta {
  readonly label: string;
  readonly trigger: RecoveryTrigger;
  readonly scope: RecoveryScope;
}

export interface BinarySnapshotEntry {
  readonly kind: 'binary-snapshot';
  readonly path: string;
  readonly snapshotPath: string;
}

export interface TextSnapshotEntry {
  readonly kind: 'text-snapshot';
  readonly path: string;
  readonly snapshotPath: string;
}

export interface CreatedFileEntry {
  readonly kind: 'created-file';
  readonly path: string;
}

export interface RenameEntry {
  readonly kind: 'rename';
  readonly fromPath: string;
  readonly toPath: string;
}

export interface DeletedFolderEntry {
  readonly kind: 'deleted-folder';
  readonly path: string;
}

export type RecoveryEntry =
  | BinarySnapshotEntry
  | TextSnapshotEntry
  | CreatedFileEntry
  | RenameEntry
  | DeletedFolderEntry;

export interface RecoveryTransaction extends RecoveryTransactionMeta {
  readonly id: string;
  status: RecoveryStatus;
  readonly createdAt: number;
  completedAt?: number;
  readonly entries: RecoveryEntry[];
  errorMessage?: string;
}
