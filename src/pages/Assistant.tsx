// pages/Assistant.tsx — 签证申请助手（四步流程编排）
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useI18n } from '@/i18n'
import { StepIndicator } from '@/components/common'
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
  } = useVisaStore()
  const { addApplication } = useTrackerStore()
  const { toast } = useAppStore()
  const [added, setAdded] = useState(false)
  // 材料是否全部就绪（由 MaterialChecklist 上报）
  const [materialsReady, setMaterialsReady] = useState(false)
  // 活跃资料卡（从材料扫描保存，自动读取）
  const [activeCard, setActiveCard] = useState<UserProfile | null>(null)
  const [activeCardName, setActiveCardName] = useState('')
  // 资料卡识别结果无法匹配标准枚举时，在对应字段下方给提示（不让用户看到矛盾界面）
  const [unrecognizedProvince, setUnrecognizedProvince] = useState(false)
  const [unrecognizedOccupation, setUnrecognizedOccupation] = useState(false)

  // 挂载时读取活跃资料卡（仅当没有已恢复的草稿时自动填入，避免覆盖用户已填内容）
  useEffect(() => {
    if (!isTauri()) return
    ;(async () => {
      try {
        const id = await getActiveProfileId()
        if (!id) {
          // 兼容旧版 localStorage 保存的资料
          if (savedProfile) setActiveCard(savedProfile)
          return
        }
        const cards = await listProfiles()
        const card = cards.find((c) => c.id === id)
        if (card) {
          const p = cardFieldsToProfile(card.fields ?? {})
          const rawFields = (card.fields ?? {}) as Record<string, unknown>
          const rawOcc = String(rawFields['occupation'] ?? '').trim()
          const rawProvince = String(rawFields['home_province'] ?? '').trim()
          // 户籍/职业归一化后的兜底校验：仍不在标准列表 → 不写入，改由用户手动选择并提示
          if (rawProvince && !isKnownProvince(p.homeProvince, PROVINCES)) {
            setUnrecognizedProvince(true)
            p.homeProvince = ''
          }
          if (rawOcc && !p.occupation) {
            setUnrecognizedOccupation(true)
          }
          setActiveCard(p)
          setActiveCardName(card.name)
          // 自动填入申请流程（草稿已存在则保留草稿）
          setProfile((prev) => (prev && (prev.name || prev.passportNumber || prev.nationality)) ? prev : p)
        }
      } catch (e) {
        console.warn('[Assistant] 读取活跃资料卡失败:', e)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
          i < step ? t('assistant.jumpBack') : i === step ? t('assistant.currentStep') : t('assistant.lockedStep')
        }
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
        <Step2VisaType
          country={country}
          selectedVisaTypeId={selectedVisaTypeId}
          onSelect={setVisaType}
          onBack={() => setStep(0)}
          onNext={() => setStep(2)}
        />
      )}

      {/* Step 3: 填身份 */}
      {step === 2 && country && visaType && (
        <Step3Identity
          profile={profile}
          setProfile={setProfile}
          activeCard={activeCard}
          activeCardName={activeCardName}
          unrecognizedProvince={unrecognizedProvince}
          unrecognizedOccupation={unrecognizedOccupation}
          onBack={() => setStep(1)}
          onNext={(p) => {
            saveProfile(p)
            setProfile(p)
            setStep(3)
          }}
        />
      )}

      {/* Step 4: 结果 */}
      {step === 3 && country && visaType && (
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
      )}
    </div>
  )
}
