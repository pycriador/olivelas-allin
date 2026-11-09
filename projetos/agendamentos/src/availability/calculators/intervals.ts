/**
 * Interval math + timezone helpers used by the Availability Engine.
 * Everything is expressed in "minutes from local midnight" of a given date.
 */

export interface Interval {
  start: number;
  end: number;
}

export function parseHm(value: string): number {
  const [h, m] = value.split(":");
  return Number(h) * 60 + Number(m ?? 0);
}

export function formatHm(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function tzOffsetMinutes(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(
    dtf.formatToParts(date).map((p) => [p.type, p.value]),
  ) as Record<string, string>;
  const asUTC = Date.UTC(
    Number(parts["year"]),
    Number(parts["month"]) - 1,
    Number(parts["day"]),
    Number(parts["hour"]) % 24,
    Number(parts["minute"]),
    Number(parts["second"]),
  );
  return (asUTC - date.getTime()) / 60000;
}

/** Converts an ISO timestamp into minutes from local midnight of `dateStr`. */
export function toLocalMinutes(iso: string, dateStr: string, timeZone: string): number {
  const date = new Date(iso);
  const offset = tzOffsetMinutes(date, timeZone);
  const local = date.getTime() + offset * 60000;
  const midnight = Date.parse(`${dateStr}T00:00:00Z`);
  return Math.round((local - midnight) / 60000);
}

/** Converts minutes from local midnight of `dateStr` into an ISO timestamp. */
export function toIso(dateStr: string, minutes: number, timeZone: string): string {
  const guess = Date.parse(`${dateStr}T00:00:00Z`) + minutes * 60000;
  let offset = tzOffsetMinutes(new Date(guess), timeZone);
  let result = guess - offset * 60000;
  offset = tzOffsetMinutes(new Date(result), timeZone);
  result = guess - offset * 60000;
  return new Date(result).toISOString();
}

/** Local weekday (0=Sunday) for a YYYY-MM-DD date string. */
export function weekdayOf(dateStr: string): number {
  return new Date(`${dateStr}T12:00:00Z`).getUTCDay();
}

export function mergeIntervals(intervals: Interval[]): Interval[] {
  const sorted = [...intervals]
    .filter((i) => i.end > i.start)
    .sort((a, b) => a.start - b.start);
  const out: Interval[] = [];
  for (const cur of sorted) {
    const last = out[out.length - 1];
    if (last && cur.start <= last.end) {
      last.end = Math.max(last.end, cur.end);
    } else {
      out.push({ ...cur });
    }
  }
  return out;
}

/** base minus busy → remaining free windows. */
export function subtractIntervals(base: Interval[], busy: Interval[]): Interval[] {
  const merged = mergeIntervals(busy);
  let result = base.filter((b) => b.end > b.start).map((b) => ({ ...b }));
  for (const b of merged) {
    const next: Interval[] = [];
    for (const win of result) {
      if (b.end <= win.start || b.start >= win.end) {
        next.push(win);
        continue;
      }
      if (b.start > win.start) next.push({ start: win.start, end: b.start });
      if (b.end < win.end) next.push({ start: b.end, end: win.end });
    }
    result = next;
  }
  return result.filter((i) => i.end > i.start);
}

export function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}

export function clampIntervals(intervals: Interval[], bound: Interval): Interval[] {
  return intervals
    .map((i) => ({ start: Math.max(i.start, bound.start), end: Math.min(i.end, bound.end) }))
    .filter((i) => i.end > i.start);
}

/** Generates candidate start times inside free windows. */
export function generateSlots(
  windows: Interval[],
  durationMinutes: number,
  granularity: number,
  gap = 0,
): Interval[] {
  const step = Math.max(5, granularity);
  const slots: Interval[] = [];
  for (const win of windows) {
    let cursor = Math.ceil(win.start / step) * step;
    while (cursor + durationMinutes + gap <= win.end + (gap > 0 ? gap : 0)) {
      const end = cursor + durationMinutes;
      if (end > win.end) break;
      slots.push({ start: cursor, end });
      cursor += step;
    }
  }
  return slots;
}

export function totalMinutes(intervals: Interval[]): number {
  return mergeIntervals(intervals).reduce((sum, i) => sum + (i.end - i.start), 0);
}
