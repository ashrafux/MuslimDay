import { useState } from 'react';
import { Check } from 'lucide-react';
import { PageHeader, Segmented } from '../components/ui';
import { guides, hajjFaraiz, hajjWajibat } from '../data/hajj';
import { n } from '../lib/bn';

export default function Hajj() {
  const [id, setId] = useState<'hajj' | 'umrah'>('umrah');
  const [done, setDone] = useState<Record<string, boolean>>({});
  const g = guides.find((x) => x.id === id)!;
  return (
    <div>
      <PageHeader back title="হজ্জ ও উমরাহ" />
      <div className="px-4 pb-1 pt-1">
        <Segmented value={id} onChange={setId} options={[{ value: 'umrah', label: 'উমরাহ' }, { value: 'hajj', label: 'হজ্জ' }]} />
      </div>
      <p className="px-5 py-4 leading-relaxed text-ink">{g.intro}</p>
      {id === 'hajj' && (
        <div className="mx-4 mb-4 grid gap-3">
          <div className="card p-4"><h3 className="text-[17px] font-bold text-ink">হজ্জের ফরজ</h3><ul className="mt-2 list-disc pl-5 text-ink">{hajjFaraiz.map((f) => <li key={f}>{f}</li>)}</ul></div>
          <div className="card p-4"><h3 className="text-[17px] font-bold text-ink">হজ্জের ওয়াজিব</h3><ul className="mt-2 list-disc pl-5 text-ink">{hajjWajibat.map((f) => <li key={f}>{f}</li>)}</ul></div>
        </div>
      )}
      <ol className="relative mx-4 border-l-2 border-chip pl-6">
        {g.steps.map((s, i) => {
          const key = `${id}-${i}`;
          return (
            <li key={key} className="mb-5">
              <button onClick={() => setDone({ ...done, [key]: !done[key] })} aria-label="mark step"
                className={`absolute -left-[17px] flex h-8 w-8 items-center justify-center rounded-full border-2 ${done[key] ? 'border-brand bg-brand text-white' : 'border-brand bg-surface text-brand'}`}>
                {done[key] ? <Check size={16} /> : n(i + 1)}
              </button>
              <div className="card p-4">
                {s.day && <div className="text-xs text-brand">{s.day}</div>}
                <h3 className="text-[17px] font-bold text-ink">{s.title}</h3>
                <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed text-ink/85">{s.body}</p>
                {s.dua && (
                  <div className="mt-3 rounded-xl bg-chip p-3">
                    <p className="arabic text-right text-xl text-ink">{s.dua.arabic}</p>
                    <p className="mt-2 text-sm text-ink">{s.dua.bn}</p>
                    <p className="mt-1 text-sm text-muted">{s.dua.meaning}</p>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
