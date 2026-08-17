// pages/Home.tsx — 首页仪表盘（AI 数据驱动 + 静态兜底）
import { Header } from '@/components/layout'
import { HeroCards } from '@/components/home/HeroCards'
import { StatsSection } from '@/components/home/StatsSection'
import { DestinationGrid } from '@/components/home/DestinationGrid'
import { ReminderBanner } from '@/components/common/ReminderBanner'
import { useHomeAIData } from '@/hooks/useAIData'
import { useRealStats } from '@/hooks/useRealStats'
import { useAppStore } from '@/stores/appStore'
import { useI18n } from '@/i18n'

export default function Home() {
  const { t } = useI18n()
  const { data, loading, refreshing, refresh } = useHomeAIData()
  // 统计模块从真实申请记录计算（费用 + 进度），AI 数据仅用于 destinations 和 hero
  const realStats = useRealStats()
  const { toast } = useAppStore()

  return (
    <div className="flex flex-col gap-8">
      {/* 刷新按钮已并入 Header：标题 shrink-0 不换行，搜索框 min-w-0 可伸缩 */}
      <Header
        onRefresh={() => {
          if (loading || refreshing) return
          refresh()
          toast(t('home.refreshDone'), 'info')
        }}
        refreshing={loading || refreshing}
      />

      {/* 顶部提醒横幅（今天有递签/出签安排的申请） */}
      <ReminderBanner />

      <HeroCards hero={data.hero} />
      <StatsSection
        stats={{ feeTotal: realStats.feeTotal, feeCategories: realStats.feeCategories, progress: realStats.progress }}
      />
      <DestinationGrid destinations={data.destinations} />
    </div>
  )
}
