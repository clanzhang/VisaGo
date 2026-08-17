// components/visa/ScanEmptyState.tsx — 扫描第一步空状态引导卡片
// 复用共用 EmptyState 范式（圆形图标 + 标题 + 描述 + CTA）
import { VButton } from '@/components/common'
import { EmptyState } from '@/components/common'
import { useI18n } from '@/i18n'

interface Props {
  /** 是否正在扫描（按钮 loading 态） */
  scanning?: boolean
  /** 点击选文件 */
  onPickFiles: () => void
  /** 是否 Tauri 桌面端（非桌面端显示 Web 提示） */
  isTauriEnv?: boolean
}

export function ScanEmptyState({ scanning, onPickFiles, isTauriEnv }: Props) {
  const { t } = useI18n()
  return (
    <EmptyState
      icon={
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1460A4" strokeWidth="1.6">
          <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5zM14 3v5h5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="15" r="2.5" />
          <path d="M12 12.5V9m0 9v-1.5" strokeLinecap="round" />
        </svg>
      }
      title={t('scan.emptyTitle')}
      desc={t('scan.emptyDesc')}
      actions={
        <VButton size="lg" variant="secondary" onClick={onPickFiles} disabled={scanning}>
          {scanning ? t('scan.openingPicker') : t('scan.pickFiles')}
        </VButton>
      }
      hint={
        !isTauriEnv ? (
          <p className="text-xs text-warning">{t('scan.webHint')}</p>
        ) : undefined
      }
    />
  )
}
