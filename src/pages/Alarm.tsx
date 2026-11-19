import { useEffect, useState } from 'react';
import { BellRing } from 'lucide-react';
import { PageHeader, Toggle, toast } from '../components/ui';
import { useStore } from '../store/useStore';
import { useNow, usePrayerData } from '../lib/hooks';
import { fmtTime, PRAYER_IDS } from '../lib/prayer';
import { useT } from '../lib/i18n';
import { n } from '../lib/bn';
import { exactAlarmsAllowed, isNative, notifyNow, notifyPermission, openExactAlarmSettings, requestNotifyPermission, type NotifyPermission } from '../lib/native';

export default function Alarm() {
  const t = useT();
  const alarm = useStore((s) => s.alarm);
  const set = useStore((s) => s.set);
  const { place, time24 } = useStore((s) => s.settings);
  const now = useNow(60000);
  const { waqts, today } = usePrayerData(now);
  const [perm, setPerm] = useState<NotifyPermission>('default');
  // Android 12+: alarms on the exact minute need the "Alarms & reminders" permission
  const [exact, setExact] = useState(true);
  useEffect(() => {
    notifyPermission().then(setPerm).catch(() => setPerm('denied'));
    exactAlarmsAllowed().then(setExact).catch(() => undefined);
  }, []);
  const isFriday = today.getDay() === 5;

  const ask = async () => {
    const p = await requestNotifyPermission();
    setPerm(p);
    if (p !== 'granted') return toast(isNative ? 'অনুমতি দেওয়া হয়নি — ফোনের সেটিংস থেকে নোটিফিকেশন চালু করুন' : 'অনুমতি দেওয়া হয়নি');
    toast('নোটিফিকেশন চালু হয়েছে');
    if (isNative) setExact(await exactAlarmsAllowed());
  };
  const allowExact = async () => {
    setExact(await openExactAlarmSettings());
  };
  const test = async () => {
    useStore.getState().pushNotification({ title: 'টেস্ট অ্যালার্ম', body: 'নামাজের অ্যালার্ম ঠিকমতো কাজ করছে।', link: '/alarm' });
    await notifyNow('টেস্ট অ্যালার্ম', 'নামাজের অ্যালার্ম ঠিকমতো কাজ করছে।', '/alarm', alarm.sound);
    toast('টেস্ট নোটিফিকেশন পাঠানো হয়েছে');
  };

  return (
    <div>
      <PageHeader back title="অ্যালার্ম" />
      {perm !== 'granted' && (
        <div className="m-5 rounded-[10px] bg-butter p-4 text-ink">
          <p>নামাজের সময় নোটিফিকেশন পেতে অনুমতি দিন।</p>
          <button className="btn-primary mt-3" onClick={ask}><BellRing size={18} /> অনুমতি দিন</button>
        </div>
      )}
      {perm === 'granted' && isNative && !exact && (
        <div className="m-5 rounded-[10px] bg-butter p-4 text-ink">
          <p>অ্যালার্ম ঠিক মিনিটে বাজাতে "অ্যালার্ম ও রিমাইন্ডার" অনুমতি দিন। না দিলে অ্যালার্ম কয়েক মিনিট দেরিতে আসতে পারে।</p>
          <button className="btn-primary mt-3" onClick={allowExact}><BellRing size={18} /> অনুমতি দিন</button>
        </div>
      )}
      <div className="page-card mt-4">
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
      <div className="page-card mt-4 px-5 py-4">
        <div className="text-[17px] text-ink">ওয়াক্ত শুরুর আগে রিমাইন্ডার</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {[0, 5, 10, 15, 30].map((m) => (
            <button key={m} onClick={() => set('alarm', { ...alarm, before: m })} className={`rounded-full px-4 py-1.5 ${alarm.before === m ? 'bg-night text-white' : 'bg-surface text-ink ring-1 ring-line'}`}>{m === 0 ? 'বন্ধ' : `${n(m)} মিনিট`}</button>
          ))}
        </div>
      </div>
      <div className="page-card mt-4 divide-y divide-line">
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
        <p className="mt-3 text-center text-xs text-muted">{isNative ? 'অ্যাপ বন্ধ থাকলেও অ্যালার্ম বাজবে।' : 'অ্যাপটি খোলা থাকা অবস্থায় (বা হোম স্ক্রিনে ইনস্টল করা থাকলে) অ্যালার্ম কাজ করবে।'} {PRAYER_IDS.filter((p) => alarm.enabled[p]).length.toLocaleString('bn-BD')}টি ওয়াক্তে অ্যালার্ম চালু।</p>
      </div>
    </div>
  );
}
