// types/index.ts — 保留原有签证数据结构

export interface Localized {
  zh: string
  en: string
}

export interface Country {
  id: string
  name: Localized
  flag: string
  difficulty: 'easy' | 'medium' | 'hard'
  /** 签证类型：互免签证 / 单方面免签 / 落地签 / 电子签 / 需签证 */
  visaType: '互免签证' | '单方面免签' | '落地签' | '电子签' | '需签证'
  region: string // 亚洲/欧洲/北美/大洋洲
  visaTypes: VisaType[]
  overview: Localized
  visaFree: Localized
  announcements: Announcement[]
}

export interface VisaType {
  id: string
  name: Localized
  category: 'tourist' | 'business' | 'family' | 'transit' | 'student'
  duration: string
  validity: string
  entries: 'single' | 'multiple'
  fee: { amount: number; currency: string }
  serviceFee?: { amount: number; currency: string }
  processingDays: { min: number; max: number }
  needInterview?: boolean
  canApplyOnline?: boolean // 是否支持电子签/在线申请
  acceptPersonal?: boolean // 是否接受个人递签
  targetAudience?: Localized
  consularDistricts: ConsularDistrict[]
  requirements: Requirement[]
  faq: FAQ[]
  tips: Localized
  rejectionReasons: Localized[]
}

export interface ConsularDistrict {
  name: Localized
  city?: string // 使馆所在城市
  provinces: string[]
}

export interface Requirement {
  id: string
  name: Localized
  category: 'basic' | 'identity' | 'financial' | 'travel' | 'extra'
  required: boolean
  format: 'original' | 'copy' | 'both'
  translationRequired: boolean
  notes?: Localized
  /** 适用职业身份：为空则适用所有人；否则限定身份 */
  forOccupation?: Array<'employed' | 'student' | 'retired' | 'freelance'>
}

export interface FAQ {
  question: Localized
  answer: Localized
}

export interface Announcement {
  date: string
  title: Localized
  content: Localized
}

export interface VisaApplication {
  id: string
  countryId: string
  visaTypeId: string
  status: ApplicationStatus
  createdAt: string
  updatedAt: string
  timeline: TimelineNode[]
  notes: string
  /** 递签日期（YYYY-MM-DD），可选 */
  submissionDate?: string
  /** 预计出签日期（YYYY-MM-DD），可选 */
  expectedIssueDate?: string
}

export type ApplicationStatus =
  | 'preparing'
  | 'appointment_booked'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'

export interface TimelineNode {
  status: ApplicationStatus
  date?: string
  note?: string
}

export interface UserProfile {
  name: string
  passportNumber: string
  nationality: string
  birthDate: string
  occupation: 'employed' | 'student' | 'retired' | 'freelance'
  company?: string
  position?: string
  salary?: string
  homeProvince: string
  passportIssuedIn: string
  hasHistoryVisa?: boolean
}

// 文档模板
export interface TravelDay {
  date: string
  city: string
  transport: string
  accommodation: string
  activity: string
}

export interface TripInfo {
  destination: string
  startDate: string
  endDate: string
  flightNumber: string
  hotel: string
}

export interface DocumentData {
  profile: UserProfile
  trip: TripInfo
  days: TravelDay[]
  invitee?: string
  relation?: string
  costBearer?: string
  coverText?: string
}

export type DocumentTemplateKey =
  | 'itinerary'
  | 'employment'
  | 'invitation'
  | 'cover'
  | 'checklist'

export interface TemplateMeta {
  key: DocumentTemplateKey
  name: Localized
  description: Localized
  icon: string
}

// ===== 新增：首页 mock 数据（Dribbble 风格） =====

export interface FeeCategory {
  label: string
  percent: number
  color: string
}

export interface ProgressItem {
  country: string
  flag: string
  progress: number // 0-100
  isTop?: boolean
}
