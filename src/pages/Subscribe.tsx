import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Crown, ShieldCheck } from 'lucide-react';
import { PageHeader, Sheet, toast } from '../components/ui';
import { useStore } from '../store/useStore';
import { n } from '../lib/bn';

const PLANS = [
  { id: 'yearly' as const, title: 'বার্ষিক', price: 449, old: 1188, per: '/বছর', badge: '৬৩% ছাড়', note: 'মাসে মাত্র ৳৩৭' },
  { id: 'monthly' as const, title: 'মাসিক', price: 99, old: 0, per: '/মাস', badge: '', note: 'যেকোনো সময় বাতিল করুন' },
];

const FEATURES = [
  'কিবলা কম্পাস',
  'ডিজিটাল তাসবীহ — লক্ষ্য, ইতিহাস ও কাস্টম যিকর',
  'হজ্জ ও উমরাহ গাইড',
  'নামাজে সাইলেন্ট মোড রিমাইন্ডার',
  "২০টি পর্যন্ত দু'আ কালেকশন তালিকা",
  'ভবিষ্যতের সব প্রিমিয়াম ফিচার',
];

export default function Subscribe() {
  const nav = useNavigate();
  const premium = useStore((s) => s.premium);
  const set = useStore((s) => s.set);
  const [plan, setPlan] = useState<'yearly' | 'monthly'>('yearly');
  const [pay, setPay] = useState(false);
  const [method, setMethod] = useState('বিকাশ');
  const [phone, setPhone] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);
  const selected = PLANS.find((p) => p.id === plan)!;

  if (premium.active && premium.plan !== 'trial') {
    return (
      <div>
        <PageHeader back title="পৃষ্ঠপোষকতা" />
        <div className="flex flex-col items-center p-8 text-center">
          <span className="flex h-24 w-24 items-center justify-center rounded-3xl bg-night text-gold"><Crown size={52} fill="currentColor" /></span>
          <h2 className="mt-5 text-2xl text-ink">জাযাকাল্লাহু খাইরান!</h2>
          <p className="mt-2 text-muted">আপনি {premium.plan === 'yearly' ? 'বার্ষিক' : 'মাসিক'} পৃষ্ঠপোষক{premium.since && ` (${new Date(premium.since).toLocaleDateString('bn-BD')} থেকে)`}। সব প্রিমিয়াম ফিচার আনলক করা আছে।</p>
          <button className="btn-soft mt-8" onClick={() => setCancelOpen(true)}>সাবস্ক্রিপশন বাতিল করুন</button>
          <Sheet open={cancelOpen} onClose={() => setCancelOpen(false)} title="সাবস্ক্রিপশন বাতিল করবেন?">
            <p className="text-left text-muted">বাতিল করলে প্রিমিয়াম ফিচারগুলো লক হয়ে যাবে।</p>
            <div className="mt-4 flex gap-3">
              <button className="btn-soft flex-1" onClick={() => setCancelOpen(false)}>না, রাখুন</button>
              <button className="btn flex-1 bg-red-600 text-white" onClick={() => { set('premium', { active: false }); setCancelOpen(false); toast('সাবস্ক্রিপশন বাতিল হয়েছে'); }}>বাতিল করুন</button>
            </div>
          </Sheet>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader back title="পৃষ্ঠপোষক হোন" />
      <div className="grad-sunrise mx-5 mt-1 rounded-[32px] px-6 pb-7 pt-6 text-white shadow-float">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-night text-gold"><Crown size={36} fill="currentColor" /></span>
        <h2 className="mt-4 text-[24px] font-extrabold leading-tight text-white">আরো আপন হোক আপনার ইবাদতের সঙ্গী</h2>
        <p className="mt-2 text-white/90">আপনার সহযোগিতায় অ্যাপটি নির্ভুল ও আরও সমৃদ্ধ হবে ইনশাআল্লাহ।</p>
        {premium.plan === 'trial' && premium.since && <p className="mt-3 rounded-xl bg-white/15 p-3 text-sm">আপনার ফ্রি ট্রায়াল চলছে — {n(Math.max(0, 7 - Math.floor((Date.now() - premium.since) / 86400000)))} দিন বাকি।</p>}
      </div>
      <div className="space-y-3 p-5">
        {PLANS.map((p) => (
          <button key={p.id} onClick={() => setPlan(p.id)} className={`relative flex w-full items-center gap-4 rounded-2xl border-2 bg-surface p-5 text-left ${plan === p.id ? 'border-brand' : 'border-line'}`}>
            <span className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${plan === p.id ? 'border-brand bg-brand text-white' : 'border-line'}`}>{plan === p.id && <Check size={14} />}</span>
            <span className="flex-1">
              <span className="block text-xl text-ink">{p.title}</span>
              <span className="text-sm text-muted">{p.note}</span>
            </span>
            <span className="text-right">
              {p.old > 0 && <span className="block text-sm text-muted line-through">৳{n(p.old)}</span>}
              <span className="text-2xl text-ink">৳{n(p.price)}</span><span className="text-sm text-muted">{p.per}</span>
            </span>
            {p.badge && <span className="absolute -top-3 right-4 rounded-full bg-alert px-3 py-0.5 text-sm text-white">{p.badge}</span>}
          </button>
        ))}
        <ul className="space-y-2.5 card p-5">
          {FEATURES.map((f) => <li key={f} className="flex items-start gap-3 text-ink"><Check className="mt-0.5 shrink-0 text-brand" size={20} />{f}</li>)}
        </ul>
        <button className="btn-primary w-full py-3.5 text-lg" onClick={() => setPay(true)}>৳{n(selected.price)} দিয়ে সাবস্ক্রাইব করুন</button>
        <p className="flex items-center justify-center gap-1 text-xs text-muted"><ShieldCheck size={14} /> নিরাপদ পেমেন্ট • যেকোনো সময় বাতিলযোগ্য</p>
      </div>

      <Sheet open={pay} onClose={() => setPay(false)} title="পেমেন্ট">
        <p className="text-muted">{selected.title} প্যাকেজ — ৳{n(selected.price)}</p>
        <div className="my-4 grid grid-cols-3 gap-2">
          {['বিকাশ', 'নগদ', 'কার্ড'].map((m) => (
            <button key={m} onClick={() => setMethod(m)} className={`rounded-xl border-2 py-3 ${method === m ? 'border-brand bg-chip text-brand' : 'border-line text-ink'}`}>{m}</button>
          ))}
        </div>
        <input className="input" inputMode="numeric" placeholder={method === 'কার্ড' ? 'কার্ড নম্বর' : '০১XXXXXXXXX'} value={phone} onChange={(e) => setPhone(e.target.value)} />
        <p className="mt-2 text-xs text-muted">ডেমো সংস্করণ: কোনো টাকা কাটা হবে না। আসল পেমেন্ট গেটওয়ে যুক্ত করতে কেবল এই ধাপটি পরিবর্তন করতে হবে।</p>
        <button className="btn-primary mt-4 w-full" disabled={phone.replace(/\D/g, '').length < 6 && !/[০-৯]{6,}/.test(phone)} onClick={() => {
          set('premium', { active: true, plan, since: Date.now() });
          setPay(false);
          toast('আলহামদুলিল্লাহ! আপনি এখন পৃষ্ঠপোষক');
          nav(-1);
        }}>পেমেন্ট নিশ্চিত করুন</button>
      </Sheet>
    </div>
  );
}
