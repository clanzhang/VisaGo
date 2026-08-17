// components/assistant/Step2VisaType.tsx — 第二步：选择签证类型
import { useI18n } from '@/i18n'
import { VButton, VBadge } from '@/components/common'
import { getVisaExtra } from '@/data/encyclopedia-extra'
import { getVisaOfficialFee, formatFee } from '@/data/visa-fees'
import type { Country } from '@/types'

interface Props {
  country: Country
  selectedVisaTypeId: string | null
  onSelect: (id: string) => void
  onBack: () => void
  onNext: () => void
}

export function Step2VisaType({ country, selectedVisaTypeId, onSelect, onBack, onNext }: Props) {
  const { t, pickL } = useI18n()

  return (
    <div className="anim-card rounded-2xl bg-white p-6 shadow-card">
      <h2 className="mb-5 text-lg font-bold text-ink">
        {country.flag} {pickL(country.name)} — {t('assistant.selectVisaType')}
      </h2>
      <div className="space-y-4">
        {country.visaTypes.map((v) => {
          const active = v.id === selectedVisaTypeId
          const vExtra = getVisaExtra(country.id, v.id)
          const vOfficial = getVisaOfficialFee(country.id, v.id, {
            serviceFee: vExtra?.fees.serviceFee ?? v.serviceFee?.amount ?? 0,
            courierFee: vExtra?.fees.courierFee ?? 0,
            photoFee: vExtra?.fees.photoFee ?? 0,
          })
          const total = vExtra ? vExtra.fees.visaFee + vExtra.fees.serviceFee + vExtra.fees.courierFee + vExtra.fees.photoFee : v.fee.amount
          const showFrom = vOfficial && vOfficial.tiers.length > 1
          const allFree = vOfficial ? vOfficial.tiers.every((tr) => tr.currency === 'FREE' || tr.amount === 0) : false
          const firstPaid = vOfficial?.tiers.find((tr) => tr.currency !== 'FREE')
          return (
            <button
              key={v.id}
              onClick={() => onSelect(v.id)}
              className={`w-full rounded-2xl border-2 p-5 text-left transition-all duration-150 ${
                active ? 'border-primary bg-primary/5' : 'border-ink/5 hover:border-ink/15'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base font-semibold text-ink">{pickL(v.name)}</div>
                  <div className="mt-1 text-xs text-ink/60">
                    {t('assistant.duration')}: {v.duration} · {t('assistant.validity')}: {v.validity}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-lg font-bold text-primary">
                    {vOfficial
                      ? allFree
                        ? t('assistant.free')
                        : showFrom
                          ? `${firstPaid ? formatFee(firstPaid) : ''} ${t('assistant.from')}`
                          : firstPaid
                            ? formatFee(firstPaid)
                            : `¥${total}`
                      : `¥${total}`}
                  </div>
                  {showFrom && (
                    <div className="mt-0.5 text-[11px] text-ink/60">
                      {vOfficial?.tiers.map((tr) => formatFee(tr)).join(' / ')}
                    </div>
                  )}
                  <div className="text-xs text-ink/60">{t('assistant.total')}</div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <VBadge tone={v.entries === 'single' ? 'default' : 'primary'}>
                  {v.entries === 'single' ? t('assistant.single') : t('assistant.multiple')}
                </VBadge>
                {v.needInterview && <VBadge tone="warning">{t('assistant.needInterview')}</VBadge>}
                {v.canApplyOnline && <VBadge tone="cyan">{t('assistant.canApplyOnline')}</VBadge>}
                <VBadge tone="success">
                  {v.processingDays.min}-{v.processingDays.max} {t('assistant.days')}
                </VBadge>
              </div>
            </button>
          )
        })}
      </div>
      <div className="mt-6 flex justify-between">
        <VButton variant="secondary" size="lg" onClick={onBack}>
          {t('assistant.back')}
        </VButton>
        <VButton size="lg" disabled={!selectedVisaTypeId} onClick={onNext}>
          {t('assistant.next')}
        </VButton>
      </div>
    </div>
  )
}
