import type { CustomAmol, AmolType } from '../store/useStore';
import { useStore } from '../store/useStore';
import { dateKey, keyToDate } from './bn';
import { toHijri } from './dates';
import type { PrayerId } from './prayer';

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
  /** can't be switched off (ফরজ নামাজ) */
  required?: boolean;
  /** sub-heading inside its group (the নামাজ card splits into ফরজ / ওয়াজিব / সুন্নত / নফল); '' = no heading */
  section?: string;
  /** a main sunnah's own checklist, shown on its page; the deed counts as done once every shown detail is done */
  details?: AmolDetail[];
}

export interface AmolDetail {
  id: string;
  title: string;
  link?: string;
  /** a counter instead of a tick; it counts as done once it reaches `target` */
  type?: 'count';
  target?: number;
  unit?: string;
  /** a fard prayer: carries a জামাতে / একা / কাযা tag and can't be renamed or removed */
  prayer?: boolean;
}

/** One card for every prayer, split into sections */
export const GROUP_SALAH = 'নামাজ';
export const SECTION_FARD = 'ফরজ নামাজ';
export const SECTION_WAJIB = 'ওয়াজিব নামাজ';
export const SECTION_SUNNAH = 'সুন্নতে মুয়াক্কাদা';
export const SECTION_NAFL = 'নফল নামাজ';
/** Quran card, right after নামাজ */
export const GROUP_QURAN = 'কুরআন তিলাওয়াত ও অধ্যয়ন';
export const SECTION_RECITE = 'কুরআন তিলাওয়াত';
export const SECTION_HIFZ = 'কুরআন হিফজ';
export const SECTION_STUDY = 'কুরআন অধ্যয়ন';
/** Dhikr card, after কুরআন */
export const GROUP_DHIKR = 'যিকির ও দোয়া';
export const SECTION_ADHKAR = 'সকাল-সন্ধ্যার যিকির';
export const SECTION_POST_SALAH = 'নামাজ-পরবর্তী যিকির';
export const SECTION_ISTIGHFAR = 'ইস্তিগফার';
export const SECTION_DURUD = 'দরুদ শরিফ';
export const SECTION_TASBIH = 'তাসবিহ ও তাহলিল';
export const SECTION_DUAS = 'দৈনন্দিন দোয়া';
/** Daily sunnah card, after যিকির ও দোয়া */
export const GROUP_DAILY_SUNNAH = 'দৈনন্দিন সুন্নাহ';
export const SECTION_PURITY = 'পবিত্রতা ও পরিচ্ছন্নতা';
export const SECTION_SLEEP = 'ঘুমের সুন্নাহ';
export const SECTION_EATING = 'খাবার ও পানীয়ের সুন্নাহ';
export const SECTION_CLOTHING = 'পোশাক ও ব্যক্তিগত আচার';
export const SECTION_MANNERS = 'দৈনন্দিন আদব ও সুন্নাহ';
/** Character and the rights of people, after দৈনন্দিন সুন্নাহ */
export const GROUP_AKHLAQ = 'আখলাক ও বান্দার হক';
export const SECTION_PARENTS = 'পিতা-মাতার হক';
export const SECTION_KIN = 'আত্মীয়তার সম্পর্ক';
export const SECTION_NEIGHBOUR = 'প্রতিবেশীর হক';
export const SECTION_CONDUCT = 'উত্তম আচরণ';
/** Things to stay away from; a deed is ticked when the user kept away from it */
export const GROUP_AVOID = 'বর্জনীয় বিষয়';
export const SECTION_TONGUE = 'জিহ্বার গুনাহ';
export const SECTION_HEART = 'অন্তর ও দৃষ্টির গুনাহ';
export const SECTION_HABITS = 'বদঅভ্যাস';
export const SECTION_UNETHICAL = 'অনৈতিক কাজ';
/** The user's own list; always shown, even before anything is added */
export const GROUP_MINE = 'ব্যক্তিগত আমল';
/** Section for the user's own deeds inside a sectioned card */
export const SECTION_MINE = 'নিজের যোগ করা';
/** Group names that were renamed; saved custom deeds may still carry the old one */
// "অন্যান্য" was removed; the user's own deeds there move to ব্যক্তিগত আমল
const LEGACY_GROUPS: Record<string, string> = { 'যিকর ও তিলাওয়াত': GROUP_DHIKR, 'বর্জনীয় অভ্যাস': GROUP_AVOID, 'আমার আমল': GROUP_MINE, 'অন্যান্য': GROUP_MINE };
export const normalizeGroup = (g: string | undefined) => (g && LEGACY_GROUPS[g]) || g;
export const GROUP_SUNNAH = 'সুন্নাত ও নফল';
export const GROUP_ORDER = [GROUP_SALAH, GROUP_QURAN, GROUP_DHIKR, GROUP_DAILY_SUNNAH, GROUP_AKHLAQ, GROUP_AVOID, GROUP_SUNNAH, GROUP_MINE];

const check = (id: string, title: string, group: string, extra: Partial<AmolDef> = {}): AmolDef => ({ id, title, group, type: 'check', target: 1, ...extra });
/** A main item: one row in its card whose checklist opens on its own page (দৈনন্দিন সুন্নাহ, আখলাক, বর্জনীয়) */
const mainItem = (group: string) => (id: string, title: string, details: AmolDetail[]) =>
  check(id, title, group, { section: '', link: `/sunnah/${id}`, details });
const mainSunnah = mainItem(GROUP_DAILY_SUNNAH);
const mainAkhlaq = mainItem(GROUP_AKHLAQ);
const mainAvoid = mainItem(GROUP_AVOID);
const mainDhikr = mainItem(GROUP_DHIKR);
const mainSalah = mainItem(GROUP_SALAH);
const mainQuran = mainItem(GROUP_QURAN);

/** The default deeds. Ids are stored in saved progress, so never rename one. */
export const BUILTIN: AmolDef[] = [
  // নামাজ and কুরআন work like দৈনন্দিন সুন্নাহ; the detail ids are the deeds' old ids (fard prayers keep their
  // PrayerId), so saved ticks, জামাতে tags, streaks and prayer statistics carry over
  { ...mainSalah('salah-fard', SECTION_FARD, [
    { id: 'fajr', title: 'ফজর', prayer: true },
    { id: 'dhuhr', title: "যোহর / জুম'আ", prayer: true },
    { id: 'asr', title: 'আসর', prayer: true },
    { id: 'maghrib', title: 'মাগরিব', prayer: true },
    { id: 'isha', title: 'ইশা', prayer: true },
  ]), required: true },
  mainSalah('salah-wajib', SECTION_WAJIB, [
    { id: 'witr', title: 'বিতর' },
  ]),
  // the twelve rakats of sunnah muakkadah
  mainSalah('salah-sunnah', SECTION_SUNNAH, [
    { id: 'sunnah-fajr', title: 'ফজরের ২ রাকাত' },
    { id: 'sunnah-dhuhr-before', title: 'যোহরের ৪ রাকাত' },
    { id: 'sunnah-dhuhr-after', title: 'যোহরের ২ রাকাত' },
    { id: 'sunnah-maghrib', title: 'মাগরিবের ২ রাকাত' },
    { id: 'sunnah-isha', title: 'ইশার ২ রাকাত' },
  ]),
  // 'duha' used to be one "ইশরাক / চাশত" item; its saved ticks count as ইশরাক
  mainSalah('salah-nafl', SECTION_NAFL, [
    { id: 'tahajjud', title: 'তাহাজ্জুদ' },
    { id: 'duha', title: 'ইশরাক' },
    { id: 'chasht', title: 'চাশত' },
  ]),
  // 'quran' was the single "কুরআন তিলাওয়াত" deed under যিকর; it keeps its id and saved ticks
  mainQuran('quran-recite', SECTION_RECITE, [
    { id: 'quran', title: 'দৈনিক কুরআন তিলাওয়াত', link: '/quran' },
    { id: 'quran-pages', title: 'নির্ধারিত পৃষ্ঠা পড়া' },
    { id: 'surah-mulk', title: 'সূরা আল মুলক', link: '/quran/67' },
    { id: 'surah-waqiah', title: 'সূরা আল ওয়াকিয়াহ', link: '/quran/56' },
    { id: 'surah-sajdah', title: 'সূরা আস সাজদাহ', link: '/quran/32' },
  ]),
  mainQuran('quran-hifz', SECTION_HIFZ, [
    { id: 'hifz-new', title: 'নতুন আয়াত মুখস্থ' },
    { id: 'hifz-revise', title: 'পূর্বের মুখস্থ পুনরাবৃত্তি' },
    { id: 'hifz-surah', title: 'সূরা মুখস্থ' },
  ]),
  mainQuran('quran-study', SECTION_STUDY, [
    { id: 'study-meaning', title: 'বাংলা অর্থ পড়া' },
    { id: 'study-tafsir', title: 'তাফসির অধ্যয়ন' },
    { id: 'study-reflect', title: 'কুরআনের আয়াত নিয়ে চিন্তা' },
  ]),
  // যিকির ও দোয়া works like দৈনন্দিন সুন্নাহ; the detail ids were the deeds' ids before, so saved ticks and counts carry over
  mainDhikr('dhikr-adhkar', SECTION_ADHKAR, [
    { id: 'morning-adhkar', title: 'সকালের যিকির', link: '/dua/c/adhkar' },
    { id: 'evening-adhkar', title: 'সন্ধ্যার যিকির', link: '/dua/c/adhkar' },
  ]),
  mainDhikr('dhikr-post-salah', SECTION_POST_SALAH, [
    { id: 'post-fajr-adhkar', title: 'ফজরের পরের যিকির' },
    { id: 'post-maghrib-adhkar', title: 'মাগরিবের পরের যিকির' },
    { id: 'post-salah-adhkar', title: 'অন্যান্য ফরজ নামাজের পরের যিকির' },
  ]),
  mainDhikr('dhikr-istighfar', SECTION_ISTIGHFAR, [
    { id: 'astaghfirullah', title: 'আস্তাগফিরুল্লাহ' },
    { id: 'sayyidul-istighfar', title: 'সাইয়িদুল ইস্তিগফার', link: '/dua/d/adhkar-sayyidul-istighfar' },
    { id: 'istighfar', title: 'দৈনিক ইস্তিগফার (নির্দিষ্ট সংখ্যা)', type: 'count', target: 100, unit: 'বার' },
  ]),
  mainDhikr('dhikr-durud', SECTION_DURUD, [
    { id: 'durud', title: 'দরুদে ইবরাহিম', type: 'count', target: 10, unit: 'বার' },
    { id: 'durud-other', title: 'অন্যান্য দরুদ' },
  ]),
  mainDhikr('dhikr-tasbih', SECTION_TASBIH, [
    { id: 'tasbih-subhanallah', title: 'সুবহানাল্লাহ' },
    { id: 'tasbih-alhamdulillah', title: 'আলহামদুলিল্লাহ' },
    { id: 'tasbih-allahu-akbar', title: 'আল্লাহু আকবার' },
    { id: 'tahlil', title: 'লা ইলাহা ইল্লাল্লাহ' },
    { id: 'tasbih-bihamdihi', title: 'সুবহানাল্লাহি ওয়া বিহামদিহি' },
  ]),
  mainDhikr('dhikr-duas', SECTION_DUAS, [
    { id: 'dua-sleep', title: 'ঘুমানোর দোয়া', link: '/dua/d/daily-before-sleep' },
    { id: 'dua-waking', title: 'ঘুম থেকে ওঠার দোয়া', link: '/dua/d/daily-after-waking' },
    { id: 'dua-eating', title: 'খাবারের আগে ও পরে দোয়া', link: '/dua/d/daily-before-eating' },
    { id: 'dua-home', title: 'বাহিরে যাওয়ার ও ঘরে প্রবেশের দোয়া', link: '/dua/d/daily-leaving-home' },
  ]),
  // the five main sunnahs; detail ids are stored in saved progress like any deed, so never rename one
  mainSunnah('sunnah-purity', SECTION_PURITY, [
    { id: 'sunnah-wudu', title: 'ওজু অবস্থায় থাকা' },
    { id: 'sunnah-miswak', title: 'মিসওয়াক করা' },
    { id: 'sunnah-nails', title: 'নখ কাটা (নিয়মিত)' },
    { id: 'sunnah-clean', title: 'শরীর ও পোশাক পরিষ্কার রাখা' },
  ]),
  mainSunnah('sunnah-sleep', SECTION_SLEEP, [
    { id: 'sleep-wudu', title: 'ঘুমানোর আগে ওজু করা' },
    { id: 'sleep-three-quls', title: 'তিন কুল (ইখলাস, ফালাক, নাস) পড়া', link: '/quran/112' },
    { id: 'sleep-mulk', title: 'সুরা মুলক পড়া', link: '/quran/67' },
    { id: 'sleep-right-side', title: 'ডান কাতে ঘুমানো' },
    { id: 'sleep-waking-dua', title: 'ঘুম থেকে উঠেই দোয়া পড়া', link: '/dua/d/daily-after-waking' },
  ]),
  mainSunnah('sunnah-eating', SECTION_EATING, [
    { id: 'eat-bismillah', title: 'বিসমিল্লাহ বলে খাওয়া' },
    { id: 'eat-right-hand', title: 'ডান হাতে খাওয়া' },
    { id: 'eat-alhamdulillah', title: 'খাবার শেষে আলহামদুলিল্লাহ বলা' },
    { id: 'drink-sitting', title: 'বসে পানি পান করা' },
  ]),
  mainSunnah('sunnah-clothing', SECTION_CLOTHING, [
    { id: 'dress-right', title: 'ডান দিক থেকে পোশাক পরা' },
    { id: 'dress-tidy', title: 'পরিচ্ছন্ন ও পরিপাটি থাকা' },
    { id: 'dress-modest', title: 'সুন্দর ও শালীন পোশাক পরিধান করা' },
  ]),
  mainSunnah('sunnah-manners', SECTION_MANNERS, [
    { id: 'manners-salam', title: 'সালাম দেওয়া ও সালামের উত্তর দেওয়া' },
    { id: 'manners-home-dua', title: 'ঘরে প্রবেশের দোয়া পড়া', link: '/dua/d/daily-entering-home' },
    { id: 'manners-mosque-dua', title: 'মসজিদে প্রবেশের দোয়া পড়া', link: '/dua/d/salat-enter-mosque' },
    { id: 'manners-sneeze', title: "হাঁচি দিলে 'আলহামদুলিল্লাহ' বলা", link: '/dua/d/daily-sneezing' },
  ]),
  // আখলাক and বর্জনীয় work like দৈনন্দিন সুন্নাহ; the detail ids were the deeds' ids before, so saved ticks carry over
  mainAkhlaq('akhlaq-parents', SECTION_PARENTS, [
    { id: 'parents-kindness', title: 'পিতা-মাতার সাথে সদ্ব্যবহার' },
    { id: 'parents-care', title: 'পিতা-মাতার খোঁজখবর নেওয়া' },
    { id: 'parents-dua', title: 'পিতা-মাতার জন্য দোয়া করা' },
  ]),
  mainAkhlaq('akhlaq-kin', SECTION_KIN, [
    { id: 'kin-care', title: 'আত্মীয়ের খোঁজখবর নেওয়া' },
  ]),
  mainAkhlaq('akhlaq-neighbour', SECTION_NEIGHBOUR, [
    { id: 'neighbour-care', title: 'প্রতিবেশীর খোঁজখবর নেওয়া' },
    { id: 'neighbour-no-harm', title: 'প্রতিবেশীকে কষ্ট না দেওয়া' },
  ]),
  mainAkhlaq('akhlaq-conduct', SECTION_CONDUCT, [
    { id: 'conduct-smile', title: 'হাসিমুখে কথা বলা' },
    { id: 'conduct-forgive', title: 'কাউকে ক্ষমা করা' },
    { id: 'conduct-promise', title: 'ওয়াদা রক্ষা করা' },
    { id: 'conduct-help', title: 'কারো উপকার করা' },
  ]),
  mainAvoid('avoid-tongue', SECTION_TONGUE, [
    { id: 'avoid-backbiting', title: 'গীবত থেকে বিরত থাকা' },
    { id: 'avoid-lying', title: 'মিথ্যা থেকে বিরত থাকা' },
    { id: 'avoid-foul-speech', title: 'গালি ও অশ্লীল কথা থেকে বিরত থাকা' },
  ]),
  mainAvoid('avoid-heart', SECTION_HEART, [
    { id: 'avoid-gaze', title: 'দৃষ্টির হেফাজত' },
    { id: 'avoid-envy-pride', title: 'হিংসা ও অহংকার থেকে বিরত থাকা' },
  ]),
  mainAvoid('avoid-habits', SECTION_HABITS, [
    { id: 'avoid-social-media', title: 'অপ্রয়োজনীয় সোশ্যাল মিডিয়া থেকে বিরত থাকা' },
    { id: 'avoid-anger', title: 'রাগ নিয়ন্ত্রণ করা' },
  ]),
  mainAvoid('avoid-unethical', SECTION_UNETHICAL, [
    { id: 'avoid-deceit', title: 'প্রতারণা ও অসততা থেকে বিরত থাকা' },
    { id: 'avoid-haram-income', title: 'হারাম উপার্জন থেকে বিরত থাকা' },
  ]),
];
export const BUILTIN_IDS = BUILTIN.map((b) => b.id);

/** Ready-made deeds the user can add with one tap. */
export const LIBRARY: Omit<CustomAmol, 'id'>[] = [
  { title: "সূরা আল কাহফ তিলাওয়াত", group: GROUP_QURAN, days: [5], link: '/quran/18', note: "জুম'আর দিনে" },
  { title: 'প্রতি নামাজের পর আয়াতুল কুরসী', group: GROUP_DHIKR, type: 'count', target: 5, unit: 'বার', link: '/quran/2?ayah=255' },
  { title: 'নামাজের পর তাসবীহে ফাতিমি (৩৩-৩৩-৩৪)', group: GROUP_DHIKR, type: 'count', target: 5, unit: 'ওয়াক্ত' },
  { title: 'সোমবার ও বৃহস্পতিবারের রোজা', group: GROUP_SUNNAH, days: [1, 4] },
  { title: 'আইয়ামে বীযের রোজা', group: GROUP_SUNNAH, hijriDays: [13, 14, 15], note: 'প্রতি হিজরি মাসের ১৩, ১৪, ১৫ তারিখ' },
  { title: 'আওয়াবীন নামাজ', group: GROUP_SUNNAH, note: 'মাগরিবের পর' },
  { title: 'তাহিয়্যাতুল অজু', group: GROUP_SUNNAH },
  { title: 'তাহিয়্যাতুল মসজিদ', group: GROUP_SUNNAH },
  { title: 'একটি নতুন হাদিস শেখা', group: GROUP_MINE, link: '/hadith' },
];

export function customToDef(c: CustomAmol): AmolDef {
  const type = c.type ?? 'check';
  return {
    id: c.id, title: c.title, group: normalizeGroup(c.group) || GROUP_MINE, type, target: type === 'count' ? Math.max(1, c.target ?? 1) : 1,
    unit: c.unit, days: c.days, hijriDays: c.hijriDays, reminder: c.reminder, note: c.note, link: c.link, custom: true,
    sub: c.note,
    // a tick-type deed in ব্যক্তিগত আমল opens its own page, where the user can give it a checklist
    ...(personalMain(c) ? { section: '', link: `/sunnah/${c.id}`, details: [] } : {}),
  };
}

/** Whether a user's deed is a main item with its own checklist page */
const personalMain = (c: CustomAmol) => (normalizeGroup(c.group) || GROUP_MINE) === GROUP_MINE && (c.type ?? 'check') === 'check' && !c.link;

/** What one entry of a category's checklist is called on its page */
const DETAIL_NOUN: Record<string, string> = { [GROUP_SALAH]: 'নামাজ', [GROUP_DAILY_SUNNAH]: 'সুন্নাহ', [GROUP_AVOID]: 'বিষয়' };
export const detailNoun = (group: string) => DETAIL_NOUN[group] ?? 'আমল';

export function appliesOn(def: Pick<AmolDef, 'days' | 'hijriDays'>, date: Date, hijriDay: number): boolean {
  const hasDays = !!def.days?.length;
  const hasHijri = !!def.hijriDays?.length;
  if (!hasDays && !hasHijri) return true;
  return (hasDays && def.days!.includes(date.getDay())) || (hasHijri && def.hijriDays!.includes(hijriDay));
}

/** Deeds that apply on a given date, in display order. Turned-off deeds and categories are left out. */
export function itemsFor(date: Date, hijriAdjust: number, custom: CustomAmol[], hidden: string[], hiddenGroups: string[] = []): AmolDef[] {
  const hd = toHijri(date, hijriAdjust).day;
  const builtin = BUILTIN.filter((b) => !hidden.includes(b.id));
  const mine = custom.map(customToDef).filter((c) => !hidden.includes(c.id) && appliesOn(c, date, hd));
  return [...builtin, ...mine].filter((i) => !hiddenGroups.includes(i.group));
}

/** Category names in display order: the user's order first, then the defaults, then any custom category names. */
export function orderGroups(names: string[], userOrder: string[] = []): string[] {
  return [...new Set([...userOrder, ...GROUP_ORDER, ...names])].filter((g) => names.includes(g));
}

/** Every category that has at least one deed, built-in or the user's own, in display order. */
export function allGroups(custom: CustomAmol[], userOrder: string[] = []): string[] {
  return orderGroups([...BUILTIN.map((b) => b.group), ...custom.map((c) => customToDef(c).group), GROUP_MINE], userOrder);
}

/** Deeds grouped by category in display order; `always` lists categories shown even with no deeds (ব্যক্তিগত আমল) */
export function groupItems(items: AmolDef[], userOrder: string[] = [], always: string[] = []): { title: string; items: AmolDef[] }[] {
  return orderGroups([...items.map((i) => i.group), ...always], userOrder).map((title) => ({ title, items: items.filter((i) => i.group === title) }));
}

/** A group's items split by `section`, in first-seen order; the user's own deeds (no section) come last under SECTION_MINE. */
export function sectionItems(items: AmolDef[]): { title: string; items: AmolDef[] }[] {
  const sec = (i: AmolDef) => i.section ?? SECTION_MINE;
  const order = [...new Set(items.map(sec))];
  return order.map((title) => ({ title, items: items.filter((i) => sec(i) === title) }));
}

/** A main sunnah's checklist: the built-in sunnahs (with any name the user gave them), then the ones the user added */
export const allDetails = (def: AmolDef, added: Record<string, AmolDetail[]> = {}, titles: Record<string, string> = {}) =>
  [...(def.details ?? []), ...(added[def.id] ?? [])].map((d) => (titles[d.id] ? { ...d, title: titles[d.id] } : d));

/** A main sunnah's details the user hasn't turned off */
export const shownDetails = (def: AmolDef, hidden: string[], added: Record<string, AmolDetail[]> = {}, titles: Record<string, string> = {}) =>
  allDetails(def, added, titles).filter((d) => !hidden.includes(d.id));

/** After the checklist itself changes (a sunnah added or removed), tick or clear the main sunnah to match, for one day */
export function syncMainSunnah(key: string, def: AmolDef) {
  const st = useStore.getState();
  const cur = st.amol[key] ?? [];
  const shown = shownDetails(def, st.hiddenAmol, st.customDetails);
  if (shown.length === 0) return;
  const all = shown.every((d) => cur.includes(d.id));
  if (all === cur.includes(def.id)) return;
  st.set('amol', { ...st.amol, [key]: all ? [...cur, def.id] : cur.filter((x) => x !== def.id) });
}

/** Tick or clear a main sunnah together with all its details, for one day */
export function setMainSunnahDone(key: string, def: AmolDef, on: boolean) {
  const shown = shownDetails(def, useStore.getState().hiddenAmol, useStore.getState().customDetails);
  for (const d of shown) if (d.type === 'count' && d.target) useStore.getState().setAmolCount(d.id, key, on ? d.target : 0, d.target);
  const st = useStore.getState();
  const cur = st.amol[key] ?? [];
  const ids = [def.id, ...shown.filter((d) => d.type !== 'count').map((d) => d.id)];
  const next = on ? [...new Set([...cur, ...ids])] : cur.filter((x) => !ids.includes(x));
  st.set('amol', { ...st.amol, [key]: next });
  const prayers = shown.filter((d) => d.prayer).map((d) => d.id as PrayerId);
  if (prayers.length) {
    const dayModes = { ...(st.prayerMode[key] ?? {}) };
    for (const p of prayers) {
      if (!on) delete dayModes[p];
      else if (!dayModes[p]) dayModes[p] = 'jamaat';
    }
    st.set('prayerMode', { ...st.prayerMode, [key]: dayModes });
  }
}

/** After a detail changes somewhere else (the Tasbih counter), keep its main item in step */
export function syncMainsOf(key: string, detailId: string) {
  for (const def of BUILTIN) if (def.details?.some((d) => d.id === detailId)) syncMainSunnah(key, def);
}

/** How much of a deed is done on a day, 0–1: a main item counts its shown checklist, anything else is done or not */
export function itemScore(def: AmolDef, doneIds: string[], hidden: string[], added: Record<string, AmolDetail[]> = {}) {
  const shown = def.details ? shownDetails(def, hidden, added) : [];
  if (shown.length) return shown.filter((d) => doneIds.includes(d.id)).length / shown.length;
  return doneIds.includes(def.id) ? 1 : 0;
}

/** Tick or clear one detail; the main sunnah follows (done only when every shown detail is done) */
export function toggleSunnahDetail(key: string, def: AmolDef, detailId: string) {
  const st = useStore.getState();
  const cur = st.amol[key] ?? [];
  const withDetail = cur.includes(detailId) ? cur.filter((x) => x !== detailId) : [...cur, detailId];
  const shown = shownDetails(def, st.hiddenAmol, st.customDetails);
  const all = shown.length > 0 && shown.every((d) => withDetail.includes(d.id));
  const next = [...withDetail.filter((x) => x !== def.id), ...(all ? [def.id] : [])];
  st.set('amol', { ...st.amol, [key]: next });
}

export function useAmolItems(key = dateKey()) {
  const custom = useStore((s) => s.customAmol);
  const hidden = useStore((s) => s.hiddenAmol);
  const hiddenGroups = useStore((s) => s.hiddenGroups);
  const adj = useStore((s) => s.settings.hijriAdjust);
  return itemsFor(keyToDate(key), adj, custom, hidden, hiddenGroups);
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
