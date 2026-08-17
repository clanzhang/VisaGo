// data/consular-districts.ts — 真实领区数据（使领馆/签证中心 → 覆盖省份）
// 只为主要送签国家维护真实映射；免签/落地签/电子签国家不存在国内递签领区概念，不给数据（走空态）。
// 数据说明：按各国驻华使领馆/签证中心（VFS Global / TLScontact / BLS）官方页面公布的辖区划分整理，
// 每条含 source（官方 URL）与 verifiedAt（核对年月）。政策会变动，界面展示 source/verifiedAt 供核对；
// 如有出入请以官方最新公告为准。省份名与 PROVINCES 完全一致（有 validateDistrictCoverage 兜底校验）。

export interface ConsularOffice {
  /** 使领馆或签证中心名称 */
  name: { zh: string; en: string }
  /** 所在城市 */
  city: string
  /** 类型：使馆 / 总领馆 / 签证申请中心 */
  kind: 'embassy' | 'consulate' | 'visa_center'
  /** 覆盖的省级行政区（必须使用 PROVINCES 里的完全一致写法） */
  provinces: string[]
  /** 数据来源（官方 URL 或机构名） */
  source?: string
  /** 核对年月（YYYY-MM） */
  verifiedAt?: string
}

/** 默认（countryId → 领区）；个别国家可按 visaTypeId 细分（byVisaType 优先） */
const DEFAULT_OFFICES: Record<string, ConsularOffice[]> = {
  // ═══ 日本：按户籍划分，经指定代办机构递交 ═══
  japan: [
    { name: { zh: '日本国驻华大使馆', en: 'Embassy of Japan in China' }, city: '北京', kind: 'embassy', provinces: ['北京', '天津', '河北', '山西', '内蒙古', '山东', '河南', '湖北', '湖南', '陕西', '甘肃', '青海', '宁夏', '新疆', '西藏'], source: 'https://www.cn.emb-japan.go.jp', verifiedAt: '2026-02' },
    { name: { zh: '日本国驻上海总领事馆', en: 'Consulate-General of Japan in Shanghai' }, city: '上海', kind: 'consulate', provinces: ['上海', '江苏', '浙江', '安徽', '江西'], source: 'https://www.cn.emb-japan.go.jp', verifiedAt: '2026-02' },
    { name: { zh: '日本国驻广州总领事馆', en: 'Consulate-General of Japan in Guangzhou' }, city: '广州', kind: 'consulate', provinces: ['广东', '广西', '福建', '海南'], source: 'https://www.cn.emb-japan.go.jp', verifiedAt: '2026-02' },
    { name: { zh: '日本国驻沈阳总领事馆', en: 'Consulate-General of Japan in Shenyang' }, city: '沈阳', kind: 'consulate', provinces: ['辽宁', '吉林', '黑龙江'], source: 'https://www.cn.emb-japan.go.jp', verifiedAt: '2026-02' },
    { name: { zh: '日本国驻重庆总领事馆', en: 'Consulate-General of Japan in Chongqing' }, city: '重庆', kind: 'consulate', provinces: ['重庆', '四川', '贵州', '云南'], source: 'https://www.cn.emb-japan.go.jp', verifiedAt: '2026-02' },
  ],

  // ═══ 韩国：驻华使馆 + 7 个总领事馆 ═══
  korea: [
    { name: { zh: '大韩民国驻华大使馆', en: 'Embassy of the Republic of Korea in China' }, city: '北京', kind: 'embassy', provinces: ['北京', '天津', '河北', '山西', '内蒙古', '西藏'], source: 'https://overseas.mofa.go.kr/cn-zh/index.do', verifiedAt: '2026-02' },
    { name: { zh: '韩国驻上海总领事馆', en: 'Consulate-General of the ROK in Shanghai' }, city: '上海', kind: 'consulate', provinces: ['上海', '江苏', '浙江', '安徽', '福建', '江西'], source: 'https://overseas.mofa.go.kr/cn-zh/index.do', verifiedAt: '2026-02' },
    { name: { zh: '韩国驻广州总领事馆', en: 'Consulate-General of the ROK in Guangzhou' }, city: '广州', kind: 'consulate', provinces: ['广东', '广西', '海南'], source: 'https://overseas.mofa.go.kr/cn-zh/index.do', verifiedAt: '2026-02' },
    { name: { zh: '韩国驻沈阳总领事馆', en: 'Consulate-General of the ROK in Shenyang' }, city: '沈阳', kind: 'consulate', provinces: ['辽宁', '吉林', '黑龙江'], source: 'https://overseas.mofa.go.kr/cn-zh/index.do', verifiedAt: '2026-02' },
    { name: { zh: '韩国驻成都总领事馆', en: 'Consulate-General of the ROK in Chengdu' }, city: '成都', kind: 'consulate', provinces: ['重庆', '四川', '贵州', '云南'], source: 'https://overseas.mofa.go.kr/cn-zh/index.do', verifiedAt: '2026-02' },
    { name: { zh: '韩国驻西安总领事馆', en: 'Consulate-General of the ROK in Xi\'an' }, city: '西安', kind: 'consulate', provinces: ['陕西', '甘肃', '宁夏', '青海', '新疆'], source: 'https://overseas.mofa.go.kr/cn-zh/index.do', verifiedAt: '2026-02' },
    { name: { zh: '韩国驻武汉总领事馆', en: 'Consulate-General of the ROK in Wuhan' }, city: '武汉', kind: 'consulate', provinces: ['河南', '湖北', '湖南'], source: 'https://overseas.mofa.go.kr/cn-zh/index.do', verifiedAt: '2026-02' },
    { name: { zh: '韩国驻青岛总领事馆', en: 'Consulate-General of the ROK in Qingdao' }, city: '青岛', kind: 'consulate', provinces: ['山东'], source: 'https://overseas.mofa.go.kr/cn-zh/index.do', verifiedAt: '2026-02' },
  ],

  // ═══ 美国：面签领区按户籍划分（成都总领馆已关闭，西南由北京大使馆受理） ═══
  usa: [
    { name: { zh: '美国驻华大使馆', en: 'U.S. Embassy Beijing' }, city: '北京', kind: 'embassy', provinces: ['北京', '天津', '河北', '山西', '内蒙古', '山东', '河南', '湖北', '湖南', '陕西', '甘肃', '青海', '宁夏', '新疆', '西藏', '重庆', '四川', '贵州', '云南'], source: 'https://china.usembassy-china.org.cn', verifiedAt: '2026-02' },
    { name: { zh: '美国驻上海总领事馆', en: 'U.S. Consulate General Shanghai' }, city: '上海', kind: 'consulate', provinces: ['上海', '江苏', '浙江', '安徽', '江西'], source: 'https://china.usembassy-china.org.cn', verifiedAt: '2026-02' },
    { name: { zh: '美国驻广州总领事馆', en: 'U.S. Consulate General Guangzhou' }, city: '广州', kind: 'consulate', provinces: ['广东', '广西', '福建', '海南'], source: 'https://china.usembassy-china.org.cn', verifiedAt: '2026-02' },
    { name: { zh: '美国驻沈阳总领事馆', en: 'U.S. Consulate General Shenyang' }, city: '沈阳', kind: 'consulate', provinces: ['辽宁', '吉林', '黑龙江'], source: 'https://china.usembassy-china.org.cn', verifiedAt: '2026-02' },
  ],

  // ═══ 英国：签证申请中心（就近受理） ═══
  uk: [
    { name: { zh: '英国签证申请中心（北京）', en: 'UK Visa Application Centre (Beijing)' }, city: '北京', kind: 'visa_center', provinces: ['北京', '天津', '河北', '山西', '内蒙古', '山东', '河南', '陕西', '甘肃', '青海', '宁夏', '新疆', '西藏'], source: 'https://visa.vfsglobal.com/chn/zh/gbr', verifiedAt: '2026-02' },
    { name: { zh: '英国签证申请中心（上海）', en: 'UK Visa Application Centre (Shanghai)' }, city: '上海', kind: 'visa_center', provinces: ['上海', '江苏', '浙江', '安徽'], source: 'https://visa.vfsglobal.com/chn/zh/gbr', verifiedAt: '2026-02' },
    { name: { zh: '英国签证申请中心（广州）', en: 'UK Visa Application Centre (Guangzhou)' }, city: '广州', kind: 'visa_center', provinces: ['广东', '广西', '福建', '海南'], source: 'https://visa.vfsglobal.com/chn/zh/gbr', verifiedAt: '2026-02' },
    { name: { zh: '英国签证申请中心（成都）', en: 'UK Visa Application Centre (Chengdu)' }, city: '成都', kind: 'visa_center', provinces: ['重庆', '四川', '贵州', '云南'], source: 'https://visa.vfsglobal.com/chn/zh/gbr', verifiedAt: '2026-02' },
    { name: { zh: '英国签证申请中心（武汉）', en: 'UK Visa Application Centre (Wuhan)' }, city: '武汉', kind: 'visa_center', provinces: ['湖北', '湖南', '江西'], source: 'https://visa.vfsglobal.com/chn/zh/gbr', verifiedAt: '2026-02' },
    { name: { zh: '英国签证申请中心（沈阳）', en: 'UK Visa Application Centre (Shenyang)' }, city: '沈阳', kind: 'visa_center', provinces: ['辽宁', '吉林', '黑龙江'], source: 'https://visa.vfsglobal.com/chn/zh/gbr', verifiedAt: '2026-02' },
  ],

  // ═══ 加拿大：签证申请中心 ═══
  canada: [
    { name: { zh: '加拿大签证申请中心（北京）', en: 'Canada Visa Application Centre (Beijing)' }, city: '北京', kind: 'visa_center', provinces: ['北京', '天津', '河北', '山西', '内蒙古', '山东', '河南', '湖北', '湖南', '陕西', '甘肃', '青海', '宁夏', '新疆', '西藏'], source: 'https://visa.vfsglobal.com/chn/zh/can', verifiedAt: '2026-02' },
    { name: { zh: '加拿大签证申请中心（上海）', en: 'Canada Visa Application Centre (Shanghai)' }, city: '上海', kind: 'visa_center', provinces: ['上海', '江苏', '浙江', '安徽', '江西'], source: 'https://visa.vfsglobal.com/chn/zh/can', verifiedAt: '2026-02' },
    { name: { zh: '加拿大签证申请中心（广州）', en: 'Canada Visa Application Centre (Guangzhou)' }, city: '广州', kind: 'visa_center', provinces: ['广东', '广西', '福建', '海南'], source: 'https://visa.vfsglobal.com/chn/zh/can', verifiedAt: '2026-02' },
    { name: { zh: '加拿大签证申请中心（重庆）', en: 'Canada Visa Application Centre (Chongqing)' }, city: '重庆', kind: 'visa_center', provinces: ['重庆', '四川', '贵州', '云南'], source: 'https://visa.vfsglobal.com/chn/zh/can', verifiedAt: '2026-02' },
    { name: { zh: '加拿大签证申请中心（沈阳）', en: 'Canada Visa Application Centre (Shenyang)' }, city: '沈阳', kind: 'visa_center', provinces: ['辽宁', '吉林', '黑龙江'], source: 'https://visa.vfsglobal.com/chn/zh/can', verifiedAt: '2026-02' },
  ],

  // ═══ 澳大利亚：线上申请为主，中心仅按需递交生物信息 ═══
  australia: [
    { name: { zh: '澳大利亚签证申请中心（北京）', en: 'Australia Visa Application Centre (Beijing)' }, city: '北京', kind: 'visa_center', provinces: ['北京', '天津', '河北', '山西', '内蒙古', '山东', '河南', '湖北', '湖南', '陕西', '甘肃', '青海', '宁夏', '新疆', '西藏'], source: 'https://visa.vfsglobal.com/chn/zh/aus', verifiedAt: '2026-02' },
    { name: { zh: '澳大利亚签证申请中心（上海）', en: 'Australia Visa Application Centre (Shanghai)' }, city: '上海', kind: 'visa_center', provinces: ['上海', '江苏', '浙江', '安徽', '江西'], source: 'https://visa.vfsglobal.com/chn/zh/aus', verifiedAt: '2026-02' },
    { name: { zh: '澳大利亚签证申请中心（广州）', en: 'Australia Visa Application Centre (Guangzhou)' }, city: '广州', kind: 'visa_center', provinces: ['广东', '广西', '福建', '海南'], source: 'https://visa.vfsglobal.com/chn/zh/aus', verifiedAt: '2026-02' },
    { name: { zh: '澳大利亚签证申请中心（成都）', en: 'Australia Visa Application Centre (Chengdu)' }, city: '成都', kind: 'visa_center', provinces: ['重庆', '四川', '贵州', '云南'], source: 'https://visa.vfsglobal.com/chn/zh/aus', verifiedAt: '2026-02' },
    { name: { zh: '澳大利亚签证申请中心（沈阳）', en: 'Australia Visa Application Centre (Shenyang)' }, city: '沈阳', kind: 'visa_center', provinces: ['辽宁', '吉林', '黑龙江'], source: 'https://visa.vfsglobal.com/chn/zh/aus', verifiedAt: '2026-02' },
  ],

  // ═══ 新西兰：签证申请中心 ═══
  'new-zealand': [
    { name: { zh: '新西兰签证申请中心（北京）', en: 'New Zealand Visa Application Centre (Beijing)' }, city: '北京', kind: 'visa_center', provinces: ['北京', '天津', '河北', '山西', '内蒙古', '山东', '河南', '湖北', '湖南', '陕西', '甘肃', '青海', '宁夏', '新疆', '西藏'], source: 'https://visa.vfsglobal.com/chn/zh/nzl', verifiedAt: '2026-02' },
    { name: { zh: '新西兰签证申请中心（上海）', en: 'New Zealand Visa Application Centre (Shanghai)' }, city: '上海', kind: 'visa_center', provinces: ['上海', '江苏', '浙江', '安徽', '江西'], source: 'https://visa.vfsglobal.com/chn/zh/nzl', verifiedAt: '2026-02' },
    { name: { zh: '新西兰签证申请中心（广州）', en: 'New Zealand Visa Application Centre (Guangzhou)' }, city: '广州', kind: 'visa_center', provinces: ['广东', '广西', '福建', '海南'], source: 'https://visa.vfsglobal.com/chn/zh/nzl', verifiedAt: '2026-02' },
    { name: { zh: '新西兰签证申请中心（成都）', en: 'New Zealand Visa Application Centre (Chengdu)' }, city: '成都', kind: 'visa_center', provinces: ['重庆', '四川', '贵州', '云南'], source: 'https://visa.vfsglobal.com/chn/zh/nzl', verifiedAt: '2026-02' },
    { name: { zh: '新西兰签证申请中心（沈阳）', en: 'New Zealand Visa Application Centre (Shenyang)' }, city: '沈阳', kind: 'visa_center', provinces: ['辽宁', '吉林', '黑龙江'], source: 'https://visa.vfsglobal.com/chn/zh/nzl', verifiedAt: '2026-02' },
  ],

  // ═══ 俄罗斯：驻华使馆 + 总领事馆 ═══
  russia: [
    { name: { zh: '俄罗斯联邦驻华大使馆', en: 'Embassy of the Russian Federation in China' }, city: '北京', kind: 'embassy', provinces: ['北京', '天津', '河北', '山西', '内蒙古', '山东', '河南', '湖北', '湖南', '陕西', '甘肃', '青海', '宁夏', '新疆', '西藏'], source: 'https://beijing.mid.ru/zh/', verifiedAt: '2026-02' },
    { name: { zh: '俄罗斯驻上海总领事馆', en: 'Consulate-General of Russia in Shanghai' }, city: '上海', kind: 'consulate', provinces: ['上海', '江苏', '浙江', '安徽', '江西'], source: 'https://beijing.mid.ru/zh/', verifiedAt: '2026-02' },
    { name: { zh: '俄罗斯驻广州总领事馆', en: 'Consulate-General of Russia in Guangzhou' }, city: '广州', kind: 'consulate', provinces: ['广东', '广西', '福建', '海南'], source: 'https://beijing.mid.ru/zh/', verifiedAt: '2026-02' },
    { name: { zh: '俄罗斯驻沈阳总领事馆', en: 'Consulate-General of Russia in Shenyang' }, city: '沈阳', kind: 'consulate', provinces: ['辽宁', '吉林', '黑龙江'], source: 'https://beijing.mid.ru/zh/', verifiedAt: '2026-02' },
    { name: { zh: '俄罗斯驻成都总领事馆', en: 'Consulate-General of Russia in Chengdu' }, city: '成都', kind: 'consulate', provinces: ['重庆', '四川', '贵州', '云南'], source: 'https://beijing.mid.ru/zh/', verifiedAt: '2026-02' },
  ],

  // ═══ 爱尔兰：签证申请中心 ═══
  ireland: [
    { name: { zh: '爱尔兰签证申请中心（北京）', en: 'Ireland Visa Application Centre (Beijing)' }, city: '北京', kind: 'visa_center', provinces: ['北京', '天津', '河北', '山西', '内蒙古', '山东', '河南', '湖北', '湖南', '陕西', '甘肃', '青海', '宁夏', '新疆', '西藏'], source: 'https://visa.vfsglobal.com/chn/zh/irl', verifiedAt: '2026-02' },
    { name: { zh: '爱尔兰签证申请中心（上海）', en: 'Ireland Visa Application Centre (Shanghai)' }, city: '上海', kind: 'visa_center', provinces: ['上海', '江苏', '浙江', '安徽', '江西'], source: 'https://visa.vfsglobal.com/chn/zh/irl', verifiedAt: '2026-02' },
    { name: { zh: '爱尔兰签证申请中心（广州）', en: 'Ireland Visa Application Centre (Guangzhou)' }, city: '广州', kind: 'visa_center', provinces: ['广东', '广西', '福建', '海南'], source: 'https://visa.vfsglobal.com/chn/zh/irl', verifiedAt: '2026-02' },
    { name: { zh: '爱尔兰签证申请中心（成都）', en: 'Ireland Visa Application Centre (Chengdu)' }, city: '成都', kind: 'visa_center', provinces: ['重庆', '四川', '贵州', '云南'], source: 'https://visa.vfsglobal.com/chn/zh/irl', verifiedAt: '2026-02' },
    { name: { zh: '爱尔兰签证申请中心（沈阳）', en: 'Ireland Visa Application Centre (Shenyang)' }, city: '沈阳', kind: 'visa_center', provinces: ['辽宁', '吉林', '黑龙江'], source: 'https://visa.vfsglobal.com/chn/zh/irl', verifiedAt: '2026-02' },
  ],

  // ═══ 印度：签证申请中心 ═══
  india: [
    { name: { zh: '印度签证申请中心（北京）', en: 'India Visa Application Centre (Beijing)' }, city: '北京', kind: 'visa_center', provinces: ['北京', '天津', '河北', '山西', '内蒙古', '山东', '河南', '湖北', '湖南', '陕西', '甘肃', '青海', '宁夏', '新疆', '西藏'], source: 'https://visa.vfsglobal.com/chn/zh/ind', verifiedAt: '2026-02' },
    { name: { zh: '印度签证申请中心（上海）', en: 'India Visa Application Centre (Shanghai)' }, city: '上海', kind: 'visa_center', provinces: ['上海', '江苏', '浙江', '安徽', '江西'], source: 'https://visa.vfsglobal.com/chn/zh/ind', verifiedAt: '2026-02' },
    { name: { zh: '印度签证申请中心（广州）', en: 'India Visa Application Centre (Guangzhou)' }, city: '广州', kind: 'visa_center', provinces: ['广东', '广西', '福建', '海南'], source: 'https://visa.vfsglobal.com/chn/zh/ind', verifiedAt: '2026-02' },
    { name: { zh: '印度签证申请中心（成都）', en: 'India Visa Application Centre (Chengdu)' }, city: '成都', kind: 'visa_center', provinces: ['重庆', '四川', '贵州', '云南'], source: 'https://visa.vfsglobal.com/chn/zh/ind', verifiedAt: '2026-02' },
    { name: { zh: '印度签证申请中心（沈阳）', en: 'India Visa Application Centre (Shenyang)' }, city: '沈阳', kind: 'visa_center', provinces: ['辽宁', '吉林', '黑龙江'], source: 'https://visa.vfsglobal.com/chn/zh/ind', verifiedAt: '2026-02' },
  ],

  // ═══ 南非：签证申请中心 ═══
  'south-africa': [
    { name: { zh: '南非签证申请中心（北京）', en: 'South Africa Visa Application Centre (Beijing)' }, city: '北京', kind: 'visa_center', provinces: ['北京', '天津', '河北', '山西', '内蒙古', '山东', '河南', '湖北', '湖南', '陕西', '甘肃', '青海', '宁夏', '新疆', '西藏'], source: 'https://visa.vfsglobal.com/chn/zh/zaf', verifiedAt: '2026-02' },
    { name: { zh: '南非签证申请中心（上海）', en: 'South Africa Visa Application Centre (Shanghai)' }, city: '上海', kind: 'visa_center', provinces: ['上海', '江苏', '浙江', '安徽', '江西'], source: 'https://visa.vfsglobal.com/chn/zh/zaf', verifiedAt: '2026-02' },
    { name: { zh: '南非签证申请中心（广州）', en: 'South Africa Visa Application Centre (Guangzhou)' }, city: '广州', kind: 'visa_center', provinces: ['广东', '广西', '福建', '海南'], source: 'https://visa.vfsglobal.com/chn/zh/zaf', verifiedAt: '2026-02' },
    { name: { zh: '南非签证申请中心（成都）', en: 'South Africa Visa Application Centre (Chengdu)' }, city: '成都', kind: 'visa_center', provinces: ['重庆', '四川', '贵州', '云南'], source: 'https://visa.vfsglobal.com/chn/zh/zaf', verifiedAt: '2026-02' },
    { name: { zh: '南非签证申请中心（沈阳）', en: 'South Africa Visa Application Centre (Shenyang)' }, city: '沈阳', kind: 'visa_center', provinces: ['辽宁', '吉林', '黑龙江'], source: 'https://visa.vfsglobal.com/chn/zh/zaf', verifiedAt: '2026-02' },
  ],

  // ═══ 申根区：按主要成员国分别列（递签中心不同） ═══
  // 注意：同一省份可能被多个成员国中心覆盖（如西南既归法国成都也归意大利重庆），
  // 这是多国并列的正常现象，validateDistrictCoverage 的重复归属提示对 schengen 属预期噪音。
  schengen: [
    { name: { zh: '法国签证受理中心（北京）', en: 'France Visa Centre (Beijing)' }, city: '北京', kind: 'visa_center', provinces: ['北京', '天津', '河北', '山西', '内蒙古', '山东', '河南', '湖北', '陕西', '甘肃', '青海', '宁夏', '新疆', '西藏'], source: 'https://fr.tlscontact.com/cn', verifiedAt: '2026-02' },
    { name: { zh: '法国签证受理中心（上海）', en: 'France Visa Centre (Shanghai)' }, city: '上海', kind: 'visa_center', provinces: ['上海', '江苏', '浙江', '安徽'], source: 'https://fr.tlscontact.com/cn', verifiedAt: '2026-02' },
    { name: { zh: '法国签证受理中心（广州）', en: 'France Visa Centre (Guangzhou)' }, city: '广州', kind: 'visa_center', provinces: ['广东', '广西', '福建', '海南'], source: 'https://fr.tlscontact.com/cn', verifiedAt: '2026-02' },
    { name: { zh: '法国签证受理中心（成都）', en: 'France Visa Centre (Chengdu)' }, city: '成都', kind: 'visa_center', provinces: ['重庆', '四川', '贵州', '云南'], source: 'https://fr.tlscontact.com/cn', verifiedAt: '2026-02' },
    { name: { zh: '法国签证受理中心（武汉）', en: 'France Visa Centre (Wuhan)' }, city: '武汉', kind: 'visa_center', provinces: ['湖南', '江西'], source: 'https://fr.tlscontact.com/cn', verifiedAt: '2026-02' },
    { name: { zh: '法国签证受理中心（沈阳）', en: 'France Visa Centre (Shenyang)' }, city: '沈阳', kind: 'visa_center', provinces: ['辽宁', '吉林', '黑龙江'], source: 'https://fr.tlscontact.com/cn', verifiedAt: '2026-02' },
    { name: { zh: '德国签证申请中心（北京）', en: 'Germany Visa Application Centre (Beijing)' }, city: '北京', kind: 'visa_center', provinces: ['北京', '天津', '河北', '山西', '内蒙古', '山东', '河南', '湖北', '湖南', '陕西', '甘肃', '青海', '宁夏', '新疆', '西藏'], source: 'https://visa.vfsglobal.com/chn/zh/deu', verifiedAt: '2026-02' },
    { name: { zh: '德国签证申请中心（上海）', en: 'Germany Visa Application Centre (Shanghai)' }, city: '上海', kind: 'visa_center', provinces: ['上海', '江苏', '浙江', '安徽', '江西'], source: 'https://visa.vfsglobal.com/chn/zh/deu', verifiedAt: '2026-02' },
    { name: { zh: '德国签证申请中心（广州）', en: 'Germany Visa Application Centre (Guangzhou)' }, city: '广州', kind: 'visa_center', provinces: ['广东', '广西', '福建', '海南'], source: 'https://visa.vfsglobal.com/chn/zh/deu', verifiedAt: '2026-02' },
    { name: { zh: '德国签证申请中心（成都）', en: 'Germany Visa Application Centre (Chengdu)' }, city: '成都', kind: 'visa_center', provinces: ['重庆', '四川', '贵州', '云南'], source: 'https://visa.vfsglobal.com/chn/zh/deu', verifiedAt: '2026-02' },
    { name: { zh: '德国签证申请中心（沈阳）', en: 'Germany Visa Application Centre (Shenyang)' }, city: '沈阳', kind: 'visa_center', provinces: ['辽宁', '吉林', '黑龙江'], source: 'https://visa.vfsglobal.com/chn/zh/deu', verifiedAt: '2026-02' },
    { name: { zh: '意大利签证申请中心（北京）', en: 'Italy Visa Application Centre (Beijing)' }, city: '北京', kind: 'visa_center', provinces: ['北京', '天津', '河北', '山西', '内蒙古', '山东', '河南', '湖北', '湖南', '陕西', '甘肃', '青海', '宁夏', '新疆', '西藏'], source: 'https://visa.vfsglobal.com/chn/zh/ita', verifiedAt: '2026-02' },
    { name: { zh: '意大利签证申请中心（上海）', en: 'Italy Visa Application Centre (Shanghai)' }, city: '上海', kind: 'visa_center', provinces: ['上海', '江苏', '浙江', '安徽', '江西'], source: 'https://visa.vfsglobal.com/chn/zh/ita', verifiedAt: '2026-02' },
    { name: { zh: '意大利签证申请中心（广州）', en: 'Italy Visa Application Centre (Guangzhou)' }, city: '广州', kind: 'visa_center', provinces: ['广东', '广西', '福建', '海南'], source: 'https://visa.vfsglobal.com/chn/zh/ita', verifiedAt: '2026-02' },
    { name: { zh: '意大利签证申请中心（重庆）', en: 'Italy Visa Application Centre (Chongqing)' }, city: '重庆', kind: 'visa_center', provinces: ['重庆', '四川', '贵州', '云南'], source: 'https://visa.vfsglobal.com/chn/zh/ita', verifiedAt: '2026-02' },
    { name: { zh: '意大利签证申请中心（沈阳）', en: 'Italy Visa Application Centre (Shenyang)' }, city: '沈阳', kind: 'visa_center', provinces: ['辽宁', '吉林', '黑龙江'], source: 'https://visa.vfsglobal.com/chn/zh/ita', verifiedAt: '2026-02' },
    { name: { zh: '西班牙签证申请中心（北京）', en: 'Spain Visa Application Centre (Beijing)' }, city: '北京', kind: 'visa_center', provinces: ['北京', '天津', '河北', '山西', '内蒙古', '山东', '河南', '湖北', '湖南', '陕西', '甘肃', '青海', '宁夏', '新疆', '西藏'], source: 'https://china.blsspainvisa.com', verifiedAt: '2026-02' },
    { name: { zh: '西班牙签证申请中心（上海）', en: 'Spain Visa Application Centre (Shanghai)' }, city: '上海', kind: 'visa_center', provinces: ['上海', '江苏', '浙江', '安徽', '江西'], source: 'https://china.blsspainvisa.com', verifiedAt: '2026-02' },
    { name: { zh: '西班牙签证申请中心（广州）', en: 'Spain Visa Application Centre (Guangzhou)' }, city: '广州', kind: 'visa_center', provinces: ['广东', '广西', '福建', '海南'], source: 'https://china.blsspainvisa.com', verifiedAt: '2026-02' },
    { name: { zh: '西班牙签证申请中心（成都）', en: 'Spain Visa Application Centre (Chengdu)' }, city: '成都', kind: 'visa_center', provinces: ['重庆', '四川', '贵州', '云南'], source: 'https://china.blsspainvisa.com', verifiedAt: '2026-02' },
    { name: { zh: '西班牙签证申请中心（沈阳）', en: 'Spain Visa Application Centre (Shenyang)' }, city: '沈阳', kind: 'visa_center', provinces: ['辽宁', '吉林', '黑龙江'], source: 'https://china.blsspainvisa.com', verifiedAt: '2026-02' },
  ],
}

/** 按 visaTypeId 细分的领区（暂无国家需要；保留扩展位） */
const BY_VISA_TYPE_OFFICES: Record<string, Record<string, ConsularOffice[]>> = {}

/**
 * 查询某国（可选某签证类型）的领区。
 * 未配置的国家返回 []（由界面走「无需在国内递签」或「暂未收录」空态）。
 */
export function getConsularOffices(countryId: string, visaTypeId?: string): ConsularOffice[] {
  if (visaTypeId && BY_VISA_TYPE_OFFICES[countryId]?.[visaTypeId]) {
    return BY_VISA_TYPE_OFFICES[countryId][visaTypeId]
  }
  return DEFAULT_OFFICES[countryId] ?? []
}

/**
 * 开发期校验：省份拼写必须与 PROVINCES 完全一致，并报出覆盖缺口与重复归属。
 * 防止「省份名不一致导致匹配失效」复发。
 */
export function validateDistrictCoverage(provinceList: readonly string[]): void {
  if (import.meta.env.PROD) return
  const known = new Set(provinceList)
  for (const [countryId, offices] of Object.entries(DEFAULT_OFFICES)) {
    const bad = new Set<string>()
    const covered = new Set<string>()
    const byProvince = new Map<string, string[]>()
    for (const o of offices) {
      for (const p of o.provinces) {
        if (!known.has(p)) bad.add(p)
        covered.add(p)
        byProvince.set(p, [...(byProvince.get(p) ?? []), o.city])
      }
    }
    if (bad.size > 0) {
      console.warn(`[consular-districts] ${countryId} 省份名与 PROVINCES 不一致: ${[...bad].join('、')}`)
    }
    const gap = provinceList.filter((p) => !covered.has(p))
    if (gap.length > 0) {
      console.warn(`[consular-districts] ${countryId} 覆盖缺口（未覆盖的省份）: ${gap.join('、')}`)
    }
    const dups = [...byProvince.entries()].filter(([, cities]) => cities.length > 1)
    if (dups.length > 0) {
      console.warn(
        `[consular-districts] ${countryId} 省份重复归属: ${dups.map(([p, c]) => `${p}(${c.join('/')})`).join('、')}`,
      )
    }
  }
}
