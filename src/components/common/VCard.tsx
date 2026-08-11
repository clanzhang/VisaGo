// components/common/VCard.tsx
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'VCard',
  props: {
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    icon: { type: String, default: '' },
    hoverable: { type: Boolean, default: false },
    padding: { type: String, default: 'p-5' },
  },
  setup(props, { slots }) {
    return () => (
      <div
        class={[
          'card-base',
          props.padding,
          props.hoverable ? 'cursor-pointer hover:-translate-y-1 hover:shadow-lg' : '',
        ]}
      >
        {(props.title || slots.action) && (
          <div class="mb-4 flex items-start justify-between gap-3">
            <div class="flex items-center gap-2.5">
              {props.icon && (
                <span class={`i-${props.icon} text-xl text-brand-blue`} aria-hidden="true" />
              )}
              <div>
                {props.title && <h3 class="text-base font-semibold text-brand-dark">{props.title}</h3>}
                {props.subtitle && <p class="mt-0.5 text-xs text-brand-muted">{props.subtitle}</p>}
              </div>
            </div>
            {slots.action?.()}
          </div>
        )}
        {slots.default?.()}
      </div>
    )
  },
})
