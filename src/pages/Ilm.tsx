import { useState } from 'react';
import { Copy, Search, Share2, ShieldCheck } from 'lucide-react';
import { PageHeader, Sheet, copyText, shareText } from '../components/ui';
import { asmaulHusna, type AllahName } from '../data/asmaulHusna';
import { hadithChapters, hadithCollection } from '../data/hadith';
import { ruqyahIntro, ruqyahSections } from '../data/ruqyah';
import { DuaCard } from './DuaPages';
import { useReadingTimer } from '../lib/hooks';
import { n } from '../lib/bn';

export function AsmaulHusnaPage() {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<AllahName | null>(null);
  const list = asmaulHusna.filter((a) => !q || a.bn.includes(q) || a.meaning.includes(q) || a.en.toLowerCase().includes(q.toLowerCase()) || a.arabic.includes(q));
  return (
    <div>
      <PageHeader back title="আসমাউল হুসনা" sub="আল্লাহর ৯৯টি সুন্দর নাম" />
      <div className="mx-4 mt-1 rounded-[28px] bg-sand px-5 py-5 text-center">
        <p className="font-ar text-2xl text-ink" dir="rtl">وَلِلَّهِ الْأَسْمَاءُ الْحُسْنَىٰ فَادْعُوهُ بِهَا</p>
        <p className="mt-1 text-sm text-muted">আর আল্লাহর জন্যই রয়েছে সুন্দর নামসমূহ, সুতরাং সেগুলোর মাধ্যমে তাঁকে ডাকো। — সূরা আল-আরাফ ৭:১৮০</p>
      </div>
      <div className="px-4 pb-2">
        <label className="flex items-center gap-2 rounded-2xl bg-surface px-4 shadow-card"><Search size={18} className="text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="নাম বা অর্থ খুঁজুন" className="w-full bg-transparent py-3 outline-none" /></label>
      </div>
      <div className="grid grid-cols-2 gap-3 p-4">
        {list.map((a) => (
          <button key={a.n} onClick={() => setSel(a)} className="tap relative card p-4 text-center shadow-sm">
            <span className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-chip text-xs text-brand">{n(a.n)}</span>
            <span className="font-ar mt-3 block text-3xl text-brand" dir="rtl">{a.arabic}</span>
            <span className="mt-2 block text-[17px] text-ink">{a.bn}</span>
            <span className="line-clamp-2 block text-sm text-muted">{a.meaning}</span>
          </button>
        ))}
      </div>
      <Sheet open={!!sel} onClose={() => setSel(null)} title={sel ? `${n(sel.n)}. ${sel.bn}` : ''}>
        {sel && (
          <div className="text-center">
            <p className="font-ar text-6xl text-brand" dir="rtl">{sel.arabic}</p>
            <p className="mt-4 text-xl text-ink">{sel.meaning}</p>
            <p className="text-muted">{sel.en} — {sel.meaningEn}</p>
            <div className="mt-5 flex justify-center gap-3">
              <button className="btn-soft" onClick={() => copyText(`${sel.arabic} — ${sel.bn}: ${sel.meaning}`)}><Copy size={18} /> কপি</button>
              <button className="btn-primary" onClick={() => shareText(sel.bn, `${sel.arabic}\n${sel.bn} — ${sel.meaning}`)}><Share2 size={18} /> শেয়ার</button>
            </div>
            <div className="mt-4 flex justify-between">
              <button disabled={sel.n === 1} className="text-brand disabled:opacity-30" onClick={() => setSel(asmaulHusna[sel.n - 2])}>‹ আগের</button>
              <button disabled={sel.n === 99} className="text-brand disabled:opacity-30" onClick={() => setSel(asmaulHusna[sel.n])}>পরের ›</button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}

export function HadithPage() {
  const [chapter, setChapter] = useState<string | null>(null);
  const [q, setQ] = useState('');
  useReadingTimer('duaSeconds');
  const list = hadithCollection.filter((h) => (!chapter || h.chapter === chapter) && (!q || h.bangla.includes(q) || h.narrator.includes(q) || h.chapter.includes(q)));
  const today = hadithCollection[Math.floor(Date.now() / 86400000) % hadithCollection.length];
  return (
    <div>
      <PageHeader back title="হাদিস" sub={`${n(hadithCollection.length)}টি নির্বাচিত হাদিস`} />
      <section className="m-4 rounded-[28px] bg-night shadow-float p-5 text-white">
        <div className="text-sm opacity-80">আজকের হাদিস</div>
        <p className="mt-2 text-lg leading-relaxed">{today.bangla}</p>
        <p className="mt-2 text-sm opacity-80">— {today.narrator} • {today.reference}</p>
      </section>
      <div className="px-4">
        <label className="flex items-center gap-2 rounded-2xl bg-surface px-4 shadow-card"><Search size={18} className="text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="হাদিস খুঁজুন" className="w-full bg-transparent py-3 outline-none" /></label>
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3">
        <button onClick={() => setChapter(null)} className={`shrink-0 rounded-full px-4 py-1.5 ${!chapter ? 'bg-night text-white' : 'bg-surface text-ink ring-1 ring-line'}`}>সব</button>
        {hadithChapters.map((c) => (
          <button key={c} onClick={() => setChapter(c)} className={`shrink-0 rounded-full px-4 py-1.5 ${chapter === c ? 'bg-night text-white' : 'bg-surface text-ink ring-1 ring-line'}`}>{c}</button>
        ))}
      </div>
      <div className="space-y-3 px-4 pb-4">
        {list.map((h) => {
          const text = `${h.arabic ? h.arabic + '\n\n' : ''}${h.bangla}\n— ${h.narrator}\n${h.reference}`;
          return (
            <article key={h.id} className="card p-5">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-chip px-3 py-0.5 text-sm text-brand">{h.chapter}</span>
                <span className="text-xs text-muted">#{n(h.id)}</span>
              </div>
              {h.arabic && <p className="arabic mt-3 text-right text-2xl text-ink">{h.arabic}</p>}
              <p className="mt-3 text-[17px] leading-relaxed text-ink">{h.bangla}</p>
              <p className="mt-3 text-sm text-muted">বর্ণনাকারী: {h.narrator}</p>
              <p className="text-sm text-muted">সূত্র: {h.reference}</p>
              <div className="mt-3 flex justify-end gap-4 text-muted">
                <button aria-label="copy" onClick={() => copyText(text)}><Copy size={18} /></button>
                <button aria-label="share" onClick={() => shareText('হাদিস', text)}><Share2 size={18} /></button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export function RuqyahPage() {
  const [open, setOpen] = useState<string | null>(ruqyahSections[0]?.id ?? null);
  useReadingTimer('duaSeconds');
  return (
    <div>
      <PageHeader back title="রুকইয়াহ" sub="কুরআন ও সুন্নাহভিত্তিক ঝাড়ফুঁক" />
      <section className="m-4 card p-5">
        <h3 className="flex items-center gap-2 text-lg text-brand"><ShieldCheck size={20} /> শরয়ী রুকইয়াহ কী?</h3>
        {ruqyahIntro.split('\n\n').map((p, i) => <p key={i} className="mt-3 text-[16px] leading-relaxed text-ink">{p}</p>)}
      </section>
      {ruqyahSections.map((s) => (
        <section key={s.id} className="page-card mb-3">
          <button onClick={() => setOpen(open === s.id ? null : s.id)} className="flex w-full items-center justify-between px-5 py-4 text-left">
            <span><span className="block text-xl text-ink">{s.title}</span><span className="text-sm text-muted">{s.description}</span></span>
            <span className="text-2xl text-brand">{open === s.id ? '−' : '+'}</span>
          </button>
          {open === s.id && s.items.map((d) => (
            <div key={d.id} className="border-t border-line">
              <h4 className="page-card px-5 pt-4 text-lg text-brand">{d.title}</h4>
              <DuaCard d={d} />
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
