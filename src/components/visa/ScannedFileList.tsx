// components/visa/ScannedFileList.tsx — 第二步：已扫描文件列表
// 标题栏（添加文件/识别全部）+ 文件列表项（识别按钮/状态徽章）+ 下一步按钮
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
}

interface Props {
  items: ScannedFileItem[]
  folder: string
  scanning: boolean
  recognizingAll: boolean
  recognizedCount: number
  onAddMore: () => void
  onRecognizeAll: () => void
  onRecognize: (item: ScannedFileItem) => void
  onNext: () => void
}

export function ScannedFileList({
  items,
  folder,
  scanning,
  recognizingAll,
  recognizedCount,
  onAddMore,
  onRecognizeAll,
  onRecognize,
  onNext,
}: Props) {
  const { t } = useI18n()
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl bg-white p-6 shadow-card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-ink">{t('scan.fileListTitle')}</h2>
            <p className="text-xs text-ink/60">
              {items.length > 0 && folder
                ? t('scan.fileCountWithFolder', { count: items.length, folder })
                : t('scan.fileCount', { count: items.length })}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <VButton size="sm" variant="secondary" onClick={onAddMore} disabled={scanning}>
              {scanning ? t('scan.picking') : t('scan.addFiles')}
            </VButton>
            <VButton size="sm" onClick={onRecognizeAll} disabled={recognizingAll}>
              {recognizingAll ? t('common.recognizing') : t('scan.recognizeAll', { done: recognizedCount, total: items.length })}
            </VButton>
          </div>
        </div>

        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.path} className="flex items-center gap-3 rounded-xl border border-ink/5 px-4 py-3">
              <span className="text-lg">📄</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-ink">{item.name}</div>
                <div className="text-xs text-ink/40">
                  {item.fileType.toUpperCase()} · {item.category || t('scan.unrecognized')}
                </div>
              </div>
              {item.status === 'pending' && (
                <VButton size="sm" variant="secondary" onClick={() => onRecognize(item)}>
                  {t('scan.recognize')}
                </VButton>
              )}
              {item.status === 'recognizing' && (
                <span className="flex items-center gap-1.5 text-xs text-ink/60">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#39A2B8] border-t-transparent" />
                  {t('common.recognizing')}
                </span>
              )}
              {item.status === 'done' && (
                <VBadge tone="success">✓ {item.category}</VBadge>
              )}
              {item.status === 'error' && (
                <VBadge tone="danger">{item.error}</VBadge>
              )}
            </div>
          ))}
        </div>

        {/* 下一步：sticky 底部，始终可见 */}
        <div className="sticky bottom-0 -mx-6 mt-6 flex justify-end border-t border-ink/5 bg-white px-6 py-3">
          <VButton onClick={onNext} disabled={recognizedCount === 0}>
            {t('scan.nextReview')}
          </VButton>
        </div>
      </div>
    </div>
  )
}
