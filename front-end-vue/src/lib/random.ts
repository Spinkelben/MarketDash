/** Returns a random element. `items` must not be empty. */
export function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T;
}

/** Returns a shuffled copy (Fisher–Yates); `items` itself is left untouched. */
export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

/** Day of the year in local time: 1 on 1 January, up to 366. */
export function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  // Date.UTC sidesteps the hour lost or gained at a daylight-saving change.
  const days = (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) -
    Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) / 86_400_000;
  return Math.round(days);
}

/**
 * Returns a copy rotated by one step per day, so the order is the same for
 * everyone on a given day and a different item leads each day.
 */
export function rotateByDay<T>(items: readonly T[], date: Date = new Date()): T[] {
  if (items.length === 0) return [];
  const offset = dayOfYear(date) % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}
