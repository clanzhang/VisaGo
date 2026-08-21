// data/provinces.ts — 中国省级行政区列表（单一来源）
// 仅中国大陆省级行政区。
// 台湾/香港/澳门不在此列：持这些身份/居住地走的是不同办理渠道，
// 不应被误匹配到大陆使领馆领区（由 utils/province.isKnownProvince 兜底提示）。
// countries.ts 在此 re-export，供 Step3Identity / ProvincePicker / Assistant 等复用。

export const PROVINCES = [
  '北京', '天津', '河北', '山西', '内蒙古', '辽宁', '吉林', '黑龙江',
  '上海', '江苏', '浙江', '安徽', '福建', '江西', '山东',
  '河南', '湖北', '湖南', '广东', '广西', '海南',
  '重庆', '四川', '贵州', '云南', '西藏',
  '陕西', '甘肃', '青海', '宁夏', '新疆',
] as const

/** 省份是否为合法值（用归一化后的短名比对） */
export function isProvince(value: string): boolean {
  return (PROVINCES as readonly string[]).includes(value)
}
