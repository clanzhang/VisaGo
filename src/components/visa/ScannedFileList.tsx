// components/visa/ScannedFileList.tsx — 第二步：已扫描文件列表
// 标题只显示数量+类型摘要；识别全部有整体进度/倒计时/可停止；批量中禁单行；
// 失败人类可读 + 重试 + 技术详情；识别后图标/标题升级为类别，字段摘要可展开；可移除误选文件
import { useState } from 'react'
import { VButton, VBadge, VModal } from '@/components/common'
import { useI18n } from '@/i18n'

export interface ScannedFileItem {
  path: string
  name: string
  fileType: string
  category: string
  fields: Record<string, unknown>
  summary: string
  status: 'pending' | 'recognizing' | 'done' | 'error'
  error?: string
  /** 错误分类（rate-limit / auth / timeout / parse / network） */
  errorKind?: string
}

export interface RecognizeProgress {
  done: number
  total: number
  currentName: string
  phase: 'recognizing' | 'waiting'
  secondsLeft: number
}

interface Props {
  items: ScannedFileItem[]
  scanning: boolean
  recognizingAll: boolean
  recognizeProgress?: RecognizeProgress | null
  recognizedCount: number
  onAddMore: () => void
  onRecognizeAll: () => void
  onStopRecognize: () => void
  onRecognize: (item: ScannedFileItem) => void
  onRemove: (path: string) => void
  onNext: () => void
}

/** 错误分类 → 人类可读文案 key */
const ERROR_MSG_KEYS: Record<string, string> = {
  'rate-limit': 'scan.errRateLimit',
  auth: 'scan.errAuth',
  timeout: 'scan.errTimeout',
  parse: 'scan.errParse',
  network: 'scan.errNetwork',
}

/** 识别类别（Kimi 返回的中文类别）→ 图标 + 本地化标签 */
const CATEGORY_META: Record<string, { labelKey: string; icon: string }> = {
  身份证: { labelKey: 'scan.materialName_id', icon: 'account' },
  护照: { labelKey: 'scan.materialName_passport', icon: 'book' },
  户口本: { labelKey: 'scan.materialName_family', icon: 'home' },
  在职证明: { labelKey: 'scan.materialName_employment', icon: 'briefcase' },
  行程单: { labelKey: 'scan.categoryLabelItinerary', icon: 'map-marker' },
  行程: { labelKey: 'scan.categoryLabelItinerary', icon: 'map-marker' },
  银行流水: { labelKey: 'scan.materialName_bank', icon: 'bank' },
  证件照: { labelKey: 'scan.materialName_photo', icon: 'camera' },
  照片: { labelKey: 'scan.materialName_photo', icon: 'camera' },
  申请表: { labelKey: 'scan.materialName_application', icon: 'file' },
}

/** 未识别时按文件格式给图标 */
const FORMAT_ICONS: Record<string, string> = {
  pdf: 'file',
  doc: 'note',
  docx: 'note',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
}

/** 识别字段 key → i18n 标签 */
const FIELD_LABEL_KEYS: Record<string, string> = {
  name: 'documents.name',
  passport_number: 'documents.passportNumber',
  id_number: 'scan.fieldIdNumber',
  nationality: 'documents.nationality',
  birth_date: 'documents.birthDate',
  gender: 'scan.fieldGender',
  phone: 'scan.fieldPhone',
  address: 'scan.fieldAddress',
  home_province: 'assistant.homeProvince',
  passport_issued_in: 'assistant.passportIssuedIn',
  occupation: 'documents.occupation',
  company: 'documents.company',
  position: 'documents.position',
  salary: 'documents.salary',
}

export function ScannedFileList({
  items,
  scanning,
  recognizingAll,
  recognizeProgress,
  recognizedCount,
  onAddMore,
  onRecognizeAll,
  onStopRecognize,
  onRecognize,
  onRemove,
  onNext,
}: Props) {
  const { t, isZh } = useI18n()
  // C13：已识别项的字段摘要展开状态
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => new Set())
  // C14：待移除文件（VModal 确认）
  const [removeTarget, setRemoveTarget] = useState<ScannedFileItem | null>(null)

  // 类型摘要（如「4 个 DOCX、1 个 PNG」），不渲染路径
  const typeCounts = new Map<string, number>()
  for (const it of items) {
    const ext = (it.fileType || 'file').toUpperCase()
    typeCounts.set(ext, (typeCounts.get(ext) ?? 0) + 1)
  }
  const types = Array.from(typeCounts.entries())
    .map(([ext, n]) => `${n} ${ext}`)
    .join(isZh ? '、' : ', ')
  const pendingCount = items.filter((i) => i.status === 'pending').length
  const errorCount = items.filter((i) => i.status === 'error').length
  const unrecognized = items.filter((i) => i.status === 'pending' || i.status === 'error').length
  const allDone = items.length > 0 && pendingCount === 0 && errorCount === 0

  const progressPercent =
    recognizeProgress && recognizeProgress.total > 0
      ? Math.round((recognizeProgress.done / recognizeProgress.total) * 100)
      : 0

  function scrollToPending() {
    const idx = items.findIndex((i) => i.status === 'pending' || i.status === 'error')
    if (idx >= 0) {
      document.getElementById(`scan-file-${idx}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  /** 行内图标：识别后升级为类别图标（正反馈），未识别用格式图标 */
  function rowIcon(item: ScannedFileItem): string {
    if (item.status === 'done' && CATEGORY_META[item.category]) return CATEGORY_META[item.category].icon
    const ext = (item.fileType || '').toLowerCase()
    return FORMAT_ICONS[ext] ?? 'file'
  }

  /** 识别后的主标题：显示类别而不是带哈希的文件名 */
  function rowTitle(item: ScannedFileItem): string {
    if (item.status === 'done' && CATEGORY_META[item.category]) return t(CATEGORY_META[item.category].labelKey)
    return item.name
  }

  function toggleExpand(path: string) {
    setExpandedPaths((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl bg-white p-6 shadow-card">
        {/* 标题：数量 + 类型摘要（完整路径在各行的 tooltip） */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-ink">{t('scan.fileListTitle')}</h2>
            <p className="text-xs text-ink/60">
              {items.length > 0 ? t('scan.fileCountWithTypes', { count: items.length, types }) : t('scan.fileCount', { count: 0 })}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <VButton size="sm" variant="secondary" onClick={onAddMore} disabled={scanning || recognizingAll}>
              {scanning ? t('scan.openingPicker') : t('scan.addFiles')}
            </VButton>
            {recognizingAll ? (
              <VButton size="sm" variant="danger" onClick={onStopRecognize}>
                {t('scan.stopRecognize')}
              </VButton>
            ) : (
              <VButton size="sm" onClick={onRecognizeAll} disabled={items.length === 0 || (pendingCount === 0 && errorCount === 0)}>
                {pendingCount > 0
                  ? t('scan.recognizeAllRemaining', { n: pendingCount })
                  : errorCount > 0
                    ? t('scan.retryFailed', { n: errorCount })
                    : t('scan.allRecognized')}
              </VButton>
            )}
          </div>
        </div>

        {/* 整体进度（进度条 + 当前文件 + 限流倒计时），aria-live 播报 */}
        {recognizeProgress && (
          <div className="mb-4 rounded-xl border border-ink/5 bg-[#FBFCFD] p-4" role="status" aria-live="polite">
            <div className="flex items-center gap-2 text-xs font-medium text-ink">
              <span className="h-3.5 w-3.5 shrink-0 animate-spin text-primary icon-[mdi-light--refresh]" aria-hidden="true" />
              {recognizeProgress.phase === 'recognizing'
                ? t('scan.recognizeProgress', {
                    done: Math.min(recognizeProgress.done + 1, recognizeProgress.total),
                    total: recognizeProgress.total,
                    name: recognizeProgress.currentName,
                  })
                : t('scan.recognizeWait', { seconds: recognizeProgress.secondsLeft })}
            </div>
            <div
              className="mt-2.5 h-2 overflow-hidden rounded-full bg-ink/8"
              role="progressbar"
              aria-valuenow={recognizeProgress.done}
              aria-valuemin={0}
              aria-valuemax={recognizeProgress.total}
              aria-label={t('scan.recognizeProgress', { done: recognizeProgress.done, total: recognizeProgress.total, name: recognizeProgress.currentName })}
            >
              <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>
            <p className="mt-1.5 text-[11px] text-ink/60">
              {t('scan.recognizeProgress', { done: recognizeProgress.done, total: recognizeProgress.total, name: recognizeProgress.currentName })}
            </p>
          </div>
        )}

        {/* D18：全部识别完成 → 明确完成反馈并推向下一步 */}
        {allDone && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-success/30 bg-success/5 px-4 py-2.5 text-xs font-medium text-success" role="status">
            <span className="h-4 w-4 shrink-0 icon-[mdi-light--check-circle]" aria-hidden="true" />
            {t('scan.allComplete', { n: items.length })}
          </div>
        )}

        {/* 文件列表 */}
        <div className="space-y-2">
          {items.length === 0 && !scanning && (
            <div className="rounded-xl border border-dashed border-ink/15 bg-[#F8FAFC] px-4 py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <span className="h-7 w-7 icon-[mdi-light--file]" />
              </div>
              <p className="mt-3 text-sm font-semibold text-ink">{t('scan.emptyListTitle')}</p>
              <p className="mt-1 text-xs text-ink/60">{t('scan.emptyListDesc')}</p>
            </div>
          )}
          {items.length === 0 && scanning && (
            <div className="space-y-2" role="status" aria-live="polite">
              <p className="flex items-center gap-1.5 pb-1 text-xs text-ink/60">
                <span className="h-3.5 w-3.5 animate-spin text-primary icon-[mdi-light--refresh]" aria-hidden="true" />
                {t('scan.scanningFiles')}
              </p>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-ink/5 px-4 py-3">
                  <div className="h-8 w-8 animate-pulse rounded-lg bg-[#E8EEF4]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-40 animate-pulse rounded bg-[#E8EEF4]" />
                    <div className="h-3 w-28 animate-pulse rounded bg-[#EEF2F6]" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {items.map((item, idx) => {
            const catMeta = CATEGORY_META[item.category]
            const expanded = expandedPaths.has(item.path)
            return (
              <div key={item.path} id={`scan-file-${idx}`} className="rounded-xl border border-ink/5" title={item.path}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F5F7FA] text-ink/60 ${
                      item.status === 'done' && catMeta ? `icon-[mdi-light--${catMeta.icon}]` : `icon-[mdi-light--${rowIcon(item)}]`
                    }`}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink">{rowTitle(item)}</div>
                    <div className="truncate text-xs text-ink/60">
                      {item.fileType.toUpperCase()} ·{' '}
                      {item.status === 'error'
                        ? t(ERROR_MSG_KEYS[item.errorKind ?? 'network'] ?? 'scan.errNetwork')
                        : item.status === 'done'
                          ? (catMeta ? item.name : t('scan.recognizeDone'))
                          : item.status === 'recognizing'
                            ? t('common.recognizing')
                            : t('scan.unrecognized')}
                    </div>
                  </div>

                  {item.status === 'pending' && (
                    <VButton
                      size="sm"
                      variant="secondary"
                      onClick={() => onRecognize(item)}
                      disabled={recognizingAll}
                      title={recognizingAll ? t('scan.batchRecognizing') : undefined}
                    >
                      {recognizingAll ? t('scan.batchRecognizing') : t('scan.recognize')}
                    </VButton>
                  )}
                  {item.status === 'recognizing' && (
                    <span className="flex shrink-0 items-center gap-1.5 text-xs text-ink/60">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#39A2B8] border-t-transparent" aria-hidden="true" />
                      {t('common.recognizing')}
                    </span>
                  )}
                  {item.status === 'done' && (
                    <>
                      <button
                        type="button"
                        onClick={() => toggleExpand(item.path)}
                        aria-expanded={expanded}
                        aria-label={expanded ? t('assistant.collapse') : t('assistant.expand')}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                      >
                        <span className={`h-4 w-4 transition-transform ${expanded ? '' : 'rotate-180'} icon-[mdi-light--chevron-down]`} aria-hidden="true" />
                      </button>
                      <VBadge tone="success">
                        <span className="mr-0.5 inline-block h-3 w-3 align-[-1px] icon-[mdi-light--check]" />
                        {catMeta ? t(catMeta.labelKey) : t('scan.recognizeDone')}
                      </VBadge>
                    </>
                  )}
                  {item.status === 'error' && (
                    <>
                      <VBadge tone="danger">
                        <span className="mr-0.5 inline-block h-3 w-3 align-[-1px] icon-[mdi-light--alert-circle]" />
                        {t('scan.recognizeFailed')}
                      </VBadge>
                      <VButton size="sm" variant="secondary" onClick={() => onRecognize(item)}>
                        {t('common.retry')}
                      </VButton>
                      <details className="relative">
                        <summary
                          className="cursor-pointer list-none rounded-md p-1 text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink"
                          title={t('scan.techDetail')}
                        >
                          <span className="flex h-4 w-4 icon-[mdi-light--information]" aria-hidden="true" />
                        </summary>
                        <div className="absolute right-0 top-full z-20 mt-1 w-72 rounded-lg border border-ink/5 bg-white p-3 shadow-card-lg">
                          <p className="text-[11px] font-semibold text-ink/70">{t('scan.techDetail')}</p>
                          <p className="mt-1 break-all text-[11px] leading-relaxed text-ink/60">{item.error}</p>
                        </div>
                      </details>
                    </>
                  )}

                  {/* C14：移除（识别中禁止） */}
                  {item.status !== 'recognizing' && (
                    <button
                      type="button"
                      onClick={() => setRemoveTarget(item)}
                      aria-label={t('scan.removeFile')}
                      title={t('scan.removeFile')}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink/40 transition-colors hover:bg-red-50 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                    >
                      <span className="h-4 w-4 icon-[mdi-light--delete]" aria-hidden="true" />
                    </button>
                  )}
                </div>

                {/* C13：识别字段摘要（在这里就能发现「护照号识别错了」） */}
                {item.status === 'done' && expanded && (
                  <div className="border-t border-ink/5 bg-[#FBFCFD] px-4 py-3">
                    {(() => {
                      const entries = Object.entries(item.fields ?? {})
                        .filter(([, v]) => v !== null && v !== undefined && typeof v !== 'object' && String(v).trim() !== '' && String(v).trim() !== 'null')
                        .map(([k, v]) => [k, String(v)] as [string, string])
                      if (entries.length === 0) {
                        return <p className="text-xs text-ink/60">{t('scan.noFields')}</p>
                      }
                      return (
                        <dl className="grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
                          {entries.map(([k, v]) => (
                            <div key={k} className="flex items-baseline justify-between gap-2 text-xs">
                              <dt className="shrink-0 text-ink/60">{t(FIELD_LABEL_KEYS[k] ?? k)}</dt>
                              <dd className="min-w-0 truncate font-medium text-ink" title={v}>{v}</dd>
                            </div>
                          ))}
                        </dl>
                      )
                    })()}
                    {item.summary && (
                      <p className="mt-2 text-xs text-ink/60">
                        <span className="font-medium">{t('scan.fieldSummary')}:</span> {item.summary}
                      </p>
                    )}
                    <p className="mt-2 truncate text-[11px] text-ink/55" title={item.path}>{item.path}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 页面级 sticky 操作栏 */}
      <div className="sticky bottom-0 -mx-4 rounded-t-2xl border border-ink/5 border-b-0 bg-white px-4 py-3 shadow-[0_-4px_16px_rgba(16,24,40,0.08)] sm:-mx-8 sm:px-8">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-2">
          {unrecognized > 0 && !recognizingAll && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <p className="text-xs text-amber-700">{t('scan.unrecognizedWarning', { n: unrecognized })}</p>
              <button
                type="button"
                onClick={scrollToPending}
                className="shrink-0 text-xs font-medium text-primary transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                {t('scan.backToPending')}
              </button>
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-ink/60">{t('scan.recognizedSummary', { done: recognizedCount, total: items.length })}</span>
            <VButton size="lg" onClick={onNext} disabled={recognizedCount === 0 || recognizingAll}>
              {recognizingAll ? t('scan.nextDisabledRecognizing') : t('scan.nextReview')}
            </VButton>
          </div>
        </div>
      </div>

      {/* C14：移除确认（VModal） */}
      <VModal
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        title={t('scan.removeFileConfirmTitle')}
        footer={
          <>
            <VButton variant="secondary" onClick={() => setRemoveTarget(null)}>
              {t('common.cancel')}
            </VButton>
            <VButton
              variant="danger"
              onClick={() => {
                if (removeTarget) onRemove(removeTarget.path)
                setRemoveTarget(null)
              }}
            >
              {t('common.delete')}
            </VButton>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink/70">
          {removeTarget ? t('scan.removeFileConfirmDesc', { name: removeTarget.name }) : ''}
        </p>
      </VModal>
    </div>
  )
}
