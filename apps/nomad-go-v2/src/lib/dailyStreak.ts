/**
 * Offline-first daily streak tracker tied to the "Road Blessing" daily check-in.
 *
 * There is no `streak` column on the `users` table, so the streak is persisted
 * locally (a single integer + date). A streak counts consecutive calendar days
 * with a check-in; missing a full day resets it.
 */

type StreakRecord = {
  count: number;
  /** Last check-in day, "YYYY-MM-DD" in the device's local timezone. */
  lastCheckin: string;
};

const KEY_PREFIX = "nomad:streak:";

function storageKey(userId: string): string {
  return `${KEY_PREFIX}${userId}`;
}

/** Local calendar day, stable across timezones for streak math. */
function localDayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function daysBetween(fromKey: string, toKey: string): number {
  const from = new Date(`${fromKey}T00:00:00`);
  const to = new Date(`${toKey}T00:00:00`);
  const diffMs = to.getTime() - from.getTime();
  return Math.round(diffMs / 86_400_000);
}

function read(userId: string): StreakRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StreakRecord>;
    if (
      typeof parsed.count !== "number" ||
      typeof parsed.lastCheckin !== "string"
    ) {
      return null;
    }
    return { count: parsed.count, lastCheckin: parsed.lastCheckin };
  } catch {
    return null;
  }
}

function write(userId: string, record: StreakRecord): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(record));
  } catch {
    /* storage full / disabled — streak is non-critical */
  }
}

/**
 * Current displayable streak. Returns 0 if the chain has been broken
 * (last check-in older than yesterday). Does not mutate storage.
 */
export function getDailyStreak(userId: string): number {
  const record = read(userId);
  if (!record) return 0;
  const gap = daysBetween(record.lastCheckin, localDayKey());
  if (gap <= 1) return Math.max(0, record.count);
  return 0;
}

/**
 * Record today's check-in and return the resulting streak.
 * - same day → unchanged
 * - next day → +1
 * - gap      → reset to 1
 */
export function recordDailyCheckin(userId: string): number {
  const today = localDayKey();
  const record = read(userId);

  if (!record) {
    write(userId, { count: 1, lastCheckin: today });
    return 1;
  }

  const gap = daysBetween(record.lastCheckin, today);
  if (gap === 0) return record.count;

  const next = gap === 1 ? record.count + 1 : 1;
  write(userId, { count: next, lastCheckin: today });
  return next;
}
