/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        background: 'rgb(var(--color-background) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-elevated': 'rgb(var(--color-surface-elevated) / <alpha-value>)',
        'text-primary': 'rgb(var(--color-text) / <alpha-value>)',
        'text-muted': 'rgb(var(--color-text-muted) / <alpha-value>)',
        'text-soft': 'rgb(var(--color-text-soft) / <alpha-value>)',
        sidebar: 'rgb(var(--color-sidebar) / <alpha-value>)',
        'sidebar-text': 'rgb(var(--color-sidebar-text) / <alpha-value>)',
        'sidebar-active': 'rgb(var(--color-sidebar-active) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        'status-success': 'var(--color-status-success)',
        'status-warning': 'var(--color-status-warning)',
        'status-danger': 'var(--color-status-danger)',
        'status-info': 'var(--color-status-info)',
      },
      borderRadius: {
        sm: '12px',
        md: '18px',
        lg: '28px',
        pill: '999px',
      },
      fontFamily: {
        serif: ['"DM Serif Display"', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        strong: 'var(--shadow-strong)',
      },
    },
  },
  plugins: [],
};
