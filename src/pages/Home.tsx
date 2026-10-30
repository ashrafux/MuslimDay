import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, CalendarDays, Check, ChevronDown, MapPin, Share2, Sunrise, Sun, SunDim, CloudSun, MoonStar, Sunset, Award, BookOpenText, ListChecks, BadgeCheck,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { useCurrentPeriod, useNow } from '../lib/hooks';
import { useT, type TKey } from '../lib/i18n';
import { dateKey, formatDuration, n } from '../lib/bn';
import { formatBangla, formatGregorian, formatHijri, toHijri, WEEKDAYS_BN, WEEKDAYS_EN } from '../lib/dates';
import { fmtTime, type PeriodId, type PrayerId, type Waqt } from '../lib/prayer';
import { LocationSheet } from '../components/LocationSheet';
import { MosqueArt, QiblaIcon, TasbihIcon, ZakatIcon, CrescentLanternIcon, HadithBookIcon } from '../components/icons';
import { Sheet, shareText, toast } from '../components/ui';
import { usePremiumNav } from '../components/Layout';
import { dailyAyat } from '../data/dailyContent';
import { useAmolProgress } from './AmolTracker';

const PRAYER_ICON: Record<PrayerId, JSX.Element> = {
  fajr: <Sunrise size={28} strokeWidth={1.7} />,
  dhuhr: <Sun size={28} strokeWidth={2.2} fill="currentColor" />,
  asr: <SunDim size={28} strokeWidth={2} fill="currentColor" />,
  maghrib: <CloudSun size={28} strokeWidth={1.7} fill="currentColor" />,
  isha: <MoonStar size={26} strokeWidth={1.7} fill="currentColor" />,
};

const SUNNAH: Record<PrayerId, string> = {
  fajr: '২ রাকাত সুন্নাত (মুয়াক্কাদা) + ২ রাকাত ফরজ',
  dhuhr: '৪ রাকাত সুন্নাত + ৪ রাকাত ফরজ + ২ রাকাত সুন্নাত',
  asr: '৪ রাকাত সুন্নাত (গাইরে মুয়াক্কাদা) + ৪ রাকাত ফরজ',
  maghrib: '৩ রাকাত ফরজ + ২ রাকাত সুন্নাত',
  isha: '৪ রাকাত ফরজ + ২ রাকাত সুন্নাত + ৩ রাকাত বিতর',
};

function heroStyle(id: PeriodId): { bg: string; dark: boolean } {
  switch (id) {
    case 'tahajjud': return { bg: 'linear-gradient(160deg,#1e2a4a 0%,#2e3b6b 55%,#4b4f8a 100%)', dark: true };
    case 'isha': return { bg: 'linear-gradient(160deg,#162238 0%,#243a5e 60%,#3a4f7a 100%)', dark: true };
    case 'fajr': return { bg: 'linear-gradient(160deg,#c9d6f2 0%,#f3d9b5 60%,#f9e3a3 100%)', dark: false };
    case 'sunrise':
    case 'duha': return { bg: 'radial-gradient(120% 70% at 0% 0%,#dfe9b8 0%,rgba(223,233,184,0) 55%),linear-gradient(160deg,#f6e7a0 0%,#fae58c 45%,#f8d567 100%)', dark: false };
    case 'zawal':
    case 'dhuhr': return { bg: 'linear-gradient(160deg,#fff1b8 0%,#fde58a 50%,#fcd560 100%)', dark: false };
    case 'asr': return { bg: 'linear-gradient(160deg,#fde9c4 0%,#fbcf8e 55%,#f7b267 100%)', dark: false };
    case 'maghrib': return { bg: 'linear-gradient(160deg,#f9c7a8 0%,#ee9a9a 50%,#a77bb5 100%)', dark: false };
  }
}

function Arc({ progress, dark }: { progress: number; dark: boolean }) {
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
      <path d={arcPath(startDeg, startDeg + sweep)} stroke={dark ? 'rgba(255,255,255,.18)' : 'rgba(150,120,20,.16)'} strokeWidth="11" fill="none" strokeLinecap="round" />
      <path d={arcPath(startDeg, end)} stroke={dark ? '#fde68a' : '#1f3a33'} strokeWidth="11" fill="none" strokeLinecap="round" style={{ transition: 'all .6s' }} />
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
  const doneList = useStore((s) => s.amol[dateKey(today)]) ?? [];
  const toggleAmol = useStore((s) => s.toggleAmol);
  const [locOpen, setLocOpen] = useState(false);
  const [detail, setDetail] = useState<Waqt | null>(null);

  const isFriday = today.getDay() === 5;
  const hijri = toHijri(today, hijriAdjust);
  const hero = heroStyle(period.id);
  const total = period.end.getTime() - period.start.getTime();
  const progress = (now.getTime() - period.start.getTime()) / total;
  const fmt = (d: Date) => fmtTime(d, place.tz, time24);
  const ink = hero.dark ? 'text-white' : 'text-[#1f3a33]';
  const pill = hero.dark ? 'bg-white/15' : 'bg-[#8a6d00]/15';

  const nextId = waqts.find((w) => now < w.start)?.id;
  const currentWaqt = waqts.find((w) => now >= w.start && now <= w.end)?.id;

  const share = () => {
    const lines = waqts.map((w) => `${w.id === 'dhuhr' && isFriday ? t('jumuah') : t(w.id)}: ${fmt(w.start)} - ${fmt(w.end)}`);
    shareText('নামাজের সময়সূচি', `${lang === 'bn' ? place.bn : place.name} — ${formatGregorian(today, lang, true)}\n${lines.join('\n')}\n${t('sunrise')}: ${fmt(times.sunrise)} | ${t('sunset')}: ${fmt(times.sunset)}`);
  };

  return (
    <div>
      {/* ---------- hero ---------- */}
      <section className="relative overflow-hidden pb-11 pt-3" style={{ background: hero.bg }}>
        {!hero.dark && <div className="absolute left-[13%] top-[105px] h-12 w-12 rounded-full bg-white/50 blur-md" />}
        {hero.dark && [12, 30, 70, 85, 50].map((x, i) => <span key={i} className="absolute h-1 w-1 rounded-full bg-white/70" style={{ left: `${x}%`, top: `${20 + i * 23}px` }} />)}
        <div className={`relative flex items-start justify-between px-5 ${ink}`}>
          <button onClick={() => nav('/calendar')} className="tap flex items-start gap-3 text-left">
            <CalendarDays size={26} strokeWidth={2} className="mt-0.5" />
            <span className="text-[14.5px] leading-[1.45]">
              {(lang === 'bn' ? WEEKDAYS_BN : WEEKDAYS_EN)[today.getDay()]}, {formatHijri(hijri, lang)}
              <br />
              {formatGregorian(today, lang)}{lang === 'bn' && `, ${formatBangla(today)}`}
            </span>
          </button>
          <div className="flex items-center gap-6 pr-2 pt-1">
            <button onClick={share} aria-label="share" className="tap flex h-[31px] w-[31px] items-center justify-center rounded-full bg-[#22c27a] text-white shadow">
              <Share2 size={16} />
            </button>
            <button onClick={() => nav('/notifications')} aria-label="notifications" className="tap relative">
              <Bell size={24} fill="currentColor" />
              {unread > 0 && (
                <span className="absolute -right-3 -top-3 rounded-full border-2 border-white bg-[#e11d48] px-1 text-[10px] leading-4 text-white">
                  {unread > 99 ? `${n(99)}+` : n(unread)}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className={`relative mx-auto mt-5 h-[150px] w-[220px] ${ink}`}>
          <Arc progress={progress} dark={hero.dark} />
          <div className="absolute inset-x-0 top-[40px] text-center">
            <div className="text-[20px] leading-tight">{periodLabel(period.id, isFriday, t)}</div>
            <div className="mt-1.5 text-[14px] opacity-90">{t('remaining')}</div>
            <div className="mt-1.5 font-bn text-[21px] tracking-wide tabular-nums">{formatDuration(period.end.getTime() - now.getTime())}</div>
          </div>
        </div>

        <div className={`relative mt-1 flex items-center justify-center gap-2 px-3 ${ink}`}>
          <button onClick={() => setLocOpen(true)} className={`tap flex h-[41px] items-center gap-1.5 rounded-full px-3.5 ${pill}`}>
            <MapPin size={17} fill="currentColor" className={hero.dark ? 'text-white' : 'text-[#1f3a33]'} stroke={hero.dark ? '#243a5e' : '#f6dc7a'} />
            <span className="max-w-[90px] truncate text-[14px]">{lang === 'bn' && place.country === 'INTL' ? place.bn : place.name}</span>
            <ChevronDown size={15} />
          </button>
          <div className={`flex h-[41px] items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[13px] ${pill}`}>
            <Sunrise size={16} /> {t('sunrise')}: {fmt(times.sunrise)}
            <span className="mx-1.5 h-5 w-px bg-current opacity-40" />
            <Sunset size={16} /> {t('sunset')}: {fmt(times.sunset)}
          </div>
        </div>
      </section>

      {/* ---------- prayer list ---------- */}
      <section className="relative -mt-7 rounded-t-[22px] bg-surface shadow-sm">
        <ul className="pt-1.5">
          {waqts.map((w) => {
            const done = doneList.includes(w.id);
            const past = now > w.end;
            const active = w.id === currentWaqt || (!currentWaqt && w.id === nextId);
            const label = w.id === 'dhuhr' && isFriday ? t('jumuah') : t(w.id);
            return (
              <li key={w.id} className="flex h-[45px] items-center gap-3 px-4">
                <button onClick={() => setDetail(w)} className="flex min-w-0 flex-1 items-center gap-4 text-left">
                  <span className={active ? 'text-ink' : 'text-muted'}>{PRAYER_ICON[w.id]}</span>
                  <span className={`flex-1 text-[16px] ${active ? 'text-ink' : 'text-muted'}`}>{label}</span>
                  {w.makruh && <span className="mr-2 h-[13px] w-[13px] rounded-full bg-amber-400" title="মাকরূহ সময় আছে" />}
                  <span className={`whitespace-nowrap text-[15.5px] tabular-nums ${active ? 'text-ink' : past ? 'text-muted/80' : 'text-muted'}`}>
                    {fmt(w.start)} - {fmt(w.end)}
                  </span>
                </button>
                <button
                  aria-label={`mark ${w.id}`}
                  onClick={() => {
                    if (now < w.start && !done) return toast(lang === 'bn' ? 'এই ওয়াক্ত এখনও শুরু হয়নি' : 'This prayer time has not started yet');
                    toggleAmol(w.id, dateKey(today));
                  }}
                  className={`tap ml-2 flex h-[23px] w-[23px] shrink-0 items-center justify-center rounded-full border-2 ${done ? 'border-brand bg-brand text-white' : past ? 'border-muted/70' : 'border-line'}`}
                >
                  {done && <Check size={14} strokeWidth={3.5} />}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="mt-1.5 grid grid-cols-2 border-y border-line">
          <button onClick={() => nav('/alarm')} className="tap flex h-[60px] items-center justify-center gap-3 text-[16px] text-ink">
            <Bell size={17} fill="currentColor" /> {t('alarm')}
          </button>
          <button onClick={() => nav('/calendar')} className="tap my-3 flex items-center justify-center gap-3 border-l border-line text-[16px] text-ink">
            <CalendarDays size={17} /> {t('calendar')}
          </button>
        </div>
      </section>

      <div className="h-2.5" />
      <Carousel />

      <button onClick={() => nav('/ramadan')} aria-label="ramadan" className="tap fixed bottom-[150px] right-[max(1.25rem,calc(50%-240px+1.25rem))] z-30 flex h-[68px] w-[68px] items-center justify-center rounded-full bg-surface shadow-[0_6px_24px_rgba(0,0,0,.18)]">
        <MosqueArt size={46} />
      </button>

      {/* ---------- top features ---------- */}
      <section className="mt-2.5 bg-surface pb-5 pt-4">
        <div className="flex items-center justify-between px-5">
          <h2 className="flex items-center gap-2 text-[17px] text-ink"><BadgeCheck size={21} strokeWidth={1.6} /> {t('topFeatures')}</h2>
          <button onClick={() => nav('/tools')} className="text-[16px] text-brand">{t('seeMore')}</button>
        </div>
        <div className="mt-5 grid grid-cols-4 gap-y-5 px-3">
          {[
            { label: t('amolTracker'), icon: <ListChecks size={30} />, go: () => nav('/amol') },
            { label: t('tasbih'), icon: <TasbihIcon size={32} />, go: () => pnav('/tasbih', true) },
            { label: t('qibla'), icon: <QiblaIcon size={32} />, go: () => pnav('/qibla', true) },
            { label: t('ramadan'), icon: <CrescentLanternIcon size={32} />, go: () => nav('/ramadan') },
            { label: t('zakat'), icon: <ZakatIcon size={32} />, go: () => nav('/zakat') },
            { label: t('qaza'), icon: <Award size={30} />, go: () => nav('/qaza') },
            { label: t('hadith'), icon: <HadithBookIcon size={30} />, go: () => nav('/hadith') },
            { label: t('quran'), icon: <BookOpenText size={30} />, go: () => nav('/quran') },
          ].map((f) => (
            <button key={f.label} onClick={f.go} className="tap flex flex-col items-center gap-2">
              <span className="icon-circle h-14 w-14">{f.icon}</span>
              <span className="text-center text-[13px] leading-tight text-ink">{f.label}</span>
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
              <div className="rounded-2xl bg-chip p-4"><div className="text-sm text-muted">শুরু</div><div className="text-2xl">{fmt(detail.start)}</div></div>
              <div className="rounded-2xl bg-chip p-4"><div className="text-sm text-muted">শেষ</div><div className="text-2xl">{fmt(detail.end)}</div></div>
            </div>
            <p><span className="text-muted">রাকাত: </span>{SUNNAH[detail.id]}</p>
            {detail.id === 'dhuhr' && isFriday && <p className="text-muted">জুম'আর দিন: ২ রাকাত ফরজ জামাতে, আগে ৪ ও পরে ৪ রাকাত সুন্নাত। সূরা আল কাহফ পড়ুন ও বেশি বেশি দরুদ পাঠ করুন।</p>}
            {detail.makruh && (
              <p className="flex gap-2 rounded-2xl bg-amber-50 p-3 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
                <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full bg-amber-400" />
                {detail.makruh.note} ({fmt(detail.makruh.from)} - {fmt(detail.makruh.to)})
              </p>
            )}
            <button className="btn-primary w-full" onClick={() => {
              if (now < detail.start && !doneList.includes(detail.id)) return toast('এই ওয়াক্ত এখনও শুরু হয়নি');
              toggleAmol(detail.id, dateKey(today)); setDetail(null);
            }}>
              {doneList.includes(detail.id) ? 'আদায় করা হয়নি হিসেবে চিহ্নিত করুন' : 'আদায় করেছি ✓'}
            </button>
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
      ? { icon: <BadgeCheck size={38} className="text-brand" />, title: 'জাযাকাল্লাহু খাইরান! আপনি একজন পৃষ্ঠপোষক।', body: 'আপনার সহযোগিতায় অ্যাপটি বিজ্ঞাপনমুক্ত ও আরও সমৃদ্ধ হচ্ছে।', go: '/subscribe' }
      : { icon: <Award size={40} className="text-brand" fill="rgb(var(--mint))" />, title: 'আলহামদুলিল্লাহ, আগামী ৩ দিন আপনি পাচ্ছেন ৬৩% পর্যন্ত ডিসকাউন্ট।', body: 'এই অফারটি আমল ট্র্যাকারের বার্ষিক প্যাকেজে প্রযোজ্য, আরো আপন হোক আপনার ইবাদতের সঙ্গী।', go: '/subscribe' },
    { icon: <ListChecks size={38} className="text-brand" />, title: `আজকের আমল: ${n(done)}/${n(total)} সম্পন্ন`, body: 'নিয়মিত আমলের হিসাব রাখুন, স্ট্রিক ধরে রাখুন ও নিজের উন্নতি দেখুন।', go: '/amol' },
    { icon: <BookOpenText size={38} className="text-brand" />, title: 'আজকের আয়াত', body: `${ayah.bangla} — ${ayah.ref}`, go: `/quran/${ayah.surah}?ayah=${ayah.ayah}` },
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
    <section className="bg-surface pb-3 pt-4">
      <div ref={ref} onScroll={(e) => setIdx(Math.round(e.currentTarget.scrollLeft / (e.currentTarget.clientWidth * 0.86)))}
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-[7%]">
        {cards.map((c, i) => (
          <button key={i} onClick={() => nav(c.go)} className="flex w-[86%] shrink-0 snap-center items-start gap-4 rounded-2xl border border-line bg-bg/60 px-5 py-5 text-left">
            <span className="shrink-0">{c.icon}</span>
            <span>
              <span className="line-clamp-2 block text-[18px] leading-snug text-ink">{c.title}</span>
              <span className="mt-2 line-clamp-3 block text-[13px] leading-snug text-ink/80">{c.body}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-center gap-2">
        {cards.map((_, i) => <span key={i} className={`rounded-full transition-all ${i === idx ? 'h-[11px] w-[11px] bg-brand' : 'h-[7px] w-[7px] bg-brand/30'}`} />)}
      </div>
    </section>
  );
}

function DailyAyahCard() {
  const nav = useNavigate();
  const ayah = dailyAyat[(Math.floor(Date.now() / 86400000) + 7) % dailyAyat.length];
  return (
    <section className="mt-2.5 bg-surface px-5 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[17px] text-ink">আজকের অনুপ্রেরণা</h2>
        <button onClick={() => shareText('আজকের আয়াত', `${ayah.arabic}\n\n${ayah.bangla}\n— ${ayah.ref}`)} className="text-brand"><Share2 size={20} /></button>
      </div>
      <button onClick={() => nav(`/quran/${ayah.surah}?ayah=${ayah.ayah}`)} className="mt-3 w-full rounded-2xl bg-chip p-5 text-left">
        <p className="arabic text-right text-[22px] text-ink">{ayah.arabic}</p>
        <p className="mt-3 text-[15px] text-ink">{ayah.bangla}</p>
        <p className="mt-2 text-sm text-brand">{ayah.ref}</p>
      </button>
    </section>
  );
}
