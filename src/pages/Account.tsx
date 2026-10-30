import { useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Camera, ChevronRight, ImagePlus, Mail, MessageCircle, Send, Trash2, X } from 'lucide-react';
import { ListRow, PageHeader, Sheet, Toggle, toast } from '../components/ui';
import { Avatar, AVATARS } from '../components/Avatar';
import { LocationSheet } from '../components/LocationSheet';
import { useStore } from '../store/useStore';
import { METHODS } from '../lib/prayer';
import { formatHijri, toHijri } from '../lib/dates';
import { n } from '../lib/bn';

export const SUPPORT_EMAIL = 'support@amoltracker.app';

export function ProfileEdit() {
  const nav = useNavigate();
  const profile = useStore((s) => s.profile);
  const set = useStore((s) => s.set);
  const [form, setForm] = useState(profile);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = (f?: File) => {
    if (!f) return;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      const s = 256;
      c.width = s; c.height = s;
      const ctx = c.getContext('2d')!;
      const m = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, s, s);
      setForm((x) => ({ ...x, avatar: c.toDataURL('image/jpeg', 0.85) }));
    };
    img.src = URL.createObjectURL(f);
  };

  return (
    <div>
      <PageHeader back title="প্রোফাইল" />
      <div className="page-card mt-1 flex flex-col items-center py-6">
        <button className="relative" onClick={() => fileRef.current?.click()} aria-label="upload photo">
          <Avatar id={form.avatar} size={110} />
          <span className="absolute bottom-0 right-0 rounded-full bg-brand p-2 text-white"><Camera size={16} /></span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        <div className="mt-4 flex gap-3">
          {AVATARS.map((a) => (
            <button key={a} onClick={() => setForm({ ...form, avatar: a })} className={`rounded-full ring-2 ${form.avatar === a ? 'ring-brand' : 'ring-transparent'}`}>
              <Avatar id={a} size={48} />
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-4 p-5">
        <label className="block"><span className="mb-1 block text-sm text-muted">নাম</span>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label className="block"><span className="mb-1 block text-sm text-muted">ইমেইল</span>
          <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" /></label>
        <button className="btn-primary w-full" disabled={!form.name.trim()} onClick={() => { set('profile', { ...form, name: form.name.trim() }); toast('প্রোফাইল সংরক্ষিত হয়েছে'); nav(-1); }}>সংরক্ষণ করুন</button>
        <p className="text-center text-xs text-muted">আপনার সব তথ্য শুধু এই ডিভাইসেই সংরক্ষিত থাকে।</p>
      </div>
    </div>
  );
}

function Choice<T extends string | number>({ value, options, onChange }: { value: T; options: { v: T; l: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={String(o.v)} onClick={() => onChange(o.v)} className={`rounded-full px-4 py-1.5 ${value === o.v ? 'bg-night text-white' : 'bg-surface text-ink ring-1 ring-line'}`}>{o.l}</button>
      ))}
    </div>
  );
}

export function SettingsPage() {
  const nav = useNavigate();
  const s = useStore((st) => st.settings);
  const update = useStore((st) => st.updateSettings);
  const [loc, setLoc] = useState(false);
  const [method, setMethod] = useState(false);
  const [reset, setReset] = useState(false);

  const exportData = () => {
    const blob = new Blob([localStorage.getItem('amol-tracker') ?? '{}'], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `amol-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };
  const importData = (f?: File) => {
    if (!f) return;
    f.text().then((t) => {
      try {
        JSON.parse(t);
        localStorage.setItem('amol-tracker', t);
        toast('ব্যাকআপ রিস্টোর হয়েছে');
        setTimeout(() => window.location.reload(), 600);
      } catch { toast('ফাইলটি সঠিক নয়'); }
    });
  };

  return (
    <div>
      <PageHeader back title="সেটিংস" />
      <h3 className="label px-6 pb-2 pt-5">সাধারণ</h3>
      <div className="page-card">
        <ListRow title="লোকেশন" sub={`${s.place.bn} (${s.place.name})`} onClick={() => setLoc(true)} />
        <div className="px-5 py-4">
          <div className="mb-2 text-[17px] text-ink">ভাষা / Language</div>
          <Choice value={s.lang} onChange={(v) => update({ lang: v })} options={[{ v: 'bn', l: 'বাংলা' }, { v: 'en', l: 'English' }]} />
        </div>
        <div className="px-5 py-4">
          <div className="mb-2 text-[17px] text-ink">থিম</div>
          <Choice value={s.theme} onChange={(v) => update({ theme: v })} options={[{ v: 'light', l: 'লাইট' }, { v: 'dark', l: 'ডার্ক' }, { v: 'system', l: 'সিস্টেম' }]} />
        </div>
        <div className="flex items-center justify-between px-5 py-4">
          <span className="text-[17px] text-ink">২৪ ঘণ্টা সময় ফরম্যাট</span>
          <Toggle checked={s.time24} onChange={(v) => update({ time24: v })} />
        </div>
      </div>

      <h3 className="label px-6 pb-2 pt-5">নামাজের সময়</h3>
      <div className="page-card">
        <ListRow title="হিসাব পদ্ধতি" sub={METHODS.find((m) => m.id === s.method)?.bn} onClick={() => setMethod(true)} />
        <div className="px-5 py-4">
          <div className="mb-2 text-[17px] text-ink">আসরের মাযহাব</div>
          <Choice value={s.madhab} onChange={(v) => update({ madhab: v })} options={[{ v: 'hanafi', l: 'হানাফি' }, { v: 'shafi', l: 'শাফেয়ী / অন্যান্য' }]} />
        </div>
        <div className="px-5 py-4">
          <div className="mb-1 text-[17px] text-ink">হিজরি তারিখ সমন্বয়</div>
          <div className="mb-2 text-sm text-muted">আজ: {formatHijri(toHijri(new Date(), s.hijriAdjust), 'bn', true)}</div>
          <Choice value={s.hijriAdjust} onChange={(v) => update({ hijriAdjust: v })} options={[-2, -1, 0, 1, 2].map((v) => ({ v, l: v > 0 ? `+${n(v)}` : n(v) }))} />
        </div>
        <ListRow title="অ্যালার্ম ও নোটিফিকেশন" onClick={() => nav('/alarm')} />
      </div>

      <h3 className="label px-6 pb-2 pt-5">ডেটা</h3>
      <div className="page-card">
        <ListRow title="ব্যাকআপ ডাউনলোড করুন" sub="আমল, বুকমার্ক, তালিকা — JSON ফাইল" onClick={exportData} />
        <label className="flex w-full cursor-pointer items-center gap-4 px-5 py-4">
          <span className="flex-1"><span className="block text-[19px] text-ink">ব্যাকআপ রিস্টোর করুন</span><span className="block text-sm text-muted">আগের ব্যাকআপ ফাইল নির্বাচন করুন</span></span>
          <ChevronRight size={22} className="text-ink" />
          <input type="file" accept="application/json" hidden onChange={(e) => importData(e.target.files?.[0])} />
        </label>
        <ListRow title={<span className="text-red-600">সব ডেটা মুছে ফেলুন</span>} onClick={() => setReset(true)} />
      </div>

      <LocationSheet open={loc} onClose={() => setLoc(false)} />
      <Sheet open={method} onClose={() => setMethod(false)} title="হিসাব পদ্ধতি">
        {METHODS.map((m) => (
          <button key={m.id} onClick={() => { update({ method: m.id }); setMethod(false); }} className="flex w-full items-center justify-between border-b border-line py-3 text-left text-ink">
            <span>{m.bn}<span className="block text-xs text-muted">{m.en}</span></span>
            {s.method === m.id && <span className="text-brand">✓</span>}
          </button>
        ))}
      </Sheet>
      <Sheet open={reset} onClose={() => setReset(false)} title="সব ডেটা মুছবেন?">
        <p className="text-muted">আমল, বুকমার্ক, দোয়ার তালিকা, তাসবীহ গণনা ও সেটিংস সব মুছে যাবে। এটি ফিরিয়ে আনা যাবে না।</p>
        <button className="btn mt-4 w-full bg-red-600 text-white" onClick={() => { localStorage.removeItem('amol-tracker'); window.location.reload(); }}><Trash2 size={18} /> মুছে ফেলুন</button>
      </Sheet>
    </div>
  );
}

export function ContactPage() {
  const [params] = useSearchParams();
  const profile = useStore((s) => s.profile);
  const [type, setType] = useState(params.get('type') === 'feedback' ? 'মতামত' : 'জিজ্ঞাসা');
  const [msg, setMsg] = useState('');
  const send = () => {
    const subject = encodeURIComponent(`[আমল ট্র্যাকার] ${type}`);
    const body = encodeURIComponent(`${msg}\n\n— ${profile.name}${profile.email ? ` <${profile.email}>` : ''}`);
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    toast('ইমেইল অ্যাপ খোলা হচ্ছে…');
  };
  return (
    <div>
      <PageHeader back title="যোগাযোগ করুন" />
      <div className="space-y-4 p-5">
        <p className="text-muted">অ্যাপ সম্পর্কিত যেকোনো জিজ্ঞাসা, পরামর্শ ও মতামত আমাদের জানান। ইনশাআল্লাহ দ্রুত উত্তর দেওয়া হবে।</p>
        <Choice value={type} onChange={setType} options={['জিজ্ঞাসা', 'পরামর্শ', 'মতামত'].map((v) => ({ v, l: v }))} />
        <textarea className="input min-h-[160px]" placeholder="আপনার বার্তা লিখুন…" value={msg} onChange={(e) => setMsg(e.target.value)} />
        <button className="btn-primary w-full" disabled={msg.trim().length < 3} onClick={send}><Send size={18} /> পাঠান</button>
        <div className="card divide-y divide-line">
          <a href={`mailto:${SUPPORT_EMAIL}`} className="flex items-center gap-3 p-4 text-ink"><Mail className="text-brand" /> {SUPPORT_EMAIL}</a>
          <button onClick={() => window.open('https://wa.me/?text=' + encodeURIComponent('আমল ট্র্যাকার সম্পর্কে জানতে চাই'), '_blank')} className="flex w-full items-center gap-3 p-4 text-ink"><MessageCircle className="text-brand" /> হোয়াটসঅ্যাপে শেয়ার করুন</button>
        </div>
      </div>
    </div>
  );
}

export function ReportPage() {
  const nav = useNavigate();
  const reports = useStore((s) => s.reports);
  const set = useStore((s) => s.set);
  const [text, setText] = useState('');
  const [category, setCategory] = useState('বাগ / ত্রুটি');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const submit = async () => {
    const full = `[${category}] ${text.trim()}`;
    set('reports', [{ id: String(Date.now()), text: full, time: Date.now(), hasImage: !!image }, ...reports]);
    const deviceInfo = `\n\n---\nডিভাইস: ${navigator.userAgent}\nস্ক্রিন: ${window.innerWidth}x${window.innerHeight}`;
    if (image && navigator.canShare?.({ files: [image] })) {
      try { await navigator.share({ title: 'সমস্যা রিপোর্ট', text: full + deviceInfo, files: [image] }); } catch { /* cancelled */ }
    } else {
      window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('[আমল ট্র্যাকার] সমস্যা রিপোর্ট')}&body=${encodeURIComponent(full + deviceInfo + (image ? '\n\n(স্ক্রিনশটটি এই ইমেইলে সংযুক্ত করুন)' : ''))}`;
    }
    toast('রিপোর্ট জমা হয়েছে — জাযাকাল্লাহু খাইরান');
    nav(-1);
  };

  return (
    <div>
      <PageHeader back title="সমস্যা রিপোর্ট করুন" />
      <div className="space-y-4 p-5">
        <Choice value={category} onChange={setCategory} options={['বাগ / ত্রুটি', 'ভুল তথ্য', 'নামাজের সময়', 'অন্যান্য'].map((v) => ({ v, l: v }))} />
        <textarea className="input min-h-[150px]" placeholder="সমস্যাটি বিস্তারিত লিখুন — কোন পেজে, কী করার সময় ঘটেছে…" value={text} onChange={(e) => setText(e.target.value)} />
        {preview ? (
          <div className="relative inline-block">
            <img src={preview} alt="screenshot" className="max-h-60 rounded-xl border border-line" />
            <button aria-label="remove image" onClick={() => { setImage(null); setPreview(null); }} className="absolute -right-2 -top-2 rounded-full bg-ink p-1 text-surface"><X size={16} /></button>
          </div>
        ) : (
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand/40 p-6 text-brand">
            <ImagePlus /> স্ক্রিনশট যুক্ত করুন
            <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) { setImage(f); setPreview(URL.createObjectURL(f)); } }} />
          </label>
        )}
        <button className="btn-primary w-full" disabled={text.trim().length < 5} onClick={submit}><Send size={18} /> রিপোর্ট পাঠান</button>
        {reports.length > 0 && (
          <div>
            <h3 className="mb-2 mt-4 text-sm text-muted">আপনার আগের রিপোর্ট</h3>
            {reports.map((r) => (
              <div key={r.id} className="mb-2 rounded-xl bg-surface p-3 text-sm text-ink">{r.text}<div className="mt-1 text-xs text-muted">{new Date(r.time).toLocaleString('bn-BD')}{r.hasImage && ' • স্ক্রিনশট সহ'}</div></div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function AboutPage() {
  return (
    <div>
      <PageHeader back title="আমাদের সম্পর্কে" />
      <div className="space-y-4 p-5 text-ink">
        <div className="flex flex-col items-center py-4">
          <img src="./icon.svg" alt="" className="h-20 w-20 rounded-2xl" />
          <h2 className="mt-3 text-2xl">আমল ট্র্যাকার</h2>
          <p className="text-muted">সংস্করণ {n('1.0.0')}</p>
        </div>
        <p>আমল ট্র্যাকার একটি পূর্ণাঙ্গ ইসলামিক সহায়ক অ্যাপ — নামাজের সময়সূচি, পূর্ণ কুরআন (আরবি ও বাংলা অনুবাদ), তাফসীর, দোয়া ও যিকর, আসমাউল হুসনা, হাদিস, রুকইয়াহ, কিবলা, তাসবীহ, যাকাত ক্যালকুলেটর, হজ্জ-উমরাহ গাইড এবং দৈনিক আমল ট্র্যাকার।</p>
        <h3 className="pt-2 text-lg">প্রাইভেসি পলিসি</h3>
        <p className="text-muted">আপনার সব তথ্য (আমল, প্রোফাইল, বুকমার্ক) কেবল আপনার ডিভাইসে সংরক্ষিত হয়; কোনো সার্ভারে পাঠানো হয় না। লোকেশন শুধু নামাজের সময়, কিবলা ও নিকটস্থ মসজিদ খুঁজতে ব্যবহৃত হয়।</p>
        <h3 className="pt-2 text-lg">কৃতজ্ঞতা</h3>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
          <li>কুরআনের টেক্সট ও বাংলা অনুবাদ: quran-json (CC BY 4.0)</li>
          <li>নামাজের সময় হিসাব: adhan-js</li>
          <li>তিলাওয়াত অডিও: Islamic Network CDN</li>
          <li>তাফসীর: Quran.com API</li>
          <li>নিকটস্থ মসজিদ: OpenStreetMap</li>
        </ul>
      </div>
    </div>
  );
}
