// data/encyclopedia-faq.ts
// 签证百科 FAQ 扩展数据：按国家+签证类型补充/覆盖通用 FAQ
// 合并策略：国家专属 FAQ 排在通用 FAQ 前面，id 相同则覆盖，否则追加

import type { FAQ, Localized } from '../types'

export interface CountryFaqExtra {
  faq?: FAQ[]              // 补充/覆盖的 FAQ 条目
  rejectionReasons?: Localized[]  // 替换拒签原因（仅常规送签）
}

// 键格式：`${countryId}_${visaTypeId}`
const countryFaqExtras: Record<string, CountryFaqExtra> = {
  // 日本旅游签证：必须通过指定代办机构，不接受个人递签
  'japan_tourist': {
    faq: [
      {
        question: { zh: '日本旅游签证可以个人直接递签吗？', en: 'Can I apply for Japanese tourist visa directly?' },
        answer: { zh: '不可以。日本驻华使馆要求申请人必须通过指定旅行社或代办机构提交申请，不接受个人直接向使馆递签。', en: 'No. The Japanese Embassy requires applicants to submit through designated travel agencies/agents; direct personal applications are not accepted.' },
      },
      {
        question: { zh: '日本单次旅游签证需要多少资产证明？', en: 'How much bank balance is required for a single-entry visa?' },
        answer: { zh: '一般要求近三个月银行流水余额在 10 万元以上（或年收入 10 万元以上税单）。学生可提供父母出资证明及其流水。', en: 'Generally 100,000+ RMB balance in 3-month bank statement (or 100,000+ RMB annual income tax). Students may use sponsor (parents) documents.' },
      },
    ],
  },

  // 韩国
  'korea_tourist': {
    faq: [
      {
        question: { zh: '韩国签证需要预约吗？', en: 'Do I need an appointment for Korean visa?' },
        answer: { zh: '一般不需要，可直接前往签证中心递交材料。具体请以韩国驻华使领馆最新公告为准。', en: 'Generally no, you can submit documents directly at the visa center. Check official announcements for updates.' },
      },
      {
        question: { zh: '济州岛免签需要准备什么材料？', en: 'What documents do I need for Jeju visa-free entry?' },
        answer: { zh: '济州岛对中国公民免签入境停留 30 天，只需持有效期 6 个月以上的护照、往返机票行程单、酒店确认单即可。', en: 'Chinese citizens get 30-day visa-free entry to Jeju. Just bring a passport valid for 6+ months, round-trip ticket and hotel confirmation.' },
      },
    ],
  },

  // 美国 B1/B2
  'usa_tourist': {
    faq: [
      {
        question: { zh: '申请美国旅游签证必须填写 DS-160 表吗？', en: 'Is DS-160 mandatory for US tourist visa?' },
        answer: { zh: '是的，DS-160 在线申请表是必须的，所有申请人必须在线填写、打印确认页，并携带去面签。', en: 'Yes, the DS-160 online application form is mandatory. All applicants must complete it online, print the confirmation page, and bring it to the interview.' },
      },
      {
        question: { zh: '美国旅游签证必须面签吗？', en: 'Is an in-person interview required?' },
        answer: { zh: '绝大多数情况需要，极少数符合免面签条件（符合续签、年龄或出行记录要求）的申请人可免面谈。', en: 'Required in most cases. Only a small number of renewal applicants meeting specific criteria qualify for interview waiver.' },
      },
      {
        question: { zh: '面签需要提前多久预约？', en: 'How far in advance should I book the interview?' },
        answer: { zh: '热门领馆预约等待时间从几天到几个月不等，建议提前至少 1-3 个月预约。', en: 'Wait times range from days to months at popular consulates. Book at least 1-3 months in advance.' },
      },
    ],
  },

  // 申根签证
  'schengen_tourist': {
    faq: [
      {
        question: { zh: '申根签证的旅行保险要求是什么？', en: 'What are the travel insurance requirements for Schengen?' },
        answer: { zh: '必须购买覆盖整个行程、保额不少于 3 万欧元（约 23 万人民币）、包含医疗转运和紧急救援的旅行保险。', en: 'You must have travel insurance covering your entire stay with minimum coverage of €30,000 (~¥230,000), including medical evacuation and emergency assistance.' },
      },
      {
        question: { zh: '申根签证需要采集生物信息吗？', en: 'Do I need to provide biometrics for Schengen?' },
        answer: { zh: '是的，几乎所有申根国家要求申请人亲自前往签证中心采集指纹（十指）。五年多次签证采集一次后，后续申请可复用。', en: 'Yes, almost all Schengen countries require an in-person visit to collect 10-fingerprints. After one collection for a 5-year multiple-entry visa, future applications can reuse the data.' },
      },
      {
        question: { zh: '去多个申根国家向哪个国家递签？', en: 'Which country should I apply to when visiting multiple Schengen countries?' },
        answer: { zh: '向主要停留国（停留天数最多的国家）申请。若天数相同，向第一个入境国申请。', en: 'Apply to the country of your main stay (most nights). If stays are equal, apply to the country of first entry.' },
      },
    ],
  },

  // 英国
  'uk_tourist': {
    faq: [
      {
        question: { zh: '英国访问签证需要面签吗？', en: 'Is an interview required for UK visitor visa?' },
        answer: { zh: '一般不需要面签，但签证官保留要求申请人前往使领馆面试的权利。申请全程在线完成，需要采集生物信息。', en: 'Generally no, but the consular officer reserves the right to call you in. Applications are done online and require biometric enrollment.' },
      },
      {
        question: { zh: '英国旅游签证有效期多久？', en: 'What is the validity of a UK tourist visa?' },
        answer: { zh: '标准访问签证一般为 2 年多次入境，停留每次不超过 6 个月。', en: 'Standard visitor visas are typically 2-year multiple-entry, allowing stays up to 6 months per visit.' },
      },
    ],
  },

  // 澳大利亚
  'australia_tourist': {
    faq: [
      {
        question: { zh: '澳大利亚旅游签证需要体检吗？', en: 'Is a medical examination required for Australian tourist visa?' },
        answer: { zh: '计划停留不超过 3 个月、年龄小于 75 岁一般不需要。年满 75 岁通常需要体检并提供保险证明。', en: 'Generally not required for stays under 3 months and age under 75. Applicants 75+ usually need a medical exam and insurance.' },
      },
      {
        question: { zh: '澳大利亚电子签需要贴照片吗？', en: 'Do I need to get a sticker on my passport for Australian e-visa?' },
        answer: { zh: '不需要，电子签全程电子化，入境时只需要出示护照，无需贴签。', en: 'No. Australia uses fully electronic visas. Just present your passport on arrival; no sticker needed.' },
      },
    ],
  },

  // 加拿大
  'canada_tourist': {
    faq: [
      {
        question: { zh: '加拿大旅游签证需要生物信息采集吗？', en: 'Is biometric collection required for Canada?' },
        answer: { zh: '是的，需要前往签证申请中心采集指纹和照片。', en: 'Yes, you need to go to a visa application center to provide fingerprints and photo.' },
      },
      {
        question: { zh: '加拿大签证有效期多久？', en: 'How long is a Canadian tourist visa valid?' },
        answer: { zh: '中国公民一般签发 10 年多次入境签证，有效期与护照有效期一致（护照到期日截止）。每次停留不超过 6 个月。', en: 'Chinese citizens typically get a 10-year multiple-entry visa valid until your passport expires. Stays are limited to 6 months per entry.' },
      },
    ],
  },

  // 新加坡
  'singapore_tourist': {
    faq: [
      {
        question: { zh: '新加坡对中国公民免签吗？', en: 'Is Singapore visa-free for Chinese citizens?' },
        answer: { zh: '从 2024 年 2 月 9 日起，新加坡对持普通护照的中国公民免签入境，停留不超过 30 天。', en: 'Starting February 9, 2024, Singapore is visa-free for Chinese citizens with ordinary passports, for stays up to 30 days.' },
      },
    ],
  },

  // 香港（需通行证）
  'hong-kong_permit': {
    faq: [
      {
        question: { zh: '哪些人可以办理港澳个人游签注？', en: 'Who can get the individual visit G endorsement?' },
        answer: { zh: '户籍属于开放港澳个人游的城市即可办理G签，自由行过关。其他城市只能办理L签（团队签）。', en: 'Residents of cities that have opened the Individual Visit Scheme can get G endorsement; others can only get L endorsement (group tour).' },
      },
      {
        question: { zh: '港澳通行证一次签注可以停留几天？', en: 'How many days can I stay in Hong Kong with one endorsement?' },
        answer: { zh: '香港每次签注停留不超过 7 天，从入境第二天算起。', en: 'You can stay up to 7 days, counting from the day after entry.' },
      },
    ],
  },
}

/** 获取国家签证的扩展 FAQ 数据 */
export function getCountryFaqExtra(countryId: string, visaTypeId: string): CountryFaqExtra | undefined {
  return countryFaqExtras[`${countryId}_${visaTypeId}`]
}
