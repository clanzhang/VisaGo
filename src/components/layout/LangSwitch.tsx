// components/layout/LangSwitch.tsx
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '../../stores/appStore'
import type { Language } from '../../i18n'

export default defineComponent({
  name: 'LangSwitch',
  setup() {
    const { t } = useI18n()
    const app = useAppStore()
    const current = app.language

    const toggle = () => {
      const next: Language = current === 'zh-CN' ? 'en-US' : 'zh-CN'
      app.setLanguage(next)
    }

    return () => (
      <button
        onClick={toggle}
        class="flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white transition-all hover:bg-white/20"
        aria-label="切换语言 / Switch language"
      >
        <span class="i-ri-global-line text-sm" aria-hidden="true" />
        <span>{t('lang.en')}</span>
        <span class="text-white/50">/</span>
        <span>{t('lang.zh')}</span>
      </button>
    )
  },
})
