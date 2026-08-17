// components/assistant/Step3Identity.tsx — 第三步：填写身份信息
// 校验：onBlur 首次校验 + 提交时全量校验；已报错字段输入时实时清除；不替用户编造默认值
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
  /** 资料卡户籍归一化后仍不在标准列表 → 提示手动选择 */
  unrecognizedProvince?: boolean
  /** 资料卡职业识别值未知 → 提示手动选择 */
  unrecognizedOccupation?: boolean
  onBack: () => void
  onNext: (p: UserProfile) => void
}

type FieldKey = 'name' | 'passportNumber' | 'nationality' | 'occupation' | 'homeProvince'

/** 必填字段（缺失时阻塞下一步） */
const REQUIRED_FIELDS: { key: FieldKey; labelKey: string }[] = [
  { key: 'name', labelKey: 'documents.name' },
  { key: 'passportNumber', labelKey: 'documents.passportNumber' },
  { key: 'nationality', labelKey: 'documents.nationality' },
  { key: 'occupation', labelKey: 'documents.occupation' },
  { key: 'homeProvince', labelKey: 'assistant.homeProvince' },
]

/** 中国普通护照：1-2 位字母 + 7-8 位数字 */
const PASSPORT_RE = /^[A-Z]{1,2}[0-9]{7,8}$/

export function Step3Identity({
  profile,
  setProfile,
  activeCard,
  activeCardName,
  unrecognizedProvince,
  unrecognizedOccupation,
  onBack,
  onNext,
}: Props) {
  const { t } = useI18n()
  const navigate = useNavigate()
  // 阻塞性错误（红字，阻止下一步）
  const [errors, setErrors] = useState<Record<string, string>>({})
  // 提示型错误（如护照号格式，不阻塞，仅提示）
  const [hints, setHints] = useState<Record<string, string>>({})
  // 是否提交过（用于「还有 N 项需要补全」汇总）
  const [submitted, setSubmitted] = useState(false)
  const inputRefs = useRef<Record<string, HTMLInputElement | HTMLSelectElement | null>>({})

  const p = profile ?? {}

  function fieldValue(key: FieldKey): string {
    return String(p[key] ?? '').trim()
  }

  /** 单字段校验：返回 { err?, hint? }；err 阻塞，hint 仅提示 */
  function validateField(key: FieldKey, value: string): { err?: string; hint?: string } {
    const required = REQUIRED_FIELDS.some((f) => f.key === key)
    if (required && !value) {
      return { err: t('assistant.fieldRequired') }
    }
    if (key === 'passportNumber' && value && !PASSPORT_RE.test(value)) {
      return { hint: t('assistant.passportFormatHint') }
    }
    return {}
  }

  function handleBlur(key: FieldKey) {
    const v = fieldValue(key)
    const res = validateField(key, v)
    setErrors((prev) => {
      const next = { ...prev }
      if (res.err) next[key] = res.err
      else delete next[key]
      return next
    })
    setHints((prev) => {
      const next = { ...prev }
      if (res.hint) next[key] = res.hint
      else delete next[key]
      return next
    })
  }

  /** 输入时实时清除该字段已报错误（不要 onChange 就报红，只在 blur/提交后清理） */
  function clearFieldState(key: FieldKey) {
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
    setHints((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function handleSubmit() {
    setSubmitted(true)
    const nextErrors: Record<string, string> = {}
    const nextHints: Record<string, string> = {}
    for (const f of REQUIRED_FIELDS) {
      const v = fieldValue(f.key)
      const res = validateField(f.key, v)
      if (res.err) nextErrors[f.key] = res.err
      if (res.hint) nextHints[f.key] = res.hint
    }
    // 护照号格式提示（非必填字段外的所有字段兜底）
    const passport = fieldValue('passportNumber')
    if (passport && !PASSPORT_RE.test(passport)) nextHints['passportNumber'] = t('assistant.passportFormatHint')
    setErrors(nextErrors)
    setHints(nextHints)

    const firstErrorKey = Object.keys(nextErrors)[0]
    if (firstErrorKey) {
      // 滚动并聚焦到第一个错误字段
      inputRefs.current[firstErrorKey]?.focus()
      inputRefs.current[firstErrorKey]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    // 只存用户真实填写/已确认的值，绝不编造
    const complete: UserProfile = {
      name: p.name ?? '',
      passportNumber: (p.passportNumber ?? '').toUpperCase().replace(/\s+/g, ''),
      nationality: p.nationality ?? '',
      birthDate: p.birthDate ?? '',
      occupation: (p.occupation ?? '') as UserProfile['occupation'],
      homeProvince: p.homeProvince ?? '',
      passportIssuedIn: p.passportIssuedIn ?? '',
      company: p.company,
      position: p.position,
      salary: p.salary,
    }
    onNext(complete)
  }

  const blockingCount = Object.keys(errors).length

  const inputCls = (hasError: boolean) =>
    `w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 ${
      hasError
        ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
        : 'border-ink/10 focus:border-primary/40 focus:ring-primary/10'
    }`

  /** label + 校验提示（含 aria 关联） */
  function fieldErrorBlock(key: FieldKey) {
    const err = errors[key]
    const hint = hints[key] ?? (key === 'homeProvince' && unrecognizedProvince ? t('assistant.provinceUnrecognized') : key === 'occupation' && unrecognizedOccupation ? t('assistant.occupationUnrecognized') : '')
    if (!err && !hint) return null
    return (
      <p id={`identity-${key}-error`} className={`mt-1 text-[13px] ${err ? 'text-red-600' : 'text-amber-600'}`}>
        {err || hint}
      </p>
    )
  }

  function describedBy(key: FieldKey): string | undefined {
    return errors[key] || hints[key] || (key === 'homeProvince' && unrecognizedProvince) || (key === 'occupation' && unrecognizedOccupation)
      ? `identity-${key}-error`
      : undefined
  }

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
              <span className="ml-1 rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-medium text-success">
                <span className="mr-0.5 inline-block h-3.5 w-3.5 align-[-2px] icon-[mdi-light--check]" />
                {t('assistant.autoLoaded')}
              </span>
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
            <span className="h-4 w-4 icon-[mdi-light--folder]" />
            {t('assistant.manageCards')}
          </VButton>
        </div>
      ) : (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <span className="h-5 w-5 shrink-0 text-amber-600 icon-[mdi-light--alert]" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-amber-700">{t('assistant.scanFirstTitle')}</div>
            <div className="mt-0.5 text-xs text-amber-700">{t('assistant.scanFirstDesc')}</div>
          </div>
          <VButton size="sm" onClick={() => navigate('/scan')}>
            <span className="h-4 w-4 icon-[mdi-light--folder]" />
            {t('assistant.goScan')}
          </VButton>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit()
        }}
        noValidate
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="identity-name" className="mb-1.5 block text-sm font-medium text-ink/70">
              {t('documents.name')} <span className="text-red-500">*</span>
            </label>
            <input
              id="identity-name"
              ref={(el) => { inputRefs.current['name'] = el }}
              value={p.name ?? ''}
              onChange={(e) => {
                setProfile({ ...p, name: e.target.value })
                clearFieldState('name')
              }}
              onBlur={() => handleBlur('name')}
              required
              aria-required="true"
              aria-invalid={!!errors.name}
              aria-describedby={describedBy('name')}
              className={inputCls(!!errors.name)}
            />
            {fieldErrorBlock('name')}
          </div>
          <div>
            <label htmlFor="identity-passportNumber" className="mb-1.5 block text-sm font-medium text-ink/70">
              {t('documents.passportNumber')} <span className="text-red-500">*</span>
            </label>
            <input
              id="identity-passportNumber"
              ref={(el) => { inputRefs.current['passportNumber'] = el }}
              value={p.passportNumber ?? ''}
              onChange={(e) => {
                // 自动转大写、去空格（格式不符走提示，不硬拦）
                setProfile({ ...p, passportNumber: e.target.value.toUpperCase().replace(/\s+/g, '') })
                clearFieldState('passportNumber')
              }}
              onBlur={() => handleBlur('passportNumber')}
              required
              aria-required="true"
              aria-invalid={!!errors.passportNumber}
              aria-describedby={describedBy('passportNumber')}
              autoComplete="off"
              spellCheck={false}
              inputMode="text"
              className={inputCls(!!errors.passportNumber)}
            />
            {fieldErrorBlock('passportNumber')}
          </div>
          <div>
            <label htmlFor="identity-nationality" className="mb-1.5 block text-sm font-medium text-ink/70">
              {t('documents.nationality')} <span className="text-red-500">*</span>
            </label>
            <input
              id="identity-nationality"
              ref={(el) => { inputRefs.current['nationality'] = el }}
              value={p.nationality ?? ''}
              onChange={(e) => {
                setProfile({ ...p, nationality: e.target.value })
                clearFieldState('nationality')
              }}
              onBlur={() => handleBlur('nationality')}
              required
              aria-required="true"
              aria-invalid={!!errors.nationality}
              aria-describedby={describedBy('nationality')}
              placeholder={t('assistant.nationalityPlaceholder')}
              autoComplete="country-name"
              className={inputCls(!!errors.nationality)}
            />
            {fieldErrorBlock('nationality')}
          </div>
          <div>
            <label htmlFor="identity-occupation" className="mb-1.5 block text-sm font-medium text-ink/70">
              {t('documents.occupation')} <span className="text-red-500">*</span>
            </label>
            <select
              id="identity-occupation"
              ref={(el) => { inputRefs.current['occupation'] = el }}
              value={p.occupation ?? ''}
              onChange={(e) => {
                setProfile({ ...p, occupation: e.target.value as UserProfile['occupation'] })
                clearFieldState('occupation')
              }}
              onBlur={() => handleBlur('occupation')}
              required
              aria-required="true"
              aria-invalid={!!errors.occupation}
              aria-describedby={describedBy('occupation')}
              className={inputCls(!!errors.occupation)}
            >
              <option value="">{t('common.select')}</option>
              {OCCUPATIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {t(`documents.occupation${o.value.charAt(0).toUpperCase() + o.value.slice(1)}`)}
                </option>
              ))}
            </select>
            {fieldErrorBlock('occupation')}
          </div>
          <div>
            <label htmlFor="identity-passportIssuedIn" className="mb-1.5 block text-sm font-medium text-ink/70">
              {t('assistant.passportIssuedIn')}
            </label>
            <input
              id="identity-passportIssuedIn"
              value={p.passportIssuedIn ?? ''}
              onChange={(e) => setProfile({ ...p, passportIssuedIn: e.target.value })}
              className={inputCls(false)}
            />
          </div>
          <div>
            <label htmlFor="identity-homeProvince" className="mb-1.5 block text-sm font-medium text-ink/70">
              {t('assistant.homeProvince')} <span className="text-red-500">*</span>
            </label>
            <select
              id="identity-homeProvince"
              ref={(el) => { inputRefs.current['homeProvince'] = el }}
              value={p.homeProvince ?? ''}
              onChange={(e) => {
                setProfile({ ...p, homeProvince: e.target.value })
                clearFieldState('homeProvince')
              }}
              onBlur={() => handleBlur('homeProvince')}
              required
              aria-required="true"
              aria-invalid={!!errors.homeProvince}
              aria-describedby={describedBy('homeProvince')}
              className={inputCls(!!errors.homeProvince)}
            >
              <option value="">{t('common.select')}</option>
              {PROVINCES.map((pr) => (
                <option key={pr} value={pr}>{pr}</option>
              ))}
            </select>
            {fieldErrorBlock('homeProvince')}
          </div>
        </div>

        <div className="sticky bottom-0 -mx-6 -mb-6 mt-6 flex items-center justify-between gap-3 border-t border-ink/5 bg-white px-6 py-4">
          <div className="min-w-0">
            {submitted && blockingCount > 0 && (
              <p className="text-sm font-medium text-red-600" role="alert">
                {t('assistant.remainingSummary', { n: blockingCount })}
              </p>
            )}
          </div>
          <div className="flex shrink-0 gap-3">
            <VButton type="button" variant="secondary" size="lg" onClick={onBack}>
              {t('assistant.back')}
            </VButton>
            <VButton type="submit" size="lg">
              {t('assistant.next')}
            </VButton>
          </div>
        </div>
      </form>
    </div>
  )
}
