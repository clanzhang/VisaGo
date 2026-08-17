// components/layout/Header.tsx — 顶部 Header（问候 + 搜索 + 刷新）
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/i18n'
import { useTrackerStore } from '@/stores/trackerStore'
import { useUserIdentity } from '@/hooks/useUserIdentity'
import { countries } from '@/data/countries'
import type { Country } from '@/types'

interface Props {
  /** 点击刷新数据（由页面传入） */
  onRefresh?: () => void
  /** 是否正在加载/刷新（图标旋转 + 禁用） */
  refreshing?: boolean
}

export function Header({ onRefresh, refreshing = false }: Props) {
  const { t, pickL } = useI18n()
  const navigate = useNavigate()
  const { applications } = useTrackerStore()
  const { name } = useUserIdentity()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  // 键盘导航：当前高亮的结果索引
  const [activeIndex, setActiveIndex] = useState(-1)

  const inProgress = applications.filter((a) =>
    ['preparing', 'appointment_booked', 'submitted', 'under_review'].includes(a.status),
  ).length

  const results: Country[] = query
    ? countries.filter((c) => c.name.zh.includes(query) || c.name.en.toLowerCase().includes(query.toLowerCase()))
    : []

  // 查询变化时重置高亮
  useEffect(() => {
    setActiveIndex(-1)
  }, [query])

  function selectCountry(c: Country) {
    setOpen(false)
    setQuery('')
    navigate(`/encyclopedia/${c.id}`)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || !query) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (results.length === 0 ? -1 : (i + 1) % results.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (results.length === 0 ? -1 : (i - 1 + results.length) % results.length))
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && results[activeIndex]) {
        e.preventDefault()
        selectCountry(results[activeIndex])
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="flex items-center justify-between gap-4">
      {/* 标题区：不参与宽度竞争，任何窗口宽度都保持单行 */}
      <div className="shrink-0">
        <h1 className="max-w-[min(60vw,560px)] truncate whitespace-nowrap font-display text-2xl font-bold tracking-tight text-ink">
          {name ? t('home.greeting', { name }) : t('home.greetingAnonymous')}
        </h1>
        <p className="whitespace-nowrap mt-1 text-base font-medium text-subtle">
          {t('home.greetingSub', { count: inProgress })}
        </p>
      </div>

      {/* 搜索 + 刷新：可伸缩（min-w-0），窄窗口时收缩而不是挤压标题 */}
      <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
        <div className="relative min-w-0 max-w-xl flex-1">
          <i className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6B7280] transition-colors duration-150 icon-[mdi-light--magnify]" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onKeyDown={onKeyDown}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onFocus={() => setOpen(true)}
            placeholder={t('home.searchPlaceholder')}
            aria-label={t('home.searchAria')}
            role="combobox"
            aria-expanded={open && query.length > 0}
            aria-controls={open && query ? 'header-search-listbox' : undefined}
            aria-activedescendant={
              activeIndex >= 0 && results[activeIndex] ? `header-search-option-${results[activeIndex].id}` : undefined
            }
            aria-autocomplete="list"
            className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-white pl-7 pr-4 text-sm outline-none transition-colors placeholder:text-ink/60 focus:border-[#1460A4]"
          />
          {open && query && (
            <div
              id="header-search-listbox"
              role="listbox"
              aria-label={t('home.searchAria')}
              className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-ink/5 bg-white shadow-card-lg"
            >
              {results.length === 0 ? (
                <div className="px-4 py-3 text-sm text-ink/60">{t('home.searchNoResults')}</div>
              ) : (
                results.map((c, i) => (
                  <button
                    key={c.id}
                    id={`header-search-option-${c.id}`}
                    role="option"
                    aria-selected={i === activeIndex}
                    onMouseDown={() => selectCountry(c)}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                      i === activeIndex ? 'bg-[#F0F4F8]' : 'hover:bg-[#F9F9F6]'
                    }`}
                  >
                    <span className="text-lg">{c.flag}</span>
                    <span className="font-medium">{pickL(c.name)}</span>
                    <span className="ml-auto rounded-full bg-ink/5 px-2 py-0.5 text-xs text-ink/60">
                      {c.visaTypes.length} {t('encyclopedia.visaTypes')}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-ink/60 shadow-card transition-all duration-150 hover:text-[#1460A4] hover:shadow-card-lg disabled:opacity-60"
            title={t('home.refresh')}
            aria-label={t('home.refresh')}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={refreshing ? 'animate-spin' : ''}
            >
              <path d="M21 12a9 9 0 11-2.6-6.4M21 3v6h-6" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
