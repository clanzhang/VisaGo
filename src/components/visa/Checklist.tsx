// components/visa/Checklist.tsx — 材料检查清单（勾选进度）
import { useMemo, useState } from 'react'
import { useI18n } from '@/i18n'
import type { Requirement } from '@/types'

interface Props {
  requirements: Requirement[]
}

export function Checklist({ requirements }: Props) {
  const { t } = useI18n()
  const [checked, setChecked] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const percent = useMemo(
    () => (requirements.length ? Math.round((checked.size / requirements.length) * 100) : 0),
    [checked.size, requirements.length],
  )

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#F3F4F6]">
          <div
            className="h-full rounded-full bg-[#39A2B8] transition-all duration-600 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-ink/60">{percent}%</span>
      </div>
      <div className="space-y-2">
        {requirements.map((r) => (
          <label
            key={r.id}
            className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-[#F9F9F6]"
          >
            <input
              type="checkbox"
              checked={checked.has(r.id)}
              onChange={() => toggle(r.id)}
              className="h-4 w-4 accent-[#39A2B8]"
            />
            <span
              className={`flex-1 text-sm ${checked.has(r.id) ? 'text-ink/60 line-through' : 'text-ink'}`}
            >
              {r.name.zh}
            </span>
            <span className="shrink-0 text-xs text-ink/60">
              {r.required ? t('encyclopedia.required') : t('encyclopedia.optional')}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
