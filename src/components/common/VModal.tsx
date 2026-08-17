// components/common/VModal.tsx — 模态框
import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useI18n } from '@/i18n'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
  width?: string
}

export function VModal({ open, onClose, title, children, footer, width = 'max-w-lg' }: Props) {
  const { t } = useI18n()
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 animate-[fadeIn_0.15s_ease]"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${width} bg-white rounded-2xl shadow-lg animate-[fadeInUp_0.25s_ease]`}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-ink/5 px-6 py-4">
            <h3 className="text-base font-semibold">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-ink/60 hover:bg-ink/5 hover:text-ink"
              aria-label={t('common.close')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="flex justify-end gap-3 border-t border-ink/5 px-6 py-4">{footer}</div>
        )}
      </div>
    </div>
  )
}
