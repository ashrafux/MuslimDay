# MuslimDay — আমল ট্র্যাকার

A Bangla-first Islamic companion app for Android: prayer times and alarms, the full Quran, duas, tasbih, qibla, and a daily good-deeds (amol) tracker with statistics.

It is one React + TypeScript codebase that runs as a web app and is packaged as a native Android app with [Capacitor](https://capacitorjs.com). Everything a user records stays on their phone; there is no server or account.

> বাংলা: এই রিপোজিটরিতে পুরো অ্যাপের সোর্স কোড আছে। নিচের ধাপগুলো মেনে যে কেউ APK বানাতে বা Play Store-এ প্রকাশ করতে পারবেন।

---

## Contents

1. [Features](#features)
2. [Quick start (web)](#quick-start-web)
3. [Build the Android app](#build-the-android-app)
4. [Publish to the Google Play Store](#publish-to-the-google-play-store)
5. [Automatic builds on GitHub](#automatic-builds-on-github)
6. [Project structure](#project-structure)
7. [Notes and limits](#notes-and-limits)

---

## Features

| Area | What it does |
| --- | --- |
| **হোম (Home)** | Hijri, Gregorian and Bangla dates; live countdown to the next prayer; location (64 BD districts, world cities or GPS); sunrise/sunset; the five waqts with start and end times; shortcuts, including the Amol tracker. |
| **টুলস (Tools)** | Today's amol progress and statistics; Asma ul Husna, Hadith, Ruqyah; Qibla compass, Tasbih, nearby mosques, calendar, Zakat, audio Quran, Hajj & Umrah, silent-mode reminders. |
| **কুরআন (Quran)** | All 114 surahs offline (Arabic and Bangla), juz list, search, bookmarks, last read, tafsir (online), recitation with 5 reciters. |
| **দোয়া (Dua)** | 66 authentic duas in six categories, adhkar counters, favourites, personal dua lists. |
| **আমল ট্র্যাকার** | Seven categories — নামাজ, কুরআন, যিকির ও দোয়া, দৈনন্দিন সুন্নাহ, আখলাক ও বান্দার হক, বর্জনীয় বিষয়, ব্যক্তিগত আমল. Each main item opens its own checklist where the user can add, rename or remove entries. Fard prayers carry a জামাতে / একা / কাযা tag. Categories and items can be hidden or reordered in settings. |
| **পরিসংখ্যান (Statistics)** | Overall gauge with the change from the previous period, a report per category, prayer streaks, jamaat and qaza reports, date-range filter. |
| **Alarms** | Prayer alarms (before, at start, before the end if not marked), silent-mode reminders and reminders for the user's own deeds. On Android they ring even when the app is closed and survive a restart. |
| **Settings** | Language (বাংলা / English), light/dark theme, calculation method, madhab, Hijri adjustment, 12/24h, backup and restore. |

## Quick start (web)

Requires **Node.js 22**.

```bash
npm install
npm run dev        # http://localhost:5173
```

Other scripts:

```bash
npm run build      # type-check and build the web app into dist/
npm run preview    # serve the build
```

## Build the Android app

Requires **Node.js 22**, **JDK 21** and the **Android SDK** (easiest: install [Android Studio](https://developer.android.com/studio), which includes the SDK).

```bash
npm install
npm run build              # build the web app
npx cap sync android       # copy it into the Android project
```

Then either open the `android/` folder in Android Studio and press **Run**, or build from the command line:

```bash
cd android
./gradlew assembleDebug    # → android/app/build/outputs/apk/debug/app-debug.apk
```

`app-debug.apk` can be installed directly on any Android 7.0+ phone. It is signed with the shared test key in `android/app/debug.keystore`, so every test build installs over the previous one. **Do not publish a debug build.**

Whenever you change anything in `src/` or `public/`, run `npm run build && npx cap sync android` again before building.

## Publish to the Google Play Store

### 1. Choose the app id

The package name is `com.ashrafux.amoltracker` (set in `capacitor.config.ts` and `android/app/build.gradle`). A Play Store listing is tied to its package name forever, so if you publish under a different developer account, change it in both files **before** your first upload.

### 2. Create your release key (once)

```bash
cd android
keytool -genkeypair -v -keystore muslimday-release.jks -alias muslimday -keyalg RSA -keysize 2048 -validity 10000
cp keystore.properties.example keystore.properties   # then fill in your passwords
```

`keystore.properties` and `*.jks` files are git-ignored. **Back up the `.jks` file and its passwords** — every future update must be signed with the same key. (If you use Play App Signing, this becomes your upload key.)

Instead of the file you can set the environment variables `MUSLIMDAY_KEYSTORE`, `MUSLIMDAY_KEYSTORE_PASSWORD`, `MUSLIMDAY_KEY_ALIAS` and `MUSLIMDAY_KEY_PASSWORD`.

### 3. Set the version

Every upload needs a higher `versionCode`. Edit `versionCode` / `versionName` in `android/app/build.gradle`, or set `MUSLIMDAY_VERSION_CODE` and `MUSLIMDAY_VERSION_NAME` when building.

### 4. Build the bundle

```bash
npm run build && npx cap sync android
cd android
./gradlew bundleRelease     # → app/build/outputs/bundle/release/app-release.aab  (upload this to Play)
./gradlew assembleRelease   # → app/build/outputs/apk/release/app-release.apk    (signed APK, for sharing outside Play)
```

### 5. Play Console checklist

- **Privacy policy URL** — required, because the app uses location and notifications. State that all data stays on the device.
- **Data safety form** — location is used on the device only (prayer times, qibla, nearby mosques); nothing is collected or shared by the app.
- **Exact alarms** — the app declares `SCHEDULE_EXACT_ALARM` so prayer alarms ring on the minute. In the permission declaration, explain that the app is a prayer-time alarm.
- **Store listing** — screenshots, a 512×512 icon and a 1024×500 feature graphic.
- **Subscriptions** — the "সাপোর্টার" (Subscribe) payment screen is a demo. Either connect a real payment method (Google Play Billing is required for digital subscriptions sold through Play) or hide that screen before publishing.

## Automatic builds on GitHub

`.github/workflows/android-apk.yml` runs on every push to `main` (or manually from the **Actions** tab). It builds the web app and a test APK, and publishes them to a pre-release named **android-latest** on the repository's Releases page. Each run gets a higher version number automatically.

To also get a signed release APK and a Play Store `.aab`, add these repository secrets (**Settings → Secrets and variables → Actions**):

| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | your `.jks` file as base64 (`base64 -w0 muslimday-release.jks`) |
| `ANDROID_KEYSTORE_PASSWORD` | keystore password |
| `ANDROID_KEY_ALIAS` | key alias (e.g. `muslimday`) |
| `ANDROID_KEY_PASSWORD` | key password |

## Project structure

```
src/
  pages/            screens (Home, Quran, Dua, AmolTracker incl. statistics and settings, …)
  components/       shared UI, layout and bottom navigation, Scheduler (alarms)
  lib/
    amol.ts         the amol categories, items and checklists, progress helpers
    native.ts       phone features: Android notifications, sharing, saving files (web fallbacks)
    prayer.ts       prayer-time calculation (adhan-js)
    dates.ts, bn.ts Hijri/Bangla dates, Bangla numerals
  store/useStore.ts all app state (zustand, saved to localStorage on the device)
  data/             duas, hadith, Asma ul Husna, surah metadata, …
public/quran/       the Quran text and Bangla translation (offline)
android/            the native Android project (Capacitor)
capacitor.config.ts app id, name and plugin settings
```

Native plugins: `@capacitor/app` (back button), `@capacitor/local-notifications` (alarms), `@capacitor/share` and `@capacitor/filesystem` (share sheet, backup file).

## Notes and limits

- Prayer times use [adhan-js](https://github.com/batoulapps/adhan-js). The default "Islamic Foundation Bangladesh" method is Karachi angles plus IFB's precautionary minutes, with Hanafi Asr.
- The Hijri date uses Umm al-Qura with a −1 day default for Bangladesh (adjustable in settings).
- Quran text and Bangla translation come from [quran-json](https://github.com/risan/quran-json) (CC BY 4.0).
- Internet is needed only for tafsir (Quran.com API), recitation audio (Islamic Network CDN) and nearby mosques (OpenStreetMap Overpass).
- On Android, the next seven days of alarms are handed to the system and refreshed every time the app is opened (prayer times change daily, so they cannot simply repeat). Opening the app at least once a week keeps alarms going.
- Recitation audio stops when the app goes to the background.
- An app cannot switch the phone to silent by itself; silent mode sends a reminder to do it.
