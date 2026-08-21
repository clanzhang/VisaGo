// utils/district-coverage.ts — 领区数据开发期校验
// 校验使领馆/签证中心数据的省份拼写是否与 PROVINCES 完全一致，并报出覆盖缺口与重复归属。
// 防止「省份名不一致导致匹配失效」复发。仅 dev 模式执行（PROD 直接返回）。

import { DEFAULT_OFFICES } from '../data/consular-offices'

/**
 * 开发期校验：省份拼写必须与 PROVINCES 完全一致，并报出覆盖缺口与重复归属。
 * @param provinceList 标准省份列表（通常传 PROVINCES）
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
