// components/visa/ComparisonTable.tsx
import { defineComponent, type PropType } from 'vue'
import type { Country } from '../../types'
import { useLocalizedText } from '../../composables/useVisaQuery'
import { DIFFICULTY_LABELS } from '../../data/countries'
import VBadge, { type BadgeTone } from '../common/VBadge'

export default defineComponent({
  name: 'ComparisonTable',
  props: {
    countries: { type: Array as PropType<Country[]>, required: true },
  },
  setup(props) {
    const { t } = useLocalizedText()
    const tone: Record<string, BadgeTone> = { easy: 'green', medium: 'orange', hard: 'red' }

    return () => {
      if (props.countries.length === 0) return null
      const rows = props.countries.map((c) => {
        const fees = c.visaTypes.map((v) => v.fee.amount)
        const days = c.visaTypes.flatMap((v) => [v.processingDays.min, v.processingDays.max])
        return {
          country: c,
          minFee: Math.min(...fees),
          maxFee: Math.max(...fees),
          minDays: Math.min(...days),
          maxDays: Math.max(...days),
          materials: Math.max(...c.visaTypes.map((v) => v.requirements.length)),
        }
      })

      return (
        <div class="overflow-x-auto">
          <table class="w-full min-w-[600px] text-sm">
            <thead>
              <tr class="border-b border-gray-200 text-left text-xs text-brand-muted">
                <th class="py-3 pr-4 font-medium">
                  {t({ zh: '项目', en: 'Item' })}
                </th>
                {rows.map((r) => (
                  <th key={r.country.id} class="py-3 px-4 font-medium">
                    {r.country.flag} {t(r.country.name)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-gray-100">
                <td class="py-3 pr-4 text-gray-500">{t({ zh: '难度', en: 'Difficulty' })}</td>
                {rows.map((r) => (
                  <td key={r.country.id} class="py-3 px-4">
                    <VBadge tone={tone[r.country.difficulty]}>
                      {t(DIFFICULTY_LABELS[r.country.difficulty])}
                    </VBadge>
                  </td>
                ))}
              </tr>
              <tr class="border-b border-gray-100">
                <td class="py-3 pr-4 text-gray-500">{t({ zh: '费用（¥）', en: 'Fee (¥)' })}</td>
                {rows.map((r) => (
                  <td key={r.country.id} class="py-3 px-4 font-medium text-accent-purple">
                    {r.minFee === r.maxFee ? r.minFee : `${r.minFee}-${r.maxFee}`}
                  </td>
                ))}
              </tr>
              <tr class="border-b border-gray-100">
                <td class="py-3 pr-4 text-gray-500">
                  {t({ zh: '办理周期（天）', en: 'Processing (days)' })}
                </td>
                {rows.map((r) => (
                  <td key={r.country.id} class="py-3 px-4 font-medium text-brand-dark">
                    {r.minDays === r.maxDays ? r.minDays : `${r.minDays}-${r.maxDays}`}
                  </td>
                ))}
              </tr>
              <tr class="border-b border-gray-100">
                <td class="py-3 pr-4 text-gray-500">{t({ zh: '材料数量', en: 'Materials' })}</td>
                {rows.map((r) => (
                  <td key={r.country.id} class="py-3 px-4 text-brand-dark">{r.materials}</td>
                ))}
              </tr>
              <tr>
                <td class="py-3 pr-4 text-gray-500">
                  {t({ zh: '签证类型', en: 'Visa types' })}
                </td>
                {rows.map((r) => (
                  <td key={r.country.id} class="py-3 px-4 text-gray-600">
                    {r.country.visaTypes.map((v) => t(v.name)).join('、')}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )
    }
  },
})
