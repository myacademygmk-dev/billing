import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(214.3 31.8% 91.4%)',
        background: 'hsl(210 40% 98%)',
        foreground: 'hsl(222.2 84% 4.9%)',
        card: 'hsl(0 0% 100%)'
      },
      keyframes: {
        'slide-in-left': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' }
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' }
        }
      },
      animation: {
        'slide-in-left': 'slide-in-left 200ms ease-out',
        'fade-in': 'fade-in 150ms ease-out'
      }
    }
  },
  plugins: []
};

export default config;
