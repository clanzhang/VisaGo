// components/assistant/Step1Country.tsx — 第一步：选择国家
import { useMemo, useState } from 'react'
import { useI18n, regionLabelKey } from '@/i18n'
import { VButton, VBadge } from '@/components/common'
import { countries, DIFFICULTY_LABELS } from '@/data/countries'
import { REGION_ORDER } from '@/data/country-list'

/** 签证类型筛选 tab 文案 key（tab 值为数据值） */
export function filterLabelKey(tab: string): string {
  const map: Record<string, string> = {
    '': 'assistant.filterAll',
    互免签证: 'assistant.filterMutual',
    单方面免签: 'assistant.filterUnilateral',
    落地签: 'assistant.filterOnArrival',
    电子签: 'assistant.filterEvisa',
    需通行证: 'assistant.filterPermit',
  }
  return map[tab] ?? 'assistant.filterAll'
}

// 签证类型筛选 tab：全部 / 互免签证 / 单方面免签 / 落地签 / 电子签 / 需通行证
const REGION_TABS = ['', '互免签证', '单方面免签', '落地签', '电子签', '需通行证'] as const

interface Props {
  selectedCountryId: string | null
  onSelect: (id: string) => void
  onNext: () => void
}

export function Step1Country({ selectedCountryId, onSelect, onNext }: Props) {
  const { t, isZh, pickL } = useI18n()
  const [search, setSearch] = useState('')
  const [regionTab, setRegionTab] = useState('')

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase()
    return countries.filter((c) => {
      // 先按 tab 筛签证类型
      if (regionTab && c.visaType !== regionTab) return false
      // 再按 search 过滤名称
      if (kw) return c.name.zh.includes(kw) || c.name.en.toLowerCase().includes(kw)
      return true
    })
  }, [search, regionTab])

  const visaTypeStats = useMemo(
    () =>
      REGION_TABS.map((tab) => ({
        key: tab,
        label: t(filterLabelKey(tab)),
        count: tab ? countries.filter((c) => c.visaType === tab).length : countries.length,
      })),
    [t],
  )

  const quickPickCountries = useMemo(() => {
    const ids = ['japan', 'korea', 'usa', 'schengen', 'thailand', 'singapore', 'uk', 'australia']
    return ids
      .map((id) => countries.find((c) => c.id === id))
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
  }, [])

  const filteredByRegion = useMemo(() => {
    const groups = filtered.reduce<Record<string, typeof filtered>>((acc, c) => {
      acc[c.region] = acc[c.region] ? [...acc[c.region], c] : [c]
      return acc
    }, {})
    return Object.entries(groups).sort(([a], [b]) => REGION_ORDER.indexOf(a) - REGION_ORDER.indexOf(b))
  }, [filtered])

  const selectedCountry = countries.find((c) => c.id === selectedCountryId)

  return (
    <div className="anim-card overflow-hidden rounded-2xl bg-white shadow-card">
      <div className="border-b border-ink/6 bg-[#FBFCFD] px-6 py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink">{t('assistant.selectCountry')}</h2>
            <p className="mt-1 text-sm text-ink/60">{t('assistant.step1Hint')}</p>
          </div>
          <div className="relative w-full xl:max-w-md">
            <span className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/60 icon-[mdi-light--magnify]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('assistant.searchPlaceholder')}
              aria-label={t('assistant.searchPlaceholder')}
              className="w-full rounded-xl border border-ink/8 bg-white py-3 pl-11 pr-4 text-sm outline-none placeholder:text-ink/60 focus:border-primary/40 focus:ring-4 focus:ring-primary/5"
            />
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_280px]">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {visaTypeStats.map((tab) => (
              <button
                key={tab.key || 'all'}
                onClick={() => setRegionTab(tab.key)}
                className={`shrink-0 rounded-xl border px-4 py-2 text-left transition-all duration-150 ${
                  regionTab === tab.key
                    ? 'border-primary bg-primary text-white shadow-sm'
                    : 'border-ink/8 bg-white text-ink/60 hover:border-primary/25 hover:text-ink'
                }`}
              >
                <div className="text-sm font-semibold">{tab.label}</div>
                <div className={regionTab === tab.key ? 'text-xs text-white/70' : 'text-xs text-ink/60'}>
                  {t('assistant.destCount', { count: tab.count })}
                </div>
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-ink/6 bg-white px-4 py-3">
            <div className="text-xs font-semibold text-ink/60">{t('assistant.currentResults')}</div>
            <div className="mt-1 flex items-end justify-between">
              <div className="font-display text-2xl font-bold text-ink">{filtered.length}</div>
              <button
                onClick={() => {
                  setSearch('')
                  setRegionTab('')
                }}
                className="text-xs font-medium text-primary hover:text-[#0e4a80]"
              >
                {t('assistant.resetFilter')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5 px-6 py-5">
        {!search.trim() && !regionTab && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-ink">{t('assistant.quickCountries')}</div>
                <div className="text-xs text-ink/60">{t('assistant.quickCountriesHint')}</div>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {quickPickCountries.map((c) => {
                const active = c.id === selectedCountryId
                return (
                  <button
                    key={c.id}
                    onClick={() => onSelect(c.id)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-all duration-150 ${
                      active ? 'border-primary bg-primary/5 ring-2 ring-primary/10' : 'border-ink/8 bg-[#FBFCFD] hover:border-primary/25'
                    }`}
                  >
                    <span className="text-2xl">{c.flag}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-ink">{pickL(c.name)}</div>
                      <div className="truncate text-[11px] text-ink/60">{t(filterLabelKey(c.visaType))}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-ink">{t('assistant.allResults')}</div>
              <div className="text-xs text-ink/60">
                {regionTab ? t('assistant.filteredBy', { filter: t(filterLabelKey(regionTab)) }) : t('assistant.groupHint')}
              </div>
            </div>
            {selectedCountry && (
              <div className="hidden rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary sm:block">
                {t('assistant.selectedCountry', { flag: selectedCountry.flag, name: pickL(selectedCountry.name) })}
              </div>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink/12 bg-[#FBFCFD] px-4 py-10 text-center">
              <div className="text-sm font-semibold text-ink">{t('assistant.noMatchTitle')}</div>
              <div className="mt-1 text-xs text-ink/60">{t('assistant.noMatchHint')}</div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredByRegion.map(([region, list]) => (
                <div key={region}>
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-ink/60">
                    <span>{t(regionLabelKey(region)) || region}</span>
                    <span className="h-px flex-1 bg-ink/8" />
                    <span>{list.length}</span>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                    {list.map((c) => {
                      const active = c.id === selectedCountryId
                      return (
                        <button
                          key={c.id}
                          onClick={() => onSelect(c.id)}
                          className={`flex min-w-0 items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all duration-150 ${
                            active
                              ? 'border-primary bg-primary/5 ring-2 ring-primary/10'
                              : 'border-ink/8 bg-white hover:border-primary/25 hover:bg-[#FBFCFD]'
                          }`}
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F5F7FA] text-2xl">
                            {c.flag}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-center gap-2">
                              <div className="truncate text-sm font-semibold text-ink">{pickL(c.name)}</div>
                              {active && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                            </div>
                            {isZh && <div className="truncate text-xs text-ink/60">{c.name.en}</div>}
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[11px] font-medium text-ink/60">
                              {t(filterLabelKey(c.visaType))}
                            </span>
                            <VBadge tone={c.difficulty === 'easy' ? 'success' : c.difficulty === 'medium' ? 'warning' : 'danger'} className="px-2 py-0 text-[11px]">
                              {pickL(DIFFICULTY_LABELS[c.difficulty])}
                            </VBadge>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end border-t border-ink/6 px-6 py-4">
        <VButton size="lg" disabled={!selectedCountry} onClick={onNext}>
          {t('assistant.next')}
        </VButton>
      </div>
    </div>
  )
}
