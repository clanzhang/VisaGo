// components/visa/ComparisonTable.tsx — 国家对比表格
import { useI18n } from '@/i18n'
import { VBadge } from '@/components/common'
import { DIFFICULTY_LABELS } from '@/data/countries'
import type { Country } from '@/types'

interface Props {
  countries: Country[]
}

export function ComparisonTable({ countries }: Props) {
  const { t } = useI18n()

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-ink/10">
            <th className="pb-3 pr-4 font-medium text-ink/45">{t('encyclopedia.difficultyLabel')}</th>
            {countries.map((c) => (
              <th key={c.id} className="pb-3 pr-4">
                <span className="mr-1">{c.flag}</span>
                <span className="font-semibold text-ink">{c.name.zh}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/5">
          <tr>
            <td className="py-3 pr-4 text-ink/55">{t('encyclopedia.visaDifficulty')}</td>
            {countries.map((c) => (
              <td key={c.id} className="py-3 pr-4">
                <VBadge tone={c.difficulty === 'easy' ? 'success' : c.difficulty === 'medium' ? 'warning' : 'danger'}>
                  {DIFFICULTY_LABELS[c.difficulty].zh}
                </VBadge>
              </td>
            ))}
          </tr>
          <tr>
            <td className="py-3 pr-4 text-ink/55">{t('encyclopedia.fee')}</td>
            {countries.map((c) => (
              <td key={c.id} className="py-3 pr-4 font-medium text-primary">
                ¥{Math.min(...c.visaTypes.map((v) => v.fee.amount + (v.serviceFee?.amount ?? 0)))} 起
              </td>
            ))}
          </tr>
          <tr>
            <td className="py-3 pr-4 text-ink/55">{t('encyclopedia.materialsCount')}</td>
            {countries.map((c) => (
              <td key={c.id} className="py-3 pr-4">
                {c.visaTypes[0].requirements.length}
              </td>
            ))}
          </tr>
          <tr>
            <td className="py-3 pr-4 text-ink/55">{t('encyclopedia.needInterview')}</td>
            {countries.map((c) => (
              <td key={c.id} className="py-3 pr-4">
                {c.visaTypes[0].needInterview ? '✅' : '—'}
              </td>
            ))}
          </tr>
          <tr>
            <td className="py-3 pr-4 text-ink/55">{t('encyclopedia.canApplyOnline')}</td>
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
