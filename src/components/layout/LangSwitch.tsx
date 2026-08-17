// components/layout/LangSwitch.tsx — 语言切换
import { useI18n, type Language } from '@/i18n'

export function LangSwitch() {
  const { lang, setLang } = useI18n()

  return (
    <div className="flex items-center rounded-lg bg-ink/5 p-0.5 text-xs">
      {(['zh-CN', 'en-US'] as Language[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`rounded-md px-2 py-1 transition-colors duration-150 ${
            lang === l ? 'bg-white font-semibold text-ink shadow-sm' : 'text-ink/60 hover:text-ink'
          }`}
        >
          {l === 'zh-CN' ? '中' : 'EN'}
        </button>
      ))}
    </div>
  )
}
