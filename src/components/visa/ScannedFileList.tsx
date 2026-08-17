// components/visa/ScannedFileList.tsx — 第二步：已扫描文件列表
// 标题只显示数量+类型摘要（不渲染路径）；识别全部有整体进度/倒计时/可停止；
// 批量识别中禁用单行操作；失败给出人类可读原因 + 重试 + 技术详情
import { VButton, VBadge } from '@/components/common'
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
  onNext,
}: Props) {
  const { t, isZh } = useI18n()

  // A1：类型摘要（如「4 个 DOCX、1 个 PNG」），不渲染路径
  const typeCounts = new Map<string, number>()
  for (const it of items) {
    const ext = (it.fileType || 'file').toUpperCase()
    typeCounts.set(ext, (typeCounts.get(ext) ?? 0) + 1)
  }
  const types = Array.from(typeCounts.entries())
    .map(([ext, n]) => `${n} ${ext}`)
    .join(isZh ? '、' : ', ')
  const pendingCount = items.filter((i) => i.status === 'pending').length
  // B8：未识别文件数（含失败），用于下一步警示
  const unrecognized = items.filter((i) => i.status === 'pending' || i.status === 'error').length

  function scrollToPending() {
    const idx = items.findIndex((i) => i.status === 'pending' || i.status === 'error')
    if (idx >= 0) {
      document.getElementById(`scan-file-${idx}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const progressPercent =
    recognizeProgress && recognizeProgress.total > 0
      ? Math.round((recognizeProgress.done / recognizeProgress.total) * 100)
      : 0

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
              <VButton size="sm" onClick={onRecognizeAll} disabled={items.length === 0 || pendingCount === 0}>
                {pendingCount > 0 ? t('scan.recognizeAllRemaining', { n: pendingCount }) : t('scan.recognizeAll', { done: recognizedCount, total: items.length })}
              </VButton>
            )}
          </div>
        </div>

        {/* A2：整体进度（进度条 + 当前文件 + 限流倒计时），aria-live 播报 */}
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

        {/* 文件列表 */}
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={item.path} id={`scan-file-${idx}`} className="flex items-center gap-3 rounded-xl border border-ink/5 px-4 py-3" title={item.path}>
              <span className="text-lg" aria-hidden="true">📄</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-ink">{item.name}</div>
                <div className="text-xs text-ink/60">
                  {item.fileType.toUpperCase()} ·{' '}
                  {item.status === 'error'
                    ? t(ERROR_MSG_KEYS[item.errorKind ?? 'network'] ?? 'scan.errNetwork')
                    : item.category || t('scan.unrecognized')}
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
              {item.status === 'done' && <VBadge tone="success">✓ {item.category}</VBadge>}
              {item.status === 'error' && (
                <div className="flex shrink-0 items-center gap-2">
                  <VButton size="sm" variant="secondary" onClick={() => onRecognize(item)}>
                    {t('common.retry')}
                  </VButton>
                  <details className="relative">
                    <summary className="cursor-pointer list-none rounded-md p-1 text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink" title={t('scan.techDetail')}>
                      <span className="flex h-4 w-4 icon-[mdi-light--information]" />
                    </summary>
                    <div className="absolute right-0 top-full z-20 mt-1 w-72 rounded-lg border border-ink/5 bg-white p-3 shadow-card-lg">
                      <p className="text-[11px] font-semibold text-ink/70">{t('scan.techDetail')}</p>
                      <p className="mt-1 break-all text-[11px] leading-relaxed text-ink/60">{item.error}</p>
                    </div>
                  </details>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* B9：页面级 sticky 操作栏（实心白底 + 顶分隔 + 圆角，不遮挡最后一个文件项） */}
      <div className="sticky bottom-0 -mx-4 rounded-t-2xl border border-ink/5 border-b-0 bg-white px-4 py-3 shadow-[0_-4px_16px_rgba(16,24,40,0.08)] sm:-mx-8 sm:px-8">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-2">
          {/* B8：未识别警示 + 一键返回处理 */}
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
    </div>
  )
}
