// data/mock.ts — 首页统计区域 mock 数据
import type { FeeCategory, ProgressItem } from '@/types'

/** 费用概览 */
export const feeOverview = {
  total: '¥12,400',
  categories: [
    { label: '签证费', percent: 40, color: '#1460A4' },
    { label: '服务费', percent: 35, color: '#39A2B8' },
    { label: '快递费', percent: 15, color: '#4F9E28' },
    { label: '其他', percent: 10, color: '#E5B454' },
  ] as FeeCategory[],
}

/** 办理进度（横向柱状图） */
export const progressData: ProgressItem[] = [
  { country: '日本', flag: '🇯🇵', progress: 85, isTop: true },
  { country: '韩国', flag: '🇰🇷', progress: 60 },
  { country: '泰国', flag: '🇹🇭', progress: 45 },
  { country: '申根', flag: '🇪🇺', progress: 30 },
]

/** 热门目的地卡片（含原有 7 国中的 6 个 + 申根） */
export const destinations = [
  { id: 'japan', name: '日本', flag: '🇯🇵', days: '15天', desc: '樱花季·东京大阪双城游', fee: '¥800 起', difficulty: '易' as const, image: '/images/japan.svg' },
  { id: 'korea', name: '韩国', flag: '🇰🇷', days: '7天', desc: '首尔购物·济州岛度假', fee: '¥500 起', difficulty: '易' as const, image: '/images/korea.svg' },
  { id: 'thailand', name: '泰国', flag: '🇹🇭', days: '10天', desc: '曼谷·普吉岛海岛风情', fee: '¥400 起', difficulty: '易' as const, image: '/images/thailand.svg' },
  { id: 'schengen', name: '申根', flag: '🇪🇺', days: '20天', desc: '法瑞意·欧洲多国深度游', fee: '¥1,200 起', difficulty: '难' as const, image: '/images/schengen.svg' },
  { id: 'usa', name: '美国', flag: '🇺🇸', days: '15天', desc: '美西自驾·纽约都市之旅', fee: '¥1,990 起', difficulty: '难' as const, image: '/images/usa.svg' },
  { id: 'uk', name: '英国', flag: '🇬🇧', days: '12天', desc: '伦敦·爱丁堡英伦风情', fee: '¥1,750 起', difficulty: '中' as const, image: '/images/uk.svg' },
]
