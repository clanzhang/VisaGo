// utils/date.ts
// 日期格式化与计算工具

export function formatDate(date: Date | string | number, locale = 'zh-CN'): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })
}

export function formatDateShort(date: Date | string | number, locale = 'zh-CN'): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(locale, { month: '2-digit', day: '2-digit' })
}

export function formatDateTime(date: Date | string | number, locale = 'zh-CN'): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function addDaysISO(dateISO: string, days: number): string {
  const d = addDays(new Date(dateISO), days)
  return d.toISOString().slice(0, 10)
}

export function diffDays(a: Date | string, b: Date | string): number {
  const da = typeof a === 'string' ? new Date(a) : a
  const db = typeof b === 'string' ? new Date(b) : b
  return Math.round((db.getTime() - da.getTime()) / 86400000)
}

export function daysFromNow(dateISO: string): number {
  return diffDays(new Date(), new Date(dateISO))
}

/**
 * 相对天数文案（双语，文案来自 i18n：tracker.dayToday/dayIn/dayAgo 等）。
 * @param dateISO 目标日期
 * @param t i18n 翻译函数（由调用方注入，utils 层不依赖 i18n）
 */
export function relativeDayLabel(
  dateISO: string,
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  const diff = daysFromNow(dateISO)
  if (diff === 0) return t('tracker.dayToday')
  if (diff === 1) return t('tracker.dayTomorrow')
  if (diff === -1) return t('tracker.dayYesterday')
  if (diff > 1) return t('tracker.dayIn', { n: diff })
  return t('tracker.dayAgo', { n: Math.abs(diff) })
}

export function dateRange(startISO: string, endISO: string): string[] {
  const dates: string[] = []
  let cur = new Date(startISO)
  const end = new Date(endISO)
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10))
    cur = addDays(cur, 1)
  }
  return dates
}
