import { SURAH_INDEX } from '../data/surahIndex';
import { surahNamesBn, surahMeaningsBn } from '../data/surahMeta';

export interface Verse { id: number; text: string; translation: string; transliteration?: string }
export interface Chapter { id: number; name: string; transliteration: string; translation: string; type: string; total_verses: number; verses: Verse[] }

export interface SurahInfo { n: number; arabic: string; en: string; bn: string; meaning: string; verses: number; meccan: boolean }

export const SURAHS: SurahInfo[] = SURAH_INDEX.map(([arabic, en, verses, meccan], i) => ({
  n: i + 1, arabic, en, bn: surahNamesBn[i] ?? en, meaning: surahMeaningsBn[i] ?? '', verses, meccan: meccan === 1,
}));

/** Global ayah number (1..6236) used by audio CDNs. */
const offsets: number[] = [];
SURAHS.reduce((acc, s) => { offsets.push(acc); return acc + s.verses; }, 0);
export const globalAyah = (surah: number, ayah: number) => offsets[surah - 1] + ayah;

const cache = new Map<number, Promise<Chapter>>();
export function loadChapter(n: number): Promise<Chapter> {
  if (!cache.has(n)) {
    const p = fetch(`${import.meta.env.BASE_URL}quran/${n}.json`).then((r) => {
      if (!r.ok) throw new Error('load failed');
      return r.json() as Promise<Chapter>;
    });
    p.catch(() => cache.delete(n));
    cache.set(n, p);
  }
  return cache.get(n)!;
}

export const RECITERS = [
  { id: 'ar.alafasy', name: 'মিশারি রাশিদ আল-আফাসি' },
  { id: 'ar.abdurrahmaansudais', name: 'আব্দুর রহমান আস-সুদাইস' },
  { id: 'ar.husary', name: 'মাহমুদ খলিল আল-হুসারি' },
  { id: 'ar.minshawi', name: 'মুহাম্মাদ সিদ্দিক আল-মিনশাভি' },
  { id: 'ar.mahermuaiqly', name: 'মাহের আল-মুয়াইকিলি' },
];

export const surahAudioUrl = (reciter: string, n: number) => `https://cdn.islamic.network/quran/audio-surah/128/${reciter}/${n}.mp3`;
export const ayahAudioUrl = (reciter: string, surah: number, ayah: number) =>
  `https://cdn.islamic.network/quran/audio/128/${reciter}/${globalAyah(surah, ayah)}.mp3`;

/** Bangla tafsir (Tafsir Ahsanul Bayaan, via quran.com public API). Needs internet. */
export const TAFSIRS = [
  { id: 165, name: 'তাফসীরে আহসানুল বায়ান' },
  { id: 166, name: 'তাফসীরে আবু বকর যাকারিয়া' },
  { id: 164, name: 'তাফসীর ইবনে কাসীর' },
  { id: 381, name: 'তাফসীর ফাতহুল মাজীদ' },
];

export async function loadTafsir(tafsirId: number, surah: number, ayah: number): Promise<string> {
  const key = `tafsir:${tafsirId}:${surah}:${ayah}`;
  const cached = sessionStorage.getItem(key);
  if (cached) return cached;
  const r = await fetch(`https://api.quran.com/api/v4/tafsirs/${tafsirId}/by_ayah/${surah}:${ayah}`);
  if (!r.ok) throw new Error('tafsir');
  const j = await r.json();
  const text: string = j?.tafsir?.text ?? '';
  try { sessionStorage.setItem(key, text); } catch { /* quota */ }
  return text;
}

export const QUICK_LINKS = [
  { label: 'আয়াতুল কুরসী', surah: 2, ayah: 255 },
  { label: 'সূরা ইয়াসীন', surah: 36, ayah: 1 },
  { label: 'সূরা আল কাহফ', surah: 18, ayah: 1 },
  { label: 'সূরা আল মুলক', surah: 67, ayah: 1 },
  { label: 'সূরা আর রাহমান', surah: 55, ayah: 1 },
  { label: 'সূরা আল ওয়াকিয়াহ', surah: 56, ayah: 1 },
  { label: 'বাকারার শেষ দুই আয়াত', surah: 2, ayah: 285 },
];
