// components/visa/AIAssistant.tsx — Kimi AI 助手浮层
import { useEffect, useRef, useState } from 'react'
import { useI18n } from '@/i18n'
import { useStreamingReply, type ChatMessage } from '@/hooks/useAIAssistant'
import { requestAIAnswer } from '@/api/ai'
import type { Country } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  country?: Country
  /** modal（默认，详情页全屏遮罩）| drawer（列表页右侧抽屉，非阻塞，可边看边问） */
  variant?: 'modal' | 'drawer'
  /** 列表页上下文（如当前筛选），drawer 模式下显示在标题下 */
  context?: string
}

const QUICK_ACTIONS = ['quickMaterials', 'quickFee', 'quickTime', 'quickReject']

export function AIAssistant({ open, onClose, country, variant = 'modal', context }: Props) {
  const { t, pickL } = useI18n()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const { text, thinking, streamAnswer } = useStreamingReply()

  useEffect(() => {
    if (open && messages.length === 0) {
      const c = country
      const greeting = c
        ? t('ai.greeting', { c: pickL(c.name) })
        : `${t('ai.subtitle')} 👋`
      setMessages([{ role: 'assistant', content: greeting }])
    }
  }, [open, country, messages.length, t])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, text, thinking])

  // Esc 关闭
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  async function ask(q: string) {
    const question = q.trim()
    if (!question || thinking) return
    setMessages((m) => [...m, { role: 'user', content: question }])
    setInput('')
    const answer = await requestAIAnswer(question, country)
    streamAnswer(answer.content, () => {
      setMessages((m) => [...m, { role: 'assistant', content: answer.content, offline: answer.offline }])
    })
  }

  const panel = (
    <div className="flex h-full flex-col overflow-hidden bg-white">
        {/* header */}
        <div className="flex items-center justify-between border-b border-ink/5 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#121C19] text-sm font-bold text-[#39A2B8]">
              K
            </div>
            <div>
              <div className="text-sm font-semibold">{t('ai.title')}</div>
              {context && (
                <div className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-primary/5 px-2 py-0.5 text-[11px] text-primary">
                  {t('ai.contextLabel')}：{context}
                </div>
              )}
              {!context && country && (
                <div className="text-xs text-ink/60">
                  {country.flag} {pickL(country.name)}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink/60 hover:bg-ink/5 hover:text-ink"
            aria-label={t('ai.close')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* messages */}
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                  m.role === 'user'
                    ? 'rounded-br-md bg-[#121C19] text-white'
                    : 'rounded-bl-md bg-[#F3F4F6] text-ink'
                }`}
              >
                {m.content}
                {m.offline && (
                  <div className="mt-1 text-[10px] text-ink/60">ℹ️ {t('ai.offlineNote')}</div>
                )}
              </div>
            </div>
          ))}
          {thinking && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-[#F3F4F6] px-3.5 py-2.5 text-[13px] text-ink">
                {text}
                <span className="ml-0.5 inline-block animate-pulse">▍</span>
              </div>
            </div>
          )}
        </div>

        {/* quick actions */}
        <div className="flex flex-wrap gap-2 px-5 pb-2">
          {QUICK_ACTIONS.map((k) => (
            <button
              key={k}
              onClick={() => ask(t(`ai.${k}`))}
              className="rounded-full border border-ink/10 px-3 py-1 text-xs text-ink/60 transition-colors hover:border-primary/40 hover:text-primary"
            >
              {t(`ai.${k}`)}
            </button>
          ))}
        </div>

        {/* input */}
        <div className="border-t border-ink/5 p-3">
          <div className="flex items-center gap-2 rounded-xl bg-[#F3F4F6] px-3 py-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && ask(input)}
              placeholder={t('ai.placeholder')}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink/60"
            />
            <button
              onClick={() => ask(input)}
              className="rounded-lg bg-[#121C19] p-1.5 text-white transition-opacity hover:opacity-80"
              aria-label={t('ai.submit')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        </div>
    </div>
  )

  // drawer：右侧抽屉、无遮罩（列表可继续交互）、Esc/关闭按钮退出
  if (variant === 'drawer') {
    return (
      <div className="fixed inset-y-0 right-0 z-40" role="complementary" aria-label={t('ai.title')}>
        <div className="anim-drawer h-full w-[380px] max-w-[92vw] rounded-l-2xl border-l border-ink/5 shadow-float">{panel}</div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-end p-6">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative flex h-[520px] w-[380px] flex-col overflow-hidden rounded-2xl bg-white shadow-card-lg animate-[fadeInUp_0.2s_ease]">
        {panel}
      </div>
    </div>
  )
}
