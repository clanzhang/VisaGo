// components/common/ReminderBanner.tsx — 首页右侧浮动提醒卡片（320px，可逐条关闭）
import { useEffect, useState } from 'react'
import { checkReminders, loadSettings, sendNotification, isTauri, type Reminder } from '@/api/tauri'

const KIND_ICON: Record<Reminder['kind'], string> = {
  submission: '📅',
  issue: '📬',
}

const MAX_VISIBLE = 3

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

  const visible = reminders.slice(0, MAX_VISIBLE)
  const extra = reminders.length - MAX_VISIBLE

  return (
    <div className="w-[320px] shrink-0">
      <div className="flex flex-col gap-1.5 rounded-xl border-l-[3px] border-[#F5A623] bg-white p-3 shadow-md">
        {visible.map((r) => (
          <div key={`${r.id}-${r.kind}`} className="flex items-start gap-2.5 rounded-lg px-1 py-1.5">
            <span className="text-base leading-5">{KIND_ICON[r.kind] ?? '🔔'}</span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold leading-snug text-ink">{r.body}</div>
              <div className="mt-0.5 text-[11px] text-ink/45">
                {r.title} · {r.date} · {r.kind === 'submission' ? '递签提醒' : '出签提醒'}
              </div>
            </div>
            <button
              onClick={() => setReminders((prev) => prev.filter((x) => x.id !== r.id || x.kind !== r.kind))}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#6B7280] transition-colors duration-150 hover:bg-[#F3F4F6]"
              title="关闭提醒"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        ))}
        {extra > 0 && (
          <div className="px-1 pb-1 pt-0.5 text-[11px] text-ink/45">还有 {extra} 条提醒</div>
        )}
      </div>
    </div>
  )
}
