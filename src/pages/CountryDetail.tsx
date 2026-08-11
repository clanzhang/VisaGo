// pages/CountryDetail.tsx
import { defineComponent, ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useLocalizedText } from '../composables/useVisaQuery'
import { countries, DIFFICULTY_LABELS } from '../data/countries'
import { VBadge } from '../components/common'
import { Checklist } from '../components/visa'
import { FeeCalculator } from '../components/visa'

export default defineComponent({
  name: 'CountryDetail',
  setup() {
    const { t } = useI18n()
    const { t: lt } = useLocalizedText()
    const route = useRoute()
    const router = useRouter()
    const activeTab = ref('overview')
    const openFaq = ref<number | null>(0)

    const country = computed(() => countries.find((c) => c.id === route.params.id))

    watch(
      () => route.params.id,
      () => {
        activeTab.value = 'overview'
        openFaq.value = 0
      },
    )

    const difficultyTone: Record<string, string> = { easy: 'green', medium: 'orange', hard: 'red' }
    const difficultyLabel = (key: string) =>
      DIFFICULTY_LABELS[key as keyof typeof DIFFICULTY_LABELS]

    const tabs = [
      { key: 'overview', labelKey: 'encyclopedia.overview', icon: 'ri:layout-2-line' },
      { key: 'requirements', labelKey: 'encyclopedia.requirements', icon: 'ri:file-list-3-line' },
      { key: 'fee', labelKey: 'encyclopedia.feeComparison', icon: 'ri:wallet-3-line' },
      { key: 'districts', labelKey: 'encyclopedia.districts', icon: 'ri:map-pin-line' },
      { key: 'faq', labelKey: 'encyclopedia.faq', icon: 'ri:question-line' },
    ]

    return () => {
      if (!country.value) {
        return (
          <div class="card-base flex flex-col items-center gap-4 p-10 text-center">
            <span class="i-ri-alert-line text-5xl text-brand-muted/50" aria-hidden="true" />
            <p class="text-brand-muted">{t('common.noData')}</p>
            <RouterLink to="/encyclopedia">
              <span class="btn-primary inline-flex">{t('encyclopedia.backToList')}</span>
            </RouterLink>
          </div>
        )
      }

      const c = country.value

      return (
        <div class="animate-page-in space-y-6">
          <button
            onClick={() => router.push('/encyclopedia')}
            class="inline-flex items-center gap-1 text-sm text-brand-muted hover:text-brand-dark"
          >
            <span class="i-ri-arrow-left-line text-base" aria-hidden="true" />
            {t('encyclopedia.backToList')}
          </button>

          {/* Banner */}
          <section class="relative overflow-hidden rounded-24px bg-gradient-to-br from-brand-dark to-brand-blue p-8 text-white">
            <div class="flex flex-wrap items-center gap-5">
              <span class="text-6xl" aria-hidden="true">{c.flag}</span>
              <div>
                <h1 class="text-3xl font-bold tracking-wide">{lt(c.name)}</h1>
                <p class="text-sm text-white/60">{c.name.en}</p>
                <p class="mt-2 max-w-lg text-sm text-white/80">{lt(c.overview)}</p>
              </div>
              <div class="ml-auto flex flex-wrap gap-2">
                <VBadge tone={difficultyTone[c.difficulty] as never}>
                  {t('encyclopedia.visaDifficulty')}: {lt(difficultyLabel(c.difficulty))}
                </VBadge>
                <VBadge tone="purple">
                  {c.visaTypes.length} {t('encyclopedia.visaTypes')}
                </VBadge>
              </div>
            </div>
            <div class="mt-5 flex flex-wrap gap-3">
              <RouterLink to={`/assistant?country=${c.id}`}>
                <span class="btn-purple inline-flex !py-2.5 text-sm">
                  <span class="i-ri-magic-line text-sm" aria-hidden="true" />
                  {t('home.startApplication')}
                </span>
              </RouterLink>
              <RouterLink to="/documents">
                <span class="btn-outline inline-flex !py-2.5 text-sm">
                  <span class="i-ri-file-list-3-line text-sm" aria-hidden="true" />
                  {t('home.entryDocuments')}
                </span>
              </RouterLink>
            </div>
          </section>

          {/* 免签政策 */}
          {c.visaFree && (
            <section class="card-base border-accent-orange/30 bg-accent-orange/5 p-5">
              <h2 class="mb-2 flex items-center gap-2 text-base font-semibold text-brand-dark">
                <span class="i-ri-ticket-2-line text-accent-orange" aria-hidden="true" />
                {t('encyclopedia.visaFreePolicy')}
              </h2>
              <p class="text-sm leading-relaxed text-gray-600">{lt(c.visaFree)}</p>
            </section>
          )}

          {/* Tab 导航 */}
          <div class="flex flex-wrap gap-1 border-b border-gray-200 pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => (activeTab.value = tab.key)}
                class={`flex items-center gap-1.5 rounded-t-xl px-4 py-2.5 text-sm font-medium transition-all ${
                  activeTab.value === tab.key
                    ? 'border-b-2 border-brand-blue text-brand-blue'
                    : 'text-brand-muted hover:text-brand-dark'
                }`}
              >
                <span class={`i-${tab.icon} text-sm`} aria-hidden="true" />
                {t(tab.labelKey)}
              </button>
            ))}
          </div>

          {/* Tab 内容 */}
          <div class="space-y-5">
            {activeTab.value === 'overview' && (
              <div class="space-y-5">
                {c.visaTypes.map((vt) => (
                  <div key={vt.id} class="card-base overflow-hidden">
                    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-50 p-5 pb-4">
                      <div>
                        <h3 class="font-medium text-brand-dark">{lt(vt.name)}</h3>
                        <div class="mt-1.5 flex flex-wrap gap-1.5">
                          <VBadge tone="brand">
                            <span class="i-ri-time-line text-xs" aria-hidden="true" />
                            {t('encyclopedia.duration')}: {vt.duration}
                          </VBadge>
                          <VBadge tone="blue">
                            {t('encyclopedia.validity')}: {vt.validity}
                          </VBadge>
                          <VBadge tone={vt.entries === 'multiple' ? 'green' : 'gray'}>
                            {t(`encyclopedia.${vt.entries}`)}
                          </VBadge>
                          <VBadge tone="purple">
                            {t('encyclopedia.fee')}: ¥{vt.fee.amount}
                          </VBadge>
                        </div>
                      </div>
                      <div class="text-right">
                        <p class="text-xs text-brand-muted">{t('encyclopedia.processingTime')}</p>
                        <p class="text-lg font-semibold text-brand-blue">
                          {vt.processingDays.min}-{vt.processingDays.max}
                          <span class="text-xs text-brand-muted"> {t('assistant.days')}</span>
                        </p>
                      </div>
                    </div>
                    {vt.tips && (
                      <div class="border-b border-gray-50 px-5 py-3 text-xs text-brand-muted">
                        💡 {lt(vt.tips)}
                      </div>
                    )}
                    <div class="p-5">
                      <h4 class="mb-3 text-sm font-semibold text-brand-dark">
                        {t('encyclopedia.requirements')}
                      </h4>
                      <Checklist requirements={vt.requirements} selectable={false} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab.value === 'requirements' && (
              <div class="space-y-5">
                {c.visaTypes.map((vt) => (
                  <div key={vt.id} class="card-base p-5">
                    <h3 class="mb-3 font-medium text-brand-dark">{lt(vt.name)}</h3>
                    <Checklist requirements={vt.requirements} />
                  </div>
                ))}
              </div>
            )}

            {activeTab.value === 'fee' && (
              <div class="grid gap-4 lg:grid-cols-2">
                {c.visaTypes.map((vt) => (
                  <div key={vt.id} class="card-base p-5">
                    <h3 class="mb-3 font-medium text-brand-dark">{lt(vt.name)}</h3>
                    <FeeCalculator visaType={vt} />
                  </div>
                ))}
              </div>
            )}

            {activeTab.value === 'districts' && (
              <div class="grid gap-3 sm:grid-cols-2">
                {c.visaTypes[0]?.consularDistricts.map((d, i) => (
                  <div key={i} class="card-base p-4">
                    <h3 class="flex items-center gap-2 text-sm font-medium text-brand-dark">
                      <span class="i-ri-map-pin-line text-brand-blue" aria-hidden="true" />
                      {lt(d.name)}
                    </h3>
                    <p class="mt-1.5 text-xs leading-relaxed text-brand-muted">
                      {d.provinces.join('、')}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {activeTab.value === 'faq' && (
              <div class="space-y-2">
                {c.visaTypes.flatMap((vt) => vt.faq).map((item, i) => {
                  const isOpen = openFaq.value === i
                  return (
                    <div
                      key={i}
                      class={`overflow-hidden rounded-xl border transition-all ${
                        isOpen ? 'border-brand-blue/30 bg-brand-blue/5' : 'border-gray-100 bg-white'
                      }`}
                    >
                      <button
                        onClick={() => (openFaq.value = isOpen ? null : i)}
                        class="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                        aria-expanded={isOpen}
                      >
                        <span class="flex items-center gap-2 text-sm font-medium text-brand-dark">
                          <span class="i-ri-question-line text-brand-blue" aria-hidden="true" />
                          {lt(item.question)}
                        </span>
                        <span
                          class={`i-ri-arrow-down-s-line text-brand-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
                          aria-hidden="true"
                        />
                      </button>
                      {isOpen && (
                        <p class="px-4 pb-4 pl-10 text-sm leading-relaxed text-gray-600">
                          {lt(item.answer)}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 近期政策变动 */}
          {c.announcements && c.announcements.length > 0 && (
            <section class="card-base border-blue-200 bg-blue-50/50 p-5">
              <h2 class="mb-3 flex items-center gap-2 text-base font-semibold text-brand-dark">
                <span class="i-ri-megaphone-line text-blue-600" aria-hidden="true" />
                {t('encyclopedia.announcements')}
              </h2>
              <ul class="space-y-2">
                {c.announcements.map((a, i) => (
                  <li key={i} class="text-sm leading-relaxed text-gray-600">
                    <span class="mr-2 rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">
                      {a.date}
                    </span>
                    <b>{lt(a.title)}</b>
                    <p class="mt-0.5 pl-1">{lt(a.content)}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 对比 */}
          <section class="card-base flex flex-wrap items-center justify-between gap-3 p-5">
            <p class="text-sm text-brand-muted">{t('encyclopedia.compareOther')}</p>
            <RouterLink to="/encyclopedia">
              <span class="btn-purple inline-flex !py-2 text-sm">
                <span class="i-ri-bar-chart-2-line text-sm" aria-hidden="true" />
                {t('encyclopedia.compare')}
              </span>
            </RouterLink>
          </section>
        </div>
      )
    }
  },
})
