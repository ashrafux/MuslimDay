import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Loader2, Search, Trash2 } from 'lucide-react';
import { Empty, PageHeader, Toggle } from '../components/ui';
import { useStore } from '../store/useStore';
import { RECITERS, SURAHS, loadChapter, type Chapter } from '../lib/quran';
import { n } from '../lib/bn';
import { SurahRow } from './Quran';

export function QuranSettingsPage() {
  const q = useStore((s) => s.quran);
  const update = useStore((s) => s.updateQuran);
  return (
    <div>
      <PageHeader back title="কুরআন সেটিংস" />
      <div className="space-y-4 p-5">
        <div className="rounded-2xl bg-surface p-5">
          <p className={`text-right leading-[2.2] text-ink ${q.arabicFont === 'sch' ? 'font-sch' : 'font-ar'}`} dir="rtl" style={{ fontSize: q.arabicSize }}>بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
          <p className="mt-2 text-ink" style={{ fontSize: q.translationSize }}>শুরু করছি আল্লাহর নামে যিনি পরম করুণাময়, অতি দয়ালু।</p>
        </div>
        <div className="rounded-2xl bg-surface p-5">
          <label className="text-ink">আরবি ফন্ট সাইজ: {n(q.arabicSize)}</label>
          <input type="range" min={20} max={48} value={q.arabicSize} onChange={(e) => update({ arabicSize: Number(e.target.value) })} className="w-full accent-[rgb(var(--brand))]" />
          <label className="mt-3 block text-ink">অনুবাদ ফন্ট সাইজ: {n(q.translationSize)}</label>
          <input type="range" min={14} max={28} value={q.translationSize} onChange={(e) => update({ translationSize: Number(e.target.value) })} className="w-full accent-[rgb(var(--brand))]" />
          <label className="mt-3 block text-ink">আরবি ফন্ট</label>
          <div className="mt-2 flex gap-2">
            {([['ar', 'আমিরি'], ['sch', 'শাহেরাজাদ']] as const).map(([v, l]) => (
              <button key={v} onClick={() => update({ arabicFont: v })} className={`rounded-full px-4 py-2 ${q.arabicFont === v ? 'bg-brand text-white' : 'bg-chip text-ink'}`}>{l}</button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-line rounded-2xl bg-surface">
          <div className="flex items-center justify-between p-5"><span className="text-ink">বাংলা অনুবাদ দেখান</span><Toggle checked={q.showTranslation} onChange={(v) => update({ showTranslation: v })} /></div>
          <div className="flex items-center justify-between p-5"><span className="text-ink">উচ্চারণ (ইংরেজি) দেখান</span><Toggle checked={q.showTransliteration} onChange={(v) => update({ showTransliteration: v })} /></div>
        </div>
        <div className="rounded-2xl bg-surface p-5">
          <div className="mb-2 text-ink">ক্বারী (তিলাওয়াত)</div>
          {RECITERS.map((r) => (
            <label key={r.id} className="flex items-center gap-3 py-2 text-ink">
              <input type="radio" name="reciter" checked={q.reciter === r.id} onChange={() => update({ reciter: r.id })} className="h-5 w-5 accent-[rgb(var(--brand))]" />
              {r.name}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export function QuranSearch() {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [all, setAll] = useState<Chapter[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (q.trim().length < 2 || all || loading) return;
    setLoading(true);
    Promise.all(SURAHS.map((s) => loadChapter(s.n))).then((c) => { setAll(c); setLoading(false); }).catch(() => setLoading(false));
  }, [q, all, loading]);

  const query = q.trim();
  const ref = query.match(/^(\d{1,3})[:\s.](\d{1,3})$/);
  const surahHits = query ? SURAHS.filter((s) => s.bn.includes(query) || s.en.toLowerCase().includes(query.toLowerCase()) || s.arabic.includes(query) || String(s.n) === query) : [];
  const ayahHits = useMemo(() => {
    if (!all || query.length < 2) return [];
    const res: { surah: number; ayah: number; text: string }[] = [];
    for (const c of all) for (const v of c.verses) {
      if (v.translation.includes(query) || v.text.includes(query)) {
        res.push({ surah: c.id, ayah: v.id, text: v.translation });
        if (res.length >= 100) return res;
      }
    }
    return res;
  }, [all, query]);

  const highlight = (t: string) => {
    const i = t.indexOf(query);
    if (i < 0) return t;
    return <>{t.slice(0, i)}<mark className="rounded bg-amber-200 px-0.5 text-ink">{query}</mark>{t.slice(i + query.length)}</>;
  };

  return (
    <div>
      <PageHeader back title="অনুসন্ধান" />
      <div className="sticky top-[72px] z-20 bg-bg p-4">
        <label className="flex items-center gap-2 rounded-2xl bg-surface px-4 shadow-sm">
          <Search className="text-muted" size={20} />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="সূরার নাম, শব্দ বা ২:২৫৫" className="w-full bg-transparent py-3.5 text-lg text-ink outline-none" />
        </label>
      </div>
      {ref && (
        <button className="mx-4 mb-3 w-[calc(100%-2rem)] rounded-2xl bg-chip p-4 text-left text-brand" onClick={() => nav(`/quran/${ref[1]}?ayah=${ref[2]}`)}>
          সূরা {SURAHS[Number(ref[1]) - 1]?.bn ?? ''} — আয়াত {n(ref[2])} এ যান →
        </button>
      )}
      {surahHits.length > 0 && <div className="bg-surface">{surahHits.slice(0, 10).map((s) => <SurahRow key={s.n} s={s} onClick={() => nav(`/quran/${s.n}`)} />)}</div>}
      {loading && <div className="flex items-center justify-center gap-2 p-6 text-muted"><Loader2 className="animate-spin" /> সম্পূর্ণ কুরআনে খোঁজা হচ্ছে…</div>}
      {ayahHits.length > 0 && (
        <div className="mt-3 bg-surface">
          <div className="px-5 pt-4 text-sm text-muted">{n(ayahHits.length)}{ayahHits.length >= 100 ? '+' : ''} টি আয়াত পাওয়া গেছে</div>
          {ayahHits.map((h) => (
            <button key={`${h.surah}:${h.ayah}`} onClick={() => nav(`/quran/${h.surah}?ayah=${h.ayah}`)} className="block w-full border-b border-line px-5 py-4 text-left">
              <div className="text-sm text-brand">সূরা {SURAHS[h.surah - 1].bn} {n(h.surah)}:{n(h.ayah)}</div>
              <div className="mt-1 line-clamp-3 text-ink">{highlight(h.text)}</div>
            </button>
          ))}
        </div>
      )}
      {query.length >= 2 && !loading && all && !ayahHits.length && !surahHits.length && <Empty icon={<Search size={36} />} title="কিছু পাওয়া যায়নি" sub="অন্য শব্দ দিয়ে চেষ্টা করুন" />}
      {!query && <Empty icon={<Search size={36} />} title="কুরআনে খুঁজুন" sub="বাংলা শব্দ (যেমন: ধৈর্য), আরবি শব্দ, সূরার নাম বা সূরা:আয়াত লিখুন" />}
    </div>
  );
}

export function QuranBookmarks() {
  const nav = useNavigate();
  const bookmarks = useStore((s) => s.bookmarks);
  const toggle = useStore((s) => s.toggleBookmark);
  const lastRead = useStore((s) => s.lastRead);
  return (
    <div>
      <PageHeader back title="বুকমার্কস" />
      {bookmarks.length === 0 ? (
        <Empty icon={<Bookmark size={36} />} title="কোনো বুকমার্ক নেই" sub="পড়ার সময় আয়াতের পাশের বুকমার্ক আইকনে চাপ দিন" action={<button className="btn-primary" onClick={() => nav('/quran/1')}>পড়া শুরু করুন</button>} />
      ) : (
        <div className="bg-surface">
          {bookmarks.map((b) => (
            <div key={`${b.surah}:${b.ayah}`} className="flex items-center border-b border-line">
              <button onClick={() => nav(`/quran/${b.surah}?ayah=${b.ayah}`)} className="flex-1 px-5 py-4 text-left">
                <div className="text-xl text-ink">সূরা {SURAHS[b.surah - 1].bn}</div>
                <div className="text-sm text-muted">আয়াত {n(b.ayah)} • {new Date(b.time).toLocaleDateString('bn-BD')}</div>
              </button>
              <button aria-label="remove" onClick={() => toggle(b.surah, b.ayah)} className="p-5 text-muted"><Trash2 size={20} /></button>
            </div>
          ))}
        </div>
      )}
      {lastRead.length > 0 && (
        <>
          <h3 className="px-5 pb-2 pt-6 text-lg text-muted">পড়ার ইতিহাস</h3>
          <div className="bg-surface">
            {lastRead.map((l) => (
              <button key={l.surah} onClick={() => nav(`/quran/${l.surah}?ayah=${l.ayah}`)} className="block w-full border-b border-line px-5 py-4 text-left">
                <div className="text-lg text-ink">সূরা {SURAHS[l.surah - 1].bn} — আয়াত {n(l.ayah)}</div>
                <div className="text-sm text-muted">{new Date(l.time).toLocaleString('bn-BD')}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function TafsirIndex() {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const list = SURAHS.filter((s) => !q || s.bn.includes(q) || s.en.toLowerCase().includes(q.toLowerCase()) || String(s.n) === q);
  return (
    <div>
      <PageHeader back title="তাফসীর" />
      <div className="p-4">
        <p className="mb-3 rounded-2xl bg-chip p-4 text-sm text-ink">সূরা নির্বাচন করুন, তারপর যেকোনো আয়াতের নিচে "তাফসীর দেখুন" চাপুন। তাফসীরে আহসানুল বায়ান, আবু বকর যাকারিয়া, ইবনে কাসীর ও ফাতহুল মাজীদ (ইন্টারনেট প্রয়োজন)।</p>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="সূরা খুঁজুন" className="input" />
      </div>
      <div className="bg-surface">{list.map((s) => <SurahRow key={s.n} s={s} onClick={() => nav(`/quran/${s.n}?mode=tafsir`)} />)}</div>
    </div>
  );
}
