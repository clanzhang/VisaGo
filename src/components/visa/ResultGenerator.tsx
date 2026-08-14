// components/visa/ResultGenerator.tsx — 第三步：生成材料（选择申请目标 + 生成结果）
import { VButton } from '@/components/common'
import type { TripData } from '@/types'

interface Props {
  country: string
  visaType: string
  docType: 'itinerary' | 'employment' | 'cover'
  tripData: TripData | null
  generated: string
  generating: boolean
  onCountryChange: (v: string) => void
  onVisaTypeChange: (v: string) => void
  onDocTypeChange: (v: 'itinerary' | 'employment' | 'cover') => void
  onGenerate: () => void
  onExport: () => void
}

const COUNTRIES = ['日本', '韩国', '泰国', '申根', '美国', '英国', '澳大利亚']
const VISA_TYPES = ['旅游签证', '商务签证', '探亲签证', '学生签证']
const DOC_TYPES = [
  { id: 'itinerary', label: '行程单' },
  { id: 'employment', label: '在职证明' },
  { id: 'cover', label: '解释信' },
] as const

export function ResultGenerator({
  country,
  visaType,
  docType,
  tripData,
  generated,
  generating,
  onCountryChange,
  onVisaTypeChange,
  onDocTypeChange,
  onGenerate,
  onExport,
}: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl bg-white p-6 shadow-card">
        <h2 className="mb-4 text-lg font-bold text-ink">选择申请目标</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/60">国家</label>
            <select
              value={country}
              onChange={(e) => onCountryChange(e.target.value)}
              className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40"
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/60">签证类型</label>
            <select
              value={visaType}
              onChange={(e) => onVisaTypeChange(e.target.value)}
              className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40"
            >
              {VISA_TYPES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/60">生成文档类型</label>
            <div className="grid grid-cols-3 gap-2">
              {DOC_TYPES.map((dt) => (
                <button
                  key={dt.id}
                  onClick={() => onDocTypeChange(dt.id)}
                  className={`rounded-lg border-2 px-2 py-2 text-xs font-medium transition-all ${
                    docType === dt.id ? 'border-primary bg-primary/5 text-primary' : 'border-ink/10 text-ink/55'
                  }`}
                >
                  {dt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 行程数据预览（识别到行程文件时显示） */}
          {docType === 'itinerary' && tripData && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
                <span>🗺️</span> 已从行程文件提取数据
              </div>
              <dl className="space-y-1 text-xs text-ink/70">
                <div className="flex justify-between"><dt className="text-ink/50">目的地</dt><dd className="font-medium">{tripData.destination || country}</dd></div>
                <div className="flex justify-between"><dt className="text-ink/50">出发</dt><dd className="font-medium">{tripData.start_date || '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-ink/50">返回</dt><dd className="font-medium">{tripData.end_date || '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-ink/50">天数</dt><dd className="font-medium">{tripData.days ?? tripData.daily_plan?.length ?? '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-ink/50">城市</dt><dd className="font-medium">{(tripData.cities ?? []).join('、') || '—'}</dd></div>
              </dl>
              {tripData.daily_plan && tripData.daily_plan.length > 0 && (
                <div className="mt-2 border-t border-primary/15 pt-2">
                  <div className="mb-1 text-[11px] text-ink/50">每日安排</div>
                  <div className="max-h-28 space-y-0.5 overflow-y-auto text-[11px] text-ink/70">
                    {tripData.daily_plan.map((d, i) => (
                      <div key={i}>· 第{d.day ?? i + 1}天 {d.date ? `(${d.date})` : ''} {d.city || ''}：{d.activity || ''}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <VButton className="w-full" onClick={onGenerate} disabled={generating}>
            {generating ? '生成中…' : '✨ AI 生成材料'}
          </VButton>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">生成结果</h2>
          {generated && (
            <VButton variant="secondary" size="sm" onClick={onExport}>
              ⬇️ 导出 PDF
            </VButton>
          )}
        </div>
        {generated ? (
          <pre className="max-h-[480px] overflow-y-auto whitespace-pre-wrap rounded-xl bg-[#F9F9F6] p-4 text-sm leading-relaxed text-ink/75">
            {generated}
          </pre>
        ) : (
          <div className="flex h-64 items-center justify-center rounded-xl bg-[#F9F9F6] text-sm text-ink/40">
            点击「AI 生成材料」获取文档
          </div>
        )}
      </div>
    </div>
  )
}
