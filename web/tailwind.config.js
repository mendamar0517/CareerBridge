// Өнгөний сэдэв: accent өнгийг CSS хувьсагчаар (src/theme.jsx) сольдог тул
// Tailwind-ийн `accent`, `accent-soft`, `link` өнгө нь rgb(var(--…)) хэлбэртэй.
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        ink: '#111111',
        canvas: '#F4F4F5',
        line: '#E7E7EA',
        accent: { DEFAULT: 'rgb(var(--accent) / <alpha-value>)', soft: 'rgb(var(--accent-soft) / <alpha-value>)' },
        link: 'rgb(var(--link) / <alpha-value>)',
      },
      maxWidth: { page: '1168px' },
    },
  },
  plugins: [],
};
