// pages/Encyclopedia.tsx
import { defineComponent, ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useLocalizedText } from '../composables/useVisaQuery'
import { countries, DIFFICULTY_LABELS } from '../data/countries'
import { getMinFee } from '../composables/useEncyclopedia'
import { VBadge, VButton } from '../components/common'

// 拼音首字母简易匹配（覆盖国家名用字）
function pinyinInitials(text: string): string {
  const map: Record<string, string> = {
    日: 'r', 本: 'b', 韩: 'h', 国: 'g', 泰: 't', 申: 's', 根: 'g',
    美: 'm', 英: 'y', 澳: 'a', 大: 'd', 利: 'l', 亚: 'y', 洲: 'z',
    西: 'x', 欧: 'o', 非: 'f', 印: 'y', 尼: 'n', 越: 'y', 南: 'n',
    加: 'j', 拿: 'n', 新: 'x', 坡: 'p', 马: 'm', 来: 'l',
  }
  return text
    .split('')
    .map((c) => map[c] || '')
    .join('')
}

export default defineComponent({
  name: 'Encyclopedia',
  setup() {
    const { t } = useI18n()
    const { t: lt } = useLocalizedText()
    const router = useRouter()
    const keyword = ref('')
    const difficultyFilter = ref('all')
    const regionFilter = ref('all')
    const compareMode = ref(false)
    const compareIds = ref<string[]>([])

    const filtered = computed(() => {
      const kw = keyword.value.trim().toLowerCase()
      return countries.filter((c) => {
        const initials = pinyinInitials(c.name.zh)
        const matchKw =
          !kw ||
          c.name.zh.includes(kw) ||
          c.name.en.toLowerCase().includes(kw) ||
          initials.includes(kw)
        const matchDiff =
          difficultyFilter.value === 'all' || c.difficulty === difficultyFilter.value
        const matchRegion =
          regionFilter.value === 'all' ||
          c.region === regionFilter.value ||
          (regionFilter.value === '东亚' && (c.id === 'japan' || c.id === 'korea')) ||
          (regionFilter.value === '东南亚' && c.id === 'thailand')
        return matchKw && matchDiff && matchRegion
      })
    })

    const toggleCompare = (id: string) => {
      if (!compareMode.value) {
        router.push(`/encyclopedia/${id}`)
        return
      }
      if (compareIds.value.includes(id)) {
        compareIds.value = compareIds.value.filter((x) => x !== id)
      } else if (compareIds.value.length < 3) {
        compareIds.value = [...compareIds.value, id]
      }
    }

    const goCompare = () => {
      if (compareIds.value.length >= 2) {
        router.push(`/encyclopedia/compare?ids=${compareIds.value.join(',')}`)
      }
    }

    watch(compareMode, (v) => {
      if (!v) compareIds.value = []
    })

    const difficultyTone: Record<string, string> = { easy: 'green', medium: 'orange', hard: 'red' }
    const difficultyLabel = (key: string) =>
      DIFFICULTY_LABELS[key as keyof typeof DIFFICULTY_LABELS]

    return () => (
      <div class="animate-page-in space-y-6">
        {/* 页面标题区 */}
        <div class="rounded-24px bg-gradient-to-b from-brand-bg to-[#E8ECF8] p-8">
          <h1 class="text-3xl font-bold text-brand-dark tracking-wide">{t('encyclopedia.title')}</h1>
          <p class="mt-1 text-sm text-brand-muted">{t('encyclopedia.subtitle')}</p>
        </div>

        {/* 工具栏 */}
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div class="relative flex-1 max-w-md">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-accent-orange i-ri-search-line" aria-hidden="true" />
            <input
              v-model={keyword.value}
              placeholder={t('encyclopedia.searchPlaceholder')}
              class="input-base !pl-11 rounded-full"
              aria-label={t('encyclopedia.searchPlaceholder')}
            />
            {keyword.value && (
              <button
                onClick={() => (keyword.value = '')}
                class="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-brand-muted hover:text-brand-dark"
                aria-label={t('encyclopedia.clear')}
              >
                <span class="i-ri-close-line text-sm" />
              </button>
            )}
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <span class="text-xs text-brand-muted">
              {t('encyclopedia.searchFound', { n: filtered.value.length })}
            </span>
            <select v-model={difficultyFilter.value} class="input-base !w-auto !py-2 rounded-full text-xs">
              <option value="all">{t('encyclopedia.filterDifficulty')}: {t('encyclopedia.all')}</option>
              <option value="easy">{t('encyclopedia.easy')}</option>
              <option value="medium">{t('encyclopedia.medium')}</option>
              <option value="hard">{t('encyclopedia.hard')}</option>
            </select>
            <select v-model={regionFilter.value} class="input-base !w-auto !py-2 rounded-full text-xs">
              <option value="all">{t('encyclopedia.filterRegion')}: {t('encyclopedia.all')}</option>
              <option value="东亚">{t('encyclopedia.eastAsia')}</option>
              <option value="东南亚">{t('encyclopedia.southeastAsia')}</option>
              <option value="欧洲">{t('encyclopedia.europe')}</option>
              <option value="北美">{t('encyclopedia.northAmerica')}</option>
              <option value="大洋洲">{t('encyclopedia.oceania')}</option>
            </select>
            <button
              onClick={() => (compareMode.value = !compareMode.value)}
              class={`rounded-full px-4 py-2 text-xs font-medium transition-all ${
                compareMode.value
                  ? 'bg-accent-purple text-white shadow'
                  : 'border border-gray-200 text-brand-muted hover:border-accent-purple hover:text-accent-purple'
              }`}
            >
              <span class="i-ri-arrow-left-right-line text-xs" aria-hidden="true" />
              {t('encyclopedia.compareMode')}
            </button>
          </div>
        </div>

        {/* 国家卡片网格 */}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.value.map((c, idx) => {
            const minFee = getMinFee(c.visaTypes)
            const selected = compareIds.value.includes(c.id)
            return (
              <div key={c.id} class="animate-card-in" style={{ animationDelay: `${idx * 50}ms` }}>
                <button
                  onClick={() => toggleCompare(c.id)}
                  class={`card-base group relative w-full p-4 text-left ${
                    compareMode.value
                      ? selected
                        ? 'ring-2 ring-accent-purple border-accent-purple'
                        : 'hover:border-accent-purple/40'
                      : ''
                  }`}
                >
                  {compareMode.value && (
                    <span
                      class={`absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                        selected ? 'border-accent-purple bg-accent-purple text-white' : 'border-gray-300 bg-white'
                      }`}
                      aria-hidden="true"
                    >
                      {selected && <span class="i-ri-check-line text-xs" />}
                    </span>
                  )}
                  <div class="flex flex-col items-center text-center">
                    <span class="text-[48px] leading-none" aria-hidden="true">{c.flag}</span>
                    <h3 class="mt-3 text-base font-bold text-brand-dark">{lt(c.name)}</h3>
                    <p class="mt-0.5 text-[13px] text-brand-muted">{c.name.en}</p>
                    <div class="mt-3">
                      <VBadge tone={difficultyTone[c.difficulty] as never}>
                        {lt(difficultyLabel(c.difficulty))}
                      </VBadge>
                    </div>
                    <div class="mt-3 flex items-center gap-3 text-xs text-brand-muted">
                      <span>{c.visaTypes.length} {t('encyclopedia.visaTypes')}</span>
                      <span class="text-accent-purple">{t('encyclopedia.feeStart', { n: minFee })}</span>
                    </div>
                  </div>
                </button>
              </div>
            )
          })}
        </div>

        {filtered.value.length === 0 && (
          <div class="card-base flex flex-col items-center gap-3 p-10 text-center">
            <span class="i-ri-search-line text-4xl text-brand-muted/50" aria-hidden="true" />
            <p class="text-sm text-brand-muted">{t('common.noData')}</p>
          </div>
        )}

        {/* 对比底部操作栏 */}
        {compareMode.value && (
          <div class="fixed bottom-6 left-1/2 z-30 -translate-x-1/2">
            <div class="flex items-center gap-4 rounded-full bg-brand-dark px-6 py-3 text-white shadow-2xl">
              <span class="text-sm">{t('encyclopedia.selectedCount', { n: compareIds.value.length })}</span>
              <VButton variant="purple" size="sm" onClick={goCompare} disabled={compareIds.value.length < 2}>
                {t('encyclopedia.startCompare')}
                <span class="i-ri-arrow-right-line text-sm" aria-hidden="true" />
              </VButton>
            </div>
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
