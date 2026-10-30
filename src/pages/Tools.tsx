import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, BookOpen, CalendarDays, ListChecks, Award, Scale } from 'lucide-react';
import { PageHeader, CrownBadge, NewDot, ProgressRing } from '../components/ui';
import { usePremiumNav } from '../components/Layout';
import {
  AllahIcon, HadithBookIcon, HandsIcon, RuqyahIcon, QiblaIcon, TasbihIcon, MosquePinIcon, ZakatIcon, PlayLayersIcon, KaabaPinIcon, SilentIcon, CrescentLanternIcon,
} from '../components/icons';
import { useT } from '../lib/i18n';
import { useStore } from '../store/useStore';
import { n } from '../lib/bn';
import { useAmolProgress } from '../lib/amol';

interface Item { label: string; icon: ReactNode; to: string; premium?: boolean; dot?: boolean }

function Grid({ items }: { items: Item[] }) {
  const go = usePremiumNav();
  const premium = useStore((s) => s.premium.active);
  return (
    <div className="grid grid-cols-4 gap-x-1 gap-y-5">
      {items.map((it) => (
        <button key={it.label} onClick={() => go(it.to, it.premium)} className="tap flex flex-col items-center gap-2.5">
          <span className="relative">
            <span className="icon-circle h-[82px] w-[82px]">{it.icon}</span>
            {it.premium && !premium && <CrownBadge className="absolute -right-1 top-0" />}
            {it.dot && <NewDot className="absolute -left-1 top-0" />}
          </span>
          <span className="whitespace-nowrap text-center text-[14px] leading-tight text-ink">{it.label}</span>
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
    { label: 'কুরআন', icon: <BookOpen size={34} strokeWidth={1.6} />, to: '/quran' },
    { label: t('asmaulHusna'), icon: <AllahIcon size={40} />, to: '/asmaul-husna' },
    { label: t('hadith'), icon: <HadithBookIcon size={40} />, to: '/hadith' },
    { label: t('duaShort'), icon: <HandsIcon size={42} strokeWidth={1.4} />, to: '/dua' },
    { label: t('ruqyah'), icon: <RuqyahIcon size={34} />, to: '/ruqyah', dot: true },
  ];
  const tools: Item[] = [
    { label: t('qibla'), icon: <QiblaIcon size={42} />, to: '/qibla', premium: true },
    { label: t('tasbih'), icon: <TasbihIcon size={44} />, to: '/tasbih', premium: true, dot: true },
    { label: t('nearbyMosque'), icon: <MosquePinIcon size={42} />, to: '/mosques' },
    { label: t('calendar'), icon: <CalendarDays size={42} strokeWidth={1.8} />, to: '/calendar' },
    { label: t('zakat'), icon: <ZakatIcon size={42} />, to: '/zakat' },
    { label: t('audioQuran'), icon: <PlayLayersIcon size={42} />, to: '/audio' },
    { label: t('hajjUmrah'), icon: <KaabaPinIcon size={42} />, to: '/hajj', premium: true },
    { label: t('silentMode'), icon: <SilentIcon size={42} />, to: '/silent', premium: true },
  ];
  const extra: Item[] = [
    { label: t('ramadan'), icon: <CrescentLanternIcon size={40} />, to: '/ramadan', dot: true },
    { label: t('qaza'), icon: <Award size={38} strokeWidth={1.6} />, to: '/qaza', dot: true },
    { label: t('stats'), icon: <ListChecks size={38} strokeWidth={1.6} />, to: '/amol?tab=stats' },
    { label: 'হিজরি কনভার্টার', icon: <Scale size={38} strokeWidth={1.6} />, to: '/calendar?convert=1' },
  ];

  return (
    <div>
      <PageHeader title={t('tools')} />
      <div className="h-2.5" />
      <button onClick={() => nav('/amol')} className="flex h-[103px] w-full items-center gap-5 border-y border-line bg-surface px-5 text-left">
        <ProgressRing value={pct / 100} size={63} stroke={5}>
          <span className="text-[16px] text-ink">{n(pct)}%</span>
        </ProgressRing>
        <span className="flex-1">
          <span className="block text-[17.5px] text-ink">{t('trackToday')}</span>
          <span className="mt-2 inline-block rounded-lg bg-amber-100 px-3 py-0.5 text-[14px] text-alert dark:bg-amber-900/40">{n(done)}/{n(total)}</span>
        </span>
        <ChevronRight size={24} className="text-ink" />
      </button>

      <section className="mt-2.5 border-y border-line bg-surface px-5 pb-6 pt-5">
        <h2 className="mb-5 text-[20px] text-ink">{t('essentialIlm')}</h2>
        <Grid items={ilm} />
      </section>

      <section className="mt-2.5 border-y border-line bg-surface px-5 pb-6 pt-5">
        <h2 className="mb-5 text-[20px] text-ink">{t('tools')}</h2>
        <Grid items={tools} />
      </section>

      <section className="mt-2.5 border-y border-line bg-surface px-5 pb-6 pt-5">
        <h2 className="mb-1 text-[20px] text-ink">নতুন ফিচার</h2>
        <p className="mb-6 text-sm text-muted">রোজা ট্র্যাকার, কাযা নামাজের হিসাব, আমলের পরিসংখ্যান ও হিজরি তারিখ রূপান্তর</p>
        <Grid items={extra} />
      </section>
    </div>
  );
}
