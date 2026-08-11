// components/visa/CountryCard.tsx — 国家卡片（百科列表）
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/i18n'
import { VBadge } from '@/components/common'
import { DIFFICULTY_LABELS } from '@/data/countries'
import type { Country } from '@/types'

interface Props {
  country: Country
  index?: number
}

const regionTone = {
  亚洲: 'primary',
  欧洲: 'cyan',
  北美: 'warning',
  大洋洲: 'success',
} as const

export function CountryCard({ country, index = 0 }: Props) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const minFee = Math.min(...country.visaTypes.map((v) => v.fee.amount + (v.serviceFee?.amount ?? 0)))

  return (
    <div
      className="anim-card group cursor-pointer rounded-2xl bg-white p-6 shadow-card transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-card-lg"
      style={{ animationDelay: `${index * 60}ms` }}
      onClick={() => navigate(`/encyclopedia/${country.id}`)}
    >
      <div className="flex items-start justify-between">
        <span className="text-4xl">{country.flag}</span>
        <VBadge tone={regionTone[country.region as keyof typeof regionTone] ?? 'default'}>
          {country.region}
        </VBadge>
      </div>
      <h3 className="font-display mt-3 text-lg font-bold text-ink">{country.name.zh}</h3>
      <p className="mt-1 text-[13px] leading-relaxed text-ink/55">{country.overview.zh}</p>
      <div className="mt-4 flex items-center justify-between border-t border-ink/5 pt-3.5">
        <div className="text-sm">
          <span className="text-ink/40">{t('encyclopedia.fee')} </span>
          <span className="font-semibold text-primary">¥{minFee} 起</span>
        </div>
        <VBadge tone={country.difficulty === 'easy' ? 'success' : country.difficulty === 'medium' ? 'warning' : 'danger'}>
          {DIFFICULTY_LABELS[country.difficulty].zh}
        </VBadge>
      </div>
    </div>
  )
}
