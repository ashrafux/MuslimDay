import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = (size = 24, p: P) => ({
  width: size, height: size, viewBox: '0 0 48 48', fill: 'none', stroke: 'currentColor',
  strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, ...p,
});

/** Two raised open palms (dua) */
export function HandsIcon({ size, ...p }: P) {
  // One open palm (fingers up, thumb on the outside), mirrored for the second hand.
  const hand = (
    <>
      <path d="M8 25V13.5a2 2 0 014 0V24" />
      <path d="M12 23V9.5a2 2 0 014 0V23" />
      <path d="M16 23V10a2 2 0 014 0v13" />
      <path d="M20 23.5V13a2 2 0 014 0v14c0 6-2 10-5 13v4" />
      <path d="M8 25v-1.5l-2.7-4.2a2 2 0 00-3.4 2.1L6 31c1.5 3.5 3.5 6 5 8v5" />
      <path d="M11 32c1.5-2 4-3 7-2.5" />
    </>
  );
  return (
    <svg {...base(size, p)} strokeWidth={p.strokeWidth ?? 1.7}>
      <g transform="translate(-1 0)">{hand}</g>
      <g transform="translate(49 0) scale(-1 1)">{hand}</g>
    </svg>
  );
}

/** Prayer beads */
export function TasbihIcon({ size, ...p }: P) {
  const beads = [
    [16, 8], [12, 10], [9, 14], [8, 18], [9, 22], [11, 26], [14, 29], [17, 32], [20, 34], [23, 36], [26, 33], [27, 29], [26, 25], [24, 21], [22, 17], [20, 13], [19, 9],
  ];
  return (
    <svg {...base(size, p)} strokeWidth={1.6}>
      {beads.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={1.8} />)}
      <path d="M27 37l4 4m0 0l3 5m-3-5l5 2" />
    </svg>
  );
}

/** Kaaba with stand arrow (qibla) */
export function QiblaIcon({ size, ...p }: P) {
  return (
    <svg {...base(size, p)}>
      <path d="M24 4l-5 9h10z" />
      <path d="M14 22l10-5 10 5v14l-10 6-10-6z" />
      <path d="M14 22l10 5 10-5M24 27v15M14 28l10 5 10-5" />
    </svg>
  );
}

export function KaabaPinIcon({ size, ...p }: P) {
  return (
    <svg {...base(size, p)}>
      <path d="M6 14l14-6 14 6v22l-14 6-14-6z" />
      <path d="M6 14l14 6 14-6M20 20v22M6 20l14 6 14-6M12 23v14M15 24v14" />
      <circle cx="36" cy="34" r="6" fill="var(--pin-bg, transparent)" />
      <circle cx="36" cy="34" r="2" />
    </svg>
  );
}

export function MosquePinIcon({ size, ...p }: P) {
  return (
    <svg {...base(size, p)}>
      <path d="M24 44s-14-13-14-24a14 14 0 0128 0c0 11-14 24-14 24z" />
      <path d="M17 24h14M19 24c0-4 2-6 5-7 3 1 5 3 5 7" fill="currentColor" />
      <path d="M24 12v4" />
    </svg>
  );
}

export function ZakatIcon({ size, ...p }: P) {
  return (
    <svg {...base(size, p)}>
      <path d="M18 8h12l-3 6h-6z" />
      <path d="M21 14c-8 4-12 12-12 18 0 6 5 9 15 9s15-3 15-9c0-6-4-14-12-18" />
      <text x="24" y="33" textAnchor="middle" fontSize="7.5" fill="currentColor" stroke="none" fontFamily="sans-serif" fontWeight="700">2.5%</text>
    </svg>
  );
}

export function SilentIcon({ size, ...p }: P) {
  return (
    <svg {...base(size, p)}>
      <path d="M12 34h24c-3-3-4-6-4-12a8 8 0 00-16 0c0 6-1 9-4 12z" />
      <path d="M21 39a3 3 0 006 0M8 8l32 32" />
    </svg>
  );
}

export function PlayLayersIcon({ size, ...p }: P) {
  return (
    <svg {...base(size, p)} strokeWidth={2.4}>
      <path d="M12 8v32l28-16z" />
      <path d="M17 17l13 7-13 7zM17 24h7" />
    </svg>
  );
}

export function QuranStandIcon({ size, ...p }: P) {
  return (
    <svg {...base(size, p)}>
      <path d="M24 16c-4-3-10-4-16-3v18c6-1 12 0 16 3 4-3 10-4 16-3V13c-6-1-12 0-16 3zM24 16v18" />
      <path d="M8 13l-4 3v4M40 13l4 3v4M10 31l-4 9 8-4M38 31l4 9-8-4M14 36l10 5 10-5" />
    </svg>
  );
}

export function HadithBookIcon({ size, ...p }: P) {
  return (
    <svg {...base(size, p)}>
      <path d="M12 6h24v32H14a3 3 0 00-3 3 3 3 0 003 3h22" />
      <path d="M12 6a2 2 0 00-1 2v33" />
      <path d="M19 12h10v6l-5 4-5-4z" />
      <path d="M15 38h21" />
    </svg>
  );
}

export function PrayingManIcon({ size, ...p }: P) {
  return (
    <svg {...base(size, p)} strokeWidth={1.6}>
      <circle cx="20" cy="9" r="4" />
      <path d="M16 7c1-3 7-3 8 0" />
      <path d="M18 14c-3 2-4 8-3 14l-3 8c-1 3 1 5 4 5h16c3 0 3-4 0-4H23l2-6" />
      <path d="M22 16l4 8 5-3m0 0l1-4m-1 4l3-2" />
      <path d="M16 28c3 3 8 4 12 3" />
    </svg>
  );
}

export function CalendarCheckIcon({ size, ...p }: P) {
  return (
    <svg {...base(size, p)} strokeWidth={1.6}>
      <rect x="6" y="10" width="30" height="28" rx="2" />
      <path d="M6 16h30M12 6v6M18 6v6M24 6v6M30 6v6" />
      <path d="M14 28l5 5 10-12" />
      <circle cx="38" cy="30" r="6" />
      <path d="M38 27v3h2" />
    </svg>
  );
}

export function CrescentLanternIcon({ size, ...p }: P) {
  return (
    <svg {...base(size, p)} strokeWidth={1.6}>
      <path d="M26 6a18 18 0 1016 26A15 15 0 0126 6z" />
      <path d="M26 6v6M24 12h4l1 3v8l-1 2h-4l-1-2v-8z" />
    </svg>
  );
}

export function SunriseSeaIcon({ size, ...p }: P) {
  return (
    <svg {...base(size, p)}>
      <path d="M12 28a12 12 0 0124 0M6 28h36M10 33c4 2 8-2 12 0s8 2 12 0 6-1 8 0M14 38c4 2 6-2 10 0s6 2 10 0" />
      <path d="M24 8v4M12 13l3 3M36 13l-3 3M5 21h4M39 21h4" />
    </svg>
  );
}

export function FourDotsIcon({ size = 24, ...p }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="currentColor" {...p}>
      <circle cx="16" cy="16" r="6" /><circle cx="32" cy="16" r="6" /><circle cx="16" cy="32" r="6" /><circle cx="32" cy="32" r="6" />
    </svg>
  );
}

export function ToolsDotsIcon({ size = 24, active, ...p }: P & { active?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...p}>
      {[4, 12].map((y) => [4, 12].map((x) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.6" />))}
      {[4, 12, 20].map((x) => <circle key={`b${x}`} cx={x} cy="20" r="1.6" />)}
      <circle cx="19" cy="5" r="3.6" fill="rgb(var(--alert))" stroke={active ? 'rgb(var(--night))' : 'rgb(var(--surface))'} strokeWidth="1.5" />
    </svg>
  );
}

/** Mosque with crescent – the floating action button artwork */
export function MosqueArt({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <path d="M40 8a24 24 0 1 0 18 34A20 20 0 0 1 40 8z" fill="#f2b84b" />
      <path d="M45 12l1.6 3.4 3.7.4-2.8 2.5.8 3.7-3.3-1.9-3.3 1.9.8-3.7-2.8-2.5 3.7-.4z" fill="#e0a12e" />
      <rect x="18" y="36" width="30" height="16" fill="#1f8a5b" />
      <path d="M22 36c0-7 5-11 11-13 6 2 11 6 11 13z" fill="#26a269" />
      <rect x="14" y="26" width="4" height="26" fill="#d84a3a" />
      <path d="M13 26l3-6 3 6z" fill="#e0a12e" />
      <rect x="48" y="26" width="4" height="26" fill="#d84a3a" />
      <path d="M47 26l3-6 3 6z" fill="#e0a12e" />
      <path d="M30 52v-7a3 3 0 016 0v7z" fill="#f6d36b" />
    </svg>
  );
}

/** "Allah" calligraphy tile icon */
export function AllahIcon({ size = 24 }: { size?: number }) {
  return <span className="font-ar leading-none" style={{ fontSize: size * 1.05 }}>ﷲ</span>;
}

export function RuqyahIcon({ size = 24 }: { size?: number }) {
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size * 1.2, height: size * 1.4 }}>
      <svg viewBox="0 0 40 48" width={size * 1.2} height={size * 1.4} fill="none" stroke="currentColor" strokeWidth="1.5" className="absolute inset-0">
        <path d="M20 2c2 4 6 6 10 10 6 6 6 16 2 24-3 6-7 9-12 10-5-1-9-4-12-10-4-8-4-18 2-24 4-4 8-6 10-10z" />
      </svg>
      <span className="font-ar relative" style={{ fontSize: size * 0.62 }}>رقية</span>
    </span>
  );
}

/** Mood face in a coloured circle (check-in style). level 1 = low … 4 = great. */
export function MoodFace({ level, size = 44 }: { level: 1 | 2 | 3 | 4; size?: number }) {
  const bg = { 1: 'rgb(var(--m-pink))', 2: 'rgb(var(--m-gray))', 3: 'rgb(var(--m-yellow))', 4: 'rgb(var(--m-green))' }[level];
  const mouth = {
    1: 'M17 33c3-4 11-4 14 0',
    2: 'M17 31h14',
    3: 'M17 29c3 3 11 3 14 0',
    4: 'M15 27c4 7 14 7 18 0',
  }[level];
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="24" fill={bg} />
      <g fill="none" stroke="#1f2a24" strokeWidth="2" strokeLinecap="round">
        <path d="M14 16c2-2 5-2 7 0M27 16c2-2 5-2 7 0" />
        <path d="M18 20v3M30 20v3" />
        <path d="M24 21v6l-2 1" />
        <path d={mouth} />
      </g>
    </svg>
  );
}
