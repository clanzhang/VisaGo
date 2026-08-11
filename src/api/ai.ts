// api/ai.ts — Kimi AI 接口封装（保留后端 API 结构，可切换真实 Kimi API）
import { generateAnswer } from '@/hooks/useAIAssistant'
import type { Country } from '@/types'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/**
 * 后端 API 接口：VisaGo AI 问答
 * 当前实现为本地知识库引擎（离线可用），
 * 接入真实 Kimi API 时只需替换本函数实现。
 */
export async function requestAIAnswer(question: string, country?: Country): Promise<string> {
  // TODO: 接入真实 Kimi API 端点，例如：
  // const res = await fetch('https://api.moonshot.cn/v1/chat/completions', {...})
  return generateAnswer(question, country)
}
