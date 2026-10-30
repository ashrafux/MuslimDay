import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { addDays } from './bn';
import { todayIn } from './dates';
import { currentPeriod, getDayTimes, getPeriods, getWaqts } from './prayer';

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function usePrayerData(now: Date) {
  const { place, method, madhab } = useStore((s) => s.settings);
  const today = todayIn(place.tz, now);
  const dayKey = today.getTime();
  return useMemo(() => {
    const ps = { method, madhab };
    const t = getDayTimes(today, place.lat, place.lng, ps);
    const y = getDayTimes(addDays(today, -1), place.lat, place.lng, ps);
    const waqts = getWaqts(t);
    const periods = getPeriods(t, y);
    return { today, times: t, waqts, periods };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayKey, place.lat, place.lng, method, madhab]);
}

export function useCurrentPeriod(now: Date) {
  const data = usePrayerData(now);
  // Periods are relative to "today"; after midnight before fajr the first entry (yesterday's isha) applies.
  const period = currentPeriod(data.periods, now);
  return { ...data, period };
}

/** Adds visible time on a reading screen to the profile stats. */
export function useReadingTimer(kind: 'quranSeconds' | 'duaSeconds') {
  const addStat = useStore((s) => s.addStat);
  useEffect(() => {
    let last = Date.now();
    const id = setInterval(() => {
      const nowTs = Date.now();
      if (document.visibilityState === 'visible') addStat(kind, Math.round((nowTs - last) / 1000));
      last = nowTs;
    }, 10_000);
    return () => {
      clearInterval(id);
      if (document.visibilityState === 'visible') addStat(kind, Math.round((Date.now() - last) / 1000));
    };
  }, [kind, addStat]);
}

export function useLang() {
  return useStore((s) => s.settings.lang);
}
