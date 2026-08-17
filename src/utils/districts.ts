// utils/districts.ts — 领区展示的共享逻辑（纯函数/i18n key 映射，无 UI）
import type { ConsularDistrict } from '@/types'

/** 机构类型 → i18n key */
export const KIND_KEYS: Record<NonNullable<ConsularDistrict['kind']>, string> = {
  embassy: 'encyclopedia.kindEmbassy',
  consulate: 'encyclopedia.kindConsulate',
  visa_center: 'encyclopedia.kindVisaCenter',
}

export type DistrictNoNeedType = 'free' | 'onArrival' | 'evisa' | 'permit'

/**
 * 该签证类型是否「无需在国内使领馆递签」。
 * 注意：电子签/需通行证国家若配置了真实领区（如日本、美国），
 * 由调用方优先渲染静态数据，本函数仅在无静态数据时用于空态文案。
 */
export function districtNoNeedType(visaTypeLabel: string): DistrictNoNeedType | null {
  switch (visaTypeLabel) {
    case '互免签证':
    case '单方面免签':
      return 'free'
    case '落地签':
      return 'onArrival'
    case '电子签':
      return 'evisa'
    case '需通行证':
      return 'permit'
    default:
      return null
  }
}

export const DISTRICT_NO_NEED_KEYS: Record<DistrictNoNeedType, string> = {
  free: 'encyclopedia.districtNoNeedFree',
  onArrival: 'encyclopedia.districtNoNeedOnArrival',
  evisa: 'encyclopedia.districtNoNeedEvisa',
  permit: 'encyclopedia.districtNoNeedPermit',
}

/** 拼接省份列表（zh 用顿号，en 用逗号） */
export function joinProvinces(list: string[], isZh: boolean): string {
  return list.join(isZh ? '、' : ', ')
}
