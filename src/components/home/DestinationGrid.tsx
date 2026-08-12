// components/home/DestinationGrid.tsx — 热门目的地 3 列网格
import { useI18n } from '@/i18n'
import { destinations as fallback } from '@/data/mock'
import { DestinationCard, type Destination } from './DestinationCard'

interface Props {
  destinations?: Destination[]
}

export function DestinationGrid({ destinations }: Props) {
  const { t } = useI18n()
  const list = destinations?.length ? destinations : fallback

  return (
    <section>
      <div className="mb-5 flex items-center gap-3">
        <h2 className="font-display text-xl font-bold tracking-tight text-ink">
          {t('home.popularDestinations')}
        </h2>
        <span className="h-1 w-8 rounded-full bg-gradient-to-r from-[#4F9E28] to-[#39A2B8]" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((d, i) => (
          <DestinationCard key={d.id} item={d} index={i} />
        ))}
      </div>
    </section>
  )
}
