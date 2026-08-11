// components/common/VButton.tsx
import { defineComponent, type PropType } from 'vue'

export type ButtonVariant = 'primary' | 'purple' | 'outline' | 'ghost' | 'danger' | 'orange'

export default defineComponent({
  name: 'VButton',
  props: {
    variant: { type: String as PropType<ButtonVariant>, default: 'primary' },
    size: { type: String as PropType<'sm' | 'md' | 'lg'>, default: 'md' },
    icon: { type: String, default: '' },
    block: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
  },
  emits: ['click'],
  setup(props, { slots, emit }) {
    const variantClass: Record<ButtonVariant, string> = {
      primary: 'btn-primary',
      purple: 'btn-purple',
      outline: 'btn-outline',
      ghost: 'inline-flex items-center justify-center gap-2 rounded-full text-brand-dark font-medium px-5 py-2.5 transition-all duration-150 hover:bg-brand-bg active:scale-95 disabled:opacity-40',
      danger: 'inline-flex items-center justify-center gap-2 rounded-full bg-red-500 text-white font-medium px-5 py-2.5 transition-all duration-150 hover:bg-red-600 active:scale-95 disabled:opacity-40',
      orange: 'inline-flex items-center justify-center gap-2 rounded-full bg-accent-orange text-brand-dark font-medium px-5 py-2.5 transition-all duration-150 hover:brightness-105 active:scale-95 disabled:opacity-40',
    }
    const sizeClass = {
      sm: 'text-xs px-4 py-2',
      md: 'text-sm px-6 py-3',
      lg: 'text-base px-8 py-3.5',
    }

    return () => (
      <button
        type="button"
        class={[
          variantClass[props.variant],
          sizeClass[props.size],
          props.block ? 'w-full' : '',
        ]}
        disabled={props.loading || props.disabled}
        onClick={(e) => emit('click', e)}
      >
        {props.loading ? (
          <span class="i-ri-loader-4-line animate-spin text-current" aria-hidden="true" />
        ) : props.icon ? (
          <span class={`i-${props.icon} text-current`} aria-hidden="true" />
        ) : null}
        {slots.default?.()}
      </button>
    )
  },
})
