// components/visa/ReviewForm.tsx — 第三步：核对自动提取的信息
// 缺失提示 + 可编辑字段表单 + 保存/返回
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
  occupation: 'Occupation',
  company: 'Company',
  position: 'Position',
  salary: 'Monthly salary',
}

interface Props {
  profile: Record<string, string>
  missingFields: FieldSpec[]
  onSave: () => void
  onBack: () => void
  onFieldChange: (key: string, value: string) => void
}

export function ReviewForm({ profile, missingFields, onSave, onBack, onFieldChange }: Props) {
  const { t, pickL } = useI18n()
  return (
    <div className="rounded-2xl bg-white p-6 shadow-card">
      {/* 标题栏：sticky 顶部，保存/返回始终可见 */}
      <div className="sticky -top-6 -mx-6 z-10 mb-4 flex items-center justify-between border-b border-ink/5 bg-white px-6 py-4">
        <h2 className="text-lg font-bold text-ink">{t('scan.reviewTitle')}</h2>
        <div className="flex gap-2">
          <VButton variant="secondary" size="sm" onClick={onSave}>
            💾 {t('common.save')}
          </VButton>
          <VButton size="sm" onClick={onBack}>
            {t('scan.backToList')}
          </VButton>
        </div>
      </div>

      {/* 缺失提示 */}
      {missingFields.length > 0 && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="text-sm font-semibold text-amber-700">
            {t('scan.missingInfo', { count: missingFields.length })}
          </div>
          <div className="mt-1 flex flex-wrap gap-2">
            {missingFields.map((f) => (
              <span key={f.key} className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-amber-700">
                {pickL({ zh: f.label, en: FIELD_LABEL_EN[f.key] ?? f.label })}{t('scan.missingSuffix')}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-amber-700">
            {t('scan.missingHint')}
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {FIELD_SPECS.map((f) => {
          const filled = !!profile[f.key]
          return (
            <div key={f.key} className={`rounded-xl border p-4 ${filled ? 'border-success/30 bg-success/5' : 'border-red-200 bg-red-50/50'}`}>
              <div className="mb-1.5 flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${filled ? 'bg-success' : 'bg-red-400'}`} />
                <label className="text-sm font-medium text-ink">
                  {pickL({ zh: f.label, en: FIELD_LABEL_EN[f.key] ?? f.label })} {f.required && <span className="text-red-500">*</span>}
                </label>
                {!filled && (
                  <span className="ml-auto text-[11px] text-red-600">{t('scan.missingLabel')}</span>
                )}
              </div>
              <input
                value={profile[f.key] ?? ''}
                onChange={(e) => onFieldChange(f.key, e.target.value)}
                placeholder={filled ? (f.required ? t('scan.required') : t('scan.optional')) : t('scan.missingPlaceholder')}
                className="w-full rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary/40"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
