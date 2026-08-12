// components/common/ReminderBanner.tsx — 首页顶部签证提醒横幅（黄色，可逐条关闭）
import { useEffect, useState } from 'react'
import { checkReminders, loadSettings, sendNotification, isTauri, type Reminder } from '@/api/tauri'

const KIND_ICON: Record<Reminder['kind'], string> = {
  submission: '📅',
  issue: '📬',
}

export function ReminderBanner() {
  const [reminders, setReminders] = useState<Reminder[]>([])

  // 应用启动时检查提醒 + 按设置推送系统通知
  useEffect(() => {
    if (!isTauri()) return
    ;(async () => {
      try {
        const list = await checkReminders()
        console.log('[ReminderBanner] 检查到提醒:', list)
        setReminders(list)
        // desktopNotification 为 true 才推系统通知（false 只显示应用内横幅）
        let pushSystem = true
        try {
          const s = await loadSettings()
          pushSystem = s.desktop_notification
        } catch {
          /* 读取失败则默认推送 */
        }
        if (pushSystem) {
          for (const r of list) {
            await sendNotification('VisaGo 签证提醒', r.body).catch((e) =>
              console.warn('[ReminderBanner] 系统通知发送失败:', e),
            )
          }
        } else {
          console.log('[ReminderBanner] 桌面通知已关闭，仅显示应用内横幅')
        }
      } catch (e) {
        console.warn('[ReminderBanner] 检查提醒失败:', e)
      }
    })()
  }, [])

  if (reminders.length === 0) return null

  return (
    <div className="flex flex-col gap-2.5">
      {reminders.map((r) => (
        <div
          key={`${r.id}-${r.kind}`}
          className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-gradient-to-r from-[#FFFBEB] to-[#FFF7E6] px-4 py-3 shadow-card"
        >
          <span className="text-lg">{KIND_ICON[r.kind] ?? '🔔'}</span>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-amber-800">{r.body}</div>
            <div className="text-xs text-amber-700/70">
              {r.title} · {r.date} · {r.kind === 'submission' ? '递签提醒' : '出签提醒'}
            </div>
          </div>
          <button
            onClick={() => setReminders((prev) => prev.filter((x) => x.id !== r.id || x.kind !== r.kind))}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-amber-700/60 transition-colors hover:bg-amber-100 hover:text-amber-800"
            title="关闭提醒"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}
