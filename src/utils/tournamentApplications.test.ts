import { describe, expect, it } from 'vitest';
import {
  APPLICATION_ACTION_UA,
  APPLICATION_STATUS_UA,
  applicationActions,
  applicationErrorMessage,
  createLatestGuard,
  isAuthSettled,
  resolveApplyView,
  tournamentHeaderUrl,
} from './tournamentApplications';

const base = {
  authType: 'Учасник' as const,
  hasAvatar: true,
  tournamentStatus: 'draft',
  myStatus: null,
};

describe('resolveApplyView', () => {
  it('login: немає authType', () => {
    expect(resolveApplyView({ ...base, authType: undefined })).toBe('login');
  });

  it('club: акаунт клубу', () => {
    expect(resolveApplyView({ ...base, authType: 'Клуб' })).toBe('club');
  });

  it('submitted: є заявка', () => {
    expect(resolveApplyView({ ...base, myStatus: 'pending' })).toBe('submitted');
  });

  it('closed: турнір не в статусі draft', () => {
    expect(resolveApplyView({ ...base, tournamentStatus: 'started' })).toBe('closed');
  });

  it('avatar: немає аватарки', () => {
    expect(resolveApplyView({ ...base, hasAvatar: false })).toBe('avatar');
  });

  it('form: усе гаразд', () => {
    expect(resolveApplyView(base)).toBe('form');
  });

  it('submitted має пріоритет над closed', () => {
    expect(resolveApplyView({ ...base, myStatus: 'approved', tournamentStatus: 'started' })).toBe('submitted');
  });

  it('submitted має пріоритет над avatar', () => {
    expect(resolveApplyView({ ...base, myStatus: 'rejected', hasAvatar: false })).toBe('submitted');
  });

  it('closed має пріоритет над avatar', () => {
    expect(resolveApplyView({ ...base, tournamentStatus: 'finished', hasAvatar: false })).toBe('closed');
  });

  it('club має пріоритет над усім', () => {
    expect(
      resolveApplyView({ authType: 'Клуб', hasAvatar: false, tournamentStatus: 'started', myStatus: 'pending' }),
    ).toBe('club');
  });

  it('login має пріоритет над усім', () => {
    expect(
      resolveApplyView({ authType: undefined, hasAvatar: false, tournamentStatus: 'started', myStatus: 'pending' }),
    ).toBe('login');
  });
});

describe('APPLICATION_STATUS_UA', () => {
  it('містить переклад для кожного статусу', () => {
    expect(Object.keys(APPLICATION_STATUS_UA).sort()).toEqual(['approved', 'pending', 'rejected']);
  });
});

describe('applicationActions', () => {
  it('pending -> approved, rejected', () => {
    expect(applicationActions('pending')).toEqual(['approved', 'rejected']);
  });

  it('approved -> rejected, pending', () => {
    expect(applicationActions('approved')).toEqual(['rejected', 'pending']);
  });

  it('rejected -> approved, pending', () => {
    expect(applicationActions('rejected')).toEqual(['approved', 'pending']);
  });
});

describe('APPLICATION_ACTION_UA', () => {
  it('точні підписи кнопок', () => {
    expect(APPLICATION_ACTION_UA).toEqual({
      approved: 'Схвалити',
      rejected: 'Відхилити',
      pending: 'Повернути в очікування',
    });
  });
});

describe('applicationErrorMessage', () => {
  it('TOURNAMENT_NOT_OPEN -> українське повідомлення', () => {
    expect(applicationErrorMessage('TOURNAMENT_NOT_OPEN')).toBe('Набір закрито: турнір вже почався');
  });

  it('інший текст сервера повертається як є', () => {
    expect(applicationErrorMessage('Усі 10 місць зайняті')).toBe('Усі 10 місць зайняті');
  });

  it('без тексту — запасне повідомлення', () => {
    expect(applicationErrorMessage(undefined)).toBe('Не вдалося оновити заявку');
    expect(applicationErrorMessage('  ')).toBe('Не вдалося оновити заявку');
  });
});

describe('isAuthSettled', () => {
  it('є користувач: auth готовий', () => {
    expect(isAuthSettled(true, 'jwt')).toBe(true);
  });
  it('немає користувача й немає токена в сховищі: гість, auth готовий', () => {
    expect(isAuthSettled(false, null)).toBe(true);
    expect(isAuthSettled(false, '')).toBe(true);
  });
  it('токен є, а користувача ще немає: чекаємо', () => {
    expect(isAuthSettled(false, 'jwt')).toBe(false);
  });
});

describe('tournamentHeaderUrl', () => {
  it('клуб: авторизований ендпоінт', () => {
    expect(tournamentHeaderUrl('abc', true)).toBe('/tournament/abc');
  });
  it('гість або гравець: публічний ендпоінт', () => {
    expect(tournamentHeaderUrl('abc', false)).toBe('/public/tournament/abc');
  });
});

describe('createLatestGuard', () => {
  it('лише останній запит вважається актуальним', () => {
    const guard = createLatestGuard();
    const first = guard.next();
    expect(guard.isLatest(first)).toBe(true);
    const second = guard.next();
    expect(guard.isLatest(first)).toBe(false);
    expect(guard.isLatest(second)).toBe(true);
  });
  it('invalidate скасовує поточний запит', () => {
    const guard = createLatestGuard();
    const first = guard.next();
    guard.invalidate();
    expect(guard.isLatest(first)).toBe(false);
  });
});
