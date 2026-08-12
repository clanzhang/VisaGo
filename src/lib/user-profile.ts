// lib/user-profile.ts — 用户资料库（一次录入，多国复用）
// 持久化：localStorage（兼容 Web 与 Tauri 桌面端）

export interface IDInfo {
  name: string
  idNumber: string
  address: string
}

export interface PassportInfo {
  pinyinName: string
  passportNumber: string
  issueDate: string
  expiryDate: string
}

export interface FamilyMember {
  name: string
  relation: string
  idNumber?: string
}

export interface EmploymentInfo {
  company: string
  position: string
  salary: string
  startDate: string
  companyAddress: string
  companyPhone: string
}

export interface UserProfile {
  // 身份证
  id?: IDInfo
  // 护照
  passport?: PassportInfo
  // 户口本（家庭成员）
  family?: FamilyMember[]
  // 在职信息
  employment?: EmploymentInfo
  // 联系方式
  email?: string
  phone?: string
  homeAddress?: string
}

const STORAGE_KEY = 'visago:user-profile'

export function loadUserProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as UserProfile) : null
  } catch {
    return null
  }
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  } catch {
    /* ignore */
  }
}

/** 检查资料库是否已有某类 OCR 数据 */
export function hasIdData(p: UserProfile | null): boolean {
  return !!p?.id?.idNumber
}

export function hasPassportData(p: UserProfile | null): boolean {
  return !!p?.passport?.passportNumber
}

export function hasFamilyData(p: UserProfile | null): boolean {
  return !!p?.family?.length
}

export function hasEmploymentData(p: UserProfile | null): boolean {
  return !!p?.employment?.company
}

/** 将 OCR 结果合并进资料库 */
export function mergeOcrIntoProfile(
  existing: UserProfile | null,
  kind: 'id' | 'passport' | 'family',
  data: Record<string, unknown>,
): UserProfile {
  const base: UserProfile = existing ?? {}
  if (kind === 'id') {
    base.id = {
      name: String(data.name ?? base.id?.name ?? ''),
      idNumber: String(data.id_number ?? base.id?.idNumber ?? ''),
      address: String(data.home_address ?? data.address ?? base.id?.address ?? ''),
    }
  } else if (kind === 'passport') {
    base.passport = {
      pinyinName: String(data.passport_pinyin ?? data.pinyin_name ?? base.passport?.pinyinName ?? ''),
      passportNumber: String(data.passport_number ?? base.passport?.passportNumber ?? ''),
      issueDate: String(data.passport_issue_date ?? base.passport?.issueDate ?? ''),
      expiryDate: String(data.passport_expiry_date ?? base.passport?.expiryDate ?? ''),
    }
  } else if (kind === 'family') {
    const m: FamilyMember = {
      name: String(data.name ?? ''),
      relation: String(data.relation ?? '家庭成员'),
      idNumber: data.id_number ? String(data.id_number) : undefined,
    }
    base.family = [...(base.family ?? []), m]
  }
  saveUserProfile(base)
  return base
}
