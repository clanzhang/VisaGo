// components/visa/ResultGenerator.tsx — 第三步：生成材料（选择申请目标 + 生成结果）
import { VButton } from '@/components/common'
import { useI18n } from '@/i18n'
import { DOC_REQUIRED_FIELDS, FIELD_SPECS } from '@/data/field-specs'
import type { TripData } from '@/types'

interface Props {
  /** 核对后的资料字段（P0-4：生成前检测缺失字段） */
  profile?: Record<string, string>
  /** 行程数据的来源文件（P2-21） */
  tripSource?: string | null
  country: string
  visaType: string
  docType: 'itinerary' | 'employment' | 'cover'
  tripData: TripData | null
  generated: string
  generating: boolean
  /** 是否正在导出 PDF */
  exporting?: boolean
  onCountryChange: (v: string) => void
  onVisaTypeChange: (v: string) => void
  onDocTypeChange: (v: 'itinerary' | 'employment' | 'cover') => void
  onGenerate: () => void
  onExport: () => void
}

const COUNTRIES = ['日本', '韩国', '泰国', '申根', '美国', '英国', '澳大利亚']
const VISA_TYPES = ['旅游签证', '商务签证', '探亲签证', '学生签证']
// 生成目标取值保持中文（用于 AI 文档生成），仅 UI 显示本地化
const COUNTRY_EN: Record<string, string> = {
  日本: 'Japan', 韩国: 'South Korea', 泰国: 'Thailand', 申根: 'Schengen',
  美国: 'United States', 英国: 'United Kingdom', 澳大利亚: 'Australia',
}
const VISA_TYPE_EN: Record<string, string> = {
  旅游签证: 'Tourist', 商务签证: 'Business', 探亲签证: 'Family Visit', 学生签证: 'Student',
}
const DOC_TYPES = [
  { id: 'itinerary', labelKey: 'scan.docItinerary' },
  { id: 'employment', labelKey: 'scan.docEmployment' },
  { id: 'cover', labelKey: 'scan.docCover' },
] as const

export function ResultGenerator({
  profile,
  tripSource,
  country,
  visaType,
  docType,
  tripData,
  generated,
  generating,
  exporting = false,
  onCountryChange,
  onVisaTypeChange,
  onDocTypeChange,
  onGenerate,
  onExport,
}: Props) {
  const { t, isZh, pickL } = useI18n()
  const countryLabel = (v: string) => (isZh ? v : COUNTRY_EN[v] ?? v)
  const visaTypeLabel = (v: string) => (isZh ? v : VISA_TYPE_EN[v] ?? v)
  // P0-4：生成当前文档所必需但缺失的字段（避免带占位符的残缺文档）
  const docLabelKey = DOC_TYPES.find((d) => d.id === docType)?.labelKey ?? 'scan.docItinerary'
  const missingForDoc = profile
    ? DOC_REQUIRED_FIELDS[docType].filter((k) => !(profile[k] ?? '').trim())
    : []
  const missingLabels = missingForDoc.map((k) => {
    const f = FIELD_SPECS.find((x) => x.key === k)
    return f ? pickL({ zh: f.label, en: f.label }) : k
  })
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl bg-white p-6 shadow-card">
        <h2 className="mb-4 text-lg font-bold text-ink">{t('scan.chooseTarget')}</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/60">{t('scan.country')}</label>
            <select
              value={country}
              onChange={(e) => onCountryChange(e.target.value)}
              className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40"
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{countryLabel(c)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/60">{t('scan.visaType')}</label>
            <select
              value={visaType}
              onChange={(e) => onVisaTypeChange(e.target.value)}
              className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40"
            >
              {VISA_TYPES.map((c) => (
                <option key={c} value={c}>{visaTypeLabel(c)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/60">{t('scan.docType')}</label>
            <div className="grid grid-cols-3 gap-2">
              {DOC_TYPES.map((dt) => (
                <button
                  key={dt.id}
                  onClick={() => onDocTypeChange(dt.id)}
                  className={`rounded-lg border-2 px-2 py-2 text-xs font-medium transition-all ${
                    docType === dt.id ? 'border-primary bg-primary/5 text-primary' : 'border-ink/10 text-ink/60'
                  }`}
                >
                  {t(dt.labelKey)}
                </button>
              ))}
            </div>
          </div>

          {/* 行程数据预览（识别到行程文件时显示） */}
          {docType === 'itinerary' && tripData && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
                <span className="h-4 w-4 icon-[mdi-light--map-marker]" aria-hidden="true" />
                {t('scan.tripExtracted')}
                {tripSource && <span className="text-[11px] font-normal text-ink/60">({t('scan.sourceFrom', { file: tripSource })})</span>}
              </div>
              <dl className="space-y-1 text-xs text-ink/70">
                <div className="flex justify-between"><dt className="text-ink/60">{t('scan.tripDest')}</dt><dd className="font-medium">{tripData.destination || country}</dd></div>
                <div className="flex justify-between"><dt className="text-ink/60">{t('scan.tripDepart')}</dt><dd className="font-medium">{tripData.start_date || '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-ink/60">{t('scan.tripReturn')}</dt><dd className="font-medium">{tripData.end_date || '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-ink/60">{t('scan.tripDays')}</dt><dd className="font-medium">{tripData.days ?? tripData.daily_plan?.length ?? '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-ink/60">{t('scan.tripCities')}</dt><dd className="font-medium">{(tripData.cities ?? []).join('、') || '—'}</dd></div>
              </dl>
              {tripData.daily_plan && tripData.daily_plan.length > 0 && (
                <div className="mt-2 border-t border-primary/15 pt-2">
                  <div className="mb-1 text-[11px] text-ink/60">{t('scan.dailyPlan')}</div>
                  <div className="max-h-28 space-y-0.5 overflow-y-auto text-[11px] text-ink/70">
                    {tripData.daily_plan.map((d, i) => (
                      <div key={i}>· {t('scan.dayN', { n: d.day ?? i + 1 })} {d.date ? `(${d.date})` : ''} {d.city || ''}: {d.activity || ''}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {missingForDoc.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-700" role="status">
              {t('scan.docMissingFor', { doc: t(docLabelKey), fields: missingLabels.join(isZh ? '、' : ', ') })}
            </div>
          )}

          <VButton className="w-full" onClick={onGenerate} disabled={generating}>
            {generating ? t('scan.generateText') : t('scan.generate')}
          </VButton>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">{t('scan.result')}</h2>
          {generated && (
            <VButton variant="secondary" size="sm" onClick={onExport} disabled={generating || exporting}>
              {exporting ? t('scan.exporting') : t('scan.exportPdf')}
            </VButton>
          )}
        </div>
        {generated ? (
          <pre className="max-h-[480px] overflow-y-auto whitespace-pre-wrap rounded-xl bg-[#F9F9F6] p-4 text-sm leading-relaxed text-ink/75">
            {generated}
          </pre>
        ) : (
          <div className="flex h-64 items-center justify-center rounded-xl bg-[#F9F9F6] text-sm text-ink/60">
            {t('scan.generateHint')}
          </div>
        )}
      </div>
    </div>
  )
}
