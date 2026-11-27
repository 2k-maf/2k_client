import { describe, expect, it } from 'vitest';
import { mergeParticipantUsers } from './participantUsers';

const members = [
  { _id: 'a', nickname: 'Alpha', email: 'a@x.com' },
  { _id: 'b', nickname: 'Beta', email: 'b@x.com' },
];

describe('mergeParticipantUsers', () => {
  it('учасник поза клубом дописується в кінець', () => {
    const result = mergeParticipantUsers(members, {
      guest: { nickname: 'Guest', avatarUrl: '/avatars/guest.webp' },
    });
    expect(result).toHaveLength(3);
    expect(result[2]).toEqual({ _id: 'guest', nickname: 'Guest', avatarUrl: '/avatars/guest.webp' });
  });

  it('учасник, який уже є серед членів, не дублюється', () => {
    const result = mergeParticipantUsers(members, {
      b: { nickname: 'Other', avatarUrl: null },
      guest: { nickname: 'Guest', avatarUrl: null },
    });
    expect(result.map((u) => u._id)).toEqual(['a', 'b', 'guest']);
    expect(result[1]).toBe(members[1]);
  });

  it('порядок і елементи членів зберігаються (та сама посилання)', () => {
    const result = mergeParticipantUsers(members, { guest: { nickname: 'Guest', avatarUrl: null } });
    expect(result[0]).toBe(members[0]);
    expect(result[1]).toBe(members[1]);
  });

  it('undefined і {} повертають копію members', () => {
    for (const participantUsers of [undefined, {}]) {
      const result = mergeParticipantUsers(members, participantUsers);
      expect(result).toEqual(members);
      expect(result).not.toBe(members);
    }
  });
});
