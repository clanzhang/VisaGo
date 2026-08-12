// components/layout/AppShell.tsx — 应用外壳（侧边栏 + 主内容区）
import { useEffect, type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { SettingsModal } from '@/components/common/SettingsModal'
import { useAppStore } from '@/stores/appStore'

export function AppShell({ children }: { children: ReactNode }) {
  const { openSettings } = useAppStore()

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
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1280px] px-8 py-8">{children}</div>
      </main>
      <SettingsModal />
    </div>
  )
}
