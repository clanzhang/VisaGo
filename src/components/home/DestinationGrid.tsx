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
      <h2 className="font-display mb-5 text-xl font-bold tracking-tight text-ink">
        {t('home.popularDestinations')}
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((d, i) => (
          <DestinationCard key={d.id} item={d} index={i} />
        ))}
      </div>
    </section>
  )
}
