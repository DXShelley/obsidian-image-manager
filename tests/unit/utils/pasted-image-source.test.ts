import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { pathToFileURL } from 'url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseTextImageSources, resolveTextImageSource } from '@/utils/pasted-image-source';

describe('parseTextImageSources', () => {
  it('parses supported remote, file, and base64 image sources', () => {
    const fileUrl = pathToFileURL('/tmp/example.png').toString();
    const sources = parseTextImageSources(
      [
        'https://example.com/assets/photo.webp',
        fileUrl,
        'data:image/png;base64,aGVsbG8='
      ].join('\n')
    );

    expect(sources).toEqual([
      {
        kind: 'remote',
        value: 'https://example.com/assets/photo.webp',
        originalName: 'photo.webp'
      },
      {
        kind: 'file',
        value: fileUrl,
        originalName: 'example.png'
      },
      {
        kind: 'data',
        value: 'data:image/png;base64,aGVsbG8=',
        originalName: 'pasted-image.png',
        mimeType: 'image/png'
      }
    ]);
  });

  it('does not intercept ordinary text or non-image urls', () => {
    expect(parseTextImageSources('https://example.com/article')).toEqual([]);
    expect(parseTextImageSources('普通文本内容')).toEqual([]);
    expect(parseTextImageSources('https://example.com/photo.png\n普通文本')).toEqual([]);
  });

  it('allows extensionless remote urls when explicitly requested by an import flow', () => {
    expect(parseTextImageSources('https://cdn.example.com/render?id=42', { allowExtensionlessRemote: true })).toEqual([
      {
        kind: 'remote',
        value: 'https://cdn.example.com/render?id=42',
        originalName: 'render'
      }
    ]);
  });

  it('allows dynamic remote endpoints when explicitly requested by an import flow', () => {
    expect(parseTextImageSources('https://cdn.example.com/render.php?id=42', { allowExtensionlessRemote: true })).toEqual([
      {
        kind: 'remote',
        value: 'https://cdn.example.com/render.php?id=42',
        originalName: 'render.php'
      }
    ]);
  });

  it('recognizes AVIF sources across remote, file, and data-url inputs', () => {
    const fileUrl = pathToFileURL('/tmp/example.avif').toString();
    expect(
      parseTextImageSources(
        [
          'https://example.com/assets/photo.avif',
          fileUrl,
          'data:image/avif;base64,aGVsbG8='
        ].join('\n')
      )
    ).toEqual([
      {
        kind: 'remote',
        value: 'https://example.com/assets/photo.avif',
        originalName: 'photo.avif'
      },
      {
        kind: 'file',
        value: fileUrl,
        originalName: 'example.avif'
      },
      {
        kind: 'data',
        value: 'data:image/avif;base64,aGVsbG8=',
        originalName: 'pasted-image.avif',
        mimeType: 'image/avif'
      }
    ]);
  });
});

describe('resolveTextImageSource', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads image bytes from a file url', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'note-image-manager-'));
    const filePath = join(folder, 'local-image.png');
    await writeFile(filePath, Buffer.from([1, 2, 3, 4]));

    try {
      const source = {
        kind: 'file' as const,
        value: pathToFileURL(filePath).toString(),
        originalName: 'local-image.png'
      };

      const resolved = await resolveTextImageSource(source);

      expect(resolved.originalName).toBe('local-image.png');
      expect(Buffer.from(resolved.data)).toEqual(await readFile(filePath));
    } finally {
      await rm(folder, { recursive: true, force: true });
    }
  });

  it('decodes base64 image data urls', async () => {
    const resolved = await resolveTextImageSource({
      kind: 'data',
      value: 'data:image/png;base64,aGVsbG8=',
      originalName: 'pasted-image.png',
      mimeType: 'image/png'
    });

    expect(resolved.originalName).toBe('pasted-image.png');
    expect(Buffer.from(resolved.data).toString('utf8')).toBe('hello');
  });

  it('downloads remote image urls after verifying content type', async () => {
    const payload = new Uint8Array([9, 8, 7, 6]);
    const fetchMock = vi.fn(async () => ({
      ok: true,
      headers: {
        get: vi.fn(() => 'image/webp')
      },
      arrayBuffer: vi.fn(async () => payload.buffer.slice(0))
    }));
    vi.stubGlobal('fetch', fetchMock);

    const resolved = await resolveTextImageSource({
      kind: 'remote',
      value: 'https://example.com/assets/cover.webp',
      originalName: 'cover.webp'
    });

    expect(fetchMock).toHaveBeenCalledWith('https://example.com/assets/cover.webp');
    expect(resolved.originalName).toBe('cover.webp');
    expect(Buffer.from(resolved.data)).toEqual(Buffer.from(payload));
  });

  it('infers an extension for extensionless remote image urls from response content type', async () => {
    const payload = new Uint8Array([1, 3, 5, 7]);
    const fetchMock = vi.fn(async () => ({
      ok: true,
      headers: {
        get: vi.fn(() => 'image/png')
      },
      arrayBuffer: vi.fn(async () => payload.buffer.slice(0))
    }));
    vi.stubGlobal('fetch', fetchMock);

    const resolved = await resolveTextImageSource({
      kind: 'remote',
      value: 'https://cdn.example.com/render?id=42',
      originalName: 'render'
    });

    expect(fetchMock).toHaveBeenCalledWith('https://cdn.example.com/render?id=42');
    expect(resolved.originalName).toBe('render.png');
    expect(Buffer.from(resolved.data)).toEqual(Buffer.from(payload));
  });

  it('replaces non-image endpoint extensions with an inferred image extension from response content type', async () => {
    const payload = new Uint8Array([2, 4, 6, 8]);
    const fetchMock = vi.fn(async () => ({
      ok: true,
      headers: {
        get: vi.fn(() => 'image/png')
      },
      arrayBuffer: vi.fn(async () => payload.buffer.slice(0))
    }));
    vi.stubGlobal('fetch', fetchMock);

    const resolved = await resolveTextImageSource({
      kind: 'remote',
      value: 'https://cdn.example.com/render.php?id=42',
      originalName: 'render.php'
    });

    expect(fetchMock).toHaveBeenCalledWith('https://cdn.example.com/render.php?id=42');
    expect(resolved.originalName).toBe('render.png');
    expect(Buffer.from(resolved.data)).toEqual(Buffer.from(payload));
  });
});
