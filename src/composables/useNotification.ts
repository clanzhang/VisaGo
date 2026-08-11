// composables/useNotification.ts
import { useAppStore } from '../stores/appStore'

export function useNotification() {
  const app = useAppStore()

  function success(message: string) {
    app.toast(message, 'success')
  }

  function error(message: string) {
    app.toast(message, 'error')
  }

  function info(message: string) {
    app.toast(message, 'info')
  }

  function warning(message: string) {
    app.toast(message, 'warning')
  }

  return { success, error, info, warning }
}
