// stores/visaStore.tsx — 签证申请助手流程状态（草稿持久化：刷新/离开不丢进度）
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { countries } from '@/data/countries'
import type { UserProfile } from '@/types'

interface VisaStoreValue {
  step: number
  selectedCountryId: string | null
  selectedVisaTypeId: string | null
  profile: Partial<UserProfile> | null
  savedProfile: UserProfile | null
  /** 自动填充来源（归一化后的资料卡内容），用于字段溯源与「覆盖确认」 */
  cardSource: { profile: Partial<UserProfile> | null; name: string }
  setStep: (s: number) => void
  setCountry: (id: string | null) => void
  setVisaType: (id: string | null) => void
  setProfile: (p: Partial<UserProfile> | ((prev: Partial<UserProfile> | null) => Partial<UserProfile>)) => void
  setCardSource: (profile: Partial<UserProfile> | null, name: string) => void
  reset: () => void
  saveProfile: (p: UserProfile) => void
}

const VisaStoreContext = createContext<VisaStoreValue | null>(null)

const DRAFT_KEY = 'visago:assistant:draft'
/** 旧版草稿 key（迁移用） */
const LEGACY_DRAFT_KEY = 'visago:assistant-draft'

interface Draft {
  step: number
  selectedCountryId: string | null
  selectedVisaTypeId: string | null
  profile: Partial<UserProfile> | null
  cardProfile: Partial<UserProfile> | null
  cardName: string
}

function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY) ?? localStorage.getItem(LEGACY_DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Draft>
    return {
      step: typeof parsed.step === 'number' ? parsed.step : 0,
      selectedCountryId: parsed.selectedCountryId ?? null,
      selectedVisaTypeId: parsed.selectedVisaTypeId ?? null,
      profile: parsed.profile ?? null,
      cardProfile: parsed.cardProfile ?? null,
      cardName: parsed.cardName ?? '',
    }
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

  // 草稿恢复时校验 id 仍存在于数据中：国家不存在 → 回到 Step 1；签证类型不属于该国 → 清空
  const restoredCountryId = (() => {
    const id = draft?.selectedCountryId ?? null
    return id && countries.some((c) => c.id === id) ? id : null
  })()
  const restoredCountry = restoredCountryId ? countries.find((c) => c.id === restoredCountryId) : undefined
  const restoredVisaTypeId =
    draft?.selectedVisaTypeId && restoredCountry?.visaTypes.some((v) => v.id === draft.selectedVisaTypeId)
      ? draft.selectedVisaTypeId
      : null

  const [step, setStepState] = useState(restoredCountryId ? (draft?.step ?? 0) : 0)
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(restoredCountryId)
  const [selectedVisaTypeId, setSelectedVisaTypeId] = useState<string | null>(restoredVisaTypeId)
  const [profile, setProfileState] = useState<Partial<UserProfile> | null>(draft?.profile ?? null)
  const [cardSource, setCardSourceState] = useState<{ profile: Partial<UserProfile> | null; name: string }>({
    profile: draft?.cardProfile ?? null,
    name: draft?.cardName ?? '',
  })
  const [savedProfile, setSavedProfile] = useState<UserProfile | null>(loadSavedProfile)

  // 草稿自动持久化：刷新/跳走再回来恢复到离开时的步骤与已填数据
  useEffect(() => {
    try {
      const d: Draft = {
        step,
        selectedCountryId,
        selectedVisaTypeId,
        profile,
        cardProfile: cardSource.profile,
        cardName: cardSource.name,
      }
      localStorage.setItem(DRAFT_KEY, JSON.stringify(d))
    } catch {
      /* ignore quota errors */
    }
  }, [step, selectedCountryId, selectedVisaTypeId, profile, cardSource])

  const setStep = useCallback((s: number) => setStepState(s), [])
  const setCountry = useCallback((id: string | null) => setSelectedCountryId(id), [])
  const setVisaType = useCallback((id: string | null) => setSelectedVisaTypeId(id), [])
  const setProfile = useCallback(
    (p: Partial<UserProfile> | ((prev: Partial<UserProfile> | null) => Partial<UserProfile>)) => setProfileState(p),
    [],
  )
  const setCardSource = useCallback((p: Partial<UserProfile> | null, name: string) => {
    setCardSourceState({ profile: p, name })
  }, [])

  const reset = useCallback(() => {
    setStepState(0)
    setSelectedCountryId(null)
    setSelectedVisaTypeId(null)
    setProfileState(null)
    setCardSourceState({ profile: null, name: '' })
    try {
      localStorage.removeItem(DRAFT_KEY)
      localStorage.removeItem(LEGACY_DRAFT_KEY)
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
      cardSource,
      setStep,
      setCountry,
      setVisaType,
      setProfile,
      setCardSource,
      reset,
      saveProfile,
    }),
    [step, selectedCountryId, selectedVisaTypeId, profile, savedProfile, cardSource, setStep, setCountry, setVisaType, setProfile, setCardSource, reset, saveProfile],
  )

  return <VisaStoreContext.Provider value={value}>{children}</VisaStoreContext.Provider>
}

export function useVisaStore(): VisaStoreValue {
  const ctx = useContext(VisaStoreContext)
  if (!ctx) throw new Error('useVisaStore must be used within VisaStoreProvider')
  return ctx
}
