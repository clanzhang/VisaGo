// components/visa/CountryCard.tsx
import { defineComponent, type PropType } from 'vue'
import type { Country } from '../../types'
import { DIFFICULTY_LABELS } from '../../data/countries'
import { useLocalizedText } from '../../composables/useVisaQuery'
import VBadge, { type BadgeTone } from '../common/VBadge'

export default defineComponent({
  name: 'CountryCard',
  props: {
    country: { type: Object as PropType<Country>, required: true },
    selected: { type: Boolean, default: false },
    compact: { type: Boolean, default: false },
  },
  emits: ['click'],
  setup(props, { emit }) {
    const { t } = useLocalizedText()
    const difficulty = (key: string) => DIFFICULTY_LABELS[key as keyof typeof DIFFICULTY_LABELS]
    const tone: Record<string, BadgeTone> = { easy: 'green', medium: 'orange', hard: 'red' }

    return () => (
      <button
        onClick={() => emit('click')}
        class={[
          'card-base p-4 text-left w-full',
          props.selected ? 'ring-2 ring-brand-blue border-brand-blue' : '',
        ]}
      >
        <div class="flex items-start justify-between gap-2">
          <span class="text-3xl leading-none" aria-hidden="true">
            {props.country.flag}
          </span>
          {!props.compact && (
            <VBadge tone={tone[props.country.difficulty]}>
              {t(difficulty(props.country.difficulty))}
            </VBadge>
          )}
        </div>
        <div class="mt-3">
          <h3 class="font-medium text-brand-dark">{t(props.country.name)}</h3>
          {!props.compact && (
            <p class="mt-0.5 text-xs text-brand-muted">{props.country.name.en}</p>
          )}
        </div>
        {!props.compact && (
          <p class="mt-3 line-clamp-2 text-xs text-gray-500">{t(props.country.overview)}</p>
        )}
      </button>
    )
  },
})
