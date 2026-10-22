/** Коди obs-websocket 5. Підписка лише на входи, щоб ловити зміну mute. */
const HELLO = 0;
const IDENTIFY = 1;
const IDENTIFIED = 2;
const EVENT = 5;
const REQUEST = 6;
const REQUEST_RESPONSE = 7;
const INPUT_EVENTS = 1 << 3;

export type ObsAudioInput = { name: string; muted: boolean };

export type ObsAudioSnapshot = {
  phase: 'connecting' | 'live' | 'offline';
  inputs: ObsAudioInput[];
};

type Outbound = (payload: unknown) => void;

/**
 * Якщо хоч одне джерело чутно, кнопка глушить усі. Якщо тиша вже скрізь — знімає mute.
 */
export function desiredMuted(mutedFlags: boolean[]): boolean {
  return mutedFlags.some((muted) => !muted);
}

export function obsConfigFromEnv(env: { url?: string; password?: string }): { url: string; password: string } | null {
  const url = env.url?.trim() ?? '';
  const password = env.password ?? '';
  if (!url || !password) return null;
  return { url, password };
}

/** obs-websocket: base64(sha256(base64(sha256(password + salt)) + challenge)). */
export async function obsAuthentication(password: string, salt: string, challenge: string): Promise<string> {
  const secret = await sha256Base64(password + salt);
  return sha256Base64(secret + challenge);
}

function mapInputs(inputs: Map<string, boolean>): ObsAudioInput[] {
  const list: ObsAudioInput[] = [];
  inputs.forEach((muted, name) => list.push({ name, muted }));
  return list;
}

async function sha256Base64(value: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new globalThis.TextEncoder().encode(value));
  const bytes = new Uint8Array(digest);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

/**
 * Сесія керування гучністю. Браузерний сокет лишається зовні: тут лише протокол,
 * тож тести гонять ті самі повідомлення, що й OBS.
 */
export class ObsAudioSession {
  private inputs = new Map<string, boolean>();
  private pendingMutes = new Set<string>();
  private muteNames = new Map<string, string>();
  snapshot: ObsAudioSnapshot = { phase: 'connecting', inputs: [] };

  constructor(
    private readonly password: string,
    private readonly send: Outbound,
    private readonly onChange: (snapshot: ObsAudioSnapshot) => void,
  ) {}

  async handleMessage(raw: string): Promise<void> {
    const msg = JSON.parse(raw) as {
      op: number;
      d: {
        rpcVersion?: number;
        authentication?: { challenge?: string; salt?: string };
        eventType?: string;
        eventData?: { inputName?: string; inputMuted?: boolean };
        requestId?: string;
        requestStatus?: { result?: boolean };
        responseData?: {
          inputs?: { inputName: string }[];
          inputMuted?: boolean;
        };
      };
    };

    if (msg.op === HELLO) {
      const d: { rpcVersion: number; eventSubscriptions: number; authentication?: string } = {
        rpcVersion: msg.d.rpcVersion ?? 1,
        eventSubscriptions: INPUT_EVENTS,
      };
      const { challenge, salt } = msg.d.authentication ?? {};
      if (challenge && salt) d.authentication = await obsAuthentication(this.password, salt, challenge);
      this.send({ op: IDENTIFY, d });
      return;
    }

    if (msg.op === IDENTIFIED) {
      this.send({ op: REQUEST, d: { requestType: 'GetInputList', requestId: 'inputs' } });
      return;
    }

    if (msg.op === EVENT && msg.d.eventType === 'InputMuteStateChanged') {
      const name = msg.d.eventData?.inputName;
      if (!name || !this.inputs.has(name)) return;
      this.inputs.set(name, Boolean(msg.d.eventData?.inputMuted));
      this.publish('live');
      return;
    }

    if (msg.op === REQUEST_RESPONSE) this.onResponse(msg.d);
  }

  toggle(): void {
    if (this.snapshot.phase !== 'live' || this.inputs.size === 0) return;
    const flags: boolean[] = [];
    this.inputs.forEach((value) => flags.push(value));
    const muted = desiredMuted(flags);
    let index = 0;
    this.inputs.forEach((_value, name) => {
      this.send({
        op: REQUEST,
        d: {
          requestType: 'SetInputMute',
          requestId: `set:${index}`,
          requestData: { inputName: name, inputMuted: muted },
        },
      });
      index += 1;
    });
    this.inputs.forEach((_value, name) => this.inputs.set(name, muted));
    this.publish('live');
  }

  private onResponse(data: {
    requestId?: string;
    requestStatus?: { result?: boolean };
    responseData?: { inputs?: { inputName: string }[]; inputMuted?: boolean };
  }): void {
    if (data.requestId === 'inputs') {
      if (!data.requestStatus?.result) return;
      const names = (data.responseData?.inputs ?? []).map((input) => input.inputName);
      this.inputs.clear();
      this.pendingMutes = new Set(names.map((_, index) => `mute:${index}`));
      this.muteNames = new Map(names.map((name, index) => [`mute:${index}`, name]));
      if (names.length === 0) {
        this.publish('live');
        return;
      }
      names.forEach((name, index) => {
        this.send({
          op: REQUEST,
          d: {
            requestType: 'GetInputMute',
            requestId: `mute:${index}`,
            requestData: { inputName: name },
          },
        });
      });
      return;
    }

    if (!data.requestId || !this.pendingMutes.has(data.requestId)) return;
    this.pendingMutes.delete(data.requestId);
    const name = this.muteNames.get(data.requestId);
    if (name && data.requestStatus?.result) {
      this.inputs.set(name, Boolean(data.responseData?.inputMuted));
    }
    if (this.pendingMutes.size === 0) this.publish('live');
  }

  private publish(phase: ObsAudioSnapshot['phase']): void {
    this.snapshot = {
      phase,
      inputs: mapInputs(this.inputs),
    };
    this.onChange(this.snapshot);
  }
}
