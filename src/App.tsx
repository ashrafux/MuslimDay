import { useEffect, useRef } from 'react';
import { HashRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Capacitor, SystemBars, SystemBarsStyle, SystemBarType } from '@capacitor/core';
import { App as NativeApp } from '@capacitor/app';
import { PremiumGateSheet, SubLayout, TabLayout } from './components/Layout';
import { ToastHost } from './components/ui';
import { Scheduler } from './components/Scheduler';
import { useStore } from './store/useStore';
import { setNumberLang } from './lib/bn';

import Home from './pages/Home';
import Tools from './pages/Tools';
import Quran from './pages/Quran';
import QuranReader from './pages/QuranReader';
import { QuranSettingsPage, QuranSearch, QuranBookmarks, TafsirIndex } from './pages/QuranExtras';
import Dua from './pages/Dua';
import { DuaCategoryPage, DuaDetail, DuaSearch, DuaListPage } from './pages/DuaPages';
import More from './pages/More';
import { ProfileEdit, SettingsPage, ContactPage, ReportPage, AboutPage } from './pages/Account';
import Subscribe from './pages/Subscribe';
import Notifications from './pages/Notifications';
import Alarm from './pages/Alarm';
import CalendarPage from './pages/Calendar';
import AmolTracker, { AmolCategorySettings, AmolManage, SunnahDetail } from './pages/AmolTracker';
import { AsmaulHusnaPage, HadithPage, RuqyahPage } from './pages/Ilm';
import Qibla from './pages/Qibla';
import Tasbih from './pages/Tasbih';
import Mosques from './pages/Mosques';
import Zakat from './pages/Zakat';
import AudioQuran from './pages/AudioQuran';
import Hajj from './pages/Hajj';
import SilentMode from './pages/SilentMode';
import Ramadan from './pages/Ramadan';
import Qaza from './pages/Qaza';

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

/** In the Android/iOS app, keep status-bar icons readable over the page underneath */
function NativeBars() {
  const { pathname } = useLocation();
  const theme = useStore((s) => s.settings.theme);
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const top = dark || pathname === '/' ? SystemBarsStyle.Dark : SystemBarsStyle.Light;
    SystemBars.setStyle({ style: top, bar: SystemBarType.StatusBar }).catch(() => undefined);
    SystemBars.setStyle({ style: dark ? SystemBarsStyle.Dark : SystemBarsStyle.Light, bar: SystemBarType.NavigationBar }).catch(() => undefined);
  }, [pathname, theme]);
  return null;
}

/**
 * Android back button / back gesture in the native app: close an open sheet first, then go to
 * the previous screen, then fall back to Home; only from Home does the app go to the background.
 */
function NativeBack() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const path = useRef(pathname);
  path.current = pathname;
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const handle = NativeApp.addListener('backButton', ({ canGoBack }) => {
      // Sheets close on Escape (see Sheet in components/ui)
      if (document.querySelector('.animate-sheet')) {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        return;
      }
      if (path.current === '/') { NativeApp.minimizeApp(); return; }
      if (canGoBack) window.history.back();
      else nav('/', { replace: true });
    });
    return () => { handle.then((h) => h.remove()); };
  }, [nav]);
  return null;
}

function useThemeAndLang() {
  const theme = useStore((s) => s.settings.theme);
  const lang = useStore((s) => s.settings.lang);
  setNumberLang(lang);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mq.matches);
      document.documentElement.classList.toggle('dark', dark);
      document.querySelector('meta[name=theme-color]')?.setAttribute('content', dark ? '#0f1013' : '#ffffff');
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
}

function useTrialExpiry() {
  useEffect(() => {
    const { premium, set } = useStore.getState();
    if (premium.active && premium.plan === 'trial' && premium.since && Date.now() - premium.since > 7 * 86400000) {
      set('premium', { active: false });
    }
  }, []);
}

export default function App() {
  useThemeAndLang();
  useTrialExpiry();
  return (
    <HashRouter>
      <ScrollTop />
      <NativeBars />
      <NativeBack />
      <Scheduler />
      <div className="mx-auto min-h-full max-w-app bg-bg shadow-[0_0_40px_rgba(0,0,0,.06)]">
        <Routes>
          <Route element={<TabLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/quran" element={<Quran />} />
            <Route path="/dua" element={<Dua />} />
            <Route path="/more" element={<More />} />
          </Route>
          <Route element={<SubLayout />}>
            <Route path="/quran/settings" element={<QuranSettingsPage />} />
            <Route path="/quran/search" element={<QuranSearch />} />
            <Route path="/quran/bookmarks" element={<QuranBookmarks />} />
            <Route path="/quran/:surah" element={<QuranReader />} />
            <Route path="/tafsir" element={<TafsirIndex />} />
            <Route path="/dua/search" element={<DuaSearch />} />
            <Route path="/dua/c/:cat" element={<DuaCategoryPage />} />
            <Route path="/dua/d/:id" element={<DuaDetail />} />
            <Route path="/dua/list/:id" element={<DuaListPage />} />
            <Route path="/profile" element={<ProfileEdit />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/subscribe" element={<Subscribe />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/alarm" element={<Alarm />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/amol" element={<AmolTracker />} />
            <Route path="/amol/manage" element={<AmolManage />} />
            <Route path="/amol/manage/:group" element={<AmolCategorySettings />} />
            <Route path="/sunnah/:id" element={<SunnahDetail />} />
            <Route path="/asmaul-husna" element={<AsmaulHusnaPage />} />
            <Route path="/hadith" element={<HadithPage />} />
            <Route path="/ruqyah" element={<RuqyahPage />} />
            <Route path="/qibla" element={<Qibla />} />
            <Route path="/tasbih" element={<Tasbih />} />
            <Route path="/mosques" element={<Mosques />} />
            <Route path="/zakat" element={<Zakat />} />
            <Route path="/audio" element={<AudioQuran />} />
            <Route path="/hajj" element={<Hajj />} />
            <Route path="/silent" element={<SilentMode />} />
            <Route path="/ramadan" element={<Ramadan />} />
            <Route path="/qaza" element={<Qaza />} />
            <Route path="*" element={<Home />} />
          </Route>
        </Routes>
        <PremiumGateSheet />
        <ToastHost />
      </div>
    </HashRouter>
  );
}
