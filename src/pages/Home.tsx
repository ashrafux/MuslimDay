import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, CalendarDays, ChevronDown, ChevronRight, MapPin, Share2, Sunrise, Sun, SunDim, CloudSun, MoonStar, Sunset, Award, BookOpenText, ListChecks, BadgeCheck,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { useCurrentPeriod, useNow } from '../lib/hooks';
import { useT, type TKey } from '../lib/i18n';
import { formatDuration, n } from '../lib/bn';
import { formatBangla, formatGregorian, formatHijri, toHijri, WEEKDAYS_BN, WEEKDAYS_EN } from '../lib/dates';
import { fmtTime, type PeriodId, type PrayerId, type Waqt } from '../lib/prayer';
import { LocationSheet } from '../components/LocationSheet';
import { QiblaIcon, TasbihIcon, ZakatIcon, CrescentLanternIcon, HadithBookIcon } from '../components/icons';
import { IconButton, Sheet, pastel, shareText } from '../components/ui';
import { usePremiumNav } from '../components/Layout';
import { dailyAyat } from '../data/dailyContent';
import { useAmolProgress } from '../lib/amol';

const PRAYER_ICON: Record<PrayerId, JSX.Element> = {
  fajr: <Sunrise size={20} strokeWidth={2} />,
  dhuhr: <Sun size={20} strokeWidth={2} />,
  asr: <SunDim size={20} strokeWidth={2} />,
  maghrib: <CloudSun size={20} strokeWidth={2} />,
  isha: <MoonStar size={19} strokeWidth={2} />,
};
const PRAYER_TINT: Record<PrayerId, string> = { fajr: 'bg-sky', dhuhr: 'bg-butter', asr: 'bg-sand', maghrib: 'bg-rose', isha: 'bg-lav' };

const SUNNAH: Record<PrayerId, string> = {
  fajr: '২ রাকাত সুন্নাত (মুয়াক্কাদা) + ২ রাকাত ফরজ',
  dhuhr: '৪ রাকাত সুন্নাত + ৪ রাকাত ফরজ + ২ রাকাত সুন্নাত',
  asr: '৪ রাকাত সুন্নাত (গাইরে মুয়াক্কাদা) + ৪ রাকাত ফরজ',
  maghrib: '৩ রাকাত ফরজ + ২ রাকাত সুন্নাত',
  isha: '৪ রাকাত ফরজ + ২ রাকাত সুন্নাত + ৩ রাকাত বিতর',
};

/** Dark hero card; a soft glow in the corner still follows the time of day. */
const HERO_GLOW: Record<PeriodId, string> = {
  tahajjud: '#4b3f86', isha: '#3b4f9a', fajr: '#6f86d6', sunrise: '#f2c14e', duha: '#f2c14e',
  zawal: '#f0a35e', dhuhr: '#f0a35e', asr: '#ee8a78', maghrib: '#c27fb7',
};
function heroStyle(id: PeriodId): { bg: string; night: boolean } {
  const glow = HERO_GLOW[id];
  return {
    bg: `radial-gradient(90% 70% at 100% 0%, ${glow}59 0%, ${glow}00 70%), radial-gradient(70% 60% at 0% 100%, #5ba8e826 0%, #5ba8e800 70%), linear-gradient(160deg, #1d1e23 0%, #23242a 55%, #2a2b33 100%)`,
    night: id === 'isha' || id === 'tahajjud',
  };
}

/** Decorative wave lines (as in the call-screen reference). */
function Waves() {
  const lines = Array.from({ length: 9 }, (_, i) => i);
  return (
    <svg viewBox="0 0 400 120" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 top-16 h-32 w-full opacity-[.14]" aria-hidden="true">
      {lines.map((i) => (
        <path key={i} d={`M0 ${60 + i * 2} C 80 ${10 + i * 6}, 140 ${110 - i * 5}, 220 ${55 + i} S 340 ${15 + i * 7}, 400 ${60 - i * 2}`} fill="none" stroke="white" strokeWidth="0.8" />
      ))}
    </svg>
  );
}

function Arc({ progress }: { progress: number }) {
  // ~220° arc open at the bottom, like the original.
  const W = 220, H = 150, r = 95, cx = 110, cy = 105;
  const startDeg = 160, sweep = 220;
  const pt = (deg: number) => {
    const a = (deg * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const arcPath = (from: number, to: number) => {
    const [x1, y1] = pt(from);
    const [x2, y2] = pt(to);
    const large = to - from > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };
  const end = startDeg + Math.max(0.5, sweep * Math.min(1, progress));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="absolute inset-0 overflow-visible">
      <defs>
        <linearGradient id="hero-arc" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#f2c14e" />
          <stop offset="45%" stopColor="#ee8a78" />
          <stop offset="75%" stopColor="#9f8fd8" />
          <stop offset="100%" stopColor="#5ba8e8" />
        </linearGradient>
      </defs>
      <path d={arcPath(startDeg, startDeg + sweep)} stroke="rgba(255,255,255,.1)" strokeWidth="10" fill="none" strokeLinecap="round" />
      <path d={arcPath(startDeg, end)} stroke="url(#hero-arc)" strokeWidth="10" fill="none" strokeLinecap="round" style={{ transition: 'all .6s' }} />
    </svg>
  );
}

function periodLabel(id: PeriodId, isFriday: boolean, t: (k: TKey) => string) {
  if (id === 'dhuhr' && isFriday) return t('jumuah');
  if (id === 'sunrise') return t('sunriseForbidden');
  return t(id as TKey);
}

export default function Home() {
  const t = useT();
  const nav = useNavigate();
  const pnav = usePremiumNav();
  const now = useNow(1000);
  const { today, times, waqts, period } = useCurrentPeriod(now);
  const { place, lang, hijriAdjust, time24 } = useStore((s) => s.settings);
  const unread = useStore((s) => s.notifications.filter((x) => !x.read).length);
  const [locOpen, setLocOpen] = useState(false);
  const [detail, setDetail] = useState<Waqt | null>(null);

  const isFriday = today.getDay() === 5;
  const hijri = toHijri(today, hijriAdjust);
  const hero = heroStyle(period.id);
  const total = period.end.getTime() - period.start.getTime();
  const progress = (now.getTime() - period.start.getTime()) / total;
  const fmt = (d: Date) => fmtTime(d, place.tz, time24);

  const nextId = waqts.find((w) => now < w.start)?.id;
  const currentWaqt = waqts.find((w) => now >= w.start && now <= w.end)?.id;


  return (
    <div className="pb-2">
      {/* ---------- greeting / date ---------- */}
      <div className="flex items-start justify-between gap-3 px-5 pb-1 pt-5">
        <button onClick={() => nav('/calendar')} className="tap min-w-0 text-left">
          <div className="label">{(lang === 'bn' ? WEEKDAYS_BN : WEEKDAYS_EN)[today.getDay()]} • {formatHijri(hijri, lang)}</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[28px] font-extrabold leading-none text-ink">{formatGregorian(today, lang)}</span>
            {lang === 'bn' && <span className="truncate text-[14px] font-medium text-muted">{formatBangla(today)}</span>}
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          <span className="relative">
            <IconButton label="notifications" tone="brand" onClick={() => nav('/notifications')}><Bell size={18} /></IconButton>
            {unread > 0 && (
              <span className="absolute -right-1.5 -top-1.5 min-w-[20px] rounded-full border-2 border-bg bg-alert px-1 text-center text-[10px] font-bold leading-4 text-white">
                {unread > 99 ? `${n(99)}+` : n(unread)}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* ---------- hero ---------- */}
      <section className="relative mx-4 mt-4 overflow-hidden rounded-[32px] px-5 pb-5 pt-4 text-white dark:ring-1 dark:ring-white/[.06]" style={{ background: hero.bg }}>
        <Waves />
        {hero.night && [12, 30, 70, 85, 50, 92].map((x, i) => <span key={i} className="absolute h-1 w-1 rounded-full bg-white/40" style={{ left: `${x}%`, top: `${18 + i * 19}px` }} />)}
        <div className="relative flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-white"><span className="h-1.5 w-1.5 rounded-full bg-m-green" />{now >= period.start ? 'এখন চলছে' : 'পরবর্তী'}</span>
          <button onClick={() => setLocOpen(true)} className="tap flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-3 ring-1 ring-white/10">
            <MapPin size={15} />
            <span className="max-w-[110px] truncate text-[13px] font-semibold">{lang === 'bn' && place.country === 'INTL' ? place.bn : place.name}</span>
            <ChevronDown size={14} />
          </button>
        </div>

        <div className="relative mx-auto mt-3 h-[150px] w-[220px]">
          <Arc progress={progress} />
          <div className="absolute inset-x-0 top-[36px] text-center">
            <div className="text-[22px] font-bold leading-tight">{periodLabel(period.id, isFriday, t)}</div>
            <div className="mt-1 text-[12px] font-medium uppercase tracking-[.08em] text-white/60">{t('remaining')}</div>
            <div className="mt-1 text-[32px] font-extrabold tabular-nums">{formatDuration(period.end.getTime() - now.getTime())}</div>
          </div>
        </div>

        <div className="relative mt-1 grid grid-cols-2 gap-2.5">
          <div className="flex items-center gap-2.5 rounded-2xl bg-white/[.07] px-3 py-2.5 ring-1 ring-white/10">
            <Sunrise size={20} className="text-m-yellow" />
            <span><span className="block text-[11px] opacity-85">{t('sunrise')}</span><span className="block text-[15px] font-bold tabular-nums">{fmt(times.sunrise)}</span></span>
          </div>
          <div className="flex items-center gap-2.5 rounded-2xl bg-white/[.07] px-3 py-2.5 ring-1 ring-white/10">
            <Sunset size={20} className="text-[#ee8a78]" />
            <span><span className="block text-[11px] opacity-85">{t('sunset')}</span><span className="block text-[15px] font-bold tabular-nums">{fmt(times.sunset)}</span></span>
          </div>
        </div>
      </section>

      {/* ---------- prayer timeline ---------- */}
      <div className="section-head">
        <span>আজকের নামাজ</span>
        <span className="text-[13px] font-semibold text-muted">{lang === 'bn' ? place.bn : place.name}</span>
      </div>
      <ul className="mx-4 space-y-2.5">
        {waqts.map((w) => {
          const past = now > w.end;
          const active = w.id === currentWaqt || (!currentWaqt && w.id === nextId);
          const label = w.id === 'dhuhr' && isFriday ? t('jumuah') : t(w.id);
          return (
            <li key={w.id}>
              <button onClick={() => setDetail(w)}
                className={`flex w-full items-center gap-3 rounded-[20px] py-2.5 pl-2.5 pr-4 text-left ${active ? 'bg-night text-white' : 'bg-surface text-ink shadow-card'}`}>
                <span className={`tile h-11 w-11 shrink-0 rounded-2xl ${active ? 'bg-white/10 text-white' : `${PRAYER_TINT[w.id]} text-ink`}`}>{PRAYER_ICON[w.id]}</span>
                <span className={`min-w-0 flex-1 text-[16px] font-bold ${past && !active ? 'text-muted' : ''}`}>{label}</span>
                {w.makruh && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-m-yellow" title="মাকরূহ সময় আছে" />}
                <span className={`shrink-0 text-[15px] font-semibold tabular-nums ${active ? 'text-white' : past ? 'text-muted' : 'text-ink'}`}>{fmt(w.start)} - {fmt(w.end)}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mx-4 mt-3 grid grid-cols-2 gap-2.5">
        <button onClick={() => nav('/alarm')} className="tap card flex items-center gap-3 p-3">
          <span className="tile h-10 w-10 rounded-xl bg-butter text-ink"><Bell size={18} /></span>
          <span className="flex-1 text-left text-[15px] font-semibold text-ink">{t('alarm')}</span>
          <ChevronRight size={16} className="text-muted" />
        </button>
        <button onClick={() => nav('/calendar')} className="tap card flex items-center gap-3 p-3">
          <span className="tile h-10 w-10 rounded-xl bg-sky text-ink"><CalendarDays size={18} /></span>
          <span className="flex-1 text-left text-[15px] font-semibold text-ink">{t('calendar')}</span>
          <ChevronRight size={16} className="text-muted" />
        </button>
      </div>

      <Carousel />

      {/* ---------- top features ---------- */}
      <div className="section-head">
        <span className="flex items-center gap-2"><BadgeCheck size={20} /> {t('topFeatures')}</span>
        <button onClick={() => nav('/tools')} className="text-[14px] font-semibold text-brand">{t('seeMore')}</button>
      </div>
      <section className="page-card px-3 py-4">
        <div className="grid grid-cols-4 gap-y-4">
          {[
            { label: t('amolTracker'), icon: <ListChecks size={24} />, go: () => nav('/amol') },
            { label: t('tasbih'), icon: <TasbihIcon size={28} />, go: () => pnav('/tasbih', true) },
            { label: t('qibla'), icon: <QiblaIcon size={28} />, go: () => pnav('/qibla', true) },
            { label: t('ramadan'), icon: <CrescentLanternIcon size={28} />, go: () => nav('/ramadan') },
            { label: t('zakat'), icon: <ZakatIcon size={28} />, go: () => nav('/zakat') },
            { label: t('qaza'), icon: <Award size={24} />, go: () => nav('/qaza') },
            { label: t('hadith'), icon: <HadithBookIcon size={26} />, go: () => nav('/hadith') },
            { label: t('quran'), icon: <BookOpenText size={24} />, go: () => nav('/quran') },
          ].map((f, i) => (
            <button key={f.label} onClick={f.go} className="tap flex flex-col items-center gap-2">
              <span className={`tile h-14 w-14 text-ink ${pastel(i)}`}>{f.icon}</span>
              <span className="text-center text-[12.5px] font-medium leading-tight text-ink">{f.label}</span>
            </button>
          ))}
        </div>
      </section>

      <DailyAyahCard />

      <LocationSheet open={locOpen} onClose={() => setLocOpen(false)} />
      <Sheet open={!!detail} onClose={() => setDetail(null)} title={detail ? (detail.id === 'dhuhr' && isFriday ? t('jumuah') : t(detail.id)) : ''}>
        {detail && (
          <div className="space-y-3 text-ink">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[20px] bg-lav p-4"><div className="label">শুরু</div><div className="mt-1 text-[26px] font-extrabold tabular-nums">{fmt(detail.start)}</div></div>
              <div className="rounded-[20px] bg-sand p-4"><div className="label">শেষ</div><div className="mt-1 text-[26px] font-extrabold tabular-nums">{fmt(detail.end)}</div></div>
            </div>
            <p><span className="text-muted">রাকাত: </span>{SUNNAH[detail.id]}</p>
            {detail.id === 'dhuhr' && isFriday && <p className="text-muted">জুম'আর দিন: ২ রাকাত ফরজ জামাতে, আগে ৪ ও পরে ৪ রাকাত সুন্নাত। সূরা আল কাহফ পড়ুন ও বেশি বেশি দরুদ পাঠ করুন।</p>}
            {detail.makruh && (
              <p className="flex gap-2 rounded-2xl bg-butter p-3 text-ink">
                <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full bg-m-yellow" />
                {detail.makruh.note} ({fmt(detail.makruh.from)} - {fmt(detail.makruh.to)})
              </p>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
}

function Carousel() {
  const nav = useNavigate();
  const premium = useStore((s) => s.premium.active);
  const { done, total } = useAmolProgress();
  const ayah = dailyAyat[Math.floor(Date.now() / 86400000) % dailyAyat.length];
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);

  const cards = useMemo(() => [
    premium
      ? { tint: 'bg-lav', eyebrow: 'পৃষ্ঠপোষক', icon: <BadgeCheck size={22} />, title: 'জাযাকাল্লাহু খাইরান!', body: 'আপনার সহযোগিতায় অ্যাপটি আরও সমৃদ্ধ হচ্ছে।', big: '', go: '/subscribe' }
      : { tint: 'bg-lav', eyebrow: 'বিশেষ অফার', icon: <Award size={22} />, title: 'আগামী ৩ দিন ৬৩% পর্যন্ত ডিসকাউন্ট', body: 'বার্ষিক প্যাকেজে প্রযোজ্য — আরো আপন হোক আপনার ইবাদতের সঙ্গী।', big: `${n(63)}%`, go: '/subscribe' },
    { tint: 'bg-sand', eyebrow: 'আজকের আমল', icon: <ListChecks size={22} />, title: 'আমল ট্র্যাকার', body: 'নিয়মিত আমলের হিসাব রাখুন ও স্ট্রিক ধরে রাখুন।', big: `${n(done)}/${n(total)}`, go: '/amol' },
    { tint: 'bg-mint', eyebrow: 'আজকের আয়াত', icon: <BookOpenText size={22} />, title: ayah.ref, body: ayah.bangla, big: '', go: `/quran/${ayah.surah}?ayah=${ayah.ayah}` },
  ], [premium, done, total, ayah]);

  useEffect(() => {
    const id = setInterval(() => {
      const el = ref.current;
      if (!el) return;
      const next = (idx + 1) % cards.length;
      el.scrollTo({ left: next * el.clientWidth * 0.86, behavior: 'smooth' });
    }, 6000);
    return () => clearInterval(id);
  }, [idx, cards.length]);

  return (
    <section className="pt-5">
      <div ref={ref} onScroll={(e) => setIdx(Math.round(e.currentTarget.scrollLeft / (e.currentTarget.clientWidth * 0.86)))}
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-4">
        {cards.map((c, i) => (
          <button key={i} onClick={() => nav(c.go)} className={`flex min-h-[168px] w-[86%] shrink-0 snap-center flex-col rounded-[28px] p-5 text-left text-ink ${c.tint}`}>
            <span className="flex w-full items-center justify-between">
              <span className="label !text-ink/60">{c.eyebrow}</span>
              <span className="tile h-9 w-9 rounded-xl bg-white/70">{c.icon}</span>
            </span>
            <span className="mt-2 line-clamp-2 block text-[19px] font-bold leading-snug">{c.title}</span>
            <span className="mt-1 line-clamp-2 block text-[13px] leading-snug text-ink/70">{c.body}</span>
            {c.big && <span className="mt-auto pt-2 text-[34px] font-extrabold leading-none">{c.big}</span>}
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-center gap-1.5">
        {cards.map((_, i) => <span key={i} className={`h-2 rounded-full transition-all ${i === idx ? 'w-6 bg-night' : 'w-2 bg-line'}`} />)}
      </div>
    </section>
  );
}

function DailyAyahCard() {
  const nav = useNavigate();
  const ayah = dailyAyat[(Math.floor(Date.now() / 86400000) + 7) % dailyAyat.length];
  return (
    <section className="mx-4 mt-6 rounded-[28px] bg-night p-5 text-white shadow-float">
      <div className="flex items-center justify-between">
        <span className="label !text-white/60">আজকের অনুপ্রেরণা</span>
        <button aria-label="share ayah" onClick={() => shareText('আজকের আয়াত', `${ayah.arabic}\n\n${ayah.bangla}\n— ${ayah.ref}`)} className="tap flex h-9 w-9 items-center justify-center rounded-xl bg-white/10"><Share2 size={16} /></button>
      </div>
      <button onClick={() => nav(`/quran/${ayah.surah}?ayah=${ayah.ayah}`)} className="mt-3 w-full text-left">
        <p className="arabic text-right text-[24px]">{ayah.arabic}</p>
        <p className="mt-3 text-[15px] leading-relaxed text-white/85">{ayah.bangla}</p>
        <p className="mt-3 text-[13px] font-semibold text-gold">{ayah.ref}</p>
      </button>
    </section>
  );
}
