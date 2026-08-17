// components/common/EmptyState.tsx — 页面空状态引导卡片（共用范式）
// 视觉：圆形 #E0F7FA 底 + stroke=#1460A4 内联 SVG + 标题 + 描述 + 操作区
import type { ReactNode } from 'react'

interface Props {
  /** 圆形图标容器内的 SVG（stroke=#1460A4 约定） */
  icon: ReactNode
  title: string
  desc?: string
  /** 操作区（主/次级 CTA 均可放） */
  actions?: ReactNode
  /** 额外说明（如 Web 模式提示） */
  hint?: ReactNode
  /** 是否垂直居中（页面内容不满一屏时） */
  centered?: boolean
}

export function EmptyState({ icon, title, desc, actions, hint, centered = false }: Props) {
  return (
    <div
      className={`flex flex-col items-center rounded-2xl bg-white text-center shadow-card ${
        centered ? 'min-h-[60vh] justify-center' : ''
      } px-8 py-12 sm:px-12 sm:py-14`}
    >
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#E0F7FA]">
        {icon}
      </div>
      <h2 className="max-w-md text-xl font-bold text-ink">{title}</h2>
      {desc && <p className="mt-2 max-w-md text-sm leading-relaxed text-ink/60">{desc}</p>}
      {actions && <div className="mt-8 flex flex-wrap items-center justify-center gap-4">{actions}</div>}
      {hint && <div className="mt-4">{hint}</div>}
    </div>
  )
}
