import { useNavigate } from 'react-router-dom';
import { BadgeCheck, Crown, SlidersHorizontal, Phone, Flag, Share2, Info, Bell, Star, Pencil } from 'lucide-react';
import { IconButton, ListRow, shareText } from '../components/ui';
import { Avatar } from '../components/Avatar';
import { useStore } from '../store/useStore';
import { useT } from '../lib/i18n';
import { formatHM, n } from '../lib/bn';

export default function More() {
  const t = useT();
  const nav = useNavigate();
  const profile = useStore((s) => s.profile);
  const stats = useStore((s) => s.stats);
  const tasbihTotal = useStore((s) => s.tasbih.total);
  const premium = useStore((s) => s.premium);

  const shareApp = () => shareText('আমল ট্র্যাকার', 'নামাজের সময়, কুরআন, দোয়া, তাসবীহ ও দৈনিক আমল ট্র্যাকার — একসাথে এক অ্যাপে।', window.location.origin + window.location.pathname);

  return (
    <div>
      <section className="px-5 pt-6">
        <div className="flex items-start justify-between">
          <button onClick={() => nav('/profile')} className="tap relative" aria-label="edit profile">
            <span className="block overflow-hidden rounded-[10px] bg-mint">
              <Avatar id={profile.avatar} size={104} />
            </span>
            <span className={`absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-bg ${premium.active ? 'bg-brand text-white' : 'bg-night text-white'}`}>
              {premium.active ? <BadgeCheck size={16} /> : <Pencil size={13} />}
            </span>
          </button>
          <IconButton label={t('settings')} onClick={() => nav('/settings')}><SlidersHorizontal size={18} /></IconButton>
        </div>
        <h1 className="mt-4 text-[32px] font-extrabold leading-tight text-ink">{profile.name}</h1>
        <p className="mt-0.5 text-[15px] text-muted">
          {profile.email || <button onClick={() => nav('/profile')} className="font-semibold text-brand">প্রোফাইল সম্পূর্ণ করুন</button>}
        </p>
        {premium.active && <p className="mt-1 text-[14px] text-muted">পৃষ্ঠপোষক{premium.plan === 'trial' ? ' (ট্রায়াল)' : ''} • <span className="font-semibold text-ink">আমল ট্র্যাকার</span></p>}

        <div className="mt-5 flex gap-3">
          <button onClick={() => nav('/profile')} className="btn-primary flex-1">প্রোফাইল সম্পাদনা</button>
          <button onClick={shareApp} className="btn-soft flex-1">অ্যাপ শেয়ার</button>
        </div>

        <div className="mt-6 grid grid-cols-3 divide-x divide-line">
          {[
            { label: t('quranRead'), value: formatHM(stats.quranSeconds), go: '/quran' },
            { label: t('duaRead'), value: formatHM(stats.duaSeconds), go: '/dua' },
            { label: t('tasbihCount'), value: String(tasbihTotal), go: '/tasbih' },
          ].map((st, i) => (
            <button key={st.label} onClick={() => nav(st.go)} className={`tap text-left ${i === 0 ? 'pr-3' : 'px-4'}`}>
              <span className="block text-[13px] text-muted">{st.label}</span>
              <span className="mt-1 block text-[24px] font-extrabold text-ink">{st.value}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="px-5 pt-6">
        <button onClick={() => nav('/subscribe')} className="tap grad-sunrise relative flex w-full items-center gap-3 overflow-hidden rounded-[10px] p-5 text-left text-white shadow-float">
          <span className="flex-1">
            <span className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-night text-gold"><Crown size={18} fill="currentColor" /></span>
              <span className="text-[20px] font-bold">{premium.active ? 'আপনি পৃষ্ঠপোষক' : t('beSupporter')}</span>
            </span>
            <span className="mt-2 block text-[14px] text-white/90">{t('adFree')}</span>
          </span>
          <span className="flex h-11 shrink-0 items-center justify-center rounded-[10px] bg-white px-4 text-[14px] font-bold text-night">{premium.active ? 'ম্যানেজ' : t('subscribe')}</span>
        </button>
      </section>

      <div className="section-head"><span>সাধারণ</span></div>
      <section className="page-card py-1">
        <ListRow tint="bg-lav" icon={<SlidersHorizontal size={19} />} title={t('settings')} sub={t('settingsSub')} onClick={() => nav('/settings')} />
        <ListRow tint="bg-sky" icon={<Phone size={19} />} title={t('contact')} sub={t('contactSub')} onClick={() => nav('/contact')} />
        <ListRow tint="bg-butter" icon={<Bell size={19} />} title={t('notifications')} sub="নামাজ ও অন্যান্য নোটিফিকেশন" onClick={() => nav('/notifications')} />
      </section>

      <div className="section-head"><span>সহায়তা</span></div>
      <section className="page-card py-1">
        <ListRow tint="bg-rose" icon={<Flag size={19} />} title={t('report')} sub={t('reportSub')} onClick={() => nav('/report')} />
        <ListRow tint="bg-mint" icon={<Share2 size={19} />} title="অ্যাপ শেয়ার করুন" sub="বন্ধুদের সাথে আমল ট্র্যাকার শেয়ার করুন" onClick={shareApp} />
        <ListRow tint="bg-sand" icon={<Star size={19} />} title="মতামত দিন" sub="অ্যাপটি কেমন লাগছে জানান" onClick={() => nav('/contact?type=feedback')} />
        <ListRow tint="bg-chip" icon={<Info size={19} />} title="আমাদের সম্পর্কে" sub={`সংস্করণ ${n('1.0.0')} • প্রাইভেসি পলিসি`} onClick={() => nav('/about')} />
      </section>
    </div>
  );
}
