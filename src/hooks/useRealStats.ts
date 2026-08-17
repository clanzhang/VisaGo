// hooks/useRealStats.ts — 首页统计模块（从真实申请记录计算）
import { useMemo } from 'react'
import { useTrackerStore } from '@/stores/trackerStore'
import { useI18n } from '@/i18n'
import { countries } from '@/data/countries'
import type { FeeCategory, ProgressItem } from '@/types'

/** 状态 → 进度百分比（approved=100, rejected=0, 其他按中间值） */
const STATUS_PROGRESS: Record<string, number> = {
  preparing: 10,
  appointment_booked: 30,
  submitted: 60,
  under_review: 80,
  approved: 100,
  rejected: 0,
}

export interface RealStats {
  feeTotal: string
  feeCategories: FeeCategory[]
  progress: ProgressItem[]
}

/** 根据国家 + 签证类型查费用（fee + serviceFee），返回合计人民币 */
function getFeeForApplication(countryId: string, visaTypeId: string): { visaFee: number; serviceFee: number } {
  const country = countries.find((c) => c.id === countryId)
  const visaType = country?.visaTypes.find((v) => v.id === visaTypeId)
  return {
    visaFee: visaType?.fee.amount ?? 0,
    serviceFee: visaType?.serviceFee?.amount ?? 0,
  }
}

/** 从真实申请记录计算统计（费用 + 进度） */
export function useRealStats(): RealStats {
  const { applications } = useTrackerStore()
  const { pickL } = useI18n()

  return useMemo(() => {
    // ===== 费用统计 =====
    let visaFeeTotal = 0
    let serviceFeeTotal = 0
    for (const app of applications) {
      const { visaFee, serviceFee } = getFeeForApplication(app.countryId, app.visaTypeId)
      visaFeeTotal += visaFee
      serviceFeeTotal += serviceFee
    }
    const grandTotal = visaFeeTotal + serviceFeeTotal

    // 分类占比：签证费 / 服务费 / 其他（固定 0）
    const feeCategories: FeeCategory[] = [
      { label: '签证费', percent: grandTotal > 0 ? Math.round((visaFeeTotal / grandTotal) * 100) : 0, color: '#1460A4' },
      { label: '服务费', percent: grandTotal > 0 ? Math.round((serviceFeeTotal / grandTotal) * 100) : 0, color: '#39A2B8' },
      { label: '其他', percent: 0, color: '#E5B454' },
    ]
    // 格式化费用总计（千分位）
    const feeTotal = grandTotal > 0 ? `¥${grandTotal.toLocaleString('zh-CN')}` : '¥0'

    // ===== 进度统计 =====
    // 按国家分组，统计申请数量与平均进度
    const byCountry = new Map<string, { count: number; progressSum: number; countryId: string }>()
    for (const app of applications) {
      const entry = byCountry.get(app.countryId) ?? { count: 0, progressSum: 0, countryId: app.countryId }
      entry.count += 1
      entry.progressSum += STATUS_PROGRESS[app.status] ?? 0
      byCountry.set(app.countryId, entry)
    }

    const progress: ProgressItem[] = Array.from(byCountry.values()).map((entry) => {
      const country = countries.find((c) => c.id === entry.countryId)
      return {
        country: (country ? pickL(country.name) : entry.countryId) ?? entry.countryId,
        flag: country?.flag ?? '🌍',
        progress: Math.round(entry.progressSum / entry.count),
        isTop: entry.count === 1,
      }
    })
    // 按进度降序
    progress.sort((a, b) => b.progress - a.progress)

    return { feeTotal, feeCategories, progress }
  }, [applications])
}
