// data/visa-fees.ts
// 官方签证费用数据（2026 更新版）
// 数据来源已验证，每条记录附 sourceUrl 与 lastVerified
// 支持：按国家查 / 按签证类型查 / 多币种展示

import type { Localized } from '../types'
import { COUNTRY_LIST } from './country-list'

export type CurrencyCode = 'AUD' | 'NZD' | 'USD' | 'CAD' | 'GBP' | 'CNY' | 'THB' | 'SGD' | 'EUR' | 'FREE'

export interface FeeEntry {
  /** 金额（该币种单位）；FREE = 免费 */
  amount: number
  currency: CurrencyCode
  /** 面向群体/申请情形说明，如「境外申请」「成人」 */
  scope?: Localized
}

export interface VisaFeeItem {
  id: string
  countryId: string
  /** 签证/类别名称，如 Visitor 600、B1/B2 */
  name: Localized
  /** 展示排序 */
  order?: number
  /** 各档位费用（如 2年/5年/10年、单次/多次、成人/儿童） */
  tiers: FeeEntry[]
  /** 免费说明（如「互免签证」「免费 eTA」） */
  freeNote?: Localized
  /** 生效日期（格式 YYYY-MM-DD 或 YYYY.MM.DD） */
  effectiveFrom?: string
  /** 附注（不含服务费、另加手续费等） */
  note?: Localized
  sourceUrl: string
  lastVerified: string
}

/** 按国家汇总（countryId → 该国签证费用项） */
export const visaFees: Record<string, VisaFeeItem[]> = {
  australia: [
    {
      id: 'au-600',
      countryId: 'australia',
      name: { zh: 'Visitor 600 旅游流', en: 'Visitor Visa 600 (Tourist stream)' },
      order: 1,
      tiers: [
        { amount: 250, currency: 'AUD', scope: { zh: '境外申请', en: 'Outside Australia' } },
        { amount: 630, currency: 'AUD', scope: { zh: '境内申请', en: 'Inside Australia' } },
      ],
      sourceUrl: 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/visitor-600',
      lastVerified: '2026-08-12',
    },
  ],
  'new-zealand': [
    {
      id: 'nz-visitor',
      countryId: 'new-zealand',
      name: { zh: '访客签证', en: 'Visitor Visa' },
      order: 1,
      tiers: [
        { amount: 441, currency: 'NZD', scope: { zh: '签证费', en: 'Visa fee' } },
        { amount: 100, currency: 'NZD', scope: { zh: 'IVL 税', en: 'IVL' } },
      ],
      note: { zh: 'IVL 为国际游客保护和旅游税', en: 'IVL = International Visitor Conservation and Tourism Levy' },
      sourceUrl: 'https://www.immigration.govt.nz/new-zealand-visas/apply-for-a-visa/visa-fees',
      lastVerified: '2026-08-12',
    },
  ],
  usa: [
    {
      id: 'us-b1b2',
      countryId: 'usa',
      name: { zh: 'B1/B2 商务旅游', en: 'B1/B2 Business & Tourism' },
      order: 1,
      tiers: [{ amount: 185, currency: 'USD', scope: { zh: '申请费', en: 'Application fee' } }],
      sourceUrl: 'https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/fees/fees-visas.html',
      lastVerified: '2026-08-12',
    },
  ],
  canada: [
    {
      id: 'ca-visitor',
      countryId: 'canada',
      name: { zh: '访客签证', en: 'Visitor Visa (TRV)' },
      order: 1,
      tiers: [
        { amount: 100, currency: 'CAD', scope: { zh: '每人', en: 'Per person' } },
        { amount: 500, currency: 'CAD', scope: { zh: '家庭（5 人及以上）', en: 'Family (5+)' } },
      ],
      sourceUrl: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/apply-visitor-visa/fees.html',
      lastVerified: '2026-08-12',
    },
    {
      id: 'ca-eta',
      countryId: 'canada',
      name: { zh: 'eTA 电子旅行授权', en: 'eTA (eTA)' },
      order: 2,
      tiers: [{ amount: 7, currency: 'CAD', scope: { zh: '每人', en: 'Per person' } }],
      sourceUrl: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/eta.html',
      lastVerified: '2026-08-12',
    },
  ],
  uk: [
    {
      id: 'uk-standard-visitor',
      countryId: 'uk',
      name: { zh: '标准访客签', en: 'Standard Visitor' },
      order: 1,
      tiers: [
        { amount: 135, currency: 'GBP', scope: { zh: '6 个月', en: '6 months' } },
        { amount: 506, currency: 'GBP', scope: { zh: '2 年', en: '2 years' } },
        { amount: 903, currency: 'GBP', scope: { zh: '5 年', en: '5 years' } },
        { amount: 1128, currency: 'GBP', scope: { zh: '10 年', en: '10 years' } },
      ],
      sourceUrl: 'https://www.gov.uk/visa-fees',
      lastVerified: '2026-08-12',
    },
  ],
  japan: [
    {
      id: 'jp-short-stay',
      countryId: 'japan',
      name: { zh: '短期滞在', en: 'Short Stay' },
      order: 1,
      tiers: [
        { amount: 715, currency: 'CNY', scope: { zh: '单次', en: 'Single entry' } },
        { amount: 1430, currency: 'CNY', scope: { zh: '两次', en: 'Double entry' } },
        { amount: 1430, currency: 'CNY', scope: { zh: '多次', en: 'Multiple entry' } },
      ],
      effectiveFrom: '2026.7.1',
      note: { zh: '使馆签证费，另需代办机构手续费', en: 'Embassy fee; agency handling fee extra' },
      sourceUrl: 'https://www.cn.emb-japan.go.jp/itpr_zh/00_000485_00222.html',
      lastVerified: '2026-08-12',
    },
  ],
  korea: [
    {
      id: 'kr-c3',
      countryId: 'korea',
      name: { zh: 'C-3 旅游', en: 'C-3 Tourism' },
      order: 1,
      tiers: [
        { amount: 260, currency: 'CNY', scope: { zh: '单次', en: 'Single entry' } },
        { amount: 585, currency: 'CNY', scope: { zh: '多次', en: 'Multiple entry' } },
      ],
      note: {
        zh: '领馆费；另加服务费：单次 ¥200、多次 ¥350',
        en: 'Consulate fee; plus service fee: ¥200 single / ¥350 multiple',
      },
      sourceUrl: 'https://overseas.mofa.go.kr/cn-zh/brd/m_1070/view.do?seq=761046',
      lastVerified: '2026-08-12',
    },
  ],
  thailand: [
    {
      id: 'th-tr',
      countryId: 'thailand',
      name: { zh: 'TR 旅游签证', en: 'TR Tourist Visa' },
      order: 1,
      tiers: [{ amount: 1000, currency: 'THB', scope: { zh: '单次', en: 'Single entry' } }],
      sourceUrl: 'https://www.thaievisa.go.th/',
      lastVerified: '2026-08-12',
    },
    {
      id: 'th-metv',
      countryId: 'thailand',
      name: { zh: 'METV 多次入境旅游', en: 'METV Multiple Entry' },
      order: 2,
      tiers: [{ amount: 5000, currency: 'THB', scope: { zh: '多次', en: 'Multiple entry' } }],
      sourceUrl: 'https://www.thaievisa.go.th/',
      lastVerified: '2026-08-12',
    },
  ],
  singapore: [
    {
      id: 'sg-entry',
      countryId: 'singapore',
      name: { zh: '入境签证', en: 'Entry Visa' },
      order: 1,
      tiers: [{ amount: 30, currency: 'SGD', scope: { zh: '每人', en: 'Per person' } }],
      sourceUrl: 'https://www.ica.gov.sg/visa/apply/visa-application-procedure',
      lastVerified: '2026-08-12',
    },
  ],
  malaysia: [
    {
      id: 'my-visa-free',
      countryId: 'malaysia',
      name: { zh: '免签入境', en: 'Visa-free entry' },
      order: 1,
      tiers: [{ amount: 0, currency: 'FREE', scope: { zh: '免费', en: 'Free' } }],
      freeNote: { zh: '互免签证，最长停留 30 天', en: 'Visa-free, up to 30 days' },
      sourceUrl: 'https://www.kln.gov.my/web/guest/visa',
      lastVerified: '2026-08-12',
    },
  ],
  schengen: [
    {
      id: 'schengen-type-c',
      countryId: 'schengen',
      name: { zh: 'Type C 短期签证', en: 'Short-stay Type C' },
      order: 1,
      tiers: [
        { amount: 90, currency: 'EUR', scope: { zh: '成人', en: 'Adult' } },
        { amount: 45, currency: 'EUR', scope: { zh: '6–12 岁', en: 'Age 6–12' } },
        { amount: 0, currency: 'FREE', scope: { zh: '6 岁以下', en: 'Under 6' } },
      ],
      effectiveFrom: '2024.6.11',
      note: { zh: '不含 VFS 服务费', en: 'Excludes VFS service fee' },
      sourceUrl: 'https://home-affairs.ec.europa.eu/policies/schengen-borders-and-visa/visa-policy_en',
      lastVerified: '2026-08-12',
    },
  ],
}

/** 全部国家 ID 顺序（用于列表展示） */
export const visaFeeCountryOrder: string[] = [
  'australia',
  'new-zealand',
  'usa',
  'canada',
  'uk',
  'japan',
  'korea',
  'thailand',
  'singapore',
  'malaysia',
  'schengen',
]

/**
 * UI visaType.id（如 japan-tourist）→ 官方费用项 id（如 jp-short-stay）映射。
 * 用于 getVisaOfficialFee 按 visaType 查询官方费用。
 */
export const VISATYPE_TO_FEE_ITEM: Record<string, string> = {
  'japan-tourist': 'jp-short-stay',
  'japan-business': 'jp-short-stay',
  'korea-tourist': 'kr-c3',
  'korea-multiple': 'kr-c3',
  'thailand-tourist': 'th-tr',
  'thailand-business': 'th-metv',
  'schengen-tourist': 'schengen-type-c',
  'schengen-business': 'schengen-type-c',
  'usa-tourist': 'us-b1b2',
  'uk-tourist': 'uk-standard-visitor',
  'australia-tourist': 'au-600',
  'new-zealand-tourist': 'nz-visitor',
  'canada-tourist': 'ca-visitor',
  'singapore-tourist': 'sg-entry',
  'malaysia-tourist': 'my-visa-free',
}

/**
 * 按国家 ID + visaType.id 查询官方费用。
 * 返回 undefined 表示无官方数据（调用方回退旧数据）。
 */
export function getVisaOfficialFee(
  countryId: string,
  visaTypeId: string,
  fallback: { serviceFee: number; courierFee: number; photoFee: number },
): OfficialFeeBreakdown | undefined {
  const feeItemId = VISATYPE_TO_FEE_ITEM[visaTypeId]
  if (!feeItemId) return undefined
  return getOfficialFeeBreakdown(countryId, feeItemId, fallback)
}

/** 币种符号映射 */
export const CURRENCY_SYMBOL: Record<CurrencyCode, string> = {
  AUD: 'A$',
  NZD: 'NZ$',
  USD: '$',
  CAD: 'C$',
  GBP: '£',
  CNY: '¥',
  THB: '฿',
  SGD: 'S$',
  EUR: '€',
  FREE: '免费',
}

/** 按国家查询全部签证费用项 */
export function getCountryFees(countryId: string): VisaFeeItem[] {
  return visaFees[countryId] ?? []
}

/** 按签证类型（item id）查询 */
export function getVisaFee(countryId: string, feeItemId: string): VisaFeeItem | undefined {
  return visaFees[countryId]?.find((f) => f.id === feeItemId)
}

/** 按国家 ID 查询国家展示信息（复用 country-list 元数据） */
export function getFeeCountryMeta(countryId: string): { zh: string; en: string; flag: string } | undefined {
  const meta = COUNTRY_LIST.find((c) => c.id === countryId)
  return meta ? { zh: meta.zh, en: meta.en, flag: meta.flag } : undefined
}

/** 格式化单个费用档位为可读字符串，如 "A$250"、"¥715"、"免费" */
export function formatFee(entry: FeeEntry): string {
  if (entry.currency === 'FREE') return '免费'
  const symbol = CURRENCY_SYMBOL[entry.currency]
  return `${symbol}${entry.amount}`
}

/** 获取某签证费用项的最低起步价（用于「¥xxx 起」展示），免费返回 0 */
export function minFee(item: VisaFeeItem): number {
  return Math.min(...item.tiers.map((t) => t.amount))
}

/** 计算某签证费用项的合计（多个必缴项相加，如 NZD 441 + 100） */
export function totalFee(item: VisaFeeItem): number {
  return item.tiers.reduce((sum, t) => sum + t.amount, 0)
}

/** 把官方费用映射为 UI 现有 FeeBreakdown（人民币估算） */
export interface OfficialFeeBreakdown {
  visaFee: number
  serviceFee: number
  courierFee: number
  photoFee: number
  /** 原币种，供展示真实币种 */
  currency: CurrencyCode
  /** 各档位（单次/多次/成人/儿童等），供明细展示 */
  tiers: { label: Localized; amount: number; currency: CurrencyCode }[]
  /** 生效日期说明 */
  effectiveFrom?: string
  /** 附注（代办费、服务费等） */
  note?: Localized
  /** 免费说明 */
  freeNote?: Localized
  sourceUrl: string
  lastVerified: string
}

/**
 * 官方费用 → UI FeeBreakdown 桥接。
 * - visaFee = 首个非免费档位金额（如日本单次 715）
 * - serviceFee/courierFee/photoFee 由旧数据补充（传入 fallback）
 * - 返回 undefined 表示该国家无官方数据（调用方回退旧数据）
 */
export function getOfficialFeeBreakdown(
  countryId: string,
  feeItemId: string,
  fallback: { serviceFee: number; courierFee: number; photoFee: number },
): OfficialFeeBreakdown | undefined {
  const item = getVisaFee(countryId, feeItemId)
  if (!item) return undefined
  const firstPaid = item.tiers.find((t) => t.currency !== 'FREE')
  const visaFee = firstPaid ? firstPaid.amount : 0
  return {
    visaFee,
    serviceFee: fallback.serviceFee,
    courierFee: fallback.courierFee,
    photoFee: fallback.photoFee,
    currency: firstPaid?.currency ?? 'CNY',
    tiers: item.tiers.map((t) => ({ label: t.scope ?? { zh: '', en: '' }, amount: t.amount, currency: t.currency })),
    effectiveFrom: item.effectiveFrom,
    note: item.note,
    freeNote: item.freeNote,
    sourceUrl: item.sourceUrl,
    lastVerified: item.lastVerified,
  }
}
