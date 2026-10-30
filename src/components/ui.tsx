import { useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Crown, X } from 'lucide-react';
import { create } from 'zustand';
import { useStore } from '../store/useStore';

/* ---------- toast ---------- */
const useToastStore = create<{ msg: string | null; show: (m: string) => void }>((set) => ({
  msg: null,
  show: (m) => {
    set({ msg: m });
    setTimeout(() => set((s) => (s.msg === m ? { msg: null } : s)), 2200);
  },
}));
export const toast = (m: string) => useToastStore.getState().show(m);
export function ToastHost() {
  const msg = useToastStore((s) => s.msg);
  if (!msg) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-28 z-[80] flex justify-center px-6">
      <div className="animate-fade rounded-full bg-ink/90 px-5 py-2.5 text-sm text-surface shadow-lg">{msg}</div>
    </div>
  );
}

export async function shareText(title: string, text: string, url?: string) {
  const shareUrl = url ?? window.location.href;
  try {
    if (navigator.share) {
      await navigator.share({ title, text, url: shareUrl });
      return;
    }
  } catch {
    return; // user cancelled
  }
  await copyText(`${text}\n${shareUrl}`);
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  toast(useStore.getState().settings.lang === 'bn' ? 'কপি হয়েছে' : 'Copied');
}

/* ---------- page header ---------- */
export function PageHeader({ title, back, right, sub }: { title: ReactNode; back?: boolean | string; right?: ReactNode; sub?: ReactNode }) {
  const nav = useNavigate();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
      <div className="relative flex h-[72px] items-center justify-center px-14">
        {back && (
          <button
            aria-label="back"
            onClick={() => (typeof back === 'string' ? nav(back) : window.history.length > 1 ? nav(-1) : nav('/'))}
            className="tap absolute left-3 rounded-full p-2 text-ink hover:bg-chip"
          >
            <ArrowLeft size={24} />
          </button>
        )}
        <div className="truncate text-center">
          <h1 className="truncate text-[25px] leading-tight text-ink">{title}</h1>
          {sub && <div className="truncate text-xs text-muted">{sub}</div>}
        </div>
        {right && <div className="absolute right-3 flex items-center gap-1">{right}</div>}
      </div>
    </header>
  );
}

/* ---------- bottom sheet ---------- */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="animate-fade absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="animate-sheet relative max-h-[88vh] w-full max-w-app overflow-y-auto rounded-t-3xl bg-surface pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="sticky top-0 z-10 flex items-center justify-between bg-surface px-5 pb-2 pt-4">
          <h3 className="text-xl text-ink">{title}</h3>
          <button onClick={onClose} className="tap rounded-full p-1.5 text-muted hover:bg-chip" aria-label="close"><X size={22} /></button>
        </div>
        <div className="px-5 pb-3">{children}</div>
      </div>
    </div>
  );
}

/* ---------- misc ---------- */
export function CrownBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gold text-ink shadow-sm ${className}`}>
      <Crown size={16} fill="currentColor" />
    </span>
  );
}

export function NewDot({ className = '' }: { className?: string }) {
  return <span className={`block h-3 w-3 rounded-full border-2 border-surface bg-alert ${className}`} />;
}

export function ProgressRing({ value, size = 64, stroke = 6, color = 'rgb(var(--alert))', track = 'rgb(var(--alert) / 0.12)', children }: {
  value: number; size?: number; stroke?: number; color?: string; track?: string; children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, Math.max(0, value)))} style={{ transition: 'stroke-dashoffset .4s' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? 'bg-brand' : 'bg-line'}`}>
      <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );
}

export function ListRow({ icon, title, sub, onClick, right }: { icon?: ReactNode; title: ReactNode; sub?: ReactNode; onClick?: () => void; right?: ReactNode }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-5 px-5 py-4 text-left transition hover:bg-bg/60 active:bg-bg">
      {icon && <span className="shrink-0 text-brand">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] text-ink">{title}</span>
        {sub && <span className="block truncate text-sm text-muted">{sub}</span>}
      </span>
      {right ?? (onClick && <ChevronRight className="shrink-0 text-ink" size={22} />)}
    </button>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-3">
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={`tap rounded-full px-5 py-2 text-[16px] ${value === o.value ? 'bg-brand text-white' : 'bg-bg text-ink'}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Empty({ icon, title, sub, action }: { icon?: ReactNode; title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-8 py-14 text-center">
      {icon && <div className="icon-circle mb-4 h-20 w-20 text-brand">{icon}</div>}
      <p className="text-lg text-ink">{title}</p>
      {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Banner slot (the original app shows third-party ads here). We show in-app tips; hidden for supporters. */
const TIPS = [
  { text: 'যাকাত হিসাব করুন সহজেই', cta: 'যাকাত ক্যালকুলেটর', to: '/zakat' },
  { text: 'প্রতিদিনের আমল ধরে রাখুন', cta: 'আমল ট্র্যাকার', to: '/amol' },
  { text: 'কাযা নামাজের হিসাব রাখুন', cta: 'কাযা ট্র্যাকার', to: '/qaza' },
  { text: 'বিজ্ঞাপনমুক্ত অভিজ্ঞতা', cta: 'পৃষ্ঠপোষক হোন', to: '/subscribe' },
];
export function HouseBanner() {
  const premium = useStore((s) => s.premium.active);
  const nav = useNavigate();
  if (premium) return null;
  const tip = TIPS[Math.floor(Date.now() / 60000) % TIPS.length];
  return (
    <div className="bg-bg px-[38px] pb-0 pt-1">
      <button onClick={() => nav(tip.to)}
        className="tap flex h-[62px] w-full items-center justify-between gap-3 overflow-hidden rounded-sm bg-gradient-to-r from-amber-50 via-emerald-50 to-emerald-100 px-4 text-left ring-1 ring-line dark:from-emerald-950 dark:to-emerald-900">
        <span className="text-[15px] leading-tight text-brand-dark dark:text-emerald-200">{tip.text}</span>
        <span className="shrink-0 rounded-full border-2 border-amber-400 bg-amber-300 px-3 py-1 text-[12px] text-ink shadow">{tip.cta} ›</span>
      </button>
    </div>
  );
}
