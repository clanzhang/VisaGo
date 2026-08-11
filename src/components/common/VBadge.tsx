// components/common/VBadge.tsx
import { defineComponent, type PropType } from 'vue'

export type BadgeTone = 'green' | 'orange' | 'red' | 'blue' | 'gray' | 'purple' | 'brand'

export default defineComponent({
  name: 'VBadge',
  props: {
    tone: { type: String as PropType<BadgeTone>, default: 'gray' },
    icon: { type: String, default: '' },
  },
  setup(props, { slots }) {
    const toneClass: Record<BadgeTone, string> = {
      green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      orange: 'bg-orange-50 text-orange-600 border-orange-200',
      red: 'bg-red-50 text-red-600 border-red-200',
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      gray: 'bg-gray-100 text-gray-600 border-gray-200',
      purple: 'bg-purple-50 text-accent-purple border-purple-200',
      brand: 'bg-brand-blue/10 text-brand-blue border-brand-blue/20',
    }

    return () => (
      <span
        class={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${toneClass[props.tone]}`}
      >
        {props.icon && <span class={`i-${props.icon} text-xs`} aria-hidden="true" />}
        {slots.default?.()}
      </span>
    )
  },
})
