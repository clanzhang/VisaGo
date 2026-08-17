// components/visa/ResultGenerator.tsx — 第四步：生成材料
// P2-15：国家/签证类型复用 countries.ts（id 取值、pickL 展示、zh 名进 prompt），默认沿用申请流程目的地
// P2-16：空态=生成前检查清单；P2-17：分阶段进度+耗时+可取消；P2-18：结果可编辑+带修改要求重新生成
// P2-19：导出可读反馈+路径展示；P2-20/21：行程预览展开式+来源+可编辑
import { useEffect, useState } from 'react'
import { VButton } from '@/components/common'
import { useI18n } from '@/i18n'
import { DOC_REQUIRED_FIELDS, FIELD_SPECS } from '@/data/field-specs'
import { countries } from '@/data/countries'
import type { TripData } from '@/types'

const DOC_TYPES = [
  { id: 'itinerary', labelKey: 'scan.docItinerary' },
  { id: 'employment', labelKey: 'scan.docEmployment' },
  { id: 'cover', labelKey: 'scan.docCover' },
] as const

export type DocType = 'itinerary' | 'employment' | 'cover'

interface Props {
  /** 核对后的资料字段（生成前检测缺失） */
  profile?: Record<string, string>
  /** 行程数据来源文件 */
  tripSource?: string | null
  countryId: string
  visaTypeId: string
  docType: DocType
  tripData: TripData | null
  generated: string
  generating: boolean
  genPhase?: 'preparing' | 'writing' | 'polishing' | null
  genElapsed?: number
  exporting?: boolean
  exportResult?: string | null
  onCountryIdChange: (id: string) => void
  onVisaTypeIdChange: (id: string) => void
  onDocTypeChange: (d: DocType) => void
  onTripDataChange: (d: TripData) => void
  onGenerate: (reviseNote?: string) => void
  onCancelGenerate: () => void
  onExport: (content: string) => void
  onBack: () => void
}

const PHASE_KEYS: Record<string, string> = {
  preparing: 'scan.genProgressPhase1',
  writing: 'scan.genProgressPhase2',
  polishing: 'scan.genProgressPhase3',
}

export function ResultGenerator({
  profile,
  tripSource,
  countryId,
  visaTypeId,
  docType,
  tripData,
  generated,
  generating,
  genPhase,
  genElapsed,
  exporting = false,
  exportResult,
  onCountryIdChange,
  onVisaTypeIdChange,
  onDocTypeChange,
  onTripDataChange,
  onGenerate,
  onCancelGenerate,
  onExport,
  onBack,
}: Props) {
  const { t, isZh, pickL } = useI18n()
  const country = countries.find((c) => c.id === countryId)
  const visaType = country?.visaTypes.find((v) => v.id === visaTypeId) ?? country?.visaTypes[0] ?? null

  // P2-18：可编辑结果（textarea 草稿，与 generated 同步）
  const [draft, setDraft] = useState(generated)
  useEffect(() => {
    setDraft(generated)
  }, [generated])
  // P2-18：重新生成时的修改要求
  const [reviseNote, setReviseNote] = useState('')
  // P2-20：行程「每日安排」展开全部
  const [showAllDays, setShowAllDays] = useState(false)

  const docLabelKey = DOC_TYPES.find((d) => d.id === docType)?.labelKey ?? 'scan.docItinerary'
  const missingForDoc = profile
    ? DOC_REQUIRED_FIELDS[docType].filter((k) => !(profile[k] ?? '').trim())
    : []
  const missingLabels = missingForDoc.map((k) => {
    const f = FIELD_SPECS.find((x) => x.key === k)
    return f ? pickL({ zh: f.label, en: f.label }) : k
  })

  const requiredKeys = DOC_REQUIRED_FIELDS[docType]
  const ready = missingForDoc.length === 0

  const days = tripData?.daily_plan ?? []
  const visibleDays = showAllDays ? days : days.slice(0, 3)

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      {/* 左栏：选择目标 + 行程 + 生成 */}
      <div className="rounded-2xl bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">{t('scan.chooseTarget')}</h2>
          <VButton type="button" variant="secondary" size="sm" onClick={onBack}>
            {t('scan.backToReview')}
          </VButton>
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="gen-country" className="mb-1.5 block text-sm font-medium text-ink/60">{t('scan.country')}</label>
            <select
              id="gen-country"
              value={countryId}
              onChange={(e) => {
                onCountryIdChange(e.target.value)
                onVisaTypeIdChange('')
              }}
              className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5"
            >
              {countries.map((c) => (
                <option key={c.id} value={c.id}>{pickL(c.name)}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="gen-visa-type" className="mb-1.5 block text-sm font-medium text-ink/60">{t('scan.visaType')}</label>
            <select
              id="gen-visa-type"
              value={visaType?.id ?? ''}
              onChange={(e) => onVisaTypeIdChange(e.target.value)}
              className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5"
            >
              <option value="">{t('common.select')}</option>
              {(country?.visaTypes ?? []).map((v) => (
                <option key={v.id} value={v.id}>{pickL(v.name)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/60">{t('scan.docType')}</label>
            <div className="grid grid-cols-3 gap-2">
              {DOC_TYPES.map((dt) => (
                <button
                  key={dt.id}
                  type="button"
                  onClick={() => onDocTypeChange(dt.id)}
                  className={`rounded-lg border-2 px-2 py-2 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                    docType === dt.id ? 'border-primary bg-primary/5 text-primary' : 'border-ink/10 text-ink/60'
                  }`}
                >
                  {t(dt.labelKey)}
                </button>
              ))}
            </div>
          </div>

          {/* 行程数据预览（P2-21：来源 + 可编辑；P2-20：前 3 天 + 查看全部） */}
          {docType === 'itinerary' && tripData && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-primary">
                <span className="h-4 w-4 icon-[mdi-light--map-marker]" aria-hidden="true" />
                {t('scan.tripExtracted')}
                {tripSource && <span className="text-[11px] font-normal text-ink/60">({t('scan.sourceFrom', { file: tripSource })})</span>}
              </div>
              <p className="mb-2 text-[11px] text-ink/60">{t('scan.tripEditableHint')}</p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="mb-1 block text-[11px] text-ink/60">{t('scan.tripDest')}</label>
                  <input
                    value={tripData.destination ?? ''}
                    onChange={(e) => onTripDataChange({ ...tripData, destination: e.target.value })}
                    className="w-full rounded-lg border border-ink/10 bg-white px-2 py-1.5 text-sm outline-none focus:border-primary/40"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-ink/60">{t('scan.tripDepart')}</label>
                  <input
                    type="date"
                    value={tripData.start_date ?? ''}
                    onChange={(e) => onTripDataChange({ ...tripData, start_date: e.target.value })}
                    className="w-full rounded-lg border border-ink/10 bg-white px-2 py-1.5 text-sm outline-none focus:border-primary/40"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-ink/60">{t('scan.tripReturn')}</label>
                  <input
                    type="date"
                    value={tripData.end_date ?? ''}
                    onChange={(e) => onTripDataChange({ ...tripData, end_date: e.target.value })}
                    className="w-full rounded-lg border border-ink/10 bg-white px-2 py-1.5 text-sm outline-none focus:border-primary/40"
                  />
                </div>
              </div>
              {days.length > 0 && (
                <div className="mt-2 border-t border-primary/15 pt-2">
                  <div className="mb-1 text-[11px] text-ink/60">{t('scan.dailyPlan')}</div>
                  <div className="space-y-0.5 text-[11px] text-ink/70">
                    {visibleDays.map((d, i) => (
                      <div key={i}>· {t('scan.dayN', { n: d.day ?? i + 1 })} {d.date ? `(${d.date})` : ''} {d.city || ''}: {d.activity || ''}</div>
                    ))}
                  </div>
                  {days.length > 3 && (
                    <button
                      type="button"
                      onClick={() => setShowAllDays((v) => !v)}
                      aria-expanded={showAllDays}
                      className="mt-1.5 text-[11px] font-medium text-primary transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    >
                      {showAllDays ? t('assistant.collapse') : t('scan.tripShowAll', { n: days.length })}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* P0-4：缺失字段提示（不阻止生成，但明确后果） */}
          {missingForDoc.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-700" role="status">
              {t('scan.docMissingFor', { doc: t(docLabelKey), fields: missingLabels.join(isZh ? '、' : ', ') })}
            </div>
          )}

          {/* P2-17：生成进度（分阶段 + 耗时 + 可取消） */}
          {generating && (
            <div className="rounded-xl border border-ink/5 bg-[#FBFCFD] p-4" role="status" aria-live="polite">
              <div className="flex items-center gap-2 text-sm font-medium text-ink">
                <span className="h-4 w-4 animate-spin text-primary icon-[mdi-light--refresh]" aria-hidden="true" />
                {genPhase ? t(PHASE_KEYS[genPhase]) : t('scan.generateText')}
              </div>
              <div className="mt-1.5 text-xs text-ink/60">{t('scan.genElapsed', { s: genElapsed ?? 0 })}</div>
              <VButton type="button" variant="secondary" size="sm" className="mt-3" onClick={onCancelGenerate}>
                {t('scan.cancelGenerate')}
              </VButton>
            </div>
          )}

          {!generating && (
            <VButton type="button" className="w-full" onClick={() => onGenerate()}>
              {t('scan.generate')}
            </VButton>
          )}
        </div>
      </div>

      {/* 右栏：生成前检查清单 / 生成结果（可编辑） */}
      <div className="rounded-2xl bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">{t('scan.result')}</h2>
          {draft.trim() !== '' && !generating && (
            <VButton type="button" variant="secondary" size="sm" onClick={() => onExport(draft)} disabled={exporting}>
              {exporting ? t('scan.exporting') : t('scan.exportPdf')}
            </VButton>
          )}
        </div>

        {draft.trim() !== '' ? (
          <>
            {/* P2-18：可编辑结果 */}
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={18}
              spellCheck={false}
              aria-label={t('scan.result')}
              className="w-full resize-y whitespace-pre-wrap rounded-xl border border-ink/10 bg-[#F9F9F6] p-4 text-sm leading-relaxed text-ink/80 outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5"
            />
            {/* P2-18：重新生成（可带修改要求） */}
            <div className="mt-3 space-y-2">
              <label htmlFor="gen-revise-note" className="block text-xs font-medium text-ink/60">
                {t('scan.genNote')}
              </label>
              <div className="flex gap-2">
                <input
                  id="gen-revise-note"
                  value={reviseNote}
                  onChange={(e) => setReviseNote(e.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary/40"
                />
                <VButton type="button" variant="secondary" size="sm" onClick={() => onGenerate(reviseNote)} disabled={generating}>
                  {t('scan.regenerate')}
                </VButton>
              </div>
            </div>
            {/* P2-19：导出反馈（可读 + 路径可复制） */}
            {exportResult && (
              <div className="mt-3 rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-xs text-success" role="status">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <span className="h-4 w-4 icon-[mdi-light--check-circle]" aria-hidden="true" />
                  {t('scan.exportOk')}
                </span>
                <p className="mt-1 break-all font-normal text-ink/60" title={exportResult}>
                  {t('scan.exportPath', { path: exportResult })}
                </p>
              </div>
            )}
          </>
        ) : (
          /* P2-16：生成前检查清单（空态不再是死胡同） */
          <div className="rounded-xl border border-ink/5 bg-[#FBFCFD] p-4">
            <p className="text-sm font-semibold text-ink">{t('scan.genChecklistTitle')}</p>
            <p className="mt-1 text-xs text-ink/60">{t(docLabelKey)} · {t('scan.genUses')}:</p>
            <ul className="mt-2 space-y-1.5">
              {requiredKeys.map((k) => {
                const f = FIELD_SPECS.find((x) => x.key === k)
                const filled = !!(profile?.[k] ?? '').trim()
                return (
                  <li key={k} className="flex items-center gap-2 text-xs">
                    {filled ? (
                      <span className="h-4 w-4 shrink-0 text-success icon-[mdi-light--check-circle]" aria-hidden="true" />
                    ) : (
                      <span className="h-4 w-4 shrink-0 text-amber-500 icon-[mdi-light--alert-circle]" aria-hidden="true" />
                    )}
                    <span className={filled ? 'text-ink/70' : 'font-medium text-amber-700'}>
                      {f ? pickL({ zh: f.label, en: f.label }) : k}
                    </span>
                  </li>
                )
              })}
            </ul>
            <p className={`mt-3 border-t border-ink/5 pt-3 text-xs ${ready ? 'font-medium text-success' : 'text-amber-700'}`} role="status">
              {ready ? t('scan.genChecklistReady') : t('scan.docMissingFor', { doc: t(docLabelKey), fields: missingLabels.join(isZh ? '、' : ', ') })}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
