import { useState } from 'react';
import { Info } from 'lucide-react';
import { PageHeader, Segmented, shareText } from '../components/ui';
import { n } from '../lib/bn';

const GOLD_NISAB_G = 87.48; // 7.5 tola
const SILVER_NISAB_G = 612.36; // 52.5 tola

type Field = { key: string; label: string; hint?: string };
const ASSETS: Field[] = [
  { key: 'cash', label: 'হাতে নগদ টাকা' },
  { key: 'bank', label: 'ব্যাংক / মোবাইল ব্যাংকিং ব্যালেন্স' },
  { key: 'goldG', label: 'স্বর্ণ (গ্রাম)', hint: 'গহনাসহ' },
  { key: 'silverG', label: 'রুপা (গ্রাম)' },
  { key: 'business', label: 'ব্যবসায়িক পণ্যের বাজারমূল্য' },
  { key: 'receivable', label: 'পাওনা (যা ফেরত পাওয়ার আশা আছে)' },
  { key: 'investment', label: 'শেয়ার / বিনিয়োগ / সঞ্চয়পত্র' },
  { key: 'other', label: 'অন্যান্য যাকাতযোগ্য সম্পদ' },
];
const LIABS: Field[] = [
  { key: 'debt', label: 'পরিশোধযোগ্য ঋণ (এখন দেয়)' },
  { key: 'bills', label: 'বকেয়া বিল / খরচ' },
];

export default function Zakat() {
  const [v, setV] = useState<Record<string, string>>({});
  const [goldPrice, setGoldPrice] = useState('14500');
  const [silverPrice, setSilverPrice] = useState('180');
  const [basis, setBasis] = useState<'silver' | 'gold'>('silver');
  const num = (k: string) => Math.max(0, Number(String(v[k] ?? '').replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)))) || 0);
  const gp = Number(goldPrice) || 0;
  const sp = Number(silverPrice) || 0;

  const assets = num('cash') + num('bank') + num('goldG') * gp + num('silverG') * sp + num('business') + num('receivable') + num('investment') + num('other');
  const liab = num('debt') + num('bills');
  const net = Math.max(0, assets - liab);
  const nisab = basis === 'silver' ? SILVER_NISAB_G * sp : GOLD_NISAB_G * gp;
  const due = net >= nisab && nisab > 0;
  const zakat = due ? net * 0.025 : 0;
  const money = (x: number) => `৳${n(Math.round(x).toLocaleString('en-IN'))}`;

  const input = (f: Field) => (
    <label key={f.key} className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
      <span className="text-[16px] text-ink">{f.label}{f.hint && <span className="block text-xs text-muted">{f.hint}</span>}</span>
      <input inputMode="decimal" value={v[f.key] ?? ''} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} placeholder="০" className="w-32 rounded-lg border border-line bg-bg px-3 py-2 text-right text-ink outline-none focus:border-brand" />
    </label>
  );

  return (
    <div>
      <PageHeader back title="যাকাত ক্যালকুলেটর" />
      <section className="m-4 rounded-[28px] bg-night shadow-float p-5 text-white">
        <div className="text-sm opacity-80">প্রদেয় যাকাত (২.৫%)</div>
        <div className="mt-1 text-4xl">{money(zakat)}</div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl bg-white/15 p-2">নিট সম্পদ<br /><span className="text-lg">{money(net)}</span></div>
          <div className="rounded-xl bg-white/15 p-2">নিসাব ({basis === 'silver' ? 'রুপা' : 'স্বর্ণ'})<br /><span className="text-lg">{money(nisab)}</span></div>
        </div>
        <div className="mt-3 text-sm">{nisab <= 0 ? 'স্বর্ণ/রুপার দাম দিন' : due ? 'আপনার উপর যাকাত ফরজ হয়েছে (যদি এক চন্দ্র বছর পূর্ণ হয়)।' : 'আপনার সম্পদ নিসাব পরিমাণ নয় — যাকাত ফরজ নয়।'}</div>
      </section>

      <section className="page-card px-5 py-4">
        <div className="mb-3 text-ink">নিসাবের ভিত্তি</div>
        <Segmented value={basis} onChange={setBasis} options={[{ value: 'silver', label: 'রুপা (৫২.৫ ভরি)' }, { value: 'gold', label: 'স্বর্ণ (৭.৫ ভরি)' }]} />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="text-sm text-muted">স্বর্ণ ৳/গ্রাম<input inputMode="decimal" className="input mt-1" value={goldPrice} onChange={(e) => setGoldPrice(e.target.value)} /></label>
          <label className="text-sm text-muted">রুপা ৳/গ্রাম<input inputMode="decimal" className="input mt-1" value={silverPrice} onChange={(e) => setSilverPrice(e.target.value)} /></label>
        </div>
        <p className="mt-2 flex gap-1 text-xs text-muted"><Info size={14} className="shrink-0" /> আজকের বাজারদর অনুযায়ী দাম পরিবর্তন করুন। আলেমগণ সাধারণত গরিবদের সুবিধার্থে রুপার নিসাব অনুসরণের পরামর্শ দেন।</p>
      </section>

      <h3 className="label px-6 pb-2 pt-5">সম্পদ</h3>
      <section className="page-card">{ASSETS.map(input)}</section>
      <h3 className="label px-6 pb-2 pt-5">দায়</h3>
      <section className="page-card">{LIABS.map(input)}</section>

      <div className="flex gap-3 p-5">
        <button className="btn-soft flex-1" onClick={() => setV({})}>রিসেট</button>
        <button className="btn-primary flex-1" onClick={() => shareText('যাকাত হিসাব', `মোট সম্পদ: ${money(assets)}\nদায়: ${money(liab)}\nনিট: ${money(net)}\nনিসাব: ${money(nisab)}\nপ্রদেয় যাকাত: ${money(zakat)}`)}>শেয়ার</button>
      </div>
      <p className="px-5 pb-6 text-xs leading-relaxed text-muted">ব্যবহৃত বাড়ি, গাড়ি, আসবাব ও প্রয়োজনীয় পোশাকের উপর যাকাত নেই। নির্দিষ্ট পরিস্থিতিতে একজন বিজ্ঞ আলেমের পরামর্শ নিন।</p>
    </div>
  );
}
