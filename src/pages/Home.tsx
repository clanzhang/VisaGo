// pages/Home.tsx — 首页仪表盘（AI 数据驱动 + 静态兜底）
import { useState } from 'react'
import { Header } from '@/components/layout'
import { StatsSection } from '@/components/home/StatsSection'
import { DestinationGrid } from '@/components/home/DestinationGrid'
import { RecentActivity } from '@/components/home/RecentActivity'
import { ReminderBanner } from '@/components/common/ReminderBanner'
import { useHomeAIData } from '@/hooks/useAIData'
import { useAppStore } from '@/stores/appStore'

export default function Home() {
  const { data, loading, refreshing, refresh } = useHomeAIData()
  const { toast } = useAppStore()
  const [updatedAt, setUpdatedAt] = useState('更新于 10 分钟前')

  function handleRefresh() {
    if (loading || refreshing) return
    refresh()
    toast('已触发数据刷新', 'info')
    setUpdatedAt('更新于刚刚')
    setTimeout(() => setUpdatedAt('更新于 10 分钟前'), 8000)
  }

  return (
    <div className="flex flex-col gap-8">
      {/* 顶部：问候语/搜索（左）+ 提醒浮动卡片（右上角） */}
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <Header />
        </div>
        <ReminderBanner />
      </div>

      {/* 统计区域（含刷新按钮 + 更新于） */}
      <StatsSection
        stats={{ feeTotal: data.feeTotal, feeCategories: data.feeCategories, progress: data.progress }}
        refreshing={refreshing}
        updatedAt={updatedAt}
        onRefresh={handleRefresh}
      />

      {/* 最近活动时间线 */}
      <RecentActivity />

      {/* 热门目的地 */}
      <DestinationGrid destinations={data.destinations} />
    </div>
  )
}
