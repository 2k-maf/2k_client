export const IMAGE_ACCEPT = '.jpg, .jpeg, .png';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];

export type ReadImageFileResult =
  | { ok: true; dataUrl: string }
  | { ok: false; reason: 'type' | 'size' };

export const readImageFile = (file: File, maxBytes: number): Promise<ReadImageFileResult> => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return Promise.resolve({ ok: false, reason: 'type' });
  }
  if (file.size > maxBytes) {
    return Promise.resolve({ ok: false, reason: 'size' });
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ ok: true, dataUrl: String(reader.result) });
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};

export const formatMaxMb = (bytes: number): string => `${bytes / (1024 * 1024)} МБ`;
