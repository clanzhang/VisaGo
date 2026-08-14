// components/visa/ScanEmptyState.tsx — 扫描第一步空状态引导卡片
// 图标 + 标题 + 描述 + 选文件按钮 + Web 模式提示
import { VButton } from '@/components/common'

interface Props {
  /** 是否正在扫描（按钮 loading 态） */
  scanning?: boolean
  /** 点击选文件 */
  onPickFiles: () => void
  /** 是否 Tauri 桌面端（非桌面端显示 Web 提示） */
  isTauriEnv?: boolean
}

export function ScanEmptyState({ scanning, onPickFiles, isTauriEnv }: Props) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-white p-16 text-center shadow-card">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#E0F7FA]">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1460A4" strokeWidth="1.6">
          <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5zM14 3v5h5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="15" r="2.5" />
          <path d="M12 12.5V9m0 9v-1.5" strokeLinecap="round" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-ink">扫描我的资料</h2>
      <p className="mt-2 max-w-md text-sm text-ink/55">
        选择包含签证材料的文件夹，或直接选择单个/多个材料文件（PDF / JPG / PNG / DOCX）
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <VButton size="lg" variant="secondary" onClick={onPickFiles} disabled={scanning}>
          {scanning ? '打开选择器…' : '📄 选文件扫描'}
        </VButton>
      </div>
      {!isTauriEnv && (
        <p className="mt-4 text-xs text-warning">桌面端才能弹出系统选择器，Web 模式仅演示</p>
      )}
    </div>
  )
}
