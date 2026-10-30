import { useNavigate } from 'react-router-dom';
import { Crown, SlidersHorizontal, Phone, Flag, Share2, Info, Bell, Star, Pencil } from 'lucide-react';
import { ListRow, shareText } from '../components/ui';
import { Avatar } from '../components/Avatar';
import { QuranStandIcon, HandsIcon, TasbihIcon } from '../components/icons';
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

  return (
    <div>
      <div className="relative h-[88px] bg-[#a9e2da] dark:bg-[#1d4a44]">
        <span className="absolute bottom-0 left-[22%] h-6 w-10 rounded-t-full bg-[#7cc59a]/80" />
        <span className="absolute bottom-0 right-[22%] h-6 w-11 rounded-t-full bg-[#7cc59a]/80" />
      </div>
      <section className="bg-surface pb-7">
        <button onClick={() => nav('/profile')} className="relative mx-auto -mt-[50px] block rounded-full border-[5px] border-bg bg-surface" aria-label="edit profile">
          <Avatar id={profile.avatar} size={114} />
          <span className="absolute bottom-1 right-1 rounded-full bg-brand p-1.5 text-white shadow"><Pencil size={12} /></span>
        </button>
        <h1 className="mt-3 text-center text-[29px] leading-tight text-ink">{profile.name}</h1>
        <p className="mt-1 text-center text-[17px] text-ink/80">{profile.email || <button onClick={() => nav('/profile')} className="text-brand">প্রোফাইল সম্পূর্ণ করুন</button>}</p>
        {premium.active && <p className="mt-2 flex items-center justify-center gap-1 text-amber-600"><Crown size={18} fill="currentColor" /> পৃষ্ঠপোষক{premium.plan === 'trial' ? ' (ট্রায়াল)' : ''}</p>}

        <div className="mt-5 grid grid-cols-3">
          {[
            { icon: <QuranStandIcon size={34} />, label: t('quranRead'), value: formatHM(stats.quranSeconds), go: '/quran' },
            { icon: <HandsIcon size={32} strokeWidth={1.5} />, label: t('duaRead'), value: formatHM(stats.duaSeconds), go: '/dua' },
            { icon: <TasbihIcon size={34} />, label: t('tasbihCount'), value: String(tasbihTotal), go: '/tasbih' },
          ].map((s) => (
            <button key={s.label} onClick={() => nav(s.go)} className="tap flex flex-col items-center">
              <span className="icon-circle h-[60px] w-[60px]">{s.icon}</span>
              <span className="mt-2 text-[13.5px] text-ink">{s.label}</span>
              <span className="mt-1 text-[22px] text-brand">{s.value}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-2.5 bg-surface px-4 py-4">
        <button onClick={() => nav('/subscribe')} className="tap flex h-[108px] w-full items-center gap-3 rounded-xl bg-gradient-to-r from-[#12936a] via-[#2c5f7c] to-[#4b3a8f] px-5 text-left text-white">
          <span className="flex-1">
            <span className="flex items-center gap-3">
              <span className="flex h-[35px] w-[35px] items-center justify-center rounded-lg bg-gold text-ink"><Crown size={20} fill="currentColor" /></span>
              <span className="text-[20px] text-gold">{premium.active ? 'আপনি পৃষ্ঠপোষক' : t('beSupporter')}</span>
            </span>
            <span className="mt-2 block text-[14px]">{t('adFree')}</span>
          </span>
          <span className="flex h-[46px] w-[100px] shrink-0 items-center justify-center rounded-md border-2 border-white/90 bg-white/15 text-[16px]">{premium.active ? 'ম্যানেজ' : t('subscribe')}</span>
        </button>
      </section>

      <section className="mt-2.5 bg-surface py-1">
        <ListRow icon={<SlidersHorizontal size={22} />} title={<span className="text-[19px]">{t('settings')}</span>} sub={<span className="text-[13.5px]">{t('settingsSub')}</span>} onClick={() => nav('/settings')} />
        <ListRow icon={<Phone size={22} />} title={<span className="text-[19px]">{t('contact')}</span>} sub={<span className="text-[13.5px]">{t('contactSub')}</span>} onClick={() => nav('/contact')} />
      </section>

      <section className="mt-2.5 bg-surface py-1">
        <ListRow icon={<Flag size={22} />} title={<span className="text-[19px]">{t('report')}</span>} sub={<span className="text-[13.5px]">{t('reportSub')}</span>} onClick={() => nav('/report')} />
        <ListRow icon={<Bell size={22} />} title={t('notifications')} sub="নামাজ ও অন্যান্য নোটিফিকেশন" onClick={() => nav('/notifications')} />
        <ListRow icon={<Share2 size={22} />} title="অ্যাপ শেয়ার করুন" sub="বন্ধুদের সাথে আমল ট্র্যাকার শেয়ার করুন" onClick={() => shareText('আমল ট্র্যাকার', 'নামাজের সময়, কুরআন, দোয়া, তাসবীহ ও দৈনিক আমল ট্র্যাকার — একসাথে এক অ্যাপে।', window.location.origin + window.location.pathname)} />
        <ListRow icon={<Star size={22} />} title="মতামত দিন" sub="অ্যাপটি কেমন লাগছে জানান" onClick={() => nav('/contact?type=feedback')} />
        <ListRow icon={<Info size={22} />} title="আমাদের সম্পর্কে" sub={`সংস্করণ ${n('1.0.0')} • প্রাইভেসি পলিসি`} onClick={() => nav('/about')} />
      </section>
    </div>
  );
}
