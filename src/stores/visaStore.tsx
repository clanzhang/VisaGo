// stores/visaStore.tsx — 签证申请助手流程状态（含草稿持久化：刷新页面不丢失进度）
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
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
  setProfile: (p: Partial<UserProfile> | ((prev: Partial<UserProfile> | null) => Partial<UserProfile>)) => void
  reset: () => void
  saveProfile: (p: UserProfile) => void
}

const VisaStoreContext = createContext<VisaStoreValue | null>(null)

const DRAFT_KEY = 'visago:assistant-draft'

interface Draft {
  step: number
  selectedCountryId: string | null
  selectedVisaTypeId: string | null
  profile: Partial<UserProfile> | null
}

function loadDraft(): Draft | null {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null') as Draft | null
  } catch {
    return null
  }
}

function loadSavedProfile(): UserProfile | null {
  try {
    return JSON.parse(localStorage.getItem('visago:profile') || 'null')
  } catch {
    return null
  }
}

export function VisaStoreProvider({ children }: { children: ReactNode }) {
  const [draft] = useState<Draft | null>(loadDraft)
  const [step, setStepState] = useState(draft?.step ?? 0)
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(draft?.selectedCountryId ?? null)
  const [selectedVisaTypeId, setSelectedVisaTypeId] = useState<string | null>(draft?.selectedVisaTypeId ?? null)
  const [profile, setProfileState] = useState<Partial<UserProfile> | null>(draft?.profile ?? null)
  const [savedProfile, setSavedProfile] = useState<UserProfile | null>(loadSavedProfile)

  // 草稿自动持久化：刷新页面后恢复到离开时的步骤与已填数据
  useEffect(() => {
    try {
      const d: Draft = { step, selectedCountryId, selectedVisaTypeId, profile }
      localStorage.setItem(DRAFT_KEY, JSON.stringify(d))
    } catch {
      /* ignore quota errors */
    }
  }, [step, selectedCountryId, selectedVisaTypeId, profile])

  const setStep = useCallback((s: number) => setStepState(s), [])
  const setCountry = useCallback((id: string | null) => setSelectedCountryId(id), [])
  const setVisaType = useCallback((id: string | null) => setSelectedVisaTypeId(id), [])
  const setProfile = useCallback(
    (p: Partial<UserProfile> | ((prev: Partial<UserProfile> | null) => Partial<UserProfile>)) => setProfileState(p),
    [],
  )

  const reset = useCallback(() => {
    setStepState(0)
    setSelectedCountryId(null)
    setSelectedVisaTypeId(null)
    setProfileState(null)
    try {
      localStorage.removeItem(DRAFT_KEY)
    } catch {
      /* ignore */
    }
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
