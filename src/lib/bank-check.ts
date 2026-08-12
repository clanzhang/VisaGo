// lib/bank-check.ts — 银行流水检查
// 上传后调 Kimi 多模态提取字段并判定；此处提供结构化判定封装。

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
 * @param imageBase64 流水图片/PDF base64（可选）
 * @param requiredMonths 需要覆盖的月数（默认 6）
 * @param minBalance 最低余额要求（默认 30000）
 * @param applicantName 申请人姓名（校验账户名是否匹配）
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
  // TODO: 调用 Kimi 多模态提取真实字段
  return {
    bank: '示例银行',
    accountName: applicantName ?? '',
    matchApplicant: true,
    coversRequired: false,
    balance: 0,
    largeTransfers: [],
    issues: [`已上传，等待 Kimi 解析（要求 ${requiredMonths} 个月 / 余额 ≥ ¥${minBalance}，当前为占位实现）`],
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
