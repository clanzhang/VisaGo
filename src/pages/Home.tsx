// pages/Home.tsx — 首页仪表盘（AI 数据驱动 + 静态兜底）
import { Header } from '@/components/layout'
import { HeroCards } from '@/components/home/HeroCards'
import { StatsSection } from '@/components/home/StatsSection'
import { DestinationGrid } from '@/components/home/DestinationGrid'
import { ReminderBanner } from '@/components/common/ReminderBanner'
import { useHomeAIData } from '@/hooks/useAIData'
import { useAppStore } from '@/stores/appStore'
import { VButton } from '@/components/common'

export default function Home() {
  const { data, loading, refreshing, refresh } = useHomeAIData()
  const { toast } = useAppStore()

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between">
        <Header />
        <div className="flex items-center gap-2 pt-1">
          {refreshing ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-ink/45">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#39A2B8] border-t-transparent" />
              更新中…
            </span>
          ) : (
            <VButton
              variant="secondary"
              size="sm"
              onClick={() => {
                refresh()
                toast('已触发数据刷新', 'info')
              }}
              disabled={loading}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 12a9 9 0 11-2.6-6.4M21 3v6h-6" />
              </svg>
              刷新数据
            </VButton>
          )}
        </div>
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
        stats={{ feeTotal: data.feeTotal, feeCategories: data.feeCategories, progress: data.progress }}
      />
      <DestinationGrid destinations={data.destinations} />
    </div>
  )
}
