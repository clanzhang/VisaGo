// pages/Assistant.tsx — 签证申请助手（四步流程编排）
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useI18n } from '@/i18n'
import { StepIndicator, VButton, VModal } from '@/components/common'
import { StepContextBar } from '@/components/assistant/StepContextBar'
import { Step1Country } from '@/components/assistant/Step1Country'
import { Step2VisaType } from '@/components/assistant/Step2VisaType'
import { Step3Identity } from '@/components/assistant/Step3Identity'
import { Step4Result } from '@/components/assistant/Step4Result'
import { useVisaStore } from '@/stores/visaStore'
import { useTrackerStore } from '@/stores/trackerStore'
import { useAppStore } from '@/stores/appStore'
import { listProfiles, getActiveProfileId, isTauri } from '@/api/tauri'
import { countries, PROVINCES } from '@/data/countries'
import { getVisaExtra } from '@/data/encyclopedia-extra'
import { normalizeProvince, isKnownProvince } from '@/utils/province'
import type { UserProfile } from '@/types'

const STEPS = ['step1', 'step2', 'step3', 'step4']

/** 资料卡可自动填充的字段（用于溯源/恢复/覆盖） */
const CARD_FIELDS: (keyof UserProfile)[] = [
  'name',
  'passportNumber',
  'nationality',
  'birthDate',
  'occupation',
  'homeProvince',
  'passportIssuedIn',
]

/** 把 Rust 资料卡 snake_case fields 转成前端 camelCase UserProfile */
function cardFieldsToProfile(fields: Record<string, unknown>): UserProfile {
  const str = (v: unknown): string => (v === null || v === undefined ? '' : String(v))
  const occ = str(fields['occupation']).toLowerCase()
  // 职业：只接受已知枚举，未知值留空由用户手选（不许悄悄猜成 employed）
  const occupation = (['employed', 'student', 'retired', 'freelance'].includes(occ) ? occ : '') as UserProfile['occupation']
  return {
    name: str(fields['name']),
    passportNumber: str(fields['passport_number']),
    nationality: str(fields['nationality']),
    birthDate: str(fields['birth_date']),
    occupation,
    company: str(fields['company']) || undefined,
    position: str(fields['position']) || undefined,
    salary: str(fields['salary']) || undefined,
    // 户籍：OCR 常给「北京市」「广西壮族自治区」，归一化为标准短名
    homeProvince: normalizeProvince(str(fields['home_province'])),
    passportIssuedIn: str(fields['passport_issued_in']),
    hasHistoryVisa: Boolean(fields['has_history_visa']),
  }
}

export default function Assistant() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const {
    step, setStep,
    selectedCountryId, setCountry,
    selectedVisaTypeId, setVisaType,
    profile, setProfile, reset,
    savedProfile, saveProfile,
    cardSource, setCardSource,
  } = useVisaStore()
  const { addApplication } = useTrackerStore()
  const { toast } = useAppStore()
  const [added, setAdded] = useState(false)
  // 材料是否全部就绪（由 MaterialChecklist 上报）
  const [materialsReady, setMaterialsReady] = useState(false)
  // 活跃资料卡（从材料扫描保存，自动读取）
  const [activeCard, setActiveCard] = useState<UserProfile | null>(null)
  // 归一化后的资料卡值（自动填充来源，用于字段溯源与覆盖确认）
  const [cardProfile, setCardProfile] = useState<Partial<UserProfile> | null>(cardSource.profile)
  const [cardName, setCardName] = useState(cardSource.name)
  // 资料卡识别结果无法匹配标准枚举时，在对应字段下方给提示（不让用户看到矛盾界面）
  const [unrecognizedProvince, setUnrecognizedProvince] = useState(false)
  const [unrecognizedOccupation, setUnrecognizedOccupation] = useState(false)
  // /scan 返回后资料卡更新 → 覆盖确认弹窗
  const [overwritePrompt, setOverwritePrompt] = useState<{ profile: UserProfile; name: string } | null>(null)

  /** 读取活跃资料卡（归一化 + 兜底校验），返回 null 表示无卡 */
  const readActiveCard = useCallback(async (): Promise<{ profile: UserProfile; name: string } | null> => {
    if (!isTauri()) return null
    try {
      const id = await getActiveProfileId()
      if (!id) {
        return savedProfile ? { profile: savedProfile, name: '' } : null
      }
      const cards = await listProfiles()
      const card = cards.find((c) => c.id === id)
      if (!card) return null
      const p = cardFieldsToProfile(card.fields ?? {})
      const rawFields = (card.fields ?? {}) as Record<string, unknown>
      const rawOcc = String(rawFields['occupation'] ?? '').trim()
      const rawProvince = String(rawFields['home_province'] ?? '').trim()
      if (rawProvince && !isKnownProvince(p.homeProvince, PROVINCES)) {
        setUnrecognizedProvince(true)
        p.homeProvince = ''
      }
      if (rawOcc && !p.occupation) {
        setUnrecognizedOccupation(true)
      }
      return { profile: p, name: card.name }
    } catch (e) {
      console.warn('[Assistant] 读取活跃资料卡失败:', e)
      return null
    }
  }, [savedProfile])

  /** 两个归一化资料卡是否内容一致（不一致才需要覆盖确认） */
  const sameCard = useCallback((a: Partial<UserProfile> | null, b: Partial<UserProfile> | null): boolean => {
    if (!a || !b) return false
    return CARD_FIELDS.every((k) => String(a[k] ?? '') === String(b[k] ?? ''))
  }, [])

  /** 应用资料卡内容到表单：仅覆盖仍与旧卡一致的字段（用户手改过的保留） */
  const applyCardToProfile = useCallback(
    (oldCard: Partial<UserProfile> | null, newCard: Partial<UserProfile>) => {
      setProfile((prev) => {
        const next: Record<string, unknown> = { ...(prev ?? {}) }
        for (const key of CARD_FIELDS) {
          if (!oldCard || String((prev ?? {})[key] ?? '') === String(oldCard[key] ?? '')) {
            next[key] = newCard[key]
          }
        }
        return next as Partial<UserProfile>
      })
    },
    [setProfile],
  )

  // 挂载时：读活跃资料卡 → 自动填充或提示覆盖
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const data = await readActiveCard()
      if (cancelled || !data) return
      setActiveCard(data.profile)
      setCardName(data.name)
      // 已有草稿且曾记录过填充来源：资料卡变了 → 询问是否覆盖（不静默覆盖用户手输内容）
      const hasDraftContent = !!(profile && (profile.name || profile.passportNumber || profile.nationality))
      if (hasDraftContent && cardProfile && !sameCard(cardProfile, data.profile)) {
        setOverwritePrompt(data)
        return
      }
      if (!hasDraftContent) {
        setCardProfile(data.profile)
        setCardSource(data.profile, data.name)
        setProfile(data.profile)
      } else if (!cardProfile) {
        // 旧版草稿没有填充来源记录：保持草稿，仅记录当前卡作为后续来源
        setCardProfile(data.profile)
        setCardSource(data.profile, data.name)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 资料卡保存事件（Scan 页 dispatch）：重新读取，若与来源不一致则询问覆盖
  useEffect(() => {
    const handler = () => {
      void (async () => {
        const data = await readActiveCard()
        if (!data) return
        setActiveCard(data.profile)
        setCardName(data.name)
        if (profile && (profile.name || profile.passportNumber || profile.nationality) && cardProfile && !sameCard(cardProfile, data.profile)) {
          setOverwritePrompt(data)
        }
      })()
    }
    window.addEventListener('visago:profile-updated', handler)
    return () => window.removeEventListener('visago:profile-updated', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, cardProfile])

  // 从详情页跳转带参
  useEffect(() => {
    const state = location.state as { countryId?: string; visaTypeId?: string } | null
    if (state?.countryId) {
      setCountry(state.countryId)
      if (state.visaTypeId) setVisaType(state.visaTypeId)
      setStep(1)
    }
  }, [location.state, setCountry, setVisaType, setStep])

  const country = countries.find((c) => c.id === selectedCountryId)
  const visaType = country?.visaTypes.find((v) => v.id === selectedVisaTypeId) ?? null
  const extra = visaType ? getVisaExtra(country!.id, visaType.id) : undefined

  const totalFees = useMemo(() => {
    if (!visaType) return 0
    const f = extra?.fees
    return f ? f.visaFee + f.serviceFee + f.courierFee + f.photoFee : visaType.fee.amount + (visaType.serviceFee?.amount ?? 0)
  }, [visaType, extra])

  function startTracking() {
    if (!country || !visaType) return
    addApplication({
      countryId: country.id,
      visaTypeId: visaType.id,
      status: 'preparing',
      notes: '',
    })
    setAdded(true)
    toast(t('tracker.addedToast'), 'success')
    setTimeout(() => navigate('/tracker'), 1200)
  }

  /** 重新识别：重读资料卡并应用到仍与来源一致的字段 */
  async function handleRescan() {
    const data = await readActiveCard()
    if (!data) return
    setActiveCard(data.profile)
    setCardName(data.name)
    const oldCard = cardProfile
    setCardProfile(data.profile)
    setCardSource(data.profile, data.name)
    applyCardToProfile(oldCard, data.profile)
  }

  /** 全部恢复为资料卡内容 */
  function handleRestoreAll() {
    if (!cardProfile) return
    setProfile((prev) => ({ ...(prev ?? {}), ...cardProfile }))
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">{t('assistant.title')}</h1>
        <p className="mt-1 text-base font-medium text-subtle">{t('assistant.subtitle')}</p>
      </div>

      {/* 步骤指示器：已完成（绿/可点击回跳）· 当前（蓝）· 未解锁（灰） */}
      <StepIndicator
        steps={STEPS}
        current={step}
        onStep={(i) => setStep(i)}
        renderLabel={(s) => t(`assistant.${s}`)}
        titleFor={(i) =>
          i < step
            ? t('assistant.backToStep', { n: i + 1, name: t(`assistant.${STEPS[i]}`) })
            : i === step
              ? t('assistant.currentStep')
              : t('assistant.lockedStep')
        }
        mobileText={t('assistant.mobileProgress', {
          current: step + 1,
          total: STEPS.length,
          name: t(`assistant.${STEPS[step]}`),
        })}
      />

      {/* Step 1: 选国家 */}
      {step === 0 && (
        <Step1Country
          selectedCountryId={selectedCountryId}
          onSelect={setCountry}
          onNext={() => setStep(1)}
        />
      )}

      {/* Step 2: 选类型 */}
      {step === 1 && country && (
        <>
          <StepContextBar
            country={country}
            visaType={visaType}
            changeLabel={t('assistant.changeCountry')}
            onChange={() => setStep(0)}
          />
          <Step2VisaType
            country={country}
            selectedVisaTypeId={selectedVisaTypeId}
            onSelect={setVisaType}
            onBack={() => setStep(0)}
            onNext={() => setStep(2)}
          />
        </>
      )}

      {/* Step 3: 填身份 */}
      {step === 2 && country && visaType && (
        <>
          <StepContextBar
            country={country}
            visaType={visaType}
            changeLabel={t('assistant.changeVisaType')}
            onChange={() => setStep(1)}
          />
          <Step3Identity
            profile={profile}
            setProfile={setProfile}
            activeCard={activeCard}
            cardName={cardName}
            cardProfile={cardProfile}
            hasCard={!!activeCard}
            unrecognizedProvince={unrecognizedProvince}
            unrecognizedOccupation={unrecognizedOccupation}
            onBack={() => setStep(1)}
            onNext={(p) => {
              saveProfile(p)
              setProfile(p)
              setStep(3)
            }}
            onManageCards={() => navigate('/scan')}
            onRescan={handleRescan}
            onRestoreAll={handleRestoreAll}
          />
        </>
      )}

      {/* Step 4: 结果 */}
      {step === 3 && country && visaType && (
        <>
          <StepContextBar
            country={country}
            visaType={visaType}
            changeLabel={t('assistant.changeVisaType')}
            onChange={() => setStep(1)}
          />
          <Step4Result
            country={country}
            visaType={visaType}
            profile={profile}
            totalFees={totalFees}
            materialsReady={materialsReady}
            added={added}
            onMaterialsReadyChange={setMaterialsReady}
            onReset={() => {
              if (window.confirm(t('assistant.resetConfirm'))) reset()
            }}
            onBack={() => setStep(2)}
            onTrack={startTracking}
          />
        </>
      )}

      {/* 资料卡更新 → 覆盖确认（不静默覆盖用户手输内容） */}
      <VModal
        open={!!overwritePrompt}
        onClose={() => setOverwritePrompt(null)}
        title={t('assistant.cardUpdatedTitle')}
        footer={
          <>
            <VButton variant="secondary" onClick={() => setOverwritePrompt(null)}>
              {t('assistant.keepCurrent')}
            </VButton>
            <VButton
              onClick={() => {
                if (overwritePrompt) {
                  applyCardToProfile(cardProfile, overwritePrompt.profile)
                  setCardProfile(overwritePrompt.profile)
                  setCardSource(overwritePrompt.profile, overwritePrompt.name)
                }
                setOverwritePrompt(null)
              }}
            >
              {t('assistant.overwrite')}
            </VButton>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink/70">{t('assistant.cardUpdatedDesc')}</p>
      </VModal>
    </div>
  )
}
