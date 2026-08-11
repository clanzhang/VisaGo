// data/templates.ts
// 文档模板元数据

import type { TemplateMeta } from '../types'

export const templates: TemplateMeta[] = [
  {
    key: 'itinerary',
    name: { zh: '行程单', en: 'Travel Itinerary' },
    description: { zh: '按天排列的详细行程安排', en: 'Day-by-day travel plan' },
    icon: 'ri:map-2-line',
  },
  {
    key: 'employment',
    name: { zh: '在职证明', en: 'Employment Certificate' },
    description: { zh: '公司抬头、职位、薪资、准假日期', en: 'Company, position, salary, leave' },
    icon: 'ri:briefcase-line',
  },
  {
    key: 'invitation',
    name: { zh: '邀请函', en: 'Invitation Letter' },
    description: { zh: '邀请人与被邀请人信息、关系、行程', en: 'Inviter/invitee info, relation' },
    icon: 'ri:mail-line',
  },
  {
    key: 'cover',
    name: { zh: '个人陈述 / 解释信', en: 'Cover Letter' },
    description: { zh: '旅行目的、行程概述、归国约束力', en: 'Purpose, itinerary, home ties' },
    icon: 'ri:file-add-line',
  },
  {
    key: 'checklist',
    name: { zh: '材料检查清单', en: 'Checklist' },
    description: { zh: '可打印的勾选清单', en: 'Printable checklist' },
    icon: 'ri:list-check',
  },
]

export function getTemplate(key: string): TemplateMeta | undefined {
  return templates.find((t) => t.key === key)
}
