// src/utils/log.ts — 前端调试日志 helper
// 生产构建完全静默；开发环境需 localStorage 开关
// 用法: import { debug } from '@/utils/log'

const DEBUG_ENABLED =
  typeof window !== 'undefined' &&
  import.meta.env.DEV &&
  localStorage.getItem('visago:debug') === 'true'

/** 调试日志：仅在 DEV + localStorage 开关打开时输出 */
export function debug(...args: unknown[]) {
  if (DEBUG_ENABLED) {
    // eslint-disable-next-line no-console
    console.log('[DEBUG]', ...args)
  }
}