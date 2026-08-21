// data/countries.ts
// 90+ 国家签证静态数据（全部由 country-list.ts 生成统一结构）

import type { Country, Localized, VisaType, Requirement, FAQ } from '../types'
import { COUNTRY_LIST, type CountryMeta } from './country-list'
import { NEW_ZEALAND_REQUIREMENTS, SCHENGEN_REQUIREMENTS } from './encyclopedia-materials'
import { getVisaExtra } from './encyclopedia-extra'
import { getConsularOffices, validateDistrictCoverage } from './consular-districts'
import { getCountryFaqExtra } from './encyclopedia-faq'
import { getDefaultVisaFee } from './default-visa-fees'
import { PROVINCES } from './provinces'
import {
  buildMutualVisaFreeFaq,
  buildOnArrivalFaq,
  buildEvisaFaq,
  buildPermitFaq,
  buildConsularFaq,
  buildRejectionReasons,
} from './faq-templates'

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

/** 港澳台通行证/入台证办理天数（按目的地区分；其余走通用逻辑） */
const PERMIT_PROCESSING_DAYS: Record<string, { min: number; max: number }> = {
  'hong-kong': { min: 1, max: 7 },
  macau: { min: 1, max: 5 },
  taiwan: { min: 5, max: 10 },
}

/** 归入「港澳台」区域的 id（供 region 归组复用，避免分散判断） */
export const PERMIT_REGION_IDS = new Set(['hong-kong', 'taiwan', 'macau'])

function buildBasicVisaType(meta: CountryMeta): VisaType {
  const name = `${meta.zh}旅游签证`
  const visaTypeId = `${meta.id}-tourist`
  const canApplyOnline = meta.visaType === '电子签' || meta.visaType === '落地签'
  const needInterview = meta.difficulty === 'hard'
  const isVisaFree = meta.visaType === '互免签证' || meta.visaType === '单方面免签'
  // 国家专属材料清单（新西兰/申根），其余用默认模板
  const requirements =
    meta.id === 'new-zealand'
      ? NEW_ZEALAND_REQUIREMENTS
      : meta.id === 'schengen'
        ? SCHENGEN_REQUIREMENTS
        : ([
            { id: 'passport', name: { zh: '有效护照', en: 'Valid passport' }, category: 'basic', required: true, format: 'original', translationRequired: false },
            { id: 'photo', name: { zh: '证件照 2 张', en: '2 photos' }, category: 'basic', required: true, format: 'original', translationRequired: false },
            { id: 'application', name: { zh: '签证申请表', en: 'Application form' }, category: 'basic', required: true, format: 'original', translationRequired: false },
            { id: 'employment', name: { zh: '在职证明', en: 'Employment cert' }, category: 'identity', required: true, format: 'copy', translationRequired: false },
            { id: 'bank', name: { zh: '银行流水', en: 'Bank statement' }, category: 'financial', required: true, format: 'copy', translationRequired: false },
            { id: 'itinerary', name: { zh: '行程安排', en: 'Itinerary' }, category: 'travel', required: true, format: 'copy', translationRequired: false },
          ] as Requirement[])
  // 费用映射：优先查默认费用表，未列出则免签 0 / 其他 300+200
  const feeData = getDefaultVisaFee(meta.id, isVisaFree)
  // 是否接受个人递签：优先用百科扩展数据（如日本须经指定代办机构），未配置默认 true
  const acceptPersonal = getVisaExtra(meta.id, visaTypeId)?.flags.acceptPersonal ?? true
  // 签证类型信息
  const duration = '最长 30 天'
  // 按签证类型生成通用 FAQ
  const baseFaq: FAQ[] = (() => {
    switch (meta.visaType) {
      case '互免签证':
      case '单方面免签':
        return buildMutualVisaFreeFaq(meta.zh, meta.en, duration)
      case '落地签':
        return buildOnArrivalFaq(feeData.fee, 'CNY')
      case '电子签':
        return buildEvisaFaq(5, 15)
      case '需通行证':
        return buildPermitFaq(meta.zh, meta.en)
      default:
        return buildConsularFaq(meta.zh, meta.en, 5, 15, canApplyOnline, acceptPersonal, needInterview)
    }
  })()
  // 合并国家专属 FAQ：排在通用之前，同 id 覆盖（这里用 question 的 zh 值作为去重 key）
  const countryExtra = getCountryFaqExtra(meta.id, visaTypeId)
  const extraFaq = countryExtra?.faq ?? []
  const extraKeys = new Set(extraFaq.map((f) => f.question.zh))
  const mergedFaq: FAQ[] = [...extraFaq, ...baseFaq.filter((f) => !extraKeys.has(f.question.zh))]
  // 按签证类型生成拒绝入境/拒签原因
  const rejectionReasons = countryExtra?.rejectionReasons ?? buildRejectionReasons(meta.visaType)

  return {
    id: visaTypeId,
    name: { zh: name, en: `${meta.en} Tourist Visa` },
    category: 'tourist',
    duration,
    validity: '3 个月',
    entries: isVisaFree ? 'multiple' : 'single',
    fee: { amount: feeData.fee, currency: 'CNY' },
    serviceFee: { amount: feeData.serviceFee, currency: 'CNY' },
    processingDays: PERMIT_PROCESSING_DAYS[meta.id] ?? {
      min: isVisaFree ? 0 : meta.visaType === '落地签' ? 1 : 5,
      max: isVisaFree ? 0 : meta.visaType === '落地签' ? 3 : 15,
    },
    needInterview,
    canApplyOnline,
    acceptPersonal,
    targetAudience: { zh: `赴${meta.zh}旅游的申请人`, en: `Travelers to ${meta.en}` },
    tips: { zh: `请以${meta.zh}驻华使领馆最新要求为准。`, en: `Refer to ${meta.en} embassy for latest requirements.` },
    rejectionReasons,
    // 真实领区数据（仅送签国配置；免签/落地签/电子签国家为空数组，界面走空态）
    consularDistricts: getConsularOffices(meta.id).map((o) => ({
      name: o.name,
      city: o.city,
      kind: o.kind,
      provinces: o.provinces,
      source: o.source,
      verifiedAt: o.verifiedAt,
    })),
    requirements,
    faq: mergedFaq,
  }
}

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
