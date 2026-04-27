/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── Brand Palette ──────────────────────────
        'wood-dark':    '#1a1a1a',   // deepest background
        'wood-base':    '#222222',   // primary background
        'wood-surface': '#2a2a2a',   // card surfaces
        'wood-raised':  '#333333',   // elevated elements
        'wood-border':  '#3d3020',   // borders with warm tint

        'bronze':       '#8B6914',   // primary accent
        'bronze-light': '#C4952A',   // hover accent
        'bronze-dim':   '#6B5010',   // muted accent
        'brass':        '#B8960C',   // secondary accent

        'oak':          '#C4A882',   // warm text
        'oak-light':    '#D4B896',   // lighter text
        'oak-dim':      '#8B7355',   // muted text

        'cream':        '#F5EDD6',   // primary text
        'cream-dim':    '#C8B89A',   // secondary text
        'cream-muted':  '#8A7A65',   // tertiary text

        // ── Status Colors ──────────────────────────
        'status-pending':    '#D4A017',
        'status-confirmed':  '#4A90D9',
        'status-progress':   '#E07B39',
        'status-completed':  '#5BA85A',
        'status-cancelled':  '#C0392B',

        // ── M3 Design Tokens ──────────────────────
        'inverse-on-surface': '#f2f1ec',
        'surface-bright': '#fbf9f4',
        'on-primary-container': '#98b3a9',
        'surface-container': '#f0eee9',
        'on-primary': '#ffffff',
        'surface-variant': '#e4e2dd',
        'primary-container': '#2d463e',
        'secondary': '#79573f',
        'surface': '#fbf9f4',
        'primary-fixed-dim': '#b1cdc2',
        'on-tertiary': '#ffffff',
        'on-tertiary-fixed-variant': '#59422c',
        'error': '#ba1a1a',
        'surface-container-high': '#eae8e3',
        'on-secondary-fixed-variant': '#5f402a',
        'primary-fixed': '#cce9dd',
        'on-surface': '#1b1c19',
        'on-tertiary-container': '#c7a88c',
        'tertiary-fixed-dim': '#e1c1a3',
        'background': '#fbf9f4',
        'outline-variant': '#c2c8c4',
        'on-secondary-container': '#7a5840',
        'surface-container-low': '#f5f3ee',
        'on-background': '#1b1c19',
        'on-secondary-fixed': '#2d1604',
        'primary': '#173028',
        'inverse-surface': '#30312e',
        'on-error-container': '#93000a',
        'on-surface-variant': '#2f3633',
        'error-container': '#ffdad6',
        'tertiary': '#3b2713',
        'on-secondary': '#ffffff',
        'tertiary-container': '#533d27',
        'on-error': '#ffffff',
        'inverse-primary': '#b1cdc2',
        'on-primary-fixed-variant': '#334c44',
        'surface-container-lowest': '#ffffff',
        'outline': '#727975',
        'surface-dim': '#dbdad5',
        'secondary-fixed': '#ffdcc6',
        'surface-container-highest': '#e4e2dd',
        'tertiary-fixed': '#ffdcbe',
        'surface-tint': '#4a645b',
        'on-tertiary-fixed': '#291805',
        'secondary-container': '#ffd1b3',
        'on-primary-fixed': '#062019',
        'secondary-fixed-dim': '#eabda0',
      },
      fontFamily: {
        serif:  ['Playfair Display', 'Georgia', 'serif'],
        sans:   ['Inter', 'system-ui', 'sans-serif'],
        mono:   ['JetBrains Mono', 'monospace'],
        headline: ['Noto Serif', 'serif'],
        body:   ['Manrope', 'sans-serif'],
        label:  ['Manrope', 'sans-serif'],
      },
      backgroundImage: {
        'wood-grain': `
          repeating-linear-gradient(
            92deg,
            transparent,
            transparent 2px,
            rgba(139,105,20,0.03) 2px,
            rgba(139,105,20,0.03) 4px
          ),
          repeating-linear-gradient(
            180deg,
            transparent,
            transparent 8px,
            rgba(139,105,20,0.02) 8px,
            rgba(139,105,20,0.02) 9px
          )
        `,
        'bronze-gradient': 'linear-gradient(135deg, #8B6914 0%, #C4952A 50%, #8B6914 100%)',
        'dark-gradient':   'linear-gradient(180deg, #1a1a1a 0%, #222222 100%)',
        'hero-overlay':    'linear-gradient(to right, rgba(26,26,26,0.95) 0%, rgba(26,26,26,0.7) 60%, rgba(26,26,26,0.3) 100%)',
      },
      boxShadow: {
        'bronze':     '0 0 20px rgba(139,105,20,0.3)',
        'bronze-lg':  '0 0 40px rgba(139,105,20,0.4)',
        'inset-wood': 'inset 0 2px 4px rgba(0,0,0,0.5)',
        'card':       '0 4px 20px rgba(0,0,0,0.5)',
        'card-hover': '0 8px 30px rgba(139,105,20,0.2)',
      },
      animation: {
        'shimmer':      'shimmer 2s infinite',
        'fade-in':      'fadeIn 0.5s ease-in-out',
        'slide-up':     'slideUp 0.4s ease-out',
        'kanna-slide':  'kannaSlide 2s ease-in-out infinite',
        'curl-rise':    'curlRise 2s ease-in-out infinite',
        'spin-slow':    'spin 3s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        kannaSlide: {
          '0%':   { transform: 'translateX(-10px)' },
          '50%':  { transform: 'translateX(10px)' },
          '100%': { transform: 'translateX(-10px)' },
        },
        curlRise: {
          '0%':   { opacity: '0', transform: 'translateY(0) rotate(0deg)' },
          '50%':  { opacity: '1', transform: 'translateY(-20px) rotate(180deg)' },
          '100%': { opacity: '0', transform: 'translateY(-40px) rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
}
