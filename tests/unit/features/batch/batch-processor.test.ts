import { describe, expect, it } from 'vitest';
import { EventBus } from '@/core/events/event-bus';
import { BatchProcessor } from '@/features/batch/batch-processor';
import { BatchExecutionStatus, BatchOperation, BatchScope, type ImageManagerEventMap } from '@/types/index';

describe('BatchProcessor', () => {
  it('completes successful tasks and emits completion state', async () => {
    const eventBus = new EventBus<ImageManagerEventMap>();
    const processor = new BatchProcessor(eventBus);
    const states: string[] = [];
    eventBus.on('batch:state-changed', (report) => {
      states.push(report.status);
    });

    const report = await processor.run({
      id: 'job-1',
      scope: BatchScope.CURRENT_NOTE,
      operation: BatchOperation.COMPRESS,
      tasks: [
        { id: 'a', label: 'a', run: async () => undefined },
        { id: 'b', label: 'b', run: async () => undefined }
      ]
    });

    expect(report.completed).toBe(2);
    expect(report.failed).toBe(0);
    expect(report.status).toBe(BatchExecutionStatus.COMPLETED);
    expect(states).toContain(BatchExecutionStatus.RUNNING);
    expect(states).toContain(BatchExecutionStatus.COMPLETED);
  });

  it('tracks failures without aborting the whole run', async () => {
    const processor = new BatchProcessor(new EventBus<ImageManagerEventMap>());

    const report = await processor.run({
      id: 'job-2',
      scope: BatchScope.VAULT,
      operation: BatchOperation.COMPRESS,
      tasks: [
        { id: 'ok', label: 'ok', run: async () => undefined },
        { id: 'bad', label: 'bad', run: async () => { throw new Error('boom'); } }
      ]
    });

    expect(report.completed).toBe(1);
    expect(report.failed).toBe(1);
    expect(report.status).toBe(BatchExecutionStatus.COMPLETED_WITH_ERRORS);
    expect(report.errors[0]).toContain('boom');
  });
});
