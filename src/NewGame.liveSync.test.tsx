import * as React from 'react';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import NewGame from './NewGame';
import axios from './axios';

jest.mock('react-router-dom', () => {
  const ReactLib = jest.requireActual('react');
  const Link = ({ to, children, ...rest }: any) => ReactLib.createElement('a', { href: String(to), ...rest }, children);
  return {
    useLocation: () => ({ pathname: '/new-game-rating', search: '', hash: '', state: null }),
    useNavigate: () => jest.fn(),
    useParams: () => ({}),
    Link,
    NavLink: Link,
  };
}, { virtual: true });

jest.mock('./axios', () => ({
  __esModule: true,
  default: { get: jest.fn(), put: jest.fn(), post: jest.fn() },
}));

jest.mock('./AuthProvider', () => ({
  useAuth: () => ({ user: { _id: 'club1', authType: 'Клуб' }, canRecordRatingGame: true }),
}));

const mocked = axios as unknown as { get: jest.Mock; put: jest.Mock; post: jest.Mock };

const livePlayers = Array.from({ length: 10 }, (_, i) => ({
  seat: i + 1,
  nickname: `Гравець ${i + 1}`,
  id: (`aaaaaaaaaaaaaaaaaaaaaaa${i}`).slice(-24),
  avatarUrl: null,
  role: null,
}));

let root: Root;
let host: HTMLDivElement;

beforeAll(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  window.matchMedia = window.matchMedia || ((() => ({
    matches: false, addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {},
  })) as any);
});

beforeEach(() => {
  jest.useFakeTimers();
  localStorage.clear();
  mocked.get.mockImplementation(async (url: string) => {
    if (url === '/club/active-rating-game') {
      return { data: { seatingId: 'seating1', game: 1, nominated: [], players: livePlayers } };
    }
    if (url === '/club/evening-players') return { data: { players: [] } };
    return { data: { items: [] } };
  });
  mocked.put.mockResolvedValue({ data: {} });
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  jest.useRealTimers();
  jest.clearAllMocks();
});

async function mountForm() {
  await act(async () => {
    root.render(<NewGame />);
  });
  for (let i = 0; i < 10; i += 1) {
    await act(async () => { await Promise.resolve(); });
  }
}

function click(label: string) {
  const el = host.querySelector(`[aria-label="${label}"]`) as HTMLElement | null;
  if (!el) throw new Error(`no element ${label}`);
  act(() => { el.click(); });
}

async function flushSync() {
  await act(async () => { jest.advanceTimersByTime(1000); });
}

const lastBody = () => mocked.put.mock.calls[mocked.put.mock.calls.length - 1][1];

test('роль, фол, вибуття і виставлення одразу йдуть в активну гру', async () => {
  await mountForm();
  expect(mocked.get).toHaveBeenCalledWith('/club/active-rating-game');
  await flushSync();
  expect(mocked.put).not.toHaveBeenCalled();

  click('Змінити роль гравця 1');
  await flushSync();
  expect(mocked.put).toHaveBeenCalledTimes(1);
  expect(lastBody().seatingId).toBe('seating1');
  expect(lastBody().players[0].role).toBe('maf');

  click('Фол гравцю 2, зараз 0');
  await flushSync();
  expect(mocked.put).toHaveBeenCalledTimes(2);
  expect(lastBody().players[1].fouls).toBe(1);

  click('Виставити гравця 3 на голосування');
  await flushSync();
  expect(mocked.put).toHaveBeenCalledTimes(3);
  expect(lastBody().nominated).toEqual([3]);
});

test('невдалий запис повторюється, а не губиться', async () => {
  await mountForm();
  mocked.put.mockRejectedValueOnce(new Error('offline'));

  click('Змінити роль гравця 4');
  await flushSync();
  expect(mocked.put).toHaveBeenCalledTimes(1);

  await act(async () => { jest.advanceTimersByTime(3500); });
  expect(mocked.put).toHaveBeenCalledTimes(2);
  expect(lastBody().players[3].role).toBe('maf');
});
