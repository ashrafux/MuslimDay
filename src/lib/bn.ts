const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

let currentLang: 'bn' | 'en' = 'bn';
export function setNumberLang(lang: 'bn' | 'en') {
  currentLang = lang;
}

/** Convert ASCII digits to Bangla digits (when the UI language is Bangla). */
export function n(value: string | number, force?: 'bn' | 'en'): string {
  const s = String(value);
  if ((force ?? currentLang) === 'en') return s;
  return s.replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

export const pad2 = (x: number) => String(x).padStart(2, '0');

/** Countdown like 03:08:11 */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return n(`${pad2(h)}:${pad2(m)}:${pad2(s)}`);
}

/** "1h 20m" style used on the profile stats */
export function formatHM(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export function dateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function keyToDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}
