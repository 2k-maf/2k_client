import { describe, expect, it } from 'vitest';
import { formatMaxMb, readImageFile } from './imageFile';

const MB = 1024 * 1024;

const makeFile = (type: string, name: string, size = 4) =>
  new File([new Uint8Array(size)], name, { type });

describe('readImageFile', () => {
  it('JPEG і PNG проходять', async () => {
    const png = await readImageFile(makeFile('image/png', 'a.png'), 2 * MB);
    expect(png.ok).toBe(true);
    if (png.ok) expect(png.dataUrl.startsWith('data:image/png;base64,')).toBe(true);

    const jpeg = await readImageFile(makeFile('image/jpeg', 'a.jpg'), 2 * MB);
    expect(jpeg.ok).toBe(true);
    if (jpeg.ok) expect(jpeg.dataUrl.startsWith('data:image/jpeg;base64,')).toBe(true);
  });

  it('GIF відхиляється за типом', async () => {
    expect(await readImageFile(makeFile('image/gif', 'a.gif'), 2 * MB)).toEqual({
      ok: false,
      reason: 'type',
    });
  });

  it('файл понад ліміт відхиляється за розміром', async () => {
    expect(await readImageFile(makeFile('image/png', 'a.png', 2 * MB + 1), 2 * MB)).toEqual({
      ok: false,
      reason: 'size',
    });
  });

  it('тип перевіряється раніше за розмір', async () => {
    expect(await readImageFile(makeFile('image/gif', 'a.gif', 5 * MB), 2 * MB)).toEqual({
      ok: false,
      reason: 'type',
    });
  });
});

describe('formatMaxMb', () => {
  it('форматує ліміт у мегабайтах', () => {
    expect(formatMaxMb(2 * MB)).toBe('2 МБ');
    expect(formatMaxMb(3 * MB)).toBe('3 МБ');
  });
});
