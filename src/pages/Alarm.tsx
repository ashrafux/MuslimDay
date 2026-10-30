import { useState } from 'react';
import { BellRing } from 'lucide-react';
import { PageHeader, Toggle, toast } from '../components/ui';
import { useStore } from '../store/useStore';
import { useNow, usePrayerData } from '../lib/hooks';
import { fmtTime, PRAYER_IDS } from '../lib/prayer';
import { useT } from '../lib/i18n';
import { n } from '../lib/bn';

export default function Alarm() {
  const t = useT();
  const alarm = useStore((s) => s.alarm);
  const set = useStore((s) => s.set);
  const { place, time24 } = useStore((s) => s.settings);
  const now = useNow(60000);
  const { waqts, today } = usePrayerData(now);
  const [perm, setPerm] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'denied');
  const isFriday = today.getDay() === 5;

  const ask = async () => {
    if (typeof Notification === 'undefined') return toast('এই ব্রাউজারে নোটিফিকেশন সাপোর্ট নেই');
    const p = await Notification.requestPermission();
    setPerm(p);
    toast(p === 'granted' ? 'নোটিফিকেশন চালু হয়েছে' : 'অনুমতি দেওয়া হয়নি');
  };
  const test = async () => {
    useStore.getState().pushNotification({ title: 'টেস্ট অ্যালার্ম', body: 'নামাজের অ্যালার্ম ঠিকমতো কাজ করছে।', link: '/alarm' });
    if (perm === 'granted') {
      const reg = await navigator.serviceWorker?.getRegistration();
      if (reg) reg.showNotification('টেস্ট অ্যালার্ম', { body: 'নামাজের অ্যালার্ম ঠিকমতো কাজ করছে।', icon: './icon.svg' });
      else new Notification('টেস্ট অ্যালার্ম', { body: 'নামাজের অ্যালার্ম ঠিকমতো কাজ করছে।' });
    }
    toast('টেস্ট নোটিফিকেশন পাঠানো হয়েছে');
  };

  return (
    <div>
      <PageHeader back title="অ্যালার্ম" />
      {perm !== 'granted' && (
        <div className="m-5 rounded-2xl bg-amber-50 p-4 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100">
          <p>নামাজের সময় নোটিফিকেশন পেতে অনুমতি দিন।</p>
          <button className="btn-primary mt-3" onClick={ask}><BellRing size={18} /> অনুমতি দিন</button>
        </div>
      )}
      <div className="mt-4 bg-surface">
        {waqts.map((w) => (
          <div key={w.id} className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <div className="text-[19px] text-ink">{w.id === 'dhuhr' && isFriday ? t('jumuah') : t(w.id)}</div>
              <div className="text-sm text-muted">{fmtTime(w.start, place.tz, time24)}</div>
            </div>
            <Toggle checked={alarm.enabled[w.id]} onChange={(v) => set('alarm', { ...alarm, enabled: { ...alarm.enabled, [w.id]: v } })} />
          </div>
        ))}
      </div>
      <div className="mt-4 bg-surface px-5 py-4">
        <div className="text-[17px] text-ink">ওয়াক্ত শুরুর আগে রিমাইন্ডার</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {[0, 5, 10, 15, 30].map((m) => (
            <button key={m} onClick={() => set('alarm', { ...alarm, before: m })} className={`rounded-full px-4 py-1.5 ${alarm.before === m ? 'bg-brand text-white' : 'bg-chip text-ink'}`}>{m === 0 ? 'বন্ধ' : `${n(m)} মিনিট`}</button>
          ))}
        </div>
      </div>
      <div className="mt-4 divide-y divide-line bg-surface">
        <div className="flex items-center justify-between px-5 py-4">
          <span><span className="block text-[17px] text-ink">ওয়াক্ত শেষের রিমাইন্ডার</span><span className="text-sm text-muted">নামাজ চিহ্নিত না করলে শেষ হওয়ার ২০ মিনিট আগে</span></span>
          <Toggle checked={alarm.endReminder} onChange={(v) => set('alarm', { ...alarm, endReminder: v })} />
        </div>
        <div className="flex items-center justify-between px-5 py-4">
          <span className="text-[17px] text-ink">শব্দ</span>
          <Toggle checked={alarm.sound} onChange={(v) => set('alarm', { ...alarm, sound: v })} />
        </div>
      </div>
      <div className="p-5">
        <button className="btn-soft w-full" onClick={test}>টেস্ট নোটিফিকেশন</button>
        <p className="mt-3 text-center text-xs text-muted">অ্যাপটি খোলা থাকা অবস্থায় (বা হোম স্ক্রিনে ইনস্টল করা থাকলে) অ্যালার্ম কাজ করবে। {PRAYER_IDS.filter((p) => alarm.enabled[p]).length.toLocaleString('bn-BD')}টি ওয়াক্তে অ্যালার্ম চালু।</p>
      </div>
    </div>
  );
}
