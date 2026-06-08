import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      mobile: { max: '640px' },
      tablet: { min: '640px', max: '1024px' },
      desktop: { min: '1024px' },
    },
    extend: {
      colors: {
        'bg-primary': 'var(--color-bg-primary)',
        'bg-secondary': 'var(--color-bg-secondary)',
        'bg-card': 'var(--color-bg-card)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        accent: 'var(--color-accent)',
        'accent-hover': 'var(--color-accent-hover)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        danger: 'var(--color-danger)',
        'badge-bronze': 'var(--color-badge-bronze)',
        'badge-silver': 'var(--color-badge-silver)',
        'badge-gold': 'var(--color-badge-gold)',
        'badge-platinum': 'var(--color-badge-platinum)',
        'badge-elite': 'var(--color-badge-elite)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
