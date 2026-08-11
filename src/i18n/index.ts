// i18n/index.ts
import { createI18n } from 'vue-i18n'
import zhCN from './zh-CN'
import enUS from './en-US'

export const LANGUAGES = ['zh-CN', 'en-US'] as const
export type Language = (typeof LANGUAGES)[number]

function detectLanguage(): Language {
  const saved = localStorage.getItem('visago:lang')
  if (saved === 'zh-CN' || saved === 'en-US') return saved
  const nav = navigator.language || 'zh-CN'
  return nav.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US'
}

export const i18n = createI18n({
  legacy: false,
  locale: detectLanguage(),
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
})

export function setAppLanguage(lang: Language) {
  localStorage.setItem('visago:lang', lang)
  i18n.global.locale.value = lang
  document.documentElement.lang = lang === 'zh-CN' ? 'zh-CN' : 'en'
}
