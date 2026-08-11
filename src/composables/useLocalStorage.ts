// composables/useLocalStorage.ts
import { ref, watch, type Ref } from 'vue'

export function useLocalStorage<T>(key: string, initialValue: T): Ref<T> {
  const stored = ref(initialValue) as Ref<T>

  try {
    const item = localStorage.getItem(key)
    if (item) stored.value = JSON.parse(item) as T
  } catch {
    // ignore parse errors
  }

  watch(
    stored,
    (val) => {
      try {
        localStorage.setItem(key, JSON.stringify(val))
      } catch {
        // ignore quota errors
      }
    },
    { deep: true },
  )

  window.addEventListener('storage', (e) => {
    if (e.key === key && e.newValue) {
      try {
        stored.value = JSON.parse(e.newValue) as T
      } catch {
        // ignore
      }
    }
  })

  return stored
}
