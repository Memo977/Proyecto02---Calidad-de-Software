/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Sora', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        base: {
          DEFAULT: '#070a10',
          50: '#0d1420',
          100: '#111b2e',
          200: '#1a2540',
          300: '#243352',
        },
        accent: {
          DEFAULT: '#4361ee',
          light: '#738ef7',
          glow: 'rgba(67,97,238,0.3)',
        },
        violet: {
          DEFAULT: '#7c3aed',
          light: '#a78bfa',
        },
        cyan: {
          DEFAULT: '#06b6d4',
          light: '#67e8f9',
        },
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#f43f5e',
        tx: {
          primary: '#cdd6e8',
          secondary: '#6b7fa0',
          muted: '#3d4f6e',
        },
      },
      boxShadow: {
        glow: '0 0 20px rgba(67,97,238,0.25)',
        'glow-sm': '0 0 10px rgba(67,97,238,0.15)',
        card: '0 4px 24px rgba(0,0,0,0.4)',
      },
      backgroundImage: {
        'grid-pattern': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M0 0h1v40H0zM0 0h40v1H0z' stroke='%231a2540' stroke-width='0.5'/%3E%3C/svg%3E\")",
      },
      keyframes: {
        fadeIn: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideIn: { from: { opacity: '0', transform: 'translateX(-12px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        pulse2: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
        shimmer: { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
      },
      animation: {
        fadeIn: 'fadeIn 0.35s ease forwards',
        slideIn: 'slideIn 0.3s ease forwards',
        pulse2: 'pulse2 2s ease-in-out infinite',
        shimmer: 'shimmer 1.5s infinite linear',
      },
    },
  },
  plugins: [],
};
