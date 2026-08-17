// hooks/useModalA11y.ts — 弹窗可访问性：焦点陷阱 + Esc 关闭 + 关闭后归还焦点
import { useEffect, useRef } from 'react'

/**
 * 为模态弹窗提供完整键盘/焦点支持：
 * - 打开时记录触发元素，把焦点移入弹窗内第一个可聚焦元素
 * - Tab / Shift+Tab 焦点陷阱（不逃出弹窗）
 * - Esc 关闭（冒泡停止，避免误关外层弹窗）
 * - 关闭后焦点归还触发元素
 * @param open 弹窗是否打开
 * @param onClose 关闭回调
 * @param titleId aria-labelledby 指向的标题元素 id（可为空）
 * @returns 弹窗容器 ref（挂到弹窗根元素上）
 */
export function useModalA11y(open: boolean, onClose: () => void, titleId?: string) {
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    triggerRef.current = document.activeElement as HTMLElement

    const dialog = dialogRef.current
    if (!dialog) return

    const focusables = () =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement)

    // 焦点移入弹窗（优先第一个可聚焦元素）
    const first = focusables()[0]
    ;(first ?? dialog).focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const list = focusables()
      if (list.length === 0) return
      const firstEl = list[0]
      const lastEl = list[list.length - 1]
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      // 关闭后焦点归还触发元素
      triggerRef.current?.focus?.()
    }
  }, [open, onClose, titleId])

  return dialogRef
}
