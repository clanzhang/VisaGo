// components/visa/ReviewForm.tsx — 第三步：核对自动提取的信息
// 缺失提示 + 可编辑字段表单 + 保存/返回
import { VButton } from '@/components/common'
import { FIELD_SPECS, type FieldSpec } from '@/data/field-specs'

interface Props {
  profile: Record<string, string>
  missingFields: FieldSpec[]
  onSave: () => void
  onBack: () => void
  onFieldChange: (key: string, value: string) => void
}

export function ReviewForm({ profile, missingFields, onSave, onBack, onFieldChange }: Props) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-card">
      {/* 标题栏：sticky 顶部，保存/返回始终可见 */}
      <div className="sticky -top-6 -mx-6 z-10 mb-4 flex items-center justify-between border-b border-ink/5 bg-white px-6 py-4">
        <h2 className="text-lg font-bold text-ink">核对自动提取的信息</h2>
        <div className="flex gap-2">
          <VButton variant="secondary" size="sm" onClick={onSave}>
            💾 保存
          </VButton>
          <VButton size="sm" onClick={onBack}>
            返回文件列表
          </VButton>
        </div>
      </div>

      {/* 缺失提示 */}
      {missingFields.length > 0 && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="text-sm font-semibold text-amber-700">
            文件中未找到 {missingFields.length} 项信息，请核对或补充：
          </div>
          <div className="mt-1 flex flex-wrap gap-2">
            {missingFields.map((f) => (
              <span key={f.key} className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-amber-700">
                {f.label}（文件中未找到）
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-amber-600/70">
            💡 提示：可补充扫描身份证/护照/户口本等材料自动获取，或在下方手动补填
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
                  {f.label} {f.required && <span className="text-red-500">*</span>}
                </label>
                {!filled && (
                  <span className="ml-auto text-[11px] text-red-500/70">文件中未找到</span>
                )}
              </div>
              <input
                value={profile[f.key] ?? ''}
                onChange={(e) => onFieldChange(f.key, e.target.value)}
                placeholder={filled ? (f.required ? '必填' : '选填') : '文件中未找到，请补充'}
                className="w-full rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary/40"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
