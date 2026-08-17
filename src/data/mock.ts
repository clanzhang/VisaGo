// data/mock.ts — 首页热门目的地静态内容（非统计兜底；统计一律用真实申请记录）
/**
 * 热门目的地卡片（含原有 7 国中的 6 个 + 申根）。
 * fee 从官方费用数据生成（如 ¥715 起 / €90 起 / 免费）。
 */
export const destinations = [
  { id: 'japan', name: '日本', nameEn: 'Japan', flag: '🇯🇵', days: '15天', daysEn: '15 days', desc: '樱花季·东京大阪双城游', descEn: 'Cherry blossom Tokyo-Osaka twin city trip', fee: '¥715 起', difficulty: '易' as const, image: '/images/japan.svg' },
  { id: 'korea', name: '韩国', nameEn: 'South Korea', flag: '🇰🇷', days: '7天', daysEn: '7 days', desc: '首尔购物·济州岛度假', descEn: 'Seoul shopping · Jeju Island getaway', fee: '¥260 起', difficulty: '易' as const, image: '/images/korea.svg' },
  { id: 'thailand', name: '泰国', nameEn: 'Thailand', flag: '🇹🇭', days: '10天', daysEn: '10 days', desc: '曼谷·普吉岛海岛风情', descEn: 'Bangkok & Phuket island vibes', fee: '฿1,000 起', difficulty: '易' as const, image: '/images/thailand.svg' },
  { id: 'schengen', name: '申根', nameEn: 'Schengen', flag: '🇪🇺', days: '20天', daysEn: '20 days', desc: '法瑞意·欧洲多国深度游', descEn: 'France-Switzerland-Italy deep dive', fee: '€90 起', difficulty: '难' as const, image: '/images/schengen.svg' },
  { id: 'usa', name: '美国', nameEn: 'United States', flag: '🇺🇸', days: '15天', daysEn: '15 days', desc: '美西自驾·纽约都市之旅', descEn: 'US West road trip · New York city', fee: '$185 起', difficulty: '难' as const, image: '/images/usa.svg' },
  { id: 'uk', name: '英国', nameEn: 'United Kingdom', flag: '🇬🇧', days: '12天', daysEn: '12 days', desc: '伦敦·爱丁堡英伦风情', descEn: 'London · Edinburgh British charm', fee: '£135 起', difficulty: '中' as const, image: '/images/uk.svg' },
  { id: 'hong-kong', name: '香港', nameEn: 'Hong Kong', flag: '🇭🇰', days: '3-7天', daysEn: '3-7 days', desc: '港澳通行证·购物美食迪士尼', descEn: 'Permit, shopping, food & Disneyland', fee: '¥80 起', difficulty: '易' as const, image: '/images/hong-kong.svg' },
  { id: 'taiwan', name: '台湾', nameEn: 'Taiwan', flag: '🇨🇳', days: '5-10天', daysEn: '5-10 days', desc: '入台证·阿里山日月潭垦丁', descEn: 'Entry permit · Alishan, Sun Moon Lake & Kenting', fee: '¥90 起', difficulty: '易' as const, image: '/images/taiwan.svg' },
]

