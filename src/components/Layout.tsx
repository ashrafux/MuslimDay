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
  { to: '/', key: 'home' as const, icon: (a: boolean) => <Home size={23} strokeWidth={1.8} fill={a ? 'currentColor' : 'none'} /> },
  { to: '/tools', key: 'tools' as const, icon: (a: boolean) => <ToolsDotsIcon size={23} active={a} /> },
  { to: '/quran', key: 'quran' as const, icon: (a: boolean) => <BookOpen size={23} strokeWidth={1.8} fill={a ? 'currentColor' : 'none'} /> },
  { to: '/dua', key: 'dua' as const, icon: (a: boolean) => <HandsIcon size={25} fill={a ? 'currentColor' : 'none'} /> },
  { to: '/more', key: 'others' as const, icon: (a: boolean) => <User size={23} strokeWidth={1.8} fill={a ? 'currentColor' : 'none'} /> },
];

export function BottomNav() {
  const t = useT();
  return (
    <nav className="grid grid-cols-5 bg-bg px-1 pb-[max(.6rem,env(safe-area-inset-bottom))] pt-2">
      {TABS.map((tab) => (
        <NavLink key={tab.to} to={tab.to} end={tab.to === '/'} className="flex flex-col items-center gap-1.5">
          {({ isActive }) => (
            <>
              <span className={`flex h-[39px] w-[70px] items-center justify-center rounded-full transition ${isActive ? 'bg-chip text-brand' : 'text-ink'}`}>
                {tab.icon(isActive)}
              </span>
              <span className={`text-[12.5px] ${isActive ? 'text-brand' : 'text-ink'}`}>{t(tab.key)}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

/** Tab screens: content + banner + bottom navigation (like the original layout). */
export function TabLayout() {
  const bottomH = 84;
  return (
    <>
      <div style={{ paddingBottom: bottomH }}>
        <Outlet />
      </div>
      <MiniPlayer bottom={bottomH + 6} />
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-app border-t border-line/60 bg-bg">
        <BottomNav />
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
    <Sheet open={!!target} onClose={close} title={<span className="flex items-center gap-2"><Crown className="text-amber-500" fill="currentColor" size={22} /> প্রিমিয়াম ফিচার</span>}>
      <p className="text-muted">এই ফিচারটি পৃষ্ঠপোষকদের জন্য। সাবস্ক্রাইব করে সব প্রিমিয়াম ফিচার উপভোগ করুন, অথবা ৭ দিনের ফ্রি ট্রায়াল চালু করুন।</p>
      <ul className="my-4 space-y-2 text-ink">
        {['কিবলা কম্পাস', 'ডিজিটাল তাসবীহ ও লক্ষ্য নির্ধারণ', 'হজ্জ ও উমরাহ গাইড', 'নামাজে সাইলেন্ট মোড রিমাইন্ডার'].map((f) => (
          <li key={f} className="flex items-center gap-2"><Check size={18} className="text-brand" />{f}</li>
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
