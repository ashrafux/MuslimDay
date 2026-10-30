import { useState } from 'react';
import { Check, Crosshair, Loader2, Search } from 'lucide-react';
import { Sheet, toast } from './ui';
import { PLACES, type Place } from '../lib/locations';
import { useStore } from '../store/useStore';

export function LocationSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { place, lang } = useStore((s) => s.settings);
  const update = useStore((s) => s.updateSettings);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);

  const choose = (p: Place) => {
    update({ place: p });
    toast(lang === 'bn' ? `লোকেশন: ${p.bn}` : `Location: ${p.name}`);
    onClose();
  };

  const useGps = () => {
    if (!navigator.geolocation) return toast('এই ডিভাইসে লোকেশন সাপোর্ট নেই');
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(false);
        const { latitude: lat, longitude: lng } = pos.coords;
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        choose({ id: 'gps', name: 'My location', bn: 'বর্তমান লোকেশন', lat, lng, tz, country: tz === 'Asia/Dhaka' ? 'BD' : 'INTL' });
      },
      () => { setBusy(false); toast('লোকেশন পাওয়া যায়নি — অনুমতি দিন বা তালিকা থেকে বেছে নিন'); },
      { enableHighAccuracy: false, timeout: 15000 }
    );
  };

  const ql = q.trim().toLowerCase();
  const list = PLACES.filter((p) => !ql || p.name.toLowerCase().includes(ql) || p.bn.includes(q.trim()));

  return (
    <Sheet open={open} onClose={onClose} title={lang === 'bn' ? 'লোকেশন নির্বাচন' : 'Choose location'}>
      <button onClick={useGps} className="tap mb-3 flex w-full items-center gap-3 rounded-[10px] bg-chip px-4 py-3 text-brand">
        {busy ? <Loader2 className="animate-spin" size={22} /> : <Crosshair size={22} />}
        <span className="text-lg">{lang === 'bn' ? 'বর্তমান লোকেশন ব্যবহার করুন (GPS)' : 'Use current location (GPS)'}</span>
      </button>
      <label className="mb-2 flex items-center gap-2 rounded-[10px] border border-line px-3">
        <Search size={18} className="text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={lang === 'bn' ? 'জেলা / শহর খুঁজুন' : 'Search city'} className="w-full bg-transparent py-3 outline-none" />
      </label>
      <div className="divide-y divide-line">
        {list.map((p) => (
          <button key={p.id} onClick={() => choose(p)} className="flex w-full items-center justify-between py-3 text-left">
            <span>
              <span className="block text-lg text-ink">{lang === 'bn' ? p.bn : p.name}</span>
              <span className="block text-xs text-muted">{p.name} • {p.tz}</span>
            </span>
            {place.id === p.id && <Check className="text-brand" />}
          </button>
        ))}
      </div>
    </Sheet>
  );
}
