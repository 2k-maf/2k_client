/** 0 чисто, 1 перший вбитий, 2 вбитий, 3 пішов зі столу. */
export type SeatMark = 0 | 1 | 2 | 3;

export function seatMark(value: unknown): SeatMark {
  return value === 1 || value === 2 || value === 3 ? value : 0;
}

/**
 * Той самий стовпчик після першого вбитого не закривається.
 * Порожнє місце без першого вбитого стає ним. Далі клік іде: вбитий → пішов → чисто.
 * Повторний клік по першому вбитому знімає позначку.
 */
export function nextSeatMark(current: unknown, firstKilledTaken: boolean): SeatMark {
  const mark = seatMark(current);
  if (mark === 1) return 0;
  if (mark === 2) return 3;
  if (mark === 3) return 0;
  return firstKilledTaken ? 2 : 1;
}

/** Підпис клітинки: що зробить наступний клік. */
export function seatMarkAction(current: unknown, firstKilledTaken: boolean, seat: number): string {
  const mark = seatMark(current);
  if (mark === 1) return `Зняти з гравця ${seat} позначку першого вбитого`;
  if (mark === 2) return `Позначити гравця ${seat} як того, хто покинув стіл`;
  if (mark === 3) return `Зняти позначку з гравця ${seat}`;
  return firstKilledTaken ? `Позначити гравця ${seat} вбитим` : `Позначити гравця ${seat} першим вбитим`;
}
