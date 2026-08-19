// data/faq-templates.ts
// 按签证类型分层生成通用 FAQ 和拒绝入境/拒签原因
// 动态数据从 meta/visaType 结构中取值，避免硬编码与自相矛盾

import type { FAQ, Localized } from '../types'

/** 签证类型枚举 */
type VisaTypeLabel = '互免签证' | '单方面免签' | '落地签' | '电子签' | '需通行证'

// ===== 互免签证 / 单方面免签通用 FAQ =====
export function buildMutualVisaFreeFaq(countryNameZh: string, countryNameEn: string, duration: string): FAQ[] {
  return [
    {
      question: { zh: `去${countryNameZh}需要提前办理签证吗？`, en: `Do I need a visa for ${countryNameEn}?` },
      answer: {
        zh: `不需要。中国公民持普通护照可免签入境${countryNameZh}，无需提前申请。`,
        en: `No. Chinese citizens with ordinary passports can enter ${countryNameEn} visa-free, no advance application required.`,
      },
    },
    {
      question: { zh: '免签可以停留多少天？', en: `How many days can I stay visa-free?` },
      answer: { zh: `一般可停留${duration}，具体以入境边检盖章为准，请确保护照有效期在 6 个月以上。`, en: `Typically ${duration}. Check the entry stamp upon arrival. Make sure your passport is valid for at least 6 months.` },
    },
    {
      question: { zh: '入境必须携带往返机票和酒店订单吗？', en: `Are round-trip tickets and hotel bookings mandatory?` },
      answer: {
        zh: '多数国家要求证明你有明确的旅行目的和如期离开的打算，建议提前准备好返程机票行程单和酒店预订单备查。',
        en: 'Most countries require proof of travel purpose and intention to leave. We recommend preparing return ticket itinerary and hotel reservations just in case.',
      },
    },
    {
      question: { zh: '入境时通常会被问什么问题？', en: `What questions will I be asked at immigration?` },
      answer: {
        zh: '一般会问旅行目的、停留天数、住宿地址、携带现金金额。如实回答即可，建议准备好酒店地址和返程机票。',
        en: 'Common questions: purpose of visit, length of stay, accommodation address, amount of cash. Answer truthfully; have hotel address and return ticket ready.',
      },
    },
    {
      question: { zh: '免签入境可以延期停留吗？', en: `Can I extend my visa-free stay?` },
      answer: {
        zh: '多数免签国家一般不允许延期，或延期手续比较繁琐。建议合理规划行程，在允许停留天数内离境。',
        en: 'Extension is generally not permitted or requires complicated procedures. Plan your trip to depart within the allowed duration.',
      },
    },
    {
      question: { zh: '免签可以用来工作或长期学习吗？', en: `Can I work or study visa-free?` },
      answer: {
        zh: '免签仅适用于旅游观光、探亲访友、商务短期停留，不能用于就业或长期学习。工作/学习需要申请对应类型签证。',
        en: 'Visa-free is only for tourism, family visits, and short business stays. It cannot be used for employment or long-term study. You need to apply for the correct visa type.',
      },
    },
    {
      question: { zh: '超期滞留会有什么后果？', en: `What happens if I overstay?` },
      answer: {
        zh: '超期属于非法滞留，会被罚款、限期离境，并且可能影响未来申请其他国家签证，请务必在有效期内离境。',
        en: 'Overstaying is illegal and may result in fines, deportation, and affect future visa applications for other countries. Always depart before the allowed expiration.',
      },
    },
  ]
}

// ===== 落地签通用 FAQ =====
export function buildOnArrivalFaq(
  fee: number,
  currency: string,
): FAQ[] {
  const feeText = fee > 0 ? `${fee} ${currency}` : '免费'
  return [
    {
      question: { zh: '落地签在哪里办理？', en: `Where do I get the visa on arrival?` },
      answer: {
        zh: '抵达该国机场/港口/陆路口岸后，在专门的落地签柜台现场办理，无需提前向使馆申请。',
        en: 'Apply at the dedicated visa-on-arrival counter after arriving at the airport/port/land border; no advance embassy application needed.',
      },
    },
    {
      question: { zh: '办理落地签需要准备哪些材料？', en: `What documents do I need for visa on arrival?` },
      answer: {
        zh: '一般需要有效期 6 个月以上护照、往返机票行程单、酒店预订单、证件照片（尺寸按要求准备）、足够的现金缴纳费用。',
        en: 'Generally: passport valid 6+ months, return ticket itinerary, hotel booking, photos (check required size), and enough cash for fees.',
      },
    },
    {
      question: { zh: `落地签费用是多少，可以刷卡吗？`, en: `How much does it cost? Can I pay by card?` },
      answer: {
        zh: fee > 0
          ? `费用约为${feeText}，多数落地签要求携带现金支付，建议提前换好对应币种零钱。`
          : '该国家对中国公民落地签免费。',
        en: fee > 0
          ? `The fee is about ${feeText}. Most visa-on-arrival counters require cash; prepare local currency change in advance.`
          : 'Visa on arrival is free for Chinese citizens.',
      },
    },
    {
      question: { zh: '落地签一般排队需要等多久？', en: `How long is the waiting time?` },
      answer: {
        zh: '高峰期可能需要排队 30 分钟到 2 小时不等，建议提前抵达机场预留足够时间。',
        en: 'Peak hours can mean 30 minutes to 2 hours of queuing. Arrive early and allow extra time.',
      },
    },
    {
      question: { zh: '我已经办好电子签还需要办落地签吗？', en: `If I already have an e-visa, do I still need visa on arrival?` },
      answer: {
        zh: '不需要。持有有效电子签可直接入境，无需再办理落地签。',
        en: 'No. If you already have a valid e-visa, you can enter directly; no need for visa on arrival.',
      },
    },
    {
      question: { zh: '哪些人不适用落地签政策？', en: `Who is not eligible for visa on arrival?` },
      answer: {
        zh: '具体要求请以该国移民局最新公告为准，敏感职业或曾有拒签记录可能需要提前申请签证。',
        en: 'Check the latest immigration announcements. Certain professions or previous rejection history may require advance visa application.',
      },
    },
    {
      question: { zh: '落地签会被拒绝入境吗？', en: `Can I be refused entry even with visa on arrival?` },
      answer: {
        zh: '是的，边检机关最终有权决定是否允许入境。请确保材料齐全、旅行目的明确、没有不良记录。',
        en: 'Yes. Immigration authorities have final discretion over entry. Ensure all documents are ready, your purpose is clear, and you have no adverse record.',
      },
    },
  ]
}

// ===== 电子签通用 FAQ =====
export function buildEvisaFaq(
  minDays: number,
  maxDays: number,
): FAQ[] {
  return [
    {
      question: { zh: '电子签一般多久出结果？', en: `How long does e-visa processing take?` },
      answer: {
        zh: minDays === maxDays
          ? `一般${minDays}个工作日出签，请尽早申请。`
          : `一般${minDays}-${maxDays}个工作日出签，具体取决于申请量和材料审核，请尽早申请。`,
        en: minDays === maxDays
          ? `Processing typically takes ${minDays} working days. Apply early.`
          : `Processing typically takes ${minDays}-${maxDays} working days, depending on volume and review. Apply early.`,
      },
    },
    {
      question: { zh: '申请表填错了可以修改吗？', en: `Can I change information after submitting the application?` },
      answer: {
        zh: '提交后多数电子签系统不支持直接修改，建议填写时仔细核对信息。如有重大错误可能需要重新申请并再次缴费。',
        en: 'Most e-visa systems do not support editing after submission. Double-check before submitting. Major errors may require re-applying and paying again.',
      },
    },
    {
      question: { zh: '入境时必须打印电子签吗？', en: `Do I need to print the e-visa for arrival?` },
      answer: {
        zh: '建议打印一份随身携带，虽然很多国家支持电子查验，但纸质备份可以避免系统故障无法查验的风险。',
        en: 'We recommend printing a copy. While many countries support electronic verification, a printed copy avoids issues from system failures.',
      },
    },
    {
      question: { zh: '电子签有效期从哪天开始计算？', en: `When does the e-visa validity start?` },
      answer: {
        zh: '多数电子签从签发日开始计算有效期，请留意签证页上标注的生效日期和截止日期。',
        en: 'Most e-visas are valid from the date of issuance. Pay close attention to the start and expiry dates printed on your visa.',
      },
    },
    {
      question: { zh: '电子签被拒后可以重新申请吗？', en: `Can I reapply after an e-visa rejection?` },
      answer: {
        zh: '一般可以重新申请，但请先分析拒签原因，补充材料后再提交。短期内重复申请相同材料大概率会再次被拒。',
        en: 'You can generally reapply, but first address the reason for rejection and add supporting documents. Re-submitting the same materials quickly will likely result in another rejection.',
      },
    },
    {
      question: { zh: '电子签需要面签或采集生物信息吗？', en: `Is an interview or biometrics required for e-visa?` },
      answer: {
        zh: '纯电子签一般全程在线完成，不需要前往使领馆面签或录指纹。请以具体要求为准。',
        en: 'Pure e-visa is fully online and does not require an in-person interview or fingerprinting at the embassy. Follow the specific requirements.',
      },
    },
  ]
}

// ===== 需通行证（港澳台）通用 FAQ =====
export function buildPermitFaq(regionNameZh: string, regionNameEn: string): FAQ[] {
  return [
    {
      question: { zh: '往来港澳通行证在哪里办理？', en: `Where do I apply for the Exit-Entry Permit?` },
      answer: {
        zh: '向你户籍所在地的出入境管理部门申请，目前多数城市支持异地通办，具体可咨询当地出入境。',
        en: 'Apply at the Exit-Entry Administration office in your registered residence province. Most cities now allow application in your current city of residence.',
      },
    },
    {
      question: { zh: '签注有哪些类型，怎么选？', en: `What types of endorsements are there, how do I choose?` },
      answer: {
        zh: '常见有个人旅游签（G签）和团队旅游签（L签）。户籍开放个人游的城市可以办G签直接过关，否则需要跟团或通过旅行社办理L签过关。',
        en: 'Common types: Individual Visit (G) and Group Tour (L). If your hukou is in an open city, you can get G and enter independently. Otherwise you need to travel with a group.',
      },
    },
    {
      question: { zh: '通行证和签注有效期是多久？', en: `How long is the permit and endorsement valid?` },
      answer: {
        zh: '通行证有效期为 10 年（未满 16 周岁为 5 年）。签注有效期根据种类不同，一次签注一般 3 个月或 6 个月有效。',
        en: 'The permit is valid for 10 years (5 years for under 16). Endorsement validity varies by type; single-entry is typically 3 or 6 months.',
      },
    },
    {
      question: { zh: '每次可以逗留多少天？', en: `How many days can I stay per visit?` },
      answer: {
        zh: `${regionNameZh}一次签注一般允许逗留不超过 7 天，从入境次日开始计算。`,
        en: `You can stay up to 7 days in ${regionNameEn} per endorsement, counting from the day after entry.`,
      },
    },
    {
      question: { zh: '签注用完了怎么再次办理？', en: `How do I renew my endorsement when it's used?` },
      answer: {
        zh: '可以再次向出入境管理部门申请续签，现在很多城市支持自助机当场续签，非常方便。',
        en: 'You can apply for a new endorsement at the Exit-Entry Administration. Many cities have self-service machines for instant renewal, which is very convenient.',
      },
    },
    {
      question: { zh: '一个签注可以多次出入境吗？', en: `Can I enter multiple times on one endorsement?` },
        answer: { zh: '一次签注只能出入境一次，多次签注允许在有效期内多次出入境。', en: 'A single-entry endorsement allows one entry-exit; multiple-entry allows multiple entries within validity.' },
    },
  ]
}

// ===== 常规送签（需提前向使馆申请）通用 FAQ =====
export function buildConsularFaq(
  countryNameZh: string,
  countryNameEn: string,
  minDays: number,
  maxDays: number,
  canApplyOnline: boolean,
  acceptPersonal: boolean,
  needInterview: boolean,
): FAQ[] {
  return [
    {
      question: { zh: `${countryNameZh}签证办理周期大概多久？`, en: `How long does ${countryNameEn} visa processing take?` },
      answer: {
        zh: minDays === maxDays
          ? `一般需要${minDays}个工作日，建议提前至少 1 个月申请。`
          : `一般需要${minDays}-${maxDays}个工作日，旅游旺季可能更长，请尽早安排。`,
        en: minDays === maxDays
          ? `Processing typically takes ${minDays} working days. Apply at least 1 month in advance.`
          : `Processing typically takes ${minDays}-${maxDays} working days. It can be longer during peak season; apply early.`,
      },
    },
    {
      question: { zh: '可以加急办理吗？', en: `Is expedited processing available?` },
      answer: {
        zh: needInterview
          ? '部分使领馆提供加急服务，但需要额外付费，且不一定总能获批，请尽早计划行程。'
          : '多数情况下按正常流程等待，加急需咨询具体使领馆。',
        en: needInterview
          ? 'Some embassies offer expedited service for an extra fee, but approval is not guaranteed. Plan ahead.'
          : 'Generally follow normal processing. Check with the specific embassy for expedited options.',
      },
    },
    {
      question: { zh: '是否必须本人前往递签？', en: `Do I need to submit the application in person?` },
      answer: {
        zh: acceptPersonal
          ? '可以个人递签，也可以通过代办机构提交。'
          : '该国家不接受个人递签，必须通过指定旅行社或代办机构提交申请。',
        en: acceptPersonal
          ? 'You can submit in person or via an agency.'
          : 'This country does not accept direct personal applications; you must apply through a designated travel agency.',
      },
    },
    {
      question: { zh: '拒签后多久能重新申请？', en: `How soon can I reapply after rejection?` },
      answer: {
        zh: '没有强制等待期，但建议先弄清楚拒签原因，补充材料后再重新申请。短期内无材料变化重复申请大概率再次拒签。',
        en: 'There is no mandatory waiting period. First understand why you were rejected, then fix the issues before re-applying. Re-applying with the same materials soon after will likely be rejected again.',
      },
    },
    {
      question: { zh: '之前有拒签记录会影响现在申请吗？', en: `Does a previous rejection affect my current application?` },
      answer: {
        zh: '如实填写即可，只要你现在的申请材料符合要求，单次拒签记录一般不会直接导致再次拒签。隐瞒拒签记录后果更严重。',
        en: 'Disclose it truthfully. As long as your current application meets requirements, a single past rejection generally does not automatically cause rejection. Hiding a rejection has much worse consequences.',
      },
    },
    {
      question: { zh: '资金证明需要多少余额？需要冻结吗？', en: `How much bank balance is required? Does it need to be frozen?` },
      answer: {
        zh: '一般要求足够覆盖你本次旅行的所有费用，具体标准以使领馆要求为准。多数情况不需要冻结，提供近 3-6 个月银行流水即可。',
        en: 'You generally need enough balance to cover all trip costs. Follow the embassy requirements. A 3-6 month bank statement is usually sufficient; freezing is often not required.',
      },
    },
    {
      question: { zh: '在职证明有固定格式要求吗？', en: `Is there a fixed format for the employment certificate?` },
      answer: {
        zh: '一般需要包含你的姓名、职位、入职时间、准假证明、薪资、公司联系方式，并加盖公司公章。具体可参考使领馆模板，如无特殊模板按此标准出具即可。',
        en: 'It usually needs to include your name, position, hire date, leave approval, salary, company contact, and an official company stamp. Follow the embassy template if provided; otherwise this standard format is acceptable.',
      },
    },
    canApplyOnline
      ? {
          question: { zh: '可以在线申请吗？', en: `Can I apply online?` },
          answer: { zh: '是的，支持在线填写申请表和提交材料。', en: 'Yes, online application and document submission is supported.' },
        }
      : {
          question: { zh: '必须预约吗？', en: `Is an appointment mandatory?` },
          answer: { zh: '多数需要提前在使领馆网站预约时间，按预约时间前往递交材料。', en: 'Most require booking an appointment online through the embassy website before visiting.' },
        },
    needInterview
      ? {
          question: { zh: '面签需要注意什么？', en: `Any tips for the visa interview?` },
          answer: { zh: '如实回答问题，材料带齐，自信清晰表述旅行目的和行程安排即可。', en: 'Answer questions truthfully, bring all documents, and clearly state your travel purpose and itinerary.' },
        }
      : {
          question: { zh: '申请必须要面试吗？', en: `Is an interview required?` },
          answer: { zh: '一般不需要面试，材料合格即可获批。签证官保留要求面试的权利。', en: 'Generally no interview is needed if your documents are in order. The consular officer retains the right to call you in.' },
        },
  ].filter(Boolean) as FAQ[]
}

// ===== 按签证类型获取拒绝入境/拒签原因 =====

export function buildRejectionReasons(visaType: VisaTypeLabel): Localized[] {
  switch (visaType) {
    case '互免签证':
    case '单方面免签':
      // 免签 -> 拒绝入境原因
      return [
        { zh: '护照有效期不足 6 个月', en: 'Passport valid for less than 6 months' },
        { zh: '无法提供往返机票或酒店预订证明', en: 'Cannot provide return ticket or hotel confirmation' },
        { zh: '无法回答边检关于行程的问题', en: 'Cannot answer immigration questions about your itinerary' },
        { zh: '之前有超期滞留或违规记录', en: 'Previous overstay or violation record' },
        { zh: '携带违禁物品或未申报现金', en: 'Carrying prohibited items or undeclared cash' },
      ]

    case '落地签':
      // 落地签 -> 拒绝入境原因
      return [
        { zh: '材料不齐全或不符合要求', en: 'Incomplete or incorrect documents' },
        { zh: '无法缴纳落地签费用（未带现金）', en: 'Cannot pay the visa fee (no cash)' },
        { zh: '护照有效期不足 6 个月', en: 'Passport valid for less than 6 months' },
        { zh: '之前有超期滞留或不良记录', en: 'Previous overstay or adverse record' },
        { zh: '旅行目的不明确', en: 'Unclear purpose of travel' },
      ]

    case '电子签':
    case '需通行证':
      // 电子签 -> 拒签原因
      return [
        { zh: '材料不齐全', en: 'Incomplete documents' },
        { zh: '申请表信息与真实情况不符', en: 'Application information does not match facts' },
        { zh: '资金证明不满足要求', en: 'Financial proof does not meet requirements' },
        { zh: '旅行目的不明确', en: 'Unclear purpose of travel' },
        { zh: '之前有拒签或超期滞留记录', en: 'Previous rejection or overstay record' },
      ]

    default:
      // 常规送签 -> 拒签原因
      return [
        { zh: '材料不齐全', en: 'Incomplete documents' },
        { zh: '资金能力证明不足', en: 'Insufficient proof of financial means' },
        { zh: '旅行目的或行程安排不清晰', en: 'Unclear travel purpose or itinerary' },
        { zh: '无法证明你会按时离开', en: 'Cannot prove you will depart on time' },
        { zh: '在职/在读信息不真实', en: 'Incorrect employment/student information' },
        { zh: '之前有拒签或违规记录', en: 'Previous rejection or violation record' },
      ]
  }
}

/** 根据签证类型获取拒签原因标题翻译 key */
export function getRejectionTitleKey(visaType: VisaTypeLabel): string {
  switch (visaType) {
    case '互免签证':
    case '单方面免签':
    case '落地签':
      return 'encyclopedia.entryRefusalReasons' // 拒绝入境原因
    default:
      return 'assistant.rejectionReasons' // 常见拒签原因
  }
}
