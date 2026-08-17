// pages/Encyclopedia.tsx — 签证百科（国家列表 + 区域/类型筛选 + 排序 + 对比 + AI 助手）
// 状态全部走 URL query（q/type/region/sort）：返回时搜索词、筛选、排序保留；
// 滚动位置经 sessionStorage 恢复；工具栏吸顶；支持回到顶部
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useI18n } from '@/i18n'
import { CountryCard, AIAssistant } from '@/components/visa'
import { VButton, VModal } from '@/components/common'
import { ComparisonTable } from '@/components/visa'
import { countries, searchCountries, VISA_TYPE_LABEL_KEYS } from '@/data/countries'
import { VISA_TYPE_ORDER, REGION_ORDER } from '@/data/country-list'
import { useAppStore } from '@/stores/appStore'
import type { Country } from '@/types'

// 类型筛选：与数据实际值一致（全部 / 互免签证 / 单方面免签 / 落地签 / 电子签 / 需通行证）
type VisaFilter = 'all' | Country['visaType']
type SortKey = 'default' | 'fee' | 'days' | 'stay' | 'difficulty'

const FILTERS: { key: VisaFilter; labelKey: string }[] = [
  { key: 'all', labelKey: 'encyclopedia.filterAll' },
  { key: '互免签证', labelKey: 'encyclopedia.filterMutual' },
  { key: '单方面免签', labelKey: 'encyclopedia.filterUnilateral' },
  { key: '落地签', labelKey: 'encyclopedia.filterOnArrival' },
  { key: '电子签', labelKey: 'encyclopedia.filterEvisa' },
  { key: '需通行证', labelKey: 'encyclopedia.filterVisaRequired' },
]

/** URL region key → 数据 region 值（REGION_ORDER 之外补港澳台） */
const REGION_VALUES: Record<string, string> = {
  asia: '亚洲',
  europe: '欧洲',
  americas: '美洲',
  oceania: '大洋洲',
  africa: '非洲',
  hktw: '港澳台',
}
const REGION_LABEL_KEYS: Record<string, string> = {
  asia: 'regions.asia',
  europe: 'regions.europe',
  americas: 'regions.americas',
  oceania: 'regions.oceania',
  africa: 'regions.africa',
  hktw: 'regions.hktw',
}

const SORT_KEYS: { key: SortKey; labelKey: string }[] = [
  { key: 'default', labelKey: 'encyclopedia.sortDefault' },
  { key: 'fee', labelKey: 'encyclopedia.sortFee' },
  { key: 'days', labelKey: 'encyclopedia.sortDays' },
  { key: 'stay', labelKey: 'encyclopedia.sortStay' },
  { key: 'difficulty', labelKey: 'encyclopedia.sortDifficulty' },
]

const DIFF_ORDER: Record<Country['difficulty'], number> = { easy: 0, medium: 1, hard: 2 }

/** 排序取值（费用用 CNY 兜底口径，避免多币种混排不可比） */
function feeVal(c: Country): number {
  const vt = c.visaTypes[0]
  return (vt?.fee?.amount ?? 0) + (vt?.serviceFee?.amount ?? 0)
}
function daysVal(c: Country): number {
  return c.visaTypes[0]?.processingDays.min ?? 999
}
function stayVal(c: Country): number {
  const m = (c.visaTypes[0]?.duration ?? '').match(/\d+/)
  return m ? +m[0] : 0
}

export default function Encyclopedia() {
  const { t, pickL } = useI18n()
  const { toast } = useAppStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const type = (searchParams.get('type') as VisaFilter) ?? 'all'
  const region = searchParams.get('region') ?? 'all'
  const sort = (searchParams.get('sort') as SortKey) ?? 'default'

  const [aiOpen, setAiOpen] = useState(false)
  const [compareMode, setCompareMode] = useState(false)
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [compareOpen, setCompareOpen] = useState(false)
  const [showTop, setShowTop] = useState(false)

  /** 更新 URL query（空/默认值自动删除） */
  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams)
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '' || v === 'all' || v === 'default') next.delete(k)
      else next.set(k, v)
    }
    setSearchParams(next, { replace: true })
  }

  // 滚动位置保存/恢复（返回列表时回到离开位置）
  useEffect(() => {
    const main = document.getElementById('app-main')
    if (!main) return
    const saved = sessionStorage.getItem('visago:ency-scroll')
    if (saved) {
      requestAnimationFrame(() => {
        main.scrollTop = Number(saved)
      })
    }
    const onScroll = () => {
      setShowTop(main.scrollTop > 600)
      sessionStorage.setItem('visago:ency-scroll', String(main.scrollTop))
    }
    main.addEventListener('scroll', onScroll)
    return () => main.removeEventListener('scroll', onScroll)
  }, [])

  const list = useMemo(() => {
    let result = searchCountries(q)
    if (type !== 'all') result = result.filter((c) => c.visaType === type)
    if (region !== 'all') {
      const rv = REGION_VALUES[region]
      if (rv) result = result.filter((c) => c.region === rv)
    }
    if (sort !== 'default') {
      const arr = [...result]
      if (sort === 'fee') arr.sort((a, b) => feeVal(a) - feeVal(b))
      else if (sort === 'days') arr.sort((a, b) => daysVal(a) - daysVal(b))
      else if (sort === 'stay') arr.sort((a, b) => stayVal(b) - stayVal(a))
      else arr.sort((a, b) => DIFF_ORDER[a.difficulty] - DIFF_ORDER[b.difficulty])
      result = arr
    }
    return result
  }, [q, type, region, sort])

  // 默认排序下按签证类型分组；自定义排序时用扁平列表（全局排序才有意义）
  const grouped = useMemo(() => {
    if (sort !== 'default') return []
    const map = new Map<string, typeof list>()
    for (const c of list) {
      const g = c.visaType
      if (!map.has(g)) map.set(g, [])
      map.get(g)!.push(c)
    }
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
  }, [list, sort])

  const compareCountries = useMemo(
    () => countries.filter((c) => compareIds.includes(c.id)),
    [compareIds],
  )

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 3) {
        toast(t('encyclopedia.maxCompare'), 'warning')
        return prev
      }
      return [...prev, id]
    })
  }

  const filtering = q !== '' || type !== 'all' || region !== 'all' || sort !== 'default'
  // AI 抽屉上下文：当前类型/区域筛选
  const aiContext =
    type !== 'all'
      ? t(FILTERS.find((f) => f.key === type)?.labelKey ?? 'encyclopedia.filterAll')
      : region !== 'all'
        ? t(REGION_LABEL_KEYS[region] ?? 'regions.asia')
        : ''

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">{t('encyclopedia.title')}</h1>
        <p className="mt-1 text-base font-medium text-subtle">{t('encyclopedia.subtitle')}</p>
      </div>

      {/* 工具栏：吸顶，两层（搜索/筛选 与 AI/对比 分离） */}
      <div className="sticky top-0 z-20 -mx-4 border-b border-ink/5 bg-bg px-4 pb-3 pt-1 sm:-mx-8 sm:px-8">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-2.5">
          {/* 第 1 层：搜索 + 结果计数 + 区域/排序 */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <svg className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                value={q}
                onChange={(e) => update({ q: e.target.value })}
                placeholder={t('encyclopedia.searchPlaceholder')}
                aria-label={t('encyclopedia.searchPlaceholder')}
                className={`w-full rounded-full border border-ink/8 bg-white py-2 pl-11 text-sm shadow-card outline-none placeholder:text-ink/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/10 ${q ? 'pr-9' : 'pr-4'}`}
              />
              {q && (
                <button
                  type="button"
                  onClick={() => update({ q: null })}
                  aria-label={t('encyclopedia.clearSearch')}
                  title={t('encyclopedia.clearSearch')}
                  className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-ink/10 hover:text-ink"
                >
                  ×
                </button>
              )}
            </div>
            {filtering && (
              <span className="whitespace-nowrap text-xs text-ink/60" role="status">
                {t('encyclopedia.searchFound', { n: list.length })}
              </span>
            )}
            <select
              value={region}
              onChange={(e) => update({ region: e.target.value })}
              aria-label={t('encyclopedia.filterRegion')}
              className="rounded-lg border border-ink/8 bg-white px-2 py-1.5 text-xs outline-none focus:border-primary/40"
            >
              <option value="all">{t('encyclopedia.regionAll')}</option>
              {Object.entries(REGION_LABEL_KEYS).map(([k, lk]) => (
                <option key={k} value={k}>{t(lk)}</option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => update({ sort: e.target.value })}
              aria-label={t('encyclopedia.sortLabel')}
              className="rounded-lg border border-ink/8 bg-white px-2 py-1.5 text-xs outline-none focus:border-primary/40"
            >
              {SORT_KEYS.map((s) => (
                <option key={s.key} value={s.key}>{t(s.labelKey)}</option>
              ))}
            </select>
          </div>

          {/* 第 2 层：类型 chips + AI/对比 */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label={t('encyclopedia.visaTypeTab')}>
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  role="radio"
                  aria-checked={type === f.key}
                  onClick={() => update({ type: f.key })}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
                    type === f.key ? 'bg-ink text-white' : 'bg-white text-ink/60 shadow-card hover:bg-ink/5'
                  }`}
                >
                  {t(f.labelKey)}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <VButton variant="secondary" size="sm" onClick={() => setAiOpen(true)}>
                <span className="h-4 w-4 icon-[mdi-light--message]" aria-hidden="true" />
                {t('encyclopedia.askAI')}
              </VButton>
              <VButton
                variant={compareMode ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setCompareMode((v) => !v)}
                aria-pressed={compareMode}
              >
                {t('encyclopedia.compareMode')}
              </VButton>
            </div>
          </div>
        </div>
      </div>

      {/* 国家列表：默认按类型分组；自定义排序时扁平展示 */}
      {sort === 'default' ? (
        grouped.map((group) => (
          <section key={group.group}>
            <div className="mb-4 flex items-center gap-3">
              <h2 className="font-display text-base font-bold tracking-tight text-ink">
                {t(VISA_TYPE_LABEL_KEYS[group.group as Country['visaType']])}
              </h2>
              <span className="rounded-full bg-ink/5 px-2 py-0.5 text-xs text-ink/60">{t('encyclopedia.groupCount', { n: group.items.length })}</span>
              <div className="h-px flex-1 bg-ink/8" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {group.items.map((c) => (
                <div key={c.id} className="relative">
                  <CountryCard
                    country={c}
                    hideVisaType={type !== 'all'}
                    selectable={compareMode}
                    selected={compareIds.includes(c.id)}
                    onToggleSelect={() => toggleCompare(c.id)}
                  />
                  {compareMode && (
                    <button
                      type="button"
                      onClick={() => toggleCompare(c.id)}
                      aria-label={compareIds.includes(c.id) ? t('encyclopedia.removeFromCompare') : t('encyclopedia.addToCompare')}
                      aria-pressed={compareIds.includes(c.id)}
                      className={`absolute right-4 top-4 z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 bg-white shadow-sm transition-colors ${
                        compareIds.includes(c.id) ? 'border-primary bg-primary' : 'border-ink/20 bg-white'
                      }`}
                    >
                      {compareIds.includes(c.id) && <span className="h-3 w-3 icon-[mdi-light--check]" aria-hidden="true" />}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => (
            <div key={c.id} className="relative">
              <CountryCard
                country={c}
                hideVisaType
                selectable={compareMode}
                selected={compareIds.includes(c.id)}
                onToggleSelect={() => toggleCompare(c.id)}
              />
              {compareMode && (
                <button
                  type="button"
                  onClick={() => toggleCompare(c.id)}
                  aria-label={compareIds.includes(c.id) ? t('encyclopedia.removeFromCompare') : t('encyclopedia.addToCompare')}
                  aria-pressed={compareIds.includes(c.id)}
                  className={`absolute right-4 top-4 z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 bg-white shadow-sm transition-colors ${
                    compareIds.includes(c.id) ? 'border-primary bg-primary' : 'border-ink/20 bg-white'
                  }`}
                >
                  {compareIds.includes(c.id) && <span className="h-3 w-3 icon-[mdi-light--check]" aria-hidden="true" />}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {list.length === 0 && (
        <div className="flex flex-col items-center rounded-2xl bg-white p-12 text-center shadow-card">
          <div className="mb-3 text-4xl">🔍</div>
          <p className="text-sm font-semibold text-ink">{t('encyclopedia.noResults')}</p>
          <p className="mt-1 text-sm text-ink/60">{t('encyclopedia.noResultsHint')}</p>
          {filtering && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {q !== '' && (
                <button
                  onClick={() => update({ q: null })}
                  className="rounded-full border border-ink/10 px-4 py-1.5 text-sm font-medium text-primary transition-colors hover:border-primary/40"
                >
                  {t('encyclopedia.clearSearch')}
                </button>
              )}
              {(type !== 'all' || region !== 'all' || sort !== 'default') && (
                <button
                  onClick={() => update({ type: 'all', region: 'all', sort: 'default' })}
                  className="rounded-full border border-ink/10 px-4 py-1.5 text-sm font-medium text-primary transition-colors hover:border-primary/40"
                >
                  {t('encyclopedia.broadenFilter')}
                </button>
              )}
            </div>
          )}
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
          <p className="py-8 text-center text-sm text-ink/60">{t('encyclopedia.selectCountries')}</p>
        )}
      </VModal>

      {/* 常驻对比条（对比模式下有已选项时显示） */}
      {compareMode && compareIds.length > 0 && (
        <div className="sticky bottom-0 z-20 -mx-4 rounded-t-2xl border border-ink/5 border-b-0 bg-white px-4 py-3 shadow-[0_-4px_16px_rgba(16,24,40,0.08)] sm:-mx-8 sm:px-8">
          <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-ink/70">{t('encyclopedia.selectedCount', { n: compareIds.length })}</span>
            {compareCountries.map((c) => (
              <span key={c.id} className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-[#FBFCFD] px-2.5 py-1 text-xs text-ink">
                <span>{c.flag}</span>
                {pickL(c.name)}
                <button
                  type="button"
                  onClick={() => toggleCompare(c.id)}
                  aria-label={t('encyclopedia.removeFromCompare')}
                  className="flex h-4 w-4 items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-ink/10 hover:text-ink"
                >
                  ×
                </button>
              </span>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <VButton variant="secondary" size="sm" onClick={() => setCompareMode(false)}>
                {t('encyclopedia.clearCompare')}
              </VButton>
              <VButton size="sm" disabled={compareIds.length < 2} onClick={() => setCompareOpen(true)}>
                {t('encyclopedia.compare')} ({compareIds.length})
              </VButton>
            </div>
          </div>
        </div>
      )}

      {/* AI 助手：右侧抽屉、非阻塞（可一边看列表一边问），带当前筛选上下文 */}
      <AIAssistant open={aiOpen} onClose={() => setAiOpen(false)} variant="drawer" context={aiContext} />

      {/* 回到顶部 */}
      {showTop && (
        <button
          type="button"
          onClick={() => document.getElementById('app-main')?.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label={t('encyclopedia.backToTop')}
          title={t('encyclopedia.backToTop')}
          className={`fixed right-5 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white shadow-card-lg transition-colors hover:bg-[#0e4a80] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
            compareMode && compareIds.length > 0 ? 'bottom-[92px]' : 'bottom-6'
          }`}
        >
          <span className="h-5 w-5 icon-[mdi-light--arrow-up]" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
