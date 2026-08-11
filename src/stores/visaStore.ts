// stores/visaStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UserProfile } from '../types'

export const useVisaStore = defineStore('visa', () => {
  // 助手流程状态
  const step = ref(0)
  const selectedCountryId = ref<string | null>(null)
  const selectedVisaTypeId = ref<string | null>(null)
  const profile = ref<Partial<UserProfile> | null>(null)

  // 文档生成用户资料（跨模板复用，持久化）
  const savedProfile = ref<UserProfile | null>(
    JSON.parse(localStorage.getItem('visago:profile') || 'null'),
  )

  function setStep(s: number) {
    step.value = s
  }

  function setCountry(id: string | null) {
    selectedCountryId.value = id
  }

  function setVisaType(id: string | null) {
    selectedVisaTypeId.value = id
  }

  function setProfile(p: Partial<UserProfile>) {
    profile.value = p
  }

  function reset() {
    step.value = 0
    selectedCountryId.value = null
    selectedVisaTypeId.value = null
    profile.value = null
  }

  function saveProfile(p: UserProfile) {
    savedProfile.value = p
    localStorage.setItem('visago:profile', JSON.stringify(p))
  }

  return {
    step,
    selectedCountryId,
    selectedVisaTypeId,
    profile,
    savedProfile,
    setStep,
    setCountry,
    setVisaType,
    setProfile,
    reset,
    saveProfile,
  }
})
