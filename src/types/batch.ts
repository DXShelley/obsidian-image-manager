export enum BatchScope {
  CURRENT_NOTE = 'current-note',
  FOLDER = 'folder',
  VAULT = 'vault'
}

export enum BatchOperation {
  COMPRESS = 'compress',
  CONVERT = 'convert',
  RENAME = 'rename',
  UPDATE_LINKS = 'update-links'
}

export enum BatchExecutionStatus {
  RUNNING = 'running',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  COMPLETED_WITH_ERRORS = 'completed-with-errors'
}

export interface BatchTask {
  readonly id: string;
  readonly label: string;
  readonly run: () => Promise<void>;
}

export interface BatchRequest {
  readonly id: string;
  readonly scope: BatchScope;
  readonly operation: BatchOperation;
  readonly tasks: BatchTask[];
}

export interface BatchReport {
  readonly id: string;
  readonly scope: BatchScope;
  readonly operation: BatchOperation;
  readonly total: number;
  completed: number;
  failed: number;
  skipped: number;
  status: BatchExecutionStatus;
  readonly errors: string[];
  readonly startedAt: number;
  readonly endedAt?: number;
}
