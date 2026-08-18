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
  const { data, loading, refreshing, error, refresh } = useHomeAIData()
  // 统计模块从真实申请记录计算（费用 + 进度），AI 数据仅用于 destinations 和 hero
  const realStats = useRealStats()
  const { toast, openSettings } = useAppStore()

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

      {/* AI 降级提示：区分 Key 问题（引导去设置）与临时故障（引导重试） */}
      {error && !loading && !refreshing && (
        <div
          role="status"
          className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
        >
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-amber-800">
              {error.kind === 'invalid_key' ? t('home.aiKeyInvalidTitle') : t('home.aiOfflineTitle')}
            </div>
            <div className="mt-0.5 text-xs leading-relaxed text-amber-700">
              {error.kind === 'invalid_key' ? t('home.aiKeyInvalidDesc') : t('home.aiOfflineDesc')}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {error.kind === 'invalid_key' ? (
              // Key 问题是根因：「去设置」才是正解，设为高权重
              <button
                onClick={() => openSettings('ai')}
                className="rounded-full bg-amber-800 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-900"
              >
                {t('home.aiGoSettings')}
              </button>
            ) : (
              <button
                onClick={refresh}
                disabled={refreshing}
                className="rounded-full border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-100 disabled:opacity-60"
              >
                {t('home.aiRetry')}
              </button>
            )}
          </div>
        </div>
      )}

      {loading ? <HomeSkeleton /> : (
        <>
          <HeroCards hero={data.hero} />
          <DestinationGrid destinations={data.destinations} />
        </>
      )}
      <StatsSection
        stats={{ feeTotal: realStats.feeTotal, feeCategories: realStats.feeCategories, progress: realStats.progress }}
      />
    </div>
  )
}

/** 首页加载骨架屏：与 HeroCards/DestinationGrid 布局同尺寸，避免 CLS */
function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-label="Loading">
      <div className="grid gap-6 md:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-[212px] animate-pulse rounded-3xl bg-white shadow-card">
            <div className="flex h-full items-center justify-between p-8">
              <div className="flex h-[150px] w-[150px] animate-pulse rounded-full bg-[#E8EEF4]" />
              <div className="ml-6 flex-1 space-y-3">
                <div className="h-6 w-3/4 animate-pulse rounded-lg bg-[#E8EEF4]" />
                <div className="h-4 w-full animate-pulse rounded bg-[#EEF2F6]" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-[#EEF2F6]" />
                <div className="h-9 w-28 animate-pulse rounded-full bg-[#E8EEF4]" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <div className="mb-5 h-7 w-40 animate-pulse rounded-lg bg-[#E8EEF4]" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-3xl bg-white shadow-card">
              <div className="h-[140px] animate-pulse bg-[#E8EEF4]" />
              <div className="space-y-3 p-5">
                <div className="h-5 w-1/2 animate-pulse rounded bg-[#EEF2F6]" />
                <div className="h-4 w-full animate-pulse rounded bg-[#EEF2F6]" />
                <div className="h-5 w-1/3 animate-pulse rounded bg-[#E8EEF4]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
