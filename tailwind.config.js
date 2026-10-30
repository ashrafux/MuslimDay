/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: v('bg'),
        surface: v('surface'),
        ink: v('ink'),
        muted: v('muted'),
        line: v('line'),
        mint: v('mint'),
        chip: v('chip'),
        brand: v('brand'),
        'brand-dark': v('brand-dark'),
        gold: v('gold'),
        alert: v('alert'),
      },
      fontFamily: {
        bn: ['"Tiro Bangla"', '"Noto Sans Bengali"', 'serif'],
        ar: ['Amiri', '"Scheherazade New"', 'serif'],
        sch: ['"Scheherazade New"', 'Amiri', 'serif'],
      },
      maxWidth: { app: '480px' },
    },
  },
  plugins: [],
};
