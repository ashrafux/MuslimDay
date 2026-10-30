import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { usePrayerData, useNow } from '../lib/hooks';
import { dateKey } from '../lib/bn';
import { fmtTime } from '../lib/prayer';
import { tStatic } from '../lib/i18n';
import { appliesOn, customToDef } from '../lib/amol';
import { toHijri } from '../lib/dates';

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

async function systemNotify(title: string, body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) await reg.showNotification(title, { body, icon: './icon.svg', badge: './icon.svg' });
    else new Notification(title, { body, icon: './icon.svg' });
  } catch { /* ignore */ }
}

/** Fires prayer alarms / reminders while the app is open (web apps cannot wake the device on their own). */
export function Scheduler() {
  const now = useNow(15000);
  const { waqts, today } = usePrayerData(now);
  const alarm = useStore((s) => s.alarm);
  const silent = useStore((s) => s.silent);
  const settings = useStore((s) => s.settings);

  useEffect(() => {
    const st = useStore.getState();
    const key = dateKey(today);
    const done = st.amol[key] ?? [];
    const lang = settings.lang;
    const t = now.getTime();
    const muted = silent.enabled && waqts.some((w) => silent.prayers[w.id] && t >= w.start.getTime() && t < w.start.getTime() + silent.minutes * 60000);
    const fire = (k: string, title: string, body: string, link = '/') => {
      if (st.firedKeys.includes(k)) return;
      st.pushNotification({ title, body, link }, k);
      systemNotify(title, body);
      if (alarm.sound && !muted) beep();
    };
    const isFriday = today.getDay() === 5;
    for (const w of waqts) {
      if (!alarm.enabled[w.id]) continue;
      const name = tStatic(w.id === 'dhuhr' && isFriday ? 'jumuah' : w.id, lang);
      const start = w.start.getTime();
      const time = fmtTime(w.start, settings.place.tz, settings.time24);
      if (alarm.before > 0) {
        const at = start - alarm.before * 60000;
        if (t >= at && t < start) fire(`${key}-${w.id}-pre`, `${name} — ${alarm.before} মিনিট বাকি`, `${name} এর ওয়াক্ত শুরু হবে ${time} এ।`);
      }
      if (t >= start && t < start + 10 * 60000) fire(`${key}-${w.id}-start`, `${name} এর ওয়াক্ত শুরু হয়েছে`, `এখন ${name} এর সময় (${time})। নামাজ আদায় করে আমল ট্র্যাকারে চিহ্নিত করুন।`, '/amol');
      if (alarm.endReminder && !done.includes(w.id)) {
        const end = w.end.getTime();
        if (t >= end - 20 * 60000 && t < end) fire(`${key}-${w.id}-end`, `${name} এর ওয়াক্ত শেষ হতে চলেছে`, 'আপনি এখনও নামাজটি চিহ্নিত করেননি।', '/amol');
      }
      if (silent.enabled && silent.prayers[w.id] && t >= start && t < start + 5 * 60000) {
        fire(`${key}-${w.id}-silent`, 'ফোন সাইলেন্ট করুন', `${name} এর জামাতের সময় — পরবর্তী ${silent.minutes} মিনিট ফোন সাইলেন্ট রাখুন।`, '/silent');
      }
    }

    // Reminders for the user's own deeds (device local time)
    const local = new Date(t);
    const localKey = dateKey(local);
    const localDone = st.amol[localKey] ?? [];
    let hijriDay: number | undefined;
    for (const c of st.customAmol) {
      if (!c.reminder || localDone.includes(c.id)) continue;
      const def = customToDef(c);
      if (def.hijriDays?.length) hijriDay ??= toHijri(local, settings.hijriAdjust).day;
      if (!appliesOn(def, local, hijriDay ?? 0)) continue;
      const [hh, mm] = c.reminder.split(':').map(Number);
      const at = new Date(local.getFullYear(), local.getMonth(), local.getDate(), hh, mm).getTime();
      if (t >= at && t < at + 10 * 60000) fire(`${localKey}-amol-${c.id}`, `আমলের সময়: ${c.title}`, c.note ? c.note : 'আজকের আমল সম্পন্ন করে টিক দিন।', '/amol');
    }
  }, [now, waqts, today, alarm, silent, settings]);

  return null;
}
