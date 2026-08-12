// pages/Encyclopedia.tsx — 签证百科（国家列表 + 对比 + AI 助手）
import { useMemo, useState } from 'react'
import { useI18n } from '@/i18n'
import { CountryCard, AIAssistant } from '@/components/visa'
import { VButton, VModal } from '@/components/common'
import { ComparisonTable } from '@/components/visa'
import { countries, searchCountries } from '@/data/countries'
import { VISA_TYPE_ORDER, REGION_ORDER } from '@/data/country-list'

// 筛选：全部 / 免签 / 落地签 / 电子签 / 需签证
type VisaFilter = 'all' | '互免签证' | '单方面免签' | '落地签' | '电子签' | '需签证'

const FILTERS: { key: VisaFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: '互免签证', label: '互免' },
  { key: '单方面免签', label: '单免' },
  { key: '落地签', label: '落地签' },
  { key: '电子签', label: '电子签' },
  { key: '需签证', label: '需签证' },
]

export default function Encyclopedia() {
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<VisaFilter>('all')
  const [aiOpen, setAiOpen] = useState(false)
  const [compareMode, setCompareMode] = useState(false)
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [compareOpen, setCompareOpen] = useState(false)

  const list = useMemo(() => {
    let result = searchCountries(query)
    if (filter !== 'all') {
      result = result.filter((c) => c.visaType === filter)
    }
    return result
  }, [query, filter])

  // 按签证类型分组（互免 → 单免 → 落地 → 电子）
  const grouped = useMemo(() => {
    const map = new Map<string, typeof list>()
    for (const c of list) {
      const g = c.visaType
      if (!map.has(g)) map.set(g, [])
      map.get(g)!.push(c)
    }
    // 组内按区域排序
    for (const arr of map.values()) {
      arr.sort((a, b) => {
        const ia = REGION_ORDER.indexOf(a.region)
        const ib = REGION_ORDER.indexOf(b.region)
        if (ia === -1 && ib === -1) return a.region.localeCompare(b.region, 'zh')
        if (ia === -1) return 1
        if (ib === -1) return -1
        return ia - ib
      })
    }
    const groups = [...map.keys()].sort((a, b) => {
      const ia = VISA_TYPE_ORDER.indexOf(a as (typeof VISA_TYPE_ORDER)[number])
      const ib = VISA_TYPE_ORDER.indexOf(b as (typeof VISA_TYPE_ORDER)[number])
      if (ia === -1 && ib === -1) return a.localeCompare(b, 'zh')
      if (ia === -1) return 1
      if (ib === -1) return -1
      return ia - ib
    })
    return groups.map((g) => ({ group: g, items: map.get(g)! }))
  }, [list])

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
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors duration-150 ${
                filter === f.key
                  ? 'bg-ink text-white'
                  : 'bg-white text-ink/60 shadow-card hover:bg-ink/5'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <VButton variant="secondary" size="sm" onClick={() => setAiOpen(true)}>
            <span className="text-sm">🤖</span> {t('encyclopedia.askAI')}
          </VButton>
          <VButton
            variant={compareMode ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setCompareMode((v) => !v)}
          >
            {t('encyclopedia.compareMode')}
          </VButton>
          {compareMode && (
            <VButton
              variant="secondary"
              size="sm"
              disabled={compareIds.length < 2}
              onClick={() => setCompareOpen(true)}
            >
              {t('encyclopedia.compare')} ({compareIds.length})
            </VButton>
          )}
        </div>
      </div>

      {/* 国家列表（按签证类型大组分组） */}
      {grouped.map((group) => (
        <section key={group.group}>
          <div className="mb-4 flex items-center gap-3">
            <h2 className="font-display text-base font-bold tracking-tight text-ink">{group.group}</h2>
            <span className="rounded-full bg-ink/5 px-2 py-0.5 text-xs text-ink/50">{group.items.length} 个</span>
            <div className="h-px flex-1 bg-ink/8" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((c, i) => {
              const selected = compareIds.includes(c.id)
              return (
                <div key={c.id} className="group relative">
                  <CountryCard country={c} index={i} />
                  {compareMode && (
                    <label
                      onClick={(e) => e.stopPropagation()}
                      className={`absolute right-4 top-4 z-10 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border-2 bg-white shadow-sm transition-opacity duration-150 ${
                        selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                      style={{
                        borderColor: selected ? '#1460A4' : '#d1d5db',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleCompare(c.id)}
                        className="h-4 w-4 accent-[#1460A4]"
                        aria-label={t('encyclopedia.addToCompare')}
                      />
                    </label>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      ))}
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
