// components/common/ProfileCardDetailModal.tsx — 资料卡详情弹窗（双栏：已填/未填）
// 点击资料卡时展示已填写字段与缺失字段明细，缺失字段带补充提示
import { VButton } from './VButton'
import { VModal } from './VModal'
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
  return (
    <VModal
      open={!!card}
      onClose={onClose}
      title={card ? `资料卡详情 — ${card.name || '未命名'}` : ''}
      width="max-w-2xl"
      footer={
        <>
          <VButton variant="secondary" size="sm" onClick={onClose}>关闭</VButton>
          <VButton size="sm" onClick={onSupplement}>去补充</VButton>
        </>
      }
    >
      {card && (() => {
        const fields = (card.fields ?? {}) as Record<string, unknown>
        const has = (key: string) => String(fields[key] ?? '').trim()
        const filled = CARD_FIELD_SPECS.filter((f) => has(f.key))
        const missing = CARD_FIELD_SPECS.filter((f) => !has(f.key))
        return (
          <>
            {/* 双栏：已填写 / 未填写 */}
            <div className="grid max-h-[50vh] grid-cols-2 gap-4 overflow-y-auto">
              {/* 左栏：已填写 */}
              <div className="rounded-xl border border-success/20 bg-success/5 p-3">
                <div className="mb-2 text-xs font-semibold text-success">已填写（{filled.length}）</div>
                {filled.length > 0 ? (
                  <div className="space-y-1.5">
                    {filled.map((f) => (
                      <div key={f.key} className="flex items-start gap-1.5 text-sm">
                        <span className="text-success">✓</span>
                        <span className="text-ink/70">{f.label}：</span>
                        <span className="min-w-0 truncate text-ink">{String(fields[f.key])}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-ink/40">暂无已填写字段</div>
                )}
              </div>

              {/* 右栏：未填写 */}
              <div className="rounded-xl border border-red-200 bg-red-50/60 p-3">
                <div className="mb-2 text-xs font-semibold text-red-500">未填写（{missing.length}）</div>
                {missing.length > 0 ? (
                  <div className="space-y-2">
                    {missing.map((f) => (
                      <div key={f.key} className="text-sm">
                        <div className="flex items-center gap-1.5 text-red-600">
                          <span>✗</span>
                          <span className="font-medium">{f.label}</span>
                        </div>
                        <div className="mt-0.5 pl-5 text-[11px] text-red-500/70">
                          💡 {FIX_HINT[f.key] ?? '请补充相关材料'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-success">✅ 资料完整</div>
                )}
              </div>
            </div>

            {/* 底部统计 */}
            <div className="mt-4 rounded-lg bg-[#F9F9F6] px-3 py-2 text-center text-sm text-ink/60">
              已填写 {filled.length}/{CARD_FIELD_SPECS.length} 项，还差 {missing.length} 项
            </div>
          </>
        )
      })()}
    </VModal>
  )
}
