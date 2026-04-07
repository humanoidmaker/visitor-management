import type { Config } from 'tailwindcss';
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: { colors: { primary: { DEFAULT: '#1e3a5f' }, accent: { DEFAULT: '#0ea5e9' } }, fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] } } },
  plugins: [],
} satisfies Config;
