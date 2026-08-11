// components/visa/FeeCalculator.tsx — 费用明细
import { useI18n } from '@/i18n'
import { getVisaExtra } from '@/data/encyclopedia-extra'
import type { VisaType } from '@/types'

interface Props {
  countryId: string
  visaType: VisaType
}

export function FeeCalculator({ countryId, visaType }: Props) {
  const { t } = useI18n()
  const extra = getVisaExtra(countryId, visaType.id)
  const fees = extra?.fees
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
            <span className="text-ink/55">{r.label}</span>
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
