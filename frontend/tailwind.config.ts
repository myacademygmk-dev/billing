import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'var(--panel-line)',
        background: 'var(--bg)',
        foreground: 'var(--text)',
        card: 'var(--panel)',
        heading: 'var(--heading)',
        muted: 'var(--muted)',
        accent: {
          DEFAULT: 'var(--accent)',
          soft: 'var(--accent-soft)',
        },
        success: {
          DEFAULT: 'var(--success)',
          soft: 'var(--chip-success-bg)',
          text: 'var(--chip-success-text)',
        },
        warn: {
          DEFAULT: 'var(--warn)',
          soft: 'var(--chip-warn-bg)',
          text: 'var(--chip-warn-text)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          soft: 'var(--chip-danger-bg)',
          text: 'var(--chip-danger-text)',
        },
        surface: {
          subtle: 'var(--surface-subtle)',
          muted: 'var(--surface-muted)',
        },
        field: {
          bg: 'var(--field-bg)',
          border: 'var(--field-border)',
          placeholder: 'var(--field-placeholder)',
        },
        sidebar: {
          bg: 'var(--sidebar-bg)',
          border: 'var(--sidebar-border)',
          text: 'var(--sidebar-text)',
          muted: 'var(--sidebar-muted)',
          accent: 'var(--sidebar-accent)',
          hover: 'var(--sidebar-hover)',
        },
      },
      borderRadius: {
        sm: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'slide-in-left': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-scale': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(12px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-out-right': {
          from: { opacity: '1', transform: 'translateX(0)' },
          to: { opacity: '0', transform: 'translateX(12px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      animation: {
        marquee: 'marquee 30s linear infinite',
        'slide-in-left': 'slide-in-left 200ms ease-out',
        'fade-in': 'fade-in 150ms ease-out',
        'fade-in-up': 'fade-in-up 200ms ease-out',
        'fade-in-scale': 'fade-in-scale 200ms ease-out',
        'slide-in-right': 'slide-in-right 250ms ease-out',
        'slide-out-right': 'slide-out-right 200ms ease-out',
        shimmer: 'shimmer 2s linear infinite',
        'pulse-subtle': 'pulse-subtle 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
