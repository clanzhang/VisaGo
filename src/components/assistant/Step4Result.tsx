// components/assistant/Step4Result.tsx — 第四步：方案结果
// 布局：左栏材料清单（整页滚动，无内层滚动）＋ 右栏 sticky 摘要/行动区（完成度/费用/周期/CTA）
import { useEffect, useRef, useState } from 'react'
import { useI18n } from '@/i18n'
import { VButton } from '@/components/common'
import { MaterialChecklist } from '@/components/visa'
import { MATERIAL_TEMPLATE } from '@/lib/material-check'
import { getVisaExtra } from '@/data/encyclopedia-extra'
import { getVisaOfficialFee, formatFee } from '@/data/visa-fees'
import { KIND_KEYS, DISTRICT_NO_NEED_KEYS, districtNoNeedType } from '@/utils/districts'
import type { Country, UserProfile, VisaType } from '@/types'

interface Props {
  country: Country
  visaType: VisaType
  profile: Partial<UserProfile> | null
  totalFees: number
  materialsReady: boolean
  added: boolean
  onMaterialsReadyChange: (ready: boolean) => void
  /** 完成度上报（供 sticky 头部显示「已就绪 N / M」） */
  onProgressChange?: (done: number, total: number) => void
  onReset: () => void
  onTrack: () => void
}

export function Step4Result({
  country,
  visaType,
  profile,
  totalFees,
  materialsReady,
  added,
  onMaterialsReadyChange,
  onProgressChange,
  onReset,
  onTrack,
}: Props) {
  const { t, isZh, pickL } = useI18n()
  const extra = getVisaExtra(country.id, visaType.id)
  // 未完成材料（CTA 可点击，点击后高亮第一个未完成项）
  const [incompleteIds, setIncompleteIds] = useState<string[]>([])
  const [highlightPending, setHighlightPending] = useState(false)
  const [feeOpen, setFeeOpen] = useState(false)
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const total = MATERIAL_TEMPLATE.length
  const done = total - incompleteIds.length
  const percent = total > 0 ? Math.round((done / total) * 100) : 0

  // 材料就绪后清除高亮
  useEffect(() => {
    if (materialsReady) {
      setHighlightPending(false)
      if (highlightTimer.current) clearTimeout(highlightTimer.current)
    }
  }, [materialsReady])

  useEffect(() => () => {
    if (highlightTimer.current) clearTimeout(highlightTimer.current)
  }, [])

  // 完成度上报给父级（sticky 头部）
  useEffect(() => {
    onProgressChange?.(done, total)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, total])

  function handleTrackClick() {
    if (added) return
    if (!materialsReady) {
      setHighlightPending(true)
      if (highlightTimer.current) clearTimeout(highlightTimer.current)
      highlightTimer.current = setTimeout(() => setHighlightPending(false), 3000)
      return
    }
    onTrack()
  }

  const incompleteNames = incompleteIds.map((id) => t(`scan.materialName_${id}`))

  const matchedDistrict = profile?.homeProvince
    ? visaType.consularDistricts.find((d) => d.provinces.includes(profile.homeProvince!))
    : undefined
  const hasDistrictData = visaType.consularDistricts.length > 0
  const noNeedType = districtNoNeedType(country.visaType)
  const noNeedKey = noNeedType ? DISTRICT_NO_NEED_KEYS[noNeedType] : null
  const officialSource = visaType.consularDistricts.find((o) => o.source)?.source

  // 费用明细行（官方多档位优先）
  const feeRows = (() => {
    const f = extra?.fees
    const official = getVisaOfficialFee(country.id, visaType.id, {
      serviceFee: f?.serviceFee ?? visaType.serviceFee?.amount ?? 0,
      courierFee: f?.courierFee ?? 0,
      photoFee: f?.photoFee ?? 0,
    })
    if (official && official.tiers.length > 0) {
      const rows: { label: string; value: string }[] = official.tiers.map((tr) => ({
        label: pickL(tr.label),
        value: formatFee(tr),
      }))
      if (official.serviceFee > 0) rows.push({ label: t('assistant.serviceFee'), value: `¥${official.serviceFee}` })
      if (official.courierFee > 0) rows.push({ label: t('encyclopedia.courierFee'), value: `¥${official.courierFee}` })
      if (official.photoFee > 0) rows.push({ label: t('encyclopedia.photoFee'), value: `¥${official.photoFee}` })
      const firstPaidTier = official.tiers.find((tr) => tr.currency !== 'FREE')
      return { rows, totalLabel: firstPaidTier ? `${formatFee(firstPaidTier)} ${t('assistant.from')}` : t('assistant.free') }
    }
    const rows = [
      { label: t('assistant.visaFee'), value: `¥${f?.visaFee ?? visaType.fee.amount}` },
      { label: t('assistant.serviceFee'), value: `¥${f?.serviceFee ?? visaType.serviceFee?.amount ?? 0}` },
      { label: t('encyclopedia.courierFee'), value: `¥${f?.courierFee ?? 0}` },
      { label: t('encyclopedia.photoFee'), value: `¥${f?.photoFee ?? 0}` },
    ]
    return { rows, totalLabel: `¥${totalFees}` }
  })()

  return (
    <div className="anim-card rounded-2xl bg-white p-6 shadow-card">
      {/* 领区（三态，不再静默） */}
      {matchedDistrict ? (
        <div className="mb-6 rounded-xl bg-[#E0F7FA] px-5 py-4">
          <div className="text-xs text-ink/60">{t('assistant.yourDistrict')}</div>
          <div className="mt-1 text-sm font-semibold text-primary">{pickL(matchedDistrict.name)}</div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/60">
            {matchedDistrict.city && (
              <span className="inline-flex items-center gap-1">
                <span className="h-3.5 w-3.5 icon-[mdi-light--map-marker]" />
                {t('encyclopedia.districtCity')}: {matchedDistrict.city}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <span className="h-3.5 w-3.5 icon-[mdi-light--home]" />
              {t(KIND_KEYS[matchedDistrict.kind ?? 'consulate'])}
            </span>
            {visaType.acceptPersonal ? (
              <span className="inline-flex items-center gap-1 text-success">
                <span className="h-3.5 w-3.5 icon-[mdi-light--check-circle]" />
                {t('encyclopedia.acceptPersonalBadge')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-600">
                <span className="h-3.5 w-3.5 icon-[mdi-light--alert-circle]" />
                {t('encyclopedia.notAcceptPersonalBadge')}
              </span>
            )}
            {matchedDistrict.verifiedAt && (
              <span>{t('encyclopedia.districtSourceStatic', { date: matchedDistrict.verifiedAt })}</span>
            )}
          </div>
          {matchedDistrict.source && (
            <a
              href={matchedDistrict.source}
              target="_blank"
              rel="noreferrer"
              className="mt-1.5 inline-flex items-center gap-1 text-xs text-primary underline-offset-2 hover:underline"
            >
              {t('encyclopedia.districtOfficial')}
              <span className="h-3 w-3 icon-[mdi-light--arrow-right-circle]" />
            </a>
          )}
        </div>
      ) : hasDistrictData ? (
        profile?.homeProvince ? (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            {t('encyclopedia.districtNotFound', { province: profile.homeProvince })}
            {officialSource && (
              <a
                href={officialSource}
                target="_blank"
                rel="noreferrer"
                className="ml-2 inline-flex items-center gap-1 font-medium text-amber-900 underline underline-offset-2"
              >
                {t('encyclopedia.districtOfficial')}
                <span className="h-3 w-3 icon-[mdi-light--arrow-right-circle]" />
              </a>
            )}
          </div>
        ) : (
          <div className="mb-6 rounded-xl border border-dashed border-ink/15 bg-[#F9F9F6] px-5 py-4 text-sm text-ink/60">
            {t('assistant.districtFillProvince')}
          </div>
        )
      ) : noNeedKey ? (
        <div className="mb-6 rounded-xl border border-dashed border-ink/15 bg-[#F9F9F6] px-5 py-4 text-sm text-ink/70">
          ✈️ {t(noNeedKey)}
        </div>
      ) : (
        <div className="mb-6 rounded-xl border border-dashed border-ink/15 bg-[#F9F9F6] px-5 py-4 text-sm text-ink/70">
          🌐 {t('encyclopedia.districtNotCollected')}
        </div>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* 左栏：材料（整页滚动，无内层滚动容器） */}
        <div className="min-w-0">
          <h3 className="mb-3 text-sm font-semibold text-ink">{t('assistant.materials')}</h3>
          <div className="rounded-xl border border-ink/5 p-4">
            <MaterialChecklist
              countryName={pickL(country.name)}
              tripDates={{
                start: new Date().toISOString().slice(0, 10),
                end: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
              }}
              onAllReady={onMaterialsReadyChange}
              onIncompleteChange={setIncompleteIds}
              pendingHighlight={highlightPending}
            />
          </div>
          {/* C17：注意事项降为页脚级小字 */}
          <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-ink/60">
            <span className="mt-0.5 h-4 w-4 shrink-0 icon-[mdi-light--information]" />
            {pickL(visaType.tips)}
          </p>
        </div>

        {/* 右栏：sticky 摘要/行动区（窄屏堆叠到材料区下方） */}
        <div className="space-y-4 xl:sticky xl:top-16">
          {/* 完成度 */}
          <div className="rounded-xl border border-ink/5 p-5">
            <div className="mb-2 flex items-baseline justify-between">
              <h3 className="text-sm font-semibold text-ink">{t('assistant.summaryTitle')}</h3>
              <span className="font-display text-lg font-bold text-ink">{percent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#F3F4F6]">
              <div className="h-full rounded-full bg-success transition-all duration-500" style={{ width: `${percent}%` }} />
            </div>
            <p className="mt-2 text-xs text-ink/60">{t('assistant.summaryProgress', { done, total })}</p>
          </div>

          {/* 费用（明细可折叠，默认收起） */}
          <div className="rounded-xl border border-ink/5 p-5">
            <button
              type="button"
              onClick={() => setFeeOpen((v) => !v)}
              aria-expanded={feeOpen}
              aria-controls="step4-fee-detail"
              className="flex w-full items-center justify-between text-left"
            >
              <h3 className="text-sm font-semibold text-ink">{t('assistant.feeBreakdown')}</h3>
              <span className={`h-4 w-4 shrink-0 text-ink/60 transition-transform ${feeOpen ? '' : 'rotate-180'} icon-[mdi-light--chevron-down]`} />
            </button>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-sm text-ink/60">{t('assistant.total')}</span>
              <span className="font-display text-xl font-bold text-primary">{feeRows.totalLabel}</span>
            </div>
            {feeOpen && (
              <div id="step4-fee-detail" className="mt-3 space-y-1.5 border-t border-ink/5 pt-3">
                {feeRows.rows.map((r) => (
                  <div key={r.label} className="flex justify-between text-sm">
                    <span className="text-ink/60">{r.label}</span>
                    <span className="font-medium">{r.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 周期 + 面签 */}
          <div className="rounded-xl border border-ink/5 p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink/60">{t('assistant.processingTime')}</span>
              <span className="font-semibold text-ink">
                {visaType.processingDays.min}-{visaType.processingDays.max} {t('assistant.days')}
              </span>
            </div>
            <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-ink/60">
              {visaType.needInterview ? (
                <span className="h-4 w-4 shrink-0 text-red-500 icon-[mdi-light--alert-circle]" />
              ) : (
                <span className="h-4 w-4 shrink-0 text-success icon-[mdi-light--check-circle]" />
              )}
              {visaType.needInterview
                ? `${t('encyclopedia.needInterview')}: ${t('common.yes')}`
                : `${t('encyclopedia.needInterview')}: ${t('common.no')}`}
            </div>
          </div>

          {/* 主 CTA（唯一主行动） */}
          <div className="rounded-xl border border-ink/5 p-4">
            <VButton size="lg" className="w-full" onClick={handleTrackClick} disabled={added}>
              {added ? <span className="h-4 w-4 icon-[mdi-light--check]" /> : null}
              {!materialsReady
                ? incompleteIds.length > 0
                  ? t('assistant.materialsMissing', { n: incompleteIds.length, names: incompleteNames.join(isZh ? '、' : ', ') })
                  : t('assistant.materialsNotReady')
                : t('assistant.trackApplication')}
            </VButton>
            <p className="mt-2 text-center text-xs leading-relaxed text-ink/60">{t('assistant.trackHint')}</p>
          </div>

          {/* 重新开始（降级为脚注级操作） */}
          <div className="text-center">
            <button
              type="button"
              onClick={onReset}
              className="rounded-md px-2 py-1 text-xs text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink"
            >
              {t('assistant.reset')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
