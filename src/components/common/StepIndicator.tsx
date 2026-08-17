// components/common/StepIndicator.tsx — 步骤指示器（进度圆点 + 连接线）
// 通用：支持从 0 或 1 起步、可点击回跳、自定义标签渲染
// 视觉区分：已完成（绿色 ✓，可点击回跳）· 当前（蓝色）· 未解锁（灰色 🔒）
// 小屏（sm 以下）：圆点导航价值低，改用「第 N 步 / 共 M 步 · 名称」文字形式（mobileText）
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
  /** 标签是否小屏隐藏（默认 true） */
  hideLabelOnMobile?: boolean
  /** 每个步骤的 title/aria-label（区分可回跳/当前/未解锁） */
  titleFor?: (index: number) => string
  /** 小屏（sm 以下）文字形式，如「第 3 步 / 共 4 步 · 填身份」；提供则小屏只显示该文字 */
  mobileText?: string
  /** 容器 aria-label（默认 "progress"） */
  ariaLabel?: string
}

export function StepIndicator({
  steps,
  current,
  onStep,
  startAtOne = false,
  renderLabel,
  hideLabelOnMobile = true,
  titleFor,
  mobileText,
  ariaLabel = 'progress',
}: Props) {
  return (
    <>
      {mobileText && (
        <p className="mb-1 text-sm font-medium text-ink sm:hidden" aria-current="step">
          {mobileText}
        </p>
      )}
      <ol role="list" className="flex items-center gap-2" aria-label={ariaLabel}>
        {steps.map((label, i) => {
          const done = i < current
          const active = i === current
          const locked = i > current
          const num = startAtOne ? i + 1 : i
          const title = titleFor ? titleFor(i) : undefined
          const inner = (
            <>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                  done ? 'bg-success text-white' : active ? 'bg-primary text-white' : 'bg-ink/8 text-ink/60'
                } ${done && onStep ? 'group-hover:ring-4 group-hover:ring-success/25' : ''}`}
              >
                {done ? (
                  <span className="h-4 w-4 icon-[mdi-light--check]" aria-hidden="true" />
                ) : locked ? (
                  <span className="h-4 w-4 icon-[mdi-light--lock]" aria-hidden="true" />
                ) : (
                  num
                )}
              </span>
              <span
                className={`text-sm ${active ? 'font-medium text-ink' : done ? 'text-ink/70' : 'text-ink/60'} ${
                  hideLabelOnMobile ? 'hidden sm:block' : ''
                }`}
              >
                {renderLabel ? renderLabel(label, i) : label}
              </span>
            </>
          )
          return (
            <li
              key={label}
              className="flex flex-1 items-center gap-2"
              aria-current={active ? 'step' : undefined}
              aria-disabled={locked ? 'true' : undefined}
            >
              {onStep && done ? (
                <button
                  type="button"
                  onClick={() => onStep(i)}
                  title={title}
                  aria-label={title}
                  className="group flex cursor-pointer items-center gap-2 rounded-lg text-left transition-colors hover:opacity-90"
                >
                  {inner}
                </button>
              ) : (
                <div className="flex items-center gap-2" title={title} aria-label={locked ? title : undefined}>
                  {inner}
                </div>
              )}
              {i < steps.length - 1 && <div className={`h-0.5 flex-1 ${done ? 'bg-success' : 'bg-ink/8'}`} />}
            </li>
          )
        })}
      </ol>
    </>
  )
}
