// lib/photo-check.ts — 证件照合规性检测
// Tauri 桌面端：调 Rust kimi::chat_vision 真实识别图片并判定；
// Web 模式（无 IPC）：返回「待检测」占位，绝不编造通过/分数。
import { isTauri, checkMaterialImage } from '@/api/tauri'

export interface PhotoCheckResult {
  passed: boolean
  score: number // 0-100
  issues: string[]
}

/**
 * 证件照合规检测。
 * 检查：白底、面部居中完整、无遮挡、表情自然、无帽子墨镜、光线均匀、近6个月。
 * @param imageBase64 图片 base64（不含 data: 前缀）
 */
export async function checkPassportPhoto(imageBase64?: string): Promise<PhotoCheckResult> {
  if (!imageBase64) {
    return { passed: false, score: 0, issues: ['尚未上传图片，无法检测'] }
  }
  if (isTauri()) {
    try {
      const raw = await checkMaterialImage('photo', imageBase64)
      const passed = raw.passed === true
      const score = typeof raw.score === 'number' ? Math.max(0, Math.min(100, raw.score)) : 0
      const issues = Array.isArray(raw.issues) ? raw.issues.map(String) : []
      return { passed, score, issues }
    } catch (e) {
      // 识别失败：明确失败原因，不伪装通过
      return { passed: false, score: 0, issues: [`检测失败：${e instanceof Error ? e.message : String(e)}`] }
    }
  }
  // Web 模式无 IPC：诚实占位，不编造结果
  return { passed: false, score: 0, issues: ['Web 模式不支持图片检测，请在桌面端上传后检测'] }
}

/** 合规性检查项文案（用于 UI 展示） */
export const PHOTO_CHECKS = [
  '白色背景',
  '面部居中、完整可见',
  '无遮挡物',
  '表情自然',
  '未戴帽子/墨镜',
  '光线均匀',
  '近 6 个月内拍摄',
] as const

/** 裁剪为签证尺寸的参数（宽高比 35mm:45mm） */
export const VISA_PHOTO_RATIO = 35 / 45
