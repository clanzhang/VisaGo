// components/home/DestinationCard.tsx — 单个目的地卡片
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/i18n'

export interface Destination {
  id: string
  name: string
  nameEn?: string
  flag: string
  days: string
  daysEn?: string
  desc: string
  descEn?: string
  fee: string
  difficulty: '易' | '中' | '难'
  image: string
}

const difficultyTone: Record<Destination['difficulty'], string> = {
  易: 'bg-success/10 text-success',
  中: 'bg-amber-500/10 text-amber-600',
  难: 'bg-red-500/10 text-red-600',
}

interface Props {
  item: Destination
  index: number
}

export function DestinationCard({ item, index }: Props) {
  const { t, isZh, pickL } = useI18n()
  const navigate = useNavigate()
  const name = isZh ? item.name : item.nameEn ?? item.name
  const days = isZh ? item.days : item.daysEn ?? item.days
  const desc = isZh ? item.desc : item.descEn ?? item.desc
  const difficultyLabel = pickL({
    zh: item.difficulty === '易' ? t('encyclopedia.easy') : item.difficulty === '中' ? t('encyclopedia.medium') : t('encyclopedia.hard'),
    en: item.difficulty === '易' ? 'Easy' : item.difficulty === '中' ? 'Medium' : 'Hard',
  })

  return (
    <div
      className="anim-card group cursor-pointer overflow-hidden rounded-3xl bg-white shadow-card transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-card-lg"
      style={{ animationDelay: `${index * 80}ms` }}
      onClick={() => navigate(`/encyclopedia/${item.id}`)}
    >
      <div className="relative h-[140px] w-full overflow-hidden">
        <img
          src={item.image}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-ink shadow-sm backdrop-blur">
          {item.flag} {name}
        </span>
        <span
          className={`absolute right-3 top-3 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium shadow-sm backdrop-blur ${difficultyTone[item.difficulty]} bg-white/90`}
        >
          {difficultyLabel}
        </span>
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-[15px] font-bold text-ink">{name}</h3>
          <span className="text-xs text-ink/55">
            {t('home.stayDays', { days })}
          </span>
        </div>
        <p className="mt-1.5 line-clamp-1 text-[13px] text-ink/60">{desc}</p>

        <div className="mt-4 flex items-center justify-between border-t border-ink/5 pt-3.5">
          <span className="text-sm font-semibold text-primary">{item.fee}</span>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#1460A4] transition-all duration-200 group-hover:gap-2">
            {t('home.viewDetails')}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  )
}
