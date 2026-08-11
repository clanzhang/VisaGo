// components/common/VModal.tsx
import { defineComponent, onBeforeUnmount, onMounted, type PropType } from 'vue'

export default defineComponent({
  name: 'VModal',
  props: {
    open: { type: Boolean, default: false },
    title: { type: String, default: '' },
    size: { type: String as PropType<'sm' | 'md' | 'lg'>, default: 'md' },
  },
  emits: ['close'],
  setup(props, { slots, emit }) {
    const sizeClass = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }

    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') emit('close')
    }

    onMounted(() => document.addEventListener('keydown', onKeydown))
    onBeforeUnmount(() => {
      document.removeEventListener('keydown', onKeydown)
      document.body.style.overflow = ''
    })

    return () => {
      if (!props.open) return null
      document.body.style.overflow = 'hidden'
      return (
        <div
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={props.title}
        >
          <div
            class="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={() => emit('close')}
          />
          <div
            class={`relative w-full ${sizeClass[props.size]} rounded-16px bg-white shadow-2xl animate-slide-up max-h-[90vh] flex flex-col`}
          >
            {props.title && (
              <div class="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <h3 class="text-lg font-semibold text-brand-dark">{props.title}</h3>
                <button
                  onClick={() => emit('close')}
                  class="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                  aria-label="关闭"
                >
                  <span class="i-ri-close-line text-lg" />
                </button>
              </div>
            )}
            <div class="overflow-y-auto px-6 py-5 flex-1">{slots.default?.()}</div>
            {slots.footer && <div class="border-t border-gray-100 px-6 py-4">{slots.footer?.()}</div>}
          </div>
        </div>
      )
    }
  },
})
