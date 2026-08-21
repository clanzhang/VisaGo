// data/countries.ts
// 90+ 国家签证静态数据（全部由 country-list.ts 生成统一结构）

import type { Country, Localized } from '../types'
import { COUNTRY_LIST, type CountryMeta } from './country-list'
import { validateDistrictCoverage } from './consular-districts'
import { PROVINCES } from './provinces'
import { buildBasicVisaType } from './build-visa-type'

// 居住地省份（仅中国大陆省级行政区）。
// 台湾/香港/澳门不在此列：持这些身份/居住地走的是不同办理渠道，
// 不应被误匹配到大陆使领馆领区（由 isKnownProvince 兜底提示）。
export { PROVINCES }

export const OCCUPATIONS = [
  { value: 'employed' },
  { value: 'student' },
  { value: 'retired' },
  { value: 'freelance' },
] as const

// ===== 从元数据生成统一结构 =====

/** 归入「港澳台」区域的 id（供 region 归组复用，避免分散判断） */
export const PERMIT_REGION_IDS = new Set(['hong-kong', 'taiwan', 'macau'])

function buildCountry(meta: CountryMeta): Country {
  // 港澳台单独分组（含澳门）
  const region = PERMIT_REGION_IDS.has(meta.id) ? '港澳台' : meta.region
  return {
    id: meta.id,
    name: { zh: meta.zh, en: meta.en },
    flag: meta.flag,
    difficulty: meta.difficulty,
    visaType: meta.visaType,
    region,
    overview: { zh: meta.desc, en: meta.desc },
    visaFree: (meta.visaType === '互免签证' || meta.visaType === '单方面免签')
      ? { zh: meta.desc, en: meta.desc }
      : { zh: '请以官方最新政策为准', en: 'Check official policy' },
    announcements: [],
    visaTypes: [buildBasicVisaType(meta)],
  }
}

export const countries: Country[] = COUNTRY_LIST.map(buildCountry)

// 开发期：校验领区省份拼写与覆盖缺口/重复归属（仅在 dev 模式 console.warn）
validateDistrictCoverage(PROVINCES)

export const DIFFICULTY_LABELS: Record<'easy' | 'medium' | 'hard', Localized> = {
  easy: { zh: '容易', en: 'Easy' },
  medium: { zh: '中等', en: 'Medium' },
  hard: { zh: '困难', en: 'Hard' },
}

/** 签证类型标签文案 key（chip 与分组标题共用同一来源，避免同义不同名） */
export const VISA_TYPE_LABEL_KEYS: Record<Country['visaType'], string> = {
  互免签证: 'encyclopedia.visaTypeMutual',
  单方面免签: 'encyclopedia.visaTypeUnilateral',
  落地签: 'encyclopedia.visaTypeOnArrival',
  电子签: 'encyclopedia.visaTypeEvisa',
  需通行证: 'encyclopedia.visaTypePermit',
}

/** 签证类型标签配色 */
export const VISA_TYPE_STYLE: Record<Country['visaType'], { label: string; cls: string }> = {
  互免签证: { label: '互免签证', cls: 'bg-green-700/10 text-green-800' },
  单方面免签: { label: '单方面免签', cls: 'bg-green-500/10 text-green-600' },
  落地签: { label: '落地签', cls: 'bg-[#1460A4]/10 text-[#1460A4]' },
  电子签: { label: '电子签', cls: 'bg-[#7B2FBE]/10 text-[#7B2FBE]' },
  需通行证: { label: '需通行证', cls: 'bg-orange-500/10 text-orange-600' },
}

export const REQUIREMENT_CATEGORIES: Record<
  'basic' | 'identity' | 'financial' | 'travel' | 'extra',
  Localized
> = {
  basic: { zh: '基础材料', en: 'Basic Documents' },
  identity: { zh: '身份材料', en: 'Identity Documents' },
  financial: { zh: '财力材料', en: 'Financial Documents' },
  travel: { zh: '行程材料', en: 'Travel Documents' },
  extra: { zh: '补充材料', en: 'Additional Documents' },
}

export function getCountry(id: string): Country | undefined {
  return countries.find((c) => c.id === id)
}

export function getVisaType(countryId: string, visaTypeId: string) {
  const country = getCountry(countryId)
  return country?.visaTypes.find((v) => v.id === visaTypeId)
}

export function searchCountries(keyword: string): Country[] {
  const kw = keyword.trim().toLowerCase()
  if (!kw) return countries
  return countries.filter((c) => {
    // 名称（中/英）
    if (c.name.zh.includes(kw) || c.name.en.toLowerCase().includes(kw)) return true
    // 所属区域（如「欧洲」）
    if (c.region.includes(kw)) return true
    // 签证类型（如「免签」「落地签」）
    if (c.visaType.includes(kw)) return true
    // 描述（如「申根 26 国」里的关键词）
    if ((c.overview?.zh ?? '').includes(kw) || (c.overview?.en ?? '').toLowerCase().includes(kw)) return true
    // 别名/拼音/首字母（country-list.ts aliases）
    const meta = COUNTRY_LIST.find((m) => m.id === c.id)
    if (meta?.aliases?.some((a) => a.toLowerCase().includes(kw))) return true
    // 签证类型名
    return c.visaTypes.some(
      (v) => v.name.zh.includes(kw) || v.name.en.toLowerCase().includes(kw),
    )
  })
}
