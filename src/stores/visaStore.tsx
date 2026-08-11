// stores/visaStore.tsx — 签证申请助手流程状态
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { UserProfile } from '@/types'

interface VisaStoreValue {
  step: number
  selectedCountryId: string | null
  selectedVisaTypeId: string | null
  profile: Partial<UserProfile> | null
  savedProfile: UserProfile | null
  setStep: (s: number) => void
  setCountry: (id: string | null) => void
  setVisaType: (id: string | null) => void
  setProfile: (p: Partial<UserProfile>) => void
  reset: () => void
  saveProfile: (p: UserProfile) => void
}

const VisaStoreContext = createContext<VisaStoreValue | null>(null)

function loadSavedProfile(): UserProfile | null {
  try {
    return JSON.parse(localStorage.getItem('visago:profile') || 'null')
  } catch {
    return null
  }
}

export function VisaStoreProvider({ children }: { children: ReactNode }) {
  const [step, setStepState] = useState(0)
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null)
  const [selectedVisaTypeId, setSelectedVisaTypeId] = useState<string | null>(null)
  const [profile, setProfileState] = useState<Partial<UserProfile> | null>(null)
  const [savedProfile, setSavedProfile] = useState<UserProfile | null>(loadSavedProfile)

  const setStep = useCallback((s: number) => setStepState(s), [])
  const setCountry = useCallback((id: string | null) => setSelectedCountryId(id), [])
  const setVisaType = useCallback((id: string | null) => setSelectedVisaTypeId(id), [])
  const setProfile = useCallback((p: Partial<UserProfile>) => setProfileState(p), [])

  const reset = useCallback(() => {
    setStepState(0)
    setSelectedCountryId(null)
    setSelectedVisaTypeId(null)
    setProfileState(null)
  }, [])

  const saveProfile = useCallback((p: UserProfile) => {
    setSavedProfile(p)
    localStorage.setItem('visago:profile', JSON.stringify(p))
  }, [])

  const value = useMemo<VisaStoreValue>(
    () => ({
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
    }),
    [step, selectedCountryId, selectedVisaTypeId, profile, savedProfile, setStep, setCountry, setVisaType, setProfile, reset, saveProfile],
  )

  return <VisaStoreContext.Provider value={value}>{children}</VisaStoreContext.Provider>
}

export function useVisaStore(): VisaStoreValue {
  const ctx = useContext(VisaStoreContext)
  if (!ctx) throw new Error('useVisaStore must be used within VisaStoreProvider')
  return ctx
}
