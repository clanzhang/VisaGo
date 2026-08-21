// lib/bank-check.ts — 银行流水检查
// Tauri 桌面端：调 Rust kimi::chat_vision 真实提取流水字段并判定；
// Web 模式（无 IPC）：返回「待检测」占位，绝不编造「示例银行/账户匹配」。
import { isTauri, checkMaterialImage } from '@/api/tauri'

export interface BankCheckResult {
  bank: string
  accountName: string
  matchApplicant: boolean
  coversRequired: boolean
  balance: number
  largeTransfers: { date: string; amount: number; note: string }[]
  issues: string[]
}

/**
 * 银行流水检查。
 * 提取：银行名、账户名、时间范围、最终余额、大额异常转入。
 * @param imageBase64 流水图片/PDF base64（不含 data: 前缀）
 * @param opts.requiredMonths 需要覆盖的月数（默认 6）
 * @param opts.minBalance 最低余额要求（默认 30000）
 * @param opts.applicantName 申请人姓名（校验账户名是否匹配）
 */
export async function checkBankStatement(
  imageBase64?: string,
  opts?: { requiredMonths?: number; minBalance?: number; applicantName?: string },
): Promise<BankCheckResult> {
  const requiredMonths = opts?.requiredMonths ?? 6
  const minBalance = opts?.minBalance ?? 30000
  const applicantName = opts?.applicantName
  if (!imageBase64) {
    return {
      bank: '',
      accountName: '',
      matchApplicant: false,
      coversRequired: false,
      balance: 0,
      largeTransfers: [],
      issues: ['尚未上传银行流水'],
    }
  }
  if (isTauri()) {
    try {
      const raw = await checkMaterialImage('bank', imageBase64, applicantName)
      const toNum = (v: unknown) => (typeof v === 'number' ? v : Number(v) || 0)
      return {
        bank: typeof raw.bank === 'string' ? raw.bank : '',
        accountName: typeof raw.account_name === 'string' ? raw.account_name : '',
        matchApplicant: raw.match_applicant === true,
        coversRequired: raw.covers_required === true,
        balance: toNum(raw.balance),
        largeTransfers: Array.isArray(raw.large_transfers)
          ? (raw.large_transfers as { date?: unknown; amount?: unknown; note?: unknown }[]).map((t) => ({
              date: String(t.date ?? ''),
              amount: toNum(t.amount),
              note: String(t.note ?? ''),
            }))
          : [],
        issues: Array.isArray(raw.issues) ? raw.issues.map(String) : [],
      }
    } catch (e) {
      return {
        bank: '',
        accountName: '',
        matchApplicant: false,
        coversRequired: false,
        balance: 0,
        largeTransfers: [],
        issues: [`检测失败：${e instanceof Error ? e.message : String(e)}`],
      }
    }
  }
  // Web 模式无 IPC：诚实占位，不编造结果
  return {
    bank: '',
    accountName: '',
    matchApplicant: false,
    coversRequired: false,
    balance: 0,
    largeTransfers: [],
    issues: [`已上传，等待桌面端解析（要求 ${requiredMonths} 个月 / 余额 ≥ ¥${minBalance}）`],
  }
}

/** 银行 APP 导出流水操作指引（用于弹窗截图步骤） */
export const BANK_EXPORT_STEPS = [
  '打开手机银行 APP 并登录',
  '进入「我的」→「账户查询/交易明细」',
  '选择近 6 个月时间范围',
  '点击「导出/下载」→ 选择 PDF 或图片格式',
  '将导出文件发送到电脑（微信/隔空投送）',
  '在 VisaGo 上传该文件',
] as const
