// data/country-list.ts — 40 国签证百科元数据（列表卡片 + 分组）
// 保留原有 7 国完整详情；其余国家在 countries.ts 中由本数据生成基础结构

export interface CountryMeta {
  id: string
  zh: string
  en: string
  flag: string
  difficulty: 'easy' | 'medium' | 'hard'
  region: string
  desc: string
}

export const COUNTRY_LIST: CountryMeta[] = [
  // ===== 亚洲 =====
  { id: 'japan', zh: '日本', en: 'Japan', flag: '🇯🇵', difficulty: 'easy', region: '亚洲', desc: '材料要求严谨，需通过指定旅行社代办，单次最长15天' },
  { id: 'korea', zh: '韩国', en: 'Korea', flag: '🇰🇷', difficulty: 'easy', region: '亚洲', desc: '济州岛免签30天，mainland需办C-3旅游签，多次签条件宽松' },
  { id: 'thailand', zh: '泰国', en: 'Thailand', flag: '🇹🇭', difficulty: 'easy', region: '亚洲', desc: '落地签15天或电子签，材料简单出签快' },
  { id: 'singapore', zh: '新加坡', en: 'Singapore', flag: '🇸🇬', difficulty: 'easy', region: '亚洲', desc: '电子签，材料简单，通常3-5个工作日出签' },
  { id: 'malaysia', zh: '马来西亚', en: 'Malaysia', flag: '🇲🇾', difficulty: 'easy', region: '亚洲', desc: 'eVISA电子签，材料简单，最长停留30天' },
  { id: 'vietnam', zh: '越南', en: 'Vietnam', flag: '🇻🇳', difficulty: 'easy', region: '亚洲', desc: '电子签或落地签，电子签最长90天多次' },
  { id: 'cambodia', zh: '柬埔寨', en: 'Cambodia', flag: '🇰🇭', difficulty: 'easy', region: '亚洲', desc: '落地签或电子签，材料要求低，出签快' },
  { id: 'laos', zh: '老挝', en: 'Laos', flag: '🇱🇦', difficulty: 'easy', region: '亚洲', desc: '落地签，护照+照片即可，最长30天' },
  { id: 'myanmar', zh: '缅甸', en: 'Myanmar', flag: '🇲🇲', difficulty: 'medium', region: '亚洲', desc: '电子签，审批时间较长，需提前申请' },
  { id: 'philippines', zh: '菲律宾', en: 'Philippines', flag: '🇵🇭', difficulty: 'medium', region: '亚洲', desc: '电子签，材料要求中等，需财力证明' },
  { id: 'india', zh: '印度', en: 'India', flag: '🇮🇳', difficulty: 'medium', region: '亚洲', desc: '电子签，最长5年多次，需在线填写详细表格' },
  { id: 'sri-lanka', zh: '斯里兰卡', en: 'Sri Lanka', flag: '🇱🇰', difficulty: 'easy', region: '亚洲', desc: 'ETA电子许可，在线申请，通常24小时内出签' },
  { id: 'nepal', zh: '尼泊尔', en: 'Nepal', flag: '🇳🇵', difficulty: 'easy', region: '亚洲', desc: '落地签，机场或陆路口岸均可办理' },
  { id: 'pakistan', zh: '巴基斯坦', en: 'Pakistan', flag: '🇵🇰', difficulty: 'medium', region: '亚洲', desc: '电子签，需邀请函或旅行社担保' },
  { id: 'bangladesh', zh: '孟加拉国', en: 'Bangladesh', flag: '🇧🇩', difficulty: 'medium', region: '亚洲', desc: '落地签，需邀请函或回程机票' },
  { id: 'iran', zh: '伊朗', en: 'Iran', flag: '🇮🇷', difficulty: 'medium', region: '亚洲', desc: '落地签15天，需旅行保险，部分口岸可办' },
  { id: 'iraq', zh: '伊拉克', en: 'Iraq', flag: '🇮🇶', difficulty: 'hard', region: '亚洲', desc: '电子签，审批严格，需邀请函或旅行社担保' },
  { id: 'saudi-arabia', zh: '沙特阿拉伯', en: 'Saudi Arabia', flag: '🇸🇦', difficulty: 'medium', region: '亚洲', desc: '电子签，2019年开放旅游签，最长1年多次' },
  { id: 'israel', zh: '以色列', en: 'Israel', flag: '🇮🇱', difficulty: 'medium', region: '亚洲', desc: '电子签，需面签或邮寄护照，审查较严' },
  { id: 'turkey', zh: '土耳其', en: 'Turkey', flag: '🇹🇷', difficulty: 'easy', region: '亚洲', desc: '电子签，在线申请即时出签，最长90天' },

  // ===== 欧洲 =====
  { id: 'schengen', zh: '申根区', en: 'Schengen', flag: '🇪🇺', difficulty: 'hard', region: '欧洲', desc: '26国一签通，材料最严，需录指纹，通过VFS递交' },
  { id: 'uk', zh: '英国', en: 'United Kingdom', flag: '🇬🇧', difficulty: 'medium', region: '欧洲', desc: '标准访客签通常2年多次，无需面签，需在线申请' },
  { id: 'ireland', zh: '爱尔兰', en: 'Ireland', flag: '🇮🇪', difficulty: 'medium', region: '欧洲', desc: '旅游签，需财力证明，持英签可免签入境' },
  { id: 'russia', zh: '俄罗斯', en: 'Russia', flag: '🇷🇺', difficulty: 'medium', region: '欧洲', desc: '电子签或团签免签，个人旅游签需邀请函' },

  // ===== 美洲 =====
  { id: 'usa', zh: '美国', en: 'United States', flag: '🇺🇸', difficulty: 'hard', region: '美洲', desc: 'B1/B2签证需面签，最长10年多次，拒签率较高' },
  { id: 'canada', zh: '加拿大', en: 'Canada', flag: '🇨🇦', difficulty: 'hard', region: '美洲', desc: '旅游签需录指纹，审批周期长，最长10年多次' },
  { id: 'mexico', zh: '墨西哥', en: 'Mexico', flag: '🇲🇽', difficulty: 'medium', region: '美洲', desc: '持有效美签可免签，否则需办签证' },
  { id: 'brazil', zh: '巴西', en: 'Brazil', flag: '🇧🇷', difficulty: 'medium', region: '美洲', desc: '电子签，在线申请，最长90天停留' },
  { id: 'argentina', zh: '阿根廷', en: 'Argentina', flag: '🇦🇷', difficulty: 'hard', region: '美洲', desc: '需签证，持美签或申根签可申请AVE电子许可' },
  { id: 'cuba', zh: '古巴', en: 'Cuba', flag: '🇨🇺', difficulty: 'easy', region: '美洲', desc: '旅游卡，旅行社或机场购买即可' },

  // ===== 大洋洲 =====
  { id: 'australia', zh: '澳大利亚', en: 'Australia', flag: '🇦🇺', difficulty: 'medium', region: '大洋洲', desc: '600类电子签，全程在线，出签后与护照号关联' },
  { id: 'new-zealand', zh: '新西兰', en: 'New Zealand', flag: '🇳🇿', difficulty: 'medium', region: '大洋洲', desc: '旅游签，需在线申请，材料要求中等' },

  // ===== 非洲 =====
  { id: 'egypt', zh: '埃及', en: 'Egypt', flag: '🇪🇬', difficulty: 'medium', region: '非洲', desc: '落地签或电子签，落地签25美元，停留30天' },
  { id: 'south-africa', zh: '南非', en: 'South Africa', flag: '🇿🇦', difficulty: 'medium', region: '非洲', desc: '需签证，需递交纸质材料到签证中心' },
  { id: 'kenya', zh: '肯尼亚', en: 'Kenya', flag: '🇰🇪', difficulty: 'easy', region: '非洲', desc: 'eTA电子旅行授权，在线申请，最长90天' },
  { id: 'tanzania', zh: '坦桑尼亚', en: 'Tanzania', flag: '🇹🇿', difficulty: 'easy', region: '非洲', desc: '落地签，机场或陆路口岸办理，50美元' },
]

/** 分组顺序 */
export const REGION_ORDER = ['亚洲', '欧洲', '美洲', '大洋洲', '非洲']
