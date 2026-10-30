import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Heart, ListPlus, Search } from 'lucide-react';
import { IconButton, PageHeader, Sheet, pastel, toast } from '../components/ui';
import { PrayingManIcon, CalendarCheckIcon, CrescentLanternIcon, SunriseSeaIcon, QuranStandIcon, FourDotsIcon } from '../components/icons';
import { useStore } from '../store/useStore';
import { duaCategories } from '../data/duas';
import { n } from '../lib/bn';

const TONES: Record<string, string> = { salat: 'bg-m-green', daily: 'bg-m-yellow', sawm: 'bg-m-gray', adhkar: 'bg-m-blue', quran: 'bg-m-pink', misc: 'bg-lav' };

const ICONS: Record<string, JSX.Element> = {
  salat: <PrayingManIcon size={62} />,
  daily: <CalendarCheckIcon size={58} />,
  sawm: <CrescentLanternIcon size={58} />,
  adhkar: <SunriseSeaIcon size={58} />,
  quran: <QuranStandIcon size={58} />,
  misc: <FourDotsIcon size={42} />,
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
      <PageHeader title="দোয়া" right={<IconButton label="search" onClick={() => nav('/dua/search')}><Search size={19} /></IconButton>} />
      <section className="page-card mt-2 px-3 pb-6 pt-5">
        <div className="label px-2">দোয়ার বিভাগ</div>
        <div className="mt-4 grid grid-cols-2 gap-y-5">
          {duaCategories.map((c) => (
            <button key={c.id} onClick={() => nav(`/dua/c/${c.id}`)} className="tap flex flex-col items-center gap-2.5">
              <span className={`flex h-[104px] w-[104px] items-center justify-center rounded-full text-ink ${TONES[c.id]}`}>{ICONS[c.id]}</span>
              <span className="text-[15px] font-semibold text-ink">{c.title}</span>
              <span className="-mt-2 text-[12px] text-muted">{n(c.duas.length)}টি দোয়া</span>
            </button>
          ))}
        </div>
      </section>

      <div className="section-head items-start">
        <span className="min-w-0">
          আমার দু'আ কালেকশন
          <span className="mt-1 block text-[13px] font-normal leading-relaxed text-muted">৩টি কাস্টম লিস্ট ব্যবহার করুন একদম ফ্রিতে! পৃষ্ঠপোষক হিসেবে যুক্ত হয়ে ২০টি পর্যন্ত লিস্ট তৈরির সুবিধা আনলক করুন।</span>
        </span>
        <button onClick={() => setCreating(true)} className="tap mt-1 shrink-0 rounded-[10px] bg-brand px-3 py-2 text-[13px] font-semibold text-white">নতুন তালিকা</button>
      </div>
      <div className="space-y-2.5 px-5 pb-6">
        {favs.length > 0 && (
          <button onClick={() => nav('/dua/list/favorites')} className="tap card flex w-full items-center gap-4 p-3.5 text-left">
            <span className="tile h-12 w-12 rounded-[10px] bg-rose text-m-pink"><Heart size={20} fill="currentColor" /></span>
            <span className="flex-1"><span className="block text-[16px] font-bold text-ink">প্রিয় দোয়া</span><span className="text-[13px] text-muted">{n(favs.length)}টি দোয়া</span></span>
            <ChevronRight className="text-muted" size={20} />
          </button>
        )}
        {lists.map((l, i) => (
          <button key={l.id} onClick={() => nav(`/dua/list/${l.id}`)} className="tap card flex w-full items-center gap-4 p-3.5 text-left">
            <span className={`tile h-12 w-12 rounded-[10px] text-ink ${pastel(i + 1)}`}><ListPlus size={20} /></span>
            <span className="flex-1"><span className="block text-[16px] font-bold text-ink">{l.name}</span><span className="text-[13px] text-muted">{n(l.duaIds.length)}টি দোয়া</span></span>
            <ChevronRight className="text-muted" size={20} />
          </button>
        ))}
        {lists.length === 0 && favs.length === 0 && (
          <button onClick={() => setCreating(true)} className="w-full rounded-[10px] border-2 border-dashed border-line p-5 font-semibold text-muted">+ প্রথম তালিকা তৈরি করুন</button>
        )}
      </div>
      <NewListSheet open={creating} onClose={() => setCreating(false)} onCreated={(id) => nav(`/dua/list/${id}`)} />
    </div>
  );
}
