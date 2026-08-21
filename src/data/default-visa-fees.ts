// data/default-visa-fees.ts
// 默认签证费用表（基于中国公民实际签证费用，人民币）
// 用于 countries.ts 生成卡片基础数据：fee + serviceFee。
// 未列出的国家用 fallback（免签 0 / 其他 300+200）。
// 注意：官方详细费用（含 sourceUrl/tiers）在 visa-fees.ts，两者用途不同。

export interface DefaultVisaFee {
  /** 签证费（人民币） */
  fee: number
  /** 服务费（人民币） */
  serviceFee: number
}

/** 基于中国公民实际签证费用的默认映射表（人民币） */
export const DEFAULT_VISA_FEES: Record<string, DefaultVisaFee> = {
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
  macau: { fee: 80, serviceFee: 20 },
  taiwan: { fee: 90, serviceFee: 60 },
}

/**
 * 按国家 ID 查询默认签证费用。
 * @param countryId 国家 id（如 japan / uae）
 * @param isVisaFree 是否免签国家（未列入表时的 fallback 依据）
 * @returns 费用 + 服务费；未列出且非免签 → 300 + 200
 */
export function getDefaultVisaFee(countryId: string, isVisaFree = false): DefaultVisaFee {
  return (
    DEFAULT_VISA_FEES[countryId] ?? {
      fee: isVisaFree ? 0 : 300,
      serviceFee: isVisaFree ? 0 : 200,
    }
  )
}
