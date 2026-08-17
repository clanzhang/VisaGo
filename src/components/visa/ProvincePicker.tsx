// components/visa/ProvincePicker.tsx — 无依赖可过滤省份选择器（combobox）
// 修复：原来 copy 说「输入省份」但控件是 <select>；这里提供真正可输入的过滤下拉。
import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '@/i18n'
import { PROVINCES } from '@/data/countries'

interface Props {
  value: string
  onChange: (v: string) => void
}

export function ProvincePicker({ value, onChange }: Props) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const [highlight, setHighlight] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 外部值变化（如重置）时同步输入框
  useEffect(() => {
    setQuery(value)
  }, [value])

  const options = useMemo(() => {
    const q = query.trim()
    if (!q) return PROVINCES
    return PROVINCES.filter((p) => p.includes(q))
  }, [query])

  // 点击外部关闭
  useEffect(() => {
    if (!open) return
    function onDocDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocDown)
    return () => document.removeEventListener('mousedown', onDocDown)
  }, [open])

  function pick(p: string) {
    onChange(p)
    setQuery(p)
    setOpen(false)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setOpen(false)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setHighlight((h) => Math.min(h + 1, options.length - 1))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setOpen(true)
      setHighlight((h) => Math.max(h - 1, 0))
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (open && options[highlight]) pick(options[highlight])
      else if (options.length === 1 && options[0] === query.trim()) pick(options[0])
      return
    }
    if (e.key === 'Tab') setOpen(false)
  }

  function onBlur() {
    // 未确认选中时回退到当前值，避免残留未选中的输入
    setQuery(value)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative max-w-sm">
      <div className="flex items-center rounded-xl border border-ink/10 bg-white px-3 transition-colors focus-within:border-primary/40">
        <span className="h-4 w-4 shrink-0 text-ink/40 icon-[mdi-light--magnify]" />
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded={open}
          aria-controls="province-options"
          aria-activedescendant={open && options[highlight] ? `province-opt-${highlight}` : undefined}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setHighlight(0)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          placeholder={t('encyclopedia.provincePlaceholder')}
          className="w-full bg-transparent px-2 py-2.5 text-sm text-ink outline-none placeholder:text-ink/40"
        />
        {value ? (
          <button
            type="button"
            aria-label={t('encyclopedia.provinceClear')}
            onClick={() => {
              onChange('')
              setQuery('')
              inputRef.current?.focus()
            }}
            className="h-4 w-4 shrink-0 text-ink/40 transition-colors hover:text-ink icon-[mdi-light--close]"
          />
        ) : (
          <span className="h-4 w-4 shrink-0 text-ink/30 icon-[mdi-light--chevron-down]" />
        )}
      </div>
      {open && (
        <ul
          id="province-options"
          role="listbox"
          aria-label={t('encyclopedia.provinceSearch')}
          className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-ink/10 bg-white p-1 shadow-card"
        >
          {options.length === 0 ? (
            <li className="px-3 py-2 text-sm text-ink/50">{t('encyclopedia.provinceNoMatch')}</li>
          ) : (
            options.map((p, i) => (
              <li key={p}>
                <button
                  type="button"
                  role="option"
                  aria-selected={p === value}
                  id={`province-opt-${i}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(p)}
                  onMouseEnter={() => setHighlight(i)}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    i === highlight ? 'bg-primary/10 text-primary' : 'text-ink'
                  } ${p === value ? 'font-medium' : ''}`}
                >
                  {p}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
