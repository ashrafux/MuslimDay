import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Bookmark, FileText, Search, Settings } from 'lucide-react';
import { PageHeader, Segmented } from '../components/ui';
import { useT } from '../lib/i18n';
import { useStore } from '../store/useStore';
import { QUICK_LINKS, SURAHS } from '../lib/quran';
import { juzStarts } from '../data/surahMeta';
import { n } from '../lib/bn';

export function MakkiIcon({ meccan }: { meccan: boolean }) {
  return meccan ? (
    <svg width="21" height="18" viewBox="0 0 26 22" className="text-muted"><path d="M2 6l11-4 11 4v12l-11 4-11-4z" fill="currentColor" /><path d="M2 9l11 4 11-4" stroke="rgb(var(--surface))" strokeWidth="1.6" fill="none" /></svg>
  ) : (
    <svg width="21" height="19" viewBox="0 0 26 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted"><path d="M3 22h20M6 22V12c0-3 3-5 6-6 3 1 6 3 6 6v10M17 22V4l2-2 2 2v18M12 6V3" /></svg>
  );
}

export function SurahRow({ s, onClick, right }: { s: (typeof SURAHS)[number]; onClick: () => void; right?: React.ReactNode }) {
  const t = useT();
  return (
    <button onClick={onClick} className="flex h-[88px] w-full items-center gap-4 border-b border-line px-4 text-left transition active:bg-bg">
      <span className="flex h-[47px] w-[47px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-brand text-[16px] text-ink">{n(s.n)}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[19px] text-ink">{t('surah')} {s.bn}</span>
        <span className="mt-0.5 flex items-center gap-2 text-[14px] text-ink/80">
          <MakkiIcon meccan={s.meccan} /> {s.meccan ? t('makki') : t('madani')} • {n(s.verses)} {t('ayat')}
        </span>
      </span>
      {right ?? <span className="font-ar text-[29px] leading-none text-brand" dir="rtl">{s.arabic}</span>}
    </button>
  );
}

export default function Quran() {
  const t = useT();
  const nav = useNavigate();
  const lastRead = useStore((s) => s.lastRead);
  const [tab, setTab] = useState<'surah' | 'para'>('surah');

  const tiles = [
    { label: t('tilawat'), icon: <BookOpen size={28} strokeWidth={1.5} />, go: () => nav(lastRead[0] ? `/quran/${lastRead[0].surah}?ayah=${lastRead[0].ayah}` : '/quran/1') },
    { label: t('tafsir'), icon: <FileText size={26} strokeWidth={1.8} />, go: () => nav('/tafsir') },
    { label: t('search'), icon: <Search size={26} strokeWidth={2.4} />, go: () => nav('/quran/search') },
    { label: t('bookmarks'), icon: <Bookmark size={24} fill="currentColor" />, go: () => nav('/quran/bookmarks') },
  ];

  return (
    <div>
      <PageHeader title={t('quran')} right={<button aria-label="settings" onClick={() => nav('/quran/settings')} className="tap p-2 text-ink"><Settings size={26} fill="currentColor" stroke="rgb(var(--surface))" strokeWidth={1.5} /></button>} />
      <section className="bg-bg pb-5 pt-7">
        <div className="grid grid-cols-4 px-4">
          {tiles.map((x) => (
            <button key={x.label} onClick={x.go} className="tap flex flex-col items-center gap-2.5">
              <span className="flex h-[60px] w-[60px] items-center justify-center rounded-[18px] bg-chip text-brand">{x.icon}</span>
              <span className="text-[14px] text-ink">{x.label}</span>
            </button>
          ))}
        </div>

        {lastRead.length > 0 && (
          <>
            <h2 className="mt-7 px-5 text-[20px] text-ink">{t('lastRead')}</h2>
            <div className="no-scrollbar mt-3 flex gap-2.5 overflow-x-auto px-5">
              {lastRead.slice(0, 4).map((l) => (
                <button key={l.surah} onClick={() => nav(`/quran/${l.surah}?ayah=${l.ayah}`)} className="tap h-[49px] shrink-0 rounded-[14px] bg-chip px-5 text-brand">
                  <span className="text-[16.5px]">সূরা {SURAHS[l.surah - 1].bn}</span> <span className="text-[12px]">আয়াত {n(l.ayah)}</span>
                </button>
              ))}
            </div>
          </>
        )}

        <h2 className="mt-5 px-5 text-[20px] text-ink">{t('quickLinks')}</h2>
        <div className="no-scrollbar mt-3 flex gap-2.5 overflow-x-auto px-5">
          {QUICK_LINKS.map((q) => (
            <button key={q.label} onClick={() => nav(`/quran/${q.surah}?ayah=${q.ayah}`)} className="tap h-[49px] shrink-0 rounded-[14px] bg-chip px-5 text-[16.5px] text-brand">{q.label}</button>
          ))}
        </div>
      </section>

      <section className="bg-surface">
        <div className="px-5 pb-3 pt-6">
          <Segmented value={tab} onChange={setTab} options={[{ value: 'surah', label: <span className="text-[18px]">{t('surahs')}</span> }, { value: 'para', label: <span className="text-[18px]">{t('para')}</span> }]} />
        </div>
        {tab === 'surah'
          ? SURAHS.map((s) => <SurahRow key={s.n} s={s} onClick={() => nav(`/quran/${s.n}`)} />)
          : juzStarts.map((j) => (
            <button key={j.juz} onClick={() => nav(`/quran/${j.surah}?ayah=${j.ayah}`)} className="flex h-[88px] w-full items-center gap-4 border-b border-line px-4 text-left active:bg-bg">
              <span className="flex h-[47px] w-[47px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-brand text-[16px] text-ink">{n(j.juz)}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[19px] text-ink">পারা {n(j.juz)}</span>
                <span className="mt-0.5 block text-[14px] text-muted">শুরু: সূরা {SURAHS[j.surah - 1].bn}, আয়াত {n(j.ayah)}</span>
              </span>
              <span className="font-ar text-[24px] text-brand" dir="rtl">{j.name}</span>
            </button>
          ))}
      </section>
    </div>
  );
}
