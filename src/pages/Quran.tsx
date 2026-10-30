import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Bookmark, FileText, Search, Settings } from 'lucide-react';
import { IconButton, PageHeader, Segmented, pastel } from '../components/ui';
import { useT } from '../lib/i18n';
import { useStore } from '../store/useStore';
import { QUICK_LINKS, SURAHS } from '../lib/quran';
import { juzStarts } from '../data/surahMeta';
import { n } from '../lib/bn';

export function MakkiIcon({ meccan }: { meccan: boolean }) {
  return meccan ? (
    <svg width="17" height="15" viewBox="0 0 26 22" className="text-muted"><path d="M2 6l11-4 11 4v12l-11 4-11-4z" fill="currentColor" /><path d="M2 9l11 4 11-4" stroke="rgb(var(--surface))" strokeWidth="1.6" fill="none" /></svg>
  ) : (
    <svg width="17" height="16" viewBox="0 0 26 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted"><path d="M3 22h20M6 22V12c0-3 3-5 6-6 3 1 6 3 6 6v10M17 22V4l2-2 2 2v18M12 6V3" /></svg>
  );
}

export function SurahRow({ s, onClick, right }: { s: (typeof SURAHS)[number]; onClick: () => void; right?: React.ReactNode }) {
  const t = useT();
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3.5 border-b border-line px-4 py-3.5 text-left transition last:border-0 active:bg-bg">
      <span className={`tile h-12 w-12 shrink-0 rounded-2xl text-[15px] font-bold text-ink ${pastel(s.n)}`}>{n(s.n)}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[16.5px] font-bold text-ink">{t('surah')} {s.bn}</span>
        <span className="mt-0.5 flex items-center gap-1.5 text-[13px] text-muted">
          <MakkiIcon meccan={s.meccan} /> {s.meccan ? t('makki') : t('madani')} • {n(s.verses)} {t('ayat')}
        </span>
      </span>
      {right ?? <span className="font-ar text-[26px] leading-none text-brand" dir="rtl">{s.arabic}</span>}
    </button>
  );
}

export default function Quran() {
  const t = useT();
  const nav = useNavigate();
  const lastRead = useStore((s) => s.lastRead);
  const [tab, setTab] = useState<'surah' | 'para'>('surah');

  const tiles = [
    { label: t('tilawat'), tint: 'bg-lav', icon: <BookOpen size={24} strokeWidth={1.8} />, go: () => nav(lastRead[0] ? `/quran/${lastRead[0].surah}?ayah=${lastRead[0].ayah}` : '/quran/1') },
    { label: t('tafsir'), tint: 'bg-sand', icon: <FileText size={23} strokeWidth={1.8} />, go: () => nav('/tafsir') },
    { label: t('search'), tint: 'bg-sky', icon: <Search size={23} strokeWidth={2.2} />, go: () => nav('/quran/search') },
    { label: t('bookmarks'), tint: 'bg-rose', icon: <Bookmark size={22} strokeWidth={2} />, go: () => nav('/quran/bookmarks') },
  ];

  return (
    <div>
      <PageHeader title={t('quran')} right={<IconButton label="settings" onClick={() => nav('/quran/settings')}><Settings size={19} /></IconButton>} />
      <section className="page-card mt-2 grid grid-cols-4 px-2 py-4">
        {tiles.map((x) => (
          <button key={x.label} onClick={x.go} className="tap flex flex-col items-center gap-2">
            <span className={`tile h-14 w-14 text-ink ${x.tint}`}>{x.icon}</span>
            <span className="text-[12.5px] font-medium text-ink">{x.label}</span>
          </button>
        ))}
      </section>

      {lastRead.length > 0 && (
        <>
          <div className="section-head"><span>{t('lastRead')}</span></div>
          <div className="no-scrollbar flex gap-2.5 overflow-x-auto px-4">
            {lastRead.slice(0, 4).map((l, i) => (
              <button key={l.surah} onClick={() => nav(`/quran/${l.surah}?ayah=${l.ayah}`)}
                className={`tap flex min-w-[150px] shrink-0 flex-col items-start rounded-[22px] p-4 text-left text-ink ${i === 0 ? 'bg-night text-white' : 'bg-surface shadow-card'}`}>
                <span className={`label ${i === 0 ? '!text-white/60' : ''}`}>আয়াত {n(l.ayah)}</span>
                <span className="mt-1 text-[16px] font-bold">সূরা {SURAHS[l.surah - 1].bn}</span>
              </button>
            ))}
          </div>
        </>
      )}

      <div className="section-head"><span>{t('quickLinks')}</span></div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4">
        {QUICK_LINKS.map((q) => (
          <button key={q.label} onClick={() => nav(`/quran/${q.surah}?ayah=${q.ayah}`)} className="tap pill pill-off shrink-0 py-2.5 font-semibold">{q.label}</button>
        ))}
      </div>

      <div className="px-4 pb-3 pt-6">
        <Segmented value={tab} onChange={setTab} options={[{ value: 'surah', label: t('surahs') }, { value: 'para', label: t('para') }]} />
      </div>
      <section className="page-card">
        {tab === 'surah'
          ? SURAHS.map((s) => <SurahRow key={s.n} s={s} onClick={() => nav(`/quran/${s.n}`)} />)
          : juzStarts.map((j) => (
            <button key={j.juz} onClick={() => nav(`/quran/${j.surah}?ayah=${j.ayah}`)} className="flex w-full items-center gap-3.5 border-b border-line px-4 py-3.5 text-left last:border-0 active:bg-bg">
              <span className={`tile h-12 w-12 shrink-0 rounded-2xl text-[15px] font-bold text-ink ${pastel(j.juz)}`}>{n(j.juz)}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[16.5px] font-bold text-ink">পারা {n(j.juz)}</span>
                <span className="mt-0.5 block text-[13px] text-muted">শুরু: সূরা {SURAHS[j.surah - 1].bn}, আয়াত {n(j.ayah)}</span>
              </span>
              <span className="font-ar text-[22px] text-brand" dir="rtl">{j.name}</span>
            </button>
          ))}
      </section>
    </div>
  );
}
