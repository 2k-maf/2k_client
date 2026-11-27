import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  GUEST_FORM_LIMITS,
  adoptGuestToken,
  clearGuestToken,
  guestApplicationLink,
  guestApplyErrorMessage,
  readGuestToken,
  saveGuestToken,
  tokenFromHash,
  validateGuestForm,
} from './guestApplication';

const TOKEN = 'a1'.repeat(32);

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, '', '/');
});

describe('guest token storage', () => {
  it('зберігає, читає й очищає токен за ключем турніру', () => {
    expect(readGuestToken('t1')).toBeNull();
    saveGuestToken('t1', TOKEN);
    expect(window.localStorage.getItem('guest_application_t1')).toBe(TOKEN);
    expect(readGuestToken('t1')).toBe(TOKEN);
    expect(readGuestToken('t2')).toBeNull();
    clearGuestToken('t1');
    expect(readGuestToken('t1')).toBeNull();
  });

  it('помилки localStorage ковтаються', () => {
    const broken = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(readGuestToken('t1')).toBeNull();
    expect(() => saveGuestToken('t1', TOKEN)).not.toThrow();
    expect(() => clearGuestToken('t1')).not.toThrow();
    broken.mockRestore();
  });
});

describe('tokenFromHash', () => {
  it('приводить hex до нижнього регістру', () => {
    expect(tokenFromHash('#g=' + 'A'.repeat(64))).toBe('a'.repeat(64));
  });

  it('відхиляє некоректні фрагменти', () => {
    expect(tokenFromHash('#g=короткий')).toBeNull();
    expect(tokenFromHash('')).toBeNull();
    expect(tokenFromHash('#x=' + 'a'.repeat(64))).toBeNull();
    expect(tokenFromHash('#g=' + 'a'.repeat(63))).toBeNull();
    expect(tokenFromHash('#g=' + 'a'.repeat(65))).toBeNull();
    expect(tokenFromHash('#g=' + 'z'.repeat(64))).toBeNull();
  });
});

describe('adoptGuestToken', () => {
  it('бере токен із фрагмента, зберігає й прибирає фрагмент', () => {
    window.history.replaceState(null, '', '/tournaments/t1/apply?x=1#g=' + TOKEN.toUpperCase());
    expect(adoptGuestToken('t1')).toBe(TOKEN);
    expect(readGuestToken('t1')).toBe(TOKEN);
    expect(window.location.hash).toBe('');
    expect(window.location.pathname + window.location.search).toBe('/tournaments/t1/apply?x=1');
  });

  it('без фрагмента повертає збережений токен', () => {
    saveGuestToken('t1', TOKEN);
    expect(adoptGuestToken('t1')).toBe(TOKEN);
  });

  it('без фрагмента й сховища повертає null', () => {
    expect(adoptGuestToken('t1')).toBeNull();
  });

  it('сміттєвий фрагмент не затирає збережений токен', () => {
    saveGuestToken('t1', TOKEN);
    window.history.replaceState(null, '', '/tournaments/t1/apply#g=сміття');
    expect(adoptGuestToken('t1')).toBe(TOKEN);
    expect(readGuestToken('t1')).toBe(TOKEN);
  });
});

describe('guestApplicationLink', () => {
  it('будує приватне посилання з фрагментом', () => {
    expect(guestApplicationLink('https://x.test', 't1', 'abc')).toBe('https://x.test/tournaments/t1/apply#g=abc');
  });
});

describe('GUEST_FORM_LIMITS', () => {
  it('межі з брифу', () => {
    expect(GUEST_FORM_LIMITS).toEqual({ nicknameMin: 2, nicknameMax: 30, contactMin: 3, contactMax: 100 });
  });
});

describe('validateGuestForm', () => {
  const valid = { nickname: 'Мафіозі', contact: '@mafioso', image: 'data:image/png;base64,AAAA' };

  it('валідний ввід → порожній об’єкт', () => {
    expect(validateGuestForm(valid)).toEqual({});
  });

  it('порожній нік', () => {
    expect(validateGuestForm({ ...valid, nickname: '   ' })).toEqual({ nickname: 'Нік: від 2 до 30 символів' });
  });

  it('нік із 31 символу', () => {
    expect(validateGuestForm({ ...valid, nickname: 'a'.repeat(31) })).toEqual({
      nickname: 'Нік: від 2 до 30 символів',
    });
    expect(validateGuestForm({ ...valid, nickname: 'a'.repeat(30) })).toEqual({});
  });

  it('керівний символ у ніку', () => {
    expect(validateGuestForm({ ...valid, nickname: 'ab\ncd' })).toEqual({ nickname: 'Нік: від 2 до 30 символів' });
  });

  it('контакт із двох символів', () => {
    expect(validateGuestForm({ ...valid, contact: 'ab' })).toEqual({ contact: 'Контакт: від 3 до 100 символів' });
  });

  it('контакт довший за 100 і з керівним символом', () => {
    expect(validateGuestForm({ ...valid, contact: 'a'.repeat(101) })).toEqual({
      contact: 'Контакт: від 3 до 100 символів',
    });
    expect(validateGuestForm({ ...valid, contact: 'abc\u0007' })).toEqual({
      contact: 'Контакт: від 3 до 100 символів',
    });
  });

  it('без зображення', () => {
    expect(validateGuestForm({ ...valid, image: null })).toEqual({ image: 'Додайте аватарку' });
  });

  it('збирає всі помилки разом', () => {
    expect(validateGuestForm({ nickname: '', contact: '', image: null })).toEqual({
      nickname: 'Нік: від 2 до 30 символів',
      contact: 'Контакт: від 3 до 100 символів',
      image: 'Додайте аватарку',
    });
  });
});

describe('guestApplyErrorMessage', () => {
  it.each([
    ['ALREADY_APPLIED', 'Заявку з цим контактом уже подано'],
    ['TOURNAMENT_NOT_OPEN', 'Набір закрито: турнір вже почався'],
    ['APPLICATIONS_FULL', 'Заявок забагато. Спробуйте пізніше'],
    ['TOO_MANY_REQUESTS', 'Забагато спроб. Спробуйте за годину'],
    ['AVATAR_REQUIRED', 'Додайте аватарку'],
    ['INVALID_NICKNAME', 'Нік: від 2 до 30 символів'],
    ['INVALID_CONTACT', 'Контакт: від 3 до 100 символів'],
  ])('%s', (code, message) => {
    expect(guestApplyErrorMessage(code)).toBe(message);
  });

  it('невідомий код', () => {
    expect(guestApplyErrorMessage('WHATEVER')).toBe('Не вдалося подати заявку');
    expect(guestApplyErrorMessage(undefined)).toBe('Не вдалося подати заявку');
  });
});
