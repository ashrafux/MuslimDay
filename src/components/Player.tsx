import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { Pause, Play, SkipBack, SkipForward, X, Loader2 } from 'lucide-react';
import { SURAHS, surahAudioUrl, ayahAudioUrl } from '../lib/quran';
import { useStore } from '../store/useStore';
import { n } from '../lib/bn';
import { toast } from './ui';

type Track = { kind: 'surah'; surah: number } | { kind: 'ayah'; surah: number; ayah: number };

interface PlayerState {
  track: Track | null;
  playing: boolean;
  loading: boolean;
  progress: number;
  duration: number;
  continuous: boolean;
  play: (t: Track, continuous?: boolean) => void;
  toggle: () => void;
  stop: () => void;
  next: () => void;
  prev: () => void;
  seek: (sec: number) => void;
}

const audio = typeof Audio !== 'undefined' ? new Audio() : (null as unknown as HTMLAudioElement);

function urlFor(t: Track) {
  const reciter = useStore.getState().quran.reciter;
  return t.kind === 'surah' ? surahAudioUrl(reciter, t.surah) : ayahAudioUrl(reciter, t.surah, t.ayah);
}

export const usePlayer = create<PlayerState>((set, get) => ({
  track: null, playing: false, loading: false, progress: 0, duration: 0, continuous: true,
  play: (t, continuous = true) => {
    audio.src = urlFor(t);
    set({ track: t, loading: true, progress: 0, continuous });
    audio.play().catch(() => {
      set({ loading: false, playing: false });
      toast('অডিও চালানো যায়নি — ইন্টারনেট সংযোগ পরীক্ষা করুন');
    });
  },
  toggle: () => {
    if (!get().track) return;
    if (audio.paused) audio.play().catch(() => toast('অডিও চালানো যায়নি'));
    else audio.pause();
  },
  stop: () => { audio.pause(); audio.removeAttribute('src'); set({ track: null, playing: false, loading: false }); },
  next: () => {
    const t = get().track;
    if (!t) return;
    if (t.kind === 'surah') { if (t.surah < 114) get().play({ kind: 'surah', surah: t.surah + 1 }); else get().stop(); return; }
    const max = SURAHS[t.surah - 1].verses;
    if (t.ayah < max) get().play({ kind: 'ayah', surah: t.surah, ayah: t.ayah + 1 }, get().continuous);
    else get().stop();
  },
  prev: () => {
    const t = get().track;
    if (!t) return;
    if (t.kind === 'surah') { if (t.surah > 1) get().play({ kind: 'surah', surah: t.surah - 1 }); return; }
    if (t.ayah > 1) get().play({ kind: 'ayah', surah: t.surah, ayah: t.ayah - 1 }, get().continuous);
  },
  seek: (sec) => { audio.currentTime = sec; },
}));

if (audio) {
  audio.addEventListener('playing', () => usePlayer.setState({ playing: true, loading: false }));
  audio.addEventListener('pause', () => usePlayer.setState({ playing: false }));
  audio.addEventListener('waiting', () => usePlayer.setState({ loading: true }));
  audio.addEventListener('timeupdate', () => usePlayer.setState({ progress: audio.currentTime, duration: audio.duration || 0 }));
  audio.addEventListener('ended', () => {
    const s = usePlayer.getState();
    if (s.track?.kind === 'ayah' && !s.continuous) { usePlayer.setState({ playing: false }); return; }
    s.next();
  });
}

const fmt = (s: number) => (Number.isFinite(s) ? n(`${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`) : n('0:00'));

/** Persistent mini player shown above the bottom navigation. */
export function MiniPlayer({ bottom }: { bottom: number }) {
  const p = usePlayer();
  const [, force] = useState(0);
  useEffect(() => { force((x) => x + 1); }, [p.track]);
  if (!p.track) return null;
  const s = SURAHS[p.track.surah - 1];
  const reciter = useStore.getState().quran.reciter;
  return (
    <div className="fixed inset-x-0 z-40 mx-auto max-w-app px-3" style={{ bottom }}>
      <div className="rounded-2xl bg-brand-dark px-4 py-2.5 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-[17px]">সূরা {s.bn}{p.track.kind === 'ayah' && ` • আয়াত ${n(p.track.ayah)}`}</div>
            <div className="truncate text-xs opacity-80">{reciter.replace('ar.', '')} • {fmt(p.progress)} / {fmt(p.duration)}</div>
          </div>
          <button onClick={p.prev} className="tap p-1" aria-label="previous"><SkipBack size={20} /></button>
          <button onClick={p.toggle} className="tap rounded-full bg-white p-2 text-brand-dark" aria-label="play/pause">
            {p.loading ? <Loader2 size={20} className="animate-spin" /> : p.playing ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button onClick={p.next} className="tap p-1" aria-label="next"><SkipForward size={20} /></button>
          <button onClick={p.stop} className="tap p-1 opacity-80" aria-label="close"><X size={20} /></button>
        </div>
        <input type="range" min={0} max={p.duration || 0} step={1} value={p.progress} onChange={(e) => p.seek(Number(e.target.value))}
          className="mt-1 h-1 w-full accent-amber-300" aria-label="seek" />
      </div>
    </div>
  );
}
