// components/visa/Checklist.tsx
// 材料清单组件（可勾选）
import { defineComponent, reactive, type PropType } from 'vue'
import type { Requirement } from '../../types'
import { REQUIREMENT_CATEGORIES } from '../../data/countries'
import { useLocalizedText } from '../../composables/useVisaQuery'
import VBadge, { type BadgeTone } from '../common/VBadge'

export default defineComponent({
  name: 'Checklist',
  props: {
    requirements: { type: Array as PropType<Requirement[]>, required: true },
    selectable: { type: Boolean, default: true },
  },
  setup(props) {
    const { t } = useLocalizedText()
    const checked = reactive<Record<string, boolean>>({})

    const categories = Object.keys(REQUIREMENT_CATEGORIES) as Array<
      keyof typeof REQUIREMENT_CATEGORIES
    >

    const formatTone: Record<Requirement['format'], BadgeTone> = {
      original: 'blue',
      copy: 'gray',
      both: 'brand',
    }
    const formatLabel: Record<Requirement['format'], { zh: string; en: string }> = {
      original: { zh: '原件', en: 'Original' },
      copy: { zh: '复印件', en: 'Copy' },
      both: { zh: '原件+复印件', en: 'Original & Copy' },
    }

    const toggle = (id: string) => {
      if (!props.selectable) return
      checked[id] = !checked[id]
    }

    const isChecked = (id: string) => !!checked[id]

    return () => (
      <div class="space-y-4">
        {categories.map((cat) => {
          const items = props.requirements.filter((r) => r.category === cat)
          if (items.length === 0) return null
          const meta = REQUIREMENT_CATEGORIES[cat]
          const doneCount = items.filter((r) => checked[r.id]).length

          return (
            <div key={cat}>
              <div class="mb-2 flex items-center justify-between">
                <h4 class="flex items-center gap-1.5 text-sm font-semibold text-brand-dark">
                  <span class={`i-${meta.icon} text-brand-blue`} aria-hidden="true" />
                  {t(meta)}
                  <span class="text-xs font-normal text-brand-muted">
                    ({doneCount}/{items.length})
                  </span>
                </h4>
              </div>
              <ul class="space-y-1.5">
                {items.map((r) => (
                  <li key={r.id}>
                    <button
                      onClick={() => toggle(r.id)}
                      disabled={!props.selectable}
                      class={`flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${
                        isChecked(r.id)
                          ? 'border-brand-blue/40 bg-brand-blue/5'
                          : 'border-gray-100 hover:border-brand-blue/20 hover:bg-brand-bg'
                      }`}
                    >
                      <span
                        class={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                          isChecked(r.id)
                            ? 'border-brand-blue bg-brand-blue text-white'
                            : 'border-gray-300 bg-white'
                        }`}
                        aria-hidden="true"
                      >
                        {isChecked(r.id) && <span class="i-ri-check-line text-xs" />}
                      </span>
                      <span class="flex-1">
                        <span class="block text-sm text-brand-dark">{t(r.name)}</span>
                        <span class="mt-1 flex flex-wrap items-center gap-1.5">
                          <VBadge tone={r.required ? 'red' : 'gray'}>
                            {r.required
                              ? t({ zh: '必须', en: 'Req' })
                              : t({ zh: '可选', en: 'Opt' })}
                          </VBadge>
                          <VBadge tone={formatTone[r.format]}>{t(formatLabel[r.format])}</VBadge>
                          {r.translationRequired && (
                            <VBadge tone="blue">
                              <span class="i-ri-translate-2" aria-hidden="true" />
                              {t({ zh: '需翻译', en: 'Translate' })}
                            </VBadge>
                          )}
                        </span>
                        {r.notes && (
                          <span class="mt-1 block text-xs text-brand-muted">
                            💡 {t(r.notes)}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    )
  },
})
