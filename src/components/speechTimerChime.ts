/** Сигнал таймера промови: два піки на 10 с, один прохід «таймер у телефоні» на нулі. */
export type SpeechChime = 'warning' | 'expired';

export type ChimeTone = {
  /** Зсув від початку сигналу, мілісекунди. */
  at: number;
  duration: number;
  frequency: number;
  gain: number;
  type: OscillatorType;
};

/**
 * На 10 с — два короткі високі піки, як попередження «ще трохи».
 * На нулі — один прохід, як коли в телефоні скінчився таймер: три короткі піки
 * і довший завершальний. Без гудка і без повтору.
 */
export function speechChimeTones(kind: SpeechChime): ChimeTone[] {
  if (kind === 'warning') {
    return [
      { at: 0, duration: 80, frequency: 988, gain: 0.24, type: 'sine' },
      { at: 160, duration: 80, frequency: 988, gain: 0.24, type: 'sine' },
    ];
  }
  return [
    { at: 0, duration: 110, frequency: 1046, gain: 0.22, type: 'sine' },
    { at: 200, duration: 110, frequency: 1046, gain: 0.22, type: 'sine' },
    { at: 400, duration: 110, frequency: 1046, gain: 0.22, type: 'sine' },
    { at: 640, duration: 420, frequency: 1318, gain: 0.26, type: 'sine' },
  ];
}

/** Повна тривалість сигналу від першого піку до кінця останнього. */
export function speechChimeSpan(kind: SpeechChime): number {
  return Math.max(...speechChimeTones(kind).map((tone) => tone.at + tone.duration));
}

/** Який сигнал відповідає поточній секунді. Між 10 і 0 таймер мовчить. */
export function speechChimeForSecond(seconds: number): SpeechChime | null {
  if (seconds === 10) return 'warning';
  if (seconds === 0) return 'expired';
  return null;
}

/**
 * Повертає сигнал лише раз за відлік. Повторний рендер на тій самій секунді
 * нічого не грає, а новий відлік починається з порожньої пам'яті.
 */
export function takeSpeechChime(seconds: number, played: SpeechChime | null): { chime: SpeechChime | null; played: SpeechChime | null } {
  const chime = speechChimeForSecond(seconds);
  if (!chime || chime === played) return { chime: null, played };
  return { chime, played: chime };
}

let context: AudioContext | null = null;
let active: OscillatorNode[] = [];

function audioContext(): AudioContext | null {
  const Ctx = window.AudioContext
    ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!context) context = new Ctx();
  return context;
}

/** Зупиняє тон, що ще грає. Новий відлік не має перекриватися зі старим сигналом. */
export function stopSpeechChime(): void {
  for (const osc of active) {
    try {
      osc.stop();
    } catch {
      /* осцилятор уже зупинено */
    }
  }
  active = [];
}

/** Викликати з кліку по таймеру: браузер пускає звук лише після жесту користувача. */
export function primeSpeechChime(): void {
  const ctx = audioContext();
  if (ctx?.state === 'suspended') void ctx.resume();
}

function scheduleTone(ctx: AudioContext, tone: ChimeTone, origin: number): void {
  const start = origin + tone.at / 1000;
  const duration = tone.duration / 1000;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = tone.type;
  osc.frequency.setValueAtTime(tone.frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(tone.gain, start + 0.012);
  gain.gain.setValueAtTime(tone.gain, start + Math.max(duration - 0.04, 0.02));
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  if (tone.type === 'square') {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, start);
    gain.connect(filter);
    filter.connect(ctx.destination);
  } else {
    gain.connect(ctx.destination);
  }
  osc.start(start);
  osc.stop(start + duration + 0.02);
  active.push(osc);
  osc.onended = () => {
    active = active.filter((item) => item !== osc);
  };
}

export function playSpeechChime(kind: SpeechChime): void {
  const ctx = audioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') void ctx.resume();
  const origin = ctx.currentTime;
  for (const tone of speechChimeTones(kind)) scheduleTone(ctx, tone, origin);
}
