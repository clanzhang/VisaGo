// data/build-visa-type.ts — 签证类型构建器
// 由 country-list 元数据生成统一 VisaType 结构（buildBasicVisaType），
// 供 countries.ts 的 buildCountry 调用。含港澳台通行证/入台证办理天数。

import type { VisaType, Requirement, FAQ } from '../types'
import { type CountryMeta } from './country-list'
import { NEW_ZEALAND_REQUIREMENTS, SCHENGEN_REQUIREMENTS } from './encyclopedia-materials'
import { getVisaExtra } from './encyclopedia-extra'
import { getCountryFaqExtra } from './encyclopedia-faq'
import { getConsularOffices } from './consular-districts'
import { getDefaultVisaFee } from './default-visa-fees'
import {
  buildMutualVisaFreeFaq,
  buildOnArrivalFaq,
  buildEvisaFaq,
  buildPermitFaq,
  buildConsularFaq,
  buildRejectionReasons,
} from './faq-templates'

/** 港澳台通行证/入台证办理天数（按目的地区分；其余走通用逻辑） */
const PERMIT_PROCESSING_DAYS: Record<string, { min: number; max: number }> = {
  'hong-kong': { min: 1, max: 7 },
  macau: { min: 1, max: 5 },
  taiwan: { min: 5, max: 10 },
}

/** 国家专属材料清单（新西兰/申根），其余用默认模板 */
function buildRequirements(meta: CountryMeta): Requirement[] {
  if (meta.id === 'new-zealand') return NEW_ZEALAND_REQUIREMENTS
  if (meta.id === 'schengen') return SCHENGEN_REQUIREMENTS
  return [
    { id: 'passport', name: { zh: '有效护照', en: 'Valid passport' }, category: 'basic', required: true, format: 'original', translationRequired: false },
    { id: 'photo', name: { zh: '证件照 2 张', en: '2 photos' }, category: 'basic', required: true, format: 'original', translationRequired: false },
    { id: 'application', name: { zh: '签证申请表', en: 'Application form' }, category: 'basic', required: true, format: 'original', translationRequired: false },
    { id: 'employment', name: { zh: '在职证明', en: 'Employment cert' }, category: 'identity', required: true, format: 'copy', translationRequired: false },
    { id: 'bank', name: { zh: '银行流水', en: 'Bank statement' }, category: 'financial', required: true, format: 'copy', translationRequired: false },
    { id: 'itinerary', name: { zh: '行程安排', en: 'Itinerary' }, category: 'travel', required: true, format: 'copy', translationRequired: false },
  ] as Requirement[]
}

/** 按签证类型生成通用 FAQ */
function buildBaseFaq(meta: CountryMeta, fee: number, canApplyOnline: boolean, acceptPersonal: boolean, needInterview: boolean): FAQ[] {
  const duration = '最长 30 天'
  switch (meta.visaType) {
    case '互免签证':
    case '单方面免签':
      return buildMutualVisaFreeFaq(meta.zh, meta.en, duration)
    case '落地签':
      return buildOnArrivalFaq(fee, 'CNY')
    case '电子签':
      return buildEvisaFaq(5, 15)
    case '需通行证':
      return buildPermitFaq(meta.zh, meta.en)
    default:
      return buildConsularFaq(meta.zh, meta.en, 5, 15, canApplyOnline, acceptPersonal, needInterview)
  }
}

/** 根据国家元数据生成基础旅游签证类型 */
export function buildBasicVisaType(meta: CountryMeta): VisaType {
  const name = `${meta.zh}旅游签证`
  const visaTypeId = `${meta.id}-tourist`
  const canApplyOnline = meta.visaType === '电子签' || meta.visaType === '落地签'
  const needInterview = meta.difficulty === 'hard'
  const isVisaFree = meta.visaType === '互免签证' || meta.visaType === '单方面免签'
  const requirements = buildRequirements(meta)
  // 费用映射：优先查默认费用表，未列出则免签 0 / 其他 300+200
  const feeData = getDefaultVisaFee(meta.id, isVisaFree)
  // 是否接受个人递签：优先用百科扩展数据（如日本须经指定代办机构），未配置默认 true
  const acceptPersonal = getVisaExtra(meta.id, visaTypeId)?.flags.acceptPersonal ?? true
  const duration = '最长 30 天'
  // 按签证类型生成通用 FAQ
  const baseFaq = buildBaseFaq(meta, feeData.fee, canApplyOnline, acceptPersonal, needInterview)
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
