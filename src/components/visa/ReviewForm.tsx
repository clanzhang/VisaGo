// components/visa/ReviewForm.tsx — 第三步：核对自动提取的信息
// P0：字段类型化控件（enum/date/money/phone）+ 格式校验（护照号/身份证号/日期/月薪）
// + occupation 不可映射提示 + 每字段来源标注
import { VButton } from '@/components/common'
import { FIELD_SPECS, type FieldSpec } from '@/data/field-specs'
import { useI18n } from '@/i18n'

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

interface Props {
  profile: Record<string, string>
  /** 进入核对时的聚合快照（P1-10 脏状态基准；P0 用于判断是否被编辑过） */
  baseline: Record<string, string>
  /** 每字段来源文件（key → 文件名） */
  source: Record<string, string>
  /** occupation 无法映射到枚举时的建议值（更像职位） */
  occupationSuggestion: string | null
  missingFields: FieldSpec[]
  onSave: () => void
  onBack: () => void
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

export function ReviewForm({ profile, baseline, source, occupationSuggestion, missingFields, onSave, onBack, onFieldChange }: Props) {
  const { t, pickL } = useI18n()
  const label = (f: FieldSpec) => pickL({ zh: f.label, en: FIELD_LABEL_EN[f.key] ?? f.label })

  /** 单字段校验：返回提示文案 + 类型（error=红 / warn=琥珀） */
  function fieldNote(f: FieldSpec): { text: string; kind: 'error' | 'warn' } | null {
    const value = (profile[f.key] ?? '').trim()
    if (f.required && !value) {
      return { text: t('scan.missingLabel'), kind: 'warn' }
    }
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

  /** 控件（按 FieldSpec.type 渲染；P0-1：occupation 为受限选择） */
  function renderControl(f: FieldSpec, note: { text: string; kind: 'error' | 'warn' } | null) {
    const id = `review-${f.key}`
    const cls = `w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 ${
      note ? (note.kind === 'error' ? 'border-red-400' : 'border-amber-300') : 'border-ink/10'
    }`
    if (f.type === 'enum') {
      return (
        <div className="relative">
          <select
            id={id}
            value={profile[f.key] ?? ''}
            onChange={(e) => onFieldChange(f.key, e.target.value)}
            aria-invalid={note ? true : undefined}
            aria-describedby={note ? `${id}-note` : undefined}
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
          onChange={(e) => onFieldChange(f.key, e.target.value)}
          aria-invalid={note ? true : undefined}
          aria-describedby={note ? `${id}-note` : undefined}
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
            onChange={(e) => onFieldChange(f.key, e.target.value.replace(/[^\d]/g, ''))}
            onBlur={() => {
              // 千分位展示：把纯数字写回（存值仍为数字串，供 prompt/在职证明使用）
              const n = Number(digits)
              if (Number.isFinite(n) && n > 0) onFieldChange(f.key, String(n))
            }}
            aria-invalid={note ? true : undefined}
            aria-describedby={note ? `${id}-note` : undefined}
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
        onChange={(e) => onFieldChange(f.key, e.target.value)}
        inputMode={f.type === 'phone' ? 'tel' : undefined}
        autoComplete="off"
        aria-invalid={note ? true : undefined}
        aria-describedby={note ? `${id}-note` : undefined}
        className={cls}
      />
    )
  }

  const missingKeys = new Set(missingFields.map((f) => f.key))

  return (
    <div className="rounded-2xl bg-white p-6 shadow-card">
      {/* 标题栏（P1-11 重构为稳定实现） */}
      <div className="mb-4 flex items-center justify-between border-b border-ink/5 pb-4">
        <h2 className="text-lg font-bold text-ink">{t('scan.reviewTitle')}</h2>
      </div>

      {/* P0-1：occupation 不可映射提示 */}
      {occupationSuggestion && !(profile['occupation'] ?? '').trim() && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700" role="status">
          {t('scan.occupationSuggestion', { value: occupationSuggestion })}
        </div>
      )}

      {/* 缺失提示（P1-8：精简重复 + 可点击定位） */}
      {missingFields.length > 0 && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="text-sm font-semibold text-amber-700">
            {t('scan.missingInfo', { count: missingFields.length })}
          </div>
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

      <div className="grid gap-4 sm:grid-cols-2">
        {FIELD_SPECS.map((f) => {
          const note = fieldNote(f)
          const srcFile = source[f.key]
          const isMissing = missingKeys.has(f.key)
          const edited = (profile[f.key] ?? '') !== (baseline[f.key] ?? '')
          // P0：状态底色只做轻提示 —— 未填=琥珀、格式问题=红、其余中性；P1-5 再升级完整语义
          const cardCls = note
            ? note.kind === 'error'
              ? 'border-red-200 bg-red-50/40'
              : 'border-amber-200 bg-amber-50/40'
            : 'border-ink/5 bg-white'
          return (
            <div key={f.key} className={`rounded-xl border p-4 ${cardCls}`}>
              <div className="mb-1.5 flex items-center gap-2">
                <label htmlFor={`review-${f.key}`} className="text-sm font-medium text-ink">
                  {label(f)} {f.required && <span className="text-red-500">*</span>}
                </label>
                {edited && !note && (
                  <span className="ml-auto rounded-full bg-cyan/10 px-2 py-0.5 text-[11px] font-medium text-cyan">
                    {t('assistant.modified')}
                  </span>
                )}
              </div>
              {renderControl(f, note)}
              {/* P0-3：校验提示（含来源比对指向） */}
              {note && (
                <p id={`review-${f.key}-note`} className={`mt-1 text-[13px] ${note.kind === 'error' ? 'text-red-600' : 'text-amber-700'}`}>
                  {note.text}
                  {srcFile ? ` · ${t('scan.sourceFrom', { file: srcFile })}` : ''}
                </p>
              )}
              {/* 来源标注（P1-7 完整交互；P0 先展示来源文件） */}
              {!note && srcFile && (
                <p className="mt-1 text-[11px] text-ink/60">{t('scan.sourceFrom', { file: srcFile })}</p>
              )}
              {!note && !srcFile && f.required && isMissing && (
                <p className="mt-1 text-[11px] text-ink/60">{t('scan.missingLabel')}</p>
              )}
              {/* P0-2：月薪千分位预览 */}
              {f.type === 'money' && (profile[f.key] ?? '').replace(/[^\d]/g, '') && !note && (
                <p className="mt-1 text-[11px] text-ink/60">
                  {t('scan.salaryPreview', { value: formatNum(Number((profile[f.key] ?? '').replace(/[^\d]/g, ''))) })}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* 主次按钮：保存为主行动（P1-9 权重；P1-10 补状态反馈） */}
      <div className="mt-6 flex justify-end gap-3 border-t border-ink/5 pt-4">
        <VButton variant="secondary" size="lg" onClick={onBack}>
          {t('scan.backToList')}
        </VButton>
        <VButton size="lg" onClick={onSave}>
          💾 {t('common.save')}
        </VButton>
      </div>
    </div>
  )
}
