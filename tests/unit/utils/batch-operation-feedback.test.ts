import { describe, expect, it } from 'vitest';
import {
  formatBatchCompressionNotice,
  formatBatchConversionNotice,
  formatBatchExternalImageImportNotice,
  formatBatchLinkRewriteNotice,
  formatBatchOrphanCleanupNotice
} from '@/utils/batch-operation-feedback';

describe('batch operation feedback utilities', () => {
  it('formats batch compression notices with aggregate size deltas', () => {
    expect(
      formatBatchCompressionNotice({
        fileCount: 3,
        beforeBytes: 4096,
        afterBytes: 2048,
        showSpaceSaved: true,
        language: 'en'
      })
    ).toBe('Batch compression finished: 3 image(s), 4.0 KB -> 2.0 KB (50.0% reduction)');
  });

  it('formats batch conversion notices with the target format', () => {
    expect(
      formatBatchConversionNotice({
        imageCount: 5,
        targetFormat: 'webp',
        language: 'en'
      })
    ).toBe('Batch conversion finished: 5 image(s) -> webp');
  });

  it('formats external image import notices with file-level link counts', () => {
    expect(
      formatBatchExternalImageImportNotice({
        items: [
          { notePath: 'notes/a.md', replaced: 2 },
          { notePath: 'notes/b.md', replaced: 1 }
        ],
        importedLinks: 3,
        downloadedImages: 2,
        failedCount: 0,
        language: 'en'
      })
    ).toBe('External image import finished: 2 file(s), 3 link(s) updated: notes/a.md (2 links), notes/b.md (1 link); downloaded 2 image(s)');
  });

  it('formats batch link rewrite notices with file-level link counts', () => {
    expect(
      formatBatchLinkRewriteNotice({
        items: [
          { notePath: 'notes/a.md', replaced: 2 },
          { notePath: 'notes/b.md', replaced: 1 }
        ],
        rewrittenLinks: 3,
        movedImages: 1,
        downloadedImages: 0,
        deletedImages: 0,
        deletedFolders: 0,
        failedCount: 0,
        language: 'en'
      })
    ).toBe('Batch link update finished: 2 file(s), 3 link(s) updated: notes/a.md (2 links), notes/b.md (1 link); moved 1 image(s)');
  });

  it('formats orphan cleanup notices with deleted images and empty folders', () => {
    expect(
      formatBatchOrphanCleanupNotice({
        deletedImages: 2,
        deletedFolders: 1,
        relocatedImages: 0,
        preservedImages: 0,
        failedCount: 0,
        language: 'en'
      })
    ).toBe('Extra image cleanup finished: removed 2 image(s); removed 1 empty folder(s)');
  });

  it('formats orphan cleanup notices with moved and preserved images', () => {
    expect(
      formatBatchOrphanCleanupNotice({
        deletedImages: 0,
        deletedFolders: 0,
        relocatedImages: 1,
        preservedImages: 2,
        failedCount: 0,
        language: 'en'
      })
    ).toBe(
      'Extra image cleanup finished: moved 1 image(s) to referenced note folder(s); kept 2 image(s) still referenced by other notes'
    );
  });
});
