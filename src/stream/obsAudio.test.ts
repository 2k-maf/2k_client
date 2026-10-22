import { webcrypto } from 'crypto';
import { TextEncoder } from 'util';
import { desiredMuted, ObsAudioSession, obsAuthentication, obsConfigFromEnv } from './obsAudio';

Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
Object.defineProperty(globalThis, 'TextEncoder', { value: TextEncoder, configurable: true });

test('глушить усі джерела, поки хоч одне чутно', () => {
  expect(desiredMuted([false, false])).toBe(true);
  expect(desiredMuted([true, false])).toBe(true);
  expect(desiredMuted([true, true])).toBe(false);
});

test('без адреси чи пароля кнопки немає', () => {
  expect(obsConfigFromEnv({ url: '', password: 'x' })).toBeNull();
  expect(obsConfigFromEnv({ url: 'ws://127.0.0.1:4455', password: '' })).toBeNull();
  expect(obsConfigFromEnv({ url: ' ws://127.0.0.1:4455 ', password: 'x' })).toEqual({
    url: 'ws://127.0.0.1:4455',
    password: 'x',
  });
});

test('підпис obs-websocket збігається з sha256', async () => {
  await expect(obsAuthentication('secret', 'salt', 'challenge')).resolves.toBe(
    '39cfhx7et2iyoMZvoQ6o3OPLNSKgtMmy48GQ7jnvsdE=',
  );
});

test('сесія збирає лише звукові входи і перемикає їх разом', async () => {
  const sent: unknown[] = [];
  const seen: { phase: string; inputs: { name: string; muted: boolean }[] }[] = [];
  const session = new ObsAudioSession('secret', (payload) => sent.push(payload), (snapshot) => {
    seen.push(snapshot);
  });

  await session.handleMessage(JSON.stringify({
    op: 0,
    d: { rpcVersion: 1, authentication: { challenge: 'challenge', salt: 'salt' } },
  }));
  expect(sent[0]).toMatchObject({
    op: 1,
    d: { rpcVersion: 1, eventSubscriptions: 8, authentication: '39cfhx7et2iyoMZvoQ6o3OPLNSKgtMmy48GQ7jnvsdE=' },
  });

  await session.handleMessage(JSON.stringify({ op: 2, d: {} }));
  expect(sent[1]).toMatchObject({ op: 6, d: { requestType: 'GetInputList', requestId: 'inputs' } });

  await session.handleMessage(JSON.stringify({
    op: 7,
    d: {
      requestId: 'inputs',
      requestStatus: { result: true },
      responseData: { inputs: [{ inputName: 'Mic/Aux' }, { inputName: 'photo.jpg' }] },
    },
  }));
  await session.handleMessage(JSON.stringify({
    op: 7,
    d: { requestId: 'mute:1', requestStatus: { result: false, code: 604 } },
  }));
  await session.handleMessage(JSON.stringify({
    op: 7,
    d: { requestId: 'mute:0', requestStatus: { result: true }, responseData: { inputMuted: false } },
  }));

  expect(session.snapshot).toEqual({ phase: 'live', inputs: [{ name: 'Mic/Aux', muted: false }] });

  session.toggle();
  expect(sent.at(-1)).toMatchObject({
    op: 6,
    d: { requestType: 'SetInputMute', requestData: { inputName: 'Mic/Aux', inputMuted: true } },
  });
  expect(session.snapshot.inputs).toEqual([{ name: 'Mic/Aux', muted: true }]);

  await session.handleMessage(JSON.stringify({
    op: 5,
    d: { eventType: 'InputMuteStateChanged', eventData: { inputName: 'Mic/Aux', inputMuted: false } },
  }));
  expect(session.snapshot.inputs).toEqual([{ name: 'Mic/Aux', muted: false }]);
  expect(seen.length).toBeGreaterThan(0);
});
