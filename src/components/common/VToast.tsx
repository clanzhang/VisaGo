// components/common/VToast.tsx — Toast 消息
import { useAppStore } from '@/stores/appStore'

const toneStyles = {
  success: 'border-success/30 text-success',
  error: 'border-red-500/30 text-red-600',
  info: 'border-primary/30 text-primary',
  warning: 'border-amber-500/30 text-amber-600',
}

export function VToast() {
  const { toasts, dismissToast } = useAppStore()

  return (
    <div className="pointer-events-none fixed right-6 top-6 z-[60] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-card-lg animate-[fadeInUp_0.2s_ease] ${toneStyles[t.type]}`}
          onClick={() => dismissToast(t.id)}
        >
          <span className="h-2 w-2 rounded-full bg-current" />
          <span className="text-sm">{t.message}</span>
        </div>
      ))}
    </div>
  )
}
