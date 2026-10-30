import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, CalendarDays, ListChecks, Award, Scale } from 'lucide-react';
import { PageHeader, CrownBadge, NewDot, ProgressRing, pastel } from '../components/ui';
import { usePremiumNav } from '../components/Layout';
import {
  AllahIcon, HadithBookIcon, HandsIcon, RuqyahIcon, QiblaIcon, TasbihIcon, MosquePinIcon, ZakatIcon, PlayLayersIcon, KaabaPinIcon, SilentIcon, CrescentLanternIcon,
} from '../components/icons';
import { useT } from '../lib/i18n';
import { useStore } from '../store/useStore';
import { n } from '../lib/bn';
import { useAmolProgress } from '../lib/amol';

interface Item { label: string; icon: ReactNode; to: string; premium?: boolean; dot?: boolean }

function Grid({ items, offset = 0 }: { items: Item[]; offset?: number }) {
  const go = usePremiumNav();
  const premium = useStore((s) => s.premium.active);
  return (
    <div className="grid grid-cols-4 gap-x-1 gap-y-4">
      {items.map((it, i) => (
        <button key={it.label} onClick={() => go(it.to, it.premium)} className="tap flex flex-col items-center gap-2">
          <span className="relative">
            <span className={`tile h-[66px] w-[66px] rounded-[10px] text-ink ${pastel(i + offset)}`}>{it.icon}</span>
            {it.premium && !premium && <CrownBadge className="absolute -right-1.5 -top-1.5" />}
            {it.dot && <NewDot className="absolute -left-0.5 -top-0.5" />}
          </span>
          <span className="whitespace-nowrap text-center text-[12.5px] font-medium leading-tight text-ink">{it.label}</span>
        </button>
      ))}
    </div>
  );
}

export default function Tools() {
  const t = useT();
  const nav = useNavigate();
  const { done, total } = useAmolProgress();
  const pct = Math.round((done / total) * 100);

  const ilm: Item[] = [
    { label: 'কুরআন', icon: <BookOpen size={27} strokeWidth={1.6} />, to: '/quran' },
    { label: t('asmaulHusna'), icon: <AllahIcon size={31} />, to: '/asmaul-husna' },
    { label: t('hadith'), icon: <HadithBookIcon size={31} />, to: '/hadith' },
    { label: t('duaShort'), icon: <HandsIcon size={33} strokeWidth={1.4} />, to: '/dua' },
    { label: t('ruqyah'), icon: <RuqyahIcon size={27} />, to: '/ruqyah', dot: true },
  ];
  const tools: Item[] = [
    { label: t('qibla'), icon: <QiblaIcon size={33} />, to: '/qibla', premium: true },
    { label: t('tasbih'), icon: <TasbihIcon size={34} />, to: '/tasbih', premium: true, dot: true },
    { label: t('nearbyMosque'), icon: <MosquePinIcon size={33} />, to: '/mosques' },
    { label: t('calendar'), icon: <CalendarDays size={33} strokeWidth={1.8} />, to: '/calendar' },
    { label: t('zakat'), icon: <ZakatIcon size={33} />, to: '/zakat' },
    { label: t('audioQuran'), icon: <PlayLayersIcon size={33} />, to: '/audio' },
    { label: t('hajjUmrah'), icon: <KaabaPinIcon size={33} />, to: '/hajj', premium: true },
    { label: t('silentMode'), icon: <SilentIcon size={33} />, to: '/silent', premium: true },
  ];
  const extra: Item[] = [
    { label: t('ramadan'), icon: <CrescentLanternIcon size={31} />, to: '/ramadan', dot: true },
    { label: t('qaza'), icon: <Award size={30} strokeWidth={1.6} />, to: '/qaza', dot: true },
    { label: t('stats'), icon: <ListChecks size={30} strokeWidth={1.6} />, to: '/amol?tab=stats' },
    { label: 'হিজরি কনভার্টার', icon: <Scale size={30} strokeWidth={1.6} />, to: '/calendar?convert=1' },
  ];

  return (
    <div>
      <PageHeader title={t('tools')} />
      <button onClick={() => nav('/amol')} className="tap mx-5 mt-2 flex w-[calc(100%-2.5rem)] flex-col rounded-[10px] p-5 text-left text-white"
        style={{ background: 'radial-gradient(90% 80% at 100% 0%, #22a05833 0%, #22a05800 70%), linear-gradient(160deg, #1d1e23 0%, #23242a 55%, #2a2b33 100%)' }}>
        <span className="block text-[20px] font-bold leading-snug">{t('trackToday')}</span>
        <span className="mt-4 flex w-full items-end justify-between">
          <span className="flex items-baseline gap-2">
            <span className="text-[42px] font-extrabold leading-none">{n(pct)}%</span>
            <span className="text-[14px] font-semibold text-white/60">{n(done)}/{n(total)} সম্পন্ন</span>
          </span>
          <ProgressRing value={pct / 100} size={52} stroke={6} track="rgb(255 255 255 / .15)" color="rgb(var(--success))" />
        </span>
      </button>

      <div className="section-head"><span>{t('essentialIlm')}</span></div>
      <section className="page-card px-3 py-5">
        <Grid items={ilm} />
      </section>

      <div className="section-head"><span>{t('tools')}</span></div>
      <section className="page-card px-3 py-5">
        <Grid items={tools} offset={2} />
      </section>

      <div className="section-head flex-col !items-start gap-0.5">
        <span>নতুন ফিচার</span>
        <span className="text-[13px] font-normal text-muted">রোজা ট্র্যাকার, কাযা নামাজের হিসাব, আমলের পরিসংখ্যান ও হিজরি তারিখ রূপান্তর</span>
      </div>
      <section className="page-card px-3 py-5">
        <Grid items={extra} offset={4} />
      </section>
    </div>
  );
}
