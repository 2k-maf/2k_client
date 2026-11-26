import { describe, expect, it } from 'vitest';
import { APPLICATION_STATUS_UA, resolveApplyView } from './tournamentApplications';

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
