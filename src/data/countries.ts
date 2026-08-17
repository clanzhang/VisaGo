// data/countries.ts
// 90+ 国家签证静态数据（全部由 country-list.ts 生成统一结构）

import type { Country, Localized, VisaType, Requirement, FAQ } from '../types'
import { COUNTRY_LIST, type CountryMeta } from './country-list'
import { NEW_ZEALAND_REQUIREMENTS, SCHENGEN_REQUIREMENTS } from './encyclopedia-materials'

export const PROVINCES = [
  '北京', '天津', '河北', '山西', '内蒙古', '辽宁', '吉林', '黑龙江',
  '上海', '江苏', '浙江', '安徽', '福建', '江西', '山东',
  '河南', '湖北', '湖南', '广东', '广西', '海南',
  '重庆', '四川', '贵州', '云南', '西藏',
  '陕西', '甘肃', '青海', '宁夏', '新疆', '台湾', '香港', '澳门',
]

export const OCCUPATIONS = [
  { value: 'employed', icon: 'ri:briefcase-line' },
  { value: 'student', icon: 'ri:graduation-cap-line' },
  { value: 'retired', icon: 'ri:user-smile-line' },
  { value: 'freelance', icon: 'ri:group-line' },
] as const

// ===== 从元数据生成统一结构 =====

/** 基于中国公民实际签证费用（人民币）。未列出的国家用 fallback（免签 0 / 其他 300+200） */
const VISA_FEES: Record<string, { fee: number; serviceFee: number }> = {
  // 互免签证（通常免费）
  uae: { fee: 0, serviceFee: 0 },
  thailand: { fee: 0, serviceFee: 0 },
  singapore: { fee: 0, serviceFee: 0 },
  malaysia: { fee: 0, serviceFee: 0 },
  qatar: { fee: 0, serviceFee: 0 },
  serbia: { fee: 0, serviceFee: 0 },
  belarus: { fee: 0, serviceFee: 0 },
  maldives: { fee: 0, serviceFee: 0 },
  mauritius: { fee: 0, serviceFee: 0 },
  seychelles: { fee: 0, serviceFee: 0 },

  // 落地签（按实际费用）
  indonesia: { fee: 230, serviceFee: 100 },
  cambodia: { fee: 210, serviceFee: 100 },
  laos: { fee: 200, serviceFee: 100 },
  nepal: { fee: 250, serviceFee: 100 },
  egypt: { fee: 175, serviceFee: 100 },
  jordan: { fee: 280, serviceFee: 100 },
  bahrain: { fee: 200, serviceFee: 100 },

  // 电子签 / 需签证
  japan: { fee: 250, serviceFee: 150 },
  korea: { fee: 350, serviceFee: 150 },
  india: { fee: 600, serviceFee: 200 },
  'sri-lanka': { fee: 200, serviceFee: 100 },
  schengen: { fee: 600, serviceFee: 250 },
  uk: { fee: 900, serviceFee: 300 },
  ireland: { fee: 500, serviceFee: 200 },
  usa: { fee: 1100, serviceFee: 400 },
  canada: { fee: 900, serviceFee: 350 },
  australia: { fee: 1000, serviceFee: 350 },
  'new-zealand': { fee: 900, serviceFee: 300 },
  'south-africa': { fee: 400, serviceFee: 200 },

  // 港澳台
  'hong-kong': { fee: 80, serviceFee: 20 },
  taiwan: { fee: 90, serviceFee: 60 },
}

function buildBasicVisaType(meta: CountryMeta): VisaType {
  const name = `${meta.zh}旅游签证`
  const canApplyOnline = meta.visaType === '电子签' || meta.visaType === '落地签'
  const needInterview = meta.difficulty === 'hard'
  const isVisaFree = meta.visaType === '互免签证' || meta.visaType === '单方面免签'
  // 港澳台：通行证/入台证，办理天数不同
  const isHKorTW = meta.id === 'hong-kong' || meta.id === 'taiwan'
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
  // 费用映射：优先查表，未列出则免签 0 / 其他 300+200
  const feeData = VISA_FEES[meta.id] || { fee: isVisaFree ? 0 : 300, serviceFee: isVisaFree ? 0 : 200 }
  return {
    id: `${meta.id}-tourist`,
    name: { zh: name, en: `${meta.en} Tourist Visa` },
    category: 'tourist',
    duration: '最长 30 天',
    validity: '3 个月',
    entries: isVisaFree ? 'multiple' : 'single',
    fee: { amount: feeData.fee, currency: 'CNY' },
    serviceFee: { amount: feeData.serviceFee, currency: 'CNY' },
    processingDays: isHKorTW
      ? meta.id === 'hong-kong'
        ? { min: 1, max: 7 }
        : { min: 5, max: 10 }
      : {
          min: isVisaFree ? 0 : meta.visaType === '落地签' ? 1 : 5,
          max: isVisaFree ? 0 : meta.visaType === '落地签' ? 3 : 15,
        },
    needInterview,
    canApplyOnline,
    acceptPersonal: true,
    targetAudience: { zh: `赴${meta.zh}旅游的申请人`, en: `Travelers to ${meta.en}` },
    tips: { zh: `请以${meta.zh}驻华使领馆最新要求为准。`, en: `Refer to ${meta.en} embassy for latest requirements.` },
    rejectionReasons: [{ zh: '材料不齐全', en: 'Incomplete documents' }],
    consularDistricts: [
      { name: { zh: `${meta.zh}驻华使领馆`, en: `${meta.en} Embassy` }, provinces: ['北京', '上海', '广东'] },
    ],
    requirements,
    faq: [
      { question: { zh: `去${meta.zh}需要什么材料？`, en: `What's needed for ${meta.en}?` }, answer: { zh: '护照、照片、申请表、在职证明、流水、行程。', en: 'Passport, photo, form, employment, bank, itinerary.' } },
    ] as FAQ[],
  }
}

function buildCountry(meta: CountryMeta): Country {
  // 港澳台单独分组
  const region = meta.id === 'hong-kong' || meta.id === 'taiwan' ? '港澳台' : meta.region
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
  Localized & { icon: string }
> = {
  basic: { zh: '基础材料', en: 'Basic Documents', icon: 'ri:file-list-3-line' },
  identity: { zh: '身份材料', en: 'Identity Documents', icon: 'ri:id-card-line' },
  financial: { zh: '财力材料', en: 'Financial Documents', icon: 'ri:wallet-3-line' },
  travel: { zh: '行程材料', en: 'Travel Documents', icon: 'ri:map-2-line' },
  extra: { zh: '补充材料', en: 'Additional Documents', icon: 'ri:add-circle-line' },
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
