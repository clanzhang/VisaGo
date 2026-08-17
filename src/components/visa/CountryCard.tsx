// components/visa/CountryCard.tsx — 国家卡片（百科列表）
// 信息重构：国旗 + 名称（中/英）+ 结构化事实 chips（办理周期/停留/费用/在线/区域）
// 不再用绝对定位徽章、不再渲染模板化描述行；提供「开始申请」直达入口
import { useNavigate } from 'react-router-dom'
import { useI18n, regionLabelKey } from '@/i18n'
import { VISA_TYPE_LABEL_KEYS } from '@/data/countries'
import { getVisaOfficialFee, formatFee } from '@/data/visa-fees'
import type { Country } from '@/types'

interface Props {
  country: Country
  index?: number
  /** 隐藏签证类型标签（当顶部已按签证类型筛选/分组时，避免重复） */
  hideVisaType?: boolean
  /** 对比模式：点卡片=选中/取消（不再跳转详情） */
  selectable?: boolean
  selected?: boolean
  onToggleSelect?: () => void
}

/** 解析停留天数文案（如「最长 30 天」/「3-7 天」），供卡片 EN 展示 */
function parseStay(duration: string): { kind: 'range'; min: string; max: string } | { kind: 'upTo'; n: string } | null {
  const range = duration.match(/(\d+)\s*-\s*(\d+)/)
  if (range) return { kind: 'range', min: range[1], max: range[2] }
  const upTo = duration.match(/(\d+)/)
  if (upTo) return { kind: 'upTo', n: upTo[1] }
  return null
}

export function CountryCard({ country, index = 0, hideVisaType = false, selectable = false, selected = false, onToggleSelect }: Props) {
  const navigate = useNavigate()
  const { t, isZh, pickL } = useI18n()

  function handleActivate() {
    if (selectable) {
      onToggleSelect?.()
      return
    }
    navigate(`/encyclopedia/${country.id}`)
  }

  /** 费用 chip：官方首档外币价 / CNY 兜底 / 0 → 免费 */
  function feeText(): string {
    const vt = country.visaTypes[0]
    if (!vt) return ''
    const official = getVisaOfficialFee(country.id, vt.id, {
      serviceFee: vt.serviceFee?.amount ?? 0,
      courierFee: 0,
      photoFee: 0,
    })
    if (official && official.tiers.length > 0) {
      const allFree = official.tiers.every((tr) => tr.currency === 'FREE' || tr.amount === 0)
      if (allFree) return t('encyclopedia.free')
      const first = official.tiers.find((tr) => tr.currency !== 'FREE')
      if (first) return formatFee(first)
    }
    const total = (vt.fee?.amount ?? 0) + (vt.serviceFee?.amount ?? 0)
    return total === 0 ? t('encyclopedia.free') : `¥${total}`
  }

  /** 停留 chip：zh 用原文案，EN 解析数字走 i18n */
  function stayText(): string {
    const vt = country.visaTypes[0]
    const duration = vt?.duration ?? ''
    if (isZh) return duration
    const parsed = parseStay(duration)
    if (!parsed) return duration
    return parsed.kind === 'range'
      ? t('encyclopedia.stayRange', { min: parsed.min, max: parsed.max })
      : t('encyclopedia.stayUpTo', { n: parsed.n })
  }

  const vt = country.visaTypes[0]
  const processing = vt ? `${vt.processingDays.min}-${vt.processingDays.max} ${t('assistant.days')}` : ''
  const regionKey = regionLabelKey(country.region)
  const regionText = regionKey ? t(regionKey) : country.region

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={selectable ? (selected ? t('encyclopedia.removeFromCompare') : t('encyclopedia.addToCompare')) : `${pickL(country.name)} · ${t('encyclopedia.viewAll')}`}
      aria-pressed={selectable ? selected : undefined}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleActivate()
        }
      }}
      className={`anim-card group relative flex h-full cursor-pointer flex-col rounded-2xl bg-white p-5 shadow-card transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-card-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
        selected ? 'ring-2 ring-primary/40' : ''
      }`}
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
      onClick={handleActivate}
    >
      {/* 顶部：国旗 + 名称（中/英）+ 类型标签（非类型分组视图时） */}
      <div className="flex items-start gap-3">
        <span className="text-4xl leading-none" aria-hidden="true">{country.flag}</span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-lg font-bold leading-tight text-ink">{pickL(country.name)}</h3>
          {isZh && <div className="mt-0.5 truncate text-xs text-ink/60">{country.name.en}</div>}
        </div>
        {!hideVisaType && (
          <span className="shrink-0 rounded-full bg-ink/5 px-2 py-0.5 text-[11px] font-medium text-ink/60">
            {t(VISA_TYPE_LABEL_KEYS[country.visaType])}
          </span>
        )}
      </div>

      {/* 结构化事实 chips */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {processing && (
          <span className="inline-flex items-center gap-1 rounded-md bg-[#F5F7FA] px-2 py-1 text-[11px] font-medium text-ink/70">
            <span className="h-3.5 w-3.5 text-ink/55 icon-[mdi-light--clock]" aria-hidden="true" />
            {processing}
          </span>
        )}
        <span className="inline-flex items-center gap-1 rounded-md bg-[#F5F7FA] px-2 py-1 text-[11px] font-medium text-ink/70">
          <span className="h-3.5 w-3.5 text-ink/55 icon-[mdi-light--calendar]" aria-hidden="true" />
          {stayText()}
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-[#F5F7FA] px-2 py-1 text-[11px] font-medium text-ink/70">
          <span className="h-3.5 w-3.5 text-ink/55 icon-[mdi-light--credit-card]" aria-hidden="true" />
          {feeText()}
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-[#F5F7FA] px-2 py-1 text-[11px] font-medium text-ink/70">
          <span className="h-3.5 w-3.5 text-ink/55 icon-[mdi-light--cloud]" aria-hidden="true" />
          {vt?.canApplyOnline ? t('encyclopedia.online') : t('encyclopedia.offline')}
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-[#F5F7FA] px-2 py-1 text-[11px] font-medium text-ink/70">
          <span className="h-3.5 w-3.5 text-ink/55 icon-[mdi-light--map-marker]" aria-hidden="true" />
          {regionText}
        </span>
      </div>

      {/* 直达申请流程（对比模式下隐藏，避免与「点卡片=勾选」冲突） */}
      {!selectable && (
        <div className="mt-auto pt-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              navigate('/assistant', { state: { countryId: country.id } })
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-ink/10 px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            {t('encyclopedia.startApplyCard')}
            <span className="h-3.5 w-3.5 icon-[mdi-light--arrow-right]" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  )
}
