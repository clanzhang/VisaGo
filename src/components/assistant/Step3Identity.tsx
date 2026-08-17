// components/assistant/Step3Identity.tsx — 第三步：填写身份信息（字段级校验 + 自动聚焦）
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/i18n'
import { VButton } from '@/components/common'
import { PROVINCES, OCCUPATIONS } from '@/data/countries'
import type { UserProfile } from '@/types'

interface Props {
  profile: Partial<UserProfile> | null
  setProfile: (p: Partial<UserProfile>) => void
  activeCard: UserProfile | null
  activeCardName: string
  onBack: () => void
  onNext: (p: UserProfile) => void
}

/** 必填字段（缺失时在字段旁提示并自动聚焦首个错误） */
const REQUIRED_FIELDS: { key: keyof UserProfile; labelKey: string }[] = [
  { key: 'name', labelKey: 'documents.name' },
  { key: 'passportNumber', labelKey: 'documents.passportNumber' },
  { key: 'nationality', labelKey: 'documents.nationality' },
  { key: 'occupation', labelKey: 'documents.occupation' },
  { key: 'homeProvince', labelKey: 'assistant.homeProvince' },
]

export function Step3Identity({ profile, setProfile, activeCard, activeCardName, onBack, onNext }: Props) {
  const { t } = useI18n()
  const navigate = useNavigate()
  // 字段级校验错误：{ key: '该字段必填' }
  const [errors, setErrors] = useState<Record<string, string>>({})
  const inputRefs = useRef<Record<string, HTMLInputElement | HTMLSelectElement | null>>({})

  const p = profile ?? {}

  function fieldValue(key: keyof UserProfile): string {
    return String(p[key] ?? '').trim()
  }

  function handleNext() {
    const nextErrors: Record<string, string> = {}
    for (const f of REQUIRED_FIELDS) {
      if (!fieldValue(f.key)) {
        nextErrors[f.key] = t('assistant.fieldRequired')
      }
    }
    setErrors(nextErrors)
    const firstErrorKey = Object.keys(nextErrors)[0]
    if (firstErrorKey) {
      // 自动聚焦并滚动到首个错误字段
      inputRefs.current[firstErrorKey]?.focus()
      inputRefs.current[firstErrorKey]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    const complete: UserProfile = {
      name: p.name ?? '',
      passportNumber: p.passportNumber ?? '',
      nationality: p.nationality ?? '',
      birthDate: p.birthDate ?? '',
      occupation: (p.occupation ?? 'employed') as UserProfile['occupation'],
      homeProvince: p.homeProvince ?? '',
      passportIssuedIn: p.passportIssuedIn ?? '',
      company: p.company,
      position: p.position,
      salary: p.salary,
    }
    onNext(complete)
  }

  const inputCls = (hasError: boolean) =>
    `w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 ${
      hasError
        ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
        : 'border-ink/10 focus:border-primary/40 focus:ring-primary/10'
    }`

  return (
    <div className="anim-card rounded-2xl bg-white p-6 shadow-card">
      <h2 className="mb-5 text-lg font-bold text-ink">{t('assistant.identityTitle')}</h2>

      {/* 活跃资料卡提示（从材料扫描自动读取） */}
      {activeCard ? (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-success/30 bg-success/5 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#39A2B8] to-[#1460A4] text-sm font-semibold text-white">
            {(activeCard.name || '?').slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-ink">
              {activeCard.name || t('assistant.unnamed')}{' '}
              <span className="ml-1 rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-medium text-success">✓ {t('assistant.autoLoaded')}</span>
            </div>
            <div className="mt-0.5 truncate text-xs text-ink/60">
              {t('assistant.cardSummary', {
                passport: activeCard.passportNumber || '—',
                nationality: activeCard.nationality || '—',
                occupation: t(`documents.occupation${activeCard.occupation.charAt(0).toUpperCase() + activeCard.occupation.slice(1)}`),
                home: activeCard.homeProvince || '—',
              })}
              {activeCardName && `（${activeCardName}）`}
            </div>
          </div>
          <VButton variant="secondary" size="sm" onClick={() => navigate('/scan')}>
            📁 {t('assistant.manageCards')}
          </VButton>
        </div>
      ) : (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <span className="text-lg">📢</span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-amber-700">{t('assistant.scanFirstTitle')}</div>
            <div className="mt-0.5 text-xs text-amber-700">{t('assistant.scanFirstDesc')}</div>
          </div>
          <VButton size="sm" onClick={() => navigate('/scan')}>
            📁 {t('assistant.goScan')}
          </VButton>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink/70">{t('documents.name')} *</label>
          <input
            ref={(el) => { inputRefs.current['name'] = el }}
            value={p.name ?? ''}
            onChange={(e) => {
              setProfile({ ...p, name: e.target.value })
              if (errors.name) setErrors((prev) => ({ ...prev, name: '' }))
            }}
            aria-invalid={!!errors.name}
            className={inputCls(!!errors.name)}
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink/70">{t('documents.passportNumber')} *</label>
          <input
            ref={(el) => { inputRefs.current['passportNumber'] = el }}
            value={p.passportNumber ?? ''}
            onChange={(e) => {
              setProfile({ ...p, passportNumber: e.target.value })
              if (errors.passportNumber) setErrors((prev) => ({ ...prev, passportNumber: '' }))
            }}
            aria-invalid={!!errors.passportNumber}
            className={inputCls(!!errors.passportNumber)}
          />
          {errors.passportNumber && <p className="mt-1 text-xs text-red-600">{errors.passportNumber}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink/70">{t('documents.nationality')} *</label>
          <input
            ref={(el) => { inputRefs.current['nationality'] = el }}
            value={p.nationality ?? ''}
            onChange={(e) => {
              setProfile({ ...p, nationality: e.target.value })
              if (errors.nationality) setErrors((prev) => ({ ...prev, nationality: '' }))
            }}
            placeholder={t('assistant.nationalityPlaceholder')}
            aria-invalid={!!errors.nationality}
            className={inputCls(!!errors.nationality)}
          />
          {errors.nationality && <p className="mt-1 text-xs text-red-600">{errors.nationality}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink/70">{t('documents.occupation')} *</label>
          <select
            ref={(el) => { inputRefs.current['occupation'] = el }}
            value={p.occupation ?? ''}
            onChange={(e) => {
              setProfile({ ...p, occupation: e.target.value as UserProfile['occupation'] })
              if (errors.occupation) setErrors((prev) => ({ ...prev, occupation: '' }))
            }}
            aria-invalid={!!errors.occupation}
            className={inputCls(!!errors.occupation)}
          >
            <option value="">{t('common.select')}</option>
            {OCCUPATIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {t(`documents.occupation${o.value.charAt(0).toUpperCase() + o.value.slice(1)}`)}
              </option>
            ))}
          </select>
          {errors.occupation && <p className="mt-1 text-xs text-red-600">{errors.occupation}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink/70">{t('assistant.passportIssuedIn')}</label>
          <input
            value={p.passportIssuedIn ?? ''}
            onChange={(e) => setProfile({ ...p, passportIssuedIn: e.target.value })}
            className={inputCls(false)}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink/70">{t('assistant.homeProvince')} *</label>
          <select
            ref={(el) => { inputRefs.current['homeProvince'] = el }}
            value={p.homeProvince ?? ''}
            onChange={(e) => {
              setProfile({ ...p, homeProvince: e.target.value })
              if (errors.homeProvince) setErrors((prev) => ({ ...prev, homeProvince: '' }))
            }}
            aria-invalid={!!errors.homeProvince}
            className={inputCls(!!errors.homeProvince)}
          >
            <option value="">{t('common.select')}</option>
            {PROVINCES.map((pr) => (
              <option key={pr} value={pr}>{pr}</option>
            ))}
          </select>
          {errors.homeProvince && <p className="mt-1 text-xs text-red-600">{errors.homeProvince}</p>}
        </div>
      </div>
      <div className="mt-6 flex justify-between">
        <VButton variant="secondary" size="lg" onClick={onBack}>
          {t('assistant.back')}
        </VButton>
        <VButton size="lg" onClick={handleNext}>
          {t('assistant.next')}
        </VButton>
      </div>
    </div>
  )
}
