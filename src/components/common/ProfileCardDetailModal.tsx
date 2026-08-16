// components/common/ProfileCardDetailModal.tsx — 资料卡详情弹窗（双栏：已填/未填）
// 点击资料卡时展示已填写字段与缺失字段明细，缺失字段带补充提示
import { useEffect } from 'react'
import { VButton } from './VButton'
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

// 未填字段 → 补充提示
const FIX_HINT: Record<string, string> = {
  passport_number: '上传护照扫描件自动识别',
  home_province: '上传户口本自动识别',
  position: '上传在职证明或手动填写',
  company: '上传在职证明或手动填写',
  salary: '上传在职证明或手动填写',
  phone: '手动输入',
  name: '上传身份证扫描件自动识别',
  id_number: '上传身份证扫描件自动识别',
  nationality: '上传护照扫描件自动识别',
  birth_date: '上传身份证扫描件自动识别',
  gender: '上传身份证扫描件自动识别',
  address: '手动输入',
  passport_issued_in: '上传护照扫描件自动识别',
  occupation: '手动选择职业类型',
}

export function ProfileCardDetailModal({ card, onClose, onSupplement }: Props) {
  useEffect(() => {
    if (!card) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [card, onClose])

  if (!card) return null

  const fields = (card.fields ?? {}) as Record<string, unknown>
  const has = (key: string) => String(fields[key] ?? '').trim()
  const filled = CARD_FIELD_SPECS.filter((f) => has(f.key))
  const missing = CARD_FIELD_SPECS.filter((f) => !has(f.key))
  const progress = Math.round((filled.length / CARD_FIELD_SPECS.length) * 100)
  const name = has('name') || card.name || '未命名'
  const passport = has('passport_number') || has('passportNumber')
  const phone = has('phone') || '待补充'
  const nationality = has('nationality') || '待补充'
  const updated = card.updated_at ? new Date(card.updated_at).toLocaleString().slice(0, 16) : '暂无更新时间'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/55 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative flex max-h-[86vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-float animate-[fadeInUp_0.25s_ease]">
        <div className="relative h-40 shrink-0 bg-[linear-gradient(135deg,#1460A4_0%,#39A2B8_48%,#D8F4F7_100%)]">
          <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_20%_20%,rgba(255,255,255,.7)_0,transparent_28%),radial-gradient(circle_at_85%_10%,rgba(255,255,255,.45)_0,transparent_24%)]" />
          <button
            onClick={onClose}
            className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-ink/45 shadow-sm transition-colors hover:text-ink"
            aria-label="关闭"
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
                  <h3 className="truncate text-2xl font-bold leading-tight text-ink">{name}</h3>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    {progress}% 完成
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink/50">
                  <span>资料卡 {card.id}</span>
                  <span>更新于 {updated}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center md:w-80">
              <div className="rounded-xl bg-[#F5F7FA] px-3 py-2">
                <div className="text-lg font-bold text-ink">{filled.length}</div>
                <div className="text-[11px] text-ink/45">已填写</div>
              </div>
              <div className="rounded-xl bg-[#F5F7FA] px-3 py-2">
                <div className="text-lg font-bold text-ink">{missing.length}</div>
                <div className="text-[11px] text-ink/45">待补充</div>
              </div>
              <div className="rounded-xl bg-[#F5F7FA] px-3 py-2">
                <div className="text-lg font-bold text-ink">{CARD_FIELD_SPECS.length}</div>
                <div className="text-[11px] text-ink/45">总字段</div>
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
                  <div className="text-xs text-ink/45">护照号</div>
                  <div className="mt-1 truncate text-sm font-semibold text-ink">{passport || '待补充'}</div>
                </div>
                <div className="rounded-2xl border border-ink/6 bg-white p-4 shadow-sm">
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <span className="h-5 w-5 icon-[mdi-light--account]" />
                  </div>
                  <div className="text-xs text-ink/45">国籍</div>
                  <div className="mt-1 truncate text-sm font-semibold text-ink">{nationality}</div>
                </div>
                <div className="rounded-2xl border border-ink/6 bg-white p-4 shadow-sm">
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <span className="h-5 w-5 icon-[mdi-light--phone]" />
                  </div>
                  <div className="text-xs text-ink/45">手机号</div>
                  <div className="mt-1 truncate text-sm font-semibold text-ink">{phone}</div>
                </div>
              </div>

              <div className="rounded-2xl border border-ink/6 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-ink">已填写信息</div>
                    <div className="text-xs text-ink/45">已识别并保存到这张资料卡的字段</div>
                  </div>
                  <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
                    {filled.length} 项
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
                          <div className="text-xs text-ink/45">{f.label}</div>
                          <div className="truncate text-sm font-medium text-ink">{String(fields[f.key])}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl bg-[#F8FAFC] px-3 py-6 text-center text-sm text-ink/40">暂无已填写字段</div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-ink/6 bg-[#FBFCFD] p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-ink">待补充</div>
                  <div className="text-xs text-ink/45">补齐后生成材料更稳</div>
                </div>
                <span className="rounded-full bg-[#FEF3F2] px-2.5 py-1 text-xs font-semibold text-red-500">
                  {missing.length} 项
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
                        {f.label}
                      </div>
                      <div className="mt-1 pl-7 text-xs text-ink/45">{FIX_HINT[f.key] ?? '请补充相关材料'}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-success/20 bg-success/5 px-3 py-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
                    <span className="h-7 w-7 icon-[mdi-light--check-circle]" />
                  </div>
                  <div className="mt-3 text-sm font-semibold text-success">资料完整</div>
                  <div className="mt-1 text-xs text-ink/45">这张资料卡已经补齐全部字段。</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-3 border-t border-ink/6 bg-white px-6 py-4">
          <VButton variant="secondary" size="sm" onClick={onClose}>关闭</VButton>
          <VButton size="sm" onClick={onSupplement}>
            <span className="h-4 w-4 icon-[mdi-light--plus]" />
            去补充
          </VButton>
        </div>
      </div>
    </div>
  )
}
