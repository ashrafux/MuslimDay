import { PageHeader, Toggle, toast } from '../components/ui';
import { useStore } from '../store/useStore';
import { PRAYER_IDS } from '../lib/prayer';
import { useT } from '../lib/i18n';
import { n } from '../lib/bn';
import { SilentIcon } from '../components/icons';

export default function SilentMode() {
  const t = useT();
  const silent = useStore((s) => s.silent);
  const set = useStore((s) => s.set);
  return (
    <div>
      <PageHeader back title="সাইলেন্ট মোড" />
      <div className="flex flex-col items-center bg-surface px-6 py-6 text-center">
        <span className="icon-circle h-20 w-20 text-ink"><SilentIcon size={44} /></span>
        <p className="mt-3 text-muted">নামাজের জামাতের সময় ফোন সাইলেন্ট রাখার রিমাইন্ডার পান। ওয়াক্ত শুরু হলে নোটিফিকেশন আসবে এবং নির্ধারিত সময়ে অ্যাপের অ্যালার্মের শব্দ বন্ধ থাকবে।</p>
      </div>
      <div className="mt-4 flex items-center justify-between bg-surface px-5 py-4">
        <span className="text-[18px] text-ink">সাইলেন্ট মোড চালু</span>
        <Toggle checked={silent.enabled} onChange={(v) => { set('silent', { ...silent, enabled: v }); toast(v ? 'সাইলেন্ট মোড চালু হয়েছে' : 'বন্ধ হয়েছে'); }} />
      </div>
      <div className={silent.enabled ? '' : 'pointer-events-none opacity-50'}>
        <div className="mt-4 bg-surface px-5 py-4">
          <div className="text-ink">সময়কাল</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {[10, 15, 20, 30, 45].map((m) => (
              <button key={m} onClick={() => set('silent', { ...silent, minutes: m })} className={`rounded-full px-4 py-1.5 ${silent.minutes === m ? 'bg-brand text-white' : 'bg-chip text-ink'}`}>{n(m)} মিনিট</button>
            ))}
          </div>
        </div>
        <div className="mt-4 bg-surface">
          {PRAYER_IDS.map((p) => (
            <div key={p} className="flex items-center justify-between border-b border-line px-5 py-4">
              <span className="text-[18px] text-ink">{t(p)}</span>
              <Toggle checked={silent.prayers[p]} onChange={(v) => set('silent', { ...silent, prayers: { ...silent.prayers, [p]: v } })} />
            </div>
          ))}
        </div>
      </div>
      <p className="p-5 text-center text-xs text-muted">নোট: ওয়েব অ্যাপ সরাসরি ফোনের রিংটোন বন্ধ করতে পারে না; তাই রিমাইন্ডার দেওয়া হয়।</p>
    </div>
  );
}
