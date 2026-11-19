import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowDownRight, ArrowUpRight, Bell, BookOpen, Check, ShieldCheck, Target, ChevronDown, ChevronLeft, ChevronRight, Flame, ListChecks, Minus, MoonStar, Pencil, Plus, SlidersHorizontal, Sparkles, Trash2, Trophy, Users, BookmarkPlus, CalendarCheck, CalendarDays } from 'lucide-react';
import { IconButton, PageHeader, ProgressRing, Segmented, Sheet, Toggle, toast } from '../components/ui';
import { RangeCalendar } from '../components/RangeCalendar';
import { HandsIcon, MoodFace } from '../components/icons';
import { notifyPermission, requestNotifyPermission } from '../lib/native';
import { useStore, type CustomAmol, type PrayerMode } from '../store/useStore';
import { addDays, dateKey, keyToDate, n } from '../lib/bn';
import { formatGregorian, toHijri, WEEKDAYS_BN, WEEKDAYS_BN_FULL } from '../lib/dates';
import { PRAYER_IDS, type PrayerId } from '../lib/prayer';
import {
  BUILTIN, SECTION_MINE, allGroups, customToDef, GROUP_AKHLAQ, GROUP_AVOID, GROUP_DAILY_SUNNAH, GROUP_DHIKR, GROUP_MINE, GROUP_QURAN, GROUP_SALAH, GROUP_SUNNAH, LIBRARY, allDetails, detailNoun, groupItems, itemScore, itemsFor, normalizeGroup, sectionItems, setMainSunnahDone, shownDetails, syncMainSunnah, toggleSunnahDetail, type AmolDetail, streakOf, useAmolItems, useAmolProgress, type AmolDef,
} from '../lib/amol';

export { useAmolProgress };

const MODES: { v: PrayerMode; l: string }[] = [
  { v: 'jamaat', l: 'জামাতে' },
  { v: 'alone', l: 'একা' },
  { v: 'qaza', l: 'কাযা' },
];
const MOODS = ['দুর্বল', 'মোটামুটি', 'ভালো', 'চমৎকার'];
/** One colour per category, for the statistics tiles */
const CAT_COLORS: Record<string, string> = {
  [GROUP_SALAH]: 'rgb(var(--brand))',
  [GROUP_QURAN]: 'rgb(var(--success))',
  [GROUP_DHIKR]: 'rgb(var(--accent))',
  [GROUP_DAILY_SUNNAH]: '#c99a12',
  [GROUP_AKHLAQ]: '#d24a63',
  [GROUP_AVOID]: 'rgb(var(--alert))',
  [GROUP_MINE]: 'rgb(var(--muted))',
};

/** A half-circle of rounded segments, filled from the left up to `value` (0–1) */
function Gauge({ value, segments = 24 }: { value: number; segments?: number }) {
  // ~3px gaps at the inner edge: π × inner / (segments − 1) ≈ 13 > w
  const cx = 150, cy = 150, inner = 98, len = 42, w = 10;
  // any progress at all lights at least the first segment (২% would otherwise round to none)
  const v = Math.max(0, Math.min(1, value));
  const filled = v > 0 ? Math.max(1, Math.round(v * segments)) : 0;
  return (
    <svg viewBox="0 0 300 160" className="block w-full" aria-hidden>
      {Array.from({ length: segments }, (_, i) => {
        const angle = 180 - (i * 180) / (segments - 1);
        return (
          <rect key={i} x={cx + inner} y={cy - w / 2} width={len} height={w} rx={w / 2}
            transform={`rotate(${-angle} ${cx} ${cy})`} fill={i < filled ? '#bfe82a' : 'rgb(var(--line))'} />
        );
      })}
    </svg>
  );
}

/** Header icon for each sectioned card */
const CARD_ICONS: Record<string, JSX.Element> = {
  [GROUP_SALAH]: <MoonStar size={20} />,
  [GROUP_QURAN]: <BookOpen size={20} />,
  [GROUP_DHIKR]: <HandsIcon size={21} strokeWidth={1.9} />,
  [GROUP_DAILY_SUNNAH]: <Sparkles size={20} />,
  [GROUP_AKHLAQ]: <Users size={20} />,
  [GROUP_AVOID]: <ShieldCheck size={20} />,
  [GROUP_MINE]: <Target size={20} />,
};

export default function AmolTracker() {
  const [params, setParams] = useSearchParams();
  const nav = useNavigate();
  const tab = (params.get('tab') as 'today' | 'stats') ?? 'today';
  const [editor, setEditor] = useState<{ open: boolean; item?: CustomAmol }>({ open: false });
  // A statistics tile's day list brings its own header with a back button
  const detail = tab === 'stats' && !!params.get('detail');
  return (
    <div>
      {!detail && <PageHeader back title="আমল ট্র্যাকার" right={<IconButton label="manage amal" onClick={() => nav('/amol/manage')}><SlidersHorizontal size={18} /></IconButton>} />}
      {!detail && <div className="px-5 pt-8">
        <Segmented value={tab} onChange={(v) => setParams(v === 'today' ? {} : { tab: v }, { replace: true })}
          options={[{ value: 'today', label: 'দৈনিক আমল' }, { value: 'stats', label: 'পরিসংখ্যান' }]} />
      </div>}
      {tab === 'today' ? <Daily onEdit={(item) => setEditor({ open: true, item })} onAdd={() => setEditor({ open: true })} /> : <Stats />}
      <AmolEditor open={editor.open} item={editor.item} onClose={() => setEditor({ open: false })} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Daily                                                               */
/* ------------------------------------------------------------------ */

// Thursday is too long to sit inside the day circle
const shortDay = (i: number) => (i === 4 ? 'বৃহঃ' : WEEKDAYS_BN[i]);

const SLIDE_MS = 200;

function WeekStrip({ selected, onSelect }: { selected: string; onSelect: (k: string) => void }) {
  const sel = keyToDate(selected);
  // Bangladeshi week: Saturday → Friday
  const start = addDays(sel, -((sel.getDay() + 1) % 7));
  const today = dateKey();
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const canNext = dateKey(addDays(start, 7)) <= today;

  // Carousel: the row follows the finger, then slides a whole week out and the next one in
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const swallowClick = useRef(false);
  const busy = useRef(false);
  const [dx, setDx] = useState(0);
  const [animate, setAnimate] = useState(false);

  const goPrev = () => onSelect(dateKey(addDays(sel, -7)));
  const goNext = () => {
    const next = addDays(sel, 7);
    onSelect(dateKey(next) > today ? today : dateKey(next));
  };
  /** dir -1 = to the next (later) week, content moves left; dir 1 = to the previous week */
  const slide = (dir: 1 | -1) => {
    if (busy.current || (dir === -1 && !canNext)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { dir === -1 ? goNext() : goPrev(); setDx(0); return; }
    busy.current = true;
    const w = track.current?.offsetWidth ?? 300;
    setAnimate(true);
    setDx(dir * w);
    window.setTimeout(() => {
      dir === -1 ? goNext() : goPrev();
      setAnimate(false);
      setDx(-dir * w);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        setAnimate(true);
        setDx(0);
        window.setTimeout(() => { busy.current = false; }, SLIDE_MS);
      }));
    }, SLIDE_MS);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (busy.current || (e.pointerType === 'mouse' && e.button !== 0)) return;
    drag.current = { x: e.clientX, y: e.clientY, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    let move = e.clientX - d.x;
    if (!d.moved) {
      if (Math.abs(move) < 8) return;
      if (Math.abs(e.clientY - d.y) > Math.abs(move)) { drag.current = null; return; } // vertical scroll wins
      d.moved = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    if (move < 0 && !canNext) move *= 0.25; // nothing ahead of this week: rubber-band
    setAnimate(false);
    setDx(move);
  };
  const onPointerEnd = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d?.moved) return;
    swallowClick.current = true;
    const move = e.clientX - d.x;
    const threshold = Math.min(60, (track.current?.offsetWidth ?? 300) * 0.18);
    if (move < -threshold && canNext) slide(-1);
    else if (move > threshold) slide(1);
    else { setAnimate(true); setDx(0); }
  };

  return (
    <div className="mt-10 flex items-center gap-1 px-3">
      <button aria-label="previous week" className="tap shrink-0 rounded-full p-1 text-muted" onClick={() => slide(1)}><ChevronLeft size={18} /></button>
      <div ref={track} className="min-w-0 flex-1 touch-pan-y select-none overflow-hidden"
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerEnd}
        onPointerCancel={() => { drag.current = null; setAnimate(true); setDx(0); }}
        onClickCapture={(e) => { if (swallowClick.current) { swallowClick.current = false; e.preventDefault(); e.stopPropagation(); } }}>
        <div className="grid grid-cols-7 gap-0.5" style={{ transform: `translateX(${dx}px)`, transition: animate ? `transform ${SLIDE_MS}ms cubic-bezier(.2,.8,.2,1)` : 'none' }}>
          {days.map((d) => {
            const k = dateKey(d);
            const future = k > today;
            const active = k === selected;
            return (
              <button key={k} disabled={future} onClick={() => onSelect(k)} aria-pressed={active} draggable={false}
                className={`mx-auto flex aspect-square w-full max-w-[42px] flex-col items-center justify-center gap-[3px] rounded-full leading-none transition-colors disabled:opacity-35 ${active ? 'bg-brand text-white' : 'bg-chip'}`}>
                <span className={`text-[9.5px] font-semibold ${active ? 'text-white/75' : d.getDay() === 5 ? 'text-brand' : 'text-muted'}`}>{shortDay(d.getDay())}</span>
                <span className={`text-[13px] font-bold ${active ? '' : k === today ? 'text-brand' : 'text-ink'}`}>{n(d.getDate())}</span>
              </button>
            );
          })}
        </div>
      </div>
      <button aria-label="next week" disabled={!canNext} className="tap shrink-0 rounded-full p-1 text-muted disabled:opacity-30" onClick={() => slide(-1)}><ChevronRight size={18} /></button>
    </div>
  );
}

function CountControl({ def, k, onChange }: { def: AmolDef; k: string; onChange?: () => void }) {
  const count = useStore((s) => s.amolCounts[k]?.[def.id] ?? 0);
  const saveCount = useStore((s) => s.setAmolCount);
  // onChange lets a checklist page re-check its main item after the count moves
  const setCount = (id: string, key: string, v: number, target: number) => { saveCount(id, key, v, target); onChange?.(); };
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
        {done ? (
          <span className="flex h-[34px] w-[34px] items-center justify-center">
            <span className="flex h-[22px] w-[22px] items-center justify-center rounded-[6px] bg-success text-white"><Check size={14} strokeWidth={3.5} /></span>
          </span>
        ) : (
          <ProgressRing value={count / def.target} size={34} stroke={3} color="rgb(var(--success))" track="rgb(var(--line))">
            <span className="text-[11px] text-ink">{n(count)}</span>
          </ProgressRing>
        )}
      </button>
      <button className="min-w-0 flex-1 text-left" onClick={() => { setVal(String(count)); setOpen(true); }}>
        <span className={`block text-[17px] ${done ? 'text-muted' : 'text-ink'}`}>{def.title}</span>
        <span className="block text-[13px] text-muted">{n(count)}/{n(def.target)} {def.unit ?? ''}{def.sub ? ` • ${def.sub}` : ''}</span>
        <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-chip"><span className="block h-full rounded-full bg-success transition-all" style={{ width: `${Math.min(100, (count / def.target) * 100)}%` }} /></span>
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
  const groupOrder = useStore((s) => s.groupOrder);
  const hiddenAmol = useStore((s) => s.hiddenAmol);
  const addedDetails = useStore((s) => s.customDetails);
  const hiddenGroups = useStore((s) => s.hiddenGroups);
  // ব্যক্তিগত আমল shows even when empty, so there's always a place to start the user's own list
  const groups = groupItems(items, groupOrder, hiddenGroups.includes(GROUP_MINE) ? [] : [GROUP_MINE]);
  const collapsed = useStore((s) => s.collapsedGroups);
  // Tick (or clear) every deed in a group at once; counters jump to their target or back to zero
  const setGroupDone = (items: AmolDef[], on: boolean) => {
    const st = useStore.getState();
    const cur = st.amol[key] ?? [];
    for (const it of items) {
      if (it.type === 'count') st.setAmolCount(it.id, key, on ? it.target : 0, it.target);
      else if (it.details) setMainSunnahDone(key, it, on);
      else if (cur.includes(it.id) !== on) st.toggleAmol(it.id, key);
    }
    // Prayers ticked from the group header default to জামাতে (a tag already chosen is kept);
    // clearing the group clears their tags so the জামাতে count stays in step
    const prayers = items.filter((it) => it.prayer).map((it) => it.id as PrayerId);
    if (prayers.length) {
      const allModes = st.prayerMode;
      const dayModes = { ...(allModes[key] ?? {}) };
      for (const p of prayers) {
        if (!on) delete dayModes[p];
        else if (!dayModes[p]) dayModes[p] = 'jamaat';
      }
      set('prayerMode', { ...allModes, [key]: dayModes });
    }
    navigator.vibrate?.(on ? [40, 30, 40] : 10);
  };
  const toggleGroup = (title: string) => set('collapsedGroups', collapsed.includes(title) ? collapsed.filter((x) => x !== title) : [...collapsed, title]);
  const pct = total ? Math.round((count / total) * 100) : 0;

  const setMode = (p: PrayerId, m: PrayerMode) => {
    const all = useStore.getState().prayerMode;
    const cur = all[key] ?? {};
    set('prayerMode', { ...all, [key]: { ...cur, [p]: cur[p] === m ? undefined : m } });
  };
  // Square tick-all box for a group or a নামাজ section; a dash shows when only some are done
  const groupCheck = (items: AmolDef[], title: string, pad: string) => {
    const doneN = items.filter((i) => done.includes(i.id)).length;
    const all = doneN === items.length;
    return (
      <button onClick={() => setGroupDone(items, !all)} aria-label={all ? `${title}: সব টিক তুলুন` : `${title}: সব টিক দিন`} aria-pressed={all}
        className={`tap flex w-[34px] shrink-0 items-center justify-center ${pad}`}>
        <span className={`flex h-[22px] w-[22px] items-center justify-center rounded-[6px] transition ${all ? 'bg-success text-white' : doneN ? 'border-2 border-success' : 'border-2 border-line'}`}>
          {all ? <Check size={14} strokeWidth={3.5} /> : doneN > 0 && <span className="h-0.5 w-2 rounded-full bg-success" />}
        </span>
      </button>
    );
  };

  // One deed. In a sectioned card (`withStatus`: নামাজ, কুরআন) the row also says সম্পন্ন / বাকি on the right.
  const itemRow = (it: AmolDef, withStatus: boolean) => {
    const checked = done.includes(it.id);
    const streak = streakOf(amol, it, hijriAdjust);
    const customItem = it.custom ? custom.find((c) => c.id === it.id) : undefined;
    // a main sunnah ticks with all its details, shows how many are done, and opens its page for this day
    const details = it.details ? shownDetails(it, hiddenAmol, addedDetails) : undefined;
    const toggleIt = () => (it.details ? setMainSunnahDone(key, it, !checked) : toggle(it.id, key));
    const sub = details?.length ? `${n(details.filter((d) => done.includes(d.id)).length)}/${n(details.length)} ${detailNoun(it.group)} সম্পন্ন` : it.sub;
    const openLink = () => nav(it.details ? `${it.link}?date=${key}` : it.link!);
    return (
      <>
        <div className="flex items-center gap-3.5">
          {it.type === 'count' ? <CountControl def={it} k={key} /> : (
            <>
              <button onClick={toggleIt} aria-label={it.title}
                className="tap flex h-[34px] w-[34px] shrink-0 items-center justify-center">
                <span className={`flex h-[22px] w-[22px] items-center justify-center rounded-[6px] transition ${checked ? 'animate-pop bg-success text-white' : 'border-2 border-line'}`}>
                  {checked && <Check size={14} strokeWidth={3.5} />}
                </span>
              </button>
              {/* a main sunnah's name opens its detail list, so a stray tap can't tick all its details */}
              <button className="min-w-0 flex-1 text-left" onClick={it.details ? openLink : toggleIt}>
                <span className={`block ${withStatus ? 'text-[16px]' : 'text-[17px]'} ${checked ? 'text-muted line-through decoration-success/50' : 'text-ink'}`}>{it.title}</span>
                {sub && <span className="block text-[13px] text-muted">{sub}</span>}
              </button>
            </>
          )}
          {streak >= 2 && <span className="flex shrink-0 items-center gap-0.5 text-[12px] text-alert" title="ধারাবাহিকতা"><Flame size={13} />{n(streak)}</span>}
          {it.reminder && <Bell size={14} className="shrink-0 text-muted" aria-label="reminder" />}
          {it.link && (withStatus
            ? <button onClick={openLink} aria-label={`${it.title}: খুলুন`} className="tap flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-chip text-brand"><ArrowUpRight size={16} /></button>
            : <button onClick={openLink} className="shrink-0 rounded-full bg-chip px-2.5 py-1 text-[12px] text-brand">খুলুন</button>)}
          {customItem && <button aria-label="edit" onClick={() => onEdit(customItem)} className="shrink-0 p-1 text-muted"><Pencil size={16} /></button>}
        </div>
        {it.prayer && checked && (
          <div className="ml-[48px] mt-1.5 flex gap-2 pb-1">
            {MODES.map((m) => (
              <button key={m.v} onClick={() => setMode(it.id as PrayerId, m.v)}
                className={`rounded-full px-3 py-1 text-[12.5px] font-semibold ${modes[it.id as PrayerId] === m.v ? (m.v === 'qaza' ? 'bg-alert text-white' : 'bg-night text-white') : 'bg-chip text-ink'}`}>{m.l}</button>
            ))}
          </div>
        )}
      </>
    );
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

      <div className="mx-5 mt-6 flex items-center gap-4 rounded-[10px] bg-chip/60 p-5 text-ink">
        <div className="min-w-0 flex-1">
          <div className="label !text-ink/60">আজকের অগ্রগতি</div>
          <div className="mt-1 text-[17px] font-bold">{n(count)}/{n(total)} আমল সম্পন্ন</div>
          <div className="mt-0.5 text-[13px] text-ink/70">{count === total && total > 0 ? 'মাশাআল্লাহ! সব আমল সম্পন্ন।' : 'প্রতিটি আমল সম্পন্ন হলে টিক দিন।'}</div>
          <div className="mt-4 flex flex-wrap gap-1.5 text-[12px] font-semibold">
            <span className="flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1"><Flame size={13} className="text-alert" /> {n(prayerStreak)} দিন নামাজ</span>
            <span className="flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1"><CalendarCheck size={13} /> নামাজ {n(prayersDone)}/{n(5)}</span>
            <span className="flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1"><Users size={13} /> জামাতে {n(jamaat)}</span>
          </div>
        </div>
        <ProgressRing value={total ? count / total : 0} size={100} stroke={8} color="rgb(var(--success))" track="rgb(var(--surface))">
          <span className="text-[24px] font-extrabold leading-none tabular-nums" aria-label={`${pct}% সম্পন্ন`}>{n(pct)}%</span>
        </ProgressRing>
      </div>

      {groups.map((g, gi) => {
        const doneN = g.items.filter((i) => done.includes(i.id)).length;
        const open = !collapsed.includes(g.title);
        const pad = `pt-[22px] ${open ? 'pb-1.5' : 'pb-[22px]'}`;
        // categories with an icon, or whose deeds have sections, show as one card with sub-headings
        const sectioned = g.title in CARD_ICONS || g.items.some((i) => i.section !== undefined);
        const personal = g.title === GROUP_MINE;
        const cardIcon = CARD_ICONS[g.title] ?? <Check size={20} />;
        return (
        <section key={g.title} className={`page-card ${gi === 0 ? 'mt-10' : 'mt-2.5'}`}>
          <h3 className="flex items-stretch gap-2 px-5">
            {/* sits in the same column as the item checkboxes below */}
            {sectioned
              ? <span className={`flex w-[34px] shrink-0 items-center justify-center text-ink ${pad}`} aria-hidden>{cardIcon}</span>
              : groupCheck(g.items, g.title, pad)}
            <button onClick={() => toggleGroup(g.title)} aria-expanded={open}
              className={`flex min-w-0 flex-1 items-center justify-between gap-3 text-left font-bold text-ink ${sectioned ? 'text-[17px] leading-snug' : 'text-[15px]'} ${pad}`}>
              <span className="min-w-0">
                {g.title}
                {g.title === GROUP_AVOID && <span className="block text-[12px] font-normal text-muted">বিরত থাকলে টিক দিন</span>}
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {g.items.length > 0 && <span className="rounded-full bg-chip px-2 py-0.5 text-[12px] text-muted">{n(doneN)}/{n(g.items.length)}</span>}
                <ChevronDown size={18} className={`text-muted transition-transform ${open ? '' : '-rotate-90'}`} />
              </span>
            </button>
          </h3>
          {open && (sectioned ? (
            // one card, a sub-heading per section, a সম্পন্ন / বাকি status on every row
            <div className="px-5 pb-2 pt-1">
              {sectionItems(g.items).map((s) => {
                const sDone = s.items.filter((i) => done.includes(i.id)).length;
                return (
                  <div key={s.title} className="border-t border-line py-2.5">
                    {/* an untitled section (দৈনন্দিন সুন্নাহ's main sunnahs, or ব্যক্তিগত আমল's own list) sits straight under the card header */}
                    {s.title && !(personal && s.title === SECTION_MINE) && <h4 className="flex items-center gap-2">
                      {groupCheck(s.items, s.title, 'py-1.5')}
                      <span className="min-w-0 flex-1 text-[15px] font-bold text-ink">{s.title}</span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[12px] font-semibold ${sDone ? 'bg-success/10 text-success' : 'bg-chip text-muted'}`}>{n(sDone)}/{n(s.items.length)}</span>
                    </h4>}
                    <ul>
                      {s.items.map((it) => (
                        <li key={it.id} className="py-1">{itemRow(it, true)}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
              {personal && (
                <div className={`${g.items.length ? '' : 'border-t border-line'} pb-1 pt-2.5`}>
                  {g.items.length === 0 && <p className="pb-2 text-[13px] text-muted">নিজের পছন্দমতো আমল যোগ করুন — প্রতিদিন বা নির্দিষ্ট দিনে, টিক বা গণনা সহ।</p>}
                  <button onClick={onAdd} className="flex min-h-[44px] items-center gap-3.5 text-[15px] font-semibold text-brand">
                    <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center"><Plus size={20} /></span>
                    ব্যক্তিগত আমল যোগ করুন
                  </button>
                </div>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {g.items.map((it) => <li key={it.id} className="px-5 py-3">{itemRow(it, false)}</li>)}
            </ul>
          ))}
        </section>
        );
      })}

      <div className="px-5 pt-10">
        <button className="btn-primary w-full" onClick={onAdd}><Plus size={20} /> নিজের আমল তৈরি করুন</button>
      </div>

      <section className="page-card mt-10 px-5 py-4">
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

const GROUP_CHOICES = [GROUP_MINE, GROUP_QURAN, GROUP_DHIKR, GROUP_DAILY_SUNNAH, GROUP_AKHLAQ, GROUP_AVOID, GROUP_SUNNAH];
const WEEK_ORDER = [6, 0, 1, 2, 3, 4, 5];

type Freq = 'daily' | 'weekdays' | 'bid';
const blank = { title: '', group: GROUP_MINE, type: 'check' as 'check' | 'count', target: '33', unit: 'বার', freq: 'daily' as Freq, days: [] as number[], reminder: '', note: '' };

function toForm(c?: CustomAmol, group?: string) {
  // a new deed starts in the category it was added from, when that's one the user can pick
  if (!c) return { ...blank, group: group && GROUP_CHOICES.includes(group) ? group : GROUP_MINE };
  return {
    title: c.title, group: normalizeGroup(c.group) || GROUP_MINE, type: c.type ?? 'check', target: String(c.target ?? 33), unit: c.unit ?? 'বার',
    freq: (c.hijriDays?.length ? 'bid' : c.days?.length ? 'weekdays' : 'daily') as Freq, days: c.days ?? [], reminder: c.reminder ?? '', note: c.note ?? '',
  };
}

export function AmolEditor({ open, item, group, onClose }: { open: boolean; item?: CustomAmol; group?: string; onClose: () => void }) {
  const custom = useStore((s) => s.customAmol);
  const set = useStore((s) => s.set);
  const [tab, setTab] = useState<'create' | 'library'>('create');
  const [f, setF] = useState(toForm(item, group));
  const [lastItem, setLastItem] = useState<CustomAmol | undefined>(item);
  const [lastOpen, setLastOpen] = useState(open);
  const [confirmDelete, setConfirmDelete] = useState(false);
  if (item !== lastItem || open !== lastOpen) {
    setLastItem(item); setLastOpen(open);
    if (open) { setF(toForm(item, group)); setTab('create'); setConfirmDelete(false); }
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
    if (f.reminder) notifyPermission().then((p) => { if (p === 'default') requestNotifyPermission(); }).catch(() => undefined);
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
          {[GROUP_QURAN, GROUP_DHIKR, GROUP_SUNNAH, GROUP_AVOID, GROUP_MINE].filter((g) => LIBRARY.some((l) => l.group === g)).map((g) => (
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
  const nav = useNavigate();
  const custom = useStore((s) => s.customAmol);
  const hidden = useStore((s) => s.hiddenAmol);
  const hiddenGroups = useStore((s) => s.hiddenGroups);
  const groupOrder = useStore((s) => s.groupOrder);
  const set = useStore((s) => s.set);
  const [editor, setEditor] = useState<{ open: boolean; item?: CustomAmol }>({ open: false });

  // One list of categories: reorder here, tap one to change what's in it
  const groups = allGroups(custom, groupOrder);
  const moveGroup = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= groups.length) return;
    const next = [...groups];
    [next[i], next[j]] = [next[j], next[i]];
    set('groupOrder', next);
  };
  const customized = hidden.length > 0 || hiddenGroups.length > 0 || groupOrder.length > 0;
  const resetAll = () => { set('hiddenAmol', []); set('hiddenGroups', []); set('groupOrder', []); toast('সব ক্যাটাগরি ও আমল ডিফল্টে ফিরেছে'); };
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= custom.length) return;
    const next = [...custom];
    [next[i], next[j]] = [next[j], next[i]];
    set('customAmol', next);
  };

  return (
    <div>
      <PageHeader back title="আমল সেটিংস" right={<IconButton label="add amal" tone="brand" onClick={() => setEditor({ open: true })}><Plus size={20} /></IconButton>} />

      <h3 className="label px-6 pb-2 pt-5">ক্যাটাগরি — ক্রম বদলান, ভেতরের আমল বদলাতে চাপুন</h3>
      <div className="page-card">
        {groups.map((g, i) => {
          const on = !hiddenGroups.includes(g);
          const defs = groupDefs(g, custom);
          const off = defs.filter((d) => hidden.includes(d.id)).length;
          return (
            <div key={g} className="flex items-center gap-2 border-b border-line px-4 py-3 last:border-b-0">
              <div className="flex flex-col">
                <button aria-label={`${g}: উপরে নিন`} disabled={i === 0} onClick={() => moveGroup(i, -1)} className="tap text-muted disabled:opacity-25"><ChevronLeft size={16} className="rotate-90" /></button>
                <button aria-label={`${g}: নিচে নিন`} disabled={i === groups.length - 1} onClick={() => moveGroup(i, 1)} className="tap text-muted disabled:opacity-25"><ChevronLeft size={16} className="-rotate-90" /></button>
              </div>
              <button onClick={() => nav(`/amol/manage/${encodeURIComponent(g)}`)} aria-label={`${g}: সেটিংস খুলুন`}
                className="flex min-w-0 flex-1 items-center gap-3 py-1 text-left">
                <span className={`flex w-7 shrink-0 justify-center ${on ? 'text-ink' : 'text-muted'}`} aria-hidden>{CARD_ICONS[g] ?? <ListChecks size={20} />}</span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-[16px] ${on ? 'text-ink' : 'text-muted'}`}>{g}</span>
                  <span className="block text-[12px] text-muted">{on ? `${n(defs.length - off)}/${n(defs.length)} আমল চালু` : 'বন্ধ — দৈনিক আমলে দেখাবে না'}</span>
                </span>
                {!on && <span className="shrink-0 rounded-full bg-chip px-2 py-0.5 text-[12px] text-muted">বন্ধ</span>}
                <ChevronRight size={18} className="shrink-0 text-muted" />
              </button>
            </div>
          );
        })}
      </div>

      <h3 className="label px-6 pb-2 pt-6">আমার তৈরি আমল ({n(custom.length)})</h3>
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
              <span className="block text-[12px] text-muted">{customSummary(c)}</span>
            </button>
            <button aria-label="edit" onClick={() => setEditor({ open: true, item: c })} className="p-2 text-muted"><Pencil size={17} /></button>
          </div>
        ))}
      </div>

      {customized && (
        <div className="p-5">
          <button className="btn-soft w-full" onClick={resetAll}>সব ডিফল্টে ফিরিয়ে আনুন</button>
          <p className="mt-2 text-center text-[12px] text-muted">সব ক্যাটাগরি ও আমল আবার চালু হবে, ক্রমও আগের মতো হবে। আপনার টিক দেওয়া হিসাব মুছবে না।</p>
        </div>
      )}
      <AmolEditor open={editor.open} item={editor.item} onClose={() => setEditor({ open: false })} />
    </div>
  );
}

/** Built-in and the user's own deeds in a category */
const groupDefs = (g: string, custom: CustomAmol[]) => [...BUILTIN.filter((b) => b.group === g), ...custom.map(customToDef).filter((c) => c.group === g)];

const customSummary = (c: CustomAmol) => {
  const schedule = c.hijriDays?.length ? 'আইয়ামে বীয' : c.days?.length ? WEEK_ORDER.filter((d) => c.days!.includes(d)).map((d) => WEEKDAYS_BN[d]).join(', ') : 'প্রতিদিন';
  return `${normalizeGroup(c.group) || GROUP_MINE} • ${c.type === 'count' ? `লক্ষ্য ${n(c.target ?? 1)} ${c.unit ?? ''}` : 'টিক'} • ${schedule}${c.reminder ? ` • ⏰ ${n(c.reminder)}` : ''}`;
};

/* ------------------------------------------------------------------ */
/* One category's settings (/amol/manage/:group)                       */
/* ------------------------------------------------------------------ */

export function AmolCategorySettings() {
  const { group = '' } = useParams();
  const custom = useStore((s) => s.customAmol);
  const hidden = useStore((s) => s.hiddenAmol);
  const hiddenGroups = useStore((s) => s.hiddenGroups);
  const set = useStore((s) => s.set);
  const [editor, setEditor] = useState<{ open: boolean; item?: CustomAmol }>({ open: false });

  const defs = groupDefs(group, custom);
  const builtins = defs.filter((d) => !d.custom);
  const mine = custom.filter((c) => customToDef(c).group === group);
  const on = !hiddenGroups.includes(group);
  const onCount = defs.filter((d) => !hidden.includes(d.id)).length;
  const setItemShown = (id: string, v: boolean) => set('hiddenAmol', v ? hidden.filter((x) => x !== id) : [...hidden, id]);
  const allOn = () => set('hiddenAmol', hidden.filter((x) => !builtins.some((d) => d.id === x || allDetails(d, added).some((dd) => dd.id === x))));

  const added = useStore((s) => s.customDetails);
  const nav = useNavigate();
  const canAddHere = GROUP_CHOICES.includes(group);
  const allOff = () => set('hiddenAmol', [...new Set([...hidden, ...builtins.filter((d) => !d.prayer && !d.required).map((d) => d.id)])]);

  // ব্যক্তিগত আমল may be empty and still has a page (to switch it off or add the first deed)
  if (defs.length === 0 && group !== GROUP_MINE) {
    return (
      <div>
        <PageHeader back title="ক্যাটাগরি পাওয়া যায়নি" />
        <p className="px-6 pt-6 text-muted">এই ক্যাটাগরিতে এখন কোনো আমল নেই।</p>
      </div>
    );
  }

  return (
    <div className="pb-8">
      <PageHeader back title={group} sub={on ? `${n(onCount)}/${n(defs.length)} আমল চালু` : 'ক্যাটাগরি বন্ধ আছে'} />

      <div className="page-card mt-4 flex items-center gap-3 px-5 py-4">
        <span className="flex w-7 shrink-0 justify-center text-ink" aria-hidden>{CARD_ICONS[group] ?? <ListChecks size={20} />}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] font-semibold text-ink">দৈনিক আমলে দেখান</span>
          <span className="block text-[12px] text-muted">{on ? 'বন্ধ করলে পুরো ক্যাটাগরি দৈনিক আমল ও হিসাব থেকে সরে যাবে' : 'চালু করলে আবার দৈনিক আমলে দেখাবে'}</span>
        </span>
        <Toggle label={`${group}: দৈনিক আমলে দেখান`} checked={on} onChange={(v) => set('hiddenGroups', v ? hiddenGroups.filter((x) => x !== group) : [...hiddenGroups, group])} />
      </div>

      {builtins.length > 0 && (
        <>
          <h3 className="label px-6 pb-2 pt-6">আমল — যেটা দরকার সেটা চালু রাখুন</h3>
          {/* a plain list on the page, no card around it */}
          <section className={`px-5 ${on ? '' : 'opacity-60'}`}>
            {sectionItems(builtins).map((s, si) => (
              <div key={s.title} className={si ? 'pt-4' : ''}>
                {s.title && s.title !== SECTION_MINE && <div className="label pb-1">{s.title}</div>}
                <div className="divide-y divide-line border-y border-line">
                {s.items.map((b) => (
                  <div key={b.id}>
                    <div className="flex min-h-[52px] items-center justify-between gap-3 py-1">
                      {/* a main sunnah's name opens its own page, where its sunnahs are added, renamed or removed */}
                      {b.details ? (
                        <button onClick={() => nav(`/sunnah/${b.id}`)} aria-label={`${b.title}: তালিকা খুলুন`} className="flex min-w-0 flex-1 items-center justify-between gap-3 py-1 text-left">
                          <span className="min-w-0 text-[15px] text-ink">{b.title}</span>
                          <ChevronRight size={18} className="mr-2 shrink-0 text-muted" />
                        </button>
                      ) : (
                        <span className="min-w-0">
                          <span className="block text-[15px] text-ink">{b.title}</span>
                          {b.type === 'count' && <span className="block text-[12px] text-muted">লক্ষ্য {n(b.target)} {b.unit}</span>}
                        </span>
                      )}
                      {b.prayer || b.required ? <span className="shrink-0 text-[12px] text-muted">সবসময় চালু</span> : (
                        <Toggle label={b.title} checked={!hidden.includes(b.id)} onChange={(v) => setItemShown(b.id, v)} />
                      )}
                    </div>
                  </div>
                ))}
                </div>
              </div>
            ))}
          </section>
          {builtins.some((d) => !d.prayer && !d.required) && (
            <div className="flex gap-2 px-5 pt-3">
              <button className="btn-soft flex-1 !py-2 text-[13px]" onClick={allOn}>সব চালু</button>
              <button className="btn-soft flex-1 !py-2 text-[13px]" onClick={allOff}>সব বন্ধ</button>
            </div>
          )}
        </>
      )}

      {mine.length > 0 && (
        <>
          <h3 className="label px-6 pb-2 pt-6">{group === GROUP_MINE ? 'আমল — যেটা দরকার সেটা চালু রাখুন' : `নিজের যোগ করা (${n(mine.length)})`}</h3>
          {/* the user's own deeds: › opens a personal deed's checklist page, ✎ renames or deletes it, the switch hides it */}
          <div className={`px-5 ${on ? '' : 'opacity-60'}`}>
            <div className="divide-y divide-line border-y border-line">
              {mine.map((c) => {
                const def = customToDef(c);
                return (
                  <div key={c.id} className="flex min-h-[52px] items-center gap-2 py-1">
                    {def.details ? (
                      <button onClick={() => nav(`/sunnah/${c.id}`)} aria-label={`${c.title}: তালিকা খুলুন`} className="flex min-w-0 flex-1 items-center justify-between gap-3 py-1 text-left">
                        <span className="min-w-0 text-[15px] text-ink">{c.title}</span>
                        <ChevronRight size={18} className="shrink-0 text-muted" />
                      </button>
                    ) : (
                      <button onClick={() => setEditor({ open: true, item: c })} className="min-w-0 flex-1 py-1 text-left">
                        <span className="block truncate text-[15px] text-ink">{c.title}</span>
                        <span className="block text-[12px] text-muted">{customSummary(c)}</span>
                      </button>
                    )}
                    <button onClick={() => setEditor({ open: true, item: c })} aria-label={`${c.title}: সম্পাদনা`} className="tap flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted"><Pencil size={16} /></button>
                    <Toggle label={c.title} checked={!hidden.includes(c.id)} onChange={(v) => setItemShown(c.id, v)} />
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
      {canAddHere && (
        <div className="px-5 pt-5">
          <button className="btn-soft w-full" onClick={() => setEditor({ open: true })}><Plus size={18} /> এই ক্যাটাগরিতে আমল যোগ করুন</button>
        </div>
      )}
      <AmolEditor open={editor.open} item={editor.item} group={group} onClose={() => setEditor({ open: false })} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main sunnah detail list (/sunnah/:id?date=)                         */
/* ------------------------------------------------------------------ */

/** An example name in the add form, per main item */
const PLACEHOLDERS: Record<string, string> = {
  'sunnah-sleep': 'ঘুমের আগে বিছানা ঝেড়ে নেওয়া',
  'akhlaq-parents': 'পিতা-মাতাকে সময় দেওয়া',
  'akhlaq-conduct': 'কারো সাথে নম্রভাবে কথা বলা',
  'avoid-tongue': 'অযথা তর্ক থেকে বিরত থাকা',
  'avoid-habits': 'দেরিতে ঘুমানো থেকে বিরত থাকা',
};

export function SunnahDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const todayKey = dateKey();
  const key = params.get('date') ?? todayKey;
  const lang = useStore((s) => s.settings.lang);
  const hidden = useStore((s) => s.hiddenAmol);
  const added = useStore((s) => s.customDetails);
  const titles = useStore((s) => s.amolTitles);
  const done = useStore((s) => s.amol[key]) ?? [];
  const dayModes = useStore((s) => s.prayerMode[key]) ?? {};
  const set = useStore((s) => s.set);
  const setMode = (p: PrayerId, m: PrayerMode) => {
    const all = useStore.getState().prayerMode;
    const cur = all[key] ?? {};
    set('prayerMode', { ...all, [key]: { ...cur, [p]: cur[p] === m ? undefined : m } });
  };
  // ✎ mode shows an edit button on every sunnah; the sheet adds a new one or renames / removes one
  const [editing, setEditing] = useState(false);
  const [sheet, setSheet] = useState<{ open: boolean; detail?: AmolDetail }>({ open: false });
  const [text, setText] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const custom = useStore((s) => s.customAmol);
  // a built-in main item, or a deed in ব্যক্তিগত আমল (whose checklist is entirely the user's own)
  const def = BUILTIN.find((b) => b.id === id && b.details) ?? custom.map(customToDef).find((c) => c.id === id && c.details);
  if (!def) {
    return (
      <div>
        <PageHeader back title="তালিকা পাওয়া যায়নি" />
        <p className="px-6 pt-6 text-muted">এই তালিকাটি আর নেই। দৈনিক আমলে ফিরে যান।</p>
      </div>
    );
  }
  const details = shownDetails(def, hidden, added, titles);
  const noun = detailNoun(def.group);
  const avoidHint = def.group === GROUP_AVOID ? 'বিরত থাকলে টিক দিন। ' : '';
  const doneN = details.filter((d) => done.includes(d.id)).length;
  const all = details.length > 0 && doneN === details.length;
  const dayLabel = key === todayKey ? 'আজ' : `${WEEKDAYS_BN_FULL[keyToDate(key).getDay()]}, ${formatGregorian(keyToDate(key), lang, true)}`;

  const mine = added[def.id] ?? [];
  const isOwn = (detailId: string) => mine.some((d) => d.id === detailId);
  const removed = allDetails(def, added, titles).filter((d) => hidden.includes(d.id));
  const restore = (d: AmolDetail) => {
    set('hiddenAmol', hidden.filter((x) => x !== d.id));
    syncMainSunnah(key, def);
    toast(`"${d.title}" আবার তালিকায় এসেছে`);
  };
  const openAdd = () => { setText(''); setConfirmDelete(false); setSheet({ open: true }); };
  const openEdit = (d: AmolDetail) => { setText(d.title); setConfirmDelete(false); setSheet({ open: true, detail: d }); };
  const close = () => setSheet({ open: false });
  const save = () => {
    const title = text.trim();
    if (!title) return;
    const d = sheet.detail;
    if (!d) {
      set('customDetails', { ...added, [def.id]: [...mine, { id: `cd-${Date.now()}`, title }] });
      toast(`"${title}" যোগ হয়েছে`);
    } else if (isOwn(d.id)) {
      set('customDetails', { ...added, [def.id]: mine.map((x) => (x.id === d.id ? { ...x, title } : x)) });
      toast('নাম বদলানো হয়েছে');
    } else {
      // a built-in sunnah keeps its id; only the name shown changes (back to the original if it matches)
      const original = def.details?.find((x) => x.id === d.id)?.title;
      const next = { ...titles };
      if (title === original) delete next[d.id]; else next[d.id] = title;
      set('amolTitles', next);
      toast('নাম বদলানো হয়েছে');
    }
    syncMainSunnah(key, def);
    close();
  };
  const remove = () => {
    const d = sheet.detail;
    if (!d) return;
    if (!confirmDelete) { setConfirmDelete(true); return; }
    if (isOwn(d.id)) {
      set('customDetails', { ...added, [def.id]: mine.filter((x) => x.id !== d.id) });
      toast(`"${d.title}" মুছে ফেলা হয়েছে`);
    } else {
      set('hiddenAmol', [...hidden, d.id]);
      toast(`"${d.title}" তালিকা থেকে সরানো হয়েছে`);
    }
    syncMainSunnah(key, def);
    close();
  };

  return (
    <div className="pb-8">
      <PageHeader back title={def.title} sub={`${dayLabel} • ${n(doneN)}/${n(details.length)} সম্পন্ন`}
        right={<IconButton label={editing ? 'সম্পাদনা শেষ' : `${noun} সম্পাদনা`} tone={editing ? 'brand' : undefined} onClick={() => setEditing((e) => !e)}>{editing ? <Check size={18} /> : <Pencil size={18} />}</IconButton>} />
      <div className="mx-5 mt-4 flex items-center gap-4 rounded-[10px] bg-chip/60 p-4">
        <ProgressRing value={details.length ? doneN / details.length : 0} size={64} stroke={6} color="rgb(var(--success))" track="rgb(var(--surface))">
          <span className="text-[15px] font-extrabold tabular-nums text-ink">{n(doneN)}/{n(details.length)}</span>
        </ProgressRing>
        <p className="min-w-0 text-[13px] text-muted">
          {editing ? `নাম বদলাতে বা মুছতে ${noun}ের পাশের ✎ চাপুন।` : details.length === 0 ? `এখনো কোনো ${noun} নেই। নিচে যোগ করুন, তারপর সবগুলো সম্পন্ন হলে "${def.title}" নিজে থেকেই টিক হবে।` : all ? 'মাশাআল্লাহ! সবগুলো সম্পন্ন হয়েছে।' : `${avoidHint}সবগুলো সম্পন্ন হলে দৈনিক আমলে "${def.title}" নিজে থেকেই টিক হয়ে যাবে।`}
        </p>
      </div>

      {/* a plain list on the page, no card around it */}
      <section className="mt-4 px-5">
        {details.length === 0 ? (
          <p className="py-6 text-center text-[14px] text-muted">এই তালিকায় কোনো {noun} নেই। নিচে যোগ করুন{removed.length ? `, অথবা ✎ চেপে সরানো ${noun} ফিরিয়ে আনুন` : ''}।</p>
        ) : (
          <ul className="divide-y divide-line">
            {details.map((d) => {
              const checked = done.includes(d.id);
              // a counter entry (ইস্তিগফার ১০০ বার) keeps its counter here; the main item re-checks whenever it moves
              if (d.type === 'count' && d.target) {
                const counter: AmolDef = { id: d.id, title: d.title, group: def.group, type: 'count', target: d.target, unit: d.unit };
                return (
                  <li key={d.id} className="flex items-center gap-3.5 py-2">
                    <CountControl def={counter} k={key} onChange={() => syncMainSunnah(key, def)} />
                    {editing
                      ? <button onClick={() => openEdit(d)} aria-label={`${d.title}: সম্পাদনা`} className="tap flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-chip text-ink"><Pencil size={16} /></button>
                      : <span className={`w-12 shrink-0 text-right text-[13px] ${checked ? 'font-semibold text-success' : 'text-muted'}`}>{checked ? 'সম্পন্ন' : 'বাকি'}</span>}
                  </li>
                );
              }
              return (
                <li key={d.id} className="py-2">
                  <div className="flex items-center gap-3.5">
                  <button onClick={() => toggleSunnahDetail(key, def, d.id)} aria-label={d.title}
                    className="tap flex h-[34px] w-[34px] shrink-0 items-center justify-center">
                    <span className={`flex h-[22px] w-[22px] items-center justify-center rounded-[6px] transition ${checked ? 'animate-pop bg-success text-white' : 'border-2 border-line'}`}>
                      {checked && <Check size={14} strokeWidth={3.5} />}
                    </span>
                  </button>
                  <button className="min-w-0 flex-1 py-2 text-left" onClick={() => (editing && !d.prayer ? openEdit(d) : toggleSunnahDetail(key, def, d.id))}>
                    <span className={`block text-[16px] ${checked ? 'text-muted line-through decoration-success/50' : 'text-ink'}`}>{d.title}</span>
                    {isOwn(d.id) && <span className="block text-[12px] text-brand">নিজের যোগ করা</span>}
                  </button>
                  {editing ? (
                    d.prayer
                      ? <span className="shrink-0 text-[12px] text-muted">ফরজ</span>
                      : <button onClick={() => openEdit(d)} aria-label={`${d.title}: সম্পাদনা`} className="tap flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-chip text-ink"><Pencil size={16} /></button>
                  ) : (
                    <>
                      {d.link && <button onClick={() => nav(d.link!)} aria-label={`${d.title}: খুলুন`} className="tap flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-chip text-brand"><ArrowUpRight size={16} /></button>}
                      <span className={`w-12 shrink-0 text-right text-[13px] ${checked ? 'font-semibold text-success' : 'text-muted'}`}>{checked ? 'সম্পন্ন' : 'বাকি'}</span>
                    </>
                  )}
                  </div>
                  {/* a ticked fard prayer keeps its জামাতে / একা / কাযা tag */}
                  {d.prayer && checked && (
                    <div className="ml-[48px] mt-1.5 flex gap-2 pb-1">
                      {MODES.map((m) => (
                        <button key={m.v} onClick={() => setMode(d.id as PrayerId, m.v)}
                          className={`rounded-full px-3 py-1 text-[12.5px] font-semibold ${dayModes[d.id as PrayerId] === m.v ? (m.v === 'qaza' ? 'bg-alert text-white' : 'bg-night text-white') : 'bg-chip text-ink'}`}>{m.l}</button>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {/* the five fard prayers are fixed; every other list can grow */}
        {!def.required && (
          <button onClick={openAdd} className="flex min-h-[48px] w-full items-center gap-3.5 border-t border-line text-left text-[15px] font-semibold text-brand">
            <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center"><Plus size={20} /></span>
            {noun} যোগ করুন
          </button>
        )}
      </section>

      {/* built-in sunnahs taken off this list can be put back while editing */}
      {editing && removed.length > 0 && (
        <section className="mt-6 px-5">
          <h3 className="label pb-1">সরানো {noun}</h3>
          <ul className="divide-y divide-line">
            {removed.map((d) => (
              <li key={d.id} className="flex min-h-[48px] items-center justify-between gap-3">
                <span className="min-w-0 text-[15px] text-muted">{d.title}</span>
                <button onClick={() => restore(d)} className="shrink-0 rounded-full bg-chip px-3 py-1.5 text-[13px] font-semibold text-brand">ফিরিয়ে আনুন</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {details.length > 0 && !editing && (
        <div className="px-5 pt-5">
          <button className="btn-soft w-full" onClick={() => setMainSunnahDone(key, def, !all)}>{all ? 'সব টিক তুলুন' : 'সব টিক দিন'}</button>
        </div>
      )}

      <Sheet open={sheet.open} onClose={close} title={sheet.detail ? `${noun} সম্পাদনা` : `নতুন ${noun} যোগ করুন`}>
        <form onSubmit={(e) => { e.preventDefault(); save(); }}>
          <label htmlFor="sunnah-title" className="label">নাম</label>
          <input id="sunnah-title" autoFocus className="input mt-1.5" value={text} onChange={(e) => setText(e.target.value)}
            placeholder={`যেমন: ${PLACEHOLDERS[def.id] ?? `নতুন একটি ${noun}`}`} />
          <p className="mt-1.5 text-[12px] text-muted">"{def.title}" তালিকায় {sheet.detail ? 'এই নামে দেখাবে' : 'যোগ হবে'}।</p>
          <button type="submit" disabled={!text.trim()} className="btn-primary mt-4 w-full disabled:opacity-40">{sheet.detail ? 'সংরক্ষণ করুন' : 'যোগ করুন'}</button>
        </form>
        {sheet.detail && (
          <>
            <button onClick={remove} className={`mt-3 w-full rounded-[10px] py-3 text-[15px] font-semibold ${confirmDelete ? 'bg-alert text-white' : 'bg-chip text-alert'}`}>
              {confirmDelete ? 'নিশ্চিত? আবার চাপুন' : isOwn(sheet.detail.id) ? 'মুছে ফেলুন' : 'তালিকা থেকে সরান'}
            </button>
            {!isOwn(sheet.detail.id) && <p className="mt-1.5 text-center text-[12px] text-muted">এটি অ্যাপের দেওয়া {noun}। পরে ✎ চেপে "সরানো {noun}" থেকে ফিরিয়ে আনতে পারবেন।</p>}
          </>
        )}
      </Sheet>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Stats                                                               */
/* ------------------------------------------------------------------ */

type RangeKind = '7' | '30' | '90' | 'month' | 'custom';
const RANGES: { v: RangeKind; l: string }[] = [
  { v: '7', l: '৭ দিন' },
  { v: '30', l: '৩০ দিন' },
  { v: '90', l: '৯০ দিন' },
  { v: 'month', l: 'এই মাস' },
  { v: 'custom', l: 'তারিখ বাছাই' },
];
const MAX_RANGE_DAYS = 366;

// 'cat' is one category's report (?cat=<name>); the rest are the prayer and overall reports
type StatDetail = 'streak' | 'best' | 'avg' | 'jamaat' | 'prayed' | 'qaza' | 'cat';
const STAT_DETAILS: StatDetail[] = ['streak', 'best', 'avg', 'jamaat', 'prayed', 'qaza', 'cat'];
const PRAYER_NAMES: Record<PrayerId, string> = { fajr: 'ফজর', dhuhr: 'যোহর', asr: 'আসর', maghrib: 'মাগরিব', isha: 'ইশা' };

/** Days between two date keys, inclusive, oldest first */
const keysBetween = (from: string, to: string) => {
  const out: string[] = [];
  if (!from) return out;
  for (let d = keyToDate(from); dateKey(d) <= to; d = addDays(d, 1)) out.push(dateKey(d));
  return out;
};

function Stats() {
  const [params, setParams] = useSearchParams();
  const detailParam = params.get('detail') as StatDetail | null;
  const detail = detailParam && STAT_DETAILS.includes(detailParam) ? detailParam : null;
  // Opening a tile adds a history entry, so the header's back button and the phone's back gesture
  // both return here; the range stays because this component stays mounted
  const savedScroll = useRef(0);
  const firstRun = useRef(true);
  const openDetail = (d: StatDetail) => { if (!detail) savedScroll.current = window.scrollY; setParams({ tab: 'stats', detail: d }); };
  const openCategory = (g: string) => { savedScroll.current = window.scrollY; setParams({ tab: 'stats', detail: 'cat', cat: g }); };
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; if (!detail) return; }
    window.scrollTo(0, detail ? 0 : savedScroll.current);
  }, [detail]);
  // the statistics overview turns the soft grey canvas; the report pages it opens stay white
  useEffect(() => {
    if (detail) return;
    document.documentElement.classList.add('canvas-page');
    return () => document.documentElement.classList.remove('canvas-page');
  }, [detail]);
  const [range, setRange] = useState<{ kind: RangeKind; from: string; to: string }>(() => ({ kind: '30', from: dateKey(addDays(new Date(), -29)), to: dateKey() }));
  const [picking, setPicking] = useState(false);
  const [draft, setDraft] = useState<{ from: string; to: string | null }>({ from: range.from, to: range.to });
  const lang = useStore((s) => s.settings.lang);
  const amol = useStore((s) => s.amol);
  const modes = useStore((s) => s.prayerMode);
  const custom = useStore((s) => s.customAmol);
  const hidden = useStore((s) => s.hiddenAmol);
  const hiddenGroups = useStore((s) => s.hiddenGroups);
  const groupOrder = useStore((s) => s.groupOrder);
  const addedDetails = useStore((s) => s.customDetails);
  const adj = useStore((s) => s.settings.hijriAdjust);
  const journal = useStore((s) => s.journal);
  const todayKey = dateKey();
  const [fromKey, toKey] = useMemo(() => {
    const today = keyToDate(todayKey);
    if (range.kind === 'custom') return [range.from, range.to];
    if (range.kind === 'month') return [dateKey(new Date(today.getFullYear(), today.getMonth(), 1)), todayKey];
    return [dateKey(addDays(today, -(Number(range.kind) - 1))), todayKey];
  }, [range, todayKey]);
  const days = useMemo(() => {
    const out: Date[] = [];
    for (let d = keyToDate(fromKey); dateKey(d) <= toKey && out.length < MAX_RANGE_DAYS; d = addDays(d, 1)) out.push(d);
    return out;
  }, [fromKey, toKey]);
  const len = days.length;
  const chooseRange = (kind: RangeKind) => {
    if (kind === 'custom') { setDraft({ from: fromKey, to: toKey }); setPicking(true); return; }
    setRange((r) => ({ ...r, kind }));
  };

  const prayerCount = (d: Date) => (amol[dateKey(d)] ?? []).filter((x) => (PRAYER_IDS as string[]).includes(x)).length;
  const last7 = days.slice(-7);

  // days of the current run of all-five-prayer days (today may still be in progress)
  const streakKeys: string[] = [];
  for (let i = 0; i < 365; i++) {
    const d = addDays(new Date(), -i);
    if (prayerCount(d) === 5) streakKeys.push(dateKey(d)); else if (i === 0) continue; else break;
  }
  const streak = streakKeys.length;
  let best = 0, run = 0, runStart = '', bestFrom = '', bestTo = '';
  Object.keys(amol).sort().forEach((k, idx, arr) => {
    const full = (amol[k] ?? []).filter((x) => (PRAYER_IDS as string[]).includes(x)).length === 5;
    const prev = idx > 0 ? arr[idx - 1] : null;
    const consecutive = prev && dateKey(addDays(keyToDate(prev), 1)) === k;
    run = full ? (consecutive ? run + 1 : 1) : 0;
    if (run === 1) runStart = k;
    if (run > best) { best = run; bestFrom = runStart; bestTo = k; }
  });

  // daily completion % over all applicable deeds
  const itemsByDay = days.map((d) => itemsFor(d, adj, custom, hidden, hiddenGroups));
  const dayDone = days.map((d, i) => {
    const ids = new Set(itemsByDay[i].map((x) => x.id));
    return { done: (amol[dateKey(d)] ?? []).filter((x) => ids.has(x)).length, total: itemsByDay[i].length };
  });
  // how much of each day's list was done, counting a main item's checklist partly (৪ of ৫ fard = ৮০%)
  const scoreOf = (its: AmolDef[], k: string) => its.reduce((a, x) => a + itemScore(x, amol[k] ?? [], hidden, addedDetails), 0);

  // the same, per category: each day's done/total for its deeds, and the average over days that had any
  const catStats = allGroups(custom, groupOrder).filter((g) => !hiddenGroups.includes(g)).map((g) => {
    const perDay = days.map((d, i) => {
      const its = itemsByDay[i].filter((x) => x.group === g);
      const doneIds = amol[dateKey(d)] ?? [];
      return { done: its.filter((x) => doneIds.includes(x.id)).length, total: its.length, score: its.length ? scoreOf(its, dateKey(d)) / its.length : 0 };
    });
    const counted = perDay.filter((x) => x.total > 0);
    const pct = counted.length ? Math.round((counted.reduce((a, x) => a + x.score, 0) / counted.length) * 100) : null;
    return { g, perDay, pct };
  });
  const dayPct = days.map((d, i) => (itemsByDay[i].length ? scoreOf(itemsByDay[i], dateKey(d)) / itemsByDay[i].length : 0));
  const avg = len ? Math.round((dayPct.reduce((a, b) => a + b, 0) / len) * 100) : 0;
  // the same average for the period of the same length just before, to show the change
  const prevAvg = useMemo(() => {
    if (!len) return 0;
    const sum = days.reduce((a, d) => {
      const pd = addDays(d, -len);
      const its = itemsFor(pd, adj, custom, hidden, hiddenGroups);
      return a + (its.length ? its.reduce((x, it) => x + itemScore(it, amol[dateKey(pd)] ?? [], hidden, addedDetails), 0) / its.length : 0);
    }, 0);
    return Math.round((sum / len) * 100);
  }, [days, len, adj, custom, hidden, hiddenGroups, amol, addedDetails]);
  const change = avg - prevAvg;

  // jamaat ratio over prayed prayers
  let prayed = 0, jam = 0, qaza = 0;
  days.forEach((d) => {
    const k = dateKey(d);
    PRAYER_IDS.forEach((p) => {
      if ((amol[k] ?? []).includes(p)) { prayed++; if (modes[k]?.[p] === 'jamaat') jam++; if (modes[k]?.[p] === 'qaza') qaza++; }
    });
  });

  // per-deed completion over applicable days
  const uniqueDefs: AmolDef[] = [...BUILTIN.filter((b) => !b.prayer && !hidden.includes(b.id)), ...custom.map(customToDef).filter((c) => !hidden.includes(c.id))]
    .filter((d) => !hiddenGroups.includes(d.group));
  const rateOf = (def: AmolDef) => {
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
  };
  const perDeed = uniqueDefs.map(rateOf).sort((a, b) => b.rate - a.rate);
  const fullDays = days.filter((d) => prayerCount(d) === 5).length;

  const names = PRAYER_NAMES;
  const perPrayer = PRAYER_IDS.map((p) => ({ p, c: days.filter((d) => (amol[dateKey(d)] ?? []).includes(p)).length }));
  const moodDays = days.map((d) => journal[dateKey(d)]?.mood).filter((m): m is number => !!m);
  const avgMood = moodDays.length ? moodDays.reduce((a, b) => a + b, 0) / moodDays.length : 0;

  const spanLabel = (from: string, to: string) => {
    const a = keyToDate(from), b = keyToDate(to);
    return from === to ? formatGregorian(b, lang, true) : `${formatGregorian(a, lang, a.getFullYear() !== b.getFullYear())} – ${formatGregorian(b, lang, true)}`;
  };
  const jamPct = prayed ? Math.round((jam / prayed) * 100) : 0;
  const tiles: { id: StatDetail; icon: JSX.Element; v: string; l: string }[] = [
    { id: 'streak', icon: <Flame className="text-alert" size={20} />, v: n(streak), l: 'নামাজের স্ট্রিক' },
    { id: 'best', icon: <Trophy className="text-m-yellow" size={20} />, v: n(best), l: 'সেরা স্ট্রিক' },
    { id: 'avg', icon: <Check className="text-brand" size={20} />, v: `${n(avg)}%`, l: `${n(len)} দিনের গড়` },
    { id: 'jamaat', icon: <Users className="text-brand" size={20} />, v: `${n(jamPct)}%`, l: 'জামাতে নামাজ' },
    { id: 'prayed', icon: <CalendarCheck className="text-brand" size={20} />, v: n(prayed), l: `${n(len)} দিনে নামাজ` },
    { id: 'qaza', icon: <Minus className="text-alert" size={20} />, v: n(qaza), l: 'কাযা আদায়' },
  ];

  if (detail === 'cat') {
    const g = params.get('cat') ?? '';
    const cs = catStats.find((c) => c.g === g);
    const newest = days.map((d, i) => ({ k: dateKey(d), ...(cs?.perDay[i] ?? { done: 0, total: 0, score: 0 }) })).reverse().filter((x) => x.total > 0);
    const defs = [...BUILTIN.filter((b) => b.group === g && !hidden.includes(b.id)), ...custom.map(customToDef).filter((c) => c.group === g && !hidden.includes(c.id))];
    const rows = defs.map(rateOf);
    const dayLabel = (k: string) => `${k === todayKey ? 'আজ' : WEEKDAYS_BN_FULL[keyToDate(k).getDay()]}, ${formatGregorian(keyToDate(k), lang, true)}`;
    const prayerTiles: { id: StatDetail; icon: JSX.Element; v: string; l: string }[] = [
      { id: 'prayed', icon: <CalendarCheck className="text-brand" size={20} />, v: n(prayed), l: `${n(len * 5)} ওয়াক্তের মধ্যে` },
      { id: 'jamaat', icon: <Users className="text-brand" size={20} />, v: `${n(jamPct)}%`, l: 'জামাতে নামাজ' },
      { id: 'qaza', icon: <Minus className="text-alert" size={20} />, v: n(qaza), l: 'কাযা আদায়' },
      { id: 'streak', icon: <Flame className="text-alert" size={20} />, v: n(streak), l: 'নামাজের স্ট্রিক' },
      { id: 'best', icon: <Trophy className="text-m-yellow" size={20} />, v: n(best), l: 'সেরা স্ট্রিক' },
      { id: 'prayed', icon: <Check className="text-success" size={20} />, v: n(fullDays), l: 'পাঁচ ওয়াক্ত পূর্ণ দিন' },
    ];
    return (
      <div className="pb-6">
        <PageHeader back title={g || 'ক্যাটাগরি'} sub={`${spanLabel(fromKey, toKey)} • ${n(len)} দিন`} />
        {!cs ? <p className="px-6 pt-6 text-muted">এই ক্যাটাগরি এখন বন্ধ আছে বা পাওয়া যায়নি।</p> : (
          <>
            <div className="mx-5 mt-4 flex items-center gap-4 rounded-[10px] bg-chip/60 p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface text-ink">{CARD_ICONS[g] ?? <ListChecks size={20} />}</div>
              <div className="min-w-0">
                <div className="text-[24px] font-extrabold leading-none text-ink">{cs.pct === null ? '—' : `${n(cs.pct)}%`}</div>
                <p className="mt-1 text-[13px] text-muted">{cs.pct === null ? 'এই সময়ে এই ক্যাটাগরিতে কোনো আমল ছিল না।' : 'প্রতিদিন এই ক্যাটাগরির আমলের মধ্যে গড়ে কত ভাগ সম্পন্ন হয়েছে।'}</p>
              </div>
            </div>

            {/* নামাজ keeps its own reports: streaks, জামাতে, কাযা; each opens its day list */}
            {g === GROUP_SALAH && (
              <div className="mt-4 grid grid-cols-3 gap-2.5 px-5">
                {prayerTiles.map((t) => (
                  <button key={t.l} onClick={() => openDetail(t.id)} aria-label={`${t.l}: ${t.v} — দিনগুলো দেখুন`}
                    className="tap rounded-[10px] bg-chip/60 p-3 text-left transition active:bg-chip">
                    <div className="flex">{t.icon}</div>
                    <div className="mt-2 text-[20px] font-extrabold leading-none text-ink">{t.v}</div>
                    <div className="mt-1 text-[11px] text-muted">{t.l}</div>
                  </button>
                ))}
              </div>
            )}

            {rows.length > 0 && (
              <section className="page-card mt-4 px-5 py-4">
                <h3 className="text-[15px] font-bold text-ink">আমল অনুযায়ী</h3>
                <div className="mt-2 divide-y divide-line">
                  {rows.map(({ def, applicable, doneCount, rate, streak: st }) => (
                    <div key={def.id} className="py-2.5">
                      <div className="flex items-center justify-between gap-3 text-[14px]">
                        <span className="min-w-0 flex-1 truncate text-ink">{def.title}</span>
                        {st >= 2 && <span className="flex items-center gap-0.5 text-[12px] text-alert"><Flame size={12} />{n(st)}</span>}
                        <span className="w-16 text-right tabular-nums text-muted">{n(doneCount)}/{n(applicable)}</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-chip"><div className="h-full rounded-full bg-brand" style={{ width: `${rate * 100}%` }} /></div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {newest.length > 0 && (
              <>
                <h3 className="label px-6 pb-0 pt-6">দিন অনুযায়ী</h3>
                <section className="page-card mt-2">
                  <ul className="divide-y divide-line">
                    {newest.map(({ k, done, total, score }) => (
                      <li key={k} className="px-5 py-3.5">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="min-w-0 text-[15px] font-semibold text-ink">{dayLabel(k)}</span>
                          <span className="shrink-0 text-[13px] tabular-nums text-muted">{n(Math.round(score * 100))}%</span>
                        </div>
                        <div className="mt-2 flex items-center gap-3">
                          <div className="h-1.5 flex-1 rounded-full bg-chip"><div className="h-full rounded-full bg-brand" style={{ width: `${score * 100}%` }} /></div>
                          <span className="shrink-0 text-[12px] text-muted">{n(done)}/{n(total)} আমল</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              </>
            )}
          </>
        )}
      </div>
    );
  }

  if (detail) {
    const tile = tiles.find((t) => t.id === detail)!;
    const did = (k: string, p: PrayerId) => (amol[k] ?? []).includes(p);
    const countMode = (k: string, m: PrayerMode) => PRAYER_IDS.filter((p) => did(k, p) && modes[k]?.[p] === m).length;
    const newestFirst = days.map((d) => dateKey(d)).reverse();
    const doneByKey = new Map(days.map((d, i) => [dateKey(d), dayDone[i]]));

    const dayLabel = (k: string) => `${k === todayKey ? 'আজ' : WEEKDAYS_BN_FULL[keyToDate(k).getDay()]}, ${formatGregorian(keyToDate(k), lang, true)}`;
    // one chip per waqt: filled when prayed (coloured by জামাতে / একা / কাযা), dashed when not
    const prayerChips = (k: string, focus?: PrayerMode) => (
      <div className="mt-2 flex flex-wrap gap-1.5">
        {PRAYER_IDS.map((p) => {
          const m = did(k, p) ? modes[k]?.[p] : undefined;
          const tone = !did(k, p) ? 'border-dashed border-line text-muted' : m === 'qaza' ? 'border-transparent bg-alert text-white' : m === 'jamaat' ? 'border-transparent bg-night text-white' : 'border-transparent bg-success/15 text-success';
          const state = !did(k, p) ? 'আদায় হয়নি' : m === 'qaza' ? 'কাযা' : m === 'jamaat' ? 'জামাতে' : m === 'alone' ? 'একা' : 'আদায়';
          return (
            <span key={p} className={`rounded-full border px-2.5 py-0.5 text-[12px] font-semibold ${tone} ${focus && m !== focus ? 'opacity-40' : ''}`}>
              {PRAYER_NAMES[p]}<span className="sr-only">: {state}</span>
            </span>
          );
        })}
      </div>
    );

    let rows: string[], summary: string, sub = spanLabel(fromKey, toKey) + ` • ${n(len)} দিন`, empty = '';
    // a breakdown shown above the day list (per waqt for নামাজ, per amol for the average)
    let extra: JSX.Element | null = null;
    let right: (k: string) => string = (k) => `${n(prayerCount(keyToDate(k)))}/${n(5)}`;
    let body: (k: string) => JSX.Element = (k) => prayerChips(k);
    switch (detail) {
      case 'streak':
        rows = streakKeys;
        summary = 'আজ বা গতকাল পর্যন্ত টানা যতদিন পাঁচ ওয়াক্ত নামাজ আদায় করেছেন।';
        sub = streak ? `${spanLabel(streakKeys[streakKeys.length - 1], streakKeys[0])} • ${n(streak)} দিন` : 'এখনো স্ট্রিক নেই';
        empty = 'এখনো কোনো স্ট্রিক নেই। একদিন পাঁচ ওয়াক্ত নামাজ টিক দিলেই স্ট্রিক শুরু হবে।';
        break;
      case 'best':
        rows = keysBetween(bestFrom, bestTo).reverse();
        summary = 'আপনার সবচেয়ে লম্বা টানা পাঁচ ওয়াক্ত নামাজের সময়কাল।';
        sub = best ? `${spanLabel(bestFrom, bestTo)} • ${n(best)} দিন` : 'এখনো স্ট্রিক নেই';
        empty = 'এখনো কোনো স্ট্রিক নেই। একদিন পাঁচ ওয়াক্ত নামাজ টিক দিলেই স্ট্রিক শুরু হবে।';
        break;
      case 'avg':
        rows = newestFirst;
        summary = 'প্রতিদিনের সব আমলের মধ্যে গড়ে কত ভাগ সম্পন্ন হয়েছে।';
        right = (k) => `${n(Math.round(((doneByKey.get(k)?.done ?? 0) / (doneByKey.get(k)?.total || 1)) * 100))}%`;
        body = (k) => {
          const { done = 0, total = 0 } = doneByKey.get(k) ?? {};
          return (
            <div className="mt-2 flex items-center gap-3">
              <div className="h-1.5 flex-1 rounded-full bg-chip"><div className="h-full rounded-full bg-brand" style={{ width: `${total ? (done / total) * 100 : 0}%` }} /></div>
              <span className="shrink-0 text-[12px] text-muted">{n(done)}/{n(total)} আমল</span>
            </div>
          );
        };
        // how steady each amol was over the range, moved here from the main statistics page
        extra = (
          <section className="page-card mt-4 px-5 py-4">
            <h3 className="text-[15px] font-bold text-ink">আমল অনুযায়ী ধারাবাহিকতা</h3>
            <div className="mt-2 divide-y divide-line">
              {perDeed.map(({ def, applicable, doneCount, rate, streak: s }) => (
                <div key={def.id} className="py-2.5">
                  <div className="flex items-center justify-between gap-3 text-[14px]">
                    <span className="min-w-0 flex-1 truncate text-ink">{def.title}{def.custom && <span className="ml-1 text-[11px] text-brand">নিজস্ব</span>}</span>
                    {s >= 2 && <span className="flex items-center gap-0.5 text-[12px] text-alert"><Flame size={12} />{n(s)}</span>}
                    <span className="w-16 text-right tabular-nums text-muted">{n(doneCount)}/{n(applicable)}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-chip"><div className="h-full rounded-full bg-brand" style={{ width: `${rate * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </section>
        );
        break;
      case 'jamaat':
        rows = newestFirst.filter((k) => countMode(k, 'jamaat') > 0);
        summary = `${n(prayed)} ওয়াক্ত নামাজের মধ্যে ${n(jam)} ওয়াক্ত জামাতে আদায় করেছেন।`;
        empty = 'এই সময়ে কোনো নামাজ জামাতে চিহ্নিত নেই।';
        right = (k) => `জামাতে ${n(countMode(k, 'jamaat'))}`;
        body = (k) => prayerChips(k, 'jamaat');
        break;
      case 'prayed':
        rows = newestFirst;
        summary = `${n(len * 5)} ওয়াক্তের মধ্যে ${n(prayed)} ওয়াক্ত নামাজ আদায় করেছেন।`;
        // per-waqt totals, moved here from the main statistics page
        extra = (
          <section className="page-card mt-4 px-5 py-4">
            <h3 className="text-[15px] font-bold text-ink">ওয়াক্ত অনুযায়ী</h3>
            <div className="mt-3 space-y-3">
              {perPrayer.map(({ p, c }) => (
                <div key={p}>
                  <div className="flex justify-between text-sm text-ink"><span>{names[p]}</span><span className="tabular-nums">{n(c)}/{n(len)}</span></div>
                  <div className="mt-1 h-2 rounded-full bg-chip"><div className="h-full rounded-full bg-brand" style={{ width: `${len ? (c / len) * 100 : 0}%` }} /></div>
                </div>
              ))}
            </div>
          </section>
        );
        break;
      case 'qaza':
        rows = newestFirst.filter((k) => countMode(k, 'qaza') > 0);
        summary = `${n(rows.length)} দিনে ${n(qaza)} ওয়াক্ত নামাজ কাযা হিসেবে আদায় করেছেন।`;
        empty = 'এই সময়ে কোনো কাযা নামাজ নেই।';
        right = (k) => `কাযা ${n(countMode(k, 'qaza'))}`;
        body = (k) => prayerChips(k, 'qaza');
        break;
    }

    return (
      <div className="pb-6">
        <PageHeader back title={tile.l} sub={sub} />
        <div className="mx-5 mt-4 flex items-center gap-4 rounded-[10px] bg-chip/60 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface">{tile.icon}</div>
          <div className="min-w-0">
            <div className="text-[24px] font-extrabold leading-none text-ink">{tile.v}{(detail === 'streak' || detail === 'best') && <span className="ml-1 text-[14px] font-semibold"> দিন</span>}</div>
            <p className="mt-1 text-[13px] text-muted">{summary}</p>
          </div>
        </div>
        {extra}
        {extra && <h3 className="label px-6 pb-0 pt-6">দিন অনুযায়ী</h3>}
        {detail !== 'avg' && (
          <div className="mx-5 mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-muted" aria-hidden>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-night" />জামাতে</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-success/40" />একা</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-alert" />কাযা</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border border-dashed border-muted" />আদায় হয়নি</span>
          </div>
        )}
        <section className="page-card mt-4">
          {rows.length === 0 ? (
            <p className="px-5 py-8 text-center text-[14px] text-muted">{empty}</p>
          ) : (
            <ul className="divide-y divide-line">
              {rows.map((k) => (
                <li key={k} className="px-5 py-3.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 text-[15px] font-semibold text-ink">{dayLabel(k)}</span>
                    <span className="shrink-0 text-[13px] tabular-nums text-muted">{right(k)}</span>
                  </div>
                  {body(k)}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 pt-10">
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-5" role="group" aria-label="তারিখের পরিসর">
        {RANGES.map((r) => (
          <button key={r.v} onClick={() => chooseRange(r.v)} aria-pressed={range.kind === r.v}
            className={`pill shrink-0 ${range.kind === r.v ? 'bg-brand text-white' : 'pill-off'}`}>{r.l}</button>
        ))}
      </div>
      <button onClick={() => chooseRange('custom')} className="mx-5 flex items-center gap-1.5 text-[13px] text-muted">
        <CalendarDays size={15} />
        {formatGregorian(keyToDate(fromKey), lang, keyToDate(fromKey).getFullYear() !== keyToDate(toKey).getFullYear())} – {formatGregorian(keyToDate(toKey), lang, true)}
        <span className="text-ink/40">•</span> {n(len)} দিন
      </button>
      {/* the overall average with its last 7 days, then a tile per category; each opens its report */}
      <div className="!mt-10 space-y-2.5 px-5">
        {/* the overall average as a segmented gauge, with the change from the period before */}
        <button onClick={() => openDetail('avg')} aria-label={`সব আমল: ${n(avg)}% — বিস্তারিত দেখুন`}
          className="tap block w-full rounded-[18px] bg-surface px-5 pb-5 pt-4 text-left ring-1 ring-line">
          <span className="flex items-center justify-between">
            <span className="text-[19px] font-bold text-ink">সব আমল</span>
            <ChevronRight size={20} className="text-muted" />
          </span>
          <span className="relative mx-auto mt-2 block w-full max-w-[300px]">
            <Gauge value={avg / 100} />
            <span className="absolute inset-x-0 bottom-0 flex flex-col items-center">
              <span className="text-[46px] font-extrabold leading-none tabular-nums text-ink">{n(avg)}%</span>
              <span className="mt-1.5 text-[13px] text-muted">{n(len)} দিনের গড় সম্পন্ন</span>
            </span>
          </span>
          <span className="mx-auto mt-4 flex w-fit max-w-full items-center gap-2 rounded-full border border-line py-1 pl-3.5 pr-1 text-[13px] text-ink">
            <span className="min-w-0 truncate">{change > 0 ? `আগের ${n(len)} দিনের চেয়ে বেড়েছে` : change < 0 ? `আগের ${n(len)} দিনের চেয়ে কমেছে` : `আগের ${n(len)} দিনের মতোই`}</span>
            <span className={`flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-[12px] font-semibold ${change > 0 ? 'bg-success/15 text-success' : change < 0 ? 'bg-alert/15 text-alert' : 'bg-chip text-muted'}`}>
              {change > 0 ? <ArrowUpRight size={13} /> : change < 0 ? <ArrowDownRight size={13} /> : null}
              {change > 0 ? '+' : change < 0 ? '−' : ''}{n(Math.abs(change))}%
            </span>
          </span>
        </button>
        {/* category tiles on the grey page, each in a light tint of its colour: icon in a white circle, then the name and its average */}
        <div className="grid grid-cols-2 gap-2.5">
          {catStats.map(({ g, pct }, i) => {
            const color = CAT_COLORS[g] ?? 'rgb(var(--muted))';
            const wide = i === catStats.length - 1 && catStats.length % 2 === 1;
            // ব্যক্তিগত আমল's grey needs a deeper tint than the coloured tiles to stand out from the grey page
            return (
              <button key={g} onClick={() => openCategory(g)} aria-label={`${g}: ${pct === null ? 'কোনো আমল নেই' : `${n(pct)}%`} — বিস্তারিত দেখুন`}
                style={{ background: `color-mix(in srgb, ${color} ${g === GROUP_MINE ? 26 : 14}%, rgb(var(--paper)))` }}
                className={`tap flex min-h-[148px] flex-col justify-between gap-4 rounded-[22px] p-4 text-left transition active:scale-[0.98] ${wide ? 'col-span-2' : ''}`}>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface/85" style={{ color }}>
                  {CARD_ICONS[g] ?? <ListChecks size={20} />}
                </span>
                <span className="block min-w-0">
                  <span className="block text-[16px] font-bold leading-snug text-ink">{g}</span>
                  <span className="mt-1 block text-[13px] text-muted">{pct === null ? 'এখনো কোনো আমল নেই' : `${n(pct)}% গড় সম্পন্ন`}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <section className="page-card !mt-10 px-5 py-4">
        <h3 className="text-[17px] font-bold text-ink">{toKey === todayKey ? 'গত ৭ দিনের নামাজ' : `${formatGregorian(keyToDate(toKey), lang)} পর্যন্ত ৭ দিনের নামাজ`}</h3>
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
        <h3 className="text-[17px] font-bold text-ink">{n(len)} দিনের আমল ক্যালেন্ডার</h3>
        <div className={`mt-3 grid gap-1.5 ${len <= 7 ? 'grid-cols-7' : 'grid-cols-10'}`}>
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

      <Sheet open={picking} onClose={() => setPicking(false)} title="তারিখ বাছাই করুন">
        <RangeCalendar from={draft.from} to={draft.to} max={todayKey} lang={lang} onChange={(from, to) => setDraft({ from, to })} />
        <p className="mt-1 text-xs text-muted">সর্বোচ্চ {n(MAX_RANGE_DAYS)} দিন দেখা যাবে।</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button className="btn-soft" onClick={() => { setRange((r) => ({ ...r, kind: '30' })); setPicking(false); }}>৩০ দিনে ফিরুন</button>
          <button className="btn-primary" onClick={() => {
            const to = draft.to ?? draft.from;
            const earliest = dateKey(addDays(keyToDate(to), -(MAX_RANGE_DAYS - 1)));
            setRange({ kind: 'custom', from: draft.from < earliest ? earliest : draft.from, to });
            setPicking(false);
          }}>দেখান</button>
        </div>
      </Sheet>
    </div>
  );
}
