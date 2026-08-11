// components/home/StatsSection.tsx — 统计区域（费用概览 + 办理进度柱状图）
import { useEffect, useState } from 'react'
import { useI18n } from '@/i18n'
import { feeOverview, progressData } from '@/data/mock'
import type { FeeCategory, ProgressItem } from '@/types'

export interface StatsData {
  feeTotal: string
  feeCategories: FeeCategory[]
  progress: ProgressItem[]
}

interface Props {
  stats?: Partial<StatsData>
}

export function StatsSection({ stats }: Props) {
  const { t } = useI18n()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // 触发柱状图生长动画
    const raf = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  const categories = stats?.feeCategories?.length ? stats.feeCategories : feeOverview.categories
  const feeTotal = stats?.feeTotal || feeOverview.total
  const progress = stats?.progress?.length ? stats.progress : progressData
  const max = Math.max(...progress.map((p) => p.progress))

  return (
    <section>
      <h2 className="font-display mb-5 text-xl font-bold tracking-tight text-ink">
        {t('home.statsTitle')}
      </h2>
      <div className="grid gap-6 md:grid-cols-2">
        {/* 费用概览 */}
        <div
          className="anim-card rounded-2xl bg-white p-6 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-card-lg"
          style={{ animationDelay: '0ms' }}
        >
          <h3 className="mb-1 text-sm font-medium text-subtle">{t('home.feeTitle')}</h3>
          <div className="font-display mt-2 text-4xl font-bold tracking-tight text-ink">
            {feeTotal}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {categories.map((c) => (
              <span
                key={c.label}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#F9F9F6] px-3 py-1.5 text-xs font-medium text-ink/70"
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                {c.label} {c.percent}%
              </span>
            ))}
          </div>
        </div>

        {/* 办理进度 */}
        <div
          className="anim-card rounded-2xl bg-white p-6 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-card-lg"
          style={{ animationDelay: '80ms' }}
        >
          <h3 className="mb-4 text-sm font-medium text-subtle">{t('home.progressTitle')}</h3>
          <div className="space-y-4">
            {progress.map((item, i) => {
              const isTop = item.progress === max
              return (
                <div key={item.country} className="flex items-center gap-3">
                  <span className="w-8 text-base">{item.flag}</span>
                  <span className="w-10 shrink-0 text-[13px] font-medium text-ink">
                    {item.country}
                  </span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#F3F4F6]">
                    <div
                      className={`h-full rounded-full transition-all duration-600 ease-out ${isTop ? 'bg-[#39A2B8]' : 'bg-[#4B5563]/70'}`}
                      style={{
                        width: mounted ? `${item.progress}%` : '0%',
                        transitionDelay: `${i * 90}ms`,
                      }}
                    />
                  </div>
                  <span className={`w-8 text-right text-xs font-semibold ${isTop ? 'text-[#39A2B8]' : 'text-ink/50'}`}>
                    {item.progress}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
