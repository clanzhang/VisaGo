// components/assistant/StepContextBar.tsx — 流程上下文条（Step 2/3/4 顶部常驻 sticky）
// 实心背景 + 高 z-index，滚动时下层内容不穿透；可承载步骤定位 / 整体完成度 / 返回上一步
import { useI18n } from '@/i18n'
import { VButton } from '@/components/common'
import type { Country, VisaType } from '@/types'

interface Props {
  country: Country
  visaType?: VisaType | null
  /** 当前上下文对应的「更改」目标步骤文案（如“返回：选类型”） */
  changeLabel: string
  onChange: () => void
  /** 步骤定位文案，如「第 4 / 4 步」 */
  stepText?: string
  /** 整体完成度（done/total），如材料已就绪数 */
  progress?: { done: number; total: number } | null
  /** 返回上一步 */
  onBack?: () => void
  backLabel?: string
}

export function StepContextBar({
  country,
  visaType,
  changeLabel,
  onChange,
  stepText,
  progress,
  onBack,
  backLabel,
}: Props) {
  const { t, pickL } = useI18n()
  const percent = progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0

  return (
    <div className="sticky top-0 z-20 mb-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border border-ink/5 bg-white px-4 py-2.5 shadow-sm">
      {stepText && (
        <span className="whitespace-nowrap rounded-full bg-ink/5 px-2 py-0.5 text-[11px] font-semibold text-ink/70">
          {stepText}
        </span>
      )}
      <span className="text-xl leading-none" aria-hidden="true">
        {country.flag}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-ink">
          {pickL(country.name)}
          <span className="mx-1.5 text-ink/60">·</span>
          {visaType ? pickL(visaType.name) : t('assistant.selectVisaType')}
        </div>
        <div className="truncate text-xs text-ink/60">
          {visaType
            ? t('assistant.contextDays', {
                min: visaType.processingDays.min,
                max: visaType.processingDays.max,
              })
            : t('assistant.contextStep2Hint')}
        </div>
      </div>

      {progress && progress.total > 0 && (
        <div className="flex shrink-0 items-center gap-2" title={t('assistant.headerProgress', { done: progress.done, total: progress.total })}>
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-ink/8">
            <div className="h-full rounded-full bg-success transition-all duration-500" style={{ width: `${percent}%` }} />
          </div>
          <span className="whitespace-nowrap text-[11px] text-ink/60">
            {t('assistant.headerProgress', { done: progress.done, total: progress.total })}
          </span>
        </div>
      )}

      {onBack && backLabel && (
        <VButton type="button" variant="secondary" size="sm" onClick={onBack}>
          {backLabel}
        </VButton>
      )}
      <button
        type="button"
        onClick={onChange}
        className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/5 hover:text-[#0e4a80]"
      >
        {changeLabel}
      </button>
    </div>
  )
}
