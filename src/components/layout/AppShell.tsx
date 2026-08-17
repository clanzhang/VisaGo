// components/layout/AppShell.tsx — 应用外壳（侧边栏 + 主内容区）
// ≤768px：侧边栏抽屉化（汉堡按钮 + 遮罩），主内容不横向溢出
import { useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { SettingsModal } from '@/components/common/SettingsModal'
import { useAppStore } from '@/stores/appStore'
import { useI18n } from '@/i18n'

export function AppShell({ children }: { children: ReactNode }) {
  const { openSettings } = useAppStore()
  const { t } = useI18n()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  // 路由变化时自动收起移动端抽屉
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // 全局快捷键：Command+, 打开设置弹窗
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault()
        openSettings()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [openSettings])

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1280px] px-4 py-5 sm:px-8 sm:py-8">
          {/* 移动端汉堡按钮（仅 ≤768px 显示） */}
          <button
            onClick={() => setMobileOpen(true)}
            className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-ink shadow-card md:hidden"
            aria-label={t('sidebar.expand')}
            title={t('sidebar.expand')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {children}
        </div>
      </main>
      <SettingsModal />
    </div>
  )
}
