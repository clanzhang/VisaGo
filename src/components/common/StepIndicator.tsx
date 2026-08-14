// components/common/StepIndicator.tsx — 步骤指示器（进度圆点 + 连接线）
// 通用：支持从 0 或 1 起步、可点击回跳、自定义标签渲染
interface Props {
  /** 步骤标签列表 */
  steps: string[]
  /** 当前步骤索引（相对 steps 的索引，0 起步） */
  current: number
  /** 是否可点击回跳（onStep 存在时生效） */
  onStep?: (index: number) => void
  /** 是否从 1 起步显示数字（默认 false：0 起步） */
  startAtOne?: boolean
  /** 标签渲染（默认直接显示步骤名，可用 i18n 等） */
  renderLabel?: (label: string, index: number) => React.ReactNode
  /** 标签是否小屏隐藏（默认 true，与 Assistant 一致） */
  hideLabelOnMobile?: boolean
}

export function StepIndicator({
  steps,
  current,
  onStep,
  startAtOne = false,
  renderLabel,
  hideLabelOnMobile = true,
}: Props) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((label, i) => {
        const done = i < current
        const active = i === current
        const num = startAtOne ? i + 1 : i
        const inner = (
          <>
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                done ? 'bg-success text-white' : active ? 'bg-primary text-white' : 'bg-ink/8 text-ink/40'
              }`}
            >
              {done ? '✓' : num}
            </span>
            <span
              className={`text-sm ${active ? 'font-medium text-ink' : 'text-ink/40'} ${
                hideLabelOnMobile ? 'hidden sm:block' : ''
              }`}
            >
              {renderLabel ? renderLabel(label, i) : label}
            </span>
          </>
        )
        return (
          <div key={label} className="flex flex-1 items-center gap-2">
            {onStep && i < current ? (
              <button
                onClick={() => onStep(i)}
                className="flex items-center gap-2 text-left"
              >
                {inner}
              </button>
            ) : (
              <div className="flex items-center gap-2">{inner}</div>
            )}
            {i < steps.length - 1 && <div className={`h-0.5 flex-1 ${done ? 'bg-success' : 'bg-ink/8'}`} />}
          </div>
        )
      })}
    </div>
  )
}
