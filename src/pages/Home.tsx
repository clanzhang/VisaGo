// pages/Home.tsx — 首页仪表盘（AI 数据驱动 + 静态兜底）
import { Header } from '@/components/layout'
import { HeroCards } from '@/components/home/HeroCards'
import { StatsSection } from '@/components/home/StatsSection'
import { DestinationGrid } from '@/components/home/DestinationGrid'
import { ReminderBanner } from '@/components/common/ReminderBanner'
import { useHomeAIData } from '@/hooks/useAIData'
import { useRealStats } from '@/hooks/useRealStats'
import { useAppStore } from '@/stores/appStore'

export default function Home() {
  const { data, loading, refreshing, refresh } = useHomeAIData()
  // 统计模块从真实申请记录计算（费用 + 进度），AI 数据仅用于 destinations 和 hero
  const realStats = useRealStats()
  const { toast } = useAppStore()

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between">
        <Header />
        <button
          onClick={() => {
            if (loading || refreshing) return
            refresh()
            toast('已触发数据刷新', 'info')
          }}
          disabled={loading || refreshing}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-ink/40 shadow-card transition-all duration-150 hover:text-[#1460A4] hover:shadow-card-lg disabled:opacity-60"
          title="刷新数据"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={refreshing ? 'animate-spin' : ''}
          >
            <path d="M21 12a9 9 0 11-2.6-6.4M21 3v6h-6" />
          </svg>
        </button>
      </div>

      {/* 顶部提醒横幅（今天有递签/出签安排的申请） */}
      <ReminderBanner />

      {/* 隐藏 AI 数据加载报错横幅（仅静默失败，数据回退静态） */}
      {/* {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
          <button
            onClick={refresh}
            className="ml-3 font-medium underline underline-offset-2"
          >
            点击重试
          </button>
        </div>
      )} */}

      <HeroCards hero={data.hero} />
      <StatsSection
        stats={{ feeTotal: realStats.feeTotal, feeCategories: realStats.feeCategories, progress: realStats.progress }}
      />
      <DestinationGrid destinations={data.destinations} />
    </div>
  )
}
