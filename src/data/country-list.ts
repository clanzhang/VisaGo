// data/country-list.ts — 88 国签证百科元数据（按签证类型分组）
// visaType: 互免签证 / 单方面免签 / 落地签 / 电子签 / 需通行证
// difficulty: easy(容易) / medium(中等) / hard(困难)（用于卡片徽章）

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

export const COUNTRY_LIST: CountryMeta[] = [
  // ═════════════ 一、互免签证（29） ═════════════
  // ---- 亚洲（14） ----
  { id: 'uae', zh: '阿联酋', en: 'UAE', flag: '🇦🇪', visaType: '互免签证', difficulty: 'easy', region: '亚洲', desc: '互免签证，每次停留不超过30天' },
  { id: 'qatar', zh: '卡塔尔', en: 'Qatar', flag: '🇶🇦', visaType: '互免签证', difficulty: 'easy', region: '亚洲', desc: '互免签证，每次停留不超过30天' },
  { id: 'oman', zh: '阿曼', en: 'Oman', flag: '🇴🇲', visaType: '互免签证', difficulty: 'easy', region: '亚洲', desc: '互免签证，每次停留不超过30天' },
  { id: 'maldives', zh: '马尔代夫', en: 'Maldives', flag: '🇲🇻', visaType: '互免签证', difficulty: 'easy', region: '亚洲', desc: '2023起互免，落地免费，停留30天' },
  { id: 'kazakhstan', zh: '哈萨克斯坦', en: 'Kazakhstan', flag: '🇰🇿', visaType: '互免签证', difficulty: 'easy', region: '亚洲', desc: '2023起互免，每次停留不超过30天' },
  { id: 'uzbekistan', zh: '乌兹别克斯坦', en: 'Uzbekistan', flag: '🇺🇿', visaType: '互免签证', difficulty: 'easy', region: '亚洲', desc: '2024起互免，每次停留不超过30天' },
  { id: 'georgia', zh: '格鲁吉亚', en: 'Georgia', flag: '🇬🇪', visaType: '互免签证', difficulty: 'easy', region: '欧洲', desc: '2024起互免，每次停留不超过30天' },
  { id: 'azerbaijan', zh: '阿塞拜疆', en: 'Azerbaijan', flag: '🇦🇿', visaType: '互免签证', difficulty: 'easy', region: '欧洲', desc: '2025起互免，每次停留不超过30天' },
  { id: 'armenia', zh: '亚美尼亚', en: 'Armenia', flag: '🇦🇲', visaType: '互免签证', difficulty: 'easy', region: '欧洲', desc: '互免签证，180天内累计不超过90天' },
  { id: 'belarus', zh: '白俄罗斯', en: 'Belarus', flag: '🇧🇾', visaType: '互免签证', difficulty: 'easy', region: '欧洲', desc: '互免签证，每次停留不超过30天' },
  { id: 'thailand', zh: '泰国', en: 'Thailand', flag: '🇹🇭', visaType: '互免签证', difficulty: 'easy', region: '亚洲', desc: '2024.3起永久互免，每次停留不超过30天', aliases: ['tai guo', 'taiguo', 'tg', '暹罗'] },
  { id: 'singapore', zh: '新加坡', en: 'Singapore', flag: '🇸🇬', visaType: '互免签证', difficulty: 'easy', region: '亚洲', desc: '2024.2起互免，每次停留不超过30天', aliases: ['xin jia po', 'xinjiapo', '狮城', '星加坡'] },
  { id: 'malaysia', zh: '马来西亚', en: 'Malaysia', flag: '🇲🇾', visaType: '互免签证', difficulty: 'easy', region: '亚洲', desc: '2025起互免，每次停留不超过30天', aliases: ['ma lai xi ya', 'malaixiya', '大马'] },
  { id: 'brunei', zh: '文莱', en: 'Brunei', flag: '🇧🇳', visaType: '互免签证', difficulty: 'easy', region: '亚洲', desc: '2025起互免，每次停留不超过14天' },
  // ---- 欧洲（4） ----
  { id: 'serbia', zh: '塞尔维亚', en: 'Serbia', flag: '🇷🇸', visaType: '互免签证', difficulty: 'easy', region: '欧洲', desc: '互免签证，每次停留不超过30天' },
  { id: 'bosnia', zh: '波黑', en: 'Bosnia & Herzegovina', flag: '🇧🇦', visaType: '互免签证', difficulty: 'easy', region: '欧洲', desc: '互免签证，每次停留不超过90天' },
  { id: 'albania', zh: '阿尔巴尼亚', en: 'Albania', flag: '🇦🇱', visaType: '互免签证', difficulty: 'easy', region: '欧洲', desc: '2023起互免，每次停留不超过90天' },
  { id: 'san-marino', zh: '圣马力诺', en: 'San Marino', flag: '🇸🇲', visaType: '互免签证', difficulty: 'easy', region: '欧洲', desc: '互免签证，需先入境意大利（申根签）' },
  // ---- 非洲（2） ----
  { id: 'mauritius', zh: '毛里求斯', en: 'Mauritius', flag: '🇲🇺', visaType: '互免签证', difficulty: 'easy', region: '非洲', desc: '互免签证，每次停留不超过60天' },
  { id: 'seychelles', zh: '塞舌尔', en: 'Seychelles', flag: '🇸🇨', visaType: '互免签证', difficulty: 'easy', region: '非洲', desc: '互免签证，每次停留不超过30天' },
  // ---- 美洲/大洋洲（9） ----
  { id: 'barbados', zh: '巴巴多斯', en: 'Barbados', flag: '🇧🇧', visaType: '互免签证', difficulty: 'easy', region: '美洲', desc: '互免签证，每次停留不超过30天' },
  { id: 'bahamas', zh: '巴哈马', en: 'Bahamas', flag: '🇧🇸', visaType: '互免签证', difficulty: 'easy', region: '美洲', desc: '互免签证，每次停留不超过30天' },
  { id: 'grenada', zh: '格林纳达', en: 'Grenada', flag: '🇬🇩', visaType: '互免签证', difficulty: 'easy', region: '美洲', desc: '互免签证，每次停留不超过30天' },
  { id: 'dominica', zh: '多米尼克', en: 'Dominica', flag: '🇩🇲', visaType: '互免签证', difficulty: 'easy', region: '美洲', desc: '互免签证，每次停留不超过21天' },
  { id: 'antigua-barbuda', zh: '安提瓜和巴布达', en: 'Antigua & Barbuda', flag: '🇦🇬', visaType: '互免签证', difficulty: 'easy', region: '美洲', desc: '互免签证，每次停留不超过30天' },
  { id: 'suriname', zh: '苏里南', en: 'Suriname', flag: '🇸🇷', visaType: '互免签证', difficulty: 'easy', region: '美洲', desc: '互免签证，每次停留不超过30天' },
  { id: 'fiji', zh: '斐济', en: 'Fiji', flag: '🇫🇯', visaType: '互免签证', difficulty: 'easy', region: '大洋洲', desc: '互免签证，每次停留不超过120天' },
  { id: 'tonga', zh: '汤加', en: 'Tonga', flag: '🇹🇴', visaType: '互免签证', difficulty: 'easy', region: '大洋洲', desc: '互免签证，每次停留不超过30天' },
  { id: 'samoa', zh: '萨摩亚', en: 'Samoa', flag: '🇼🇸', visaType: '互免签证', difficulty: 'easy', region: '大洋洲', desc: '互免签证，每次停留不超过60天' },

  // ═════════════ 二、单方面免签（18） ═════════════
  // ---- 亚洲（5） ----
  { id: 'turkey', zh: '土耳其', en: 'Turkey', flag: '🇹🇷', visaType: '单方面免签', difficulty: 'easy', region: '欧洲', desc: '2026.1起单方面免签，180天内累计不超过90天' },
  { id: 'korea-jeju', zh: '韩国（济州岛）', en: 'South Korea (Jeju)', flag: '🇰🇷', visaType: '单方面免签', difficulty: 'easy', region: '亚洲', desc: '济州岛免签30天，mainland仍需签证' },
  { id: 'iran', zh: '伊朗', en: 'Iran', flag: '🇮🇷', visaType: '单方面免签', difficulty: 'easy', region: '亚洲', desc: '2019起单方面免签，停留21天' },
  { id: 'pakistan', zh: '巴基斯坦', en: 'Pakistan', flag: '🇵🇰', visaType: '单方面免签', difficulty: 'easy', region: '亚洲', desc: '2024新增单方面免签，停留30天' },
  { id: 'philippines', zh: '菲律宾', en: 'Philippines', flag: '🇵🇭', visaType: '单方面免签', difficulty: 'easy', region: '亚洲', desc: '2026新增免签14天，仅限马尼拉/宿务机场入境' },
  // ---- 欧洲（1） ----
  { id: 'russia', zh: '俄罗斯', en: 'Russia', flag: '🇷🇺', visaType: '单方面免签', difficulty: 'easy', region: '欧洲', desc: '团队游免签至2027.12，个人游需确认最新政策' },
  // ---- 非洲（6） ----
  { id: 'morocco', zh: '摩洛哥', en: 'Morocco', flag: '🇲🇦', visaType: '单方面免签', difficulty: 'easy', region: '非洲', desc: '单方面免签，停留不超过90天' },
  { id: 'tunisia', zh: '突尼斯', en: 'Tunisia', flag: '🇹🇳', visaType: '单方面免签', difficulty: 'easy', region: '非洲', desc: '单方面免签，停留不超过90天' },
  { id: 'zambia', zh: '赞比亚', en: 'Zambia', flag: '🇿🇲', visaType: '单方面免签', difficulty: 'easy', region: '非洲', desc: '2022新增单方面免签' },
  { id: 'gabon', zh: '加蓬', en: 'Gabon', flag: '🇬🇦', visaType: '单方面免签', difficulty: 'easy', region: '非洲', desc: '2023新增单方面免签' },
  { id: 'mozambique', zh: '莫桑比克', en: 'Mozambique', flag: '🇲🇿', visaType: '单方面免签', difficulty: 'easy', region: '非洲', desc: '2023新增单方面免签，停留30天' },
  { id: 'benin', zh: '贝宁', en: 'Benin', flag: '🇧🇯', visaType: '单方面免签', difficulty: 'easy', region: '非洲', desc: '2023新增单方面免签，停留30天' },
  // ---- 美洲（4） ----
  { id: 'jamaica', zh: '牙买加', en: 'Jamaica', flag: '🇯🇲', visaType: '单方面免签', difficulty: 'easy', region: '美洲', desc: '单方面免签，停留不超过30天' },
  { id: 'haiti', zh: '海地', en: 'Haiti', flag: '🇭🇹', visaType: '单方面免签', difficulty: 'easy', region: '美洲', desc: '单方面免签，停留不超过90天' },
  { id: 'saint-kitts', zh: '圣基茨和尼维斯', en: 'Saint Kitts & Nevis', flag: '🇰🇳', visaType: '单方面免签', difficulty: 'easy', region: '美洲', desc: '单方面免签，停留不超过30天' },
  { id: 'cuba', zh: '古巴', en: 'Cuba', flag: '🇨🇺', visaType: '单方面免签', difficulty: 'easy', region: '美洲', desc: '2024新增免签，需购买旅游卡' },
  // ---- 大洋洲（2） ----
  { id: 'northern-mariana', zh: '北马里亚纳群岛', en: 'Northern Mariana Islands', flag: '🇲🇵', visaType: '单方面免签', difficulty: 'easy', region: '大洋洲', desc: '塞班岛等，需提前填写I-736表格，停留不超过45天' },
  { id: 'french-polynesia', zh: '法属波利尼西亚', en: 'French Polynesia', flag: '🇵🇫', visaType: '单方面免签', difficulty: 'easy', region: '大洋洲', desc: '需旅行社发放免签券，停留不超过14天' },

  // ═════════════ 三、落地签（27） ═════════════
  // ---- 亚洲（12） ----
  { id: 'indonesia', zh: '印度尼西亚', en: 'Indonesia', flag: '🇮🇩', visaType: '落地签', difficulty: 'easy', region: '亚洲', desc: '落地签30天，500,000印尼盾，可延期一次' },
  { id: 'laos', zh: '老挝', en: 'Laos', flag: '🇱🇦', visaType: '落地签', difficulty: 'easy', region: '亚洲', desc: '落地签30天，护照+照片即可办理' },
  { id: 'cambodia', zh: '柬埔寨', en: 'Cambodia', flag: '🇰🇭', visaType: '落地签', difficulty: 'easy', region: '亚洲', desc: '落地签30天，2026.6-10期间限时免签' },
  { id: 'nepal', zh: '尼泊尔', en: 'Nepal', flag: '🇳🇵', visaType: '落地签', difficulty: 'easy', region: '亚洲', desc: '落地签15/30/90天可选，机场或陆路口岸办理' },
  { id: 'myanmar', zh: '缅甸', en: 'Myanmar', flag: '🇲🇲', visaType: '落地签', difficulty: 'easy', region: '亚洲', desc: '落地签或电子签，审批时间较长' },
  { id: 'timor-leste', zh: '东帝汶', en: 'Timor-Leste', flag: '🇹🇱', visaType: '落地签', difficulty: 'easy', region: '亚洲', desc: '落地签30天，需出示酒店订单和回程机票' },
  { id: 'bahrain', zh: '巴林', en: 'Bahrain', flag: '🇧🇭', visaType: '落地签', difficulty: 'easy', region: '亚洲', desc: '落地签14天，也可提前办电子签' },
  { id: 'lebanon', zh: '黎巴嫩', en: 'Lebanon', flag: '🇱🇧', visaType: '落地签', difficulty: 'easy', region: '亚洲', desc: '落地签免费，停留不超过30天' },
  { id: 'jordan', zh: '约旦', en: 'Jordan', flag: '🇯🇴', visaType: '落地签', difficulty: 'easy', region: '亚洲', desc: '落地签40第纳尔，停留不超过30天' },
  { id: 'vietnam', zh: '越南', en: 'Vietnam', flag: '🇻🇳', visaType: '落地签', difficulty: 'easy', region: '亚洲', desc: '富国岛落地签，mainland建议提前办电子签' },
  { id: 'bangladesh', zh: '孟加拉国', en: 'Bangladesh', flag: '🇧🇩', visaType: '落地签', difficulty: 'easy', region: '亚洲', desc: '落地签，需回程机票，停留30天' },
  { id: 'iraq', zh: '伊拉克', en: 'Iraq', flag: '🇮🇶', visaType: '落地签', difficulty: 'medium', region: '亚洲', desc: '落地签，需邀请函或旅行社担保' },
  // ---- 非洲（12） ----
  { id: 'egypt', zh: '埃及', en: 'Egypt', flag: '🇪🇬', visaType: '落地签', difficulty: 'easy', region: '非洲', desc: '落地签25美元，停留30天，建议提前办电子签' },
  { id: 'tanzania', zh: '坦桑尼亚', en: 'Tanzania', flag: '🇹🇿', visaType: '落地签', difficulty: 'easy', region: '非洲', desc: '落地签50美元，机场或陆路口岸办理' },
  { id: 'kenya', zh: '肯尼亚', en: 'Kenya', flag: '🇰🇪', visaType: '落地签', difficulty: 'easy', region: '非洲', desc: '落地签或电子旅行授权，最长90天' },
  { id: 'madagascar', zh: '马达加斯加', en: 'Madagascar', flag: '🇲🇬', visaType: '落地签', difficulty: 'easy', region: '非洲', desc: '落地签，按停留天数收费，最长90天' },
  { id: 'rwanda', zh: '卢旺达', en: 'Rwanda', flag: '🇷🇼', visaType: '落地签', difficulty: 'easy', region: '非洲', desc: '落地签30天，也可提前办电子签' },
  { id: 'uganda', zh: '乌干达', en: 'Uganda', flag: '🇺🇬', visaType: '落地签', difficulty: 'easy', region: '非洲', desc: '落地签50美元，停留不超过90天' },
  { id: 'zimbabwe', zh: '津巴布韦', en: 'Zimbabwe', flag: '🇿🇼', visaType: '落地签', difficulty: 'easy', region: '非洲', desc: '落地签30天，30-70美元' },
  { id: 'senegal', zh: '塞内加尔', en: 'Senegal', flag: '🇸🇳', visaType: '落地签', difficulty: 'easy', region: '非洲', desc: '落地签，停留不超过90天' },
  { id: 'togo', zh: '多哥', en: 'Togo', flag: '🇹🇬', visaType: '落地签', difficulty: 'easy', region: '非洲', desc: '落地签7天，可延期' },
  { id: 'comoros', zh: '科摩罗', en: 'Comoros', flag: '🇰🇲', visaType: '落地签', difficulty: 'easy', region: '非洲', desc: '落地签，停留不超过45天' },
  { id: 'mauritania', zh: '毛里塔尼亚', en: 'Mauritania', flag: '🇲🇷', visaType: '落地签', difficulty: 'easy', region: '非洲', desc: '落地签，停留不超过30天' },
  { id: 'malawi', zh: '马拉维', en: 'Malawi', flag: '🇲🇼', visaType: '落地签', difficulty: 'easy', region: '非洲', desc: '落地签，停留不超过30天' },
  // ---- 大洋洲（3） ----
  { id: 'palau', zh: '帕劳', en: 'Palau', flag: '🇵🇼', visaType: '落地签', difficulty: 'easy', region: '大洋洲', desc: '落地签免费，停留不超过30天' },
  { id: 'tuvalu', zh: '图瓦卢', en: 'Tuvalu', flag: '🇹🇻', visaType: '落地签', difficulty: 'easy', region: '大洋洲', desc: '落地签，停留不超过30天' },
  { id: 'papua-new-guinea', zh: '巴布亚新几内亚', en: 'Papua New Guinea', flag: '🇵🇬', visaType: '落地签', difficulty: 'medium', region: '大洋洲', desc: '落地签，需出示回程机票和酒店订单' },

  // ═════════════ 四、电子签（14） ═════════════
  // ---- 亚洲（4） ----
  { id: 'japan', zh: '日本', en: 'Japan', flag: '🇯🇵', visaType: '电子签', difficulty: 'medium', region: '亚洲', desc: '需通过指定旅行社代办，单次最长15天', aliases: ['ri ben', 'riben', 'rb', '霓虹'] },
  { id: 'korea', zh: '韩国', en: 'South Korea', flag: '🇰🇷', visaType: '电子签', difficulty: 'medium', region: '亚洲', desc: '济州岛免签，mainland需办C-3签证', aliases: ['han guo', 'hanguo', 'hg', '南韩'] },
  { id: 'india', zh: '印度', en: 'India', flag: '🇮🇳', visaType: '电子签', difficulty: 'medium', region: '亚洲', desc: '电子签最长5年多次，需在线填写详细表格', aliases: ['yin du', 'yindu'] },
  { id: 'sri-lanka', zh: '斯里兰卡', en: 'Sri Lanka', flag: '🇱🇰', visaType: '电子签', difficulty: 'easy', region: '亚洲', desc: 'ETA电子许可，在线申请，2025起改为电子签' },
  // ---- 欧洲（3） ----
  { id: 'schengen', zh: '申根区', en: 'Schengen', flag: '🇪🇺', visaType: '电子签', difficulty: 'hard', region: '欧洲', desc: '26国一签通，材料最严，需录指纹，通过VFS递交', aliases: ['shen gen', 'shengeng', 'sg', '申根26国', '申根区', '欧洲申根'] },
  { id: 'uk', zh: '英国', en: 'United Kingdom', flag: '🇬🇧', visaType: '电子签', difficulty: 'medium', region: '欧洲', desc: '标准访客签通常2年多次，在线申请，无需面签', aliases: ['ying guo', 'yingguo', 'britain', '大不列颠'] },
  { id: 'ireland', zh: '爱尔兰', en: 'Ireland', flag: '🇮🇪', visaType: '电子签', difficulty: 'medium', region: '欧洲', desc: '旅游签，需财力证明，持英签可免签入境' },
  // ---- 美洲（4） ----
  { id: 'usa', zh: '美国', en: 'United States', flag: '🇺🇸', visaType: '电子签', difficulty: 'hard', region: '美洲', desc: 'B1/B2签证需面签，最长10年多次，拒签率较高', aliases: ['mei guo', 'meiguo', 'mg', '美利坚'] },
  { id: 'canada', zh: '加拿大', en: 'Canada', flag: '🇨🇦', visaType: '电子签', difficulty: 'hard', region: '美洲', desc: '需录指纹，审批周期长，最长10年多次', aliases: ['jia na da', 'jianada', '枫叶国'] },
  { id: 'mexico', zh: '墨西哥', en: 'Mexico', flag: '🇲🇽', visaType: '电子签', difficulty: 'medium', region: '美洲', desc: '持有效美签可免签，否则需办签证' },
  { id: 'argentina', zh: '阿根廷', en: 'Argentina', flag: '🇦🇷', visaType: '电子签', difficulty: 'hard', region: '美洲', desc: '持美签或申根签可申请AVE电子许可' },
  // ---- 大洋洲（2） ----
  { id: 'australia', zh: '澳大利亚', en: 'Australia', flag: '🇦🇺', visaType: '电子签', difficulty: 'medium', region: '大洋洲', desc: '600类电子签，全程在线，出签后与护照号关联', aliases: ['ao da li ya', 'aodaliya', '土澳'] },
  { id: 'new-zealand', zh: '新西兰', en: 'New Zealand', flag: '🇳🇿', visaType: '电子签', difficulty: 'medium', region: '大洋洲', desc: '在线申请，材料要求中等，审批约20个工作日', aliases: ['xin xi lan', 'xinxilan', '纽西兰'] },
  // ---- 非洲（1） ----
  { id: 'south-africa', zh: '南非', en: 'South Africa', flag: '🇿🇦', visaType: '电子签', difficulty: 'medium', region: '非洲', desc: '需递交纸质材料到签证中心，审批约10个工作日' },

  // ═════════════ 五、港澳台（3） ═════════════
  { id: 'hong-kong', zh: '香港', en: 'Hong Kong', flag: '🇭🇰', visaType: '需通行证', difficulty: 'easy', region: '亚洲', desc: '港澳通行证 + 签注，部分城市可自助签注', aliases: ['xiang gang', 'xianggang', 'hk'] },
  { id: 'macau', zh: '澳门', en: 'Macau', flag: '🇲🇴', visaType: '需通行证', difficulty: 'easy', region: '亚洲', desc: '港澳通行证 + 签注，多数城市可自助签注', aliases: ['macao', 'ao men', 'aomen', '澳门'] },
  { id: 'taiwan', zh: '台湾', en: 'Taiwan', flag: '🏝️', visaType: '需通行证', difficulty: 'easy', region: '亚洲', desc: '大陆居民需办入台证 + 大通证，目前个人游部分开放', aliases: ['tai wan', 'taiwan', 'tw', '宝岛'] },
]

/** 分组顺序（互免/单免/落地/电子/通行证；区域顺序）——来自 visa-group-order.ts，此处 re-export 兼容旧调用方 */
export { VISA_TYPE_ORDER, REGION_ORDER } from './visa-group-order'
