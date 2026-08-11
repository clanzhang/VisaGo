// api/ai.ts — VisaGo AI 问答接口
// 优先调用真实 Kimi API，失败时回退到本地知识库引擎
import { kimiChat } from '@/api/kimi'
import { aiChatPrompt } from '@/api/prompts'
import { generateAnswer } from '@/hooks/useAIAssistant'
import type { Country } from '@/types'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/**
 * 请求 AI 问答。
 * - Kimi 在线：返回真实 AI 回答（带 30s 超时）
 * - 失败/离线：回退到本地知识库引擎
 */
export async function requestAIAnswer(question: string, country?: Country): Promise<string> {
  try {
    const system = aiChatPrompt(country?.name.zh)
    const ctx = country
      ? `（当前上下文国家：${country.flag} ${country.name.zh}）`
      : ''
    const answer = await kimiChat(
      [
        { role: 'system', content: system },
        { role: 'user', content: `${ctx}${question}` },
      ],
      { temperature: 0.4, maxTokens: 2000 },
    )
    return answer
  } catch {
    // 离线兜底：本地知识库
    return generateAnswer(question, country)
  }
}
