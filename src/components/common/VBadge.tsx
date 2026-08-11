// components/common/VBadge.tsx — 标签组件
import type { ReactNode } from 'react'

type Tone = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'cyan'

const tones: Record<Tone, string> = {
  default: 'bg-ink/5 text-ink/70',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-amber-500/10 text-amber-600',
  danger: 'bg-red-500/10 text-red-600',
  cyan: 'bg-[#39A2B8]/10 text-[#39A2B8]',
}

interface Props {
  tone?: Tone
  children: ReactNode
  className?: string
}

export function VBadge({ tone = 'default', children, className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
