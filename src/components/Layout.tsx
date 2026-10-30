import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, User } from 'lucide-react';
import { create } from 'zustand';
import { HandsIcon, ToolsDotsIcon } from './icons';
import { Sheet } from './ui';
import { MiniPlayer } from './Player';
import { useT } from '../lib/i18n';
import { useStore } from '../store/useStore';
import { Crown, Check } from 'lucide-react';

const TABS = [
  { to: '/', key: 'home' as const, icon: (a: boolean) => <Home size={21} strokeWidth={2} fill={a ? 'currentColor' : 'none'} /> },
  { to: '/tools', key: 'tools' as const, icon: (a: boolean) => <ToolsDotsIcon size={21} active={a} /> },
  { to: '/quran', key: 'quran' as const, icon: (a: boolean) => <BookOpen size={21} strokeWidth={2} fill={a ? 'currentColor' : 'none'} /> },
  { to: '/dua', key: 'dua' as const, icon: (a: boolean) => <HandsIcon size={23} strokeWidth={1.9} fill={a ? 'currentColor' : 'none'} /> },
  { to: '/more', key: 'others' as const, icon: (a: boolean) => <User size={21} strokeWidth={2} fill={a ? 'currentColor' : 'none'} /> },
];

/** Floating tab bar: icons only, the active tab expands into a dark pill with its label. */
export function BottomNav() {
  const t = useT();
  return (
    <nav className="flex items-center justify-between gap-1 rounded-full bg-surface p-2 shadow-[0_16px_44px_-8px_rgb(20_20_30_/_.36),0_4px_12px_-4px_rgb(20_20_30_/_.14)]">
      {TABS.map((tab) => (
        <NavLink key={tab.to} to={tab.to} end={tab.to === '/'} aria-label={t(tab.key)}
          className={({ isActive }) => `flex h-12 items-center justify-center gap-2 rounded-full transition-all ${isActive ? 'flex-none bg-night px-4 text-white' : 'flex-1 text-muted hover:text-ink'}`}>
          {({ isActive }) => (
            <>
              {tab.icon(isActive)}
              {isActive && <span className="truncate text-[13px] font-semibold">{t(tab.key)}</span>}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export function TabLayout() {
  const bottomH = 96;
  return (
    <>
      <div style={{ paddingBottom: bottomH }}>
        <Outlet />
      </div>
      <MiniPlayer bottom={bottomH} />
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto max-w-app bg-gradient-to-t from-bg via-bg/80 to-transparent px-5 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-6">
        <div className="pointer-events-auto"><BottomNav /></div>
      </div>
    </>
  );
}

export function SubLayout() {
  return (
    <>
      <div className="pb-24">
        <Outlet />
      </div>
      <MiniPlayer bottom={12} />
    </>
  );
}

/* ---------- premium gate ---------- */
const useGate = create<{ target: string | null; open: (to: string) => void; close: () => void }>((set) => ({
  target: null, open: (to) => set({ target: to }), close: () => set({ target: null }),
}));

export function usePremiumNav() {
  const nav = useNavigate();
  const active = useStore((s) => s.premium.active);
  return (to: string, premiumOnly = false) => {
    if (premiumOnly && !active) useGate.getState().open(to);
    else nav(to);
  };
}

export function PremiumGateSheet() {
  const { target, close } = useGate();
  const nav = useNavigate();
  const set = useStore((s) => s.set);
  const loc = useLocation();
  return (
    <Sheet open={!!target} onClose={close} title={<span className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-night text-gold"><Crown fill="currentColor" size={16} /></span> প্রিমিয়াম ফিচার</span>}>
      <p className="text-muted">এই ফিচারটি পৃষ্ঠপোষকদের জন্য। সাবস্ক্রাইব করে সব প্রিমিয়াম ফিচার উপভোগ করুন, অথবা ৭ দিনের ফ্রি ট্রায়াল চালু করুন।</p>
      <ul className="my-4 space-y-2 text-ink">
        {['কিবলা কম্পাস', 'ডিজিটাল তাসবীহ ও লক্ষ্য নির্ধারণ', 'হজ্জ ও উমরাহ গাইড', 'নামাজে সাইলেন্ট মোড রিমাইন্ডার'].map((f) => (
          <li key={f} className="flex items-center gap-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-mint"><Check size={14} className="text-ink" /></span>{f}</li>
        ))}
      </ul>
      <div className="flex flex-col gap-3">
        <button className="btn-primary w-full" onClick={() => { close(); nav('/subscribe', { state: { from: loc.pathname } }); }}>সাবস্ক্রাইব করুন</button>
        <button className="btn-soft w-full" onClick={() => {
          set('premium', { active: true, plan: 'trial', since: Date.now() });
          const to = target!;
          close();
          nav(to);
        }}>৭ দিনের ফ্রি ট্রায়াল শুরু করুন</button>
      </div>
    </Sheet>
  );
}
