// components/visa/FeeCalculator.tsx — 费用明细
import { useI18n } from '@/i18n'
import { getVisaExtra } from '@/data/encyclopedia-extra'
import { getVisaOfficialFee } from '@/data/visa-fees'
import { formatFee } from '@/data/visa-fees'
import type { VisaType } from '@/types'

interface Props {
  countryId: string
  visaType: VisaType
}

export function FeeCalculator({ countryId, visaType }: Props) {
  const { t, pickL } = useI18n()
  const extra = getVisaExtra(countryId, visaType.id)
  const fees = extra?.fees
  // 官方多档位明细（日本单次/两次/多次等）
  const official = getVisaOfficialFee(countryId, visaType.id, {
    serviceFee: fees?.serviceFee ?? 0,
    courierFee: fees?.courierFee ?? 0,
    photoFee: fees?.photoFee ?? 0,
  })

  if (official && official.tiers.length > 0) {
    const firstPaidTier = official.tiers.find((tr) => tr.currency !== 'FREE')
    return (
      <div>
        <div className="space-y-2.5">
          {official.tiers.map((tr, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-ink/60">{pickL(tr.label)}</span>
              <span className="font-medium text-ink">{formatFee(tr)}</span>
            </div>
          ))}
          {/* 服务费/快递费/照片费 */}
          {official.serviceFee > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink/55">{t('encyclopedia.serviceFee')}</span>
              <span className="font-medium text-ink">¥{official.serviceFee}</span>
            </div>
          )}
          {official.courierFee > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink/55">{t('encyclopedia.courierFee')}</span>
              <span className="font-medium text-ink">¥{official.courierFee}</span>
            </div>
          )}
          {official.photoFee > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink/55">{t('encyclopedia.photoFee')}</span>
              <span className="font-medium text-ink">¥{official.photoFee}</span>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-ink/10 pt-3">
            <span className="text-sm font-medium">{t('encyclopedia.total')}</span>
            <span className="font-display text-lg font-bold text-primary">
              {firstPaidTier ? `${formatFee(firstPaidTier)} ${t('assistant.from')}` : t('encyclopedia.free')}
            </span>
          </div>
        </div>
        {(official.effectiveFrom || official.note || official.freeNote) && (
          <div className="mt-4 space-y-1 text-xs text-ink/60">
            {official.effectiveFrom && (
              <p>📅 {t('encyclopedia.effectiveFrom')}: {official.effectiveFrom}</p>
            )}
            {official.freeNote && <p>{pickL(official.freeNote)}</p>}
            {official.note && <p>ℹ️ {pickL(official.note)}</p>}
          </div>
        )}
        <p className="mt-3 text-xs text-ink/60">{t('encyclopedia.feeNote')}</p>
      </div>
    )
  }

  const rows = [
    { label: t('encyclopedia.visaFee'), value: fees?.visaFee ?? visaType.fee.amount },
    { label: t('encyclopedia.serviceFee'), value: fees?.serviceFee ?? visaType.serviceFee?.amount ?? 0 },
    { label: t('encyclopedia.courierFee'), value: fees?.courierFee ?? 0 },
    { label: t('encyclopedia.photoFee'), value: fees?.photoFee ?? 0 },
  ]
  const total = rows.reduce((sum, r) => sum + r.value, 0)

  return (
    <div>
      <div className="space-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between text-sm">
            <span className="text-ink/60">{r.label}</span>
            <span className="font-medium text-ink">¥{r.value}</span>
          </div>
        ))}
        <div className="flex items-center justify-between border-t border-ink/10 pt-3">
          <span className="text-sm font-medium">{t('encyclopedia.total')}</span>
          <span className="font-display text-lg font-bold text-primary">¥{total}</span>
        </div>
      </div>
      <p className="mt-4 text-xs text-ink/40">{t('encyclopedia.feeNote')}</p>
    </div>
  )
}
