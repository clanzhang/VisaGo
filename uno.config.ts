import { defineConfig, presetWind, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetWind(),
    presetIcons({
      collections: {
        ri: () => import('@iconify-json/ri/icons.json').then((m) => m.default as any),
      },
      scale: 1.2,
      warn: true,
    }),
  ],
  theme: {
    colors: {
      brand: {
        DEFAULT: '#0B1DA5',
        blue: '#1C39C3',
        dark: '#0D0E32',
        mid: '#17205A',
        muted: '#A2AAD0',
        bg: '#F6F7F9',
      },
      accent: {
        purple: '#7B2FBE',
        orange: '#F5A623',
      },
    },
    fontFamily: {
      sans: ['"Noto Sans SC"', '"DM Sans"', '"Outfit"', 'system-ui', 'sans-serif'],
    },
  },
  shortcuts: {
    'btn-primary':
      'inline-flex items-center justify-center gap-2 rounded-full bg-brand-blue text-white font-medium px-6 py-3 transition-all duration-150 hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
    'btn-purple':
      'inline-flex items-center justify-center gap-2 rounded-full bg-accent-purple text-white font-medium px-6 py-3 transition-all duration-150 hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
    'btn-outline':
      'inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/70 text-white font-medium px-6 py-3 transition-all duration-150 hover:bg-white/10 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
    'card-base':
      'rounded-16px bg-white border border-transparent shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1',
    'input-base':
      'w-full rounded-12px border border-gray-200 bg-white px-4 py-3 text-sm text-brand-dark placeholder:text-brand-muted focus:border-brand-blue focus:ring-3 focus:ring-brand-blue/10 focus:outline-none transition-all duration-200',
    'container-app': 'mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8',
    'section-title': 'text-2xl font-bold text-brand-dark tracking-wide',
  },
  rules: [
    [/^rounded-(\d+)px$/, (m) => ({ 'border-radius': `${m[1]}px` })],
  ],
})
