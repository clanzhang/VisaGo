// types/ai.ts — Kimi AI 返回的数据结构
export interface AiRequirement {
  name: string
  required: boolean
  details: string
}

export interface AiVisaType {
  name: string
  category: string
  duration: string
  validity: string
  entries: string
  fee: { amount: number; currency: string }
  serviceFee?: { amount: number; currency: string }
  processingDays: { min: number; max: number }
  needInterview: boolean
  canApplyOnline: boolean
  acceptPersonal: boolean
  requirements?: {
    basic?: AiRequirement[]
    financial?: AiRequirement[]
    identity?: AiRequirement[]
    travel?: AiRequirement[]
  }
  identityRequirements?: {
    employed?: AiRequirement[]
    student?: AiRequirement[]
    retired?: AiRequirement[]
    freelance?: AiRequirement[]
  }
  rejectionReasons?: string[]
}

export interface AiCountryData {
  visaTypes: AiVisaType[]
  consularDistricts?: { name: string; provinces: string[] }[]
  faq?: { question: string; answer: string }[]
  tips?: string
  difficulty?: string
  region?: string
  lastUpdated?: string
}
