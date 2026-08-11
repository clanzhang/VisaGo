// pages/Compare.tsx
// 对比页：选择 2-3 个国家横向对比
import { defineComponent, ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, RouterLink } from 'vue-router'
import { useLocalizedText } from '../composables/useVisaQuery'
import { countries, DIFFICULTY_LABELS } from '../data/countries'
import { getMinFee } from '../composables/useEncyclopedia'
import { VBadge, VButton } from '../components/common'
import type { Country } from '../types'

export default defineComponent({
  name: 'Compare',
  setup() {
    const { t } = useI18n()
    const { t: lt } = useLocalizedText()
    const route = useRoute()
    const ids = ref<string[]>([])
    const showPicker = ref(false)

    onMounted(() => {
      const q = route.query.ids as string | undefined
      if (q) {
        ids.value = q.split(',').filter((id) => countries.some((c) => c.id === id)).slice(0, 3)
      }
    })

    const selected = computed(() =>
      ids.value.map((id) => countries.find((c) => c.id === id)).filter(Boolean) as Country[],
    )

    const available = computed(() => countries.filter((c) => !ids.value.includes(c.id)))

    const toggleAdd = (id: string) => {
      if (ids.value.length >= 3) return
      if (!ids.value.includes(id)) {
        ids.value = [...ids.value, id]
      }
      showPicker.value = false
    }

    const remove = (id: string) => {
      ids.value = ids.value.filter((x) => x !== id)
    }

    const difficultyLabel = (key: string) => DIFFICULTY_LABELS[key as keyof typeof DIFFICULTY_LABELS]
    const difficultyTone: Record<string, string> = { easy: 'green', medium: 'orange', hard: 'red' }

    // 对比行数据
    const rows = computed(() => {
      return [
        {
          label: t('encyclopedia.visaDifficulty'),
          values: selected.value.map((c) => lt(difficultyLabel(c.difficulty))),
          best: null as number | null,
          tone: true,
        },
        {
          label: t('encyclopedia.minFee'),
          values: selected.value.map((c) => `¥${getMinFee(c.visaTypes)}`),
          best: selected.value.length
            ? selected.value.reduce(
                (bestIdx, c, i) =>
                  getMinFee(c.visaTypes) < getMinFee(selected.value[bestIdx].visaTypes) ? i : bestIdx,
                0,
              )
            : null,
          tone: false,
        },
        {
          label: t('encyclopedia.processingTime'),
          values: selected.value.map((c) => {
            const mins = c.visaTypes.map((v) => v.processingDays.min)
            const maxs = c.visaTypes.map((v) => v.processingDays.max)
            return `${Math.min(...mins)}-${Math.max(...maxs)}${t('assistant.days')}`
          }),
          best: null as number | null,
          tone: false,
        },
        {
          label: t('encyclopedia.visaTypes'),
          values: selected.value.map((c) => `${c.visaTypes.length} ${t('encyclopedia.visaTypes')}`),
          best: null,
          tone: false,
        },
        {
          label: t('encyclopedia.materialsCount'),
          values: selected.value.map((c) =>
            String(Math.max(...c.visaTypes.map((v) => v.requirements.length))),
          ),
          best: null,
          tone: false,
        },
        {
          label: t('encyclopedia.needInterview'),
          values: selected.value.map((c) => {
            const vt = c.visaTypes[0]
            return vt?.needInterview ? t('encyclopedia.yes') : t('encyclopedia.no')
          }),
          best: null,
          tone: false,
        },
        {
          label: t('encyclopedia.canApplyOnline'),
          values: selected.value.map((c) => {
            const vt = c.visaTypes[0]
            return vt?.canApplyOnline ? t('encyclopedia.yes') : t('encyclopedia.no')
          }),
          best: null,
          tone: false,
        },
        {
          label: t('encyclopedia.acceptPersonal'),
          values: selected.value.map((c) => {
            const vt = c.visaTypes[0]
            return vt?.acceptPersonal ? t('encyclopedia.yes') : t('encyclopedia.no')
          }),
          best: null,
          tone: false,
        },
        {
          label: t('encyclopedia.visaFreePolicy'),
          values: selected.value.map((c) => lt(c.visaFree)),
          best: null,
          tone: false,
        },
      ]
    })

    const exportPdf = async () => {
      const { exportElementToPdf } = await import('../utils/pdf')
      const el = document.getElementById('compare-table')
      if (el) await exportElementToPdf(el, { filename: 'visa-comparison.pdf' })
    }

    return () => (
      <div class="animate-page-in space-y-6">
        <div>
          <h1 class="text-3xl font-bold text-brand-dark tracking-wide">{t('encyclopedia.compareTitle')}</h1>
          <p class="mt-1 text-sm text-brand-muted">{t('encyclopedia.selectCountries')}</p>
        </div>

        {/* 国家选择区 */}
        <div class="flex flex-wrap items-center gap-3">
          {selected.value.map((c) => (
            <div key={c.id} class="flex items-center gap-2 rounded-full bg-brand-bg px-4 py-2">
              <span class="text-xl" aria-hidden="true">{c.flag}</span>
              <span class="text-sm font-medium text-brand-dark">{lt(c.name)}</span>
              <button
                onClick={() => remove(c.id)}
                class="rounded-full p-0.5 text-brand-muted hover:bg-red-100 hover:text-red-500"
                aria-label={t('encyclopedia.removeFromCompare')}
              >
                <span class="i-ri-close-line text-sm" />
              </button>
            </div>
          ))}
          {selected.value.length < 3 && (
            <button
              onClick={() => (showPicker.value = !showPicker.value)}
              class="flex items-center gap-1 rounded-full border-2 border-dashed border-brand-muted/50 px-4 py-2 text-sm text-brand-muted transition-all hover:border-accent-purple hover:text-accent-purple"
            >
              <span class="i-ri-add-line text-sm" aria-hidden="true" />
              {t('encyclopedia.addCountry')}
            </button>
          )}
        </div>

        {/* 添加国家弹窗 */}
        {showPicker.value && (
          <div class="card-base grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4">
            {available.value.map((c) => (
              <button
                key={c.id}
                onClick={() => toggleAdd(c.id)}
                class="flex items-center gap-2 rounded-xl border border-gray-100 p-3 text-left transition-all hover:border-accent-purple hover:bg-accent-purple/5"
              >
                <span class="text-2xl" aria-hidden="true">{c.flag}</span>
                <div>
                  <p class="text-sm font-medium text-brand-dark">{lt(c.name)}</p>
                  <p class="text-xs text-brand-muted">{c.name.en}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {selected.value.length >= 2 ? (
          <>
            {/* 对比表格 */}
            <div id="compare-table" class="card-base overflow-hidden p-0">
              <div class="overflow-x-auto">
                <table class="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr class="border-b border-gray-100 bg-brand-bg">
                      <th class="px-5 py-3 text-left text-xs font-medium text-brand-muted">
                        {t('encyclopedia.compareTitle')}
                      </th>
                      {selected.value.map((c) => (
                        <th key={c.id} class="px-4 py-3 text-center">
                          <RouterLink to={`/encyclopedia/${c.id}`} class="hover:underline">
                            <span class="text-2xl" aria-hidden="true">{c.flag}</span>
                            <span class="ml-2 text-sm font-semibold text-brand-dark">{lt(c.name)}</span>
                          </RouterLink>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.value.map((row, ri) => (
                      <tr key={ri} class="border-b border-gray-50">
                        <td class="px-5 py-3 text-gray-500">{row.label}</td>
                        {row.values.map((v, vi) => (
                          <td
                            key={vi}
                            class={`px-4 py-3 text-center ${
                              row.best === vi ? 'font-semibold text-emerald-600' : ''
                            }`}
                          >
                            {row.best === vi && <span class="mr-1">✓</span>}
                            {row.tone && selected.value[vi] ? (
                              <VBadge tone={difficultyTone[selected.value[vi].difficulty] as never}>
                                {v}
                              </VBadge>
                            ) : (
                              <span class="text-brand-dark">{v}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <VButton variant="purple" onClick={exportPdf}>
              <span class="i-ri-file-download-line text-sm" aria-hidden="true" />
              {t('encyclopedia.compareExport')}
            </VButton>
          </>
        ) : (
          <div class="card-base flex flex-col items-center gap-3 p-10 text-center">
            <span class="i-ri-bar-chart-2-line text-5xl text-brand-muted/50" aria-hidden="true" />
            <p class="text-brand-muted">{t('encyclopedia.selectCountries')}</p>
          </div>
        )}
      </div>
    )
  },
})
