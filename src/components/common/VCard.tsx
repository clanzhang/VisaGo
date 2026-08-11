// components/common/VCard.tsx — 卡片容器
import type { HTMLAttributes, ReactNode } from 'react'

interface Props extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export function VCard({ children, padding = 'md', className = '', ...rest }: Props) {
  return (
    <div
      className={`bg-card rounded-2xl shadow-card ${paddings[padding]} ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
