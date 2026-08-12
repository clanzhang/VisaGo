// data/countries.ts
// 90+ 国家签证静态数据（全部由 country-list.ts 生成统一结构）

import type { Country, Localized, VisaType, Requirement, FAQ } from '../types'
import { COUNTRY_LIST, type CountryMeta } from './country-list'

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

function buildBasicVisaType(meta: CountryMeta): VisaType {
  const name = `${meta.zh}旅游签证`
  const canApplyOnline = meta.visaType === '电子签' || meta.visaType === '落地签'
  const needInterview = meta.difficulty === 'hard'
  const isVisaFree = meta.visaType === '互免签证' || meta.visaType === '单方面免签'
  return {
    id: `${meta.id}-tourist`,
    name: { zh: name, en: `${meta.en} Tourist Visa` },
    category: 'tourist',
    duration: '最长 30 天',
    validity: '3 个月',
    entries: isVisaFree ? 'multiple' : 'single',
    fee: { amount: isVisaFree ? 0 : 300, currency: 'CNY' },
    serviceFee: { amount: isVisaFree ? 0 : 200, currency: 'CNY' },
    processingDays: { min: isVisaFree ? 0 : 5, max: isVisaFree ? 0 : 10 },
    needInterview,
    canApplyOnline,
    acceptPersonal: true,
    targetAudience: { zh: `赴${meta.zh}旅游的申请人`, en: `Travelers to ${meta.en}` },
    tips: { zh: `请以${meta.zh}驻华使领馆最新要求为准。`, en: `Refer to ${meta.en} embassy for latest requirements.` },
    rejectionReasons: [{ zh: '材料不齐全', en: 'Incomplete documents' }],
    consularDistricts: [
      { name: { zh: `${meta.zh}驻华使领馆`, en: `${meta.en} Embassy` }, provinces: ['北京', '上海', '广东'] },
    ],
    requirements: [
      { id: 'passport', name: { zh: '有效护照', en: 'Valid passport' }, category: 'basic', required: true, format: 'original', translationRequired: false },
      { id: 'photo', name: { zh: '证件照 2 张', en: '2 photos' }, category: 'basic', required: true, format: 'original', translationRequired: false },
      { id: 'application', name: { zh: '签证申请表', en: 'Application form' }, category: 'basic', required: true, format: 'original', translationRequired: false },
      { id: 'employment', name: { zh: '在职证明', en: 'Employment cert' }, category: 'identity', required: true, format: 'copy', translationRequired: false },
      { id: 'bank', name: { zh: '银行流水', en: 'Bank statement' }, category: 'financial', required: true, format: 'copy', translationRequired: false },
      { id: 'itinerary', name: { zh: '行程安排', en: 'Itinerary' }, category: 'travel', required: true, format: 'copy', translationRequired: false },
    ] as Requirement[],
    faq: [
      { question: { zh: `去${meta.zh}需要什么材料？`, en: `What's needed for ${meta.en}?` }, answer: { zh: '护照、照片、申请表、在职证明、流水、行程。', en: 'Passport, photo, form, employment, bank, itinerary.' } },
    ] as FAQ[],
  }
}

function buildCountry(meta: CountryMeta): Country {
  return {
    id: meta.id,
    name: { zh: meta.zh, en: meta.en },
    flag: meta.flag,
    difficulty: meta.difficulty,
    visaType: meta.visaType,
    region: meta.region,
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

/** 签证类型标签配色 */
export const VISA_TYPE_STYLE: Record<Country['visaType'], { label: string; cls: string }> = {
  互免签证: { label: '互免签证', cls: 'bg-green-700/10 text-green-800' },
  单方面免签: { label: '单方面免签', cls: 'bg-green-500/10 text-green-600' },
  落地签: { label: '落地签', cls: 'bg-[#1460A4]/10 text-[#1460A4]' },
  电子签: { label: '电子签', cls: 'bg-[#7B2FBE]/10 text-[#7B2FBE]' },
  需签证: { label: '需签证', cls: 'bg-ink/5 text-ink/60' },
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
  return countries.filter(
    (c) =>
      c.name.zh.includes(kw) ||
      c.name.en.toLowerCase().includes(kw) ||
      c.visaTypes.some(
        (v) => v.name.zh.includes(kw) || v.name.en.toLowerCase().includes(kw),
      ),
  )
}
