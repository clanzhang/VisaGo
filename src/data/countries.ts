// data/countries.ts
// 7 个国家的签证静态数据

import type { Country, Localized } from '../types'

export const PROVINCES = [
  '北京', '天津', '河北', '山西', '内蒙古', '辽宁', '吉林', '黑龙江',
  '上海', '江苏', '浙江', '安徽', '福建', '江西', '山东',
  '河南', '湖北', '湖南', '广东', '广西', '海南',
  '重庆', '四川', '贵州', '云南', '西藏',
  '陕西', '甘肃', '青海', '宁夏', '新疆', '台湾', '香港', '澳门',
]

export const OCCUPATIONS = [
  { value: 'employed', icon: 'ri:briefcase-line' },
  { value: 'student', icon: 'ri:graduation-cap-line' },
  { value: 'retired', icon: 'ri:user-smile-line' },
  { value: 'freelance', icon: 'ri:group-line' },
] as const

export const countries: Country[] = [
  // ==================== 日本 ====================
  {
    id: 'japan',
    name: { zh: '日本', en: 'Japan' },
    flag: '🇯🇵',
    difficulty: 'medium',
    region: '亚洲',
    overview: { zh: '樱花之国，签证材料相对严谨，需通过指定旅行社代办。', en: 'Land of cherry blossoms; requires meticulous documents, applied via designated agencies.' },
    visaFree: { zh: '中国公民赴日旅游需办理签证，暂无非免签政策。', en: 'Chinese citizens need a visa to visit Japan; no visa-free policy for tourism.' },
    announcements: [
      { date: '2025-01-15', title: { zh: '日本电子签证逐步推广', en: 'Japan e-visa rollout' }, content: { zh: '2025年起日本电子签证逐步推广，单次旅游签可在线申请。', en: 'From 2025, e-visas are being rolled out; single-entry tourist visas can be applied online.' } },
    ],
    visaTypes: [
      {
        id: 'jp-tourist',
        name: { zh: '旅游签证', en: 'Tourist Visa' },
        category: 'tourist',
        duration: '15 天',
        validity: '3 个月',
        entries: 'single',
        fee: { amount: 200, currency: 'CNY' },
        serviceFee: { amount: 300, currency: 'CNY' },
        processingDays: { min: 7, max: 15 },
        needInterview: false,
        canApplyOnline: false,
        acceptPersonal: false,
        targetAudience: { zh: '赴日旅游观光、探亲访友的普通申请人', en: 'Travelers visiting Japan for tourism/family' },
        tips: { zh: '材料必须真实，行程合理，出签后尽快出行。', en: 'Documents must be genuine with a reasonable itinerary.' },
        rejectionReasons: [
          { zh: '收入流水不足或不稳定', en: 'Insufficient or unstable income' },
          { zh: '行程安排不合理', en: 'Unreasonable itinerary' },
          { zh: '曾有逾期滞留记录', en: 'Previous overstay record' },
        ],
        consularDistricts: [
          { name: { zh: '日本驻华大使馆（北京领区）', en: 'Beijing Consular District' }, provinces: ['北京', '天津', '河北', '山西', '内蒙古', '山东', '河南', '湖北', '湖南', '陕西', '甘肃', '宁夏', '青海', '新疆', '西藏'] },
          { name: { zh: '日本驻上海总领事馆（上海领区）', en: 'Shanghai Consular District' }, provinces: ['上海', '江苏', '浙江', '安徽', '江西'] },
          { name: { zh: '日本驻广州总领事馆（广州领区）', en: 'Guangzhou Consular District' }, provinces: ['广东', '福建', '广西', '海南'] },
          { name: { zh: '日本驻沈阳总领事馆（沈阳领区）', en: 'Shenyang Consular District' }, provinces: ['辽宁', '吉林', '黑龙江'] },
          { name: { zh: '日本驻重庆总领事馆（重庆领区）', en: 'Chongqing Consular District' }, provinces: ['重庆', '四川', '贵州', '云南'] },
        ],
        requirements: [
          { id: 'passport', name: { zh: '有效护照（有效期 6 个月以上）', en: 'Valid passport (6+ months)' }, category: 'basic', required: true, format: 'original', translationRequired: false, notes: { zh: '需留至少 2 页空白签证页', en: 'At least 2 blank pages' } },
          { id: 'photo', name: { zh: '白底彩色照片 45mm×45mm（2 张）', en: '2 photos 45×45mm' }, category: 'basic', required: true, format: 'original', translationRequired: false },
          { id: 'application', name: { zh: '签证申请表', en: 'Application form' }, category: 'basic', required: true, format: 'original', translationRequired: false },
          { id: 'employment', name: { zh: '在职证明（含准假信息）', en: 'Employment certificate' }, category: 'identity', required: true, format: 'original', translationRequired: true },
          { id: 'license', name: { zh: '营业执照副本复印件（加盖公章）', en: 'Business license copy' }, category: 'identity', required: true, format: 'copy', translationRequired: false },
          { id: 'bank', name: { zh: '银行流水（近 6 个月）', en: 'Bank statements (6 months)' }, category: 'financial', required: true, format: 'original', translationRequired: false, notes: { zh: '建议余额 5 万元以上', en: 'Balance over 50k CNY' } },
          { id: 'itinerary', name: { zh: '行程安排表', en: 'Itinerary' }, category: 'travel', required: true, format: 'both', translationRequired: true },
          { id: 'hotel', name: { zh: '酒店预订单', en: 'Hotel reservation' }, category: 'travel', required: true, format: 'copy', translationRequired: false },
          { id: 'flight', name: { zh: '机票预订单', en: 'Flight reservation' }, category: 'travel', required: true, format: 'copy', translationRequired: false },
        ],
        faq: [
          { question: { zh: '单次旅游签是否必须通过旅行社代办？', en: 'Must it go through an agency?' }, answer: { zh: '目前日本单次旅游签个人无法直接送签，需通过指定旅行社代办。', en: 'Yes, single-entry tourist visas must be applied via designated agencies.' } },
          { question: { zh: '出签后可以停留多久？', en: 'How long can I stay?' }, answer: { zh: '单次旅游签一般允许停留 15 天。', en: 'Single-entry usually allows 15 days.' } },
        ],
      },
      {
        id: 'jp-business',
        name: { zh: '商务签证', en: 'Business Visa' },
        category: 'business',
        duration: '15-30 天',
        validity: '3 个月',
        entries: 'single',
        fee: { amount: 300, currency: 'CNY' },
        serviceFee: { amount: 350, currency: 'CNY' },
        processingDays: { min: 5, max: 10 },
        needInterview: false,
        canApplyOnline: false,
        acceptPersonal: false,
        targetAudience: { zh: '赴日商务洽谈、参展、考察的企业人员', en: 'Business travelers to Japan' },
        tips: { zh: '需日方公司出具邀请函与身元保证书。', en: 'Invitation letter and guarantee from Japanese company required.' },
        rejectionReasons: [
          { zh: '日方邀请材料不齐全', en: 'Incomplete Japanese invitation documents' },
          { zh: '派遣目的不明确', en: 'Unclear business purpose' },
        ],
        consularDistricts: [
          { name: { zh: '日本驻华大使馆（北京领区）', en: 'Beijing Consular District' }, provinces: ['北京', '天津', '河北', '山西', '内蒙古', '山东', '河南', '湖北', '湖南', '陕西', '甘肃', '宁夏', '青海', '新疆', '西藏'] },
          { name: { zh: '日本驻上海总领事馆（上海领区）', en: 'Shanghai Consular District' }, provinces: ['上海', '江苏', '浙江', '安徽', '江西'] },
          { name: { zh: '日本驻广州总领事馆（广州领区）', en: 'Guangzhou Consular District' }, provinces: ['广东', '福建', '广西', '海南'] },
        ],
        requirements: [
          { id: 'passport', name: { zh: '有效护照', en: 'Valid passport' }, category: 'basic', required: true, format: 'original', translationRequired: false },
          { id: 'photo', name: { zh: '白底彩照 2 张', en: '2 photos' }, category: 'basic', required: true, format: 'original', translationRequired: false },
          { id: 'application', name: { zh: '签证申请表', en: 'Application form' }, category: 'basic', required: true, format: 'original', translationRequired: false },
          { id: 'invitation', name: { zh: '日方邀请函（身元保证书）', en: 'Invitation letter' }, category: 'identity', required: true, format: 'original', translationRequired: true },
          { id: 'company', name: { zh: '中方派遣书', en: 'Dispatch letter' }, category: 'identity', required: true, format: 'original', translationRequired: true },
          { id: 'registry', name: { zh: '日方公司登记簿誊本', en: 'Japanese company registry' }, category: 'identity', required: true, format: 'copy', translationRequired: false },
        ],
        faq: [
          { question: { zh: '商务签需要面试吗？', en: 'Is interview required?' }, answer: { zh: '一般无需面试，材料齐全即可。', en: 'Usually no interview required.' } },
        ],
      },
    ],
  },

  // ==================== 韩国 ====================
  {
    id: 'korea',
    name: { zh: '韩国', en: 'South Korea' },
    flag: '🇰🇷',
    difficulty: 'easy',
    region: '亚洲',
    overview: { zh: '邻国出行便捷，济州岛免签，多次签条件较宽松。', en: 'Convenient neighbor; Jeju visa-free, relaxed multi-entry conditions.' },
    visaFree: { zh: '济州岛对中国公民免签 30 天；韩国本土需办理签证。', en: 'Jeju is visa-free for 30 days; mainland Korea requires a visa.' },
    announcements: [
      { date: '2025-02-01', title: { zh: '多次往返资产要求放宽', en: 'Multi-entry asset relaxation' }, content: { zh: '韩国对符合条件的多次往返签证申请人放宽资产要求。', en: 'Asset requirements relaxed for eligible multi-entry applicants.' } },
    ],
    visaTypes: [
      {
        id: 'kr-tourist',
        name: { zh: '旅游签证（单次）', en: 'Tourist Visa (Single)' },
        category: 'tourist',
        duration: '30 天',
        validity: '3 个月',
        entries: 'single',
        fee: { amount: 400, currency: 'CNY' },
        serviceFee: { amount: 300, currency: 'CNY' },
        processingDays: { min: 5, max: 8 },
        needInterview: false,
        canApplyOnline: false,
        acceptPersonal: true,
        targetAudience: { zh: '赴韩旅游观光的普通申请人', en: 'Travelers visiting Korea' },
        tips: { zh: '有美签等发达国家签证可简化部分材料。', en: 'US visa holders can simplify documents.' },
        rejectionReasons: [
          { zh: '资产证明不足', en: 'Insufficient assets' },
          { zh: '出行目的不明确', en: 'Unclear purpose of travel' },
        ],
        consularDistricts: [
          { name: { zh: '韩国驻华大使馆（北京领区）', en: 'Beijing' }, provinces: ['北京', '天津', '河北', '山西', '内蒙古'] },
          { name: { zh: '韩国驻上海总领事馆（上海领区）', en: 'Shanghai' }, provinces: ['上海', '江苏', '浙江', '安徽'] },
          { name: { zh: '韩国驻广州总领事馆（广州领区）', en: 'Guangzhou' }, provinces: ['广东', '福建', '广西', '海南'] },
          { name: { zh: '韩国驻沈阳总领事馆（沈阳领区）', en: 'Shenyang' }, provinces: ['辽宁', '吉林', '黑龙江'] },
          { name: { zh: '韩国驻成都总领事馆（成都领区）', en: 'Chengdu' }, provinces: ['重庆', '四川', '贵州', '云南'] },
        ],
        requirements: [
          { id: 'passport', name: { zh: '有效护照', en: 'Valid passport' }, category: 'basic', required: true, format: 'original', translationRequired: false },
          { id: 'photo', name: { zh: '白底彩照 35mm×45mm（2 张）', en: '2 photos 35×45mm' }, category: 'basic', required: true, format: 'original', translationRequired: false },
          { id: 'application', name: { zh: '签证申请表（贴照片）', en: 'Application form' }, category: 'basic', required: true, format: 'original', translationRequired: false },
          { id: 'employment', name: { zh: '在职证明', en: 'Employment certificate' }, category: 'identity', required: true, format: 'original', translationRequired: true },
          { id: 'license', name: { zh: '营业执照副本复印件', en: 'Business license copy' }, category: 'identity', required: true, format: 'copy', translationRequired: false },
          { id: 'bank', name: { zh: '银行流水或存款证明', en: 'Bank statement' }, category: 'financial', required: true, format: 'original', translationRequired: false },
          { id: 'itinerary', name: { zh: '行程单', en: 'Itinerary' }, category: 'travel', required: true, format: 'both', translationRequired: false },
          { id: 'hotel', name: { zh: '酒店预订单', en: 'Hotel reservation' }, category: 'travel', required: true, format: 'copy', translationRequired: false },
        ],
        faq: [
          { question: { zh: '去济州岛需要签证吗？', en: 'Visa needed for Jeju?' }, answer: { zh: '济州岛对中国公民免签 30 天。', en: 'Jeju is visa-free for 30 days.' } },
          { question: { zh: '有美国签证可以简化材料吗？', en: 'Can US visa simplify?' }, answer: { zh: '持有有效美签等可简化部分材料。', en: 'Valid US visa can simplify documents.' } },
        ],
      },
      {
        id: 'kr-multiple',
        name: { zh: '旅游签证（多次）', en: 'Tourist Visa (Multiple)' },
        category: 'tourist',
        duration: '30 天/次',
        validity: '5 年',
        entries: 'multiple',
        fee: { amount: 800, currency: 'CNY' },
        serviceFee: { amount: 350, currency: 'CNY' },
        processingDays: { min: 6, max: 10 },
        needInterview: false,
        canApplyOnline: false,
        acceptPersonal: true,
        targetAudience: { zh: '有多次往返需求的高频访韩人员', en: 'Frequent travelers to Korea' },
        tips: { zh: '本科以上学历或高收入者可申请五年多次。', en: 'Bachelor+ or high income qualifies for 5-year multiple.' },
        rejectionReasons: [
          { zh: '不符合多次签资格', en: 'Not eligible for multi-entry' },
        ],
        consularDistricts: [
          { name: { zh: '韩国驻华大使馆（北京领区）', en: 'Beijing' }, provinces: ['北京', '天津', '河北', '山西', '内蒙古'] },
          { name: { zh: '韩国驻上海总领事馆（上海领区）', en: 'Shanghai' }, provinces: ['上海', '江苏', '浙江', '安徽'] },
          { name: { zh: '韩国驻广州总领事馆（广州领区）', en: 'Guangzhou' }, provinces: ['广东', '福建', '广西', '海南'] },
        ],
        requirements: [
          { id: 'passport', name: { zh: '有效护照', en: 'Valid passport' }, category: 'basic', required: true, format: 'original', translationRequired: false },
          { id: 'photo', name: { zh: '白底彩照 2 张', en: '2 photos' }, category: 'basic', required: true, format: 'original', translationRequired: false },
          { id: 'application', name: { zh: '签证申请表', en: 'Application form' }, category: 'basic', required: true, format: 'original', translationRequired: false },
          { id: 'proof', name: { zh: '多次签证资格证明材料', en: 'Eligibility proof' }, category: 'extra', required: true, format: 'copy', translationRequired: false, notes: { zh: '如 OECD 记录、高学历、高收入等', en: 'OECD records, education, income' } },
        ],
        faq: [
          { question: { zh: '什么条件可以申请多次签证？', en: 'Who qualifies for multiple?' }, answer: { zh: '本科以上学历、月收入 5000 元以上、OECD 出入境记录等。', en: 'Bachelor+, income 5k+, or OECD travel history.' } },
        ],
      },
    ],
  },

  // ==================== 泰国 ====================
  {
    id: 'thailand',
    name: { zh: '泰国', en: 'Thailand' },
    flag: '🇹🇭',
    difficulty: 'easy',
    region: '亚洲',
    overview: { zh: '微笑之国，对中国永久免签，出行最便捷之一。', en: 'Land of smiles; permanent visa-free for China.' },
    visaFree: { zh: '泰国对中国公民实行免签政策（2024 年起），单次可停留 30 天。', en: 'Visa-free for Chinese citizens (since 2024), up to 30 days.' },
    announcements: [
      { date: '2024-03-01', title: { zh: '泰国对中国永久免签', en: 'Permanent visa-free' }, content: { zh: '泰国对中国实施永久免签，每 180 天累计停留不超过 90 天。', en: 'Permanent visa-free; max 90 days per 180 days.' } },
    ],
    visaTypes: [
      {
        id: 'th-tourist',
        name: { zh: '旅游签证（电子签）', en: 'Tourist Visa (e-Visa)' },
        category: 'tourist',
        duration: '60 天',
        validity: '3 个月',
        entries: 'single',
        fee: { amount: 240, currency: 'CNY' },
        serviceFee: { amount: 200, currency: 'CNY' },
        processingDays: { min: 3, max: 5 },
        needInterview: false,
        canApplyOnline: true,
        acceptPersonal: true,
        targetAudience: { zh: '赴泰旅游观光的普通申请人', en: 'Travelers visiting Thailand' },
        tips: { zh: '电子签全程在线办理，出签快。', en: 'Fully online e-visa, fast approval.' },
        rejectionReasons: [
          { zh: '照片或信息与护照不符', en: 'Photo/info mismatch' },
        ],
        consularDistricts: [
          { name: { zh: '泰国驻华大使馆（北京领区）', en: 'Beijing' }, provinces: ['北京', '天津', '河北', '山西', '内蒙古', '辽宁', '吉林', '黑龙江'] },
          { name: { zh: '泰国驻上海总领事馆（上海领区）', en: 'Shanghai' }, provinces: ['上海', '江苏', '浙江', '安徽'] },
          { name: { zh: '泰国驻广州总领事馆（广州领区）', en: 'Guangzhou' }, provinces: ['广东', '福建', '广西', '海南'] },
          { name: { zh: '泰国驻成都总领事馆（成都领区）', en: 'Chengdu' }, provinces: ['重庆', '四川', '贵州', '云南'] },
        ],
        requirements: [
          { id: 'passport', name: { zh: '有效护照', en: 'Valid passport' }, category: 'basic', required: true, format: 'original', translationRequired: false },
          { id: 'photo', name: { zh: '白底彩照 2 张', en: '2 photos' }, category: 'basic', required: true, format: 'original', translationRequired: false },
          { id: 'application', name: { zh: '电子签证申请表', en: 'e-Visa form' }, category: 'basic', required: true, format: 'original', translationRequired: false },
          { id: 'flight', name: { zh: '往返机票预订单', en: 'Round-trip flights' }, category: 'travel', required: true, format: 'copy', translationRequired: false },
          { id: 'hotel', name: { zh: '酒店预订单', en: 'Hotel reservation' }, category: 'travel', required: true, format: 'copy', translationRequired: false },
          { id: 'finance', name: { zh: '存款证明或流水', en: 'Bank statement' }, category: 'financial', required: true, format: 'copy', translationRequired: false },
        ],
        faq: [
          { question: { zh: '现在去泰国还需要签证吗？', en: 'Visa needed for Thailand?' }, answer: { zh: '短期旅游免签 30 天；更久可申请电子签。', en: 'Short tourism visa-free 30 days; e-visa for longer.' } },
        ],
      },
      {
        id: 'th-business',
        name: { zh: '商务签证', en: 'Business Visa' },
        category: 'business',
        duration: '90 天',
        validity: '3 个月',
        entries: 'single',
        fee: { amount: 500, currency: 'CNY' },
        serviceFee: { amount: 300, currency: 'CNY' },
        processingDays: { min: 5, max: 8 },
        needInterview: false,
        canApplyOnline: false,
        acceptPersonal: true,
        targetAudience: { zh: '赴泰商务、投资的商务人士', en: 'Business travelers to Thailand' },
        tips: { zh: '需泰方邀请函与中方派遣函。', en: 'Thai invitation and Chinese dispatch letter required.' },
        rejectionReasons: [
          { zh: '邀请函信息不完整', en: 'Incomplete invitation' },
        ],
        consularDistricts: [
          { name: { zh: '泰国驻华大使馆（北京领区）', en: 'Beijing' }, provinces: ['北京', '天津', '河北', '山西', '内蒙古', '辽宁', '吉林', '黑龙江'] },
          { name: { zh: '泰国驻上海总领事馆（上海领区）', en: 'Shanghai' }, provinces: ['上海', '江苏', '浙江', '安徽'] },
        ],
        requirements: [
          { id: 'passport', name: { zh: '有效护照', en: 'Valid passport' }, category: 'basic', required: true, format: 'original', translationRequired: false },
          { id: 'photo', name: { zh: '白底彩照 2 张', en: '2 photos' }, category: 'basic', required: true, format: 'original', translationRequired: false },
          { id: 'invitation', name: { zh: '泰方邀请函', en: 'Thai invitation' }, category: 'identity', required: true, format: 'original', translationRequired: true },
          { id: 'company', name: { zh: '中方派遣函', en: 'Dispatch letter' }, category: 'identity', required: true, format: 'original', translationRequired: true },
        ],
        faq: [
          { question: { zh: '商务签可以延期吗？', en: 'Extendable?' }, answer: { zh: '可在泰国移民局申请延期，一般 30 天。', en: 'Extension at Thai immigration, usually 30 days.' } },
        ],
      },
    ],
  },

  // ==================== 申根区 ====================
  {
    id: 'schengen',
    name: { zh: '申根区', en: 'Schengen Area' },
    flag: '🇪🇺',
    difficulty: 'hard',
    region: '欧洲',
    overview: { zh: '29 国一签通，材料最严，需录指纹。', en: '29 countries, one visa; strictest documents, fingerprints required.' },
    visaFree: { zh: '申根区 29 国对中国公民无免签政策，需申请申根签证。', en: 'Schengen requires a visa for Chinese citizens.' },
    announcements: [
      { date: '2024-06-01', title: { zh: '申根签证费上调', en: 'Schengen fee increase' }, content: { zh: '2024 年起申根签证费上调至 90 欧元，逐步推行在线申请。', en: 'Fee increased to €90 in 2024; online rollout.' } },
    ],
    visaTypes: [
      {
        id: 'sg-tourist',
        name: { zh: '短期申根签证（旅游）', en: 'Short-stay Schengen (Tourist)' },
        category: 'tourist',
        duration: '90 天/180 天',
        validity: '按签证标注',
        entries: 'single',
        fee: { amount: 720, currency: 'CNY' },
        serviceFee: { amount: 500, currency: 'CNY' },
        processingDays: { min: 10, max: 30 },
        needInterview: false,
        canApplyOnline: false,
        acceptPersonal: true,
        targetAudience: { zh: '赴欧洲多国旅游观光的申请人', en: 'Travelers visiting Schengen countries' },
        tips: { zh: '首次申请需录指纹，指纹 5 年内有效。', en: 'First-time applicants need fingerprints, valid 5 years.' },
        rejectionReasons: [
          { zh: '资金不足以覆盖行程', en: 'Insufficient funds' },
          { zh: '行程不合理或酒店未订满', en: 'Unreasonable itinerary' },
          { zh: '拒签史未如实申报', en: 'Undisclosed visa refusal' },
        ],
        consularDistricts: [
          { name: { zh: '德国驻华大使馆（北京领区）', en: 'Germany Beijing' }, provinces: ['北京', '天津', '河北', '山西', '内蒙古'] },
          { name: { zh: '法国驻上海总领事馆（上海领区）', en: 'France Shanghai' }, provinces: ['上海', '江苏', '浙江', '安徽'] },
          { name: { zh: '法国驻广州总领事馆（广州领区）', en: 'France Guangzhou' }, provinces: ['广东', '福建', '广西', '海南'] },
          { name: { zh: '意大利驻重庆总领事馆（重庆领区）', en: 'Italy Chongqing' }, provinces: ['重庆', '四川', '贵州', '云南'] },
        ],
        requirements: [
          { id: 'passport', name: { zh: '有效护照（超过行程结束 3 个月）', en: 'Valid passport (3 months beyond)' }, category: 'basic', required: true, format: 'original', translationRequired: false },
          { id: 'photo', name: { zh: '白底彩照 35mm×45mm（2 张）', en: '2 photos 35×45mm' }, category: 'basic', required: true, format: 'original', translationRequired: false },
          { id: 'application', name: { zh: '申根签证申请表', en: 'Schengen form' }, category: 'basic', required: true, format: 'original', translationRequired: false },
          { id: 'insurance', name: { zh: '申根医疗保险（3 万欧元以上）', en: 'Travel insurance (30k+ EUR)' }, category: 'basic', required: true, format: 'copy', translationRequired: false },
          { id: 'employment', name: { zh: '在职证明', en: 'Employment certificate' }, category: 'identity', required: true, format: 'original', translationRequired: true },
          { id: 'license', name: { zh: '营业执照副本复印件', en: 'Business license copy' }, category: 'identity', required: true, format: 'copy', translationRequired: false },
          { id: 'bank', name: { zh: '近 3-6 个月银行流水', en: 'Bank statements' }, category: 'financial', required: true, format: 'original', translationRequired: false },
          { id: 'itinerary', name: { zh: '详细行程单', en: 'Detailed itinerary' }, category: 'travel', required: true, format: 'both', translationRequired: true },
          { id: 'flight', name: { zh: '往返机票订单', en: 'Round-trip flights' }, category: 'travel', required: true, format: 'copy', translationRequired: false },
          { id: 'hotel', name: { zh: '全程酒店预订单', en: 'All hotel reservations' }, category: 'travel', required: true, format: 'copy', translationRequired: false },
          { id: 'residence', name: { zh: '户口本复印件', en: 'Household registration' }, category: 'identity', required: true, format: 'copy', translationRequired: false },
        ],
        faq: [
          { question: { zh: '首次申根申请需要录指纹吗？', en: 'Fingerprints required?' }, answer: { zh: '首次申请需到签证中心录入指纹，5 年内有效。', en: 'Yes, first-time applicants must provide fingerprints.' } },
          { question: { zh: '申根签可以在多个国家游玩吗？', en: 'Travel multiple countries?' }, answer: { zh: '可以，需向主要目的地国申请并准备多国行程。', en: 'Yes, apply to main destination with multi-country itinerary.' } },
        ],
      },
      {
        id: 'sg-business',
        name: { zh: '短期申根签证（商务）', en: 'Schengen Visa (Business)' },
        category: 'business',
        duration: '90 天/180 天',
        validity: '按签证标注',
        entries: 'multiple',
        fee: { amount: 720, currency: 'CNY' },
        serviceFee: { amount: 500, currency: 'CNY' },
        processingDays: { min: 10, max: 20 },
        needInterview: false,
        canApplyOnline: false,
        acceptPersonal: true,
        targetAudience: { zh: '赴欧洲商务洽谈、参加会展的企业人员', en: 'Business travelers to Europe' },
        tips: { zh: '商务多次签视过往记录颁发。', en: 'Multiple entries depend on history.' },
        rejectionReasons: [
          { zh: '欧方邀请函不真实', en: 'Fake EU invitation' },
        ],
        consularDistricts: [
          { name: { zh: '德国驻华大使馆（北京领区）', en: 'Germany Beijing' }, provinces: ['北京', '天津', '河北', '山西', '内蒙古'] },
          { name: { zh: '法国驻上海总领事馆（上海领区）', en: 'France Shanghai' }, provinces: ['上海', '江苏', '浙江', '安徽'] },
          { name: { zh: '法国驻广州总领事馆（广州领区）', en: 'France Guangzhou' }, provinces: ['广东', '福建', '广西', '海南'] },
        ],
        requirements: [
          { id: 'passport', name: { zh: '有效护照', en: 'Valid passport' }, category: 'basic', required: true, format: 'original', translationRequired: false },
          { id: 'photo', name: { zh: '白底彩照 2 张', en: '2 photos' }, category: 'basic', required: true, format: 'original', translationRequired: false },
          { id: 'application', name: { zh: '申根申请表', en: 'Application form' }, category: 'basic', required: true, format: 'original', translationRequired: false },
          { id: 'insurance', name: { zh: '申根医疗保险', en: 'Travel insurance' }, category: 'basic', required: true, format: 'copy', translationRequired: false },
          { id: 'invitation', name: { zh: '欧方邀请函', en: 'EU invitation' }, category: 'identity', required: true, format: 'original', translationRequired: true },
          { id: 'company', name: { zh: '中方派遣函', en: 'Dispatch letter' }, category: 'identity', required: true, format: 'original', translationRequired: true },
          { id: 'bank', name: { zh: '银行流水', en: 'Bank statements' }, category: 'financial', required: true, format: 'original', translationRequired: false },
        ],
        faq: [
          { question: { zh: '商务签一般给多次吗？', en: 'Usually multiple?' }, answer: { zh: '视过往记录，多次往返可申请。', en: 'Multiple entries possible based on history.' } },
        ],
      },
    ],
  },

  // ==================== 美国 ====================
  {
    id: 'usa',
    name: { zh: '美国', en: 'United States' },
    flag: '🇺🇸',
    difficulty: 'hard',
    region: '北美',
    overview: { zh: '需面签，B 类签证有效期最长 10 年。', en: 'Interview required; B visas up to 10 years.' },
    visaFree: { zh: '美国对中国公民无免签政策，需申请 B1/B2 签证并面签。', en: 'US requires B1/B2 visa and interview.' },
    announcements: [
      { date: '2023-05-01', title: { zh: 'B 类签证有效期最长 10 年', en: 'B visa 10-year validity' }, content: { zh: '美国 B 类签证有效期最长 10 年（多次往返）。', en: 'B visas valid up to 10 years, multiple entry.' } },
    ],
    visaTypes: [
      {
        id: 'us-b1b2',
        name: { zh: 'B1/B2 商务旅游签证', en: 'B1/B2 Business & Tourism' },
        category: 'tourist',
        duration: '最长 6 个月/次',
        validity: '最长 10 年',
        entries: 'multiple',
        fee: { amount: 1390, currency: 'CNY' },
        serviceFee: { amount: 600, currency: 'CNY' },
        processingDays: { min: 15, max: 40 },
        needInterview: true,
        canApplyOnline: true, // DS-160 在线填写
        acceptPersonal: true,
        targetAudience: { zh: '赴美商务或旅游观光的申请人', en: 'Business & leisure travelers to the US' },
        tips: { zh: '面签时如实回答，携带资产证明增强归国约束力。', en: 'Answer honestly at interview; bring asset proofs.' },
        rejectionReasons: [
          { zh: '面签表现不佳', en: 'Poor interview performance' },
          { zh: '移民倾向明显', en: 'Apparent immigrant intent' },
          { zh: '资金或工作不稳定', en: 'Unstable finances/job' },
        ],
        consularDistricts: [
          { name: { zh: '美国驻华大使馆（北京）', en: 'US Embassy Beijing' }, provinces: ['北京', '天津', '河北', '山西', '内蒙古', '山东', '河南', '湖北', '湖南', '陕西', '甘肃', '宁夏', '青海', '新疆', '西藏'] },
          { name: { zh: '美国驻上海总领事馆（上海）', en: 'US Consulate Shanghai' }, provinces: ['上海', '江苏', '浙江', '安徽'] },
          { name: { zh: '美国驻广州总领事馆（广州）', en: 'US Consulate Guangzhou' }, provinces: ['广东', '福建', '广西', '海南'] },
          { name: { zh: '美国驻沈阳总领事馆（沈阳）', en: 'US Consulate Shenyang' }, provinces: ['辽宁', '吉林', '黑龙江'] },
          { name: { zh: '美国驻成都总领事馆（成都）', en: 'US Consulate Chengdu' }, provinces: ['重庆', '四川', '贵州', '云南'] },
        ],
        requirements: [
          { id: 'passport', name: { zh: '有效护照（超过赴美日期 6 个月）', en: 'Valid passport (6 months beyond)' }, category: 'basic', required: true, format: 'original', translationRequired: false },
          { id: 'photo', name: { zh: '51mm×51mm 白底彩照（电子+纸质）', en: '51×51mm photo' }, category: 'basic', required: true, format: 'original', translationRequired: false },
          { id: 'ds160', name: { zh: 'DS-160 确认页', en: 'DS-160 confirmation' }, category: 'basic', required: true, format: 'original', translationRequired: false },
          { id: 'interview', name: { zh: '面签预约确认单', en: 'Interview appointment' }, category: 'basic', required: true, format: 'original', translationRequired: false },
          { id: 'employment', name: { zh: '在职证明', en: 'Employment certificate' }, category: 'identity', required: true, format: 'original', translationRequired: false },
          { id: 'salary', name: { zh: '近半年工资流水', en: 'Salary statements' }, category: 'financial', required: true, format: 'original', translationRequired: false },
          { id: 'property', name: { zh: '房产证、车产证等资产证明', en: 'Asset certificates' }, category: 'financial', required: false, format: 'copy', translationRequired: false },
          { id: 'itinerary', name: { zh: '行程计划（如已定）', en: 'Itinerary (optional)' }, category: 'travel', required: false, format: 'copy', translationRequired: false },
        ],
        faq: [
          { question: { zh: '面签需要准备什么？', en: 'What to prepare?' }, answer: { zh: '携带护照、DS-160 确认页、照片及支持性材料。', en: 'Passport, DS-160, photo and supporting docs.' } },
          { question: { zh: 'B1/B2 可以呆多久？', en: 'How long can I stay?' }, answer: { zh: '入境时由海关决定，一般最长 6 个月。', en: 'Decided at entry, usually up to 6 months.' } },
        ],
      },
    ],
  },

  // ==================== 英国 ====================
  {
    id: 'uk',
    name: { zh: '英国', en: 'United Kingdom' },
    flag: '🇬🇧',
    difficulty: 'hard',
    region: '欧洲',
    overview: { zh: '标准访问签通常 2 年多次，无需面签。', en: 'Standard visitor visa, usually 2 years, no interview.' },
    visaFree: { zh: '英国对中国公民无免签政策，需申请 Standard Visitor Visa。', en: 'UK requires a Standard Visitor Visa.' },
    announcements: [
      { date: '2024-01-01', title: { zh: 'ETA 试点', en: 'ETA pilot' }, content: { zh: '英国推出电子旅行授权（ETA）试点，适用于部分免签国家。', en: 'UK pilots ETA for some visa-free countries.' } },
    ],
    visaTypes: [
      {
        id: 'uk-visitor',
        name: { zh: '标准访问签证（旅游/商务）', en: 'Standard Visitor Visa' },
        category: 'tourist',
        duration: '最长 6 个月/次',
        validity: '通常 2 年',
        entries: 'multiple',
        fee: { amount: 1250, currency: 'CNY' },
        serviceFee: { amount: 500, currency: 'CNY' },
        processingDays: { min: 15, max: 30 },
        needInterview: false,
        canApplyOnline: true,
        acceptPersonal: true,
        targetAudience: { zh: '赴英旅游、商务、探亲的申请人', en: 'Travelers visiting the UK' },
        tips: { zh: '无需面签，只需到签证中心录指纹和拍照。', en: 'No interview; biometrics at visa centre.' },
        rejectionReasons: [
          { zh: '归国约束力不足', en: 'Weak home ties' },
          { zh: '资金证明不足', en: 'Insufficient funds' },
        ],
        consularDistricts: [
          { name: { zh: '英国驻华大使馆（北京领区）', en: 'UK Embassy Beijing' }, provinces: ['北京', '天津', '河北', '山西', '内蒙古', '山东', '河南', '湖北', '湖南', '陕西', '甘肃', '宁夏', '青海', '新疆', '西藏'] },
          { name: { zh: '英国驻上海总领事馆（上海领区）', en: 'UK Consulate Shanghai' }, provinces: ['上海', '江苏', '浙江', '安徽', '江西'] },
          { name: { zh: '英国驻广州总领事馆（广州领区）', en: 'UK Consulate Guangzhou' }, provinces: ['广东', '福建', '广西', '海南'] },
          { name: { zh: '英国驻重庆总领事馆（重庆领区）', en: 'UK Consulate Chongqing' }, provinces: ['重庆', '四川', '贵州', '云南'] },
        ],
        requirements: [
          { id: 'passport', name: { zh: '有效护照（含至少 1 页空白签证页）', en: 'Valid passport (1 blank page)' }, category: 'basic', required: true, format: 'original', translationRequired: false },
          { id: 'photo', name: { zh: '白底彩照 45mm×35mm', en: 'Photo 45×35mm' }, category: 'basic', required: true, format: 'original', translationRequired: false },
          { id: 'application', name: { zh: '在线申请表 + 预约单', en: 'Online application' }, category: 'basic', required: true, format: 'original', translationRequired: false },
          { id: 'employment', name: { zh: '在职证明', en: 'Employment certificate' }, category: 'identity', required: true, format: 'original', translationRequired: true },
          { id: 'bank', name: { zh: '银行流水（近 6 个月）', en: 'Bank statements' }, category: 'financial', required: true, format: 'original', translationRequired: false },
          { id: 'property', name: { zh: '资产证明（房、车、存款）', en: 'Asset certificates' }, category: 'financial', required: false, format: 'copy', translationRequired: false },
          { id: 'itinerary', name: { zh: '行程单', en: 'Itinerary' }, category: 'travel', required: false, format: 'copy', translationRequired: false },
        ],
        faq: [
          { question: { zh: '英国签证需要面签吗？', en: 'Interview required?' }, answer: { zh: '一般无需面签，只需录指纹拍照。', en: 'Usually no interview; biometrics only.' } },
          { question: { zh: '签证有效期多长？', en: 'How long valid?' }, answer: { zh: '标准访问签通常 2 年多次，每次最长 6 个月。', en: 'Usually 2 years, 6 months per stay.' } },
        ],
      },
    ],
  },

  // ==================== 澳大利亚 ====================
  {
    id: 'australia',
    name: { zh: '澳大利亚', en: 'Australia' },
    flag: '🇦🇺',
    difficulty: 'medium',
    region: '大洋洲',
    overview: { zh: '电子签全程在线，出签后与护照号关联。', en: 'Fully online e-visa linked to passport.' },
    visaFree: { zh: '澳大利亚对中国公民无免签政策，需申请电子签证（subclass 600）。', en: 'Australia requires an e-visa (subclass 600).' },
    announcements: [
      { date: '2023-10-01', title: { zh: '在线申请全面开放', en: 'Online application' }, content: { zh: '澳大利亚为中国公民提供线上申请旅游签证（subclass 600）。', en: 'Online visitor visa (subclass 600) available.' } },
    ],
    visaTypes: [
      {
        id: 'au-600',
        name: { zh: '访客签证（subclass 600）', en: 'Visitor Visa (subclass 600)' },
        category: 'tourist',
        duration: '最长 12 个月/次',
        validity: '通常 12 个月',
        entries: 'multiple',
        fee: { amount: 1450, currency: 'CNY' },
        serviceFee: { amount: 500, currency: 'CNY' },
        processingDays: { min: 15, max: 40 },
        needInterview: false,
        canApplyOnline: true,
        acceptPersonal: true,
        targetAudience: { zh: '赴澳旅游、探亲、访友的申请人', en: 'Travelers visiting Australia' },
        tips: { zh: '获批后为电子签证，与护照号关联，出行时出示。', en: 'E-visa linked to passport number.' },
        rejectionReasons: [
          { zh: '健康要求不达标', en: 'Health requirements' },
          { zh: '资金证明不足', en: 'Insufficient funds' },
        ],
        consularDistricts: [
          { name: { zh: '澳大利亚驻华大使馆（北京）', en: 'Australia Beijing' }, provinces: ['北京', '天津', '河北', '山西', '内蒙古', '山东', '河南', '湖北', '湖南', '陕西', '甘肃', '宁夏', '青海', '新疆', '西藏'] },
          { name: { zh: '澳大利亚驻上海总领事馆（上海）', en: 'Australia Shanghai' }, provinces: ['上海', '江苏', '浙江', '安徽'] },
          { name: { zh: '澳大利亚驻广州总领事馆（广州）', en: 'Australia Guangzhou' }, provinces: ['广东', '福建', '广西', '海南'] },
          { name: { zh: '澳大利亚驻成都总领事馆（成都）', en: 'Australia Chengdu' }, provinces: ['重庆', '四川', '贵州', '云南'] },
        ],
        requirements: [
          { id: 'passport', name: { zh: '有效护照扫描件', en: 'Passport scan' }, category: 'basic', required: true, format: 'copy', translationRequired: false },
          { id: 'photo', name: { zh: '电子证件照', en: 'Digital photo' }, category: 'basic', required: true, format: 'copy', translationRequired: false },
          { id: 'application', name: { zh: 'ImmiAccount 在线申请', en: 'ImmiAccount application' }, category: 'basic', required: true, format: 'original', translationRequired: false },
          { id: 'employment', name: { zh: '在职证明', en: 'Employment certificate' }, category: 'identity', required: true, format: 'copy', translationRequired: true },
          { id: 'bank', name: { zh: '银行流水', en: 'Bank statements' }, category: 'financial', required: true, format: 'copy', translationRequired: false },
          { id: 'itinerary', name: { zh: '行程安排', en: 'Itinerary' }, category: 'travel', required: true, format: 'copy', translationRequired: false },
        ],
        faq: [
          { question: { zh: '澳大利亚签证是电子的吗？', en: 'Is it electronic?' }, answer: { zh: '是的，获批后为电子签证，与护照号关联。', en: 'Yes, an e-visa linked to passport number.' } },
          { question: { zh: '审批需要多久？', en: 'How long?' }, answer: { zh: '一般 15-40 天，旺季可能更长。', en: 'Usually 15-40 days.' } },
        ],
      },
    ],
  },
]

export const DIFFICULTY_LABELS: Record<'easy' | 'medium' | 'hard', Localized> = {
  easy: { zh: '易', en: 'Easy' },
  medium: { zh: '中', en: 'Medium' },
  hard: { zh: '难', en: 'Hard' },
}

export const REQUIREMENT_CATEGORIES: Record<
  'basic' | 'identity' | 'financial' | 'travel' | 'extra',
  Localized & { icon: string }
> = {
  basic: { zh: '基础材料', en: 'Basic Documents', icon: 'ri:file-list-3-line' },
  identity: { zh: '身份材料', en: 'Identity Documents', icon: 'ri:id-card-line' },
  financial: { zh: '财力材料', en: 'Financial Documents', icon: 'ri:wallet-3-line' },
  travel: { zh: '行程材料', en: 'Travel Documents', icon: 'ri:map-2-line' },
  extra: { zh: '补充材料', en: 'Additional Documents', icon: 'ri:add-circle-line' },
}

export function getCountry(id: string): Country | undefined {
  return countries.find((c) => c.id === id)
}

export function getVisaType(countryId: string, visaTypeId: string) {
  const country = getCountry(countryId)
  return country?.visaTypes.find((v) => v.id === visaTypeId)
}

export function searchCountries(keyword: string): Country[] {
  const kw = keyword.trim().toLowerCase()
  if (!kw) return countries
  return countries.filter(
    (c) =>
      c.name.zh.includes(kw) ||
      c.name.en.toLowerCase().includes(kw) ||
      c.visaTypes.some(
        (v) => v.name.zh.includes(kw) || v.name.en.toLowerCase().includes(kw),
      ),
  )
}
