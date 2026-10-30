import { useState } from 'react';
import { Pause, Play, Search } from 'lucide-react';
import { PageHeader } from '../components/ui';
import { usePlayer } from '../components/Player';
import { useStore } from '../store/useStore';
import { RECITERS, SURAHS } from '../lib/quran';
import { n } from '../lib/bn';

export default function AudioQuran() {
  const player = usePlayer();
  const reciter = useStore((s) => s.quran.reciter);
  const update = useStore((s) => s.updateQuran);
  const [q, setQ] = useState('');
  const list = SURAHS.filter((s) => !q || s.bn.includes(q) || s.en.toLowerCase().includes(q.toLowerCase()) || String(s.n) === q);
  const current = player.track?.kind === 'surah' ? player.track.surah : null;

  return (
    <div>
      <PageHeader back title="অডিও কুরআন" />
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 py-2">
        {RECITERS.map((r) => (
          <button key={r.id} onClick={() => { update({ reciter: r.id }); if (current) setTimeout(() => player.play({ kind: 'surah', surah: current }), 0); }}
            className={`shrink-0 rounded-full px-4 py-2 text-sm ${reciter === r.id ? 'bg-night text-white' : 'bg-surface text-ink ring-1 ring-line'}`}>{r.name}</button>
        ))}
      </div>
      <div className="px-5 py-4">
        <label className="flex items-center gap-2 rounded-2xl bg-surface px-4 shadow-card"><Search size={18} className="text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="সূরা খুঁজুন" className="w-full bg-transparent py-3 outline-none" /></label>
      </div>
      <div className="page-card">
        {list.map((s) => {
          const isCur = current === s.n;
          return (
            <button key={s.n} onClick={() => (isCur ? player.toggle() : player.play({ kind: 'surah', surah: s.n }))}
              className={`flex w-full items-center gap-4 border-b border-line px-5 py-3.5 text-left ${isCur ? 'bg-chip/60' : ''}`}>
              <span className={`flex h-11 w-11 items-center justify-center rounded-full ${isCur ? 'bg-night text-white' : 'bg-surface text-ink ring-1 ring-line'}`}>
                {isCur && player.playing ? <Pause size={18} /> : <Play size={18} />}
              </span>
              <span className="flex-1"><span className="block text-[18px] text-ink">{n(s.n)}. সূরা {s.bn}</span><span className="text-sm text-muted">{n(s.verses)} আয়াত • {s.meccan ? 'মাক্কী' : 'মাদানী'}</span></span>
              <span className="font-ar text-2xl text-brand" dir="rtl">{s.arabic}</span>
            </button>
          );
        })}
      </div>
      <p className="px-5 py-4 text-center text-xs text-muted">অডিও স্ট্রিমিংয়ের জন্য ইন্টারনেট প্রয়োজন • পরের সূরা স্বয়ংক্রিয়ভাবে চলবে</p>
    </div>
  );
}
