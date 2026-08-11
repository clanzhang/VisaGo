// components/visa/GeoShape.tsx — 装饰几何图形（静态 SVG 装饰，无动画）
import type { SVGProps } from 'react'

export function GeoShape({ ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 200 200" fill="none" {...props}>
      <circle cx="160" cy="40" r="80" fill="currentColor" opacity="0.08" />
      <circle cx="40" cy="170" r="50" fill="currentColor" opacity="0.06" />
      <rect x="140" y="130" width="40" height="40" rx="8" fill="currentColor" opacity="0.05" />
    </svg>
  )
}
