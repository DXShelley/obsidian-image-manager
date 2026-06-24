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

export type RecoveryStatus = 'recording' | 'committed' | 'failed' | 'undoing' | 'redoing' | 'undone';

export type RecoveryFileKind = 'binary' | 'text';

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

export interface CreatedFolderEntry {
  readonly kind: 'created-folder';
  readonly path: string;
}

export interface RecoveryFileState {
  readonly path: string;
  readonly kind: RecoveryFileKind;
  readonly exists: boolean;
  readonly snapshotPath?: string;
}

export interface RecoveryFolderState {
  readonly path: string;
  readonly exists: boolean;
}

export interface RecoveryTransactionState {
  readonly files: RecoveryFileState[];
  readonly folders: RecoveryFolderState[];
}

export type RecoveryEntry =
  | BinarySnapshotEntry
  | TextSnapshotEntry
  | CreatedFileEntry
  | RenameEntry
  | DeletedFolderEntry
  | CreatedFolderEntry;

export interface RecoveryTransaction extends RecoveryTransactionMeta {
  readonly id: string;
  status: RecoveryStatus;
  readonly createdAt: number;
  completedAt?: number;
  readonly entries: RecoveryEntry[];
  beforeState?: RecoveryTransactionState;
  afterState?: RecoveryTransactionState;
  errorMessage?: string;
  redoable?: boolean;
}
