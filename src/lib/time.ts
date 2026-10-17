// Saudi Arabia is UTC+3 all year (no DST), so fixed-offset math is exact.
export const TZ = "Asia/Riyadh";
const OFFSET = 3 * 3600_000;
const DAY = 86400_000;

export function riyadhParts(d: Date) {
  const s = new Date(d.getTime() + OFFSET);
  return {
    y: s.getUTCFullYear(),
    m: s.getUTCMonth(),
    d: s.getUTCDate(),
    dow: s.getUTCDay(),
    h: s.getUTCHours(),
    min: s.getUTCMinutes(),
  };
}

export function riyadhDate(y: number, m: number, d: number, h = 0, min = 0) {
  return new Date(Date.UTC(y, m, d, h, min) - OFFSET);
}

export function startOfDay(d: Date = new Date()) {
  const p = riyadhParts(d);
  return riyadhDate(p.y, p.m, p.d);
}

export function addDays(d: Date, n: number) {
  return new Date(d.getTime() + n * DAY);
}

const pad = (n: number) => String(n).padStart(2, "0");

export function dayKey(d: Date) {
  const p = riyadhParts(d);
  return `${p.y}-${pad(p.m + 1)}-${pad(p.d)}`;
}

export function parseDayKey(s: string | undefined | null): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return riyadhDate(y, m - 1, d);
}

export type Lang = "ar" | "en";

function loc(lang: Lang) {
  return lang === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-GB";
}

export function fmtDate(d: Date | string | null | undefined, lang: Lang = "ar") {
  if (!d) return "—";
  return new Intl.DateTimeFormat(loc(lang), { timeZone: TZ, day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
}

export function fmtWeekday(d: Date | string, lang: Lang = "ar") {
  return new Intl.DateTimeFormat(loc(lang), { timeZone: TZ, weekday: "long", day: "numeric", month: "short" }).format(new Date(d));
}

export function fmtTime(d: Date | string | null | undefined, lang: Lang = "ar") {
  if (!d) return "—";
  return new Intl.DateTimeFormat(loc(lang), { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: true }).format(new Date(d));
}

export function fmtDateTime(d: Date | string | null | undefined, lang: Lang = "ar") {
  if (!d) return "—";
  return `${fmtDate(d, lang)} ${fmtTime(d, lang)}`;
}

export function ageYears(dob: Date, now: Date = new Date()) {
  return Math.max(0, (now.getTime() - dob.getTime()) / (365.25 * DAY));
}

export function minutesBetween(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 60000);
}
