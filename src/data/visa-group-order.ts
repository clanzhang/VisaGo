// data/visa-group-order.ts — 签证百科分组顺序（单一来源）
// 国家列表按签证类型/区域分组展示时的排序依据。
// 由 country-list.ts re-export，供 Step1Country / Encyclopedia 等分组排序复用。

/** 分组顺序（按签证类型：互免 → 单免 → 落地 → 电子 → 通行证） */
export const VISA_TYPE_ORDER = ['互免签证', '单方面免签', '落地签', '电子签', '需通行证'] as const

/** 区域排序（亚洲 → 欧洲 → 美洲 → 大洋洲 → 非洲 → 港澳台） */
export const REGION_ORDER = ['亚洲', '欧洲', '美洲', '大洋洲', '非洲', '港澳台']
