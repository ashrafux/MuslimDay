import { useState } from 'react';
import { Minus, Plus, Calculator } from 'lucide-react';
import { PageHeader, Sheet, toast } from '../components/ui';
import { useStore } from '../store/useStore';
import { n } from '../lib/bn';

const ROWS = [
  { id: 'fajr', label: 'ফজর' },
  { id: 'dhuhr', label: 'যোহর' },
  { id: 'asr', label: 'আসর' },
  { id: 'maghrib', label: 'মাগরিব' },
  { id: 'isha', label: 'ইশা' },
  { id: 'witr', label: 'বিতর' },
] as const;

export default function Qaza() {
  const qaza = useStore((s) => s.qaza);
  const set = useStore((s) => s.set);
  const [calc, setCalc] = useState(false);
  const [years, setYears] = useState('');
  const [months, setMonths] = useState('');
  const total = Object.values(qaza).reduce((a, b) => a + b, 0);

  const change = (id: keyof typeof qaza, d: number) => {
    const v = Math.max(0, qaza[id] + d);
    set('qaza', { ...qaza, [id]: v });
    if (d < 0 && qaza[id] > 0) { navigator.vibrate?.(15); if (v === 0) toast('আলহামদুলিল্লাহ! এই ওয়াক্তের কাযা শেষ'); }
  };

  return (
    <div>
      <PageHeader back title="কাযা নামাজ" />
      <section className="mx-5 my-4 rounded-[10px] bg-night shadow-float p-5 text-white">
        <div className="text-sm opacity-80">মোট বাকি কাযা নামাজ</div>
        <div className="text-5xl">{n(total)}</div>
        <p className="mt-2 text-sm opacity-85">প্রতিদিন অন্তত এক ওয়াক্তের কাযা আদায় করলে {n(Math.ceil(total / 6))} দিনে শেষ হবে ইনশাআল্লাহ।</p>
      </section>
      <div className="page-card">
        {ROWS.map((r) => (
          <div key={r.id} className="flex items-center justify-between border-b border-line px-5 py-4">
            <span className="text-[19px] text-ink">{r.label}</span>
            <div className="flex items-center gap-4">
              <button aria-label={`${r.label} qaza done`} onClick={() => change(r.id, -1)} className="tap flex h-10 w-10 items-center justify-center rounded-full bg-chip text-brand"><Minus size={18} /></button>
              <span className="w-12 text-center text-2xl tabular-nums text-ink">{n(qaza[r.id])}</span>
              <button aria-label={`${r.label} add qaza`} onClick={() => change(r.id, 1)} className="tap flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white"><Plus size={18} /></button>
            </div>
          </div>
        ))}
      </div>
      <div className="p-5">
        <button className="btn-soft w-full" onClick={() => setCalc(true)}><Calculator size={18} /> সময়কাল থেকে হিসাব করুন</button>
        <p className="mt-4 text-sm leading-relaxed text-muted">"−" চাপুন যখন একটি কাযা আদায় করবেন। বালেগ হওয়ার পর থেকে ছুটে যাওয়া নামাজের আনুমানিক হিসাব করে নিয়মিত আদায় করুন — কাযা নামাজের নিয়তে নির্দিষ্ট ওয়াক্ত উল্লেখ করুন (যেমন: আমার জিম্মায় থাকা প্রথম ফজরের কাযা)।</p>
      </div>
      <Sheet open={calc} onClose={() => setCalc(false)} title="কাযা হিসাব">
        <p className="text-sm text-muted">কত সময়ের নামাজ ছুটে গেছে আনুমানিক লিখুন। প্রতি দিনে ৫ ওয়াক্ত + বিতর যোগ হবে।</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="text-sm text-muted">বছর<input inputMode="numeric" className="input mt-1" value={years} onChange={(e) => setYears(e.target.value)} /></label>
          <label className="text-sm text-muted">মাস<input inputMode="numeric" className="input mt-1" value={months} onChange={(e) => setMonths(e.target.value)} /></label>
        </div>
        <button className="btn-primary mt-4 w-full" onClick={() => {
          const days = Math.round((Number(years) || 0) * 354 + (Number(months) || 0) * 29.5);
          if (!days) return;
          set('qaza', { fajr: qaza.fajr + days, dhuhr: qaza.dhuhr + days, asr: qaza.asr + days, maghrib: qaza.maghrib + days, isha: qaza.isha + days, witr: qaza.witr + days });
          setCalc(false); toast(`${n(days)} দিনের কাযা যোগ হয়েছে`);
        }}>যোগ করুন</button>
      </Sheet>
    </div>
  );
}
