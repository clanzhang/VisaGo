// hooks/useAIRecruit.ts — 申请助手个性化推荐 + 文档生成
import { useCallback, useState } from 'react'
import { kimiJson } from '@/api/kimi'
import { ASSISTANT_RECOMMEND_PROMPT, DOCUMENT_GENERATE_PROMPT } from '@/api/prompts'
import type { UserProfile } from '@/types'

export interface RecommendResult {
  materials: { name: string; required: boolean; details: string; category: string }[]
  riskTips: string[]
  approvalTips: string[]
  rejectionReasons: string[]
  district: string
  processingEstimate: string
  feeEstimate: string
}

export interface DocumentResult {
  itinerary: { days: { date: string; city: string; transport: string; accommodation: string; activity: string }[] }
  employment: { content: string }
  invitation: { content: string }
  cover: { content: string }
}

/** 申请助手：Kimi 个性化推荐 */
export function useAIRecruit() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const recommend = useCallback(async (args: {
    country: string
    visaType: string
    profile: Partial<UserProfile>
  }): Promise<RecommendResult | null> => {
    setLoading(true)
    setError(null)
    try {
      const prompt = `用户申请：国家=${args.country}，签证类型=${args.visaType}。
用户身份：职业=${args.profile.occupation ?? '在职'}，户籍=${args.profile.homeProvince ?? '未知'}，护照签发地=${args.profile.passportIssuedIn ?? '未知'}。
请生成个性化签证申请方案，输出 JSON。`
      return await kimiJson<RecommendResult>(ASSISTANT_RECOMMEND_PROMPT, prompt, {
        temperature: 0.3,
        maxTokens: 8000,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : '推荐生成失败，请重试')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { recommend, loading, error }
}

/** 资料生成：Kimi 生成文档内容 */
export function useAIDocuments() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async (profile: UserProfile, trip: {
    destination: string
    startDate: string
    endDate: string
    days: number
  }): Promise<DocumentResult | null> => {
    setLoading(true)
    setError(null)
    try {
      const prompt = `用户资料：
姓名=${profile.name}，护照号=${profile.passportNumber}，国籍=${profile.nationality}，
职业=${profile.occupation}，户籍=${profile.homeProvince}。
行程：目的地=${trip.destination}，出发=${trip.startDate}，返回=${trip.endDate}，天数=${trip.days}天。
请生成行程单、在职证明、邀请函、个人陈述的完整内容，输出 JSON。`
      return await kimiJson<DocumentResult>(DOCUMENT_GENERATE_PROMPT, prompt, {
        temperature: 0.4,
        maxTokens: 10000,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : '文档生成失败，请重试')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { generate, loading, error }
}
