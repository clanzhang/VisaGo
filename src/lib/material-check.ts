// lib/material-check.ts — 材料状态检测
// 根据用户资料库 + 目标国家配置，返回每项材料的状态

import type { UserProfile } from './user-profile'

export type MaterialStatus = 'ready' | 'auto-generate' | 'need-photo' | 'need-user'

export interface MaterialItem {
  id: string
  name: string
  status: MaterialStatus
  /** 0-100 完成度 */
  progress: number
  /** 操作提示文案 */
  action: string
  /** 状态标签文案 + 样式 */
  label: string
  labelCls: string
}

const STATUS_META: Record<MaterialStatus, { label: string; cls: string }> = {
  ready: { label: '已归档', cls: 'bg-success/10 text-success' },
  'auto-generate': { label: '已生成', cls: 'bg-[#1460A4]/10 text-[#1460A4]' },
  'need-photo': { label: '待拍照', cls: 'bg-amber-500/10 text-amber-600' },
  'need-user': { label: '待上传', cls: 'bg-amber-500/10 text-amber-600' },
}

export const MATERIAL_TEMPLATE: Omit<MaterialItem, 'status' | 'progress' | 'action' | 'label' | 'labelCls'>[] = [
  { id: 'id', name: '身份证' },
  { id: 'passport', name: '护照' },
  { id: 'family', name: '户口本' },
  { id: 'application', name: '签证申请表' },
  { id: 'employment', name: '在职证明' },
  { id: 'itinerary', name: '行程安排' },
  { id: 'photo', name: '证件照' },
  { id: 'bank', name: '银行流水' },
]

function itemOf(
  id: string,
  name: string,
  status: MaterialStatus,
  progress: number,
  action: string,
): MaterialItem {
  const meta = STATUS_META[status]
  return { id, name, status, progress, action, label: meta.label, labelCls: meta.cls }
}

/**
 * 计算 8 项材料状态。
 * - 身份证/户口本/护照：资料库有 OCR 数据 → ready
 * - 申请表/在职证明/行程：auto-generate（可自动生成）
 * - 证件照：need-photo
 * - 银行流水：need-user
 */
export function checkMaterials(profile: UserProfile | null): MaterialItem[] {
  const p = profile
  const hasId = !!p?.id?.idNumber
  const hasPassport = !!p?.passport?.passportNumber
  const hasFamily = !!p?.family?.length
  const hasEmployment = !!p?.employment?.company

  return [
    hasId
      ? itemOf('id', '身份证', 'ready', 100, '已从资料库复用，可预览')
      : itemOf('id', '身份证', 'need-user', 0, '上传身份证扫描件，自动 OCR 提取'),
    hasPassport
      ? itemOf('passport', '护照', 'ready', 100, '已从资料库复用，可预览')
      : itemOf('passport', '护照', 'need-user', 0, '上传护照扫描件，自动 OCR 提取'),
    hasFamily
      ? itemOf('family', '户口本', 'ready', 100, '已从资料库复用，可预览')
      : itemOf('family', '户口本', 'need-user', 0, '上传户口本扫描件，自动 OCR 提取'),
    itemOf('application', '签证申请表', 'auto-generate', 100, '已从护照+资料库自动预填生成'),
    hasEmployment
      ? itemOf('employment', '在职证明', 'auto-generate', 100, '已从在职信息+行程日期套模板生成')
      : itemOf('employment', '在职证明', 'auto-generate', 60, '在职信息不全，已按模板生成，可补全后重新生成'),
    itemOf('itinerary', '行程安排', 'auto-generate', 100, '已由 Kimi 根据目的地+日期生成'),
    itemOf('photo', '证件照', 'need-photo', 0, '拍照或上传，系统自动检测合规性'),
    itemOf('bank', '银行流水', 'need-user', 0, '按指引从银行 APP 导出后上传，自动检查'),
  ]
}

/** 进度百分比 = 已完成项（ready + auto-generate）/ 总数 */
export function materialProgress(items: MaterialItem[]): number {
  if (items.length === 0) return 0
  const done = items.filter((i) => i.status === 'ready' || i.status === 'auto-generate').length
  return Math.round((done / items.length) * 100)
}
