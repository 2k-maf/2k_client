/**
 * Пошуковий ключ ніка: кирилиця і латиниця сходяться в одну латинську форму.
 * «Rock» і «рок» обидва стають «rok».
 */
const CYR: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', ґ: 'g', д: 'd', е: 'e', є: 'ye',
  ж: 'zh', з: 'z', и: 'i', і: 'i', ї: 'yi', й: 'i', к: 'k', л: 'l',
  м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
  ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ь: '',
  ю: 'yu', я: 'ya', ы: 'i', э: 'e', ё: 'yo', ъ: '',
};

/** Довші сполучення раніше за коротші, щоб «shch» не розпалося на «sh». */
const LAT_DIGRAPHS: ReadonlyArray<readonly [string, string]> = [
  ['shch', 'shch'],
  ['sch', 'shch'],
  ['zh', 'zh'],
  ['kh', 'kh'],
  ['ts', 'ts'],
  ['ch', 'ch'],
  ['sh', 'sh'],
  ['yo', 'yo'],
  ['yu', 'yu'],
  ['ya', 'ya'],
  ['ye', 'ye'],
  ['yi', 'yi'],
  ['ck', 'k'],
  ['ph', 'f'],
];

export function foldNick(value: string): string {
  const s = value.trim().toLowerCase();
  let out = '';
  for (let i = 0; i < s.length; ) {
    const ch = s[i];
    const cyr = CYR[ch];
    if (cyr !== undefined) {
      out += cyr;
      i += 1;
      continue;
    }
    const dig = LAT_DIGRAPHS.find(([d]) => s.startsWith(d, i));
    if (dig) {
      out += dig[1];
      i += dig[0].length;
      continue;
    }
    if (ch === 'c') {
      const next = s[i + 1] ?? '';
      out += next === 'e' || next === 'i' || next === 'y' ? 's' : 'k';
      i += 1;
      continue;
    }
    if (ch === 'y' || ch === 'h') {
      out += ch === 'y' ? 'i' : 'g';
      i += 1;
      continue;
    }
    if (ch === 'x') {
      out += 'ks';
      i += 1;
      continue;
    }
    if (ch === 'w') {
      out += 'v';
      i += 1;
      continue;
    }
    if (ch === 'q') {
      out += 'k';
      i += 1;
      continue;
    }
    if ((ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9')) out += ch;
    i += 1;
  }
  // «Rabbit» пишуть «ребіт»: коротке a → е, подвійне bb → одне б.
  let folded = '';
  for (const ch of out) {
    const letter = ch === 'e' ? 'a' : ch;
    if (folded.endsWith(letter)) continue;
    folded += letter;
  }
  return folded;
}

export function nickMatches(title: string, query: string): boolean {
  const raw = query.trim().toLowerCase();
  if (!raw) return true;
  if (title.toLowerCase().includes(raw)) return true;
  const foldedQuery = foldNick(raw);
  if (!foldedQuery) return false;
  return foldNick(title).includes(foldedQuery);
}
