import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, ChevronRight, Copy, Heart, ListPlus, Pencil, Search, Share2, Trash2, Plus, Minus, RotateCcw } from 'lucide-react';
import { Empty, PageHeader, Sheet, copyText, shareText, toast } from '../components/ui';
import { useStore } from '../store/useStore';
import { allDuas, duaCategories, type Dua } from '../data/duas';
import { useReadingTimer } from '../lib/hooks';
import { n } from '../lib/bn';
import { NewListSheet } from './Dua';

function DuaListItem({ d, index, onClick }: { d: Dua; index?: number; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-4 border-b border-line bg-surface px-5 py-4 text-left active:bg-bg">
      {index !== undefined && <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-chip text-brand">{n(index + 1)}</span>}
      <span className="min-w-0 flex-1">
        <span className="block text-[19px] text-ink">{d.title}</span>
        <span className="font-ar mt-1 block truncate text-right text-lg text-muted" dir="rtl">{d.arabic}</span>
      </span>
      <ChevronRight className="shrink-0 text-muted" size={20} />
    </button>
  );
}

export function DuaCategoryPage() {
  const { cat } = useParams();
  const nav = useNavigate();
  const c = duaCategories.find((x) => x.id === cat);
  if (!c) return <Empty title="বিভাগ পাওয়া যায়নি" />;
  return (
    <div>
      <PageHeader back title={c.title} sub={`${n(c.duas.length)}টি দোয়া`} />
      <p className="px-5 py-4 text-muted">{c.subtitle}</p>
      {c.duas.map((d, i) => <DuaListItem key={d.id} d={d} index={i} onClick={() => nav(`/dua/d/${d.id}`)} />)}
    </div>
  );
}

function Counter({ target }: { target: number }) {
  const [c, setC] = useState(0);
  const done = c >= target;
  return (
    <div className="mt-4 flex items-center justify-between rounded-2xl bg-chip px-4 py-3">
      <span className="text-ink">পাঠ করুন {n(target)} বার</span>
      <div className="flex items-center gap-3">
        <button aria-label="reset" onClick={() => setC(0)} className="text-muted"><RotateCcw size={18} /></button>
        <button onClick={() => { if (!done) { setC(c + 1); navigator.vibrate?.(15); } }}
          className={`tap flex h-12 min-w-12 items-center justify-center rounded-full px-3 text-lg text-white ${done ? 'bg-brand-dark' : 'bg-brand'}`}>
          {done ? <Check /> : `${n(c)}/${n(target)}`}
        </button>
      </div>
    </div>
  );
}

export function DuaCard({ d }: { d: Dua }) {
  return (
    <div className="bg-surface px-5 py-6">
      <p className="arabic text-right text-[28px] text-ink">{d.arabic}</p>
      <h4 className="mt-5 text-sm text-brand">উচ্চারণ</h4>
      <p className="mt-1 text-[18px] leading-relaxed text-ink">{d.transliteration}</p>
      <h4 className="mt-4 text-sm text-brand">অর্থ</h4>
      <p className="mt-1 text-[18px] leading-relaxed text-ink">{d.meaning}</p>
      {d.note && <p className="mt-4 rounded-2xl bg-bg p-4 text-[15px] leading-relaxed text-ink/80">{d.note}</p>}
      <p className="mt-4 text-sm text-muted">সূত্র: {d.reference}</p>
      {d.count && d.count > 1 && <Counter target={d.count} />}
    </div>
  );
}

export function DuaDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const d = allDuas.find((x) => x.id === id);
  const favs = useStore((s) => s.favoriteDuas);
  const lists = useStore((s) => s.duaLists);
  const set = useStore((s) => s.set);
  const [pick, setPick] = useState(false);
  const [creating, setCreating] = useState(false);
  useReadingTimer('duaSeconds');
  if (!d) return <Empty title="দোয়া পাওয়া যায়নি" />;
  const cat = duaCategories.find((c) => c.duas.some((x) => x.id === d.id))!;
  const idx = cat.duas.findIndex((x) => x.id === d.id);
  const fav = favs.includes(d.id);
  const text = `${d.title}\n\n${d.arabic}\n\nউচ্চারণ: ${d.transliteration}\n\nঅর্থ: ${d.meaning}\n\nসূত্র: ${d.reference}`;

  return (
    <div>
      <PageHeader back title={d.title} sub={cat.title} />
      <DuaCard d={d} />
      <div className="grid grid-cols-4 border-y border-line bg-surface">
        {[
          { icon: <Heart size={22} fill={fav ? 'currentColor' : 'none'} className={fav ? 'text-alert' : ''} />, label: 'প্রিয়', go: () => { set('favoriteDuas', fav ? favs.filter((x) => x !== d.id) : [...favs, d.id]); toast(fav ? 'প্রিয় থেকে সরানো হয়েছে' : 'প্রিয় তালিকায় যোগ হয়েছে'); } },
          { icon: <ListPlus size={22} />, label: 'তালিকায়', go: () => setPick(true) },
          { icon: <Copy size={22} />, label: 'কপি', go: () => copyText(text) },
          { icon: <Share2 size={22} />, label: 'শেয়ার', go: () => shareText(d.title, text) },
        ].map((a) => (
          <button key={a.label} onClick={a.go} className="tap flex flex-col items-center gap-1 py-4 text-ink">{a.icon}<span className="text-sm">{a.label}</span></button>
        ))}
      </div>
      <div className="flex gap-3 p-5">
        <button disabled={idx <= 0} onClick={() => nav(`/dua/d/${cat.duas[idx - 1].id}`, { replace: true })} className="btn-soft flex-1 disabled:opacity-40">পূর্ববর্তী</button>
        <button disabled={idx >= cat.duas.length - 1} onClick={() => nav(`/dua/d/${cat.duas[idx + 1].id}`, { replace: true })} className="btn-primary flex-1 disabled:opacity-40">পরবর্তী</button>
      </div>

      <Sheet open={pick} onClose={() => setPick(false)} title="তালিকায় যোগ করুন">
        {lists.map((l) => {
          const has = l.duaIds.includes(d.id);
          return (
            <button key={l.id} className="flex w-full items-center justify-between border-b border-line py-3 text-left text-lg text-ink" onClick={() => {
              set('duaLists', lists.map((x) => (x.id === l.id ? { ...x, duaIds: has ? x.duaIds.filter((i) => i !== d.id) : [...x.duaIds, d.id] } : x)));
              toast(has ? 'তালিকা থেকে সরানো হয়েছে' : `"${l.name}" এ যোগ হয়েছে`);
            }}>
              {l.name} {has && <Check className="text-brand" />}
            </button>
          );
        })}
        <button className="btn-soft mt-4 w-full" onClick={() => setCreating(true)}><Plus size={18} /> নতুন তালিকা</button>
      </Sheet>
      <NewListSheet open={creating} onClose={() => setCreating(false)} onCreated={(lid) => {
        const st = useStore.getState();
        st.set('duaLists', st.duaLists.map((x) => (x.id === lid ? { ...x, duaIds: [...x.duaIds, d.id] } : x)));
      }} />
    </div>
  );
}

export function DuaSearch() {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const query = q.trim();
  const hits = query ? allDuas.filter((d) => [d.title, d.meaning, d.transliteration, d.arabic, d.reference].some((f) => f.includes(query))) : [];
  return (
    <div>
      <PageHeader back title="দোয়া খুঁজুন" />
      <div className="sticky top-[72px] z-20 bg-bg p-4">
        <label className="flex items-center gap-2 rounded-2xl bg-surface px-4 shadow-sm">
          <Search className="text-muted" size={20} />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="যেমন: ঘুম, খাওয়া, সফর" className="w-full bg-transparent py-3.5 text-lg text-ink outline-none" />
        </label>
        {!query && (
          <div className="mt-3 flex flex-wrap gap-2">
            {['ঘুম', 'খাওয়া', 'সফর', 'অজু', 'মসজিদ', 'ইফতার', 'ক্ষমা', 'ঋণ'].map((s) => <button key={s} onClick={() => setQ(s)} className="rounded-full bg-chip px-4 py-1.5 text-brand">{s}</button>)}
          </div>
        )}
      </div>
      {hits.map((d) => <DuaListItem key={d.id} d={d} onClick={() => nav(`/dua/d/${d.id}`)} />)}
      {query && !hits.length && <Empty icon={<Search size={36} />} title="কোনো দোয়া পাওয়া যায়নি" />}
    </div>
  );
}

export function DuaListPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const lists = useStore((s) => s.duaLists);
  const favs = useStore((s) => s.favoriteDuas);
  const set = useStore((s) => s.set);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const isFav = id === 'favorites';
  const list = isFav ? { id: 'favorites', name: 'প্রিয় দোয়া', duaIds: favs } : lists.find((l) => l.id === id);
  if (!list) return <div><PageHeader back title="তালিকা" /><Empty title="তালিকা পাওয়া যায়নি" /></div>;
  const duas = list.duaIds.map((i) => allDuas.find((d) => d.id === i)).filter(Boolean) as Dua[];
  const update = (duaIds: string[]) => (isFav ? set('favoriteDuas', duaIds) : set('duaLists', lists.map((l) => (l.id === list.id ? { ...l, duaIds } : l))));

  return (
    <div>
      <PageHeader back title={list.name} sub={`${n(duas.length)}টি দোয়া`} right={!isFav && (
        <>
          <button aria-label="rename" onClick={() => { setName(list.name); setRenaming(true); }} className="tap p-2 text-ink"><Pencil size={20} /></button>
          <button aria-label="delete list" onClick={() => setDeleting(true)} className="tap p-2 text-ink"><Trash2 size={20} /></button>
        </>
      )} />
      {duas.length === 0 ? (
        <Empty icon={<ListPlus size={36} />} title="তালিকাটি খালি" sub="দোয়া যোগ করতে নিচের বাটনে চাপুন" />
      ) : duas.map((d) => (
        <div key={d.id} className="flex items-center bg-surface">
          <div className="flex-1"><DuaListItem d={d} onClick={() => nav(`/dua/d/${d.id}`)} /></div>
          <button aria-label="remove" onClick={() => update(list.duaIds.filter((x) => x !== d.id))} className="border-b border-line p-[26px] text-muted"><Minus size={18} /></button>
        </div>
      ))}
      <div className="p-5"><button className="btn-primary w-full" onClick={() => setAdding(true)}><Plus size={18} /> দোয়া যোগ করুন</button></div>

      <Sheet open={deleting} onClose={() => setDeleting(false)} title="তালিকাটি মুছে ফেলবেন?">
        <p className="text-muted">"{list.name}" তালিকাটি মুছে যাবে। দোয়াগুলো অ্যাপে থেকে যাবে।</p>
        <div className="mt-4 flex gap-3">
          <button className="btn-soft flex-1" onClick={() => setDeleting(false)}>বাতিল</button>
          <button className="btn flex-1 bg-red-600 text-white" onClick={() => { set('duaLists', lists.filter((l) => l.id !== list.id)); nav('/dua'); toast('তালিকা মুছে ফেলা হয়েছে'); }}>মুছে ফেলুন</button>
        </div>
      </Sheet>
      <Sheet open={renaming} onClose={() => setRenaming(false)} title="নাম পরিবর্তন">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn-primary mt-4 w-full" disabled={!name.trim()} onClick={() => { set('duaLists', lists.map((l) => (l.id === list.id ? { ...l, name: name.trim() } : l))); setRenaming(false); }}>সংরক্ষণ করুন</button>
      </Sheet>
      <Sheet open={adding} onClose={() => setAdding(false)} title="দোয়া নির্বাচন করুন">
        {duaCategories.map((c) => (
          <div key={c.id} className="mb-3">
            <div className="py-2 text-sm text-muted">{c.title}</div>
            {c.duas.map((d) => {
              const has = list.duaIds.includes(d.id);
              return (
                <button key={d.id} onClick={() => update(has ? list.duaIds.filter((x) => x !== d.id) : [...list.duaIds, d.id])}
                  className="flex w-full items-center justify-between border-b border-line py-3 text-left text-ink">
                  {d.title} <span className={`flex h-6 w-6 items-center justify-center rounded-md border-2 ${has ? 'border-brand bg-brand text-white' : 'border-line'}`}>{has && <Check size={16} />}</span>
                </button>
              );
            })}
          </div>
        ))}
      </Sheet>
    </div>
  );
}
