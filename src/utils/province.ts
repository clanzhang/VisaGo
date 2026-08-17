// utils/province.ts — 省份名称归一化
// 资料卡 OCR 识别出的户籍可能是「北京市」「广西壮族自治区」「香港特别行政区」等，
// 需要归一化成标准列表（src/data/countries.ts 的 PROVINCES）里的值，否则无法匹配 <select> 选项。

/** 显式别名映射（覆盖拆后缀后仍不标准的值） */
const ALIASES: Record<string, string> = {
  内蒙古自治区: '内蒙古',
  内蒙古: '内蒙古',
  广西壮族自治区: '广西',
  广西: '广西',
  新疆维吾尔自治区: '新疆',
  新疆: '新疆',
  西藏自治区: '西藏',
  西藏: '西藏',
  宁夏回族自治区: '宁夏',
  宁夏: '宁夏',
  香港特别行政区: '香港',
  香港: '香港',
  澳门特别行政区: '澳门',
  澳门: '澳门',
}

/** 依次尝试剥离的后缀（长后缀在前，避免「维吾尔自治区」先被「自治区」截断） */
const SUFFIXES = ['维吾尔自治区', '壮族自治区', '回族自治区', '特别行政区', '自治区', '省', '市']

/**
 * 把任意省份写法归一化为标准短名（如「北京市」→「北京」）。
 * 空输入返回空串；未知写法返回剥离后缀后的结果（可能仍不在标准列表，由调用方兜底校验）。
 */
export function normalizeProvince(raw: string): string {
  const input = (raw ?? '').trim()
  if (!input) return ''
  if (ALIASES[input]) return ALIASES[input]
  let v = input
  for (const suffix of SUFFIXES) {
    if (v.endsWith(suffix)) {
      v = v.slice(0, -suffix.length)
      break
    }
  }
  return v.trim()
}

/** 兜底校验：归一化后的值是否在标准省份列表里 */
export function isKnownProvince(value: string, list: readonly string[]): boolean {
  return list.includes(value)
}
