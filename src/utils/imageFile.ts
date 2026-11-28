export const IMAGE_ACCEPT = '.jpg, .jpeg, .png';

export const IMAGE_TYPE_ERROR = 'Дозволені лише файли JPEG або PNG';

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

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

/** Текст помилки для відхиленого `readImageFile` (тип або розмір понад `maxBytes`). */
export const imageRejectedMessage = (reason: 'type' | 'size', maxBytes: number): string =>
  reason === 'type' ? IMAGE_TYPE_ERROR : `Файл занадто великий (макс. ${formatMaxMb(maxBytes)})`;
