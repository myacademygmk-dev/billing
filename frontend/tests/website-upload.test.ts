import { afterEach, expect, it, vi } from 'vitest';
import { imageDimensions, prepareWebsiteUpload, uploadWebsiteFile } from '@/lib/website-upload';

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it('resizes portrait and landscape images proportionally without enlarging', () => {
  expect(imageDimensions(6000, 3000)).toEqual({ width: 2560, height: 1280 });
  expect(imageDimensions(3000, 6000)).toEqual({ width: 1280, height: 2560 });
  expect(imageDimensions(640, 480)).toEqual({ width: 640, height: 480 });
});

it('compresses a large image before uploading, keeping its whole frame', async () => {
  const close = vi.fn();
  vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 6000, height: 3000, close }));
  const drawImage = vi.fn();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage } as any);
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => callback(new Blob(['compressed'], { type: 'image/webp' })));
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ url: '/api/uploads/files/image.webp', size: 10 }) });
  vi.stubGlobal('fetch', fetchMock);
  const result = await uploadWebsiteFile(new File([new Uint8Array(6 * 1024 * 1024)], 'photo.jpg', { type: 'image/jpeg' }));
  const sent = fetchMock.mock.calls[0][1].body.get('file') as File;
  expect(sent.name).toBe('photo.webp');
  expect(sent.size).toBeLessThan(900 * 1024);
  expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 2560, 1280);
  expect(close).toHaveBeenCalledOnce();
  expect(result.url).toContain('image.webp');
});

it('keeps small images unchanged and releases decoded resources', async () => {
  const close = vi.fn();
  vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 100, height: 100, close }));
  const file = new File(['small'], 'logo.png', { type: 'image/png' });
  expect(await prepareWebsiteUpload(file)).toBe(file);
  expect(close).toHaveBeenCalledOnce();
});

it('preserves PDFs and GIFs and explains unsupported or oversized files', async () => {
  const pdf = new File(['pdf'], 'doc.pdf', { type: 'application/pdf' });
  expect(await prepareWebsiteUpload(pdf)).toBe(pdf);
  const gif = new File(['gif'], 'animation.gif', { type: 'image/gif' });
  expect(await prepareWebsiteUpload(gif)).toBe(gif);
  await expect(prepareWebsiteUpload(new File(['heic'], 'image.heic', { type: 'image/heic' }))).rejects.toThrow('HEIC');
  await expect(prepareWebsiteUpload(new File([new Uint8Array(5 * 1024 * 1024)], 'large.gif', { type: 'image/gif' }))).rejects.toThrow('4 MB');
});

it('reports server size errors rather than hiding them', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 413, json: async () => { throw new Error(); } }));
  await expect(uploadWebsiteFile(new File(['pdf'], 'doc.pdf', { type: 'application/pdf' }))).rejects.toThrow('server rejected the file size');
});
