import { useEffect, useState } from 'react';
import { Crosshair, ExternalLink, Loader2, MapPin, Navigation } from 'lucide-react';
import { Empty, PageHeader } from '../components/ui';
import { MosquePinIcon } from '../components/icons';
import { useStore } from '../store/useStore';
import { distanceKm } from '../lib/locations';
import { n } from '../lib/bn';

interface Mosque { id: number; name: string; lat: number; lng: number; dist: number }

export default function Mosques() {
  const place = useStore((s) => s.settings.place);
  const [pos, setPos] = useState<{ lat: number; lng: number; label: string }>({ lat: place.lat, lng: place.lng, label: place.bn });
  const [radius, setRadius] = useState(2000);
  const [state, setState] = useState<{ loading: boolean; list: Mosque[]; error?: string }>({ loading: true, list: [] });

  useEffect(() => {
    let alive = true;
    setState({ loading: true, list: [] });
    const q = `[out:json][timeout:20];(node["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${pos.lat},${pos.lng});way["amenity"="place_of_worship"]["religion"="muslim"](around:${radius},${pos.lat},${pos.lng}););out center 60;`;
    fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
      .then((r) => r.json())
      .then((j: { elements: { id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }[] }) => {
        if (!alive) return;
        const list = j.elements.map((e) => {
          const lat = e.lat ?? e.center?.lat ?? 0;
          const lng = e.lon ?? e.center?.lon ?? 0;
          return { id: e.id, name: e.tags?.['name:bn'] || e.tags?.name || 'মসজিদ (নাম নেই)', lat, lng, dist: distanceKm(pos.lat, pos.lng, lat, lng) };
        }).sort((a, b) => a.dist - b.dist);
        setState({ loading: false, list });
      })
      .catch(() => alive && setState({ loading: false, list: [], error: 'মসজিদের তালিকা লোড করা যায়নি (ইন্টারনেট প্রয়োজন)।' }));
    return () => { alive = false; };
  }, [pos, radius]);

  const gps = () => navigator.geolocation?.getCurrentPosition(
    (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude, label: 'বর্তমান লোকেশন' }),
    () => setState((s) => ({ ...s, error: 'লোকেশনের অনুমতি পাওয়া যায়নি।' }))
  );

  const mapsSearch = `https://www.google.com/maps/search/mosque/@${pos.lat},${pos.lng},15z`;

  return (
    <div>
      <PageHeader back title="নিকটস্থ মসজিদ" />
      <div className="page-card mt-1 flex items-center gap-2 px-4 py-3">
        <span className="flex flex-1 items-center gap-2 text-ink"><MapPin size={18} className="text-brand" /> {pos.label}</span>
        <button onClick={gps} className="flex items-center gap-1 rounded-full bg-chip px-3 py-1.5 text-sm text-brand"><Crosshair size={16} /> GPS</button>
      </div>
      <div className="flex gap-2 px-5 py-3">
        {[1000, 2000, 5000].map((r) => (
          <button key={r} onClick={() => setRadius(r)} className={`rounded-full px-4 py-1.5 ${radius === r ? 'bg-night text-white' : 'bg-surface text-ink ring-1 ring-line'}`}>{n(r / 1000)} কিমি</button>
        ))}
      </div>
      {state.loading && <div className="flex justify-center gap-2 p-10 text-muted"><Loader2 className="animate-spin" /> খোঁজা হচ্ছে…</div>}
      {!state.loading && (state.error || state.list.length === 0) && (
        <Empty icon={<MosquePinIcon size={40} />} title={state.error ?? 'এই এলাকায় কোনো মসজিদ পাওয়া যায়নি'} sub="গুগল ম্যাপে খুঁজে দেখুন"
          action={<a href={mapsSearch} target="_blank" rel="noreferrer" className="btn-primary"><ExternalLink size={18} /> গুগল ম্যাপে খুলুন</a>} />
      )}
      <div className="page-card">
        {state.list.map((m) => (
          <div key={m.id} className="flex items-center gap-4 border-b border-line px-5 py-4">
            <span className="tile h-12 w-12 shrink-0 rounded-2xl bg-lav text-ink"><MosquePinIcon size={24} /></span>
            <span className="min-w-0 flex-1"><span className="block truncate text-[17px] text-ink">{m.name}</span><span className="text-sm text-muted">{m.dist < 1 ? `${n(Math.round(m.dist * 1000))} মিটার` : `${n(m.dist.toFixed(1))} কিমি`} দূরে</span></span>
            <a aria-label="directions" href={`https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}`} target="_blank" rel="noreferrer" className="rounded-full bg-brand p-2.5 text-white"><Navigation size={18} /></a>
          </div>
        ))}
      </div>
      {state.list.length > 0 && <p className="p-4 text-center text-xs text-muted">তথ্যসূত্র: © OpenStreetMap contributors</p>}
    </div>
  );
}
