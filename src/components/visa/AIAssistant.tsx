// components/visa/AIAssistant.tsx
// AI 浮窗组件（本地知识库问答 + 流式输出）
import { defineComponent, ref, computed, watch, type PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocalizedText } from '../../composables/useVisaQuery'
import {
  generateAnswer,
  useStreamingReply,
  type ChatMessage,
} from '../../composables/useAIAssistant'
import type { Country } from '../../types'

export default defineComponent({
  name: 'AIAssistant',
  props: {
    country: { type: Object as PropType<Country>, default: null },
  },
  setup(props) {
    const { t } = useI18n()
    const { t: lt } = useLocalizedText()
    const open = ref(true)
    const input = ref('')
    const messages = ref<ChatMessage[]>([
      {
        role: 'assistant',
        content: '',
      },
    ])
    const { text, thinking, streamAnswer } = useStreamingReply()

    // 初始化问候语（带国家名）
    const greeting = computed(() => {
      const c = props.country
      if (!c) return t('ai.greeting', { c: '' })
      return t('ai.greeting', { c: lt(c.name) })
    })

    // 首次打开显示问候
    const initialized = ref(false)
    watch(
      [() => props.country, open],
      () => {
        if (open.value && !initialized.value) {
          initialized.value = true
          messages.value = [{ role: 'assistant', content: greeting.value }]
        }
      },
      { immediate: true },
    )

    const quickQuestions = computed(() => [
      { key: 'materials', label: t('ai.quickMaterials'), q: '需要什么材料？' },
      { key: 'fee', label: t('ai.quickFee'), q: '费用多少钱？' },
      { key: 'time', label: t('ai.quickTime'), q: '办理需要多久？' },
      { key: 'reject', label: t('ai.quickReject'), q: '常见拒签原因？' },
    ])

    const ask = (q: string) => {
      const question = q.trim()
      if (!question || thinking.value) return
      messages.value = [...messages.value, { role: 'user', content: question }]
      input.value = ''
      // 生成答案并流式输出
      const answer = generateAnswer(question, props.country ?? undefined)
      streamAnswer(answer, () => {
        messages.value = [...messages.value, { role: 'assistant', content: text.value }]
      })
    }

    const submit = () => ask(input.value)

    return () => (
      <>
        {/* 右下角常驻小按钮 */}
        <button
          onClick={() => (open.value = !open.value)}
          class="fixed z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-accent-purple text-white shadow-2xl transition-transform hover:scale-110"
          style="right: 1.25rem; bottom: 1.25rem;"
          aria-label={t('ai.open')}
        >
          <span class={`i-${open.value ? 'ri-close-line' : 'ri-robot-2-line'} text-xl`} aria-hidden="true" />
        </button>

        {/* 浮窗主体 */}
        <div
          class={`fixed z-50 flex flex-col overflow-hidden rounded-24px bg-white shadow-2xl transition-all ${
            open.value ? 'opacity-100 scale-100' : 'pointer-events-none opacity-0 scale-95'
          }`}
          style="right: 5.5rem; bottom: 1.25rem; width: 400px; max-width: calc(100vw - 7rem); height: 560px; max-height: calc(100vh - 2.5rem);"
        >
          {/* 头部 */}
          <div class="flex items-center justify-between bg-gradient-to-r from-brand-dark to-brand-blue px-5 py-4 text-white">
            <div class="flex items-center gap-2">
              <span class="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                <span class="i-ri-robot-2-line text-lg" aria-hidden="true" />
              </span>
              <div>
                <p class="text-sm font-semibold">{t('ai.title')}</p>
                <p class="text-[10px] text-white/60">{props.country ? lt(props.country.name) : t('ai.subtitle')}</p>
              </div>
            </div>
            <button
              onClick={() => (open.value = false)}
              class="rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
              aria-label={t('ai.close')}
            >
              <span class="i-ri-arrow-down-s-line text-lg" />
            </button>
          </div>

          {/* 消息区 */}
          <div class="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.value.map((m, i) => (
              <div
                key={i}
                class={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  class={`max-w-[85%] whitespace-pre-wrap rounded-16px px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-brand-blue text-white'
                      : 'border border-gray-100 bg-brand-bg text-brand-dark'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {thinking.value && (
              <div class="flex justify-start">
                <div class="flex items-center gap-1 rounded-16px border border-gray-100 bg-brand-bg px-4 py-3">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      class="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-muted"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                  <span class="ml-2 text-xs text-brand-muted">{t('ai.thinking')}</span>
                </div>
              </div>
            )}
          </div>

          {/* 快捷问题 */}
          <div class="flex flex-wrap gap-2 px-4 pb-2">
            {quickQuestions.value.map((qq) => (
              <button
                key={qq.key}
                onClick={() => ask(qq.q)}
                class="rounded-full border border-brand-blue/20 bg-brand-blue/5 px-3 py-1 text-xs text-brand-blue transition-all hover:bg-brand-blue hover:text-white"
              >
                {qq.label}
              </button>
            ))}
          </div>

          {/* 输入区 */}
          <div class="flex items-center gap-2 border-t border-gray-100 p-3">
            <input
              v-model={input.value}
              placeholder={t('ai.placeholder')}
              class="input-base flex-1 !rounded-full !py-2.5 text-sm"
              onKeydown={(e) => e.key === 'Enter' && submit()}
            />
            <button
              onClick={submit}
              disabled={!input.value.trim() || thinking.value}
              class="flex h-10 w-10 items-center justify-center rounded-full bg-accent-purple text-white transition-all hover:brightness-110 disabled:opacity-40"
              aria-label={t('ai.submit')}
            >
              <span class="i-ri-send-plane-line" aria-hidden="true" />
            </button>
          </div>
        </div>
      </>
    )
  },
})
