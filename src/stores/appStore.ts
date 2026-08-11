// stores/appStore.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Language } from '../i18n'
import { setAppLanguage } from '../i18n'

export interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

let toastId = 0

export const useAppStore = defineStore('app', () => {
  const language = ref<Language>(
    (localStorage.getItem('visago:lang') as Language) || 'zh-CN',
  )
  const theme = ref<'light' | 'dark'>('light')
  const toasts = ref<ToastItem[]>([])

  const isZh = computed(() => language.value === 'zh-CN')

  function setLanguage(lang: Language) {
    setAppLanguage(lang)
    language.value = lang
  }

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  function toast(message: string, type: ToastItem['type'] = 'info') {
    const id = ++toastId
    toasts.value.push({ id, message, type })
    setTimeout(() => dismissToast(id), 3000)
  }

  function dismissToast(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return {
    language,
    theme,
    toasts,
    isZh,
    setLanguage,
    toggleTheme,
    toast,
    dismissToast,
  }
})
