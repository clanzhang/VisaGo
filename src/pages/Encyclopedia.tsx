// pages/Encyclopedia.tsx — 签证百科（国家列表 + 对比 + AI 助手）
import { useMemo, useState } from 'react'
import { useI18n } from '@/i18n'
import { CountryCard, AIAssistant } from '@/components/visa'
import { VButton, VModal } from '@/components/common'
import { ComparisonTable } from '@/components/visa'
import { countries, DIFFICULTY_LABELS, searchCountries } from '@/data/countries'

type DifficultyFilter = 'all' | 'easy' | 'medium' | 'hard'

export default function Encyclopedia() {
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('all')
  const [aiOpen, setAiOpen] = useState(false)
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [compareOpen, setCompareOpen] = useState(false)

  const list = useMemo(() => {
    let result = searchCountries(query)
    if (difficulty !== 'all') {
      result = result.filter((c) => c.difficulty === difficulty)
    }
    return result
  }, [query, difficulty])

  const compareCountries = useMemo(
    () => countries.filter((c) => compareIds.includes(c.id)),
    [compareIds],
  )

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 3) return prev
      return [...prev, id]
    })
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">{t('encyclopedia.title')}</h1>
        <p className="mt-1 text-base font-medium text-subtle">{t('encyclopedia.subtitle')}</p>
      </div>

      {/* 搜索 + 筛选 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/35" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('encyclopedia.searchPlaceholder')}
            className="w-full rounded-full border border-ink/8 bg-white py-2.5 pl-11 pr-4 text-sm shadow-card outline-none placeholder:text-ink/35 focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
          />
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'easy', 'medium', 'hard'] as DifficultyFilter[]).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors duration-150 ${
                difficulty === d
                  ? 'bg-ink text-white'
                  : 'bg-white text-ink/60 shadow-card hover:bg-ink/5'
              }`}
            >
              {t(`encyclopedia.${d === 'all' ? 'all' : DIFFICULTY_LABELS[d].zh === '易' ? 'easy' : DIFFICULTY_LABELS[d].zh === '中' ? 'medium' : 'hard'}`)}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <VButton variant="secondary" size="sm" onClick={() => setAiOpen(true)}>
            <span className="text-sm">🤖</span> {t('encyclopedia.askAI')}
          </VButton>
          <VButton
            variant="secondary"
            size="sm"
            disabled={compareIds.length < 2}
            onClick={() => setCompareOpen(true)}
          >
            {t('encyclopedia.compare')} ({compareIds.length})
          </VButton>
        </div>
      </div>

      {/* 国家列表 */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((c, i) => {
          const selected = compareIds.includes(c.id)
          return (
            <div key={c.id} className="relative">
              <CountryCard country={c} index={i} />
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleCompare(c.id)
                }}
                className={`absolute right-4 top-4 z-10 flex h-6 w-6 items-center justify-center rounded-full border text-xs transition-colors ${
                  selected
                    ? 'border-primary bg-primary text-white'
                    : 'border-ink/15 bg-white text-ink/40 hover:border-primary/50 hover:text-primary'
                }`}
                aria-label={t('encyclopedia.addToCompare')}
              >
                {selected ? '✓' : '+'}
              </button>
            </div>
          )
        })}
      </div>
      {list.length === 0 && (
        <div className="rounded-2xl bg-white p-12 text-center text-sm text-ink/40 shadow-card">
          {t('common.noData')}
        </div>
      )}

      {/* 对比弹窗 */}
      <VModal
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        title={t('encyclopedia.compareTitle')}
        width="max-w-3xl"
      >
        {compareCountries.length >= 2 ? (
          <ComparisonTable countries={compareCountries} />
        ) : (
          <p className="py-8 text-center text-sm text-ink/40">{t('encyclopedia.selectCountries')}</p>
        )}
      </VModal>

      {/* AI 助手 */}
      <AIAssistant open={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  )
}
