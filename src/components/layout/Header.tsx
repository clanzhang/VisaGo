// components/layout/Header.tsx — 顶部 Header（问候 + 新建申请按钮 + 搜索）
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/i18n'
import { useTrackerStore } from '@/stores/trackerStore'
import { countries } from '@/data/countries'
import type { Country } from '@/types'

export function Header() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { applications } = useTrackerStore()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const inProgress = applications.filter((a) =>
    ['preparing', 'appointment_booked', 'submitted', 'under_review'].includes(a.status),
  ).length

  const results: Country[] = query
    ? countries.filter((c) => c.name.zh.includes(query) || c.name.en.toLowerCase().includes(query.toLowerCase()))
    : []

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
            {t('home.greeting', { name: '用户' })}
          </h1>
          <p className="mt-1 text-base font-medium text-subtle">
            {t('home.greetingSub', { count: inProgress })}
          </p>
        </div>
        <button
          onClick={() => navigate('/assistant')}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-black"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {t('home.newApplication')}
        </button>
      </div>

      {/* 搜索框 */}
      <div className="relative max-w-xl">
        <svg
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/35"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onFocus={() => setOpen(true)}
          placeholder={t('home.searchPlaceholder')}
          className="w-full rounded-full border border-ink/8 bg-white py-3 pl-11 pr-4 text-sm shadow-card outline-none transition-colors placeholder:text-ink/35 focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
        />
        {open && query && (
          <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-ink/5 bg-white shadow-card-lg">
            {results.length === 0 ? (
              <div className="px-4 py-3 text-sm text-ink/40">{t('common.noData')}</div>
            ) : (
              results.map((c) => (
                <button
                  key={c.id}
                  onMouseDown={() => {
                    setOpen(false)
                    setQuery('')
                    navigate(`/encyclopedia/${c.id}`)
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-[#F9F9F6]"
                >
                  <span className="text-lg">{c.flag}</span>
                  <span className="font-medium">{c.name.zh}</span>
                  <span className="text-xs text-ink/40">{c.name.en}</span>
                  <span className="ml-auto rounded-full bg-ink/5 px-2 py-0.5 text-xs text-ink/50">
                    {c.visaTypes.length} {t('encyclopedia.visaTypes')}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
