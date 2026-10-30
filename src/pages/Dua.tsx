import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ListPlus, Search } from 'lucide-react';
import { PageHeader, Sheet, toast } from '../components/ui';
import { PrayingManIcon, CalendarCheckIcon, CrescentLanternIcon, SunriseSeaIcon, QuranStandIcon, FourDotsIcon } from '../components/icons';
import { useStore } from '../store/useStore';
import { duaCategories } from '../data/duas';
import { n } from '../lib/bn';

const ICONS: Record<string, JSX.Element> = {
  salat: <PrayingManIcon size={78} />,
  daily: <CalendarCheckIcon size={74} />,
  sawm: <CrescentLanternIcon size={74} />,
  adhkar: <SunriseSeaIcon size={74} />,
  quran: <QuranStandIcon size={74} />,
  misc: <FourDotsIcon size={56} />,
};

export const FREE_LISTS = 3;
export const PREMIUM_LISTS = 20;

export function NewListSheet({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated?: (id: string) => void }) {
  const lists = useStore((s) => s.duaLists);
  const premium = useStore((s) => s.premium.active);
  const set = useStore((s) => s.set);
  const nav = useNavigate();
  const [name, setName] = useState('');
  const limit = premium ? PREMIUM_LISTS : FREE_LISTS;
  const full = lists.length >= limit;
  return (
    <Sheet open={open} onClose={onClose} title="নতুন তালিকা">
      {full ? (
        <div>
          <p className="text-ink">আপনি সর্বোচ্চ {n(limit)}টি তালিকা তৈরি করেছেন।{!premium && ' পৃষ্ঠপোষক হয়ে ২০টি পর্যন্ত তালিকা তৈরি করুন।'}</p>
          {!premium && <button className="btn-primary mt-4 w-full" onClick={() => { onClose(); nav('/subscribe'); }}>পৃষ্ঠপোষক হোন</button>}
        </div>
      ) : (
        <>
          <input autoFocus className="input" placeholder="তালিকার নাম (যেমন: প্রতিদিনের দোয়া)" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
          <p className="mt-2 text-sm text-muted">{n(lists.length)}/{n(limit)} তালিকা ব্যবহৃত</p>
          <button className="btn-primary mt-4 w-full" disabled={!name.trim()} onClick={() => {
            const id = `l-${Date.now()}`;
            set('duaLists', [...lists, { id, name: name.trim(), duaIds: [] }]);
            setName(''); onClose(); toast('তালিকা তৈরি হয়েছে'); onCreated?.(id);
          }}>তৈরি করুন</button>
        </>
      )}
    </Sheet>
  );
}

export default function Dua() {
  const nav = useNavigate();
  const lists = useStore((s) => s.duaLists);
  const favs = useStore((s) => s.favoriteDuas);
  const [creating, setCreating] = useState(false);

  return (
    <div>
      <PageHeader title="দোয়া" right={<button aria-label="search" onClick={() => nav('/dua/search')} className="tap p-2 text-ink"><Search size={26} strokeWidth={2.6} /></button>} />
      <div className="grid grid-cols-2 gap-y-6 px-4 pt-6">
        {duaCategories.map((c) => (
          <button key={c.id} onClick={() => nav(`/dua/c/${c.id}`)} className="tap flex flex-col items-center gap-4">
            <span className="icon-circle h-[125px] w-[125px]">{ICONS[c.id]}</span>
            <span className="text-[19px] text-ink">{c.title}</span>
          </button>
        ))}
      </div>

      <section className="mt-8 px-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[21px] text-ink">আমার দু'আ কালেকশন</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-ink/80">৩টি কাস্টম লিস্ট ব্যবহার করুন একদম ফ্রিতে! পৃষ্ঠপোষক হিসেবে যুক্ত হয়ে ২০টি পর্যন্ত লিস্ট তৈরির সুবিধা আনলক করুন।</p>
          </div>
          <button onClick={() => setCreating(true)} className="mt-11 shrink-0 text-[16.5px] text-brand">নতুন তালিকা</button>
        </div>
        <div className="mt-4 space-y-3 pb-6">
          {favs.length > 0 && (
            <button onClick={() => nav('/dua/list/favorites')} className="flex w-full items-center gap-4 rounded-2xl bg-surface p-4 text-left">
              <span className="icon-circle h-12 w-12 text-alert">♥</span>
              <span className="flex-1"><span className="block text-lg text-ink">প্রিয় দোয়া</span><span className="text-sm text-muted">{n(favs.length)}টি দোয়া</span></span>
              <ChevronRight className="text-muted" />
            </button>
          )}
          {lists.map((l) => (
            <button key={l.id} onClick={() => nav(`/dua/list/${l.id}`)} className="flex w-full items-center gap-4 rounded-2xl bg-surface p-4 text-left">
              <span className="icon-circle h-12 w-12 text-brand"><ListPlus size={22} /></span>
              <span className="flex-1"><span className="block text-lg text-ink">{l.name}</span><span className="text-sm text-muted">{n(l.duaIds.length)}টি দোয়া</span></span>
              <ChevronRight className="text-muted" />
            </button>
          ))}
          {lists.length === 0 && favs.length === 0 && (
            <button onClick={() => setCreating(true)} className="w-full rounded-2xl border-2 border-dashed border-brand/40 p-5 text-brand">+ প্রথম তালিকা তৈরি করুন</button>
          )}
        </div>
      </section>
      <NewListSheet open={creating} onClose={() => setCreating(false)} onCreated={(id) => nav(`/dua/list/${id}`)} />
    </div>
  );
}
