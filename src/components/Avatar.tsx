export const AVATARS = ['man', 'woman', 'boy', 'girl', 'elder'] as const;

/** Illustrated avatars (flat style). Uploaded photos are stored as data URLs. */
export function Avatar({ id, size = 220 }: { id: string; size?: number }) {
  if (id.startsWith('data:')) {
    return <img src={id} alt="" className="rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  const skin = '#f2c4a0';
  const hijab = id === 'woman' || id === 'girl';
  const hair = id === 'elder' ? '#d9d9d9' : '#6b3b2a';
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="rounded-full">
      <defs>
        <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#bfe0f5" /><stop offset="1" stopColor="#7fb6e0" /></linearGradient>
        <clipPath id={`c-${id}`}><circle cx="50" cy="50" r="50" /></clipPath>
      </defs>
      <g clipPath={`url(#c-${id})`}>
        <rect width="100" height="100" fill={`url(#bg-${id})`} />
        <path d="M14 100c2-18 16-26 36-26s34 8 36 26z" fill={hijab ? '#2f7d6d' : '#4e5fb3'} />
        <rect x="43" y="62" width="14" height="14" rx="4" fill={skin} />
        {hijab && <path d="M27 50c0-17 10-28 23-28s23 11 23 28c0 14-6 26-23 30-17-4-23-16-23-30z" fill="#2f7d6d" />}
        <ellipse cx="50" cy="50" rx={hijab ? 15 : 17} ry="19" fill={skin} />
        {!hijab && <path d="M33 46c-2-14 6-22 17-22 12 0 20 7 17 22-2-6-6-9-9-11-6 3-16 4-25 11z" fill={hair} />}
        {(id === 'man' || id === 'elder') && <path d="M36 54c2 12 8 17 14 17s12-5 14-17c-3 5-7 7-14 7s-11-2-14-7z" fill={id === 'elder' ? '#e8e8e8' : '#6b3b2a'} />}
        <circle cx="43" cy="49" r="1.8" fill="#222" /><circle cx="57" cy="49" r="1.8" fill="#222" />
        {id === 'man' && <g fill="none" stroke="#222" strokeWidth="1.6"><rect x="37" y="45" width="11" height="8" rx="3" /><rect x="52" y="45" width="11" height="8" rx="3" /><path d="M48 49h4" /></g>}
        <path d="M45 60c3 2 7 2 10 0" stroke="#a0522d" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        {id === 'boy' && <path d="M35 34c4-6 26-6 30 0v4H35z" fill="#fff" />}
      </g>
    </svg>
  );
}
