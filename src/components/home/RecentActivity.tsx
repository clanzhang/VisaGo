// components/home/RecentActivity.tsx — 最近活动时间线（localStorage 记录）
import { useEffect, useState } from 'react'
import { useI18n } from '@/i18n'

export interface Activity {
  id: string
  icon: string
  desc: string
  time: number // timestamp
}

const STORAGE_KEY = 'visago:activity'
const MAX_ITEMS = 10

/** 记录一条最近活动（供其他页面调用） */
export function recordActivity(icon: string, desc: string) {
  try {
    const list: Activity[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    list.unshift({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, icon, desc, time: Date.now() })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_ITEMS)))
  } catch {
    /* 忽略 */
  }
}

/** 相对时间：刚刚 / x 分钟前 / x 小时前 / x 天前 */
function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} 小时前`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day} 天前`
  return new Date(ts).toLocaleDateString()
}

export function RecentActivity() {
  const { t } = useI18n()
  const [items, setItems] = useState<Activity[]>([])

  useEffect(() => {
    try {
      const list: Activity[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      setItems(list.slice(0, 5))
    } catch {
      setItems([])
    }
  }, [])

  return (
    <section>
      <h2 className="font-display mb-5 text-xl font-bold tracking-tight text-ink">
        {t('home.recentActivity')}
      </h2>
      <div className="rounded-2xl bg-white p-6 shadow-card">
        {items.length === 0 ? (
          <div className="py-6 text-center text-sm text-ink/40">暂无最近活动</div>
        ) : (
          <div className="relative space-y-5 pl-1">
            {/* 竖向时间线 */}
            <div className="absolute bottom-2 left-[15px] top-2 w-px bg-ink/8" />
            {items.map((a) => (
              <div key={a.id} className="relative flex items-center gap-3.5">
                <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F3F4F6]">
                  <span className="text-sm">{a.icon}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-ink">{a.desc}</div>
                </div>
                <span className="shrink-0 text-xs text-ink/40">{relativeTime(a.time)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
