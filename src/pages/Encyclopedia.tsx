// pages/Encyclopedia.tsx
import { defineComponent, ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { useLocalizedText } from '../composables/useVisaQuery'
import { countries, DIFFICULTY_LABELS } from '../data/countries'
import { CountryCard } from '../components/visa'
import { VBadge } from '../components/common'
import ComparisonTable from '../components/visa/ComparisonTable'
import type { Country } from '../types'

export default defineComponent({
  name: 'Encyclopedia',
  setup() {
    const { t } = useI18n()
    const { t: lt } = useLocalizedText()
    const keyword = ref('')
    const difficultyFilter = ref('all')
    const regionFilter = ref('all')
    const compareIds = ref<string[]>([])

    const filtered = computed(() => {
      const kw = keyword.value.trim().toLowerCase()
      return countries.filter((c) => {
        const matchKw =
          !kw ||
          c.name.zh.includes(kw) ||
          c.name.en.toLowerCase().includes(kw) ||
          c.visaTypes.some((v) => v.name.zh.includes(kw) || v.name.en.toLowerCase().includes(kw))
        const matchDiff = difficultyFilter.value === 'all' || c.difficulty === difficultyFilter.value
        const matchRegion = regionFilter.value === 'all' || c.region === regionFilter.value
        return matchKw && matchDiff && matchRegion
      })
    })

    const compareCountries = computed(
      () =>
        compareIds.value
          .map((id) => countries.find((c) => c.id === id))
          .filter(Boolean) as Country[],
    )

    const toggleCompare = (id: string) => {
      if (compareIds.value.includes(id)) {
        compareIds.value = compareIds.value.filter((x) => x !== id)
      } else if (compareIds.value.length < 3) {
        compareIds.value = [...compareIds.value, id]
      }
    }

    const difficultyTone: Record<string, string> = { easy: 'green', medium: 'orange', hard: 'red' }
    const regions = [...new Set(countries.map((c) => c.region))]

    return () => (
      <div class="animate-page-in space-y-6">
        <div>
          <h1 class="text-3xl font-bold text-brand-dark tracking-wide">{t('encyclopedia.title')}</h1>
          <p class="mt-1 text-sm text-brand-muted">{t('encyclopedia.subtitle')}</p>
        </div>
        {/* 搜索 + 筛选 + 对比 */}
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div class="relative flex-1 max-w-md">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-accent-orange i-ri-search-line" aria-hidden="true" />
            <input
              v-model={keyword.value}
              placeholder={t('encyclopedia.searchPlaceholder')}
              class="input-base !pl-11 rounded-full"
              aria-label={t('encyclopedia.searchPlaceholder')}
            />
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <select v-model={difficultyFilter.value} class="input-base !w-auto !py-2 rounded-full text-xs">
              <option value="all">{t('encyclopedia.filterDifficulty')}: {t('encyclopedia.all')}</option>
              <option value="easy">{t('encyclopedia.easy')}</option>
              <option value="medium">{t('encyclopedia.medium')}</option>
              <option value="hard">{t('encyclopedia.hard')}</option>
            </select>
            <select v-model={regionFilter.value} class="input-base !w-auto !py-2 rounded-full text-xs">
              <option value="all">{t('encyclopedia.filterRegion')}: {t('encyclopedia.all')}</option>
              {regions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <VBadge tone="purple">
              {t('encyclopedia.compare')}: {compareIds.value.length}/3
            </VBadge>
            {compareIds.value.length > 0 && (
              <button
                onClick={() => (compareIds.value = [])}
                class="rounded-full border border-gray-200 px-3 py-1.5 text-xs text-brand-muted hover:border-accent-purple hover:text-accent-purple"
              >
                <span class="i-ri-restart-line text-xs" aria-hidden="true" />
                {t('encyclopedia.clearCompare')}
              </button>
            )}
          </div>
        </div>

        {/* 对比结果 */}
        {compareIds.value.length >= 2 && (
          <div class="card-base p-5">
            <h2 class="mb-4 flex items-center gap-2 text-base font-semibold text-brand-dark">
              <span class="i-ri-bar-chart-2-line text-lg text-accent-purple" aria-hidden="true" />
              {t('encyclopedia.compareTitle')}
            </h2>
            <ComparisonTable countries={compareCountries.value} />
          </div>
        )}

        {/* 国家网格 */}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.value.map((c) => (
            <div key={c.id} class="relative group">
              <RouterLink to={`/encyclopedia/${c.id}`} class="block">
                <CountryCard country={c} />
              </RouterLink>
              <button
                onClick={() => toggleCompare(c.id)}
                class={`absolute right-3 top-3 rounded-full p-1.5 text-xs transition-all ${
                  compareIds.value.includes(c.id)
                    ? 'bg-accent-purple text-white shadow'
                    : 'bg-white/90 text-brand-muted opacity-0 group-hover:opacity-100 hover:text-accent-purple'
                }`}
                title={compareIds.value.includes(c.id) ? t('encyclopedia.removeFromCompare') : t('encyclopedia.addToCompare')}
              >
                <span class={`i-${compareIds.value.includes(c.id) ? 'ri-check-line' : 'ri-add-line'}`} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>

        {filtered.value.length === 0 && (
          <div class="card-base flex flex-col items-center gap-3 p-10 text-center">
            <span class="i-ri-search-line text-4xl text-brand-muted/50" aria-hidden="true" />
            <p class="text-sm text-brand-muted">{t('common.noData')}</p>
          </div>
        )}

        {/* 难度图例 */}
        <div class="flex flex-wrap items-center gap-4 text-xs text-brand-muted">
          <span>{t('encyclopedia.visaDifficulty')}:</span>
          {Object.entries(DIFFICULTY_LABELS).map(([k, v]) => (
            <VBadge key={k} tone={difficultyTone[k] as never}>{lt(v)}</VBadge>
          ))}
        </div>
      </div>
    )
  },
})
