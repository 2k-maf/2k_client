/**
 * Пошук ніка: кирилиця і латиниця, фонетика («Rabbit» / «ребіт») і чужа розкладка.
 * Голосні не зливаються всі в одну: дозволена лише одна заміна з пари a/e, a/u, o/u.
 */

const CYR: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', ґ: 'g', д: 'd', е: 'e', є: 'e',
  ж: 'zh', з: 'z', и: 'i', і: 'i', ї: 'i', й: 'i', к: 'k', л: 'l',
  м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
  ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ь: '',
  ю: 'yu', я: 'ya', ы: 'i', э: 'e', ё: 'yo', ъ: '',
};

/** Довші сполучення раніше. `th` обробляється окремо: дає і «т», і «с». */
const LAT_DIGRAPHS: ReadonlyArray<readonly [string, string]> = [
  ['shch', 'shch'],
  ['sch', 'shch'],
  ['zh', 'zh'],
  ['kh', 'kh'],
  ['ts', 'ts'],
  ['ch', 'ch'],
  ['sh', 'sh'],
  ['gh', 'g'],
  ['ck', 'k'],
  ['ph', 'f'],
  ['ju', 'yu'],
  ['yu', 'yu'],
  ['yo', 'yo'],
  ['ye', 'e'],
  ['yi', 'i'],
  ['ya', 'ya'],
];

const VOWEL_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['a', 'e'],
  ['a', 'u'],
  ['o', 'u'],
];

/** Одна фізична клавіша: QWERTY і українська йцукен. */
const EN_KEYS = "qwertyuiop[]asdfghjkl;'zxcvbnm,.";
const UA_KEYS = "йцукенгшщзхїфівапролджєячсмитьбю";

const EN_TO_UA: Record<string, string> = {};
const UA_TO_EN: Record<string, string> = {};
for (let i = 0; i < EN_KEYS.length; i++) {
  EN_TO_UA[EN_KEYS[i]] = UA_KEYS[i];
  UA_TO_EN[UA_KEYS[i]] = EN_KEYS[i];
}

function compact(value: string): string {
  return value.trim().toLowerCase().replace(/[\s.,_'"’`\-–—/]+/g, '');
}

function flipLayout(value: string): string | null {
  let toEn = '';
  let toUa = '';
  let enOk = true;
  let uaOk = true;
  for (const ch of value) {
    if (ch >= '0' && ch <= '9') {
      toEn += ch;
      toUa += ch;
      continue;
    }
    const asEn = UA_TO_EN[ch];
    const asUa = EN_TO_UA[ch];
    if (!asEn) enOk = false;
    else toEn += asEn;
    if (!asUa) uaOk = false;
    else toUa += asUa;
  }
  if (enOk && toEn !== value) return toEn;
  if (uaOk && toUa !== value) return toUa;
  return null;
}

type Step = { consume: number; text: string };

function stepsAt(s: string, i: number): Step[] {
  const ch = s[i];
  const cyr = CYR[ch];
  if (cyr !== undefined) return [{ consume: 1, text: cyr }];
  if (s.startsWith('th', i)) {
    return [
      { consume: 2, text: 't' },
      { consume: 2, text: 's' },
    ];
  }
  for (const [digraph, repl] of LAT_DIGRAPHS) {
    if (s.startsWith(digraph, i)) return [{ consume: digraph.length, text: repl }];
  }
  if (ch === 'j') return [{ consume: 1, text: 'dzh' }];
  if (ch === 'c') {
    const next = s[i + 1] ?? '';
    return [{ consume: 1, text: next === 'e' || next === 'i' || next === 'y' ? 's' : 'k' }];
  }
  if (ch === 'y') return [{ consume: 1, text: 'i' }];
  if (ch === 'h') {
    const next = s[i + 1] ?? '';
    const pronounced = next !== '' && 'aeiouy'.includes(next);
    return [{ consume: 1, text: pronounced ? 'g' : '' }];
  }
  if (ch === 'x') return [{ consume: 1, text: 'ks' }];
  if (ch === 'w') return [{ consume: 1, text: 'v' }];
  if (ch === 'q') return [{ consume: 1, text: 'k' }];
  if ((ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9')) return [{ consume: 1, text: ch }];
  return [{ consume: 1, text: '' }];
}

function normalizeOut(out: string): string {
  const replaced = out.replace(/iya/g, 'ia');
  let folded = '';
  for (const ch of replaced) {
    if (/[a-z]/.test(ch) && folded.endsWith(ch)) continue;
    folded += ch;
  }
  return folded;
}

function foldVariants(value: string): string[] {
  const s = compact(value);
  const done: string[] = [];
  const queue: Array<{ i: number; out: string }> = [{ i: 0, out: '' }];
  while (queue.length) {
    const state = queue.pop()!;
    if (state.i >= s.length) {
      done.push(normalizeOut(state.out));
      continue;
    }
    for (const step of stepsAt(s, state.i)) {
      queue.push({ i: state.i + step.consume, out: state.out + step.text });
    }
  }
  return Array.from(new Set(done));
}

function vowelPair(a: string, b: string): boolean {
  return VOWEL_PAIRS.some(([x, y]) => (a === x && b === y) || (a === y && b === x));
}

/** Одна заміна голосної у вікні тієї ж довжини. Коротші за 3 літери не розмиваємо. */
function flexIncludes(haystack: string, needle: string): boolean {
  if (needle.length < 3 || haystack.length < needle.length) return false;
  for (let i = 0; i <= haystack.length - needle.length; i++) {
    const window = haystack.slice(i, i + needle.length);
    let swaps = 0;
    let ok = true;
    for (let k = 0; k < needle.length; k++) {
      if (window[k] === needle[k]) continue;
      if (!vowelPair(window[k], needle[k])) {
        ok = false;
        break;
      }
      swaps += 1;
      if (swaps > 1) {
        ok = false;
        break;
      }
    }
    if (ok && swaps === 1) return true;
  }
  return false;
}

function forms(value: string): string[] {
  const base = compact(value);
  const flipped = flipLayout(base);
  const sources = flipped ? [base, flipped] : [base];
  return Array.from(new Set(sources.flatMap(foldVariants)));
}

export function nickMatches(title: string, query: string): boolean {
  const raw = query.trim().toLowerCase();
  if (!raw) return true;
  if (title.toLowerCase().includes(raw)) return true;
  const queryForms = forms(query).filter(Boolean);
  if (!queryForms.length) return false;
  const titleForms = forms(title);
  return queryForms.some((q) => titleForms.some((t) => t.includes(q) || flexIncludes(t, q)));
}
