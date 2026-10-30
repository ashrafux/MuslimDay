import { useState } from 'react';
import { Plus, RotateCcw, Vibrate, Volume2, VolumeX, History, Trash2 } from 'lucide-react';
import { PageHeader, ProgressRing, Sheet, toast } from '../components/ui';
import { useStore } from '../store/useStore';
import { dateKey, n } from '../lib/bn';

const AMOL_LINK: Record<string, { id: string; target: number }> = {
  astaghfirullah: { id: 'istighfar', target: 100 },
  durud: { id: 'durud', target: 10 },
};

let ctx: AudioContext | null = null;
function click() {
  try {
    ctx ??= new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = 1200;
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    o.connect(g).connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + 0.05);
  } catch { /* ignore */ }
}

export default function Tasbih() {
  const tasbih = useStore((s) => s.tasbih);
  const presets = useStore((s) => s.tasbihPresets);
  const set = useStore((s) => s.set);
  const [sound, setSound] = useState(false);
  const [vibrate, setVibrate] = useState(true);
  const [adding, setAdding] = useState(false);
  const [hist, setHist] = useState(false);
  const [form, setForm] = useState({ bn: '', arabic: '', target: 33 });
  const preset = presets.find((p) => p.id === tasbih.presetId) ?? presets[0];
  const rounds = Math.floor(tasbih.count / preset.target);
  const inRound = tasbih.count % preset.target;

  const save = (count: number) => {
    if (count <= 0) return tasbih.history;
    return [{ date: dateKey(), label: preset.bn, count }, ...tasbih.history].slice(0, 100);
  };

  const tap = () => {
    const c = tasbih.count + 1;
    set('tasbih', { ...tasbih, count: c, total: tasbih.total + 1 });
    // Astaghfirullah / durud taps also count toward today's amol counters
    const linked = AMOL_LINK[preset.id];
    if (linked) {
      const st = useStore.getState();
      const k = dateKey();
      st.setAmolCount(linked.id, k, (st.amolCounts[k]?.[linked.id] ?? 0) + 1, linked.target);
    }
    if (sound) click();
    if (c % preset.target === 0) { navigator.vibrate?.([80, 60, 80]); toast(`${n(c / preset.target)} রাউন্ড সম্পন্ন — মাশাআল্লাহ`); }
    else if (vibrate) navigator.vibrate?.(12);
  };

  const reset = () => { set('tasbih', { ...tasbih, count: 0, history: save(tasbih.count) }); toast('রিসেট হয়েছে'); };
  const choose = (id: string) => set('tasbih', { ...tasbih, presetId: id, count: 0, history: save(tasbih.count) });

  return (
    <div className="flex min-h-screen flex-col">
      <PageHeader back title="তাসবীহ" right={<button aria-label="history" onClick={() => setHist(true)} className="tap p-2 text-ink"><History size={22} /></button>} />
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-2">
        {presets.map((p) => (
          <button key={p.id} onClick={() => choose(p.id)} className={`shrink-0 rounded-full px-4 py-2 ${p.id === preset.id ? 'bg-night text-white' : 'bg-surface text-ink ring-1 ring-line'}`}>{p.bn}</button>
        ))}
        <button onClick={() => setAdding(true)} className="flex shrink-0 items-center gap-1 rounded-full border-2 border-dashed border-brand/50 px-4 py-2 text-brand"><Plus size={16} /> নতুন</button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-6">
        <p className="font-ar text-4xl text-brand" dir="rtl">{preset.arabic}</p>
        <p className="mt-1 text-lg text-muted">{preset.bn}</p>
        <button onClick={tap} aria-label="count" className="mt-8 rounded-full active:scale-[.97] transition">
          <ProgressRing value={inRound / preset.target || (tasbih.count > 0 && inRound === 0 ? 1 : 0)} size={260} stroke={14} color="rgb(var(--brand))" track="rgb(var(--brand) / .12)">
            <span className="flex h-[210px] w-[210px] flex-col items-center justify-center rounded-full bg-night text-white shadow-xl">
              <span className="text-6xl tabular-nums">{n(tasbih.count)}</span>
              <span className="mt-1 text-sm opacity-80">লক্ষ্য {n(preset.target)} • রাউন্ড {n(rounds)}</span>
              <span className="mt-3 text-xs opacity-70">চাপ দিন</span>
            </span>
          </ProgressRing>
        </button>
        <div className="mt-8 flex gap-4">
          <button aria-label="reset" onClick={reset} className="tap flex h-14 w-14 items-center justify-center rounded-full bg-surface text-ink shadow"><RotateCcw /></button>
          <button aria-label="sound" onClick={() => setSound(!sound)} className={`tap flex h-14 w-14 items-center justify-center rounded-full shadow ${sound ? 'bg-night text-white' : 'bg-surface text-ink ring-1 ring-line'}`}>{sound ? <Volume2 /> : <VolumeX />}</button>
          <button aria-label="vibrate" onClick={() => setVibrate(!vibrate)} className={`tap flex h-14 w-14 items-center justify-center rounded-full shadow ${vibrate ? 'bg-night text-white' : 'bg-surface text-ink ring-1 ring-line'}`}><Vibrate /></button>
        </div>
        <p className="mt-6 text-muted">সর্বমোট গণনা: {n(tasbih.total)}</p>
      </div>

      <Sheet open={adding} onClose={() => setAdding(false)} title="নতুন যিকর">
        <div className="space-y-3">
          <input className="input" placeholder="বাংলা নাম (যেমন: হাসবুনাল্লাহ)" value={form.bn} onChange={(e) => setForm({ ...form, bn: e.target.value })} />
          <input className="input font-ar text-right" dir="rtl" placeholder="আরবি (ঐচ্ছিক)" value={form.arabic} onChange={(e) => setForm({ ...form, arabic: e.target.value })} />
          <label className="block text-sm text-muted">লক্ষ্য সংখ্যা
            <input type="number" min={1} className="input mt-1" value={form.target} onChange={(e) => setForm({ ...form, target: Math.max(1, Number(e.target.value)) })} /></label>
          <button className="btn-primary w-full" disabled={!form.bn.trim()} onClick={() => {
            const id = `t-${Date.now()}`;
            set('tasbihPresets', [...presets, { id, bn: form.bn.trim(), arabic: form.arabic.trim() || form.bn.trim(), target: form.target }]);
            set('tasbih', { ...useStore.getState().tasbih, presetId: id, count: 0 });
            setForm({ bn: '', arabic: '', target: 33 }); setAdding(false);
          }}>যোগ করুন</button>
          {presets.length > 7 && (
            <div className="pt-2">
              <div className="mb-1 text-sm text-muted">কাস্টম যিকর মুছুন</div>
              {presets.slice(7).map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 text-ink">{p.bn}
                  <button aria-label="delete" onClick={() => set('tasbihPresets', presets.filter((x) => x.id !== p.id))} className="text-muted"><Trash2 size={18} /></button></div>
              ))}
            </div>
          )}
        </div>
      </Sheet>
      <Sheet open={hist} onClose={() => setHist(false)} title="তাসবীহ ইতিহাস">
        {tasbih.history.length === 0 ? <p className="text-muted">এখনও কোনো ইতিহাস নেই। রিসেট বা যিকর পরিবর্তন করলে গণনা এখানে সংরক্ষিত হবে।</p>
          : tasbih.history.map((h, i) => (
            <div key={i} className="flex justify-between border-b border-line py-3 text-ink"><span>{h.label}<span className="block text-xs text-muted">{h.date}</span></span><span className="text-xl text-brand">{n(h.count)}</span></div>
          ))}
      </Sheet>
    </div>
  );
}
