import { n } from './bn';

export const WEEKDAYS_BN = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি'];
export const WEEKDAYS_BN_FULL = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
export const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const GREG_MONTHS_BN = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
export const GREG_MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const HIJRI_MONTHS_BN = ['মুহাররম', 'সফর', 'রবিউল আউয়াল', 'রবিউস সানি', 'জুমাদাল উলা', 'জুমাদাল আখিরাহ', 'রজব', 'শাবান', 'রমজান', 'শাওয়াল', 'জিলকদ', 'জিলহজ'];
export const HIJRI_MONTHS_EN = ['Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 'Jumada al-Ula', 'Jumada al-Akhirah', 'Rajab', "Sha'ban", 'Ramadan', 'Shawwal', "Dhu al-Qa'dah", 'Dhu al-Hijjah'];
export const BANGLA_MONTHS = ['বৈশাখ', 'জ্যৈষ্ঠ', 'আষাঢ়', 'শ্রাবণ', 'ভাদ্র', 'আশ্বিন', 'কার্তিক', 'অগ্রহায়ণ', 'পৌষ', 'মাঘ', 'ফাল্গুন', 'চৈত্র'];

export interface HijriDate { day: number; month: number; year: number }

const hijriFmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
  day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC',
});

/** Hijri date (Umm al-Qura) for a local calendar day, shifted by `adjust` days (Bangladesh moon-sighting is usually -1). */
export function toHijri(d: Date, adjust = 0): HijriDate {
  const utc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate() + adjust, 12));
  const parts = hijriFmt.formatToParts(utc);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { day: get('day'), month: get('month'), year: get('year') };
}

/** Find the Gregorian date for a hijri date by scanning (good enough for UI ranges). */
export function fromHijri(h: HijriDate, adjust = 0): Date | null {
  // Approximate start: Hijri epoch 622-07-16, mean month 29.530588 days
  const approxDays = (h.year - 1) * 354.36707 + (h.month - 1) * 29.530588 + (h.day - 1);
  const approx = new Date(Date.UTC(622, 6, 16) + approxDays * 86400000);
  const base = new Date(approx.getUTCFullYear(), approx.getUTCMonth(), approx.getUTCDate());
  for (let off = -5; off <= 5; off++) {
    const c = new Date(base);
    c.setDate(c.getDate() + off);
    const t = toHijri(c, adjust);
    if (t.day === h.day && t.month === h.month && t.year === h.year) return c;
  }
  return null;
}

export function formatHijri(h: HijriDate, lang: 'bn' | 'en', withYear = false): string {
  const months = lang === 'bn' ? HIJRI_MONTHS_BN : HIJRI_MONTHS_EN;
  return `${n(h.day)} ${months[h.month - 1]}${withYear ? ` ${n(h.year)}` : ''}`;
}

/** Bangladesh revised Bangla calendar (Bangla Academy, 2019 revision). */
export function toBangla(d: Date): { day: number; month: number; year: number } {
  const y = d.getFullYear();
  const start = new Date(y, 3, 14); // 14 April = 1 Boishakh
  const startYear = d >= start ? y : y - 1;
  const s = new Date(startYear, 3, 14);
  let days = Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(s.getFullYear(), s.getMonth(), s.getDate())) / 86400000);
  const leap = (yy: number) => (yy % 4 === 0 && yy % 100 !== 0) || yy % 400 === 0;
  const lengths = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, leap(startYear + 1) ? 30 : 29, 30];
  let m = 0;
  while (m < 11 && days >= lengths[m]) {
    days -= lengths[m];
    m++;
  }
  return { day: days + 1, month: m, year: startYear - 593 };
}

export function formatGregorian(d: Date, lang: 'bn' | 'en', withYear = false): string {
  const months = lang === 'bn' ? GREG_MONTHS_BN : GREG_MONTHS_EN;
  return `${n(d.getDate())} ${months[d.getMonth()]}${withYear ? ` ${n(d.getFullYear())}` : ''}`;
}

export function formatBangla(d: Date): string {
  const b = toBangla(d);
  return `${n(b.day, 'bn')} ${BANGLA_MONTHS[b.month]}`;
}

/** Calendar "today" for a given IANA timezone (as a local midnight Date). */
export function todayIn(tz: string, now = new Date()): Date {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return new Date(get('year'), get('month') - 1, get('day'));
}
