// pages/Home.tsx
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { useLocalizedText } from '../composables/useVisaQuery'
import { getCountry, DIFFICULTY_LABELS } from '../data/countries'
import { useTrackerStore } from '../stores/trackerStore'
import VBadge from '../components/common/VBadge'
import GeoShape from '../components/visa/GeoShape'
import type { ApplicationStatus } from '../types'

const quickEntries = [
  { to: '/assistant', labelKey: 'home.entryAssistant', descKey: 'home.entryAssistantDesc', icon: 'ri:magic-line' },
  { to: '/tracker', labelKey: 'home.entryTracker', descKey: 'home.entryTrackerDesc', icon: 'ri:road-map-line' },
  { to: '/documents', labelKey: 'home.entryDocuments', descKey: 'home.entryDocumentsDesc', icon: 'ri:file-list-3-line' },
  { to: '/encyclopedia', labelKey: 'home.entryEncyclopedia', descKey: 'home.entryEncyclopediaDesc', icon: 'ri:book-2-line' },
]

const HOT_IDS = ['japan', 'korea', 'thailand', 'schengen', 'usa', 'uk', 'australia']

const statusTone: Record<ApplicationStatus, string> = {
  preparing: 'gray',
  appointment_booked: 'blue',
  submitted: 'brand',
  under_review: 'orange',
  approved: 'green',
  rejected: 'red',
}

export default defineComponent({
  name: 'Home',
  setup() {
    const { t } = useI18n()
    const { t: lt } = useLocalizedText()
    const tracker = useTrackerStore()

    const hotCountries = HOT_IDS.map((id) => getCountry(id)).filter(Boolean)
    const activeApps = tracker.applications.filter(
      (a) => !['approved', 'rejected'].includes(a.status),
    )

    const difficultyLabel = (key: string) => DIFFICULTY_LABELS[key as keyof typeof DIFFICULTY_LABELS]
    const difficultyTone: Record<string, string> = { easy: 'green', medium: 'orange', hard: 'red' }

    return () => (
      <div class="animate-page-in">
        {/* Hero */}
        <section class="relative overflow-hidden rounded-24px bg-gradient-to-br from-brand-dark via-brand-blue to-brand-blue min-h-[420px] flex items-center text-white">
          {/* 飞机 + 几何装饰 */}
          <div class="absolute inset-0" aria-hidden="true">
            <div class="absolute right-10 top-10 text-8xl animate-float opacity-90">
              <span class="i-ri-flight-takeoff-line" />
            </div>
            <GeoShape type="dot" size="w-3 h-3" className="left-16 top-20 text-white/40" />
            <GeoShape type="triangle" size="w-6 h-6" className="left-40 top-40 text-white/20" duration="12s" />
            <GeoShape type="circle" size="w-10 h-10" className="right-1/3 bottom-16 text-white/15" duration="9s" delay="1s" />
            <GeoShape type="line" size="w-16 h-1" className="left-1/4 bottom-24 text-white/25" duration="8s" />
            <GeoShape type="square" size="w-5 h-5" className="right-56 top-24 text-white/20" duration="11s" delay="0.5s" />
            {/* 云朵 */}
            <div class="absolute left-1/3 top-1/4 h-8 w-20 rounded-full bg-white/10 blur-sm animate-float" style={{ animationDuration: '7s' }} />
            <div class="absolute right-1/4 top-1/2 h-6 w-14 rounded-full bg-white/10 blur-sm animate-float" style={{ animationDuration: '9s', animationDelay: '1s' }} />
          </div>

          <div class="container-app relative py-16 sm:py-20">
            <p class="flex items-center gap-2 text-sm font-medium text-white/70">
              <span class="h-px w-8 bg-accent-orange" />
              {t('app.tagline')}
            </p>
            <h1 class="mt-4 max-w-xl text-4xl sm:text-5xl font-extrabold leading-tight tracking-wide">
              {t('home.heroTitle')}
            </h1>
            <p class="mt-4 max-w-lg text-lg text-white/80">{t('home.heroSubtitle')}</p>
            <p class="mt-2 max-w-lg text-sm text-white/60">{t('home.heroDesc')}</p>
            <div class="mt-8 flex flex-wrap gap-4">
              <RouterLink to="/assistant">
                <span class="btn-purple inline-flex">
                  <span class="i-ri-arrow-right-line text-lg" aria-hidden="true" />
                  {t('home.startApplication')}
                </span>
              </RouterLink>
              <RouterLink to="/encyclopedia">
                <span class="btn-outline inline-flex">{t('home.browseEncyclopedia')}</span>
              </RouterLink>
            </div>
          </div>
        </section>

        {/* 快捷入口 */}
        <section class="relative mt-10">
          <h2 class="section-title mb-5">{t('home.quickStart')}</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickEntries.map((e) => (
              <RouterLink key={e.to} to={e.to} class="card-base group p-5">
                <span class="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue transition-all group-hover:bg-brand-blue group-hover:text-white">
                  <span class={`i-${e.icon} text-2xl`} aria-hidden="true" />
                </span>
                <h3 class="mt-3 font-medium text-brand-dark">{t(e.labelKey)}</h3>
                <p class="mt-1 text-xs text-brand-muted">{t(e.descKey)}</p>
                <span class="mt-3 inline-flex items-center gap-1 text-sm text-accent-purple opacity-0 transition-all group-hover:opacity-100">
                  {t('home.viewAll')}
                  <span class="i-ri-arrow-right-line text-sm" aria-hidden="true" />
                </span>
              </RouterLink>
            ))}
          </div>
        </section>

        {/* 最近申请 */}
        <section class="mt-10">
          <div class="mb-5 flex items-center justify-between">
            <h2 class="section-title">{t('home.recentApplications')}</h2>
            <RouterLink to="/tracker" class="text-sm text-accent-purple hover:underline">
              {t('home.viewAll')} →
            </RouterLink>
          </div>
          {activeApps.length === 0 ? (
            <div class="card-base flex flex-col items-center gap-3 p-10 text-center">
              <span class="i-ri-folder-add-line text-4xl text-brand-muted/50" aria-hidden="true" />
              <p class="text-sm text-brand-muted">{t('home.noApplications')}</p>
              <RouterLink to="/tracker">
                <span class="btn-purple inline-flex !py-2 text-sm">
                  {t('home.newApplication')}
                </span>
              </RouterLink>
            </div>
          ) : (
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeApps.slice(0, 3).map((app) => {
                const c = getCountry(app.countryId)
                return (
                  <RouterLink
                    key={app.id}
                    to="/tracker"
                    class="card-base flex items-center gap-3 p-4"
                  >
                    <span class="text-3xl" aria-hidden="true">{c?.flag ?? '🌍'}</span>
                    <div class="flex-1 min-w-0">
                      <p class="font-medium text-brand-dark truncate">{lt(c?.name)}</p>
                      <VBadge tone={statusTone[app.status] as never}>
                        {t(`tracker.status.${app.status}`)}
                      </VBadge>
                    </div>
                    <span class="i-ri-arrow-right-s-line text-brand-muted" aria-hidden="true" />
                  </RouterLink>
                )
              })}
            </div>
          )}
        </section>

        {/* 热门目的地 */}
        <section class="mt-10 pb-6">
          <h2 class="section-title mb-5">{t('home.popularDestinations')}</h2>
          <div class="flex gap-3 overflow-x-auto pb-4 snap-x">
            {hotCountries.map((c) => (
              <RouterLink
                key={c!.id}
                to={`/encyclopedia/${c!.id}`}
                class="card-base flex min-w-[140px] snap-start flex-col items-center gap-1.5 p-4"
              >
                <span class="text-3xl" aria-hidden="true">{c!.flag}</span>
                <span class="text-sm font-medium text-brand-dark">{lt(c!.name)}</span>
                <VBadge tone={difficultyTone[c!.difficulty] as never}>
                  {lt(difficultyLabel(c!.difficulty))}
                </VBadge>
              </RouterLink>
            ))}
          </div>
        </section>
      </div>
    )
  },
})
