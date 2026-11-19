import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_PLACE, type Place } from '../lib/locations';
import type { MethodId, PrayerId } from '../lib/prayer';
import { dateKey } from '../lib/bn';

export interface Settings {
  lang: 'bn' | 'en';
  theme: 'light' | 'dark' | 'system';
  place: Place;
  method: MethodId;
  madhab: 'hanafi' | 'shafi';
  hijriAdjust: number;
  time24: boolean;
}

export interface QuranSettings {
  arabicSize: number;
  translationSize: number;
  arabicFont: 'ar' | 'sch';
  showTranslation: boolean;
  showTransliteration: boolean;
  reciter: string;
}

export interface AlarmConfig {
  enabled: Record<PrayerId, boolean>;
  before: number; // minutes before waqt start for reminder, 0 = off
  endReminder: boolean; // remind 20 minutes before waqt ends if not marked
  sound: boolean;
}

export interface SilentConfig {
  enabled: boolean;
  minutes: number;
  prayers: Record<PrayerId, boolean>;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  time: number;
  read: boolean;
  link?: string;
}

export interface DuaList { id: string; name: string; duaIds: string[] }
export interface Bookmark { surah: number; ayah: number; time: number }
export interface LastRead { surah: number; ayah: number; time: number }
export type AmolType = 'check' | 'count';
/** A user-created deed. `days` = weekdays (0=Sun) it applies to, `hijriDays` = hijri dates; both empty = every day. */
export interface CustomAmol {
  id: string;
  title: string;
  group?: string;
  type?: AmolType;
  target?: number;
  unit?: string;
  days?: number[];
  hijriDays?: number[];
  reminder?: string; // "HH:MM" local time
  note?: string;
  link?: string;
}
export type PrayerMode = 'jamaat' | 'alone' | 'qaza';
export interface JournalEntry { mood?: number; text?: string }
export interface TasbihPreset { id: string; arabic: string; bn: string; target: number }
export interface Report { id: string; text: string; time: number; hasImage: boolean }

const allPrayers = (v: boolean): Record<PrayerId, boolean> => ({ fajr: v, dhuhr: v, asr: v, maghrib: v, isha: v });

interface State {
  settings: Settings;
  quran: QuranSettings;
  profile: { name: string; email: string; avatar: string };
  premium: { active: boolean; plan?: 'monthly' | 'yearly' | 'trial'; since?: number };
  onboarded: boolean;

  /** dateKey -> list of completed amol ids (prayers use the PrayerId) */
  amol: Record<string, string[]>;
  customAmol: CustomAmol[];
  /** dateKey -> amol id -> count, for counter-type deeds */
  amolCounts: Record<string, Record<string, number>>;
  /** dateKey -> how each fard prayer was performed */
  prayerMode: Record<string, Partial<Record<PrayerId, PrayerMode>>>;
  /** built-in deed ids the user turned off */
  hiddenAmol: string[];
  /** amal tracker sections the user collapsed */
  collapsedGroups: string[];
  /** amal categories the user turned off (none of their deeds count) */
  hiddenGroups: string[];
  /** the user's category order; categories missing from it follow in the default order */
  groupOrder: string[];
  /** main sunnah id -> sunnahs the user added to its checklist */
  customDetails: Record<string, { id: string; title: string }[]>;
  /** built-in sunnah id -> the name the user gave it */
  amolTitles: Record<string, string>;
  /** dateKey -> daily self-accountability (muhasaba) */
  journal: Record<string, JournalEntry>;
  qaza: Record<PrayerId | 'witr', number>;
  fasting: Record<string, 'fasted' | 'missed'>;

  tasbih: { presetId: string; count: number; total: number; history: { date: string; label: string; count: number }[] };
  tasbihPresets: TasbihPreset[];
  stats: { quranSeconds: number; duaSeconds: number };

  lastRead: LastRead[];
  bookmarks: Bookmark[];
  duaLists: DuaList[];
  favoriteDuas: string[];

  alarm: AlarmConfig;
  silent: SilentConfig;
  notifications: AppNotification[];
  firedKeys: string[];
  reports: Report[];

  set: <K extends keyof State>(key: K, value: State[K]) => void;
  updateSettings: (p: Partial<Settings>) => void;
  updateQuran: (p: Partial<QuranSettings>) => void;
  toggleAmol: (id: string, key?: string) => void;
  setAmolCount: (id: string, key: string, value: number, target: number) => void;
  addStat: (kind: 'quranSeconds' | 'duaSeconds', s: number) => void;
  setLastRead: (surah: number, ayah: number) => void;
  toggleBookmark: (surah: number, ayah: number) => void;
  pushNotification: (n: Omit<AppNotification, 'id' | 'time' | 'read'>, key?: string) => void;
}

export const DEFAULT_TASBIH: TasbihPreset[] = [
  { id: 'subhanallah', arabic: 'سُبْحَانَ اللّٰهِ', bn: 'সুবহানাল্লাহ', target: 33 },
  { id: 'alhamdulillah', arabic: 'اَلْحَمْدُ لِلّٰهِ', bn: 'আলহামদুলিল্লাহ', target: 33 },
  { id: 'allahuakbar', arabic: 'اَللّٰهُ أَكْبَرُ', bn: 'আল্লাহু আকবার', target: 34 },
  { id: 'astaghfirullah', arabic: 'أَسْتَغْفِرُ اللّٰهَ', bn: 'আস্তাগফিরুল্লাহ', target: 100 },
  { id: 'tahlil', arabic: 'لَا إِلٰهَ إِلَّا اللّٰهُ', bn: 'লা ইলাহা ইল্লাল্লাহ', target: 100 },
  { id: 'durud', arabic: 'اَللّٰهُمَّ صَلِّ عَلٰى مُحَمَّدٍ', bn: 'আল্লাহুম্মা সাল্লি আলা মুহাম্মাদ', target: 100 },
  { id: 'subhanallahi-wabihamdihi', arabic: 'سُبْحَانَ اللّٰهِ وَبِحَمْدِهِ', bn: 'সুবহানাল্লাহি ওয়া বিহামদিহি', target: 100 },
];

const welcome: AppNotification[] = [
  { id: 'w1', title: 'আমল ট্র্যাকারে স্বাগতম', body: 'নামাজের সময়, কুরআন, দোয়া ও দৈনিক আমল — সব এক জায়গায়। আজই আমল ট্র্যাক করা শুরু করুন।', time: Date.now(), read: false, link: '/amol' },
  { id: 'w2', title: 'নামাজের অ্যালার্ম চালু করুন', body: 'প্রতি ওয়াক্তে নোটিফিকেশন পেতে অ্যালার্ম সেটিংস থেকে অনুমতি দিন।', time: Date.now() - 60000, read: false, link: '/alarm' },
  { id: 'w3', title: 'সূরা আল কাহফ', body: "জুম'আর দিনে সূরা আল কাহফ তিলাওয়াতের ফজিলত অনেক।", time: Date.now() - 120000, read: false, link: '/quran/18' },
];

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      settings: { lang: 'bn', theme: 'light', place: DEFAULT_PLACE, method: 'ifb', madhab: 'hanafi', hijriAdjust: -1, time24: false },
      quran: { arabicSize: 30, translationSize: 18, arabicFont: 'ar', showTranslation: true, showTransliteration: false, reciter: 'ar.alafasy' },
      profile: { name: 'আপনার নাম', email: '', avatar: 'man' },
      premium: { active: false },
      onboarded: false,
      amol: {},
      customAmol: [],
      amolCounts: {},
      prayerMode: {},
      hiddenAmol: [],
      collapsedGroups: [],
      hiddenGroups: [],
      groupOrder: [],
      customDetails: {},
      amolTitles: {},
      journal: {},
      qaza: { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0, witr: 0 },
      fasting: {},
      tasbih: { presetId: 'subhanallah', count: 0, total: 0, history: [] },
      tasbihPresets: DEFAULT_TASBIH,
      stats: { quranSeconds: 0, duaSeconds: 0 },
      lastRead: [],
      bookmarks: [],
      duaLists: [],
      favoriteDuas: [],
      alarm: { enabled: allPrayers(true), before: 10, endReminder: true, sound: true },
      silent: { enabled: false, minutes: 20, prayers: allPrayers(true) },
      notifications: welcome,
      firedKeys: [],
      reports: [],

      set: (key, value) => set({ [key]: value } as Partial<State>),
      updateSettings: (p) => set({ settings: { ...get().settings, ...p } }),
      updateQuran: (p) => set({ quran: { ...get().quran, ...p } }),
      toggleAmol: (id, key = dateKey()) => {
        const cur = get().amol[key] ?? [];
        const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
        set({ amol: { ...get().amol, [key]: next } });
      },
      setAmolCount: (id, key, value, target) => {
        const v = Math.max(0, Math.round(value));
        const counts = { ...get().amolCounts, [key]: { ...(get().amolCounts[key] ?? {}), [id]: v } };
        const cur = (get().amol[key] ?? []).filter((x) => x !== id);
        set({ amolCounts: counts, amol: { ...get().amol, [key]: v >= target ? [...cur, id] : cur } });
      },
      addStat: (kind, s) => set({ stats: { ...get().stats, [kind]: get().stats[kind] + s } }),
      setLastRead: (surah, ayah) => {
        const rest = get().lastRead.filter((l) => l.surah !== surah);
        set({ lastRead: [{ surah, ayah, time: Date.now() }, ...rest].slice(0, 6) });
      },
      toggleBookmark: (surah, ayah) => {
        const b = get().bookmarks;
        const exists = b.some((x) => x.surah === surah && x.ayah === ayah);
        set({ bookmarks: exists ? b.filter((x) => !(x.surah === surah && x.ayah === ayah)) : [{ surah, ayah, time: Date.now() }, ...b] });
      },
      pushNotification: (nt, key) => {
        if (key && get().firedKeys.includes(key)) return;
        set({
          notifications: [{ ...nt, id: Math.random().toString(36).slice(2), time: Date.now(), read: false }, ...get().notifications].slice(0, 200),
          firedKeys: key ? [...get().firedKeys.slice(-300), key] : get().firedKeys,
        });
      },
    }),
    { name: 'amol-tracker', version: 1 }
  )
);

export const isBookmarked = (s: State, surah: number, ayah: number) => s.bookmarks.some((b) => b.surah === surah && b.ayah === ayah);
