import { CalculationMethod, Coordinates, Madhab, PrayerTimes } from 'adhan';
import { addDays, n, pad2 } from './bn';

export type PrayerId = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export const PRAYER_IDS: PrayerId[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export type MethodId = 'ifb' | 'karachi' | 'mwl' | 'isna' | 'ummalqura' | 'egyptian' | 'dubai' | 'singapore';

export const METHODS: { id: MethodId; bn: string; en: string }[] = [
  { id: 'ifb', bn: 'ইসলামিক ফাউন্ডেশন বাংলাদেশ', en: 'Islamic Foundation Bangladesh' },
  { id: 'karachi', bn: 'ইউনিভার্সিটি অব ইসলামিক সায়েন্সেস, করাচি', en: 'University of Islamic Sciences, Karachi' },
  { id: 'mwl', bn: 'মুসলিম ওয়ার্ল্ড লীগ', en: 'Muslim World League' },
  { id: 'isna', bn: 'ইসনা (উত্তর আমেরিকা)', en: 'ISNA (North America)' },
  { id: 'ummalqura', bn: 'উম্মুল কুরা, মক্কা', en: 'Umm al-Qura, Makkah' },
  { id: 'egyptian', bn: 'মিশরীয় জেনারেল অথরিটি', en: 'Egyptian General Authority' },
  { id: 'dubai', bn: 'দুবাই', en: 'Dubai' },
  { id: 'singapore', bn: 'সিঙ্গাপুর', en: 'Singapore' },
];

export interface PrayerSettings {
  method: MethodId;
  madhab: 'hanafi' | 'shafi';
}

function params(s: PrayerSettings) {
  let p;
  switch (s.method) {
    case 'mwl': p = CalculationMethod.MuslimWorldLeague(); break;
    case 'isna': p = CalculationMethod.NorthAmerica(); break;
    case 'ummalqura': p = CalculationMethod.UmmAlQura(); break;
    case 'egyptian': p = CalculationMethod.Egyptian(); break;
    case 'dubai': p = CalculationMethod.Dubai(); break;
    case 'singapore': p = CalculationMethod.Singapore(); break;
    default: p = CalculationMethod.Karachi();
  }
  // Islamic Foundation Bangladesh publishes Karachi angles plus precautionary minutes.
  if (s.method === 'ifb') p.adjustments = { fajr: 0, sunrise: 0, dhuhr: 3, asr: 1, maghrib: 2, isha: 1 };
  p.madhab = s.madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  return p;
}

export interface DayTimes {
  fajr: Date; sunrise: Date; dhuhr: Date; asr: Date; sunset: Date; maghrib: Date; isha: Date;
  nextFajr: Date;
}

export function getDayTimes(date: Date, lat: number, lng: number, s: PrayerSettings): DayTimes {
  const coords = new Coordinates(lat, lng);
  const p = params(s);
  const t = new PrayerTimes(coords, date, p);
  const tomorrow = new PrayerTimes(coords, addDays(date, 1), p);
  // Sunset is the unadjusted maghrib.
  const rawParams = params(s);
  rawParams.adjustments = { ...rawParams.adjustments, maghrib: 0 };
  const raw = new PrayerTimes(coords, date, rawParams);
  return {
    fajr: t.fajr, sunrise: t.sunrise, dhuhr: t.dhuhr, asr: t.asr, sunset: raw.maghrib, maghrib: t.maghrib, isha: t.isha,
    nextFajr: tomorrow.fajr,
  };
}

const MIN = 60_000;

export interface Waqt {
  id: PrayerId;
  start: Date;
  end: Date;
  makruh?: { from: Date; to: Date; note: string };
}

/** The five daily waqts with their end times (the list on the home screen). */
export function getWaqts(t: DayTimes): Waqt[] {
  const midnight = new Date((t.maghrib.getTime() + t.nextFajr.getTime()) / 2);
  return [
    { id: 'fajr', start: t.fajr, end: new Date(t.sunrise.getTime() - MIN) },
    { id: 'dhuhr', start: t.dhuhr, end: new Date(t.asr.getTime() - MIN) },
    {
      id: 'asr', start: t.asr, end: new Date(t.sunset.getTime() - MIN),
      makruh: { from: new Date(t.sunset.getTime() - 15 * MIN), to: t.sunset, note: 'সূর্যাস্তের আগের ১৫ মিনিট মাকরূহ সময়; এর আগেই আসর আদায় করুন।' },
    },
    { id: 'maghrib', start: t.maghrib, end: new Date(t.isha.getTime() - MIN) },
    {
      id: 'isha', start: t.isha, end: new Date(t.nextFajr.getTime() - 2 * MIN),
      makruh: { from: midnight, to: t.nextFajr, note: 'মধ্যরাতের পর বিনা কারণে ইশা বিলম্ব করা মাকরূহ।' },
    },
  ];
}

export type PeriodId = PrayerId | 'sunrise' | 'duha' | 'zawal' | 'tahajjud';

export interface Period { id: PeriodId; start: Date; end: Date; forbidden?: boolean }

/** Continuous timeline of periods used for the countdown arc. */
export function getPeriods(today: DayTimes, yesterday: DayTimes): Period[] {
  const lastThird = (from: Date, to: Date) => new Date(to.getTime() - (to.getTime() - from.getTime()) / 3);
  const yTahajjud = lastThird(yesterday.maghrib, today.fajr);
  const tTahajjud = lastThird(today.maghrib, today.nextFajr);
  return [
    { id: 'isha', start: yesterday.isha, end: yTahajjud },
    { id: 'tahajjud', start: yTahajjud, end: today.fajr },
    { id: 'fajr', start: today.fajr, end: today.sunrise },
    { id: 'sunrise', start: today.sunrise, end: new Date(today.sunrise.getTime() + 15 * MIN), forbidden: true },
    { id: 'duha', start: new Date(today.sunrise.getTime() + 15 * MIN), end: new Date(today.dhuhr.getTime() - 8 * MIN) },
    { id: 'zawal', start: new Date(today.dhuhr.getTime() - 8 * MIN), end: today.dhuhr, forbidden: true },
    { id: 'dhuhr', start: today.dhuhr, end: today.asr },
    { id: 'asr', start: today.asr, end: today.maghrib },
    { id: 'maghrib', start: today.maghrib, end: today.isha },
    { id: 'isha', start: today.isha, end: tTahajjud },
    { id: 'tahajjud', start: tTahajjud, end: today.nextFajr },
  ];
}

export function currentPeriod(periods: Period[], now: Date): Period {
  return periods.find((p) => now >= p.start && now < p.end) ?? periods[periods.length - 1];
}

/** 12-hour clock without AM/PM, in the location's timezone, e.g. ০৪:৪৬ */
export function fmtTime(d: Date, tz: string, h24 = false): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour: 'numeric', minute: '2-digit', hourCycle: h24 ? 'h23' : 'h12',
  }).formatToParts(d);
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const m = parts.find((p) => p.type === 'minute')?.value ?? '00';
  return n(`${pad2(h)}:${m}`);
}

export function fmtTimeAmPm(d: Date, tz: string, lang: 'bn' | 'en'): string {
  const base = fmtTime(d, tz);
  const hour = Number(new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hourCycle: 'h23' }).format(d));
  if (lang === 'en') return `${base} ${hour < 12 ? 'AM' : 'PM'}`;
  const label = hour < 4 ? 'রাত' : hour < 12 ? 'সকাল' : hour < 15 ? 'দুপুর' : hour < 18 ? 'বিকাল' : hour < 20 ? 'সন্ধ্যা' : 'রাত';
  return `${label} ${base}`;
}
