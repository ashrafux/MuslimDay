import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Bookmark, ChevronLeft, ChevronRight, Copy, FileText, Loader2, Pause, Play, Settings, Share2 } from 'lucide-react';
import { PageHeader, copyText, shareText, toast } from '../components/ui';
import { usePlayer } from '../components/Player';
import { useStore } from '../store/useStore';
import { useReadingTimer } from '../lib/hooks';
import { SURAHS, TAFSIRS, loadChapter, loadTafsir, type Chapter } from '../lib/quran';
import { n } from '../lib/bn';
import { sajdahAyat } from '../data/surahMeta';

const toArabicDigits = (x: number) => String(x).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);

function htmlToText(html: string) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('br,p,h2,h3,div').forEach((el) => el.append('\n'));
  return (doc.body.textContent ?? '').replace(/\n{3,}/g, '\n\n').trim();
}

function TafsirBox({ surah, ayah }: { surah: number; ayah: number }) {
  const [tafsirId, setTafsirId] = useState(TAFSIRS[0].id);
  const [state, setState] = useState<{ loading: boolean; text?: string; error?: boolean }>({ loading: true });
  useEffect(() => {
    let alive = true;
    setState({ loading: true });
    loadTafsir(tafsirId, surah, ayah)
      .then((t) => alive && setState({ loading: false, text: htmlToText(t) || 'এই আয়াতের তাফসীর পাওয়া যায়নি।' }))
      .catch(() => alive && setState({ loading: false, error: true }));
    return () => { alive = false; };
  }, [tafsirId, surah, ayah]);
  return (
    <div className="mt-3 rounded-2xl bg-bg p-4">
      <select value={tafsirId} onChange={(e) => setTafsirId(Number(e.target.value))} className="mb-3 w-full rounded-lg border border-line bg-surface p-2 text-ink">
        {TAFSIRS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
      {state.loading ? <div className="flex items-center gap-2 text-muted"><Loader2 className="animate-spin" size={18} /> লোড হচ্ছে…</div>
        : state.error ? <div className="text-muted">তাফসীর লোড করা যায়নি। তাফসীর দেখতে ইন্টারনেট সংযোগ প্রয়োজন।</div>
          : <p className="whitespace-pre-line text-[16px] leading-relaxed text-ink">{state.text}</p>}
    </div>
  );
}

export default function QuranReader() {
  const { surah: sp } = useParams();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const surah = Math.min(114, Math.max(1, Number(sp) || 1));
  const targetAyah = Number(params.get('ayah')) || 0;
  const tafsirMode = params.get('mode') === 'tafsir';
  const info = SURAHS[surah - 1];
  const qs = useStore((s) => s.quran);
  const bookmarks = useStore((s) => s.bookmarks);
  const toggleBookmark = useStore((s) => s.toggleBookmark);
  const setLastRead = useStore((s) => s.setLastRead);
  const player = usePlayer();
  const [data, setData] = useState<Chapter | null>(null);
  const [error, setError] = useState(false);
  const [openTafsir, setOpenTafsir] = useState<number | null>(tafsirMode && targetAyah ? targetAyah : null);
  const listRef = useRef<HTMLDivElement>(null);
  useReadingTimer('quranSeconds');

  useEffect(() => {
    setData(null); setError(false);
    loadChapter(surah).then(setData).catch(() => setError(true));
  }, [surah]);

  // scroll to requested ayah
  useEffect(() => {
    if (!data) return;
    if (targetAyah > 1) {
      requestAnimationFrame(() => document.getElementById(`ayah-${targetAyah}`)?.scrollIntoView({ block: 'start' }));
    } else window.scrollTo(0, 0);
  }, [data, targetAyah]);

  // remember last read ayah
  useEffect(() => {
    if (!data) return;
    let timer: number | undefined;
    const io = new IntersectionObserver((entries) => {
      const vis = entries.filter((e) => e.isIntersecting).map((e) => Number((e.target as HTMLElement).dataset.ayah));
      if (!vis.length) return;
      clearTimeout(timer);
      timer = window.setTimeout(() => setLastRead(surah, Math.min(...vis)), 800);
    }, { rootMargin: '-30% 0px -60% 0px' });
    listRef.current?.querySelectorAll('[data-ayah]').forEach((el) => io.observe(el));
    return () => { io.disconnect(); clearTimeout(timer); };
  }, [data, surah, setLastRead]);

  // follow audio
  const playingAyah = player.track?.kind === 'ayah' && player.track.surah === surah ? player.track.ayah : null;
  useEffect(() => {
    if (playingAyah) document.getElementById(`ayah-${playingAyah}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [playingAyah]);

  const surahPlaying = player.track?.kind === 'surah' && player.track.surah === surah && player.playing;
  const sajdah = new Set(sajdahAyat.filter((x) => x.surah === surah).map((x) => x.ayah));

  return (
    <div>
      <PageHeader back title={`সূরা ${info.bn}`} sub={`${info.meaning ? `${info.meaning} • ` : ''}${info.meccan ? 'মাক্কী' : 'মাদানী'} • ${n(info.verses)} আয়াত`}
        right={<>
          <button aria-label="play surah" onClick={() => (surahPlaying ? player.toggle() : player.play({ kind: 'surah', surah }))} className="tap p-2 text-brand">
            {surahPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
          <button aria-label="settings" onClick={() => nav('/quran/settings')} className="tap p-2 text-ink"><Settings size={22} /></button>
        </>} />

      <div className="bg-gradient-to-b from-chip to-bg px-5 py-6 text-center">
        <div className="font-ar text-5xl text-brand" dir="rtl">{info.arabic}</div>
        <div className="mt-2 text-muted">{info.en}</div>
        {surah !== 1 && surah !== 9 && <div className="font-ar mt-4 text-3xl text-ink" dir="rtl">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>}
      </div>

      {error && <div className="p-8 text-center text-muted">সূরাটি লোড করা যায়নি। <button className="text-brand" onClick={() => loadChapter(surah).then(setData).then(() => setError(false))}>আবার চেষ্টা করুন</button></div>}
      {!data && !error && <div className="flex justify-center p-10 text-brand"><Loader2 className="animate-spin" size={32} /></div>}

      <div ref={listRef}>
        {data?.verses.map((v) => {
          const marked = bookmarks.some((b) => b.surah === surah && b.ayah === v.id);
          const active = playingAyah === v.id || (targetAyah === v.id && !playingAyah);
          return (
            <article key={v.id} id={`ayah-${v.id}`} data-ayah={v.id}
              className={`scroll-mt-24 border-b border-line px-5 py-5 transition-colors ${active ? 'bg-chip/60' : 'bg-surface'}`}>
              <div className="flex items-center justify-between">
                <span className="flex h-9 min-w-9 items-center justify-center rounded-full bg-chip px-2 text-sm text-brand">{n(surah)}:{n(v.id)}</span>
                <div className="flex items-center gap-1 text-muted">
                  {sajdah.has(v.id) && <span className="mr-1 rounded-full bg-amber-100 px-2 text-xs text-amber-800">সিজদা</span>}
                  <button aria-label="play ayah" className="tap rounded-full p-2 hover:text-brand"
                    onClick={() => (playingAyah === v.id ? player.toggle() : player.play({ kind: 'ayah', surah, ayah: v.id }))}>
                    {playingAyah === v.id && player.playing ? <Pause size={19} /> : <Play size={19} />}
                  </button>
                  <button aria-label="bookmark" className={`tap rounded-full p-2 ${marked ? 'text-brand' : 'hover:text-brand'}`}
                    onClick={() => { toggleBookmark(surah, v.id); toast(marked ? 'বুকমার্ক সরানো হয়েছে' : 'বুকমার্ক করা হয়েছে'); }}>
                    <Bookmark size={19} fill={marked ? 'currentColor' : 'none'} />
                  </button>
                  <button aria-label="tafsir" className={`tap rounded-full p-2 ${openTafsir === v.id ? 'text-brand' : 'hover:text-brand'}`} onClick={() => setOpenTafsir(openTafsir === v.id ? null : v.id)}>
                    <FileText size={19} />
                  </button>
                  <button aria-label="copy" className="tap rounded-full p-2 hover:text-brand" onClick={() => copyText(`${v.text}\n\n${v.translation}\n— সূরা ${info.bn} ${surah}:${v.id}`)}><Copy size={19} /></button>
                  <button aria-label="share" className="tap rounded-full p-2 hover:text-brand" onClick={() => shareText(`সূরা ${info.bn} ${surah}:${v.id}`, `${v.text}\n\n${v.translation}\n— সূরা ${info.bn} ${n(surah)}:${n(v.id)}`)}><Share2 size={19} /></button>
                </div>
              </div>
              <p className={`mt-4 text-right leading-[2.2] text-ink ${qs.arabicFont === 'sch' ? 'font-sch' : 'font-ar'}`} dir="rtl" style={{ fontSize: qs.arabicSize }}>
                {v.text} <span className="font-ar text-brand">﴿{toArabicDigits(v.id)}﴾</span>
              </p>
              {qs.showTransliteration && v.transliteration && <p className="mt-3 italic text-muted" style={{ fontSize: qs.translationSize - 2 }}>{v.transliteration}</p>}
              {qs.showTranslation && <p className="mt-3 leading-relaxed text-ink" style={{ fontSize: qs.translationSize }}>{v.translation}</p>}
              {(openTafsir === v.id) && <TafsirBox surah={surah} ayah={v.id} />}
              {tafsirMode && openTafsir !== v.id && (
                <button onClick={() => setOpenTafsir(v.id)} className="mt-3 rounded-full bg-chip px-4 py-1.5 text-sm text-brand">তাফসীর দেখুন</button>
              )}
            </article>
          );
        })}
      </div>

      {data && (
        <div className="flex justify-between gap-3 p-5">
          <button disabled={surah === 1} onClick={() => nav(`/quran/${surah - 1}${tafsirMode ? '?mode=tafsir' : ''}`)} className="btn-soft flex-1 disabled:opacity-40"><ChevronLeft size={18} /> পূর্ববর্তী সূরা</button>
          <button disabled={surah === 114} onClick={() => nav(`/quran/${surah + 1}${tafsirMode ? '?mode=tafsir' : ''}`)} className="btn-primary flex-1 disabled:opacity-40">পরবর্তী সূরা <ChevronRight size={18} /></button>
        </div>
      )}
      <p className="px-5 pb-6 text-center text-xs text-muted">আরবি টেক্সট ও বাংলা অনুবাদ: quran-json (CC BY 4.0)</p>
    </div>
  );
}
