// data/encyclopedia-extra.ts
// 签证百科扩展数据：签证类型标志、费用明细、按身份材料补充
import type { Localized, Requirement } from '../types'

export interface VisaTypeFlags {
  needInterview: boolean
  canApplyOnline: boolean
  acceptPersonal: boolean
  targetAudience: Localized
}

export interface FeeBreakdown {
  visaFee: number
  serviceFee: number
  courierFee: number
  photoFee: number
}

export interface VisaExtra {
  flags: VisaTypeFlags
  fees: FeeBreakdown
}

export type IdentityKey = 'employed' | 'student' | 'retired' | 'freelance'

export const visaExtras: Record<string, VisaExtra> = {
  'japan_jp-tourist': {
    flags: { needInterview: false, canApplyOnline: false, acceptPersonal: false, targetAudience: { zh: '赴日旅游观光、探亲访友的普通申请人', en: 'Travelers visiting Japan for tourism/family' } },
    fees: { visaFee: 200, serviceFee: 200, courierFee: 50, photoFee: 30 },
  },
  'japan_jp-business': {
    flags: { needInterview: false, canApplyOnline: false, acceptPersonal: false, targetAudience: { zh: '赴日商务洽谈、参展、考察的企业人员', en: 'Business travelers to Japan' } },
    fees: { visaFee: 300, serviceFee: 300, courierFee: 50, photoFee: 30 },
  },
  'korea_kr-tourist': {
    flags: { needInterview: false, canApplyOnline: false, acceptPersonal: true, targetAudience: { zh: '赴韩旅游观光的普通申请人', en: 'Travelers visiting Korea' } },
    fees: { visaFee: 400, serviceFee: 300, courierFee: 50, photoFee: 30 },
  },
  'korea_kr-multiple': {
    flags: { needInterview: false, canApplyOnline: false, acceptPersonal: true, targetAudience: { zh: '有多次往返需求的高频访韩人员', en: 'Frequent travelers to Korea' } },
    fees: { visaFee: 800, serviceFee: 300, courierFee: 50, photoFee: 30 },
  },
  'thailand_th-tourist': {
    flags: { needInterview: false, canApplyOnline: true, acceptPersonal: true, targetAudience: { zh: '赴泰旅游观光的普通申请人', en: 'Travelers visiting Thailand' } },
    fees: { visaFee: 240, serviceFee: 200, courierFee: 50, photoFee: 30 },
  },
  'thailand_th-business': {
    flags: { needInterview: false, canApplyOnline: false, acceptPersonal: true, targetAudience: { zh: '赴泰商务、投资的商务人士', en: 'Business travelers to Thailand' } },
    fees: { visaFee: 500, serviceFee: 300, courierFee: 50, photoFee: 30 },
  },
  'schengen_sg-tourist': {
    flags: { needInterview: false, canApplyOnline: false, acceptPersonal: true, targetAudience: { zh: '赴欧洲多国旅游观光的申请人', en: 'Travelers visiting Schengen countries' } },
    fees: { visaFee: 720, serviceFee: 500, courierFee: 50, photoFee: 30 },
  },
  'schengen_sg-business': {
    flags: { needInterview: false, canApplyOnline: false, acceptPersonal: true, targetAudience: { zh: '赴欧洲商务洽谈、参加会展的企业人员', en: 'Business travelers to Europe' } },
    fees: { visaFee: 720, serviceFee: 500, courierFee: 50, photoFee: 30 },
  },
  'usa_us-b1b2': {
    flags: { needInterview: true, canApplyOnline: true, acceptPersonal: true, targetAudience: { zh: '赴美商务或旅游观光的申请人', en: 'Business and leisure travelers to the US' } },
    fees: { visaFee: 1390, serviceFee: 600, courierFee: 50, photoFee: 30 },
  },
  'uk_uk-visitor': {
    flags: { needInterview: false, canApplyOnline: true, acceptPersonal: true, targetAudience: { zh: '赴英旅游、商务、探亲的申请人', en: 'Travelers visiting the UK' } },
    fees: { visaFee: 1250, serviceFee: 500, courierFee: 50, photoFee: 30 },
  },
  'australia_au-600': {
    flags: { needInterview: false, canApplyOnline: true, acceptPersonal: true, targetAudience: { zh: '赴澳旅游、探亲、访友的申请人', en: 'Travelers visiting Australia' } },
    fees: { visaFee: 1450, serviceFee: 500, courierFee: 50, photoFee: 30 },
  },
}

export const identityExtraRequirements: Record<IdentityKey, Requirement[]> = {
  employed: [],
  student: [
    { id: 'id-student-cert', name: { zh: '在读证明（加盖学校公章）', en: 'School enrollment certificate' }, category: 'identity', required: true, format: 'original', translationRequired: true, forOccupation: ['student'] },
    { id: 'id-student-parent', name: { zh: '出资人（父母）在职证明与流水', en: 'Sponsor (parents) employment & bank statement' }, category: 'financial', required: true, format: 'copy', translationRequired: true, forOccupation: ['student'] },
    { id: 'id-student-relation', name: { zh: '亲属关系证明/出生证明', en: 'Relationship/birth certificate' }, category: 'extra', required: false, format: 'copy', translationRequired: false, forOccupation: ['student'] },
  ],
  retired: [
    { id: 'id-retired-cert', name: { zh: '退休证复印件', en: 'Pension certificate' }, category: 'identity', required: true, format: 'copy', translationRequired: false, forOccupation: ['retired'] },
    { id: 'id-retired-pension', name: { zh: '养老金流水（近 6 个月）', en: 'Pension statements (6 months)' }, category: 'financial', required: true, format: 'original', translationRequired: false, forOccupation: ['retired'] },
    { id: 'id-retired-asset', name: { zh: '资产证明（房产、存款）', en: 'Asset certificates' }, category: 'financial', required: false, format: 'copy', translationRequired: false, forOccupation: ['retired'] },
  ],
  freelance: [
    { id: 'id-freelance-letter', name: { zh: '收入来源说明 / 解释信', en: 'Income source explanation letter' }, category: 'identity', required: true, format: 'original', translationRequired: true, forOccupation: ['freelance'] },
    { id: 'id-freelance-asset', name: { zh: '资产证明（房产、车产、存款）', en: 'Asset certificates' }, category: 'financial', required: false, format: 'copy', translationRequired: false, forOccupation: ['freelance'] },
    { id: 'id-freelance-portfolio', name: { zh: '作品集 / 客户合同 / 纳税记录', en: 'Portfolio / contracts / tax records' }, category: 'extra', required: false, format: 'copy', translationRequired: false, forOccupation: ['freelance'] },
  ],
}

export const extraBasicRequirements: Requirement[] = [
  { id: 'id-card-copy', name: { zh: '身份证复印件', en: 'ID card copy' }, category: 'basic', required: true, format: 'copy', translationRequired: false },
  { id: 'id-hukou-copy', name: { zh: '户口本复印件', en: 'Household registration copy' }, category: 'basic', required: true, format: 'copy', translationRequired: false },
]

export const districtCities: Record<string, string[]> = {
  japan: ['北京', '上海', '广州', '沈阳', '重庆'],
  korea: ['北京', '上海', '广州', '沈阳', '成都'],
  thailand: ['北京', '上海', '广州', '成都'],
  schengen: ['北京', '上海', '广州', '重庆'],
  usa: ['北京', '上海', '广州', '沈阳', '成都'],
  uk: ['北京', '上海', '广州', '重庆'],
  australia: ['北京', '上海', '广州', '成都'],
}

export const REGIONS = ['东亚', '东南亚', '欧洲', '北美', '大洋洲'] as const

export function getDistrictCity(countryId: string, index: number): string {
  return districtCities[countryId]?.[index] ?? ''
}

export function getVisaExtra(countryId: string, visaTypeId: string): VisaExtra | undefined {
  return visaExtras[`${countryId}_${visaTypeId}`]
}
