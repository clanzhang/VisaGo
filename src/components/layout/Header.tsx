// components/layout/Header.tsx — 顶部 Header（问候 + 搜索 + 热门搜索标签）
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/i18n'
import { useTrackerStore } from '@/stores/trackerStore'
import { countries } from '@/data/countries'
import type { Country } from '@/types'

/** 动态日期：YYYY年M月D日 星期X */
function todayText(): string {
  const d = new Date()
  const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${week}`
}

// 热门搜索标签（点击跳转对应国家百科页）
const HOT_TAGS = ['日本', '泰国', '申根', '韩国', '美国']

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

  function jumpToCountry(name: string) {
    const c = countries.find((x) => x.name.zh === name)
    if (c) navigate(`/encyclopedia/${c.id}`)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
            {t('home.greeting', { date: todayText() })}
          </h1>
          <p className="mt-1 text-base font-medium text-subtle">
            {t('home.greetingSub', { count: inProgress })}
          </p>
        </div>

        {/* 搜索框 */}
        <div className="relative w-full max-w-xl">
          <i
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9CA3AF] transition-colors duration-150 hover:text-[#6B7280] icon-[mdi-light--magnify]"
          />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onFocus={() => setOpen(true)}
            placeholder={t('home.searchPlaceholder')}
            className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-white pl-7 pr-4 text-sm outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[#1460A4]"
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

          {/* 热门搜索标签 */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-ink/35">{t('home.hotSearch')}：</span>
            {HOT_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => jumpToCountry(tag)}
                className="rounded-full bg-[#F3F4F6] px-3 py-1 text-sm text-ink/60 transition-colors duration-150 hover:bg-[#E0F7FA] hover:text-[#1460A4]"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
