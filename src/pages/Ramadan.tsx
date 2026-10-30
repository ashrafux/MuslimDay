import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sunrise, Check, X } from 'lucide-react';
import { PageHeader, toast } from '../components/ui';
import { MosqueArt } from '../components/icons';
import { useStore } from '../store/useStore';
import { useNow, usePrayerData } from '../lib/hooks';
import { addDays, dateKey, formatDuration, n } from '../lib/bn';
import { formatGregorian, formatHijri, fromHijri, toHijri, WEEKDAYS_BN } from '../lib/dates';
import { fmtTime, getDayTimes } from '../lib/prayer';

export default function Ramadan() {
  const nav = useNavigate();
  const now = useNow(1000);
  const { times, today } = usePrayerData(now);
  const { place, method, madhab, hijriAdjust, time24 } = useStore((s) => s.settings);
  const fasting = useStore((s) => s.fasting);
  const set = useStore((s) => s.set);
  const fmt = (d: Date) => fmtTime(d, place.tz, time24);

  const h = toHijri(today, hijriAdjust);
  const inRamadan = h.month === 9;
  const ramadanYear = h.month > 9 ? h.year + 1 : h.year;
  const ramadanStart = useMemo(() => fromHijri({ day: 1, month: 9, year: inRamadan ? h.year : ramadanYear }, hijriAdjust), [inRamadan, h.year, ramadanYear, hijriAdjust]);
  const daysToRamadan = ramadanStart ? Math.ceil((ramadanStart.getTime() - today.getTime()) / 86400000) : null;

  const sehriEnd = times.fajr;
  const iftar = times.maghrib;
  const nextEvent = now < sehriEnd ? { label: 'সেহরির শেষ সময় বাকি', at: sehriEnd } : now < iftar ? { label: 'ইফতারের বাকি', at: iftar } : null;

  const schedule = useMemo(() => {
    if (!ramadanStart) return [];
    return Array.from({ length: 30 }, (_, i) => {
      const d = addDays(ramadanStart, i);
      const t = getDayTimes(d, place.lat, place.lng, { method, madhab });
      return { d, sehri: t.fajr, iftar: t.maghrib };
    }).filter((x) => toHijri(x.d, hijriAdjust).month === 9);
  }, [ramadanStart, place, method, madhab, hijriAdjust]);

  const mark = (k: string, v: 'fasted' | 'missed') => {
    const next = { ...fasting };
    if (next[k] === v) delete next[k]; else next[k] = v;
    set('fasting', next);
  };
  const fastedCount = Object.values(fasting).filter((x) => x === 'fasted').length;
  const missedCount = Object.values(fasting).filter((x) => x === 'missed').length;

  // upcoming sunnah fasts
  const sunnah = useMemo(() => {
    const out: { d: Date; why: string }[] = [];
    for (let i = 0; i < 30 && out.length < 5; i++) {
      const d = addDays(today, i);
      const hd = toHijri(d, hijriAdjust);
      if (hd.month === 9 || (hd.month === 10 && hd.day === 1) || (hd.month === 12 && hd.day >= 10 && hd.day <= 13)) continue;
      if ([13, 14, 15].includes(hd.day)) out.push({ d, why: 'আইয়ামে বীয' });
      else if (hd.month === 1 && (hd.day === 9 || hd.day === 10)) out.push({ d, why: 'আশুরা' });
      else if (hd.month === 12 && hd.day === 9) out.push({ d, why: 'আরাফার দিন' });
      else if (d.getDay() === 1) out.push({ d, why: 'সোমবার' });
      else if (d.getDay() === 4) out.push({ d, why: 'বৃহস্পতিবার' });
    }
    return out;
  }, [today, hijriAdjust]);

  const todayKey = dateKey(today);

  return (
    <div>
      <PageHeader back title="রমজান ও রোজা" />
      <section className="relative mx-4 mt-1 overflow-hidden rounded-[32px] px-5 pb-5 pt-5 text-white shadow-float" style={{ background: "radial-gradient(120% 90% at 100% 0%,#4b3f86 0%,rgba(75,63,134,0) 60%),linear-gradient(160deg,#1b1c21 0%,#24252a 55%,#2e2c4a 100%)" }}>
        <div className="absolute -bottom-3 -right-3 opacity-25"><MosqueArt size={110} /></div>
        <div className="text-sm opacity-80">{formatHijri(h, 'bn', true)} হিজরি</div>
        <div className="mt-1 text-2xl">{inRamadan ? `রমজানের ${n(h.day)}তম দিন` : daysToRamadan !== null && daysToRamadan > 0 ? `রমজান আসতে ${n(daysToRamadan)} দিন বাকি` : 'রমজান মুবারক'}</div>
        {nextEvent && (
          <div className="mt-4 rounded-2xl bg-white/15 p-4">
            <div className="text-sm opacity-85">{nextEvent.label}</div>
            <div className="text-4xl tabular-nums">{formatDuration(nextEvent.at.getTime() - now.getTime())}</div>
          </div>
        )}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/15 p-3"><div className="flex items-center gap-1 text-sm opacity-85"><Moon size={16} /> সেহরির শেষ</div><div className="text-2xl">{fmt(sehriEnd)}</div></div>
          <div className="rounded-2xl bg-white/15 p-3"><div className="flex items-center gap-1 text-sm opacity-85"><Sunrise size={16} /> ইফতার</div><div className="text-2xl">{fmt(iftar)}</div></div>
        </div>
      </section>

      <section className="page-card mt-4 px-5 py-4">
        <h3 className="text-[17px] font-bold text-ink">আজকের রোজা</h3>
        <div className="mt-3 flex gap-3">
          <button onClick={() => { mark(todayKey, 'fasted'); toast('আলহামদুলিল্লাহ'); }} className={`btn flex-1 ${fasting[todayKey] === 'fasted' ? 'bg-night text-white' : 'bg-surface text-ink ring-1 ring-line'}`}><Check size={18} /> রেখেছি</button>
          <button onClick={() => mark(todayKey, 'missed')} className={`btn flex-1 ${fasting[todayKey] === 'missed' ? 'bg-alert text-white' : 'bg-chip text-ink'}`}><X size={18} /> রাখিনি (কাযা)</button>
        </div>
        <div className="mt-3 flex justify-between text-sm text-muted"><span>মোট রোজা: {n(fastedCount)}</span><span>কাযা বাকি: {n(missedCount)}</span></div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button onClick={() => nav('/dua/c/sawm')} className="rounded-2xl bg-bg p-3 text-left text-brand">সেহরি ও ইফতারের দোয়া →</button>
          <button onClick={() => nav('/qaza')} className="rounded-2xl bg-bg p-3 text-left text-brand">কাযা ট্র্যাকার →</button>
        </div>
      </section>

      <section className="page-card mt-4 px-5 py-4">
        <h3 className="text-[17px] font-bold text-ink">আসন্ন সুন্নাত রোজা</h3>
        {sunnah.map((s) => (
          <div key={dateKey(s.d)} className="flex justify-between border-b border-line py-2.5 text-ink">
            <span>{WEEKDAYS_BN[s.d.getDay()]}, {formatGregorian(s.d, 'bn')}</span><span className="text-brand">{s.why}</span>
          </div>
        ))}
      </section>

      {schedule.length > 0 && (
        <section className="page-card mt-4 px-5 py-4">
          <h3 className="text-[17px] font-bold text-ink">রমজান {n(inRamadan ? h.year : ramadanYear)} সময়সূচি — {place.bn}</h3>
          <p className="text-xs text-muted">চাঁদ দেখার উপর নির্ভর করে ১ দিন আগে-পরে হতে পারে</p>
          <div className="mt-3 grid grid-cols-[auto_1fr_auto_auto] gap-x-4 text-sm">
            <span className="py-2 text-muted">রোজা</span><span className="py-2 text-muted">তারিখ</span><span className="py-2 text-muted">সেহরি</span><span className="py-2 text-muted">ইফতার</span>
            {schedule.map((r, i) => {
              const isToday = dateKey(r.d) === todayKey;
              const cls = `border-t border-line py-2 ${isToday ? 'text-brand' : 'text-ink'}`;
              return [
                <span key={`a${i}`} className={cls}>{n(i + 1)}</span>,
                <span key={`b${i}`} className={cls}>{WEEKDAYS_BN[r.d.getDay()]}, {formatGregorian(r.d, 'bn')}</span>,
                <span key={`c${i}`} className={cls}>{fmt(r.sehri)}</span>,
                <span key={`d${i}`} className={cls}>{fmt(r.iftar)}</span>,
              ];
            })}
          </div>
        </section>
      )}
    </div>
  );
}
