// components/visa/RequirementList.tsx — 签证百科材料清单展示
// 支持：必交/选交分组、红/灰圆点、材料数量统计、导出 PDF、默认折叠
import { useMemo, useState } from 'react'
import { useI18n } from '@/i18n'
import { VButton } from '@/components/common'
import { REQUIREMENT_CATEGORIES } from '@/data/countries'
import { exportPdf, isTauri } from '@/api/tauri'
import type { Requirement } from '@/types'

interface Props {
  countryName: string
  requirements: Requirement[]
  /** 是否显示「需翻译件」提示条（新西兰） */
  translationBanner?: { text: string; bg: string; border: string } | null
}

const CATEGORY_ORDER = ['basic', 'identity', 'financial', 'travel', 'extra'] as const

const CATEGORY_ICON: Record<(typeof CATEGORY_ORDER)[number], string> = {
  basic: '📋',
  identity: '🪪',
  financial: '💰',
  travel: '🗺️',
  extra: '➕',
}

export function RequirementList({ countryName, requirements, translationBanner }: Props) {
  const { t } = useI18n()
  // 材料多时默认折叠（申根）
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(
    () => Object.fromEntries(CATEGORY_ORDER.map((c) => [c, requirements.length > 8])),
  )
  const [exporting, setExporting] = useState(false)

  const requiredCount = useMemo(() => requirements.filter((r) => r.required).length, [requirements])
  const optionalCount = requirements.length - requiredCount

  const groups = useMemo(
    () =>
      CATEGORY_ORDER.map((cat) => ({
        cat,
        label: REQUIREMENT_CATEGORIES[cat].zh,
        icon: REQUIREMENT_CATEGORIES[cat].icon,
        list: requirements.filter((r) => r.category === cat),
      })).filter((g) => g.list.length > 0),
    [requirements],
  )

  async function handleExport() {
    setExporting(true)
    try {
      const rows = requirements
        .map(
          (r, i) =>
            `<tr>
              <td style="padding:8px;border:1px solid #ddd;text-align:center">${i + 1}</td>
              <td style="padding:8px;border:1px solid #ddd">${r.name.zh}</td>
              <td style="padding:8px;border:1px solid #ddd;text-align:center">${r.required ? '必交' : '选交'}</td>
              <td style="padding:8px;border:1px solid #ddd;text-align:center">${r.translationRequired ? '需翻译件' : '—'}</td>
              <td style="padding:8px;border:1px solid #ddd">${r.notes?.zh ?? ''}</td>
            </tr>`,
        )
        .join('')
      const html = `<html><head><meta charset="utf-8"><style>body{font-family:-apple-system,sans-serif;padding:24px}h1{font-size:18px}table{width:100%;border-collapse:collapse;margin-top:12px;font-size:12px}th{background:#f5f5f5;padding:8px;border:1px solid #ddd}</style></head><body>
        <h1>${countryName}签证材料清单</h1>
        <p>必交 ${requiredCount} 项 / 选交 ${optionalCount} 项</p>
        <table><thead><tr><th>序号</th><th>材料名称</th><th>必交/选交</th><th>翻译</th><th>备注</th></tr></thead><tbody>${rows}</tbody></table>
        <p style="color:#888;font-size:11px;margin-top:16px">由 VisaGo 生成 · 请以官方最新要求为准</p>
      </body></html>`
      if (isTauri()) {
        await exportPdf(html, `${countryName}-材料清单`)
      } else {
        // 浏览器环境降级：新窗口打印
        const w = window.open('', '_blank')
        if (w) {
          w.document.write(html)
          w.document.close()
          w.print()
        } else {
          alert('无法导出 PDF，请在桌面端应用中使用')
        }
      }
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* 新西兰翻译提示条 */}
      {translationBanner && (
        <div
          className="rounded-r-lg px-4 py-3 text-sm font-medium text-ink/80"
          style={{ backgroundColor: translationBanner.bg, borderLeft: `3px solid ${translationBanner.border}` }}
        >
          {translationBanner.text}
        </div>
      )}

      {/* 材料数量统计 + 导出 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            必交 {requiredCount} 项
          </span>
          <span className="rounded-full bg-ink/5 px-3 py-1 text-xs font-semibold text-ink/55">
            选交 {optionalCount} 项
          </span>
          <span className="text-xs text-ink/40">共 {requirements.length} 项</span>
        </div>
        <VButton variant="secondary" size="sm" onClick={handleExport} disabled={exporting}>
          {exporting ? '生成中…' : `📄 ${t('encyclopedia.exportPdf')}`}
        </VButton>
      </div>

      {/* 必交/选交分组 */}
      <div className="space-y-3">
        {groups.map((g) => {
          const required = g.list.filter((r) => r.required)
          const optional = g.list.filter((r) => !r.required)
          const all = [...required, ...optional]
          const isCollapsed = collapsed[g.cat]
          return (
            <div key={g.cat} className="overflow-hidden rounded-xl border border-ink/5">
              {/* 分组标题（可点击折叠） */}
              <button
                onClick={() => setCollapsed((prev) => ({ ...prev, [g.cat]: !prev[g.cat] }))}
                className="flex w-full items-center gap-2 bg-[#F9F9F6] px-4 py-2.5 text-left"
              >
                <span className="text-sm text-ink/40">{CATEGORY_ICON[g.cat]}</span>
                <span className="text-sm font-semibold text-ink">{g.label}</span>
                <span className="ml-1 text-xs text-ink/35">
                  {required.length > 0 && <span className="text-red-500">必交 {required.length}</span>}
                  {required.length > 0 && optional.length > 0 && ' / '}
                  {optional.length > 0 && <span>选交 {optional.length}</span>}
                </span>
                <span className={`ml-auto text-xs text-ink/30 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}>▾</span>
              </button>
              {/* 材料列表（默认折叠） */}
              {!isCollapsed && (
                <ul className="divide-y divide-ink/5">
                  {all.map((r) => (
                    <li key={r.id} className="flex items-start gap-2.5 px-4 py-2.5">
                      {/* 必交红点 / 选交灰点 */}
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${r.required ? 'bg-red-500' : 'bg-ink/25'}`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-ink">{r.name.zh}</span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                              r.required ? 'bg-red-500/10 text-red-500' : 'bg-ink/5 text-ink/45'
                            }`}
                          >
                            {r.required ? '必交' : '选交'}
                          </span>
                          {r.translationRequired && (
                            <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">
                              需附英文翻译件
                            </span>
                          )}
                        </div>
                        {r.notes?.zh && (
                          <div className="mt-0.5 text-xs text-ink/45">📎 {r.notes.zh}</div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
