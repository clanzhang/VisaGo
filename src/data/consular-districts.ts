// data/consular-districts.ts — 领区查询与开发期校验
// 数据（使领馆/签证中心 → 覆盖省份）在 consular-offices.ts（含 ConsularOffice 类型与 DEFAULT_OFFICES）。
// 本文件只承载查询逻辑（getConsularOffices）与开发期校验（validateDistrictCoverage）。

import { DEFAULT_OFFICES, type ConsularOffice } from './consular-offices'

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

/**
 * 开发期校验：省份拼写必须与 PROVINCES 完全一致，并报出覆盖缺口与重复归属。
 * 防止「省份名不一致导致匹配失效」复发。
 */
export function validateDistrictCoverage(provinceList: readonly string[]): void {
  if (import.meta.env.PROD) return
  const known = new Set(provinceList)
  for (const [countryId, offices] of Object.entries(DEFAULT_OFFICES)) {
    const bad = new Set<string>()
    const covered = new Set<string>()
    const byProvince = new Map<string, string[]>()
    for (const o of offices) {
      for (const p of o.provinces) {
        if (!known.has(p)) bad.add(p)
        covered.add(p)
        byProvince.set(p, [...(byProvince.get(p) ?? []), o.city])
      }
    }
    if (bad.size > 0) {
      console.warn(`[consular-districts] ${countryId} 省份名与 PROVINCES 不一致: ${[...bad].join('、')}`)
    }
    const gap = provinceList.filter((p) => !covered.has(p))
    if (gap.length > 0) {
      console.warn(`[consular-districts] ${countryId} 覆盖缺口（未覆盖的省份）: ${gap.join('、')}`)
    }
    const dups = [...byProvince.entries()].filter(([, cities]) => cities.length > 1)
    if (dups.length > 0) {
      console.warn(
        `[consular-districts] ${countryId} 省份重复归属: ${dups.map(([p, c]) => `${p}(${c.join('/')})`).join('、')}`,
      )
    }
  }
}
