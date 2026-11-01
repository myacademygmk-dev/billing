const MIB = 1024 * 1024;
const TARGET_BYTES = 900 * 1024;
const MAX_PASSTHROUGH_BYTES = 4 * MIB;

/** Resize the entire image proportionally; never crop or enlarge it. */
export function imageDimensions(width: number, height: number, maxEdge = 2560) {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export async function prepareWebsiteUpload(file: File): Promise<File> {
  if (!file.size) throw new Error('The selected file is empty.');
  if (file.type === 'application/pdf' || file.type === 'image/gif') {
    if (file.size > MAX_PASSTHROUGH_BYTES) {
      throw new Error('PDFs and animated GIFs must be smaller than 4 MB. Please reduce the file size first.');
    }
    return file;
  }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Choose a JPG, PNG, WebP, GIF or PDF. Convert HEIC images to JPG first.');
  }
  if (file.size > 40 * MIB) throw new Error('Choose an image smaller than 40 MB.');

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error('This image could not be opened. Try exporting it as JPG or PNG.');
  }
  try {
    if (bitmap.width * bitmap.height > 60_000_000) {
      throw new Error('This image is larger than 60 megapixels. Resize it before uploading.');
    }
    if (file.size <= TARGET_BYTES && Math.max(bitmap.width, bitmap.height) <= 2560) return file;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image compression is unavailable in this browser.');
    let edge = 2560;
    for (let pass = 0; pass < 5; pass++) {
      const size = imageDimensions(bitmap.width, bitmap.height, edge);
      canvas.width = size.width;
      canvas.height = size.height;
      context.drawImage(bitmap, 0, 0, size.width, size.height);
      for (const quality of [0.88, 0.78, 0.68]) {
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
        if (!blob) throw new Error('Image compression failed. Please try another image.');
        if (blob.size <= TARGET_BYTES) {
          const extension = blob.type === 'image/webp' ? 'webp' : 'png';
          return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.${extension}`, { type: blob.type });
        }
      }
      edge *= 0.75;
    }
    throw new Error('Could not reduce this image enough. Please export a smaller copy.');
  } finally {
    bitmap.close();
  }
}

export async function uploadWebsiteFile(file: File): Promise<{ url: string; size: number }> {
  const prepared = await prepareWebsiteUpload(file);
  const body = new FormData();
  body.append('file', prepared);
  const response = await fetch('/api/backend/uploads', { method: 'POST', body, credentials: 'include' });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(typeof data?.detail === 'string' ? data.detail : response.status === 413
      ? 'The server rejected the file size. Please choose a smaller file.'
      : `Upload failed (${response.status}). Please try again.`);
  }
  return response.json();
}
