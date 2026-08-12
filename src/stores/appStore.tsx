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

export interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

interface AppStoreValue {
  language: Language
  theme: 'light' | 'dark'
  toasts: ToastItem[]
  isZh: boolean
  settingsOpen: boolean
  setLanguage: (lang: Language) => void
  toggleTheme: () => void
  toast: (message: string, type?: ToastItem['type']) => void
  dismissToast: (id: number) => void
  openSettings: () => void
  closeSettings: () => void
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

  const setLanguage = useCallback((lang: Language) => {
    localStorage.setItem('visago:lang', lang)
    setLanguageState(lang)
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (message: string, type: ToastItem['type'] = 'info') => {
      const id = ++toastId.current
      setToasts((prev) => [...prev, { id, message, type }])
      setTimeout(() => dismissToast(id), 3000)
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
      setLanguage,
      toggleTheme: () => setTheme((t) => (t === 'light' ? 'dark' : 'light')),
      toast,
      dismissToast,
      openSettings: () => setSettingsOpen(true),
      closeSettings: () => setSettingsOpen(false),
    }),
    [language, theme, toasts, settingsOpen, setLanguage, toast, dismissToast],
  )

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
}

export function useAppStore(): AppStoreValue {
  const ctx = useContext(AppStoreContext)
  if (!ctx) throw new Error('useAppStore must be used within AppStoreProvider')
  return ctx
}
