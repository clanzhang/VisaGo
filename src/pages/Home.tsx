// pages/Home.tsx — 首页仪表盘
import { Header } from '@/components/layout'
import { HeroCards } from '@/components/home/HeroCards'
import { StatsSection } from '@/components/home/StatsSection'
import { DestinationGrid } from '@/components/home/DestinationGrid'

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <Header />
      <HeroCards />
      <StatsSection />
      <DestinationGrid />
    </div>
  )
}
