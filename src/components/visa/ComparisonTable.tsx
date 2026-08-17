// components/visa/ComparisonTable.tsx — 国家对比表格
import { useI18n } from '@/i18n'
import { VBadge } from '@/components/common'
import { DIFFICULTY_LABELS } from '@/data/countries'
import { getVisaOfficialFee } from '@/data/visa-fees'
import type { Country } from '@/types'

interface Props {
  countries: Country[]
}

export function ComparisonTable({ countries }: Props) {
  const { t, pickL } = useI18n()

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-ink/10">
            <th className="pb-3 pr-4 font-medium text-ink/60">{t('encyclopedia.difficultyLabel')}</th>
            {countries.map((c) => (
              <th key={c.id} className="pb-3 pr-4">
                <span className="mr-1">{c.flag}</span>
                <span className="font-semibold text-ink">{pickL(c.name)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/5">
          <tr>
            <td className="py-3 pr-4 text-ink/60">{t('encyclopedia.visaDifficulty')}</td>
            {countries.map((c) => (
              <td key={c.id} className="py-3 pr-4">
                <VBadge tone={c.difficulty === 'easy' ? 'success' : c.difficulty === 'medium' ? 'warning' : 'danger'}>
                  {pickL(DIFFICULTY_LABELS[c.difficulty])}
                </VBadge>
              </td>
            ))}
          </tr>
          <tr>
            <td className="py-3 pr-4 text-ink/60">{t('encyclopedia.fee')}</td>
            {countries.map((c) => {
              const firstVt = c.visaTypes[0]
              const official = firstVt
                ? getVisaOfficialFee(c.id, firstVt.id, {
                    serviceFee: firstVt.serviceFee?.amount ?? 0,
                    courierFee: 0,
                    photoFee: 0,
                  })
                : undefined
              if (official) {
                const isFree = official.tiers.every((tr) => tr.currency === 'FREE' || tr.amount === 0)
                return (
                  <td key={c.id} className="py-3 pr-4 font-medium text-primary">
                    {isFree ? t('encyclopedia.free') : (
                      <span className="inline-flex flex-col">
                        <span>{official.visaFee} {official.currency} {t('assistant.from')}</span>
                        {official.effectiveFrom && (
                          <span className="text-[10px] font-normal text-ink/60">{official.effectiveFrom} {t('assistant.from')}</span>
                        )}
                      </span>
                    )}
                  </td>
                )
              }
              return (
                <td key={c.id} className="py-3 pr-4 font-medium text-primary">
                  ¥{Math.min(...c.visaTypes.map((v) => v.fee.amount + (v.serviceFee?.amount ?? 0)))} {t('assistant.from')}
                </td>
              )
            })}
          </tr>
          <tr>
            <td className="py-3 pr-4 text-ink/60">{t('encyclopedia.materialsCount')}</td>
            {countries.map((c) => (
              <td key={c.id} className="py-3 pr-4">
                {c.visaTypes[0].requirements.length}
              </td>
            ))}
          </tr>
          <tr>
            <td className="py-3 pr-4 text-ink/60">{t('encyclopedia.needInterview')}</td>
            {countries.map((c) => (
              <td key={c.id} className="py-3 pr-4">
                {c.visaTypes[0].needInterview ? '✅' : '—'}
              </td>
            ))}
          </tr>
          <tr>
            <td className="py-3 pr-4 text-ink/60">{t('encyclopedia.canApplyOnline')}</td>
            {countries.map((c) => (
              <td key={c.id} className="py-3 pr-4">
                {c.visaTypes[0].canApplyOnline ? '✅' : '—'}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
