// components/assistant/Step4Result.tsx — 第四步：方案结果（材料 + 费用 + 周期 + 追踪）
import { useI18n } from '@/i18n'
import { VButton } from '@/components/common'
import { MaterialChecklist } from '@/components/visa'
import { getVisaExtra } from '@/data/encyclopedia-extra'
import { getVisaOfficialFee, formatFee } from '@/data/visa-fees'
import type { Country, UserProfile, VisaType } from '@/types'

interface Props {
  country: Country
  visaType: VisaType
  profile: Partial<UserProfile> | null
  totalFees: number
  materialsReady: boolean
  added: boolean
  onMaterialsReadyChange: (ready: boolean) => void
  onReset: () => void
  onBack: () => void
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
  onReset,
  onBack,
  onTrack,
}: Props) {
  const { t, pickL } = useI18n()
  const extra = getVisaExtra(country.id, visaType.id)

  const matchedDistrict = profile?.homeProvince
    ? visaType.consularDistricts.find((d) => d.provinces.includes(profile.homeProvince!))
    : undefined

  return (
    <div className="anim-card rounded-2xl bg-white p-6 shadow-card">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">
          {country.flag} {pickL(country.name)} · {pickL(visaType.name)}
        </h2>
        <div className="flex gap-2">
          <VButton variant="secondary" size="sm" onClick={onReset}>
            {t('assistant.reset')}
          </VButton>
          <VButton variant="secondary" size="sm" onClick={onBack}>
            {t('assistant.back')}
          </VButton>
        </div>
      </div>

      {/* 领区 */}
      {matchedDistrict && (
        <div className="mb-6 rounded-xl bg-[#E0F7FA] px-5 py-4">
          <div className="text-xs text-ink/60">{t('assistant.yourDistrict')}</div>
          <div className="mt-1 text-sm font-semibold text-primary">{pickL(matchedDistrict.name)}</div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 材料（自动检测/上传/生成） */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-ink">{t('assistant.materials')}</h3>
          <div className="max-h-[640px] overflow-y-auto rounded-xl border border-ink/5 p-4">
            <MaterialChecklist
              countryName={pickL(country.name)}
              tripDates={{
                start: new Date().toISOString().slice(0, 10),
                end: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
              }}
              onAllReady={onMaterialsReadyChange}
            />
          </div>
        </div>

        {/* 费用与周期 */}
        <div className="space-y-4">
          <div className="rounded-xl border border-ink/5 p-5">
            <h3 className="mb-3 text-sm font-semibold text-ink">{t('assistant.feeBreakdown')}</h3>
            {(() => {
              const f = extra?.fees
              const official = getVisaOfficialFee(country.id, visaType.id, {
                serviceFee: f?.serviceFee ?? visaType.serviceFee?.amount ?? 0,
                courierFee: f?.courierFee ?? 0,
                photoFee: f?.photoFee ?? 0,
              })
              if (official && official.tiers.length > 0) {
                const firstPaidTier = official.tiers.find((tr) => tr.currency !== 'FREE')
                return (
                  <>
                    <div className="space-y-2">
                      {official.tiers.map((tr, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-ink/60">{pickL(tr.label)}</span>
                          <span className="font-medium">{formatFee(tr)}</span>
                        </div>
                      ))}
                      {official.serviceFee > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-ink/60">{t('assistant.serviceFee')}</span>
                          <span className="font-medium">¥{official.serviceFee}</span>
                        </div>
                      )}
                      {official.courierFee > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-ink/60">{t('encyclopedia.courierFee')}</span>
                          <span className="font-medium">¥{official.courierFee}</span>
                        </div>
                      )}
                      {official.photoFee > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-ink/60">{t('encyclopedia.photoFee')}</span>
                          <span className="font-medium">¥{official.photoFee}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex justify-between border-t border-ink/10 pt-3">
                      <span className="text-sm font-medium">{t('assistant.total')}</span>
                      <span className="font-display text-lg font-bold text-primary">
                        {firstPaidTier ? `${formatFee(firstPaidTier)} ${t('assistant.from')}` : t('assistant.free')}
                      </span>
                    </div>
                    {(official.effectiveFrom || official.note || official.freeNote) && (
                      <div className="mt-3 space-y-1 text-xs text-ink/60">
                        {official.effectiveFrom && <p>📅 {t('encyclopedia.effectiveFrom')}: {official.effectiveFrom}</p>}
                        {official.freeNote && <p>{pickL(official.freeNote)}</p>}
                        {official.note && <p>ℹ️ {pickL(official.note)}</p>}
                      </div>
                    )}
                  </>
                )
              }
              const rows = [
                { label: t('assistant.visaFee'), value: f?.visaFee ?? visaType.fee.amount },
                { label: t('assistant.serviceFee'), value: f?.serviceFee ?? visaType.serviceFee?.amount ?? 0 },
                { label: t('encyclopedia.courierFee'), value: f?.courierFee ?? 0 },
                { label: t('encyclopedia.photoFee'), value: f?.photoFee ?? 0 },
              ]
              return (
                <>
                  <div className="space-y-2">
                    {rows.map((r) => (
                      <div key={r.label} className="flex justify-between text-sm">
                        <span className="text-ink/60">{r.label}</span>
                        <span className="font-medium">¥{r.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex justify-between border-t border-ink/10 pt-3">
                    <span className="text-sm font-medium">{t('assistant.total')}</span>
                    <span className="font-display text-lg font-bold text-primary">¥{totalFees}</span>
                  </div>
                </>
              )
            })()}
          </div>

          <div className="rounded-xl border border-ink/5 p-5">
            <h3 className="mb-3 text-sm font-semibold text-ink">{t('assistant.processingTime')}</h3>
            <div className="text-2xl font-bold text-ink">
              {visaType.processingDays.min}-{visaType.processingDays.max}
              <span className="ml-1 text-sm font-normal text-ink/60">{t('assistant.days')}</span>
            </div>
            <div className="mt-2 text-xs text-ink/60">
              {visaType.needInterview ? '🔴 ' : '🟢 '}
              {visaType.needInterview ? `${t('encyclopedia.needInterview')}: ${t('common.yes')}` : `${t('encyclopedia.needInterview')}: ${t('common.no')}`}
            </div>
          </div>

          <div className="rounded-xl bg-[#F9F9F6] p-5">
            <h3 className="mb-2 text-sm font-semibold text-ink">{t('assistant.notes')}</h3>
            <p className="text-sm leading-relaxed text-ink/70">{pickL(visaType.tips)}</p>
          </div>

          <VButton size="lg" className="w-full" onClick={onTrack} disabled={added || !materialsReady}>
            {added ? '✓ ' : ''}
            {!materialsReady ? t('assistant.materialsNotReady') : `+ ${t('assistant.trackApplication')}`}
          </VButton>
        </div>
      </div>
    </div>
  )
}
