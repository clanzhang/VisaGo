// data/country-list.ts — 88 国签证百科元数据（类型定义 + re-export）
// visaType: 互免签证 / 单方面免签 / 落地签 / 电子签 / 需通行证
// difficulty: easy(容易) / medium(中等) / hard(困难)（用于卡片徽章）
// COUNTRY_LIST 数据本体在 countries-list.ts；分组顺序在 visa-group-order.ts；此处 re-export 兼容旧调用方。

export type VisaTypeLabel = '互免签证' | '单方面免签' | '落地签' | '电子签' | '需通行证'
export type DifficultyLabel = 'easy' | 'medium' | 'hard'

export interface CountryMeta {
  id: string
  zh: string
  en: string
  flag: string
  visaType: VisaTypeLabel
  difficulty: DifficultyLabel
  region: string
  desc: string
  /** 搜索别名（拼音/常见说法/首字母），可选、向后兼容 */
  aliases?: string[]
}

export { COUNTRY_LIST } from './countries-list'
export { VISA_TYPE_ORDER, REGION_ORDER } from './visa-group-order'
