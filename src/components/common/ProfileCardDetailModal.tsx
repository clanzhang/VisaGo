// components/common/ProfileCardDetailModal.tsx — 资料卡详情弹窗（双栏：已填/未填）
// 点击资料卡时展示已填写字段与缺失字段明细，缺失字段带补充提示
import { useId } from 'react'
import { VButton } from './VButton'
import { useI18n } from '@/i18n'
import { useModalA11y } from '@/hooks/useModalA11y'
import type { ProfileCard } from '@/api/tauri'

interface Props {
  /** 当前查看的资料卡；null 时弹窗关闭 */
  card: ProfileCard | null
  /** 关闭弹窗 */
  onClose: () => void
  /** 去补充：父组件切换活跃卡并跳到扫描第一步 */
  onSupplement?: () => void
}

// 材料字段规范（与 Scan 页 FIELD_SPECS 一致的字段顺序/标签/必填标记）
export const CARD_FIELD_SPECS = [
  { key: 'name', label: '姓名', required: true },
  { key: 'passport_number', label: '护照号', required: true },
  { key: 'id_number', label: '身份证号', required: true },
  { key: 'nationality', label: '国籍', required: true },
  { key: 'birth_date', label: '出生日期', required: true },
  { key: 'gender', label: '性别', required: false },
  { key: 'phone', label: '手机号', required: false },
  { key: 'address', label: '家庭住址', required: false },
  { key: 'home_province', label: '户籍省份', required: true },
  { key: 'passport_issued_in', label: '护照签发地', required: false },
  { key: 'occupation', label: '职业', required: true },
  { key: 'company', label: '工作单位', required: false },
  { key: 'position', label: '职位', required: false },
  { key: 'salary', label: '月薪', required: false },
]

// 字段英文标签（UI 显示用；字段值本身是用户数据）
export const CARD_FIELD_LABEL_EN: Record<string, string> = {
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

// 未填字段 → 补充提示（i18n key）
const FIX_HINT_KEYS: Record<string, string> = {
  passport_number: 'scan.materialHint_passport',
  home_province: 'scan.materialHint_family',
  position: 'scan.materialHint_employment',
  company: 'scan.materialHint_employment',
  salary: 'scan.materialHint_employment',
  phone: 'profile.supplementHint',
  name: 'scan.materialHint_id',
  id_number: 'scan.materialHint_id',
  nationality: 'scan.materialHint_passport',
  birth_date: 'scan.materialHint_id',
  gender: 'scan.materialHint_id',
  address: 'profile.supplementHint',
  passport_issued_in: 'scan.materialHint_passport',
  occupation: 'profile.supplementHint',
}

export function ProfileCardDetailModal({ card, onClose, onSupplement }: Props) {
  const { t, isZh } = useI18n()
  const titleId = useId()
  const dialogRef = useModalA11y(!!card, onClose, titleId)

  if (!card) return null

  const fields = (card.fields ?? {}) as Record<string, unknown>
  const has = (key: string) => String(fields[key] ?? '').trim()
  const filled = CARD_FIELD_SPECS.filter((f) => has(f.key))
  const missing = CARD_FIELD_SPECS.filter((f) => !has(f.key))
  const progress = Math.round((filled.length / CARD_FIELD_SPECS.length) * 100)
  const name = has('name') || card.name || t('profile.unnamed')
  const passport = has('passport_number') || has('passportNumber')
  const phone = has('phone') || t('profile.pending')
  const nationality = has('nationality') || t('profile.pending')
  const updated = card.updated_at ? new Date(card.updated_at).toLocaleString().slice(0, 16) : t('profile.noUpdatedAt')
  const fieldLabel = (f: { key: string; label: string }) => (isZh ? f.label : CARD_FIELD_LABEL_EN[f.key] ?? f.label)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/55 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[86vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-float animate-[fadeInUp_0.25s_ease]"
      >
        <div className="relative h-40 shrink-0 bg-[linear-gradient(135deg,#1460A4_0%,#39A2B8_48%,#D8F4F7_100%)]">
          <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_20%_20%,rgba(255,255,255,.7)_0,transparent_28%),radial-gradient(circle_at_85%_10%,rgba(255,255,255,.45)_0,transparent_24%)]" />
          <button
            onClick={onClose}
            className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-ink/60 shadow-sm transition-colors hover:text-ink"
            aria-label={t('common.close')}
          >
            <span className="h-5 w-5 icon-[mdi-light--fullscreen-close]" />
          </button>
        </div>

        <div className="relative -mt-12 px-6 pb-5">
          <div className="flex flex-col gap-4 rounded-2xl border border-ink/6 bg-white p-4 shadow-card md:flex-row md:items-end md:justify-between">
            <div className="flex min-w-0 gap-4">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-white bg-[#E9F8FA] text-3xl font-bold text-primary shadow-card">
                {name.slice(0, 1)}
              </div>
              <div className="min-w-0 pt-8">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 id={titleId} className="truncate text-2xl font-bold leading-tight text-ink">{name}</h3>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    {t('profile.completionPercent', { progress })}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink/60">
                  <span>{t('profile.cardId', { id: card.id })}</span>
                  <span>{t('profile.updatedAt', { time: updated })}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center md:w-80">
              <div className="rounded-xl bg-[#F5F7FA] px-3 py-2">
                <div className="text-lg font-bold text-ink">{filled.length}</div>
                <div className="text-[11px] text-ink/60">{t('profile.filled')}</div>
              </div>
              <div className="rounded-xl bg-[#F5F7FA] px-3 py-2">
                <div className="text-lg font-bold text-ink">{missing.length}</div>
                <div className="text-[11px] text-ink/60">{t('profile.toSupplement')}</div>
              </div>
              <div className="rounded-xl bg-[#F5F7FA] px-3 py-2">
                <div className="text-lg font-bold text-ink">{CARD_FIELD_SPECS.length}</div>
                <div className="text-[11px] text-ink/60">{t('profile.totalFields')}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto px-6 pb-6">
          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-ink/6 bg-white p-4 shadow-sm">
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <span className="h-5 w-5 icon-[mdi-light--credit-card-scan]" />
                  </div>
                  <div className="text-xs text-ink/60">{t('profile.passportNo')}</div>
                  <div className="mt-1 truncate text-sm font-semibold text-ink">{passport || t('profile.pending')}</div>
                </div>
                <div className="rounded-2xl border border-ink/6 bg-white p-4 shadow-sm">
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <span className="h-5 w-5 icon-[mdi-light--account]" />
                  </div>
                  <div className="text-xs text-ink/60">{t('profile.nationality')}</div>
                  <div className="mt-1 truncate text-sm font-semibold text-ink">{nationality}</div>
                </div>
                <div className="rounded-2xl border border-ink/6 bg-white p-4 shadow-sm">
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <span className="h-5 w-5 icon-[mdi-light--phone]" />
                  </div>
                  <div className="text-xs text-ink/60">{t('profile.phone')}</div>
                  <div className="mt-1 truncate text-sm font-semibold text-ink">{phone}</div>
                </div>
              </div>

              <div className="rounded-2xl border border-ink/6 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-ink">{t('profile.filledInfo')}</div>
                    <div className="text-xs text-ink/60">{t('profile.filledInfoDesc')}</div>
                  </div>
                  <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                    {t('profile.items', { count: filled.length })}
                  </span>
                </div>
                {filled.length > 0 ? (
                  <div className="grid gap-2 md:grid-cols-2">
                    {filled.map((f) => (
                      <div key={f.key} className="flex min-w-0 items-start gap-2 rounded-xl bg-[#F8FAFC] px-3 py-2.5">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                          <span className="h-3.5 w-3.5 icon-[mdi-light--check]" />
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs text-ink/60">{fieldLabel(f)}</div>
                          <div className="truncate text-sm font-medium text-ink">{String(fields[f.key])}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl bg-[#F8FAFC] px-3 py-6 text-center text-sm text-ink/60">{t('profile.noFilled')}</div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-ink/6 bg-[#FBFCFD] p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-ink">{t('profile.toSupplementTitle')}</div>
                  <div className="text-xs text-ink/60">{t('profile.supplementDesc')}</div>
                </div>
                <span className="rounded-full bg-[#FEF3F2] px-2.5 py-1 text-xs font-semibold text-red-500">
                  {missing.length}
                </span>
              </div>
              {missing.length > 0 ? (
                <div className="space-y-2">
                  {missing.map((f) => (
                    <div key={f.key} className="rounded-xl border border-red-100 bg-white px-3 py-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-50 text-red-500">
                          <span className="h-3.5 w-3.5 icon-[mdi-light--alert-circle]" />
                        </span>
                        {fieldLabel(f)}
                      </div>
                      <div className="mt-1 pl-7 text-xs text-ink/60">{t(FIX_HINT_KEYS[f.key] ?? 'profile.supplementHint')}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-success/20 bg-success/5 px-3 py-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
                    <span className="h-7 w-7 icon-[mdi-light--check-circle]" />
                  </div>
                  <div className="mt-3 text-sm font-semibold text-success">{t('profile.complete')}</div>
                  <div className="mt-1 text-xs text-ink/60">{t('profile.completeDesc')}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-3 border-t border-ink/6 bg-white px-6 py-4">
          <VButton variant="secondary" size="sm" onClick={onClose}>{t('profile.close')}</VButton>
          <VButton size="sm" onClick={onSupplement}>
            <span className="h-4 w-4 icon-[mdi-light--plus]" />
            {t('profile.supplement')}
          </VButton>
        </div>
      </div>
    </div>
  )
}
