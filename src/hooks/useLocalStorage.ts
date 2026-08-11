// hooks/useLocalStorage.ts
import { useState } from 'react'

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })

  function set(next: T | ((prev: T) => T)) {
    setValue((prev) => {
      const val = typeof next === 'function' ? (next as (p: T) => T)(prev) : next
      try {
        localStorage.setItem(key, JSON.stringify(val))
      } catch {
        /* ignore */
      }
      return val
    })
  }

  return [value, set] as const
}
