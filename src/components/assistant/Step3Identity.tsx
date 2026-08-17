// components/assistant/Step3Identity.tsx — 第三步：填写身份信息
// 校验：onBlur 首次校验 + 提交时全量校验；已报错字段输入时实时清除；不替用户编造默认值
// 溯源：自动填充字段标注「来自资料卡」/「已修改」，可单字段恢复或全部恢复
import { useRef, useState } from 'react'
import { useI18n } from '@/i18n'
import { VButton } from '@/components/common'
import { PROVINCES, OCCUPATIONS } from '@/data/countries'
import type { UserProfile } from '@/types'

interface Props {
  profile: Partial<UserProfile> | null
  setProfile: (p: Partial<UserProfile>) => void
  activeCard: UserProfile | null
  /** 资料卡自定义名称（如「我的资料」） */
  cardName: string
  /** 归一化后的资料卡值（自动填充来源，用于溯源标记） */
  cardProfile: Partial<UserProfile> | null
  /** 是否有资料卡（决定身份来源条 vs 手动填写提示） */
  hasCard: boolean
  /** 资料卡户籍归一化后仍不在标准列表 → 提示手动选择 */
  unrecognizedProvince?: boolean
  /** 资料卡职业识别值未知 → 提示手动选择 */
  unrecognizedOccupation?: boolean
  onBack: () => void
  onNext: (p: UserProfile) => void
  onManageCards: () => void
  onRescan: () => void
  onRestoreAll: () => void
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

/** 资料卡可自动填充的字段 */
const CARD_FIELDS: (keyof UserProfile)[] = [
  'name',
  'passportNumber',
  'nationality',
  'birthDate',
  'occupation',
  'homeProvince',
  'passportIssuedIn',
]

/** 中国普通护照：1-2 位字母 + 7-8 位数字 */
const PASSPORT_RE = /^[A-Z]{1,2}[0-9]{7,8}$/

export function Step3Identity({
  profile,
  setProfile,
  activeCard,
  cardName,
  cardProfile,
  hasCard,
  unrecognizedProvince,
  unrecognizedOccupation,
  onBack,
  onNext,
  onManageCards,
  onRescan,
  onRestoreAll,
}: Props) {
  const { t } = useI18n()
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

  // ===== 溯源标记（P0-4） =====
  function fieldFromCard(key: keyof UserProfile): boolean {
    return (
      !!cardProfile &&
      String(cardProfile[key] ?? '').trim() !== '' &&
      String(p[key] ?? '') === String(cardProfile[key] ?? '')
    )
  }

  function fieldModified(key: keyof UserProfile): boolean {
    return (
      !!cardProfile &&
      String(cardProfile[key] ?? '').trim() !== '' &&
      String(p[key] ?? '') !== String(cardProfile[key] ?? '')
    )
  }

  const autoFilledCount = CARD_FIELDS.filter(fieldFromCard).length
  const modifiedCount = CARD_FIELDS.filter(fieldModified).length

  function restoreField(key: keyof UserProfile) {
    if (!cardProfile) return
    setProfile({ ...p, [key]: cardProfile[key] })
    if (key === 'name' || key === 'passportNumber' || key === 'nationality' || key === 'occupation' || key === 'homeProvince') {
      clearFieldState(key)
    }
  }

  /** label 行：label + 必填星号 + 右侧溯源标记 */
  function labelRow(key: keyof UserProfile, labelText: string, required: boolean) {
    const fromCard = fieldFromCard(key)
    const modified = fieldModified(key)
    return (
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={`identity-${key}`} className="text-sm font-medium text-ink/70">
          {labelText} {required && <span className="text-red-500">*</span>}
        </label>
        {fromCard && (
          <span
            className="inline-flex shrink-0 items-center gap-1 text-[11px] text-ink/60"
            title={t('assistant.fromCardTooltip')}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-cyan" />
            {t('assistant.fromCard')}
          </span>
        )}
        {modified && (
          <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] text-amber-600">
            <span className="h-3.5 w-3.5 icon-[mdi-light--pencil]" />
            {t('assistant.modified')}
            <button
              type="button"
              onClick={() => restoreField(key)}
              className="font-medium text-primary transition-colors hover:text-[#0e4a80] hover:underline"
            >
              {t('assistant.restore')}
            </button>
          </span>
        )}
      </div>
    )
  }

  /** 校验提示块（含 aria 关联） */
  function fieldErrorBlock(key: FieldKey) {
    const err = errors[key]
    const hint =
      hints[key] ??
      (key === 'homeProvince' && unrecognizedProvince
        ? t('assistant.provinceUnrecognized')
        : key === 'occupation' && unrecognizedOccupation
          ? t('assistant.occupationUnrecognized')
          : '')
    if (!err && !hint) return null
    return (
      <p id={`identity-${key}-error`} className={`mt-1 text-[13px] ${err ? 'text-red-600' : 'text-amber-600'}`}>
        {err || hint}
      </p>
    )
  }

  function describedBy(key: FieldKey): string | undefined {
    const has =
      errors[key] ||
      hints[key] ||
      (key === 'homeProvince' && unrecognizedProvince) ||
      (key === 'occupation' && unrecognizedOccupation)
    return has ? `identity-${key}-error` : undefined
  }

  return (
    <div className="anim-card rounded-2xl bg-white p-6 shadow-card">
      <h2 className="mb-5 text-lg font-bold text-ink">{t('assistant.identityTitle')}</h2>

      {/* 身份来源条（P0-3）：只说明来源，不再罗列字段值（字段值由表单负责展示） */}
      {hasCard && activeCard ? (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-success/25 bg-success/5 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#39A2B8] to-[#1460A4] text-sm font-semibold text-white">
            {(activeCard.name || '?').slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-ink">
              {activeCard.name || t('assistant.unnamed')}
              {cardName && <span className="ml-1.5 font-normal text-ink/60">（{cardName}）</span>}
            </div>
            <div className="mt-0.5 text-xs text-ink/60">
              {t('assistant.autoFilledCount', { n: autoFilledCount })}
            </div>
          </div>
          {modifiedCount > 0 && cardProfile && (
            <VButton type="button" variant="ghost" size="sm" onClick={onRestoreAll}>
              <span className="h-4 w-4 icon-[mdi-light--refresh]" />
              {t('assistant.restoreAll')}
            </VButton>
          )}
          <VButton type="button" variant="secondary" size="sm" onClick={onRescan}>
            <span className="h-4 w-4 icon-[mdi-light--refresh]" />
            {t('assistant.rescan')}
          </VButton>
          <VButton type="button" variant="secondary" size="sm" onClick={onManageCards}>
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
          <VButton size="sm" onClick={onManageCards}>
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
            {labelRow('name', t('documents.name'), true)}
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
            {labelRow('passportNumber', t('documents.passportNumber'), true)}
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
            {labelRow('nationality', t('documents.nationality'), true)}
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
            {labelRow('occupation', t('documents.occupation'), true)}
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
            {labelRow('passportIssuedIn', t('assistant.passportIssuedIn'), false)}
            <input
              id="identity-passportIssuedIn"
              value={p.passportIssuedIn ?? ''}
              onChange={(e) => setProfile({ ...p, passportIssuedIn: e.target.value })}
              className={inputCls(false)}
            />
          </div>
          <div>
            {labelRow('homeProvince', t('assistant.homeProvince'), true)}
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
