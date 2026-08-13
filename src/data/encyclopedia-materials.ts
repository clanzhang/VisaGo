// data/encyclopedia-materials.ts — 签证百科国家专属材料清单
// 覆盖 countries.ts 生成的默认材料，支持：
// - translationRequired（需翻译标注）
// - notes（每项备注）
// - required 必交/选交分组
import type { Requirement } from '../types'

/** 新西兰访客签证材料（全部要求英文翻译件） */
export const NEW_ZEALAND_REQUIREMENTS: Requirement[] = [
  { id: 'passport', name: { zh: '有效护照', en: 'Valid passport' }, category: 'basic', required: true, format: 'original', translationRequired: true, notes: { zh: '有效期 6 个月以上，需附英文翻译件', en: 'Valid 6+ months, English translation required' } },
  { id: 'photo', name: { zh: '证件照', en: 'Passport photo' }, category: 'basic', required: true, format: 'original', translationRequired: true, notes: { zh: '白底 35×45mm 近照，需附英文翻译件', en: 'White background 35x45mm, English translation required' } },
  { id: 'application', name: { zh: '签证申请表', en: 'Application form' }, category: 'basic', required: true, format: 'original', translationRequired: true, notes: { zh: 'INZ 1188 申请表，需附英文翻译件', en: 'INZ 1188 form, English translation required' } },
  { id: 'hukou', name: { zh: '户口本', en: 'Household register' }, category: 'identity', required: true, format: 'copy', translationRequired: true, notes: { zh: '全本复印件，需附英文翻译件', en: 'Full copy, English translation required' } },
  { id: 'id-card', name: { zh: '身份证', en: 'ID card' }, category: 'identity', required: true, format: 'copy', translationRequired: true, notes: { zh: '正反面复印件，需附英文翻译件', en: 'Front & back copy, English translation required' } },
  { id: 'employment', name: { zh: '在职证明', en: 'Employment certificate' }, category: 'identity', required: true, format: 'original', translationRequired: true, notes: { zh: '公司抬头纸打印并盖章，需附英文翻译件', en: 'On company letterhead with stamp, English translation required' } },
  { id: 'bank', name: { zh: '银行流水', en: 'Bank statement' }, category: 'financial', required: true, format: 'copy', translationRequired: true, notes: { zh: '近 6 个月流水，余额充足，需附英文翻译件', en: 'Last 6 months, sufficient balance, English translation required' } },
  { id: 'assets', name: { zh: '资产证明', en: 'Asset proof' }, category: 'financial', required: false, format: 'copy', translationRequired: true, notes: { zh: '房产/车产/存款证明，需附英文翻译件', en: 'Property/vehicle/deposit proof, English translation required' } },
  { id: 'itinerary', name: { zh: '行程安排', en: 'Itinerary' }, category: 'travel', required: true, format: 'copy', translationRequired: true, notes: { zh: '英文行程单，含酒店机票预订，需附英文翻译件', en: 'English itinerary with hotel/flight bookings' } },
  { id: 'insurance', name: { zh: '旅行保险', en: 'Travel insurance' }, category: 'travel', required: true, format: 'copy', translationRequired: true, notes: { zh: '保额不低于 3 万新西兰元，需附英文翻译件', en: 'Coverage NZD 30,000+, English translation required' } },
]

/** 申根 Type C 短期签证材料（按必交/选交分组） */
export const SCHENGEN_REQUIREMENTS: Requirement[] = [
  // ── 必交材料 ──
  { id: 'passport', name: { zh: '有效护照', en: 'Valid passport' }, category: 'basic', required: true, format: 'original', translationRequired: false, notes: { zh: '有效期超过回国日期 3 个月以上，且最近 10 年内签发', en: 'Valid 3+ months beyond return, issued within 10 years' } },
  { id: 'photo', name: { zh: '证件照 2 张', en: '2 passport photos' }, category: 'basic', required: true, format: 'original', translationRequired: false, notes: { zh: '白底 35×45mm，近 6 个月内拍摄', en: 'White background 35x45mm, taken within 6 months' } },
  { id: 'application', name: { zh: '申根签证申请表', en: 'Schengen visa application form' }, category: 'basic', required: true, format: 'original', translationRequired: false, notes: { zh: '在线填写后打印签名', en: 'Complete online, print and sign' } },
  { id: 'insurance', name: { zh: '旅行医疗保险', en: 'Travel medical insurance' }, category: 'basic', required: true, format: 'copy', translationRequired: false, notes: { zh: '保额不低于 3 万欧元，覆盖整个申根区停留期', en: 'Coverage EUR 30,000+, valid across Schengen area' } },
  { id: 'itinerary', name: { zh: '行程单', en: 'Itinerary' }, category: 'travel', required: true, format: 'copy', translationRequired: false, notes: { zh: '英文行程单，含每日住宿与交通安排', en: 'English itinerary with daily accommodation & transport' } },
  { id: 'flight', name: { zh: '往返机票预订单', en: 'Round-trip flight booking' }, category: 'travel', required: true, format: 'copy', translationRequired: false, notes: { zh: '英文预订单（非必须出票）', en: 'English booking (need not be ticketed)' } },
  { id: 'accommodation', name: { zh: '酒店预订单', en: 'Hotel booking' }, category: 'travel', required: true, format: 'copy', translationRequired: false, notes: { zh: '覆盖全部停留天数的英文预订单', en: 'English booking covering full stay' } },
  { id: 'employment', name: { zh: '在职证明', en: 'Employment certificate' }, category: 'identity', required: true, format: 'original', translationRequired: true, notes: { zh: '英文或中英双语，公司抬头纸盖章', en: 'English/bilingual, on company letterhead with stamp' } },
  { id: 'bank', name: { zh: '银行流水', en: 'Bank statement' }, category: 'financial', required: true, format: 'copy', translationRequired: true, notes: { zh: '近 3 个月流水，余额需覆盖行程费用', en: 'Last 3 months, balance covers trip cost' } },
  // ── 选交材料 ──
  { id: 'business-license', name: { zh: '营业执照副本', en: 'Business license copy' }, category: 'identity', required: false, format: 'copy', translationRequired: true, notes: { zh: '加盖公章，需英文翻译', en: 'With company seal, English translation' } },
  { id: 'assets', name: { zh: '资产证明', en: 'Asset proof' }, category: 'financial', required: false, format: 'copy', translationRequired: false, notes: { zh: '房产证、车辆登记证、存款证明等', en: 'Property, vehicle, deposit certificates' } },
  { id: 'relationship', name: { zh: '亲属关系证明', en: 'Relationship certificate' }, category: 'extra', required: false, format: 'copy', translationRequired: true, notes: { zh: '如由他人出资，需提供关系证明及翻译件', en: 'If sponsored, provide relationship proof & translation' } },
]
