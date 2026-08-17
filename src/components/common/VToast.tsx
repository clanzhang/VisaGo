// components/common/VToast.tsx — Toast 消息
import { useAppStore } from '@/stores/appStore'
import { useI18n } from '@/i18n'

const toneStyles = {
  success: 'border-success/30 text-success',
  error: 'border-red-500/30 text-red-600',
  info: 'border-primary/30 text-primary',
  warning: 'border-amber-500/30 text-amber-600',
}

export function VToast() {
  const { toasts, dismissToast } = useAppStore()
  const { t } = useI18n()

  return (
    <div
      className="pointer-events-none fixed right-4 top-4 z-[60] flex flex-col items-end gap-2 sm:right-6 sm:top-6"
      role="status"
      aria-live="polite"
    >
      {toasts.map((item) => (
        <div
          key={item.id}
          className={`pointer-events-auto flex max-w-[min(90vw,360px)] items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-card-lg animate-[fadeInUp_0.2s_ease] ${toneStyles[item.type]}`}
        >
          <span className="h-2 w-2 shrink-0 rounded-full bg-current" />
          <span className="min-w-0 flex-1 text-sm">{item.message}</span>
          <button
            onClick={() => dismissToast(item.id)}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-current opacity-60 transition-opacity hover:opacity-100"
            aria-label={t('common.close')}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  )
}
