import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, Flame, Plus, Trash2, Trophy } from 'lucide-react';
import { PageHeader, ProgressRing, Segmented, Sheet, toast } from '../components/ui';
import { useStore } from '../store/useStore';
import { addDays, dateKey, keyToDate, n } from '../lib/bn';
import { formatGregorian, formatHijri, toHijri, WEEKDAYS_BN } from '../lib/dates';
import { PRAYER_IDS } from '../lib/prayer';

export interface AmolItem { id: string; title: string; sub?: string; link?: string }
type Group = { title: string; items: AmolItem[] };
export const AMOL_GROUPS: { title: string; items: AmolItem[] }[] = [
  {
    title: 'ফরজ নামাজ',
    items: [
      { id: 'fajr', title: 'ফজর' },
      { id: 'dhuhr', title: "যোহর / জুম'আ" },
      { id: 'asr', title: 'আসর' },
      { id: 'maghrib', title: 'মাগরিব' },
      { id: 'isha', title: 'ইশা' },
    ],
  },
  {
    title: 'সুন্নাত ও নফল',
    items: [
      { id: 'witr', title: 'বিতর নামাজ', sub: 'ওয়াজিব — ইশার পর থেকে ফজরের আগ পর্যন্ত' },
      { id: 'tahajjud', title: 'তাহাজ্জুদ', sub: 'রাতের শেষ তৃতীয়াংশে' },
      { id: 'duha', title: 'ইশরাক / চাশত (দুহা)', sub: 'সূর্যোদয়ের ১৫ মিনিট পর থেকে' },
    ],
  },
  {
    title: 'যিকর ও তিলাওয়াত',
    items: [
      { id: 'quran', title: 'কুরআন তিলাওয়াত', sub: 'অন্তত এক পৃষ্ঠা', link: '/quran' },
      { id: 'morning-adhkar', title: 'সকালের যিকর', link: '/dua/c/adhkar' },
      { id: 'evening-adhkar', title: 'সন্ধ্যার যিকর', link: '/dua/c/adhkar' },
      { id: 'istighfar', title: '১০০ বার ইস্তিগফার', link: '/tasbih' },
      { id: 'durud', title: 'দরুদ শরীফ পাঠ', link: '/tasbih' },
    ],
  },
  {
    title: 'অন্যান্য',
    items: [{ id: 'sadaqah', title: 'দান-সদকা', sub: 'সামান্য হলেও' }],
  },
];
const BASE_IDS = AMOL_GROUPS.flatMap((g) => g.items.map((i) => i.id));
export const AMOL_TOTAL = BASE_IDS.length; // 14

export function useAmolProgress(key = dateKey()) {
  const done = useStore((s) => s.amol[key]) ?? [];
  const custom = useStore((s) => s.customAmol);
  const ids = [...BASE_IDS, ...custom.map((c) => c.id)];
  return { done: done.filter((d) => ids.includes(d)).length, total: ids.length };
}

export default function AmolTracker() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as 'today' | 'stats') ?? 'today';
  return (
    <div>
      <PageHeader back title="আমল ট্র্যাকার" />
      <div className="bg-surface px-5 py-3">
        <Segmented value={tab} onChange={(v) => setParams(v === 'today' ? {} : { tab: v }, { replace: true })}
          options={[{ value: 'today', label: 'দৈনিক আমল' }, { value: 'stats', label: 'পরিসংখ্যান' }]} />
      </div>
      {tab === 'today' ? <Daily /> : <Stats />}
    </div>
  );
}

function Daily() {
  const nav = useNavigate();
  const [key, setKey] = useState(dateKey());
  const done = useStore((s) => s.amol[key]) ?? [];
  const toggle = useStore((s) => s.toggleAmol);
  const custom = useStore((s) => s.customAmol);
  const set = useStore((s) => s.set);
  const hijriAdjust = useStore((s) => s.settings.hijriAdjust);
  const { done: count, total } = useAmolProgress(key);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const date = keyToDate(key);
  const isToday = key === dateKey();

  const groups: Group[] = [...AMOL_GROUPS, ...(custom.length ? [{ title: 'আমার আমল', items: custom.map((c) => ({ id: c.id, title: c.title })) }] : [])];

  return (
    <div>
      <div className="flex items-center justify-between bg-surface px-3 pb-4">
        <button className="tap rounded-full p-2" onClick={() => setKey(dateKey(addDays(date, -1)))} aria-label="previous day"><ChevronLeft /></button>
        <div className="text-center">
          <div className="text-lg text-ink">{isToday ? 'আজ, ' : `${WEEKDAYS_BN[date.getDay()]}, `}{formatGregorian(date, 'bn', true)}</div>
          <div className="text-sm text-muted">{formatHijri(toHijri(date, hijriAdjust), 'bn', true)}</div>
        </div>
        <button className="tap rounded-full p-2 disabled:opacity-30" disabled={isToday} onClick={() => setKey(dateKey(addDays(date, 1)))} aria-label="next day"><ChevronRight /></button>
      </div>

      <div className="flex items-center gap-5 border-y border-line bg-surface px-5 py-5">
        <ProgressRing value={count / total} size={96} stroke={8} color="rgb(var(--brand))" track="rgb(var(--brand) / .12)">
          <span className="text-2xl text-ink">{n(Math.round((count / total) * 100))}%</span>
        </ProgressRing>
        <div>
          <div className="text-xl text-ink">{n(count)}/{n(total)} আমল সম্পন্ন</div>
          <div className="mt-1 text-sm text-muted">{count === total ? 'মাশাআল্লাহ! আজকের সব আমল সম্পন্ন।' : 'প্রতিটি আমল সম্পন্ন হলে টিক দিন।'}</div>
        </div>
      </div>

      {groups.map((g) => (
        <section key={g.title} className="mt-4 bg-surface">
          <h3 className="px-5 pb-1 pt-4 text-lg text-muted">{g.title}</h3>
          <ul className="divide-y divide-line">
            {g.items.map((it) => {
              const checked = done.includes(it.id);
              const isCustom = custom.some((c) => c.id === it.id);
              return (
                <li key={it.id} className="flex items-center gap-4 px-5 py-3.5">
                  <button onClick={() => toggle(it.id, key)} aria-label={it.title}
                    className={`tap flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[3px] ${checked ? 'animate-pop border-brand bg-brand text-white' : 'border-line'}`}>
                    {checked && <Check size={20} strokeWidth={3} />}
                  </button>
                  <button className="min-w-0 flex-1 text-left" onClick={() => toggle(it.id, key)}>
                    <span className={`block text-[19px] ${checked ? 'text-muted line-through decoration-brand/50' : 'text-ink'}`}>{it.title}</span>
                    {it.sub && <span className="block text-sm text-muted">{it.sub}</span>}
                  </button>
                  {it.link && <button onClick={() => nav(it.link!)} className="rounded-full bg-chip px-3 py-1 text-sm text-brand">খুলুন</button>}
                  {isCustom && (
                    <button aria-label="delete" onClick={() => { set('customAmol', custom.filter((c) => c.id !== it.id)); toast('মুছে ফেলা হয়েছে'); }} className="p-1 text-muted"><Trash2 size={18} /></button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <div className="p-5">
        <button className="btn-soft w-full" onClick={() => setAdding(true)}><Plus size={20} /> নিজের আমল যোগ করুন</button>
      </div>

      <Sheet open={adding} onClose={() => setAdding(false)} title="নতুন আমল">
        <input autoFocus className="input" placeholder="যেমন: সূরা মুলক তিলাওয়াত" value={title} onChange={(e) => setTitle(e.target.value)} />
        <button className="btn-primary mt-4 w-full" disabled={!title.trim()} onClick={() => {
          set('customAmol', [...custom, { id: `c-${Date.now()}`, title: title.trim() }]);
          setTitle(''); setAdding(false); toast('আমল যোগ হয়েছে');
        }}>যোগ করুন</button>
      </Sheet>
    </div>
  );
}

function Stats() {
  const amol = useStore((s) => s.amol);
  const today = new Date();
  const days = useMemo(() => Array.from({ length: 30 }, (_, i) => addDays(today, -29 + i)), [today.toDateString()]); // eslint-disable-line

  const prayerCount = (d: Date) => (amol[dateKey(d)] ?? []).filter((x) => (PRAYER_IDS as string[]).includes(x)).length;
  const last7 = days.slice(-7);

  // streak: consecutive days (ending today or yesterday) with all 5 prayers
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = addDays(today, -i);
    if (prayerCount(d) === 5) streak++;
    else if (i === 0) continue;
    else break;
  }
  let best = 0, run = 0;
  Object.keys(amol).sort().forEach((k, idx, arr) => {
    const full = (amol[k] ?? []).filter((x) => (PRAYER_IDS as string[]).includes(x)).length === 5;
    const prev = idx > 0 ? arr[idx - 1] : null;
    const consecutive = prev && dateKey(addDays(keyToDate(prev), 1)) === k;
    run = full ? (consecutive ? run + 1 : 1) : 0;
    best = Math.max(best, run);
  });
  const perPrayer = PRAYER_IDS.map((p) => ({ p, c: days.filter((d) => (amol[dateKey(d)] ?? []).includes(p)).length }));
  const names: Record<string, string> = { fajr: 'ফজর', dhuhr: 'যোহর', asr: 'আসর', maghrib: 'মাগরিব', isha: 'ইশা' };
  const totalDeeds = days.reduce((a, d) => a + (amol[dateKey(d)]?.length ?? 0), 0);

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-3 gap-3 px-5">
        {[
          { icon: <Flame className="text-alert" />, v: streak, l: 'বর্তমান স্ট্রিক' },
          { icon: <Trophy className="text-amber-500" />, v: best, l: 'সেরা স্ট্রিক' },
          { icon: <Check className="text-brand" />, v: totalDeeds, l: '৩০ দিনে আমল' },
        ].map((s) => (
          <div key={s.l} className="rounded-2xl bg-surface p-4 text-center">
            <div className="flex justify-center">{s.icon}</div>
            <div className="mt-1 text-2xl text-ink">{n(s.v)}</div>
            <div className="text-xs text-muted">{s.l}</div>
          </div>
        ))}
      </div>

      <section className="bg-surface px-5 py-5">
        <h3 className="text-lg text-ink">গত ৭ দিনের নামাজ</h3>
        <div className="mt-4 flex h-40 items-end justify-between gap-2" role="img" aria-label="last 7 days prayers chart">
          {last7.map((d) => {
            const c = prayerCount(d);
            return (
              <div key={dateKey(d)} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs text-muted">{n(c)}</span>
                <div className="w-full max-w-[30px] rounded-t-md bg-brand transition-all" style={{ height: `${(c / 5) * 110 + 4}px`, opacity: c ? 1 : 0.25 }} />
                <span className="text-xs text-muted">{WEEKDAYS_BN[d.getDay()]}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-surface px-5 py-5">
        <h3 className="text-lg text-ink">গত ৩০ দিনে ওয়াক্ত অনুযায়ী</h3>
        <div className="mt-3 space-y-3">
          {perPrayer.map(({ p, c }) => (
            <div key={p}>
              <div className="flex justify-between text-sm text-ink"><span>{names[p]}</span><span>{n(c)}/{n(30)}</span></div>
              <div className="mt-1 h-2.5 rounded-full bg-chip"><div className="h-full rounded-full bg-brand" style={{ width: `${(c / 30) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-surface px-5 py-5">
        <h3 className="text-lg text-ink">৩০ দিনের ক্যালেন্ডার</h3>
        <div className="mt-3 grid grid-cols-10 gap-1.5">
          {days.map((d) => {
            const c = prayerCount(d);
            return <div key={dateKey(d)} title={`${dateKey(d)}: ${c}/5`} className="aspect-square rounded" style={{ background: c ? `rgb(var(--brand) / ${0.2 + (c / 5) * 0.8})` : 'rgb(var(--line))' }} />;
          })}
        </div>
        <div className="mt-2 text-xs text-muted">গাঢ় রং = বেশি ওয়াক্ত আদায়</div>
      </section>
    </div>
  );
}
