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
}

const QUICK_ACTIONS = ['quickMaterials', 'quickFee', 'quickTime', 'quickReject']

export function AIAssistant({ open, onClose, country }: Props) {
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

  if (!open) return null

  async function ask(q: string) {
    const question = q.trim()
    if (!question || thinking) return
    setMessages((m) => [...m, { role: 'user', content: question }])
    setInput('')
    const answer = await requestAIAnswer(question, country)
    streamAnswer(answer, () => {
      setMessages((m) => [...m, { role: 'assistant', content: answer }])
    })
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-end p-6">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative flex h-[520px] w-[380px] flex-col overflow-hidden rounded-2xl bg-white shadow-card-lg animate-[fadeInUp_0.2s_ease]">
        {/* header */}
        <div className="flex items-center justify-between border-b border-ink/5 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#121C19] text-sm font-bold text-[#39A2B8]">
              K
            </div>
            <div>
              <div className="text-sm font-semibold">{t('ai.title')}</div>
              {country && (
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
    </div>
  )
}
