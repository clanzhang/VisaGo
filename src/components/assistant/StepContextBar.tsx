// components/assistant/StepContextBar.tsx — 流程上下文条（Step 2/3/4 顶部）
// 国旗 + 国家 · 签证类型 · 处理周期 + 「更改」；sticky 保证长表单滚动时始终可见
import { useI18n } from '@/i18n'
import type { Country, VisaType } from '@/types'

interface Props {
  country: Country
  visaType?: VisaType | null
  /** 当前上下文对应的「更改」目标步骤文案（如“返回：选类型”） */
  changeLabel: string
  onChange: () => void
}

export function StepContextBar({ country, visaType, changeLabel, onChange }: Props) {
  const { t, pickL } = useI18n()

  return (
    <div className="sticky top-0 z-10 mb-4 flex items-center gap-3 rounded-xl border border-ink/5 bg-white/95 px-4 py-2.5 shadow-sm backdrop-blur">
      <span className="text-xl leading-none" aria-hidden="true">
        {country.flag}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-ink">
          {pickL(country.name)}
          <span className="mx-1.5 text-ink/60">·</span>
          {visaType ? pickL(visaType.name) : t('assistant.selectVisaType')}
        </div>
        <div className="text-xs text-ink/60">
          {visaType
            ? t('assistant.contextDays', {
                min: visaType.processingDays.min,
                max: visaType.processingDays.max,
              })
            : t('assistant.contextStep2Hint')}
        </div>
      </div>
      <button
        onClick={onChange}
        className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/5 hover:text-[#0e4a80]"
      >
        {changeLabel}
      </button>
    </div>
  )
}
