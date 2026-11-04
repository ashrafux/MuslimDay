import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { dateKey, keyToDate, n } from '../lib/bn';
import { GREG_MONTHS_BN, GREG_MONTHS_EN, WEEKDAYS_BN, formatGregorian } from '../lib/dates';

// Bangladeshi week runs Saturday → Friday; Thursday is shortened to fit the column
const HEAD = [6, 0, 1, 2, 3, 4, 5].map((i) => (i === 4 ? 'বৃহঃ' : WEEKDAYS_BN[i]));

/**
 * In-app date-range calendar. Works the same in browsers, the Android WebView and iOS,
 * where the native date input looks and behaves differently (or not at all inside frames).
 * First tap sets the start, second tap sets the end; a third tap starts a new range.
 */
export function RangeCalendar({ from, to, max, lang, onChange }: {
  from: string;
  to: string | null;
  max: string;
  lang: 'bn' | 'en';
  onChange: (from: string, to: string | null) => void;
}) {
  const [view, setView] = useState(() => {
    const d = keyToDate(to ?? from);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const y = view.getFullYear();
  const m = view.getMonth();
  const lead = (view.getDay() + 1) % 7;
  const count = new Date(y, m + 1, 0).getDate();
  const cells: (string | null)[] = [...Array(lead).fill(null), ...Array.from({ length: count }, (_, i) => dateKey(new Date(y, m, i + 1)))];
  const today = dateKey();
  const nextDisabled = dateKey(new Date(y, m + 1, 1)) > max;
  const months = lang === 'bn' ? GREG_MONTHS_BN : GREG_MONTHS_EN;

  const pick = (k: string) => {
    if (to) onChange(k, null);
    else if (k < from) onChange(k, from);
    else onChange(from, k);
  };
  const end = to ?? from;

  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5">
        {/* the highlighted box is the one the next tap will fill */}
        {[{ l: 'শুরু', k: from, next: !!to }, { l: 'শেষ', k: to, next: !to }].map((f) => (
          <div key={f.l} className={`rounded-[10px] border px-3.5 py-2.5 ${f.next ? 'border-brand ring-4 ring-brand/10' : 'border-line'}`}>
            <div className="text-[12px] text-muted">{f.l}</div>
            <div className={`mt-0.5 text-[15px] font-bold ${f.k ? 'text-ink' : 'text-muted'}`}>{f.k ? formatGregorian(keyToDate(f.k), lang, true) : 'বাছাই করুন'}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button aria-label="previous month" onClick={() => setView(new Date(y, m - 1, 1))} className="tap flex h-9 w-9 items-center justify-center rounded-full bg-chip text-ink"><ChevronLeft size={18} /></button>
        <div className="text-[16px] font-bold text-ink" aria-live="polite">{months[m]} {n(y)}</div>
        <button aria-label="next month" disabled={nextDisabled} onClick={() => setView(new Date(y, m + 1, 1))} className="tap flex h-9 w-9 items-center justify-center rounded-full bg-chip text-ink disabled:opacity-30"><ChevronRight size={18} /></button>
      </div>

      <div className="mt-3 grid grid-cols-7 text-center text-[11px] font-semibold text-muted">
        {HEAD.map((h, i) => <span key={h} className={i === 6 ? 'text-brand' : ''}>{h}</span>)}
      </div>
      <div className="mt-1.5 grid grid-cols-7 gap-y-1">
        {cells.map((k, i) => {
          if (!k) return <span key={`b${i}`} />;
          const future = k > max;
          const isStart = k === from;
          const isEnd = !!to && k === to;
          const inside = !!to && k > from && k < to;
          const col = i % 7;
          // the soft band joins neighbouring days; it is cut at row edges and range ends
          const band = inside || ((isStart || isEnd) && to && from !== to);
          return (
            <div key={k} className={`relative flex h-10 items-center justify-center ${band ? 'bg-brand/10' : ''}
              ${band && (isStart || col === 0) ? 'rounded-l-full' : ''} ${band && (isEnd || col === 6) ? 'rounded-r-full' : ''}`}>
              <button disabled={future} onClick={() => pick(k)} aria-pressed={isStart || isEnd} aria-label={formatGregorian(keyToDate(k), lang, true)}
                className={`flex h-10 w-10 items-center justify-center rounded-full text-[14px] font-semibold transition disabled:opacity-30
                  ${isStart || isEnd ? 'bg-brand text-white' : inside ? 'text-brand' : k === today ? 'text-brand ring-1 ring-inset ring-brand/40' : 'text-ink'}`}>
                {n(keyToDate(k).getDate())}
              </button>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[13px] text-muted">
        {to ? `${formatGregorian(keyToDate(from), lang)} – ${formatGregorian(keyToDate(end), lang)} • ${n(Math.round((keyToDate(end).getTime() - keyToDate(from).getTime()) / 864e5) + 1)} দিন`
          : 'এখন শেষের তারিখে ট্যাপ করুন (একই দিনে ট্যাপ করলে শুধু সেই দিন)'}
      </p>
    </div>
  );
}
