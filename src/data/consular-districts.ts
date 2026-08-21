// data/consular-districts.ts — 领区查询
// 数据（使领馆/签证中心 → 覆盖省份）在 consular-offices.ts（含 ConsularOffice 类型与 DEFAULT_OFFICES）。
// 开发期校验（validateDistrictCoverage）在 utils/district-coverage.ts，此处 re-export 保持旧调用方兼容。

import { DEFAULT_OFFICES, type ConsularOffice } from './consular-offices'
export { validateDistrictCoverage } from '../utils/district-coverage'

/** 按 visaTypeId 细分的领区（暂无国家需要；保留扩展位） */
const BY_VISA_TYPE_OFFICES: Record<string, Record<string, ConsularOffice[]>> = {}

/**
 * 查询某国（可选某签证类型）的领区。
 * 未配置的国家返回 []（由界面走「无需在国内递签」或「暂未收录」空态）。
 */
export function getConsularOffices(countryId: string, visaTypeId?: string): ConsularOffice[] {
  if (visaTypeId && BY_VISA_TYPE_OFFICES[countryId]?.[visaTypeId]) {
    return BY_VISA_TYPE_OFFICES[countryId][visaTypeId]
  }
  return DEFAULT_OFFICES[countryId] ?? []
}
