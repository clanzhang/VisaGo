// i18n/index.tsx — 轻量 i18n（保留 zh-CN / en-US 双语结构）
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import zhCN from './zh-CN'
import enUS from './en-US'
import type { Localized } from '@/types'

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
  /** 取文案，支持点路径与 {n} 占位；key 缺失时开发环境告警并回退中文，绝不显示 key 名 */
  t: (key: string, params?: Record<string, string | number>) => string
  /** 从 {zh,en} 双语数据中取当前语言文案 */
  pickL: (l: Localized | undefined | null) => string
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
      // 缺失时不静默：开发环境打警告，并回退到中文（避免展示 key 名）
      if (import.meta.env.DEV) {
        console.warn(`[i18n] missing key "${key}" in "${lang}"`)
      }
      text = resolve(key, messages['zh-CN'])
    }
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.split(`{${k}}`).join(String(v))
      }
    }
    return text
  }

  function pickL(l: Localized | undefined | null): string {
    if (!l) return ''
    return lang === 'zh-CN' ? l.zh : l.en
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
    <I18nContext.Provider value={{ lang, isZh: lang === 'zh-CN', t, pickL, setLang }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}

/** 地区数据值（中文）→ i18n key；未知地区返回空串由调用方回退 */
const REGION_KEYS: Record<string, string> = {
  亚洲: 'regions.asia',
  欧洲: 'regions.europe',
  美洲: 'regions.americas',
  大洋洲: 'regions.oceania',
  非洲: 'regions.africa',
  港澳台: 'regions.hktw',
}

export function regionLabelKey(region: string): string {
  return REGION_KEYS[region] ?? ''
}
