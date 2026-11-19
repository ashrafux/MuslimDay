/**
 * Phone features, one API for both builds:
 * - in the Android app (Capacitor) they use the native plugins, so alarms ring with the app closed
 *   and sharing/saving open Android's own share sheet;
 * - in a browser they fall back to the web APIs (Notification, navigator.share, a download link).
 */
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Share } from '@capacitor/share';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';

export const isNative = Capacitor.isNativePlatform();

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

export type NotifyPermission = 'granted' | 'denied' | 'default';

export async function notifyPermission(): Promise<NotifyPermission> {
  if (isNative) {
    const p = await LocalNotifications.checkPermissions();
    return p.display === 'granted' ? 'granted' : p.display === 'denied' ? 'denied' : 'default';
  }
  return typeof Notification === 'undefined' ? 'denied' : Notification.permission;
}

export async function requestNotifyPermission(): Promise<NotifyPermission> {
  if (isNative) {
    const p = await LocalNotifications.requestPermissions();
    return p.display === 'granted' ? 'granted' : 'denied';
  }
  if (typeof Notification === 'undefined') return 'denied';
  return Notification.requestPermission();
}

/** Android 12+: whether alarms may fire on the exact minute (otherwise the system may delay them a little) */
export async function exactAlarmsAllowed(): Promise<boolean> {
  if (!isNative) return true;
  try {
    return (await LocalNotifications.checkExactNotificationSetting()).exact_alarm === 'granted';
  } catch {
    return true; // older Android: always exact
  }
}

/** Opens the system "Alarms & reminders" screen so the user can allow exact alarms */
export async function openExactAlarmSettings(): Promise<boolean> {
  if (!isNative) return true;
  try {
    return (await LocalNotifications.changeExactNotificationSetting()).exact_alarm === 'granted';
  } catch {
    return false;
  }
}

// Two channels: alarms with sound, and quiet reminders (the user's "শব্দ" switch picks one)
const CHANNEL_SOUND = 'amol-alarms';
const CHANNEL_QUIET = 'amol-quiet';
let channels: Promise<void> | null = null;
function ensureChannels() {
  if (!isNative) return Promise.resolve();
  channels ??= Promise.all([
    LocalNotifications.createChannel({ id: CHANNEL_SOUND, name: 'নামাজ ও আমলের অ্যালার্ম', description: 'ওয়াক্ত ও আমলের সময় শব্দসহ অ্যালার্ম', importance: 5, visibility: 1, vibration: true }),
    LocalNotifications.createChannel({ id: CHANNEL_QUIET, name: 'নীরব রিমাইন্ডার', description: 'শব্দ ছাড়া রিমাইন্ডার', importance: 3, visibility: 1, vibration: false, sound: undefined }),
  ]).then(() => undefined).catch(() => undefined);
  return channels;
}

/** A stable notification id from a text key, so rescheduling replaces rather than duplicates */
function idOf(key: string) {
  let h = 7;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return (Math.abs(h) % 2_000_000_000) + 1;
}

/** Shows a notification right away (test alarm, or an alert while the app is open in a browser) */
export async function notifyNow(title: string, body: string, link = '/', sound = true) {
  if ((await notifyPermission()) !== 'granted') return;
  if (isNative) {
    await ensureChannels();
    await LocalNotifications.schedule({
      notifications: [{
        id: idOf(`now-${Date.now()}`), title, body, extra: { link },
        channelId: sound ? CHANNEL_SOUND : CHANNEL_QUIET, smallIcon: 'ic_stat_amol',
        schedule: { at: new Date(Date.now() + 1000), allowWhileIdle: true }, isExactNotification: false,
      }],
    }).catch(() => undefined);
    return;
  }
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) await reg.showNotification(title, { body, icon: './icon.svg', badge: './icon.svg', data: { link } });
    else new Notification(title, { body, icon: './icon.svg' });
  } catch { /* ignore */ }
}

export interface PlannedAlert {
  /** unique per occurrence, e.g. 2026-11-19-fajr-start */
  key: string;
  at: Date;
  title: string;
  body: string;
  /** in-app route the notification opens */
  link: string;
}

let lastPlan = '';
/**
 * Android only: replaces every pending alarm with this plan. The system fires them on time even when
 * the app is closed, and keeps them after a restart. Call again whenever the plan inputs change.
 */
export async function syncScheduledAlerts(alerts: PlannedAlert[], sound: boolean) {
  if (!isNative) return;
  const soon = Date.now() + 5000;
  const future = alerts.filter((a) => a.at.getTime() > soon).sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, 300);
  const plan = JSON.stringify([sound, future.map((a) => [a.key, a.at.getTime(), a.title, a.body])]);
  if (plan === lastPlan) return;
  if ((await notifyPermission()) !== 'granted') return;
  await ensureChannels();
  const exact = await exactAlarmsAllowed();
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length) await LocalNotifications.cancel({ notifications: pending.notifications.map((p) => ({ id: p.id })) });
  if (future.length) {
    await LocalNotifications.schedule({
      notifications: future.map((a) => ({
        id: idOf(a.key), title: a.title, body: a.body, extra: { link: a.link },
        channelId: sound ? CHANNEL_SOUND : CHANNEL_QUIET, smallIcon: 'ic_stat_amol',
        schedule: { at: a.at, allowWhileIdle: true },
        // never pops the settings screen by itself; the alarm page asks for exact alarms
        isExactNotification: exact,
      })),
    });
  }
  lastPlan = plan;
}

/** Calls `open` with a notification's in-app route when the user taps it */
export function onNotificationTap(open: (link: string) => void) {
  if (!isNative) return () => undefined;
  const handle = LocalNotifications.addListener('localNotificationActionPerformed', (a) => {
    const link = a.notification.extra?.link;
    if (typeof link === 'string') open(link);
  });
  return () => { handle.then((h) => h.remove()); };
}

/* ------------------------------------------------------------------ */
/* Sharing and saving files                                            */
/* ------------------------------------------------------------------ */

/** Opens the share sheet; resolves false if sharing isn't possible (the caller can copy instead) */
export async function shareContent(opts: { title: string; text: string; url?: string; files?: File[] }): Promise<boolean> {
  if (isNative) {
    try {
      const files = opts.files?.length ? await Promise.all(opts.files.map(cacheFile)) : undefined;
      await Share.share({ title: opts.title, text: opts.text, url: opts.url, files, dialogTitle: opts.title });
      return true;
    } catch (e) {
      // the user closing the sheet is not a failure
      return /cancel/i.test(String((e as Error)?.message ?? e));
    }
  }
  try {
    if (opts.files?.length && !navigator.canShare?.({ files: opts.files })) return false;
    if (!navigator.share) return false;
    await navigator.share({ title: opts.title, text: opts.text, url: opts.url, files: opts.files });
    return true;
  } catch (e) {
    return (e as Error)?.name === 'AbortError';
  }
}

/** Saves a text file: Android shares it (to Drive, Files, WhatsApp…); a browser downloads it */
export async function saveTextFile(name: string, contents: string, mime = 'application/json') {
  if (isNative) {
    const { uri } = await Filesystem.writeFile({ path: name, data: contents, directory: Directory.Cache, encoding: Encoding.UTF8 });
    await Share.share({ title: name, files: [uri], dialogTitle: name }).catch(() => undefined);
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([contents], { type: mime }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
}

async function cacheFile(f: File): Promise<string> {
  const data = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
    r.onerror = () => reject(r.error);
    r.readAsDataURL(f);
  });
  const { uri } = await Filesystem.writeFile({ path: `share-${Date.now()}-${f.name || 'file'}`, data, directory: Directory.Cache });
  return uri;
}
