import { useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Crown, X } from 'lucide-react';
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
      <div className="animate-fade rounded-2xl bg-night px-5 py-3 text-sm font-medium text-white shadow-float">{msg}</div>
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
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') return; // user cancelled
    // sharing refused (e.g. embedded preview) → copy instead
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
export const PASTELS = ['bg-lav', 'bg-sand', 'bg-mint', 'bg-sky', 'bg-rose', 'bg-butter'] as const;
export const pastel = (i: number) => PASTELS[((i % PASTELS.length) + PASTELS.length) % PASTELS.length];

/** Square-ish action button used in headers (like the blue badge / grey close button in the references). */
export function IconButton({ label, onClick, children, tone = 'soft' }: { label: string; onClick?: () => void; children: ReactNode; tone?: 'soft' | 'brand' | 'dark' }) {
  const toneCls = tone === 'brand' ? 'bg-brand text-white' : tone === 'dark' ? 'bg-night text-white' : 'bg-surface text-ink shadow-card';
  return (
    <button aria-label={label} onClick={onClick} className={`tap flex h-10 w-10 items-center justify-center rounded-2xl ${toneCls}`}>
      {children}
    </button>
  );
}

export function PageHeader({ title, back, right, sub }: { title: ReactNode; back?: boolean | string; right?: ReactNode; sub?: ReactNode }) {
  const nav = useNavigate();
  return (
    <header className="sticky top-0 z-30 bg-bg/90 backdrop-blur-md">
      <div className="flex min-h-[64px] items-center gap-3 px-5 pb-2 pt-3">
        {back && (
          <IconButton label="back" onClick={() => (typeof back === 'string' ? nav(back) : window.history.length > 1 ? nav(-1) : nav('/'))}>
            <ChevronLeft size={22} />
          </IconButton>
        )}
        <div className="min-w-0 flex-1">
          <h1 className={`truncate font-bold leading-tight text-ink ${back ? 'text-[22px]' : 'text-[30px]'}`}>{title}</h1>
          {sub && <div className="truncate text-[13px] text-muted">{sub}</div>}
        </div>
        {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
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
      <div className="animate-fade absolute inset-0 bg-night/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="animate-sheet relative max-h-[88vh] w-full max-w-app overflow-y-auto rounded-t-[32px] bg-surface pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="sticky top-0 z-10 bg-surface px-5 pb-2 pt-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[20px] font-bold text-ink">{title}</h3>
            <button onClick={onClose} className="tap flex h-9 w-9 items-center justify-center rounded-full bg-chip text-ink" aria-label="close"><X size={18} /></button>
          </div>
        </div>
        <div className="px-5 pb-3 pt-1">{children}</div>
      </div>
    </div>
  );
}

/* ---------- misc ---------- */
export function CrownBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`flex h-6 w-6 items-center justify-center rounded-lg bg-night text-gold shadow-sm ${className}`}>
      <Crown size={13} fill="currentColor" />
    </span>
  );
}

export function NewDot({ className = '' }: { className?: string }) {
  return <span className={`block h-2.5 w-2.5 rounded-full border-2 border-surface bg-alert ${className}`} />;
}

export function ProgressRing({ value, size = 64, stroke = 6, color = 'rgb(var(--brand))', track = 'rgb(var(--chip))', children }: {
  value: number; size?: number; stroke?: number; color?: string; track?: string; children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
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
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? 'bg-brand' : 'bg-chip ring-1 ring-line'}`}>
      <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );
}

export function ListRow({ icon, title, sub, onClick, right, tint }: { icon?: ReactNode; title: ReactNode; sub?: ReactNode; onClick?: () => void; right?: ReactNode; tint?: string }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition hover:bg-bg/60 active:bg-bg">
      {icon && <span className={`tile h-11 w-11 shrink-0 rounded-2xl text-ink ${tint ?? 'bg-chip'}`}>{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-semibold text-ink">{title}</span>
        {sub && <span className="block truncate text-[13px] text-muted">{sub}</span>}
      </span>
      {right ?? (onClick && <ChevronRight className="shrink-0 text-muted" size={20} />)}
    </button>
  );
}

/** Pill track with a raised active segment (as in the Courses / Source files tabs). */
export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-2xl bg-chip p-1">
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={`flex flex-1 items-center justify-center gap-1 rounded-xl px-3 py-2 text-[14px] font-semibold transition ${value === o.value ? 'bg-surface text-ink shadow-card' : 'text-muted'}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Empty({ icon, title, sub, action }: { icon?: ReactNode; title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-8 py-14 text-center">
      {icon && <div className="icon-circle mb-4 h-20 w-20 text-ink">{icon}</div>}
      <p className="text-[17px] font-bold text-ink">{title}</p>
      {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
