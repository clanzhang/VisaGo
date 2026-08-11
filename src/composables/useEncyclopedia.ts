// composables/useEncyclopedia.ts
// 签证百科组合函数：身份材料、费用明细、对比等逻辑
import { computed } from 'vue'
import { useLocalizedText } from './useVisaQuery'
import {
  identityExtraRequirements,
  extraBasicRequirements,
  getVisaExtra,
  type IdentityKey,
} from '../data/encyclopedia-extra'
import { REQUIREMENT_CATEGORIES } from '../data/countries'
import type { Requirement } from '../types'

export type { IdentityKey }

/** 根据职业身份生成完整材料清单（基础 + 通用 + 身份专属） */
export function buildIdentityRequirements(
  baseRequirements: Requirement[],
  occupation: IdentityKey,
): Requirement[] {
  const list: Requirement[] = [...baseRequirements]
  // 补充通用基础材料（身份证、户口本）
  for (const r of extraBasicRequirements) {
    if (!list.some((x) => x.id === r.id)) list.push(r)
  }
  // 补充当前身份专属材料
  for (const r of identityExtraRequirements[occupation]) {
    if (!list.some((x) => x.id === r.id)) list.push(r)
  }
  return list
}

/** 材料完成度计算（基于外部勾选集合） */
export function useChecklistProgress(
  total: number,
  getDone: () => number,
) {
  const done = computed(getDone)
  const percent = computed(() => (total ? Math.round((done.value / total) * 100) : 0))
  return { done, total, percent }
}

/** 计算签证类型最低费用（用于列表页"¥xx 起"） */
export function getMinFee(visaTypes: { fee: { amount: number } }[]): number {
  if (visaTypes.length === 0) return 0
  return Math.min(...visaTypes.map((v) => v.fee.amount))
}

/** 费用明细（含各项拆分） */
export function getFeeBreakdown(countryId: string, visaTypeId: string) {
  const extra = getVisaExtra(countryId, visaTypeId)
  return extra?.fees ?? { visaFee: 0, serviceFee: 0, courierFee: 50, photoFee: 30 }
}

/** 获取签证类型标志信息 */
export function getVisaFlags(countryId: string, visaTypeId: string) {
  const extra = getVisaExtra(countryId, visaTypeId)
  return (
    extra?.flags ?? {
      needInterview: false,
      canApplyOnline: false,
      acceptPersonal: true,
      targetAudience: { zh: '', en: '' },
    }
  )
}

/** 按拼音首字母匹配（简化：返回中文首字母 + 英文首字母） */
export function pinyinMatch(text: string, kw: string): boolean {
  const t = text.toLowerCase()
  const k = kw.toLowerCase()
  if (t.includes(k)) return true
  // 英文首字母匹配（如输入 "rb" 匹配 "日本"/"Riben"）
  const initials = text
    .split('')
    .filter((c) => /[\u4e00-\u9fa5]/.test(c))
    .map((c) => c)
    .join('')
  // 简化：仅支持英文首字母（英文名）
  const enInitials = text
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toLowerCase()
  return enInitials.includes(k) || initials.includes(k)
}

/** 材料分类顺序 */
export const MATERIAL_ORDER = ['basic', 'identity', 'financial', 'travel', 'extra'] as const

export function useRequirementCategories() {
  const { t } = useLocalizedText()
  return MATERIAL_ORDER.map((key) => ({
    key,
    label: t(REQUIREMENT_CATEGORIES[key]),
    icon: REQUIREMENT_CATEGORIES[key].icon,
  }))
}
