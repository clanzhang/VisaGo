// components/common/VToast.tsx
import { defineComponent } from 'vue'
import { useAppStore } from '../../stores/appStore'

export default defineComponent({
  name: 'VToast',
  setup() {
    const app = useAppStore()

    const iconMap: Record<string, string> = {
      success: 'i-ri-checkbox-circle-line',
      error: 'i-ri-error-warning-line',
      info: 'i-ri-information-line',
      warning: 'i-ri-alert-fill',
    }
    const colorMap: Record<string, string> = {
      success: 'bg-emerald-600',
      error: 'bg-red-600',
      info: 'bg-brand-blue',
      warning: 'bg-accent-orange text-brand-dark',
    }

    return () =>
      app.toasts.length > 0 ? (
        <div class="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none">
          {app.toasts.map((toast) => (
            <button
              key={toast.id}
              onClick={() => app.dismissToast(toast.id)}
              class={`pointer-events-auto flex items-center gap-2 rounded-full px-5 py-2.5 text-sm text-white shadow-lg animate-slide-down ${colorMap[toast.type]}`}
            >
              <span class={`${iconMap[toast.type]} text-base`} aria-hidden="true" />
              <span>{toast.message}</span>
            </button>
          ))}
        </div>
      ) : null
  },
})
