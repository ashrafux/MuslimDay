import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Bell, Check, ChevronDown, ChevronLeft, ChevronRight, Flame, Minus, Pencil, Plus, SlidersHorizontal, Trash2, Trophy, Users, BookmarkPlus, CalendarCheck } from 'lucide-react';
import { IconButton, PageHeader, ProgressRing, Segmented, Sheet, Toggle, toast } from '../components/ui';
import { MoodFace } from '../components/icons';
import { useStore, type CustomAmol, type PrayerMode } from '../store/useStore';
import { addDays, dateKey, keyToDate, n } from '../lib/bn';
import { toHijri, WEEKDAYS_BN } from '../lib/dates';
import { PRAYER_IDS, type PrayerId } from '../lib/prayer';
import {
  BUILTIN, customToDef, GROUP_AVOID, GROUP_DHIKR, GROUP_MINE, GROUP_OTHER, GROUP_SUNNAH, LIBRARY, groupItems, itemsFor, streakOf, useAmolItems, useAmolProgress, type AmolDef,
} from '../lib/amol';

export { useAmolProgress };

const MODES: { v: PrayerMode; l: string }[] = [
  { v: 'jamaat', l: 'জামাতে' },
  { v: 'alone', l: 'একা' },
  { v: 'qaza', l: 'কাযা' },
];
const MOODS = ['দুর্বল', 'মোটামুটি', 'ভালো', 'চমৎকার'];

export default function AmolTracker() {
  const [params, setParams] = useSearchParams();
  const nav = useNavigate();
  const tab = (params.get('tab') as 'today' | 'stats') ?? 'today';
  const [editor, setEditor] = useState<{ open: boolean; item?: CustomAmol }>({ open: false });
  return (
    <div>
      <PageHeader back title="আমল ট্র্যাকার" right={<>
        <IconButton label="manage amal" onClick={() => nav('/amol/manage')}><SlidersHorizontal size={18} /></IconButton>
        <IconButton label="add amal" tone="brand" onClick={() => setEditor({ open: true })}><Plus size={20} /></IconButton>
      </>} />
      <div className="px-5 pb-1 pt-1">
        <Segmented value={tab} onChange={(v) => setParams(v === 'today' ? {} : { tab: v }, { replace: true })}
          options={[{ value: 'today', label: 'দৈনিক আমল' }, { value: 'stats', label: 'পরিসংখ্যান' }]} />
      </div>
      {tab === 'today' ? <Daily onEdit={(item) => setEditor({ open: true, item })} onAdd={() => setEditor({ open: true })} /> : <Stats />}
      <AmolEditor open={editor.open} item={editor.item} onClose={() => setEditor({ open: false })} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Daily                                                               */
/* ------------------------------------------------------------------ */

function WeekStrip({ selected, onSelect }: { selected: string; onSelect: (k: string) => void }) {
  const sel = keyToDate(selected);
  // Bangladeshi week: Saturday → Friday
  const start = addDays(sel, -((sel.getDay() + 1) % 7));
  const today = dateKey();
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  return (
    <div className="mt-2 flex items-center gap-1 px-3 py-1">
      <button aria-label="previous week" className="tap rounded-full p-1.5 text-muted" onClick={() => onSelect(dateKey(addDays(sel, -7)))}><ChevronLeft size={20} /></button>
      <div className="grid flex-1 grid-cols-7 gap-1">
        {days.map((d) => {
          const k = dateKey(d);
          const future = k > today;
          const active = k === selected;
          return (
            <button key={k} disabled={future} onClick={() => onSelect(k)}
              className={`flex flex-col items-center gap-1 rounded-[10px] py-1.5 transition disabled:opacity-35 ${active ? 'bg-night text-white' : ''}`}>
              <span className={`text-[11px] font-semibold ${active ? 'text-white/70' : d.getDay() === 5 ? 'text-brand' : 'text-muted'}`}>{WEEKDAYS_BN[d.getDay()]}</span>
              <span className={`flex h-[34px] w-[34px] items-center justify-center rounded-full text-[13px] font-bold ${active ? 'text-white' : `bg-chip ${k === today ? 'text-brand' : 'text-ink'}`}`}>
                {n(d.getDate())}
              </span>
            </button>
          );
        })}
      </div>
      <button aria-label="next week" disabled={dateKey(addDays(start, 7)) > today} className="tap rounded-full p-1.5 text-muted disabled:opacity-30" onClick={() => {
        const next = addDays(sel, 7);
        onSelect(dateKey(next) > today ? today : dateKey(next));
      }}><ChevronRight size={20} /></button>
    </div>
  );
}

function CountControl({ def, k }: { def: AmolDef; k: string }) {
  const count = useStore((s) => s.amolCounts[k]?.[def.id] ?? 0);
  const setCount = useStore((s) => s.setAmolCount);
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState('');
  const done = count >= def.target;
  const bump = (d: number) => {
    const v = Math.max(0, count + d);
    setCount(def.id, k, v, def.target);
    if (v >= def.target && count < def.target) { navigator.vibrate?.([60, 40, 60]); toast(`${def.title} সম্পন্ন — মাশাআল্লাহ`); } else navigator.vibrate?.(10);
  };
  return (
    <>
      <button aria-label={`${def.title} +1`} onClick={() => bump(1)} className="tap shrink-0">
        <ProgressRing value={count / def.target} size={38} stroke={3.5} color="rgb(var(--brand))" track="rgb(var(--line))">
          {done ? <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-brand text-white"><Check size={17} strokeWidth={3} /></span>
            : <span className="text-[12px] text-ink">{n(count)}</span>}
        </ProgressRing>
      </button>
      <button className="min-w-0 flex-1 text-left" onClick={() => { setVal(String(count)); setOpen(true); }}>
        <span className={`block text-[17px] ${done ? 'text-muted' : 'text-ink'}`}>{def.title}</span>
        <span className="block text-[13px] text-muted">{n(count)}/{n(def.target)} {def.unit ?? ''}{def.sub ? ` • ${def.sub}` : ''}</span>
        <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-chip"><span className="block h-full rounded-full bg-brand transition-all" style={{ width: `${Math.min(100, (count / def.target) * 100)}%` }} /></span>
      </button>
      <div className="flex shrink-0 items-center gap-1">
        <button aria-label={`${def.title} -1`} onClick={() => bump(-1)} disabled={count === 0} className="tap flex h-8 w-8 items-center justify-center rounded-full bg-chip text-brand disabled:opacity-40"><Minus size={15} /></button>
        <button aria-label={`${def.title} +10`} onClick={() => bump(10)} className="tap flex h-8 items-center justify-center rounded-full bg-chip px-2 text-[13px] text-brand">+{n(10)}</button>
      </div>
      <Sheet open={open} onClose={() => setOpen(false)} title={def.title}>
        <p className="text-muted">লক্ষ্য: {n(def.target)} {def.unit ?? ''}</p>
        <div className="mt-3 flex items-center gap-3">
          <input inputMode="numeric" className="input" value={val} onChange={(e) => setVal(e.target.value.replace(/[^\d]/g, ''))} aria-label="count" />
          <button className="btn-primary shrink-0" onClick={() => { setCount(def.id, k, Number(val) || 0, def.target); setOpen(false); }}>সেট করুন</button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button className="btn-soft" onClick={() => { setCount(def.id, k, 0, def.target); setOpen(false); }}>রিসেট</button>
          <button className="btn-soft" onClick={() => { setCount(def.id, k, def.target, def.target); setOpen(false); toast('সম্পন্ন হিসেবে চিহ্নিত'); }}>পূর্ণ করুন</button>
        </div>
      </Sheet>
    </>
  );
}

function Daily({ onEdit, onAdd }: { onEdit: (c: CustomAmol) => void; onAdd: () => void }) {
  const nav = useNavigate();
  const [key, setKey] = useState(dateKey());
  const done = useStore((s) => s.amol[key]) ?? [];
  const amol = useStore((s) => s.amol);
  const toggle = useStore((s) => s.toggleAmol);
  const custom = useStore((s) => s.customAmol);
  const modes = useStore((s) => s.prayerMode[key]) ?? {};
  const set = useStore((s) => s.set);
  const journal = useStore((s) => s.journal[key]) ?? {};
  const hijriAdjust = useStore((s) => s.settings.hijriAdjust);
  const items = useAmolItems(key);
  const { done: count, total } = useAmolProgress(key);
  const groups = groupItems(items);
  const collapsed = useStore((s) => s.collapsedGroups);
  const toggleGroup = (title: string) => set('collapsedGroups', collapsed.includes(title) ? collapsed.filter((x) => x !== title) : [...collapsed, title]);
  const pct = total ? Math.round((count / total) * 100) : 0;

  const setMode = (p: PrayerId, m: PrayerMode) => {
    const all = useStore.getState().prayerMode;
    const cur = all[key] ?? {};
    set('prayerMode', { ...all, [key]: { ...cur, [p]: cur[p] === m ? undefined : m } });
  };
  const setJournal = (patch: { mood?: number; text?: string }) => {
    const all = useStore.getState().journal;
    set('journal', { ...all, [key]: { ...(all[key] ?? {}), ...patch } });
  };

  const prayersDone = PRAYER_IDS.filter((p) => done.includes(p)).length;
  const jamaat = PRAYER_IDS.filter((p) => modes[p] === 'jamaat').length;
  const prayerStreak = useMemo(() => {
    let s = 0;
    for (let i = 0; i < 400; i++) {
      const d = dateKey(addDays(new Date(), -i));
      const c = PRAYER_IDS.filter((p) => (amol[d] ?? []).includes(p)).length;
      if (c === 5) s++; else if (i === 0) continue; else break;
    }
    return s;
  }, [amol]);

  return (
    <div>
      <WeekStrip selected={key} onSelect={setKey} />

      <div className="mx-5 mt-3 rounded-[10px] bg-lav p-5 text-ink">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="label !text-ink/60">আজকের অগ্রগতি</div>
            <div className="mt-1 text-[17px] font-bold">{n(count)}/{n(total)} আমল সম্পন্ন</div>
            <div className="mt-0.5 text-[13px] text-ink/70">{count === total && total > 0 ? 'মাশাআল্লাহ! সব আমল সম্পন্ন।' : 'প্রতিটি আমল সম্পন্ন হলে টিক দিন।'}</div>
          </div>
          <ProgressRing value={total ? count / total : 0} size={56} stroke={6} color="rgb(var(--accent))" track="rgb(255 255 255 / .7)" />
        </div>
        <div className="mt-3 text-[44px] font-extrabold leading-none">{n(pct)}%</div>
        <div className="mt-4 flex flex-wrap gap-2 text-[12px] font-semibold">
          <span className="flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1"><Flame size={13} className="text-alert" /> {n(prayerStreak)} দিন নামাজ</span>
          <span className="flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1"><CalendarCheck size={13} /> নামাজ {n(prayersDone)}/{n(5)}</span>
          <span className="flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1"><Users size={13} /> জামাতে {n(jamaat)}</span>
        </div>
      </div>

      {groups.map((g) => (
        <section key={g.title} className="page-card mt-2.5">
          <h3>
            <button onClick={() => toggleGroup(g.title)} aria-expanded={!collapsed.includes(g.title)}
              className={`flex w-full items-center justify-between gap-3 px-5 pt-4 text-left text-[15px] font-bold text-ink ${collapsed.includes(g.title) ? 'pb-4' : 'pb-1'}`}>
              <span className="min-w-0">{g.title}{g.title === GROUP_AVOID && <span className="ml-1 text-[12px]">(বিরত থাকলে টিক দিন)</span>}</span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="rounded-full bg-chip px-2 py-0.5 text-[12px] text-muted">{n(g.items.filter((i) => done.includes(i.id)).length)}/{n(g.items.length)}</span>
                <ChevronDown size={18} className={`text-muted transition-transform ${collapsed.includes(g.title) ? '-rotate-90' : ''}`} />
              </span>
            </button>
          </h3>
          {!collapsed.includes(g.title) && <ul className="divide-y divide-line">
            {g.items.map((it) => {
              const checked = done.includes(it.id);
              const streak = streakOf(amol, it, hijriAdjust);
              const customItem = it.custom ? custom.find((c) => c.id === it.id) : undefined;
              return (
                <li key={it.id} className="px-5 py-3">
                  <div className="flex items-center gap-3.5">
                    {it.type === 'count' ? <CountControl def={it} k={key} /> : (
                      <>
                        <button onClick={() => toggle(it.id, key)} aria-label={it.title}
                          className={`tap flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border-[2.5px] ${checked ? 'animate-pop border-brand bg-brand text-white' : 'border-line'}`}>
                          {checked && <Check size={18} strokeWidth={3} />}
                        </button>
                        <button className="min-w-0 flex-1 text-left" onClick={() => toggle(it.id, key)}>
                          <span className={`block text-[17px] ${checked ? 'text-muted line-through decoration-brand/50' : 'text-ink'}`}>{it.title}</span>
                          {it.sub && <span className="block text-[13px] text-muted">{it.sub}</span>}
                        </button>
                      </>
                    )}
                    {streak >= 2 && <span className="flex shrink-0 items-center gap-0.5 text-[12px] text-alert" title="ধারাবাহিকতা"><Flame size={13} />{n(streak)}</span>}
                    {it.reminder && <Bell size={14} className="shrink-0 text-muted" aria-label="reminder" />}
                    {it.link && <button onClick={() => nav(it.link!)} className="shrink-0 rounded-full bg-chip px-2.5 py-1 text-[12px] text-brand">খুলুন</button>}
                    {customItem && <button aria-label="edit" onClick={() => onEdit(customItem)} className="shrink-0 p-1 text-muted"><Pencil size={16} /></button>}
                  </div>
                  {it.prayer && checked && (
                    <div className="ml-[48px] mt-2 flex gap-2">
                      {MODES.map((m) => (
                        <button key={m.v} onClick={() => setMode(it.id as PrayerId, m.v)}
                          className={`rounded-full px-3 py-1 text-[12.5px] font-semibold ${modes[it.id as PrayerId] === m.v ? (m.v === 'qaza' ? 'bg-alert text-white' : 'bg-night text-white') : 'bg-chip text-ink'}`}>{m.l}</button>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>}
        </section>
      ))}

      <div className="px-5 pt-4">
        <button className="btn-primary w-full" onClick={onAdd}><Plus size={20} /> নিজের আমল তৈরি করুন</button>
        <button className="btn-ghost mt-1 w-full" onClick={() => nav('/amol/manage')}><SlidersHorizontal size={18} /> আমল তালিকা সাজান</button>
      </div>

      <section className="page-card mt-3 px-5 py-4">
        <h3 className="text-[17px] font-bold text-ink">আজকের মুহাসাবা</h3>
        <p className="text-[13px] text-muted">দিন শেষে নিজের আমলের হিসাব নিন — কেমন গেল আজকের দিন?</p>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {MOODS.map((m, i) => {
            const on = journal.mood === i + 1;
            return (
              <button key={m} onClick={() => setJournal({ mood: on ? undefined : i + 1 })} aria-pressed={on}
                className={`tap flex flex-col items-center gap-1.5 rounded-[10px] py-2 transition ${on ? 'bg-chip' : ''} ${journal.mood && !on ? 'opacity-45' : ''}`}>
                <MoodFace level={(i + 1) as 1 | 2 | 3 | 4} size={46} />
                <span className="text-[12.5px] font-semibold text-ink">{m}</span>
              </button>
            );
          })}
        </div>
        <textarea id={`journal-${key}`} value={journal.text ?? ''} onChange={(e) => setJournal({ text: e.target.value })} placeholder="আজ কী ভালো করেছি, কোথায় উন্নতি দরকার, আগামীকালের নিয়ত…"
          className="input mt-3 min-h-[96px] text-[15px]" />
        <p className="mt-1 text-right text-[11px] text-muted">স্বয়ংক্রিয়ভাবে সংরক্ষিত</p>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Create / edit                                                       */
/* ------------------------------------------------------------------ */

const GROUP_CHOICES = [GROUP_MINE, GROUP_SUNNAH, GROUP_DHIKR, GROUP_OTHER, GROUP_AVOID];
const WEEK_ORDER = [6, 0, 1, 2, 3, 4, 5];

type Freq = 'daily' | 'weekdays' | 'bid';
const blank = { title: '', group: GROUP_MINE, type: 'check' as 'check' | 'count', target: '33', unit: 'বার', freq: 'daily' as Freq, days: [] as number[], reminder: '', note: '' };

function toForm(c?: CustomAmol) {
  if (!c) return { ...blank };
  return {
    title: c.title, group: c.group || GROUP_MINE, type: c.type ?? 'check', target: String(c.target ?? 33), unit: c.unit ?? 'বার',
    freq: (c.hijriDays?.length ? 'bid' : c.days?.length ? 'weekdays' : 'daily') as Freq, days: c.days ?? [], reminder: c.reminder ?? '', note: c.note ?? '',
  };
}

export function AmolEditor({ open, item, onClose }: { open: boolean; item?: CustomAmol; onClose: () => void }) {
  const custom = useStore((s) => s.customAmol);
  const set = useStore((s) => s.set);
  const [tab, setTab] = useState<'create' | 'library'>('create');
  const [f, setF] = useState(toForm(item));
  const [lastItem, setLastItem] = useState<CustomAmol | undefined>(item);
  const [lastOpen, setLastOpen] = useState(open);
  const [confirmDelete, setConfirmDelete] = useState(false);
  if (item !== lastItem || open !== lastOpen) {
    setLastItem(item); setLastOpen(open);
    if (open) { setF(toForm(item)); setTab('create'); setConfirmDelete(false); }
  }

  const save = () => {
    const target = Math.max(1, Number(f.target) || 1);
    const data: CustomAmol = {
      id: item?.id ?? `c-${Date.now()}`, title: f.title.trim(), group: f.group, type: f.type,
      ...(f.type === 'count' ? { target, unit: f.unit.trim() || 'বার' } : {}),
      ...(f.freq === 'weekdays' && f.days.length ? { days: f.days } : {}),
      ...(f.freq === 'bid' ? { hijriDays: [13, 14, 15] } : {}),
      ...(f.reminder ? { reminder: f.reminder } : {}),
      ...(f.note.trim() ? { note: f.note.trim() } : {}),
      ...(item?.link ? { link: item.link } : {}),
    };
    set('customAmol', item ? custom.map((c) => (c.id === item.id ? data : c)) : [...custom, data]);
    if (f.reminder && typeof Notification !== 'undefined' && Notification.permission === 'default') Notification.requestPermission().catch(() => undefined);
    toast(item ? 'আমল আপডেট হয়েছে' : 'নতুন আমল যোগ হয়েছে');
    onClose();
  };

  const remove = () => {
    if (!item) return;
    set('customAmol', custom.filter((c) => c.id !== item.id));
    toast('আমল মুছে ফেলা হয়েছে');
    onClose();
  };

  const addFromLibrary = (l: (typeof LIBRARY)[number]) => {
    set('customAmol', [...useStore.getState().customAmol, { ...l, id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }]);
    toast(`"${l.title}" যোগ হয়েছে`);
  };

  const valid = f.title.trim().length > 0 && (f.freq !== 'weekdays' || f.days.length > 0);

  return (
    <Sheet open={open} onClose={onClose} title={item ? 'আমল সম্পাদনা' : 'নতুন আমল'}>
      {!item && (
        <div className="mb-4">
          <Segmented value={tab} onChange={setTab} options={[{ value: 'create', label: 'নিজে তৈরি করুন' }, { value: 'library', label: 'আমল লাইব্রেরি' }]} />
        </div>
      )}
      {tab === 'library' && !item ? (
        <div>
          <p className="mb-2 text-[13px] text-muted">সুন্নাহভিত্তিক জনপ্রিয় আমল — এক চাপে আপনার তালিকায় যোগ করুন।</p>
          {[GROUP_DHIKR, GROUP_SUNNAH, GROUP_OTHER, GROUP_AVOID].map((g) => (
            <div key={g} className="mb-2">
              <div className="py-2 text-[13px] text-brand">{g}</div>
              {LIBRARY.filter((l) => l.group === g).map((l) => {
                const added = custom.some((c) => c.title === l.title);
                return (
                  <div key={l.title} className="flex items-center gap-3 border-b border-line py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="text-[16px] text-ink">{l.title}</div>
                      <div className="text-[12px] text-muted">
                        {l.type === 'count' ? `লক্ষ্য ${n(l.target ?? 1)} ${l.unit ?? ''}` : 'টিক চিহ্ন'}
                        {l.days?.length ? ` • ${l.days.map((d) => WEEKDAYS_BN[d]).join(', ')}` : ''}
                        {l.note ? ` • ${l.note}` : ''}
                      </div>
                    </div>
                    <button disabled={added} onClick={() => addFromLibrary(l)}
                      className={`shrink-0 rounded-full px-3 py-1 text-[13px] ${added ? 'bg-chip text-muted' : 'bg-brand text-white'}`}>
                      {added ? 'যোগ হয়েছে' : <span className="flex items-center gap-1"><BookmarkPlus size={14} /> যোগ</span>}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-[13px] text-muted">আমলের নাম</span>
            <input id="amal-title" autoFocus className="input" placeholder="যেমন: সূরা ইয়াসীন তিলাওয়াত" value={f.title} maxLength={60} onChange={(e) => setF({ ...f, title: e.target.value })} />
          </label>

          <div>
            <span className="mb-1.5 block text-[13px] text-muted">ধরন</span>
            <div className="grid grid-cols-2 gap-2">
              {([['check', 'টিক চিহ্ন', 'করেছি / করিনি'], ['count', 'গণনা', 'নির্দিষ্ট সংখ্যা পূরণ']] as const).map(([v, l, sub]) => (
                <button key={v} onClick={() => setF({ ...f, type: v })} className={`rounded-[10px] border-2 p-3 text-left ${f.type === v ? 'border-brand bg-chip' : 'border-line'}`}>
                  <span className="block text-[15px] text-ink">{l}</span><span className="text-[12px] text-muted">{sub}</span>
                </button>
              ))}
            </div>
            {f.type === 'count' && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="text-[13px] text-muted">লক্ষ্য<input id="amal-target" inputMode="numeric" className="input mt-1" value={f.target} onChange={(e) => setF({ ...f, target: e.target.value.replace(/[^\d]/g, '') })} /></label>
                <label className="text-[13px] text-muted">একক<input id="amal-unit" className="input mt-1" value={f.unit} placeholder="বার / পৃষ্ঠা / রাকাত" onChange={(e) => setF({ ...f, unit: e.target.value })} /></label>
              </div>
            )}
          </div>

          <div>
            <span className="mb-1.5 block text-[13px] text-muted">বিভাগ</span>
            <div className="flex flex-wrap gap-2">
              {GROUP_CHOICES.map((g) => (
                <button key={g} onClick={() => setF({ ...f, group: g })} className={`rounded-full px-3 py-1 text-[14px] ${f.group === g ? 'bg-night text-white' : 'bg-surface text-ink ring-1 ring-line'}`}>{g}</button>
              ))}
            </div>
          </div>

          <div>
            <span className="mb-1.5 block text-[13px] text-muted">কখন করবেন</span>
            <div className="flex flex-wrap gap-2">
              {([['daily', 'প্রতিদিন'], ['weekdays', 'নির্দিষ্ট বারে'], ['bid', 'আইয়ামে বীয (১৩-১৫ হিজরি)']] as const).map(([v, l]) => (
                <button key={v} onClick={() => setF({ ...f, freq: v })} className={`rounded-full px-3 py-1 text-[14px] ${f.freq === v ? 'bg-night text-white' : 'bg-surface text-ink ring-1 ring-line'}`}>{l}</button>
              ))}
            </div>
            {f.freq === 'weekdays' && (
              <div className="mt-2 grid grid-cols-7 gap-1">
                {WEEK_ORDER.map((d) => {
                  const on = f.days.includes(d);
                  return (
                    <button key={d} onClick={() => setF({ ...f, days: on ? f.days.filter((x) => x !== d) : [...f.days, d] })}
                      className={`rounded-[10px] py-2 text-[13px] ${on ? 'bg-night text-white' : 'bg-surface text-ink ring-1 ring-line'}`}>{WEEKDAYS_BN[d]}</button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-[13px] text-muted">রিমাইন্ডার (ঐচ্ছিক)
              <input id="amal-reminder" type="time" className="input mt-1" value={f.reminder} onChange={(e) => setF({ ...f, reminder: e.target.value })} />
            </label>
            <label className="text-[13px] text-muted">নোট (ঐচ্ছিক)
              <input id="amal-note" className="input mt-1" value={f.note} maxLength={60} placeholder="যেমন: ফজরের পর" onChange={(e) => setF({ ...f, note: e.target.value })} />
            </label>
          </div>

          <button className="btn-primary w-full" disabled={!valid} onClick={save}>{item ? 'সংরক্ষণ করুন' : 'আমল যোগ করুন'}</button>
          {item && (confirmDelete ? (
            <div className="flex gap-2">
              <button className="btn-soft flex-1" onClick={() => setConfirmDelete(false)}>বাতিল</button>
              <button className="btn flex-1 bg-red-600 text-white" onClick={remove}><Trash2 size={16} /> নিশ্চিত, মুছুন</button>
            </div>
          ) : (
            <button className="btn-ghost w-full text-red-600" onClick={() => setConfirmDelete(true)}><Trash2 size={16} /> আমলটি মুছে ফেলুন</button>
          ))}
        </div>
      )}
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* Manage                                                              */
/* ------------------------------------------------------------------ */

export function AmolManage() {
  const custom = useStore((s) => s.customAmol);
  const hidden = useStore((s) => s.hiddenAmol);
  const set = useStore((s) => s.set);
  const [editor, setEditor] = useState<{ open: boolean; item?: CustomAmol }>({ open: false });
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= custom.length) return;
    const next = [...custom];
    [next[i], next[j]] = [next[j], next[i]];
    set('customAmol', next);
  };
  const schedule = (c: CustomAmol) =>
    c.hijriDays?.length ? 'আইয়ামে বীয' : c.days?.length ? WEEK_ORDER.filter((d) => c.days!.includes(d)).map((d) => WEEKDAYS_BN[d]).join(', ') : 'প্রতিদিন';

  return (
    <div>
      <PageHeader back title="আমল তালিকা" right={<IconButton label="add amal" tone="brand" onClick={() => setEditor({ open: true })}><Plus size={20} /></IconButton>} />
      <h3 className="label px-6 pb-2 pt-5">আমার তৈরি আমল ({n(custom.length)})</h3>
      <div className="page-card">
        {custom.length === 0 && (
          <div className="px-5 py-6 text-center">
            <p className="text-ink">এখনও কোনো নিজস্ব আমল নেই</p>
            <p className="text-[13px] text-muted">নিজে তৈরি করুন অথবা লাইব্রেরি থেকে যোগ করুন</p>
            <button className="btn-primary mt-3" onClick={() => setEditor({ open: true })}><Plus size={18} /> আমল যোগ করুন</button>
          </div>
        )}
        {custom.map((c, i) => (
          <div key={c.id} className="flex items-center gap-2 border-b border-line px-4 py-3">
            <div className="flex flex-col">
              <button aria-label="move up" disabled={i === 0} onClick={() => move(i, -1)} className="text-muted disabled:opacity-25"><ChevronLeft size={16} className="rotate-90" /></button>
              <button aria-label="move down" disabled={i === custom.length - 1} onClick={() => move(i, 1)} className="text-muted disabled:opacity-25"><ChevronLeft size={16} className="-rotate-90" /></button>
            </div>
            <button className="min-w-0 flex-1 text-left" onClick={() => setEditor({ open: true, item: c })}>
              <span className="block truncate text-[16px] text-ink">{c.title}</span>
              <span className="block text-[12px] text-muted">
                {c.group || GROUP_MINE} • {c.type === 'count' ? `লক্ষ্য ${n(c.target ?? 1)} ${c.unit ?? ''}` : 'টিক'} • {schedule(c)}{c.reminder ? ` • ⏰ ${n(c.reminder)}` : ''}
              </span>
            </button>
            <button aria-label="edit" onClick={() => setEditor({ open: true, item: c })} className="p-2 text-muted"><Pencil size={17} /></button>
          </div>
        ))}
      </div>

      <h3 className="label px-6 pb-2 pt-6">ডিফল্ট আমল — প্রয়োজন না হলে বন্ধ রাখুন</h3>
      <div className="page-card">
        {BUILTIN.map((b) => (
          <div key={b.id} className="flex items-center justify-between border-b border-line px-5 py-3">
            <span>
              <span className="block text-[16px] text-ink">{b.title}</span>
              <span className="text-[12px] text-muted">{b.group}{b.type === 'count' ? ` • লক্ষ্য ${n(b.target)} ${b.unit}` : ''}</span>
            </span>
            {b.prayer ? <span className="text-[12px] text-muted">সবসময়</span> : (
              <Toggle label={b.title} checked={!hidden.includes(b.id)} onChange={(v) => set('hiddenAmol', v ? hidden.filter((x) => x !== b.id) : [...hidden, b.id])} />
            )}
          </div>
        ))}
      </div>
      {hidden.length > 0 && <div className="p-5"><button className="btn-soft w-full" onClick={() => set('hiddenAmol', [])}>সব ডিফল্ট আমল চালু করুন</button></div>}
      <AmolEditor open={editor.open} item={editor.item} onClose={() => setEditor({ open: false })} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Stats                                                               */
/* ------------------------------------------------------------------ */

function Stats() {
  const amol = useStore((s) => s.amol);
  const modes = useStore((s) => s.prayerMode);
  const custom = useStore((s) => s.customAmol);
  const hidden = useStore((s) => s.hiddenAmol);
  const adj = useStore((s) => s.settings.hijriAdjust);
  const journal = useStore((s) => s.journal);
  const todayKey = dateKey();
  const days = useMemo(() => Array.from({ length: 30 }, (_, i) => addDays(keyToDate(todayKey), -29 + i)), [todayKey]);

  const prayerCount = (d: Date) => (amol[dateKey(d)] ?? []).filter((x) => (PRAYER_IDS as string[]).includes(x)).length;
  const last7 = days.slice(-7);

  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const c = prayerCount(addDays(new Date(), -i));
    if (c === 5) streak++; else if (i === 0) continue; else break;
  }
  let best = 0, run = 0;
  Object.keys(amol).sort().forEach((k, idx, arr) => {
    const full = (amol[k] ?? []).filter((x) => (PRAYER_IDS as string[]).includes(x)).length === 5;
    const prev = idx > 0 ? arr[idx - 1] : null;
    const consecutive = prev && dateKey(addDays(keyToDate(prev), 1)) === k;
    run = full ? (consecutive ? run + 1 : 1) : 0;
    best = Math.max(best, run);
  });

  // daily completion % over all applicable deeds
  const dayPct = days.map((d) => {
    const items = itemsFor(d, adj, custom, hidden);
    const ids = new Set(items.map((i) => i.id));
    const c = (amol[dateKey(d)] ?? []).filter((x) => ids.has(x)).length;
    return items.length ? c / items.length : 0;
  });
  const avg = Math.round((dayPct.reduce((a, b) => a + b, 0) / days.length) * 100);

  // jamaat ratio over prayed prayers
  let prayed = 0, jam = 0, qaza = 0;
  days.forEach((d) => {
    const k = dateKey(d);
    PRAYER_IDS.forEach((p) => {
      if ((amol[k] ?? []).includes(p)) { prayed++; if (modes[k]?.[p] === 'jamaat') jam++; if (modes[k]?.[p] === 'qaza') qaza++; }
    });
  });

  // per-deed completion over applicable days
  const uniqueDefs: AmolDef[] = [...BUILTIN.filter((b) => !b.prayer && !hidden.includes(b.id)), ...custom.map(customToDef)];
  const perDeed = uniqueDefs.map((def) => {
    let applicable = 0, doneCount = 0;
    days.forEach((d) => {
      const scheduled = def.days?.length || def.hijriDays?.length;
      if (scheduled) {
        const hd = def.hijriDays?.length ? toHijri(d, adj).day : 0;
        const ok = (def.days?.includes(d.getDay()) ?? false) || (def.hijriDays?.includes(hd) ?? false);
        if (!ok) return;
      }
      applicable++;
      if ((amol[dateKey(d)] ?? []).includes(def.id)) doneCount++;
    });
    return { def, applicable, doneCount, rate: applicable ? doneCount / applicable : 0, streak: streakOf(amol, def, adj) };
  }).sort((a, b) => b.rate - a.rate);

  const names: Record<string, string> = { fajr: 'ফজর', dhuhr: 'যোহর', asr: 'আসর', maghrib: 'মাগরিব', isha: 'ইশা' };
  const perPrayer = PRAYER_IDS.map((p) => ({ p, c: days.filter((d) => (amol[dateKey(d)] ?? []).includes(p)).length }));
  const moodDays = days.map((d) => journal[dateKey(d)]?.mood).filter((m): m is number => !!m);
  const avgMood = moodDays.length ? moodDays.reduce((a, b) => a + b, 0) / moodDays.length : 0;

  return (
    <div className="space-y-2.5 pt-2.5">
      <div className="grid grid-cols-3 gap-2.5 px-5">
        {[
          { icon: <Flame className="text-alert" size={20} />, v: n(streak), l: 'নামাজের স্ট্রিক' },
          { icon: <Trophy className="text-m-yellow" size={20} />, v: n(best), l: 'সেরা স্ট্রিক' },
          { icon: <Check className="text-brand" size={20} />, v: `${n(avg)}%`, l: '৩০ দিনের গড়' },
          { icon: <Users className="text-brand" size={20} />, v: `${n(prayed ? Math.round((jam / prayed) * 100) : 0)}%`, l: 'জামাতে নামাজ' },
          { icon: <CalendarCheck className="text-brand" size={20} />, v: n(prayed), l: '৩০ দিনে নামাজ' },
          { icon: <Minus className="text-alert" size={20} />, v: n(qaza), l: 'কাযা আদায়' },
        ].map((s) => (
          <div key={s.l} className="card p-3">
            <div className="flex">{s.icon}</div>
            <div className="mt-2 text-[22px] font-extrabold leading-none text-ink">{s.v}</div>
            <div className="mt-1 text-[11px] text-muted">{s.l}</div>
          </div>
        ))}
      </div>

      <section className="page-card px-5 py-4">
        <h3 className="text-[17px] font-bold text-ink">গত ৭ দিনের নামাজ</h3>
        <div className="mt-4 flex h-44 items-end justify-between gap-2" role="img" aria-label="last 7 days prayers chart">
          {last7.map((d, i) => {
            const c = prayerCount(d);
            const tone = c === 5 ? 'bg-m-green' : c === 4 ? 'bg-m-yellow' : c === 3 ? 'bg-m-blue' : c > 0 ? 'bg-m-pink' : 'bg-line';
            const level = (c === 5 ? 4 : c === 4 ? 3 : c >= 2 ? 2 : 1) as 1 | 2 | 3 | 4;
            const isLast = i === last7.length - 1;
            return (
              <div key={dateKey(d)} className="flex flex-1 flex-col items-center gap-1.5">
                {c > 0 && <MoodFace level={level} size={26} />}
                <div className={`w-full max-w-[26px] rounded-full transition-all ${tone}`} style={{ height: `${(c / 5) * 96 + 18}px` }} title={`${n(c)}/${n(5)}`} />
                <span className={`text-[11px] font-semibold ${isLast ? 'text-ink' : 'text-muted'}`}>{WEEKDAYS_BN[d.getDay()]}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="page-card px-5 py-4">
        <h3 className="text-[17px] font-bold text-ink">ওয়াক্ত অনুযায়ী (৩০ দিন)</h3>
        <div className="mt-3 space-y-3">
          {perPrayer.map(({ p, c }) => (
            <div key={p}>
              <div className="flex justify-between text-sm text-ink"><span>{names[p]}</span><span>{n(c)}/{n(30)}</span></div>
              <div className="mt-1 h-2 rounded-full bg-chip"><div className="h-full rounded-full bg-brand" style={{ width: `${(c / 30) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      </section>

      <section className="page-card px-5 py-4">
        <h3 className="text-[17px] font-bold text-ink">আমল অনুযায়ী ধারাবাহিকতা (৩০ দিন)</h3>
        <div className="mt-2 divide-y divide-line">
          {perDeed.map(({ def, applicable, doneCount, rate, streak: s }) => (
            <div key={def.id} className="py-2.5">
              <div className="flex items-center justify-between gap-3 text-[14px]">
                <span className="min-w-0 flex-1 truncate text-ink">{def.title}{def.custom && <span className="ml-1 text-[11px] text-brand">নিজস্ব</span>}</span>
                {s >= 2 && <span className="flex items-center gap-0.5 text-[12px] text-alert"><Flame size={12} />{n(s)}</span>}
                <span className="w-16 text-right text-muted">{n(doneCount)}/{n(applicable)}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-chip"><div className="h-full rounded-full bg-brand" style={{ width: `${rate * 100}%` }} /></div>
            </div>
          ))}
        </div>
      </section>

      <section className="page-card px-5 py-4">
        <h3 className="text-[17px] font-bold text-ink">৩০ দিনের আমল ক্যালেন্ডার</h3>
        <div className="mt-3 grid grid-cols-10 gap-1.5">
          {days.map((d, i) => (
            <div key={dateKey(d)} title={`${dateKey(d)}: ${Math.round(dayPct[i] * 100)}%`} className="aspect-square rounded"
              style={{ background: dayPct[i] ? `rgb(var(--brand) / ${0.15 + dayPct[i] * 0.85})` : 'rgb(var(--line))' }} />
          ))}
        </div>
        <div className="mt-2 text-xs text-muted">গাঢ় রং = সেদিন বেশি আমল সম্পন্ন</div>
      </section>

      {moodDays.length > 0 && (
        <section className="page-card px-5 py-4">
          <h3 className="text-[17px] font-bold text-ink">মুহাসাবা</h3>
          <p className="mt-1 text-[14px] text-muted">{n(moodDays.length)} দিন হিসাব নিয়েছেন • গড় অনুভূতি: {MOODS[Math.round(avgMood) - 1]}</p>
        </section>
      )}
    </div>
  );
}
