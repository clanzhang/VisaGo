// components/home/DestinationCard.tsx — 单个目的地卡片
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/i18n'

export interface Destination {
  id: string
  name: string
  flag: string
  days: string
  desc: string
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
  const { t } = useI18n()
  const navigate = useNavigate()

  return (
    <div
      className="anim-card group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-card transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-card-lg"
      style={{ animationDelay: `${index * 80}ms` }}
      onClick={() => navigate(`/encyclopedia/${item.id}`)}
    >
      <div className="relative h-[120px] w-full overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
          loading="lazy"
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-ink backdrop-blur">
          {item.flag} {item.name}
        </span>
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-[15px] font-bold text-ink">{item.name}</h3>
          <span className="text-xs text-ink/45">
            {t('home.stayDays', { days: item.days })}
          </span>
        </div>
        <p className="mt-1.5 line-clamp-1 text-[13px] text-ink/55">{item.desc}</p>

        <div className="mt-4 flex items-center justify-between border-t border-ink/5 pt-3.5">
          <span className="text-sm font-semibold text-primary">{item.fee}</span>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${difficultyTone[item.difficulty]}`}
          >
            {item.difficulty}
          </span>
        </div>
      </div>
    </div>
  )
}
