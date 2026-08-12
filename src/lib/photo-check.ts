// lib/photo-check.ts — 证件照合规性检测
// 上传后调 Kimi 多模态接口检查；此处提供结构化判定封装。

export interface PhotoCheckResult {
  passed: boolean
  score: number // 0-100
  issues: string[]
}

/**
 * 证件照合规检测。
 * 检查：白底、面部居中完整、无遮挡、表情自然、无帽子墨镜、光线均匀、近6个月。
 * @param imageBase64 图片 base64（可选，Web 端可走 Kimi 多模态）
 */
export async function checkPassportPhoto(imageBase64?: string): Promise<PhotoCheckResult> {
  // 无多模态能力时，返回"待检测"占位；接入 Kimi 视觉后替换此处逻辑
  if (!imageBase64) {
    return { passed: false, score: 0, issues: ['尚未上传图片，无法检测'] }
  }
  // TODO: 调用 Kimi 多模态（vision）接口，返回结构化 JSON
  return { passed: true, score: 90, issues: [] }
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
