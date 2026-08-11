// components/home/DestinationGrid.tsx — 热门目的地 3 列网格
import { useI18n } from '@/i18n'
import { destinations } from '@/data/mock'
import { DestinationCard } from './DestinationCard'

export function DestinationGrid() {
  const { t } = useI18n()

  return (
    <section>
      <h2 className="font-display mb-5 text-xl font-bold tracking-tight text-ink">
        {t('home.popularDestinations')}
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {destinations.map((d, i) => (
          <DestinationCard key={d.id} item={d} index={i} />
        ))}
      </div>
    </section>
  )
}
