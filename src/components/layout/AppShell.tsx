// components/layout/AppShell.tsx — 应用外壳（侧边栏 + 主内容区）
import { useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate()

  // 全局快捷键：Command+, 打开设置页
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault()
        navigate('/settings')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [navigate])

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1280px] px-8 py-8">{children}</div>
      </main>
    </div>
  )
}
