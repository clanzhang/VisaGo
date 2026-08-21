// stores/appStore.tsx — 全局 UI 状态（语言、主题、Toast）
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Language } from '@/i18n'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  /** 可选动作按钮（如「去设置开启提醒」） */
  action?: ToastAction
}

/** 设置弹窗分区（供 openSettings 指定默认落点） */
export type SettingsSection = 'notify' | 'about' | 'ai'

interface AppStoreValue {
  language: Language
  theme: 'light' | 'dark'
  toasts: ToastItem[]
  isZh: boolean
  settingsOpen: boolean
  /** 设置弹窗当前分区（openSettings 指定后作为默认落点） */
  settingsSection: SettingsSection
  /** 个人资料弹窗（侧栏用户卡片入口）；与设置弹窗互斥 */
  profileOpen: boolean
  setLanguage: (lang: Language) => void
  toggleTheme: () => void
  toast: (message: string, type?: ToastItem['type'], action?: ToastAction) => void
  dismissToast: (id: number) => void
  openSettings: (section?: SettingsSection) => void
  closeSettings: () => void
  openProfile: () => void
  closeProfile: () => void
}

const AppStoreContext = createContext<AppStoreValue | null>(null)

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(
    (localStorage.getItem('visago:lang') as Language) || 'zh-CN',
  )
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const toastId = useRef(0)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('notify')
  const [profileOpen, setProfileOpen] = useState(false)

  const setLanguage = useCallback((lang: Language) => {
    localStorage.setItem('visago:lang', lang)
    setLanguageState(lang)
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (message: string, type: ToastItem['type'] = 'info', action?: ToastAction) => {
      const id = ++toastId.current
      setToasts((prev) => [...prev, { id, message, type, action }].slice(-3)) // 最多同时 3 条，不遮挡
      setTimeout(() => dismissToast(id), 4000) // 停留 4s，足够读完
    },
    [dismissToast],
  )

  const value = useMemo<AppStoreValue>(
    () => ({
      language,
      theme,
      toasts,
      isZh: language === 'zh-CN',
      settingsOpen,
      settingsSection,
      profileOpen,
      setLanguage,
      toggleTheme: () => setTheme((t) => (t === 'light' ? 'dark' : 'light')),
      toast,
      dismissToast,
      openSettings: (section?: SettingsSection) => {
        // 设置与个人资料互斥：开设置先关资料
        setProfileOpen(false)
        if (section) setSettingsSection(section)
        setSettingsOpen(true)
      },
      closeSettings: () => setSettingsOpen(false),
      openProfile: () => {
        // 个人资料与设置互斥：开资料先关设置
        setSettingsOpen(false)
        setProfileOpen(true)
      },
      closeProfile: () => setProfileOpen(false),
    }),
    [language, theme, toasts, settingsOpen, settingsSection, profileOpen, setLanguage, toast, dismissToast],
  )

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
}

export function useAppStore(): AppStoreValue {
  const ctx = useContext(AppStoreContext)
  if (!ctx) throw new Error('useAppStore must be used within AppStoreProvider')
  return ctx
}
