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
        chip: v('chip'),
        brand: v('brand'),
        'brand-dark': v('brand-dark'),
        accent: v('accent'),
        night: v('night'),
        gold: v('gold'),
        alert: v('alert'),
        // pastel set (inspired by the mood / course cards)
        mint: v('mint'),
        lav: v('lav'),
        sand: v('sand'),
        sky: v('sky'),
        rose: v('rose'),
        butter: v('butter'),
        // saturated mood tones
        'm-green': v('m-green'),
        'm-yellow': v('m-yellow'),
        'm-blue': v('m-blue'),
        'm-gray': v('m-gray'),
        'm-pink': v('m-pink'),
      },
      fontFamily: {
        bn: ['"Plus Jakarta Sans"', '"Hind Siliguri"', 'system-ui', 'sans-serif'],
        ar: ['Amiri', '"Scheherazade New"', 'serif'],
        sch: ['"Scheherazade New"', 'Amiri', 'serif'],
      },
      maxWidth: { app: '480px' },
      boxShadow: {
        card: '0 1px 2px rgb(20 20 30 / .04), 0 10px 30px -12px rgb(20 20 30 / .10)',
        float: '0 12px 40px -10px rgb(20 20 30 / .25)',
      },
      borderRadius: { '4xl': '28px' },
    },
  },
  plugins: [],
};
