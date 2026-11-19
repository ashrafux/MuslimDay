import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useNow } from '../lib/hooks';
import { addDays, dateKey, n } from '../lib/bn';
import { fmtTime, getDayTimes, getWaqts } from '../lib/prayer';
import { tStatic } from '../lib/i18n';
import { appliesOn, customToDef } from '../lib/amol';
import { todayIn, toHijri } from '../lib/dates';
import { isNative, notifyNow, onNotificationTap, syncScheduledAlerts, type PlannedAlert } from '../lib/native';

function beep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [0, 0.35].forEach((t) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 660;
      g.gain.setValueAtTime(0.25, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.3);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.3);
    });
  } catch { /* no audio */ }
}

/** How many days ahead the Android app hands its alarms to the system */
const PLAN_DAYS = 7;

/** An alarm with the window in which it still counts as "now" for the in-app list */
type Alert = PlannedAlert & { until: number };

/** Every prayer alarm and deed reminder for `days` days from `now`, from the current settings (exported for checks) */
export function planAlerts(now: Date, days: number): Alert[] {
  const st = useStore.getState();
  const { alarm, silent, settings } = st;
  const { place, method, madhab, lang, time24 } = settings;
  const out: Alert[] = [];
  const firstDay = todayIn(place.tz, now);
  for (let i = 0; i < days; i++) {
    const day = addDays(firstDay, i);
    const key = dateKey(day);
    const done = st.amol[key] ?? [];
    const waqts = getWaqts(getDayTimes(day, place.lat, place.lng, { method, madhab }));
    const isFriday = day.getDay() === 5;
    for (const w of waqts) {
      if (!alarm.enabled[w.id]) continue;
      const name = tStatic(w.id === 'dhuhr' && isFriday ? 'jumuah' : w.id, lang);
      const start = w.start.getTime();
      const time = fmtTime(w.start, place.tz, time24);
      if (alarm.before > 0) {
        out.push({ key: `${key}-${w.id}-pre`, at: new Date(start - alarm.before * 60000), until: start, title: `${name} — ${n(alarm.before)} মিনিট বাকি`, body: `${name} এর ওয়াক্ত শুরু হবে ${time} এ।`, link: '/' });
      }
      out.push({ key: `${key}-${w.id}-start`, at: w.start, until: start + 10 * 60000, title: `${name} এর ওয়াক্ত শুরু হয়েছে`, body: `এখন ${name} এর সময় (${time})। নামাজ আদায় করে আমল ট্র্যাকারে চিহ্নিত করুন।`, link: '/amol' });
      // only while the prayer isn't marked yet; marking it re-plans and drops this reminder
      if (alarm.endReminder && !done.includes(w.id)) {
        const end = w.end.getTime();
        out.push({ key: `${key}-${w.id}-end`, at: new Date(end - 20 * 60000), until: end, title: `${name} এর ওয়াক্ত শেষ হতে চলেছে`, body: 'আপনি এখনও নামাজটি চিহ্নিত করেননি।', link: '/amol' });
      }
      if (silent.enabled && silent.prayers[w.id]) {
        out.push({ key: `${key}-${w.id}-silent`, at: w.start, until: start + 5 * 60000, title: 'ফোন সাইলেন্ট করুন', body: `${name} এর জামাতের সময় — পরবর্তী ${silent.minutes} মিনিট ফোন সাইলেন্ট রাখুন।`, link: '/silent' });
      }
    }
  }

  // reminders for the user's own deeds, at their set time (device local time)
  const localToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (let i = 0; i < days; i++) {
    const local = addDays(localToday, i);
    const localKey = dateKey(local);
    const localDone = st.amol[localKey] ?? [];
    let hijriDay: number | undefined;
    for (const c of st.customAmol) {
      if (!c.reminder || localDone.includes(c.id) || st.hiddenAmol.includes(c.id)) continue;
      const def = customToDef(c);
      if (def.hijriDays?.length) hijriDay ??= toHijri(local, settings.hijriAdjust).day;
      if (!appliesOn(def, local, hijriDay ?? 0)) continue;
      const [hh, mm] = c.reminder.split(':').map(Number);
      const at = new Date(local.getFullYear(), local.getMonth(), local.getDate(), hh, mm);
      out.push({ key: `${localKey}-amol-${c.id}`, at, until: at.getTime() + 10 * 60000, title: `আমলের সময়: ${c.title}`, body: c.note ? c.note : 'আজকের আমল সম্পন্ন করে টিক দিন।', link: '/amol' });
    }
  }
  return out;
}

/**
 * Prayer alarms and deed reminders.
 * - Android app: the next few days are handed to the system, so they ring with the app closed
 *   (re-planned whenever settings, ticks or the day change); tapping one opens the right screen.
 * - Browser: they fire while the app is open, as before.
 * Either way, alerts that come due while the app is open are added to the in-app notification list.
 */
export function Scheduler() {
  const nav = useNavigate();
  const now = useNow(15000);
  const alarm = useStore((s) => s.alarm);
  const silent = useStore((s) => s.silent);
  const settings = useStore((s) => s.settings);
  const customAmol = useStore((s) => s.customAmol);
  const hiddenAmol = useStore((s) => s.hiddenAmol);
  const amol = useStore((s) => s.amol);
  const hour = Math.floor(now.getTime() / 3_600_000);

  useEffect(() => onNotificationTap((link) => nav(link)), [nav]);

  // Android: keep the system's alarm list in step (once an hour, and on any change that affects it)
  useEffect(() => {
    if (!isNative) return;
    syncScheduledAlerts(planAlerts(new Date(), PLAN_DAYS), alarm.sound).catch(() => undefined);
  }, [hour, alarm, silent, settings, customAmol, hiddenAmol, amol]);

  // Alerts due right now: into the in-app list; in a browser also a system notification and a beep
  useEffect(() => {
    const st = useStore.getState();
    const t = now.getTime();
    const due = planAlerts(now, 1).filter((a) => t >= a.at.getTime() && t < a.until && !st.firedKeys.includes(a.key));
    if (!due.length) return;
    const muted = silent.enabled && due.some((a) => a.key.endsWith('-silent'));
    for (const a of due) {
      st.pushNotification({ title: a.title, body: a.body, link: a.link }, a.key);
      if (!isNative) notifyNow(a.title, a.body, a.link, alarm.sound);
    }
    if (!isNative && alarm.sound && !muted) beep();
  }, [now, alarm, silent]);

  return null;
}
