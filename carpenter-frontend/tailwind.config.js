// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {

      colors: {
        wood: {
          50:  '#FDF8F2',
          100: '#F5E6D3',
          200: '#E8C9A0',
          300: '#D4A574',
          400: '#B8864A',
          500: '#8B5E2E',
          600: '#6B4520',
          700: '#4A2F14',
          800: '#2E1C0A',
          900: '#180E05',
        },
        surface: {
          public: '#EFEAE2',
          client: '#EAE4DB',
          admin:  '#1E1A16',
        },
      },

      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      fontSize: {
        'xs':   ['0.6875rem', { lineHeight: '1rem' }],
        'sm':   ['0.8125rem', { lineHeight: '1.25rem' }],
        'base': ['0.9375rem', { lineHeight: '1.5rem' }],
        'md':   ['1.0625rem', { lineHeight: '1.625rem' }],
        'lg':   ['1.25rem',   { lineHeight: '1.75rem' }],
        'xl':   ['1.5rem',    { lineHeight: '2rem' }],
        '2xl':  ['1.875rem',  { lineHeight: '2.375rem' }],
        '3xl':  ['2.25rem',   { lineHeight: '2.75rem' }],
        '4xl':  ['3rem',      { lineHeight: '3.5rem' }],
      },

      borderRadius: {
        'xs':   '6px',
        'sm':   '10px',
        'md':   '16px',
        'lg':   '22px',
        'xl':   '30px',
        '2xl':  '40px',
      },

      boxShadow: {
        /* Public raised */
        'nm-pub-xs':  '-2px -2px 5px rgba(255,255,255,0.90),  2px 2px 5px rgba(163,150,133,0.55)',
        'nm-pub-sm':  '-4px -4px 10px rgba(255,255,255,0.90), 4px 4px 10px rgba(163,150,133,0.55)',
        'nm-pub-md':  '-6px -6px 16px rgba(255,255,255,0.90), 6px 6px 16px rgba(163,150,133,0.55)',
        'nm-pub-lg':  '-10px -10px 28px rgba(255,255,255,0.90), 10px 10px 28px rgba(163,150,133,0.55)',
        /* Public inset */
        'nm-pub-in':  'inset -3px -3px 8px rgba(255,255,255,0.90), inset 3px 3px 8px rgba(163,150,133,0.55)',
        'nm-pub-in-sm':'inset -2px -2px 5px rgba(255,255,255,0.90), inset 2px 2px 5px rgba(163,150,133,0.55)',
        /* Admin raised */
        'nm-adm-sm':  '-4px -4px 10px rgba(48,42,35,0.75), 4px 4px 10px rgba(8,7,5,0.95)',
        'nm-adm-md':  '-6px -6px 16px rgba(48,42,35,0.75), 6px 6px 16px rgba(8,7,5,0.95)',
        'nm-adm-lg':  '-10px -10px 28px rgba(48,42,35,0.75), 10px 10px 28px rgba(8,7,5,0.95)',
        /* Admin inset */
        'nm-adm-in':  'inset -3px -3px 8px rgba(48,42,35,0.75), inset 3px 3px 8px rgba(8,7,5,0.95)',
        'nm-adm-in-sm':'inset -2px -2px 5px rgba(48,42,35,0.75), inset 2px 2px 5px rgba(8,7,5,0.95)',
        /* Primary button */
        'nm-btn-pri': '-4px -4px 10px rgba(184,134,74,0.35), 4px 4px 10px rgba(74,47,20,0.50)',
      },

      animation: {
        'nm-in':      'nmIn 180ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'nm-slide-up':'nmSlideUp 280ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'nm-skeleton':'nmSkeleton 1.6s ease-in-out infinite',
        'nm-current': 'nmCurrent 2s ease-in-out infinite',
        'nm-pulse':   'nmPulse 2s ease-in-out infinite',
      },

      keyframes: {
        nmIn: {
          from: { opacity: '0', transform: 'scale(0.94)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        nmSlideUp: {
          from: { opacity: '0', transform: 'translateY(20px) scale(0.94)' },
          to:   { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        nmSkeleton: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.40' },
        },
        nmCurrent: {
          '0%, 100%': { boxShadow: 'inset -2px -2px 6px rgba(255,255,255,0.90), inset 2px 2px 6px rgba(163,150,133,0.55), 0 0 0 3px #D4A574' },
          '50%':      { boxShadow: 'inset -2px -2px 6px rgba(255,255,255,0.90), inset 2px 2px 6px rgba(163,150,133,0.55), 0 0 0 5px rgba(212,165,116,0.25)' },
        },
        nmPulse: {
          '0%, 100%': { transform: 'scale(1)',    opacity: '1' },
          '50%':      { transform: 'scale(0.80)', opacity: '0.55' },
        },
      },
    },
  },
  plugins: [],
} 
