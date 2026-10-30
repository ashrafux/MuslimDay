import type { CustomAmol, AmolType } from '../store/useStore';
import { useStore } from '../store/useStore';
import { dateKey, keyToDate } from './bn';
import { toHijri } from './dates';

export interface AmolDef {
  id: string;
  title: string;
  sub?: string;
  link?: string;
  group: string;
  type: AmolType;
  target: number;
  unit?: string;
  days?: number[];
  hijriDays?: number[];
  reminder?: string;
  note?: string;
  custom?: boolean;
  prayer?: boolean;
}

export const GROUP_FARD = 'ফরজ নামাজ';
export const GROUP_SUNNAH = 'সুন্নাত ও নফল';
export const GROUP_DHIKR = 'যিকর ও তিলাওয়াত';
export const GROUP_OTHER = 'অন্যান্য';
export const GROUP_AVOID = 'বর্জনীয় অভ্যাস';
export const GROUP_MINE = 'আমার আমল';
export const GROUP_ORDER = [GROUP_FARD, GROUP_SUNNAH, GROUP_DHIKR, GROUP_OTHER, GROUP_AVOID, GROUP_MINE];

const check = (id: string, title: string, group: string, extra: Partial<AmolDef> = {}): AmolDef => ({ id, title, group, type: 'check', target: 1, ...extra });

/** The 14 default deeds. */
export const BUILTIN: AmolDef[] = [
  check('fajr', 'ফজর', GROUP_FARD, { prayer: true }),
  check('dhuhr', "যোহর / জুম'আ", GROUP_FARD, { prayer: true }),
  check('asr', 'আসর', GROUP_FARD, { prayer: true }),
  check('maghrib', 'মাগরিব', GROUP_FARD, { prayer: true }),
  check('isha', 'ইশা', GROUP_FARD, { prayer: true }),
  check('witr', 'বিতর নামাজ', GROUP_SUNNAH, { sub: 'ওয়াজিব — ইশার পর থেকে ফজরের আগ পর্যন্ত' }),
  check('tahajjud', 'তাহাজ্জুদ', GROUP_SUNNAH, { sub: 'রাতের শেষ তৃতীয়াংশে' }),
  check('duha', 'ইশরাক / চাশত (দুহা)', GROUP_SUNNAH, { sub: 'সূর্যোদয়ের ১৫ মিনিট পর থেকে' }),
  check('quran', 'কুরআন তিলাওয়াত', GROUP_DHIKR, { sub: 'অন্তত এক পৃষ্ঠা', link: '/quran' }),
  check('morning-adhkar', 'সকালের যিকর', GROUP_DHIKR, { link: '/dua/c/adhkar' }),
  check('evening-adhkar', 'সন্ধ্যার যিকর', GROUP_DHIKR, { link: '/dua/c/adhkar' }),
  { id: 'istighfar', title: 'ইস্তিগফার', group: GROUP_DHIKR, type: 'count', target: 100, unit: 'বার', sub: 'আস্তাগফিরুল্লাহ' },
  { id: 'durud', title: 'দরুদ শরীফ পাঠ', group: GROUP_DHIKR, type: 'count', target: 10, unit: 'বার' },
  check('sadaqah', 'দান-সদকা', GROUP_OTHER, { sub: 'সামান্য হলেও' }),
];
export const BUILTIN_IDS = BUILTIN.map((b) => b.id);
export const PRAYER_DEFS = BUILTIN.filter((b) => b.prayer);

/** Ready-made deeds the user can add with one tap. */
export const LIBRARY: Omit<CustomAmol, 'id'>[] = [
  { title: "সূরা আল কাহফ তিলাওয়াত", group: GROUP_DHIKR, days: [5], link: '/quran/18', note: "জুম'আর দিনে" },
  { title: 'ঘুমানোর আগে সূরা আল মুলক', group: GROUP_DHIKR, link: '/quran/67' },
  { title: 'প্রতি নামাজের পর আয়াতুল কুরসী', group: GROUP_DHIKR, type: 'count', target: 5, unit: 'বার', link: '/quran/2?ayah=255' },
  { title: 'নামাজের পর তাসবীহে ফাতিমি (৩৩-৩৩-৩৪)', group: GROUP_DHIKR, type: 'count', target: 5, unit: 'ওয়াক্ত' },
  { title: 'সুবহানাল্লাহি ওয়া বিহামদিহি', group: GROUP_DHIKR, type: 'count', target: 100, unit: 'বার' },
  { title: 'কুরআন তিলাওয়াত (পৃষ্ঠা)', group: GROUP_DHIKR, type: 'count', target: 4, unit: 'পৃষ্ঠা', link: '/quran' },
  { title: 'একটি আয়াত মুখস্থ করা', group: GROUP_DHIKR },
  { title: 'সোমবার ও বৃহস্পতিবারের রোজা', group: GROUP_SUNNAH, days: [1, 4] },
  { title: 'আইয়ামে বীযের রোজা', group: GROUP_SUNNAH, hijriDays: [13, 14, 15], note: 'প্রতি হিজরি মাসের ১৩, ১৪, ১৫ তারিখ' },
  { title: 'আওয়াবীন নামাজ', group: GROUP_SUNNAH, note: 'মাগরিবের পর' },
  { title: 'তাহিয়্যাতুল অজু', group: GROUP_SUNNAH },
  { title: 'তাহিয়্যাতুল মসজিদ', group: GROUP_SUNNAH },
  { title: 'সুন্নাতে মুয়াক্কাদা (১২ রাকাত)', group: GROUP_SUNNAH, type: 'count', target: 12, unit: 'রাকাত' },
  { title: 'অজু অবস্থায় ঘুমানো', group: GROUP_OTHER },
  { title: 'মিসওয়াক করা', group: GROUP_OTHER },
  { title: 'পিতা-মাতার জন্য দোয়া', group: GROUP_OTHER },
  { title: 'একটি নতুন হাদিস শেখা', group: GROUP_OTHER, link: '/hadith' },
  { title: 'সালাম দেওয়া', group: GROUP_OTHER, type: 'count', target: 10, unit: 'জন' },
  { title: 'আত্মীয়ের খোঁজ নেওয়া', group: GROUP_OTHER },
  { title: 'গীবত থেকে বিরত থাকা', group: GROUP_AVOID },
  { title: 'মিথ্যা থেকে বিরত থাকা', group: GROUP_AVOID },
  { title: 'দৃষ্টির হেফাজত', group: GROUP_AVOID },
  { title: 'অপ্রয়োজনীয় সোশ্যাল মিডিয়া থেকে বিরত', group: GROUP_AVOID },
  { title: 'রাগ নিয়ন্ত্রণ', group: GROUP_AVOID },
];

export function customToDef(c: CustomAmol): AmolDef {
  const type = c.type ?? 'check';
  return {
    id: c.id, title: c.title, group: c.group || GROUP_MINE, type, target: type === 'count' ? Math.max(1, c.target ?? 1) : 1,
    unit: c.unit, days: c.days, hijriDays: c.hijriDays, reminder: c.reminder, note: c.note, link: c.link, custom: true,
    sub: c.note,
  };
}

export function appliesOn(def: Pick<AmolDef, 'days' | 'hijriDays'>, date: Date, hijriDay: number): boolean {
  const hasDays = !!def.days?.length;
  const hasHijri = !!def.hijriDays?.length;
  if (!hasDays && !hasHijri) return true;
  return (hasDays && def.days!.includes(date.getDay())) || (hasHijri && def.hijriDays!.includes(hijriDay));
}

/** Deeds that apply on a given date, in display order. */
export function itemsFor(date: Date, hijriAdjust: number, custom: CustomAmol[], hidden: string[]): AmolDef[] {
  const hd = toHijri(date, hijriAdjust).day;
  const builtin = BUILTIN.filter((b) => !hidden.includes(b.id));
  const mine = custom.map(customToDef).filter((c) => appliesOn(c, date, hd));
  return [...builtin, ...mine];
}

export function groupItems(items: AmolDef[]): { title: string; items: AmolDef[] }[] {
  const names = [...GROUP_ORDER, ...items.map((i) => i.group).filter((g) => !GROUP_ORDER.includes(g))];
  return [...new Set(names)].map((title) => ({ title, items: items.filter((i) => i.group === title) })).filter((g) => g.items.length);
}

export function useAmolItems(key = dateKey()) {
  const custom = useStore((s) => s.customAmol);
  const hidden = useStore((s) => s.hiddenAmol);
  const adj = useStore((s) => s.settings.hijriAdjust);
  return itemsFor(keyToDate(key), adj, custom, hidden);
}

export function useAmolProgress(key = dateKey()) {
  const items = useAmolItems(key);
  const done = useStore((s) => s.amol[key]) ?? [];
  const ids = new Set(items.map((i) => i.id));
  return { done: done.filter((d) => ids.has(d)).length, total: items.length };
}

/**
 * Consecutive applicable days (ending today, or yesterday if today isn't done yet) on which the deed was completed.
 * Days the deed doesn't apply to (e.g. a Monday/Thursday fast on a Tuesday) are skipped, not counted as breaks.
 */
export function streakOf(amol: Record<string, string[]>, def: AmolDef, hijriAdjust: number, today = new Date()): number {
  let n = 0;
  for (let i = 0; i < 400; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const scheduled = def.days?.length || def.hijriDays?.length;
    if (scheduled && !appliesOn(def, d, def.hijriDays?.length ? toHijri(d, hijriAdjust).day : 0)) continue;
    if ((amol[dateKey(d)] ?? []).includes(def.id)) n++;
    else if (i === 0) continue;
    else break;
  }
  return n;
}
