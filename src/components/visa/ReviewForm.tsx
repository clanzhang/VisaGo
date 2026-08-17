// components/visa/ReviewForm.tsx — 第三步：核对自动提取的信息
// P0：字段类型化控件 + 格式校验 + occupation 提示 + 来源标注
// P1：状态语义（待确认中性/已确认成功/缺失警示/错误）、高风险字段逐项确认、
//     来源可点击回看、脏状态与离开提醒、语义分组、稳定的操作栏
import { useState } from 'react'
import { VButton, VModal } from '@/components/common'
import { FIELD_SPECS, type FieldSpec } from '@/data/field-specs'
import { useI18n } from '@/i18n'
import type { ScannedFileItem } from './ScannedFileList'

const FIELD_LABEL_EN: Record<string, string> = {
  name: 'Full name',
  passport_number: 'Passport No.',
  id_number: 'ID No.',
  nationality: 'Nationality',
  birth_date: 'Date of birth',
  gender: 'Gender',
  phone: 'Phone',
  address: 'Home address',
  home_province: 'Province',
  passport_issued_in: 'Issued in',
  occupation: 'Employment status',
  company: 'Company',
  position: 'Position',
  salary: 'Monthly salary',
}

/** 高风险字段：需要用户逐项确认（其余字段编辑即视为已确认） */
const HIGH_RISK_KEYS = ['name', 'passport_number', 'id_number', 'birth_date', 'salary']

interface Props {
  profile: Record<string, string>
  /** 进入核对时的聚合快照（脏状态基准） */
  baseline: Record<string, string>
  /** 每字段来源文件（key → 文件名） */
  source: Record<string, string>
  /** occupation 无法映射到枚举时的建议值（更像职位） */
  occupationSuggestion: string | null
  missingFields: FieldSpec[]
  /** 已扫描文件（查看原始识别用） */
  items: ScannedFileItem[]
  onSave: () => Promise<boolean>
  onBack: () => void
  /** 保存成功后进入下一步（P2-14：核对 → 生成） */
  onContinue: () => void
  onFieldChange: (key: string, value: string) => void
}

/** 归一化日期为 YYYY-MM-DD；无法解析返回 null（P0-3） */
function normalizeDate(raw: string): string | null {
  const s = (raw ?? '').trim()
  const m = s.match(/^(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})日?$/)
  if (!m) return null
  const y = +m[1]
  const mo = +m[2]
  const d = +m[3]
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
  const dt = new Date(y, mo - 1, d)
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/** 身份证号校验（18 位含校验位 GB11643，或 15 位）（P0-3） */
function isValidId(raw: string): boolean {
  const v = (raw ?? '').trim()
  if (/^\d{15}$/.test(v)) return true
  if (!/^\d{17}[\dXx]$/.test(v)) return false
  const W = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
  const C = '10X98765432'
  let sum = 0
  for (let i = 0; i < 17; i++) sum += +v[i] * W[i]
  return C[sum % 11] === v[17].toUpperCase()
}

function formatNum(n: number): string {
  return n.toLocaleString('zh-CN')
}

export function ReviewForm({ profile, baseline, source, occupationSuggestion, missingFields, items, onSave, onBack, onContinue, onFieldChange }: Props) {
  const { t, pickL } = useI18n()
  // P1-6：已确认的高风险字段
  const [confirmedKeys, setConfirmedKeys] = useState<Set<string>>(() => new Set())
  // P1-10：保存状态与脏状态
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [dirtyConfirmOpen, setDirtyConfirmOpen] = useState(false)
  // P1-12：职业细节（company/position/salary）折叠
  const [occupationDetailsOpen, setOccupationDetailsOpen] = useState(false)
  // P1-7：查看原始识别的文件
  const [sourceItem, setSourceItem] = useState<ScannedFileItem | null>(null)

  const label = (f: FieldSpec) => pickL({ zh: f.label, en: FIELD_LABEL_EN[f.key] ?? f.label })

  /** 单字段校验：返回提示文案 + 类型（error=红 / warn=琥珀） */
  function fieldNote(f: FieldSpec): { text: string; kind: 'error' | 'warn' } | null {
    const value = (profile[f.key] ?? '').trim()
    if (f.required && !value) return { text: t('scan.missingLabel'), kind: 'warn' }
    if (!value) return null
    switch (f.key) {
      case 'passport_number':
        if (!/^[A-Z]{1,2}\d{7,8}$/.test(value.toUpperCase())) return { text: t('scan.warnPassport'), kind: 'error' }
        break
      case 'id_number':
        if (!isValidId(value)) return { text: t('scan.warnId'), kind: 'error' }
        break
      case 'birth_date':
        if (!normalizeDate(value)) return { text: t('scan.warnDate', { value }), kind: 'error' }
        break
      case 'salary': {
        const n = Number(value.replace(/[^\d]/g, ''))
        if (!Number.isFinite(n) || n <= 0) return { text: t('scan.warnSalaryInvalid'), kind: 'warn' }
        if (n > 500000) return { text: t('scan.warnSalaryRange', { value: formatNum(n) }), kind: 'warn' }
        break
      }
    }
    return null
  }

  // P1-5：状态模型
  function fieldState(f: FieldSpec): 'invalid' | 'missing' | 'confirmed' | 'pending' {
    const value = (profile[f.key] ?? '').trim()
    const note = fieldNote(f)
    if (note?.kind === 'error') return 'invalid'
    if (f.required && !value) return 'missing'
    const edited = value !== (baseline[f.key] ?? '')
    if (confirmedKeys.has(f.key) || edited) return 'confirmed'
    if (value) return 'pending'
    return 'missing'
  }

  const editedAny = FIELD_SPECS.some((f) => (profile[f.key] ?? '') !== (baseline[f.key] ?? ''))
  const dirty = editedAny
  const confirmedCount = HIGH_RISK_KEYS.filter((k) => confirmedKeys.has(k) || (profile[k] ?? '') !== (baseline[k] ?? '')).length

  async function handleSave() {
    if (saving) return
    setSaving(true)
    try {
      const ok = await onSave()
      if (ok) {
        setSaved(true)
        // P2-14：保存成功 → 进入生成材料步骤
        onContinue()
      }
    } finally {
      setSaving(false)
    }
  }

  function handleBack() {
    if (dirty) {
      setDirtyConfirmOpen(true)
      return
    }
    onBack()
  }

  function handleFieldChange(key: string, value: string) {
    if (saved) setSaved(false)
    onFieldChange(key, value)
  }

  /** 控件（按 FieldSpec.type 渲染；P0-1：occupation 为受限选择） */
  function renderControl(f: FieldSpec, state: ReturnType<typeof fieldState>) {
    const id = `review-${f.key}`
    const cls = `w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 ${
      state === 'invalid' ? 'border-red-400' : state === 'missing' ? 'border-amber-300' : 'border-ink/10'
    }`
    if (f.type === 'enum') {
      return (
        <div className="relative">
          <select
            id={id}
            value={profile[f.key] ?? ''}
            onChange={(e) => handleFieldChange(f.key, e.target.value)}
            aria-invalid={state === 'invalid' ? true : undefined}
            aria-describedby={state === 'invalid' || state === 'missing' ? `${id}-note` : undefined}
            className={`${cls} appearance-none pr-9`}
          >
            <option value="">{t('common.select')}</option>
            {(f.options ?? []).map((o) => (
              <option key={o.value} value={o.value}>{t(o.labelKey)}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/60 icon-[mdi-light--chevron-down]" aria-hidden="true" />
        </div>
      )
    }
    if (f.type === 'date') {
      const iso = normalizeDate(profile[f.key] ?? '')
      return (
        <input
          id={id}
          type="date"
          value={iso ?? ''}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => handleFieldChange(f.key, e.target.value)}
          aria-invalid={state === 'invalid' ? true : undefined}
          aria-describedby={state === 'invalid' || state === 'missing' ? `${id}-note` : undefined}
          className={cls}
        />
      )
    }
    if (f.type === 'money') {
      const digits = (profile[f.key] ?? '').replace(/[^\d]/g, '')
      return (
        <div className="relative">
          <input
            id={id}
            inputMode="numeric"
            value={digits}
            onChange={(e) => handleFieldChange(f.key, e.target.value.replace(/[^\d]/g, ''))}
            onBlur={() => {
              const n = Number(digits)
              if (Number.isFinite(n) && n > 0) handleFieldChange(f.key, String(n))
            }}
            aria-invalid={state === 'invalid' ? true : undefined}
            aria-describedby={state === 'invalid' || state === 'missing' ? `${id}-note` : undefined}
            className={`${cls} pr-14`}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink/60">{t('scan.salaryUnit')}</span>
        </div>
      )
    }
    return (
      <input
        id={id}
        type="text"
        value={profile[f.key] ?? ''}
        onChange={(e) => handleFieldChange(f.key, e.target.value)}
        inputMode={f.type === 'phone' ? 'tel' : undefined}
        autoComplete="off"
        aria-invalid={state === 'invalid' ? true : undefined}
        aria-describedby={state === 'invalid' || state === 'missing' ? `${id}-note` : undefined}
        className={cls}
      />
    )
  }

  /** 来源行：真实来源文件（可点击查看原始识别）或静态来源提示 */
  function sourceLine(f: FieldSpec) {
    const srcFile = source[f.key]
    if (srcFile) {
      const item = items.find((x) => x.name === srcFile)
      return (
        <span className="inline-flex items-center gap-1">
          {t('scan.sourceFrom', { file: srcFile })}
          {item && (
            <button
              type="button"
              onClick={() => setSourceItem(item)}
              className="ml-1 inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary/5 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              {t('scan.viewSource')}
            </button>
          )}
        </span>
      )
    }
    if (f.sourceHint) return <span>{t(f.sourceHint)}</span>
    return null
  }

  function renderField(f: FieldSpec) {
    const state = fieldState(f)
    const note = fieldNote(f)
    const id = `review-${f.key}`
    const stateCls =
      state === 'invalid'
        ? 'border-red-200 bg-red-50/40'
        : state === 'missing'
          ? 'border-amber-200 bg-amber-50/40'
          : state === 'confirmed'
            ? 'border-success/25 bg-success/5'
            : 'border-ink/5 bg-white'
    const stateIcon =
      state === 'invalid' ? 'alert-circle text-red-500'
        : state === 'missing' ? 'alert text-amber-600'
          : state === 'confirmed' ? 'check text-success'
            : 'information text-cyan'
    const isHighRisk = HIGH_RISK_KEYS.includes(f.key)
    const confirmed = state === 'confirmed'

    return (
      <div key={f.key} className={`rounded-xl border p-4 ${stateCls}`}>
        <div className="mb-1.5 flex min-w-0 items-center gap-2">
          <span
            className={`h-4 w-4 shrink-0 ${stateIcon}`}
            aria-label={
              state === 'invalid'
                ? t('scan.warnInvalid')
                : state === 'missing'
                  ? t('scan.pendingReview')
                  : state === 'confirmed'
                    ? t('scan.savedOk')
                    : t('scan.pendingReview')
            }
          />
          <label htmlFor={id} className="min-w-0 text-sm font-medium text-ink">
            {label(f)} {f.required && <span className="text-red-500">*</span>}
          </label>
          <span className="ml-auto" />
          {/* P1-6：高风险字段待确认 → 轻量确认按钮；已确认 → 状态文字 */}
          {isHighRisk && (profile[f.key] ?? '').trim() !== '' && !confirmed && (
            <button
              type="button"
              onClick={() => setConfirmedKeys((prev) => new Set(prev).add(f.key))}
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-ink/10 bg-white px-2 py-0.5 text-[11px] font-medium text-ink/70 transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <span className="h-3 w-3 icon-[mdi-light--check]" aria-hidden="true" />
              {t('scan.confirmField')}
            </button>
          )}
          {isHighRisk && confirmed && (
            <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-success">
              <span className="h-3.5 w-3.5 icon-[mdi-light--check-circle]" aria-hidden="true" />
              {t('scan.reviewConfirmed', { n: confirmedCount, m: HIGH_RISK_KEYS.length })}
            </span>
          )}
        </div>
        {renderControl(f, state)}
        {f.key === 'occupation' && (
          <p className="mt-1 text-[11px] text-ink/60">{t('scan.occupationHint')}</p>
        )}
        {f.key === 'position' && (
          <p className="mt-1 text-[11px] text-ink/60">{t('scan.positionHint')}</p>
        )}
        {note && (
          <p id={`${id}-note`} className={`mt-1 break-words text-[13px] leading-relaxed ${note.kind === 'error' ? 'text-red-600' : 'text-amber-700'}`}>
            {note.text}
            {source[f.key] ? ` · ${t('scan.sourceFrom', { file: source[f.key] })}` : ''}
          </p>
        )}
        {!note && (
          <p className="mt-1 text-[11px] text-ink/60">{sourceLine(f)}</p>
        )}
        {f.type === 'money' && (profile[f.key] ?? '').replace(/[^\d]/g, '') && !note && (
          <p className="mt-1 text-[11px] text-ink/60">
            {t('scan.salaryPreview', { value: formatNum(Number((profile[f.key] ?? '').replace(/[^\d]/g, ''))) })}
          </p>
        )}
      </div>
    )
  }

  const identityFields = FIELD_SPECS.filter((f) => f.group === 'identity')
  const contactFields = FIELD_SPECS.filter((f) => f.group === 'contact')
  const occupationFields = FIELD_SPECS.filter((f) => f.group === 'occupation')
  const occupationDetails = occupationFields.filter((f) => f.key !== 'occupation')
  const detailsFilled = occupationDetails.some((f) => (profile[f.key] ?? '').trim() !== '')

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl bg-white p-6 shadow-card">
        {/* 稳定标题行（P1-11：不再用负边距 sticky hack） */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-ink/5 pb-4">
          <h2 className="text-lg font-bold text-ink">{t('scan.reviewTitle')}</h2>
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-full bg-primary/5 px-2.5 py-1 font-medium text-primary">
              {t('scan.reviewConfirmed', { n: confirmedCount, m: HIGH_RISK_KEYS.length })}
            </span>
            {dirty && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                {t('scan.dirty')}
              </span>
            )}
            {saved && (
              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 font-medium text-success">
                <span className="h-3.5 w-3.5 icon-[mdi-light--check-circle]" aria-hidden="true" />
                {t('scan.savedOk')}
              </span>
            )}
          </div>
        </div>

        {/* P0-1：occupation 不可映射提示 */}
        {occupationSuggestion && !(profile['occupation'] ?? '').trim() && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700" role="status">
            {t('scan.occupationSuggestion', { value: occupationSuggestion })}
          </div>
        )}

        {/* 缺失提示（P1-8：可点击定位，去掉重复后缀） */}
        {missingFields.length > 0 && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="text-sm font-semibold text-amber-700">{t('scan.missingInfo', { count: missingFields.length })}</div>
            <div className="mt-1 flex flex-wrap gap-2">
              {missingFields.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => {
                    document.getElementById(`review-${f.key}`)?.focus()
                    document.getElementById(`review-${f.key}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }}
                  className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                >
                  {label(f)}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-amber-700">{t('scan.missingHint')}</p>
          </div>
        )}

        {/* P1-12：语义分组（fieldset/legend）—— 身份证件置顶 */}
        <fieldset className="mb-6 border-0 p-0">
          <legend className="mb-3 px-0 text-sm font-semibold text-ink">{t('scan.groupIdentity')}</legend>
          <div className="grid gap-4 sm:grid-cols-2">{identityFields.map(renderField)}</div>
        </fieldset>
        <fieldset className="mb-6 border-0 p-0">
          <legend className="mb-3 px-0 text-sm font-semibold text-ink">{t('scan.groupContact')}</legend>
          <div className="grid gap-4 sm:grid-cols-2">{contactFields.map(renderField)}</div>
        </fieldset>
        <fieldset className="border-0 p-0">
          <legend className="mb-3 px-0 text-sm font-semibold text-ink">{t('scan.groupOccupation')}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {renderField(occupationFields.find((f) => f.key === 'occupation')!)}
          </div>
          {/* 非必填职业细节：可折叠，默认按是否已填展开 */}
          {occupationDetails.length > 0 && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setOccupationDetailsOpen((v) => !v)}
                aria-expanded={occupationDetailsOpen || detailsFilled}
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <span className={`h-3.5 w-3.5 transition-transform ${occupationDetailsOpen || detailsFilled ? '' : 'rotate-180'} icon-[mdi-light--chevron-down]`} aria-hidden="true" />
                {t('scan.occupationDetails')}
              </button>
              {(occupationDetailsOpen || detailsFilled) && (
                <div className="mt-3 grid gap-4 sm:grid-cols-2">{occupationDetails.map(renderField)}</div>
              )}
            </div>
          )}
        </fieldset>
      </div>

      {/* 页面级 sticky 操作栏（P1-11 稳定实现；主行动=保存并继续） */}
      <div className="sticky bottom-0 -mx-4 rounded-t-2xl border border-ink/5 border-b-0 bg-white px-4 py-3 shadow-[0_-4px_16px_rgba(16,24,40,0.08)] sm:-mx-8 sm:px-8">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3">
          <span className="text-xs text-ink/60">
            {dirty ? (
              <span className="inline-flex items-center gap-1 text-amber-700">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                {t('scan.dirty')}
              </span>
            ) : saved ? (
              <span className="inline-flex items-center gap-1 text-success">
                <span className="h-3.5 w-3.5 icon-[mdi-light--check-circle]" aria-hidden="true" />
                {t('scan.savedOk')}
              </span>
            ) : (
              t('scan.reviewConfirmed', { n: confirmedCount, m: HIGH_RISK_KEYS.length })
            )}
          </span>
          <div className="flex shrink-0 gap-3">
            <VButton type="button" variant="secondary" size="lg" onClick={handleBack}>
              {t('scan.backToList')}
            </VButton>
            <VButton type="button" size="lg" onClick={handleSave} disabled={saving}>
              {saving ? t('scan.saving') : `💾 ${t('scan.saveAndContinue')}`}
            </VButton>
          </div>
        </div>
      </div>

      {/* P1-10：未保存修改离开提醒 */}
      <VModal
        open={dirtyConfirmOpen}
        onClose={() => setDirtyConfirmOpen(false)}
        title={t('scan.leaveDirtyTitle')}
        footer={
          <>
            <VButton variant="secondary" onClick={() => setDirtyConfirmOpen(false)}>
              {t('scan.keepEditing')}
            </VButton>
            <VButton
              onClick={() => {
                setDirtyConfirmOpen(false)
                onBack()
              }}
            >
              {t('scan.leave')}
            </VButton>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink/70">{t('scan.leaveDirtyDesc')}</p>
      </VModal>

      {/* P1-7：查看原始识别（来源文件的提取结果） */}
      <VModal
        open={!!sourceItem}
        onClose={() => setSourceItem(null)}
        title={sourceItem?.name ?? ''}
        width="max-w-xl"
      >
        {sourceItem && (
          <div className="space-y-2">
            {(Object.entries(sourceItem.fields ?? {}) as [string, unknown][])
              .filter(([, v]) => v !== null && v !== undefined && typeof v !== 'object' && String(v).trim() !== '')
              .map(([k, v]) => {
                const f = FIELD_SPECS.find((x) => x.key === k)
                return (
                  <div key={k} className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="shrink-0 text-ink/60">{f ? label(f) : k}</span>
                    <span className="min-w-0 truncate font-medium text-ink" title={String(v)}>{String(v)}</span>
                  </div>
                )
              })}
            {sourceItem.summary && (
              <p className="mt-3 border-t border-ink/5 pt-3 text-xs text-ink/60">
                <span className="font-medium">{t('scan.fieldSummary')}:</span> {sourceItem.summary}
              </p>
            )}
          </div>
        )}
      </VModal>
    </div>
  )
}
