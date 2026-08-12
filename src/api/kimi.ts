// api/kimi.ts — Kimi AI (Moonshot) API 客户端
// Key 保护策略：
//  - Web 模式：通过 Vite dev server 代理 /kimi → Moonshot，Key 在服务端注入
//  - Tauri 模式：调用 Rust 后端 IPC（src-tauri），Key 存于 Rust 端
// 浏览器代码本身不持有 Key。

const TIMEOUT_MS = 30_000

/**
 * 全局串行请求队列：Kimi 账号并发上限较低（约 3），
 * 用队列保证同一时刻只有 1 个请求，避免 429 限流。
 */
let queueChain: Promise<unknown> = Promise.resolve()
function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const run = queueChain.then(fn, fn)
  // 保持链不断
  queueChain = run.catch(() => undefined)
  return run
}

/** 429 限流时等待重试 */
async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let attempt = 0
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn()
    } catch (e) {
      const isRateLimit =
        (e instanceof KimiError && (e.status === 429 || e.message.includes('429'))) ||
        (e instanceof KimiError && e.message.includes('concurrency'))
      if (isRateLimit && attempt < retries) {
        attempt += 1
        await new Promise((r) => setTimeout(r, 1500 * attempt))
        continue
      }
      throw e
    }
  }
}

export interface KimiMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface KimiChatOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  responseFormat?: { type: 'json_object' } | { type: 'text' }
}

export class KimiError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'KimiError'
    this.status = status
  }
}

/**
 * 判断当前是否运行在 Tauri 环境中
 */
export function isTauri(): boolean {
  return typeof (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ !== 'undefined'
}

interface TauriInvoke {
  invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>
}

/** 通过 Tauri v2 注入的全局对象调用 IPC（无需安装 @tauri-apps/api 包） */
function tauriInvoke(): TauriInvoke {
  const tauri = (window as unknown as { __TAURI__?: { core?: TauriInvoke } }).__TAURI__
  if (tauri?.core?.invoke) return tauri.core
  // 回退：直接调用全局 invoke（Tauri v1 兼容）
  const anyWin = window as unknown as { invoke?: TauriInvoke['invoke'] }
  if (typeof anyWin.invoke === 'function') {
    return { invoke: anyWin.invoke }
  }
  throw new KimiError('Tauri IPC 不可用')
}

/**
 * 调用 Kimi Chat Completions。
 * Web 走 Vite 代理，Tauri 走 Rust IPC。
 */
export async function kimiChat(
  messages: KimiMessage[],
  options: KimiChatOptions = {},
): Promise<string> {
  const { model = 'moonshot-v1-8k', temperature = 0.3, maxTokens = 8192, responseFormat } = options

  if (isTauri()) {
    // Tauri 模式：Rust 后端持有 Key，通过 IPC 调用
    return tauriInvoke().invoke('ai_chat', {
      messages,
      options: { model, temperature, maxTokens, responseFormat },
    }) as Promise<string>
  }

  // Web 模式：走 Vite 代理（串行队列 + 429 重试）
  return enqueue(() =>
    withRetry(async () => {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
      try {
        const res = await fetch('/kimi/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
            ...(responseFormat ? { response_format: responseFormat } : {}),
          }),
          signal: controller.signal,
        })

        if (!res.ok) {
          const body = await res.text().catch(() => '')
          throw new KimiError(`Kimi API 请求失败 (${res.status}): ${body.slice(0, 200)}`, res.status)
        }

        const data = await res.json()
        const content = data?.choices?.[0]?.message?.content
        if (typeof content !== 'string' || content.length === 0) {
          throw new KimiError('Kimi 返回内容为空')
        }
        return content
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') {
          throw new KimiError('请求超时（30s），请点击重试')
        }
        throw e
      } finally {
        clearTimeout(timer)
      }
    }),
  )
}

/** 从 Kimi 回复中提取 JSON（容忍 markdown 代码块包裹） */
export function extractJson<T>(raw: string): T {
  let text = raw.trim()
  // 去除 ```json ... ``` 包裹
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fence) text = fence[1].trim()
  // 去掉前后非 JSON 噪音
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start >= 0 && end > start) {
    text = text.slice(start, end + 1)
  }
  try {
    return JSON.parse(text) as T
  } catch {
    throw new KimiError('Kimi 返回内容无法解析为 JSON')
  }
}

/** 结构化 JSON 调用：System Prompt 强制 JSON 输出 */
export async function kimiJson<T>(
  systemPrompt: string,
  userPrompt: string,
  options: KimiChatOptions = {},
): Promise<T> {
  const raw = await kimiChat(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    { ...options, responseFormat: { type: 'json_object' } },
  )
  return extractJson<T>(raw)
}

export const KIMI_MODEL = 'moonshot-v1-8k'
