// components/visa/CountryCard.tsx — 国家卡片（百科列表）
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/i18n'
import { VBadge } from '@/components/common'
import { DIFFICULTY_LABELS, VISA_TYPE_STYLE } from '@/data/countries'
import type { Country } from '@/types'

const VISA_TYPE_LABEL_KEYS: Record<Country['visaType'], string> = {
  互免签证: 'encyclopedia.visaTypeMutual',
  单方面免签: 'encyclopedia.visaTypeUnilateral',
  落地签: 'encyclopedia.visaTypeOnArrival',
  电子签: 'encyclopedia.visaTypeEvisa',
  需通行证: 'encyclopedia.visaTypePermit',
}

interface Props {
  country: Country
  index?: number
  /** 隐藏签证类型标签（当顶部已按签证类型筛选/分组时，避免重复） */
  hideVisaType?: boolean
}

export function CountryCard({ country, index = 0, hideVisaType = false }: Props) {
  const navigate = useNavigate()
  const { t, isZh, pickL } = useI18n()
  const vt = VISA_TYPE_STYLE[country.visaType]

  return (
    <div
      className="anim-card group relative cursor-pointer rounded-2xl bg-white p-6 shadow-card transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-card-lg"
      style={{ animationDelay: `${index * 60}ms` }}
      onClick={() => navigate(`/encyclopedia/${country.id}`)}
    >
      {/* 签证类型标签（左上角）；选中具体分类时隐藏，避免与顶部筛选重复 */}
      {!hideVisaType && (
        <span className={`absolute left-4 top-4 rounded-full px-2.5 py-0.5 text-xs font-medium ${vt.cls}`}>
          {t(VISA_TYPE_LABEL_KEYS[country.visaType])}
        </span>
      )}

      <div className="flex items-start gap-3">
        <span className="text-4xl">{country.flag}</span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-bold leading-tight text-ink">{pickL(country.name)}</h3>
          {isZh && <div className="mt-0.5 text-xs text-ink/60">{country.name.en}</div>}
        </div>
        <VBadge tone={country.difficulty === 'easy' ? 'success' : country.difficulty === 'medium' ? 'warning' : 'danger'}>
          {pickL(DIFFICULTY_LABELS[country.difficulty])}
        </VBadge>
      </div>
      <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-ink/60">{pickL(country.overview)}</p>
    </div>
  )
}
