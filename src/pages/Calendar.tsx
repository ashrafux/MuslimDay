import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowLeftRight } from 'lucide-react';
import { PageHeader, Segmented, Sheet } from '../components/ui';
import { useStore } from '../store/useStore';
import { addDays, dateKey, n } from '../lib/bn';
import { GREG_MONTHS_BN, HIJRI_MONTHS_BN, WEEKDAYS_BN, WEEKDAYS_BN_FULL, formatBangla, formatGregorian, formatHijri, fromHijri, toHijri } from '../lib/dates';
import { islamicEvents, type IslamicEvent } from '../data/events';
import { fmtTime, getDayTimes, getWaqts } from '../lib/prayer';
import { tStatic } from '../lib/i18n';

function eventsFor(h: { day: number; month: number }): IslamicEvent[] {
  return islamicEvents.filter((e) => e.month === h.month && e.day === h.day);
}

export default function CalendarPage() {
  const [params] = useSearchParams();
  const { hijriAdjust, place, method, madhab, time24 } = useStore((s) => s.settings);
  const amol = useStore((s) => s.amol);
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [selected, setSelected] = useState<Date | null>(null);
  const [tab, setTab] = useState<'month' | 'convert'>(params.get('convert') ? 'convert' : 'month');
  const today = dateKey();

  const cells = useMemo(() => {
    const first = cursor;
    const start = addDays(first, -first.getDay());
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [cursor]);

  const monthHijri = [toHijri(cursor, hijriAdjust), toHijri(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0), hijriAdjust)];
  const monthEvents = useMemo(() => {
    const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const list: { date: Date; e: IslamicEvent }[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(cursor.getFullYear(), cursor.getMonth(), i + 1);
      eventsFor(toHijri(d, hijriAdjust)).forEach((e) => list.push({ date: d, e }));
    }
    return list;
  }, [cursor, hijriAdjust]);

  return (
    <div>
      <PageHeader back title="ক্যালেন্ডার" />
      <div className="px-5 pb-1 pt-1">
        <Segmented value={tab} onChange={setTab} options={[{ value: 'month', label: 'মাসিক' }, { value: 'convert', label: <span className="flex items-center gap-1"><ArrowLeftRight size={16} /> রূপান্তর</span> }]} />
      </div>
      {tab === 'convert' ? <Converter /> : (
        <>
          <div className="page-card px-3 pb-4">
            <div className="flex items-center justify-between py-2">
              <button aria-label="previous month" className="tap rounded-full p-2" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}><ChevronLeft /></button>
              <button className="text-center" onClick={() => { const d = new Date(); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)); }}>
                <div className="text-xl text-ink">{GREG_MONTHS_BN[cursor.getMonth()]} {n(cursor.getFullYear())}</div>
                <div className="text-sm text-brand">
                  {HIJRI_MONTHS_BN[monthHijri[0].month - 1]}{monthHijri[0].month !== monthHijri[1].month && ` - ${HIJRI_MONTHS_BN[monthHijri[1].month - 1]}`} {n(monthHijri[1].year)} হিজরি
                </div>
              </button>
              <button aria-label="next month" className="tap rounded-full p-2" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}><ChevronRight /></button>
            </div>
            <div className="grid grid-cols-7 text-center text-sm text-muted">
              {WEEKDAYS_BN.map((w, i) => <div key={w} className={`py-2 ${i === 5 ? 'text-brand' : ''}`}>{w}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((d) => {
                const inMonth = d.getMonth() === cursor.getMonth();
                const h = toHijri(d, hijriAdjust);
                const ev = eventsFor(h).length > 0;
                const k = dateKey(d);
                const prayed = (amol[k] ?? []).filter((x) => ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].includes(x)).length;
                return (
                  <button key={k} onClick={() => setSelected(d)}
                    className={`relative flex aspect-square flex-col items-center justify-center rounded-full ${k === today ? 'bg-brand text-white shadow-card' : ev ? 'bg-butter' : 'hover:ring-2 hover:ring-accent/60'} ${inMonth ? '' : 'opacity-35'}`}>
                    <span className={`text-lg leading-none ${k === today ? 'text-white' : d.getDay() === 5 ? 'text-brand' : 'text-ink'}`}>{n(d.getDate())}</span>
                    <span className={`mt-0.5 text-[11px] leading-none ${k === today ? 'text-white/85' : 'text-muted'}`}>{n(h.day)}</span>
                    {prayed > 0 && <span className={`absolute bottom-1 h-1 w-1 rounded-full ${prayed === 5 ? 'bg-brand' : 'bg-alert'} ${k === today ? 'bg-white' : ''}`} />}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-4 px-2 text-xs text-muted">
              <span>বড় সংখ্যা: ইংরেজি</span><span>ছোট সংখ্যা: হিজরি</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-butter" /> ইসলামিক দিবস</span>
            </div>
          </div>

          <section className="page-card mt-4 px-5 py-4">
            <h3 className="text-[17px] font-bold text-ink">এই মাসের ইসলামিক দিবস</h3>
            {monthEvents.length === 0 ? <p className="mt-2 text-sm text-muted">এই মাসে বিশেষ কোনো দিবস নেই।</p> : monthEvents.map(({ date, e }) => (
              <button key={dateKey(date) + e.title} onClick={() => setSelected(date)} className="mt-3 flex w-full gap-4 text-left">
                <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-[10px] bg-chip text-brand">
                  <span className="text-lg leading-none">{n(date.getDate())}</span><span className="text-[10px]">{GREG_MONTHS_BN[date.getMonth()]}</span>
                </span>
                <span><span className="block text-ink">{e.title}</span><span className="line-clamp-2 text-sm text-muted">{e.description}</span></span>
              </button>
            ))}
          </section>
        </>
      )}

      <Sheet open={!!selected} onClose={() => setSelected(null)} title={selected ? `${WEEKDAYS_BN_FULL[selected.getDay()]}, ${formatGregorian(selected, 'bn', true)}` : ''}>
        {selected && (() => {
          const h = toHijri(selected, hijriAdjust);
          const times = getDayTimes(selected, place.lat, place.lng, { method, madhab });
          const waqts = getWaqts(times);
          const ev = eventsFor(h);
          const done = amol[dateKey(selected)] ?? [];
          return (
            <div className="space-y-3">
              <p className="text-brand">{formatHijri(h, 'bn', true)} হিজরি • {formatBangla(selected)} বঙ্গাব্দ</p>
              {ev.map((e) => (
                <div key={e.title} className="rounded-[10px] bg-butter p-4">
                  <div className="text-lg text-ink">{e.title}</div><p className="text-sm text-ink/80">{e.description}</p>
                  {e.fastingRecommended && <p className="mt-1 text-sm text-brand">এই দিনে রোজা রাখা মুস্তাহাব।</p>}
                </div>
              ))}
              {(selected.getDay() === 1 || selected.getDay() === 4) && <p className="text-sm text-muted">সোম ও বৃহস্পতিবার নফল রোজা রাখা সুন্নাত।</p>}
              {[13, 14, 15].includes(h.day) && <p className="text-sm text-muted">আইয়ামে বীয — প্রতি হিজরি মাসের ১৩, ১৪, ১৫ তারিখে রোজা রাখা সুন্নাত।</p>}
              <div className="divide-y divide-line rounded-[10px] border border-line">
                {waqts.map((w) => (
                  <div key={w.id} className="flex justify-between px-4 py-2.5 text-ink">
                    <span>{tStatic(w.id === 'dhuhr' && selected.getDay() === 5 ? 'jumuah' : w.id, 'bn')} {done.includes(w.id) && <span className="text-brand">✓</span>}</span>
                    <span className="text-muted">{fmtTime(w.start, place.tz, time24)} - {fmtTime(w.end, place.tz, time24)}</span>
                  </div>
                ))}
                <div className="flex justify-between px-4 py-2.5 text-sm text-muted"><span>সূর্যোদয় / সূর্যাস্ত</span><span>{fmtTime(times.sunrise, place.tz, time24)} / {fmtTime(times.sunset, place.tz, time24)}</span></div>
              </div>
            </div>
          );
        })()}
      </Sheet>
    </div>
  );
}

function Converter() {
  const adj = useStore((s) => s.settings.hijriAdjust);
  const [g, setG] = useState(() => dateKey());
  const [hd, setHd] = useState(() => toHijri(new Date(), adj));
  const gd = new Date(g + 'T00:00:00');
  const toG = fromHijri(hd, adj);
  return (
    <div className="space-y-4 p-5">
      <div className="card p-5">
        <h3 className="text-[17px] font-bold text-ink">ইংরেজি → হিজরি</h3>
        <input type="date" value={g} onChange={(e) => setG(e.target.value)} className="input mt-3" />
        {!Number.isNaN(gd.getTime()) && (
          <p className="mt-3 text-xl text-brand">{formatHijri(toHijri(gd, adj), 'bn', true)} হিজরি<span className="block text-sm text-muted">{formatBangla(gd)} বঙ্গাব্দ • {WEEKDAYS_BN_FULL[gd.getDay()]}</span></p>
        )}
      </div>
      <div className="card p-5">
        <h3 className="text-[17px] font-bold text-ink">হিজরি → ইংরেজি</h3>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <input type="number" min={1} max={30} value={hd.day} onChange={(e) => setHd({ ...hd, day: Number(e.target.value) })} className="input" aria-label="day" />
          <select value={hd.month} onChange={(e) => setHd({ ...hd, month: Number(e.target.value) })} className="input" aria-label="month">
            {HIJRI_MONTHS_BN.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <input type="number" min={1350} max={1550} value={hd.year} onChange={(e) => setHd({ ...hd, year: Number(e.target.value) })} className="input" aria-label="year" />
        </div>
        <p className="mt-3 text-xl text-brand">{toG ? `${WEEKDAYS_BN_FULL[toG.getDay()]}, ${formatGregorian(toG, 'bn', true)}` : 'সঠিক তারিখ দিন'}</p>
      </div>
      <p className="text-center text-xs text-muted">হিজরি তারিখ উম্মুল কুরা পদ্ধতিতে, সেটিংসের সমন্বয় ({n(adj)} দিন) সহ।</p>
    </div>
  );
}
