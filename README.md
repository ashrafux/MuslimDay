# আমল ট্র্যাকার (Amol Tracker)

A Bangla-first Islamic companion app: prayer times, the full Quran, duas, tasbih, qibla and a daily good-deeds (amol) tracker. It is a mobile-first React PWA that installs to the home screen and works offline.

## Run

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build in dist/
npm run preview   # serve the build
```

## Screens and features

| Tab | What it does |
| --- | --- |
| **হোম (Home)** | Hijri, Gregorian and Bangla dates. Live countdown arc for the current period (Fajr, sunrise, Duha, Zawal, Dhuhr/Jumu'ah, Asr, Maghrib, Isha, Tahajjud). The hero colour changes with the time of day. Location picker (64 BD districts plus international cities, or GPS). Sunrise and sunset. The five waqts with start and end times, a makruh-time indicator and a tap-to-mark check. Alarm and calendar shortcuts, an auto-sliding card carousel, a floating Ramadan button, top features and a daily ayah. |
| **টুলস (Tools)** | Today's amol progress, Essential knowledge (Quran, Asma ul Husna, Hadith, Dua, Ruqyah) and tools: Qibla, Tasbih, Nearby mosque, Calendar, Zakat, Audio Quran, Hajj & Umrah, Silent mode. Crown-marked tools are premium, with a 7-day trial. |
| **কুরআন (Quran)** | All 114 surahs bundled offline (Arabic and Bangla translation), a Juz list, last read, quick links, full-text search, bookmarks, tafsir (4 Bangla tafsirs, online), per-ayah and per-surah recitation with 5 reciters, a persistent mini player, and font and translation settings. |
| **দোয়া (Dua)** | Six categories (66 authentic duas, each with Arabic, pronunciation, meaning and reference), repeat counters for adhkar, search, favourites, and personal dua lists (3 free, 20 for supporters). |
| **অন্যান্য (More)** | Editable profile (avatar or photo upload). Reading-time and tasbih stats. Supporter subscription. Settings: location, language (বাংলা/English), theme (light/dark/system), calculation method, madhab, Hijri adjustment, 12/24h, backup and restore. Contact, problem report with screenshot, about and privacy. |

**New features not in the original app:** prayer statistics and streaks, custom amol items, a Qaza prayer tracker, a Ramadan and fasting tracker with a Sehri/Iftar timetable and upcoming sunnah fasts, a Hijri ↔ Gregorian converter, a Quran juz view and full-text search, a persistent audio player, dark mode, English UI, and data backup and restore.

## Notes

- Prayer times use [adhan-js](https://github.com/batoulapps/adhan-js). The default "Islamic Foundation Bangladesh" method is Karachi angles plus IFB's precautionary minutes, with Hanafi Asr.
- The Hijri date uses Umm al-Qura with a −1 day default for Bangladesh (adjustable).
- Quran text and Bangla translation come from [quran-json](https://github.com/risan/quran-json) (CC BY 4.0) and are in `public/quran/`.
- These need internet: tafsir (Quran.com API), recitation audio (Islamic Network CDN) and nearby mosques (OpenStreetMap Overpass).
- All user data stays on the device (localStorage).
- The payment step in **Subscribe** is a demo stub. Connect a real gateway (bKash, Nagad or card) there.
- Alarms fire while the app is open or installed as a PWA. A web app cannot silence the phone, so Silent mode sends reminders instead.
