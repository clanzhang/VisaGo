// i18n/index.tsx — 轻量 i18n（保留 zh-CN / en-US 双语结构）
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import zhCN from './zh-CN'
import enUS from './en-US'

export const LANGUAGES = ['zh-CN', 'en-US'] as const
export type Language = (typeof LANGUAGES)[number]

type Messages = typeof zhCN

export function detectLanguage(): Language {
  const saved = localStorage.getItem('visago:lang')
  if (saved === 'zh-CN' || saved === 'en-US') return saved
  const nav = navigator.language || 'zh-CN'
  return nav.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US'
}

const messages: Record<Language, Messages> = { 'zh-CN': zhCN, 'en-US': enUS }

interface I18nContextValue {
  lang: Language
  isZh: boolean
  /** 取文案，支持点路径与 {n} 占位 */
  t: (key: string, params?: Record<string, string | number>) => string
  setLang: (lang: Language) => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(detectLanguage)

  function resolve(key: string, table: Messages): string {
    const parts = key.split('.')
    let node: unknown = table
    for (const k of parts) {
      if (node === undefined || node === null || typeof node !== 'object') {
        return key
      }
      node = (node as Record<string, unknown>)[k]
    }
    return typeof node === 'string' ? node : key
  }

  function t(key: string, params?: Record<string, string | number>): string {
    let text = resolve(key, messages[lang])
    if (text === key) {
      // 回退到中文
      text = resolve(key, messages['zh-CN'])
    }
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.split(`{${k}}`).join(String(v))
      }
    }
    return text
  }

  function setLang(next: Language) {
    localStorage.setItem('visago:lang', next)
    setLangState(next)
    document.documentElement.lang = next === 'zh-CN' ? 'zh-CN' : 'en'
  }

  useEffect(() => {
    document.documentElement.lang = lang === 'zh-CN' ? 'zh-CN' : 'en'
  }, [lang])

  return (
    <I18nContext.Provider value={{ lang, isZh: lang === 'zh-CN', t, setLang }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
