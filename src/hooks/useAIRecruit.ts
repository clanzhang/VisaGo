// hooks/useAIRecruit.ts — 申请助手个性化推荐
import { useCallback, useState } from 'react'
import { kimiJson, KimiError } from '@/api/kimi'
import { ASSISTANT_RECOMMEND_PROMPT } from '@/api/prompts'
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

/** 推荐失败分类：invalid_key（Key 问题）/ network（含限流）/ shape（程序 bug） */
export type RecruitErrorKind = 'invalid_key' | 'network' | 'shape'

export interface RecruitError {
  kind: RecruitErrorKind
  message: string
}

/** 申请助手：Kimi 个性化推荐 */
export function useAIRecruit() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<RecruitError | null>(null)

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
        // 8000 token 输出在 8k 模型上（输入+输出）必然超限 → 显式用 32k 模型
        model: 'moonshot-v1-32k',
      })
    } catch (e) {
      if (e instanceof KimiError && e.kind === 'invalid_key') {
        setError({ kind: 'invalid_key', message: e.message })
      } else if (e instanceof KimiError && e.kind === 'shape') {
        // 形状类错误属程序 bug，控制台留定位信息
        console.error('[useAIRecruit] 推荐返回形状异常（程序 bug）:', e.message)
        setError({ kind: 'shape', message: '推荐数据异常，请重试' })
      } else {
        setError({ kind: 'network', message: e instanceof Error ? e.message : '推荐生成失败，请重试' })
      }
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { recommend, loading, error }
}
