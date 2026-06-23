import type { EventBus } from '@/core/events/event-bus';
import {
  BatchExecutionStatus,
  type BatchOperation,
  type BatchReport,
  type BatchRequest,
  type BatchScope,
  type ImageManagerEventMap
} from '@/types/index';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export class BatchProcessor {
  private currentReport: BatchReport | null = null;
  private resumeSignal: Promise<void> | null = null;
  private resolveResumeSignal: (() => void) | null = null;

  constructor(private readonly eventBus: EventBus<ImageManagerEventMap>) {}

  getReport(): BatchReport | null {
    return this.currentReport ? { ...this.currentReport, errors: [...this.currentReport.errors] } : null;
  }

  isRunning(): boolean {
    return this.currentReport?.status === BatchExecutionStatus.RUNNING;
  }

  pause(): void {
    if (this.currentReport?.status !== BatchExecutionStatus.RUNNING) {
      return;
    }

    this.currentReport.status = BatchExecutionStatus.PAUSED;
    this.resumeSignal ??= new Promise((resolve) => {
      this.resolveResumeSignal = resolve;
    });
    this.eventBus.emit('batch:state-changed', this.getReportOrThrow());
  }

  resume(): void {
    if (this.currentReport?.status !== BatchExecutionStatus.PAUSED) {
      return;
    }

    this.currentReport.status = BatchExecutionStatus.RUNNING;
    this.resolveResumeSignal?.();
    this.resumeSignal = null;
    this.resolveResumeSignal = null;
    this.eventBus.emit('batch:state-changed', this.getReportOrThrow());
  }

  cancel(): void {
    if (!this.currentReport || !this.isInterruptible(this.currentReport.status)) {
      return;
    }

    this.currentReport.status = BatchExecutionStatus.CANCELLED;
    this.resolveResumeSignal?.();
    this.resumeSignal = null;
    this.resolveResumeSignal = null;
    this.eventBus.emit('batch:state-changed', this.getReportOrThrow());
  }

  async run(request: BatchRequest): Promise<BatchReport> {
    if (this.currentReport && this.isInterruptible(this.currentReport.status)) {
      throw new Error('A batch job is already active');
    }

    this.currentReport = {
      id: request.id,
      scope: request.scope,
      operation: request.operation,
      total: request.tasks.length,
      completed: 0,
      failed: 0,
      skipped: 0,
      status: BatchExecutionStatus.RUNNING,
      errors: [],
      startedAt: Date.now()
    };
    this.eventBus.emit('batch:state-changed', this.getReportOrThrow());

    for (const task of request.tasks) {
      await this.awaitResumeIfNeeded();
      if (!this.currentReport || this.currentReport.status === BatchExecutionStatus.CANCELLED) {
        break;
      }

      try {
        await task.run();
        this.currentReport.completed += 1;
      } catch (error) {
        this.currentReport.failed += 1;
        this.currentReport.errors.push(`${task.label}: ${error instanceof Error ? error.message : String(error)}`);
      }

      this.eventBus.emit('batch:progress', this.getReportOrThrow());
      await delay(0);
    }

    const report = this.finalizeReport(request.scope, request.operation);
    this.eventBus.emit('batch:completed', report);
    return report;
  }

  private finalizeReport(scope: BatchScope, operation: BatchOperation): BatchReport {
    const base = this.currentReport ?? {
      id: `${scope}-${operation}-${Date.now()}`,
      scope,
      operation,
      total: 0,
      completed: 0,
      failed: 0,
      skipped: 0,
      status: BatchExecutionStatus.COMPLETED,
      errors: [],
      startedAt: Date.now()
    };

    const status =
      base.status === BatchExecutionStatus.CANCELLED
        ? BatchExecutionStatus.CANCELLED
        : base.failed > 0
          ? BatchExecutionStatus.COMPLETED_WITH_ERRORS
          : BatchExecutionStatus.COMPLETED;

    const report: BatchReport = {
      ...base,
      status,
      endedAt: Date.now()
    };

    this.currentReport = report;
    this.eventBus.emit('batch:state-changed', report);
    return { ...report, errors: [...report.errors] };
  }

  private async awaitResumeIfNeeded(): Promise<void> {
    if (this.currentReport?.status !== BatchExecutionStatus.PAUSED || !this.resumeSignal) {
      return;
    }

    await this.resumeSignal;
  }

  private getReportOrThrow(): BatchReport {
    if (!this.currentReport) {
      throw new Error('No active batch report');
    }

    return { ...this.currentReport, errors: [...this.currentReport.errors] };
  }

  private isInterruptible(status: BatchExecutionStatus): boolean {
    return status === BatchExecutionStatus.RUNNING || status === BatchExecutionStatus.PAUSED;
  }
}
