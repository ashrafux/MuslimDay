import { useEffect, useState } from 'react';
import { Compass, MapPin } from 'lucide-react';
import { PageHeader, toast } from '../components/ui';
import { useStore } from '../store/useStore';
import { KAABA, distanceKm, qiblaBearing } from '../lib/locations';
import { n } from '../lib/bn';
import { LocationSheet } from '../components/LocationSheet';

type OrientationEvt = DeviceOrientationEvent & { webkitCompassHeading?: number };

export default function Qibla() {
  const place = useStore((s) => s.settings.place);
  const [heading, setHeading] = useState<number | null>(null);
  const [active, setActive] = useState(false);
  const [loc, setLoc] = useState(false);
  const bearing = qiblaBearing(place.lat, place.lng);
  const dist = distanceKm(place.lat, place.lng, KAABA.lat, KAABA.lng);

  useEffect(() => {
    if (!active) return;
    const handler = (e: Event) => {
      const ev = e as OrientationEvt;
      if (typeof ev.webkitCompassHeading === 'number') setHeading(ev.webkitCompassHeading);
      else if (ev.absolute && ev.alpha !== null) setHeading((360 - ev.alpha) % 360);
      else if (ev.alpha !== null) setHeading((360 - ev.alpha) % 360);
    };
    const name = 'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation';
    window.addEventListener(name, handler);
    return () => window.removeEventListener(name, handler);
  }, [active]);

  const start = async () => {
    const DOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
    try {
      if (typeof DOE?.requestPermission === 'function') {
        const r = await DOE.requestPermission();
        if (r !== 'granted') return toast('কম্পাসের অনুমতি দেওয়া হয়নি');
      }
      setActive(true);
      setTimeout(() => setHeading((h) => { if (h === null) toast('এই ডিভাইসে কম্পাস সেন্সর পাওয়া যায়নি'); return h; }), 2500);
    } catch { toast('কম্পাস চালু করা যায়নি'); }
  };

  const rotation = heading === null ? 0 : -heading;
  const diff = heading === null ? null : ((bearing - heading + 540) % 360) - 180;
  const aligned = diff !== null && Math.abs(diff) < 5;

  useEffect(() => { if (aligned) navigator.vibrate?.(60); }, [aligned]);

  return (
    <div>
      <PageHeader back title="কিবলা" />
      <div className="flex flex-col items-center px-5 py-6">
        <button onClick={() => setLoc(true)} className="flex items-center gap-2 rounded-full bg-chip px-4 py-2 text-brand"><MapPin size={18} /> {place.bn}</button>
        <div className={`relative mt-8 h-72 w-72 rounded-full border-8 ${aligned ? 'border-brand' : 'border-chip'} bg-surface shadow-inner transition-colors`}>
          <div className="absolute inset-0 transition-transform duration-200" style={{ transform: `rotate(${rotation}deg)` }}>
            {['N', 'E', 'S', 'W'].map((d, i) => (
              <span key={d} className={`absolute left-1/2 top-1/2 text-lg ${d === 'N' ? 'text-red-500' : 'text-muted'}`}
                style={{ transform: `rotate(${i * 90}deg) translateY(-118px) rotate(${-i * 90}deg) translate(-50%,-50%)` }}>{d}</span>
            ))}
            {Array.from({ length: 72 }).map((_, i) => (
              <span key={i} className="absolute left-1/2 top-1/2 block w-px bg-line" style={{ height: i % 6 ? 6 : 12, transform: `rotate(${i * 5}deg) translateY(-130px)` }} />
            ))}
            <div className="absolute left-1/2 top-1/2 h-[120px] w-2 origin-bottom" style={{ transform: `translate(-50%,-100%) rotate(${bearing}deg)` }}>
              <div className="h-full w-full rounded-full bg-gradient-to-t from-transparent to-brand" />
              <span className="absolute -top-9 left-1/2 -translate-x-1/2 text-3xl" style={{ transform: `translateX(-50%) rotate(${-bearing - rotation}deg)` }}>🕋</span>
            </div>
          </div>
          <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink" />
          <div className="absolute left-1/2 top-0 h-6 w-1 -translate-x-1/2 rounded bg-ink" />
        </div>
        <div className="mt-8 text-center">
          <div className="text-4xl text-ink">{n(Math.round(bearing))}°</div>
          <div className="text-muted">উত্তর দিক থেকে ঘড়ির কাঁটার দিকে কিবলার কোণ</div>
          <div className="mt-2 text-muted">কাবা শরীফের দূরত্ব: {n(Math.round(dist).toLocaleString('en'))} কিমি</div>
          {diff !== null && <div className={`mt-4 text-xl ${aligned ? 'text-brand' : 'text-ink'}`}>{aligned ? 'আপনি কিবলামুখী আছেন ✓' : `${n(Math.abs(Math.round(diff)))}° ${diff > 0 ? 'ডানে' : 'বামে'} ঘুরুন`}</div>}
        </div>
        {!active && <button className="btn-primary mt-6" onClick={start}><Compass size={20} /> লাইভ কম্পাস চালু করুন</button>}
        <p className="mt-6 text-center text-xs text-muted">সঠিক ফলাফলের জন্য ফোন সমতলে রাখুন এবং চুম্বক/ধাতব বস্তু থেকে দূরে থাকুন। কম্পাস না থাকলে উপরের কোণ ও সূর্যের অবস্থান দিয়ে দিক নির্ণয় করুন।</p>
      </div>
      <LocationSheet open={loc} onClose={() => setLoc(false)} />
    </div>
  );
}
