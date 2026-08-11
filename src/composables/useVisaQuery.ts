// composables/useVisaQuery.ts
import { computed } from 'vue'
import { getCountry, getVisaType, searchCountries } from '../data/countries'
import type { Localized } from '../types'
import { useAppStore } from '../stores/appStore'

/** 根据当前语言返回 Localized 文本 */
export function useLocalizedText() {
  const app = useAppStore()

  return {
    isZh: computed(() => app.isZh),
    /** 取 Localized 对象中对应语言文本 */
    t: (l: Localized | undefined | null): string => {
      if (!l) return ''
      return app.isZh ? l.zh : l.en
    },
  }
}

export function useCountry(id: string | null | undefined) {
  return computed(() => (id ? getCountry(id) : undefined))
}

export function useVisaType(countryId: string | null | undefined, visaTypeId: string | null | undefined) {
  return computed(() =>
    countryId && visaTypeId ? getVisaType(countryId, visaTypeId) : undefined,
  )
}

export function useSearchCountries(keyword: string) {
  return computed(() => searchCountries(keyword))
}
