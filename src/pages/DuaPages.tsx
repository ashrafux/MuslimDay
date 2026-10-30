import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, ChevronRight, Copy, Heart, ListPlus, Pencil, Search, Share2, Trash2, Plus, Minus, RotateCcw } from 'lucide-react';
import { Empty, IconButton, PageHeader, Sheet, copyText, pastel, shareText, toast } from '../components/ui';
import { useStore } from '../store/useStore';
import { allDuas, duaCategories, type Dua } from '../data/duas';
import { useReadingTimer } from '../lib/hooks';
import { n } from '../lib/bn';
import { NewListSheet } from './Dua';

function DuaListItem({ d, index, onClick }: { d: Dua; index?: number; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3.5 border-b border-line px-4 py-3.5 text-left last:border-0 active:bg-bg">
      {index !== undefined && <span className={`tile h-11 w-11 shrink-0 rounded-[10px] text-[14px] font-bold text-ink ${pastel(index)}`}>{n(index + 1)}</span>}
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-bold text-ink">{d.title}</span>
        <span className="font-ar mt-0.5 block truncate text-right text-[17px] text-muted" dir="rtl">{d.arabic}</span>
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
      <p className="px-5 pb-3 pt-1 text-[14px] text-muted">{c.subtitle}</p>
      <div className="page-card">{c.duas.map((d, i) => <DuaListItem key={d.id} d={d} index={i} onClick={() => nav(`/dua/d/${d.id}`)} />)}</div>
    </div>
  );
}

function Counter({ target }: { target: number }) {
  const [c, setC] = useState(0);
  const done = c >= target;
  return (
    <div className="mt-4 flex items-center justify-between rounded-[10px] bg-lav px-4 py-3">
      <span className="font-semibold text-ink">পাঠ করুন {n(target)} বার</span>
      <div className="flex items-center gap-3">
        <button aria-label="reset" onClick={() => setC(0)} className="text-muted"><RotateCcw size={18} /></button>
        <button onClick={() => { if (!done) { setC(c + 1); navigator.vibrate?.(15); } }}
          className={`tap flex h-12 min-w-12 items-center justify-center rounded-[10px] px-4 text-[16px] font-bold text-white ${done ? 'bg-m-green' : 'bg-night'}`}>
          {done ? <Check /> : `${n(c)}/${n(target)}`}
        </button>
      </div>
    </div>
  );
}

export function DuaCard({ d }: { d: Dua }) {
  return (
    <div className="px-5 py-5">
      <div className="rounded-[10px] bg-sand px-4 py-5">
        <p className="arabic text-right text-[27px] text-ink">{d.arabic}</p>
      </div>
      <h4 className="label mt-5">উচ্চারণ</h4>
      <p className="mt-1 text-[16px] leading-relaxed text-ink">{d.transliteration}</p>
      <h4 className="label mt-4">অর্থ</h4>
      <p className="mt-1 text-[16px] leading-relaxed text-ink">{d.meaning}</p>
      {d.note && <p className="mt-4 rounded-[10px] bg-sky p-4 text-[14px] leading-relaxed text-ink/85">{d.note}</p>}
      <p className="mt-4 inline-block rounded-[10px] bg-chip px-2.5 py-1 text-[12px] font-semibold text-muted">সূত্র: {d.reference}</p>
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
      <div className="page-card mt-1"><DuaCard d={d} /></div>
      <div className="page-card mt-3 grid grid-cols-4">
        {[
          { icon: <Heart size={22} fill={fav ? 'currentColor' : 'none'} className={fav ? 'text-alert' : ''} />, label: 'প্রিয়', go: () => { set('favoriteDuas', fav ? favs.filter((x) => x !== d.id) : [...favs, d.id]); toast(fav ? 'প্রিয় থেকে সরানো হয়েছে' : 'প্রিয় তালিকায় যোগ হয়েছে'); } },
          { icon: <ListPlus size={22} />, label: 'তালিকায়', go: () => setPick(true) },
          { icon: <Copy size={22} />, label: 'কপি', go: () => copyText(text) },
          { icon: <Share2 size={22} />, label: 'শেয়ার', go: () => shareText(d.title, text) },
        ].map((a) => (
          <button key={a.label} onClick={a.go} className="tap flex flex-col items-center gap-1.5 py-3.5 text-ink">{a.icon}<span className="text-[12px] font-semibold">{a.label}</span></button>
        ))}
      </div>
      <div className="flex gap-3 px-5 py-4">
        <button disabled={idx <= 0} onClick={() => nav(`/dua/d/${cat.duas[idx - 1].id}`, { replace: true })} className="btn-soft flex-1 disabled:opacity-40">পূর্ববর্তী</button>
        <button disabled={idx >= cat.duas.length - 1} onClick={() => nav(`/dua/d/${cat.duas[idx + 1].id}`, { replace: true })} className="btn-dark flex-1 disabled:opacity-40">পরবর্তী</button>
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
      <div className="sticky top-[64px] z-20 bg-bg px-5 pb-3 pt-1">
        <label className="flex items-center gap-2 rounded-[10px] bg-surface px-4 shadow-card">
          <Search className="text-muted" size={20} />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="যেমন: ঘুম, খাওয়া, সফর" className="w-full bg-transparent py-3.5 text-[16px] text-ink outline-none" />
        </label>
        {!query && (
          <div className="mt-3 flex flex-wrap gap-2">
            {['ঘুম', 'খাওয়া', 'সফর', 'অজু', 'মসজিদ', 'ইফতার', 'ক্ষমা', 'ঋণ'].map((s) => <button key={s} onClick={() => setQ(s)} className="pill pill-off">{s}</button>)}
          </div>
        )}
      </div>
      {hits.length > 0 && <div className="page-card">{hits.map((d) => <DuaListItem key={d.id} d={d} onClick={() => nav(`/dua/d/${d.id}`)} />)}</div>}
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
          <IconButton label="rename" onClick={() => { setName(list.name); setRenaming(true); }}><Pencil size={17} /></IconButton>
          <IconButton label="delete list" onClick={() => setDeleting(true)}><Trash2 size={17} /></IconButton>
        </>
      )} />
      {duas.length === 0 ? (
        <Empty icon={<ListPlus size={36} />} title="তালিকাটি খালি" sub="দোয়া যোগ করতে নিচের বাটনে চাপুন" />
      ) : (
        <div className="page-card">
          {duas.map((d) => (
            <div key={d.id} className="flex items-center border-b border-line last:border-0">
              <div className="min-w-0 flex-1 [&>button]:border-0"><DuaListItem d={d} onClick={() => nav(`/dua/d/${d.id}`)} /></div>
              <button aria-label="remove" onClick={() => update(list.duaIds.filter((x) => x !== d.id))} className="tap mr-3 flex h-9 w-9 items-center justify-center rounded-[10px] bg-rose text-ink"><Minus size={16} /></button>
            </div>
          ))}
        </div>
      )}
      <div className="px-5 py-4"><button className="btn-primary w-full" onClick={() => setAdding(true)}><Plus size={18} /> দোয়া যোগ করুন</button></div>

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
                  {d.title} <span className={`flex h-6 w-6 items-center justify-center rounded-[10px] border-2 ${has ? 'border-brand bg-brand text-white' : 'border-line'}`}>{has && <Check size={16} />}</span>
                </button>
              );
            })}
          </div>
        ))}
      </Sheet>
    </div>
  );
}
