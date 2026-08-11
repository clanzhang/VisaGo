// api/tauri.ts — Tauri 桌面端 IPC 桥接层
// 通过 window.__TAURI__ 调用 Rust 命令（无需 @tauri-apps/api 包）
import type { UserProfile } from '@/types'

export function isTauri(): boolean {
  const w = window as unknown as Record<string, unknown>
  return (
    typeof w.__TAURI_INTERNALS__ !== 'undefined' ||
    typeof w.__TAURI__ !== 'undefined' ||
    typeof w.ipc !== 'undefined' ||
    typeof w.invoke === 'function'
  )
}

interface TauriCore {
  invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>
}

function core(): TauriCore {
  const w = window as unknown as {
    __TAURI__?: { core?: TauriCore }
    __TAURI_INTERNALS__?: { invoke?: TauriCore['invoke'] }
    invoke?: TauriCore['invoke']
  }
  if (w.__TAURI__?.core?.invoke) return w.__TAURI__.core
  if (typeof w.__TAURI_INTERNALS__?.invoke === 'function') {
    return { invoke: w.__TAURI_INTERNALS__.invoke }
  }
  if (typeof w.invoke === 'function') return { invoke: w.invoke }
  throw new Error('Tauri IPC 不可用：window.__TAURI__ / invoke 未注入')
}

export function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  return core().invoke(cmd, args ?? {}) as Promise<T>
}

// ===== 文件扫描与识别 =====

export interface ScannedFileInfo {
  path: string
  name: string
  file_type: string
  size: number
}

export interface ScanResult {
  folder: string
  files: ScannedFileInfo[]
}

export interface RecognizeResult {
  path: string
  name: string
  category: string
  fields: Record<string, string>
  summary: string
}

export function scanFolder(): Promise<ScanResult> {
  return invoke<ScanResult>('scan_folder')
}

export function recognizeFile(path: string, name: string): Promise<RecognizeResult> {
  return invoke<RecognizeResult>('recognize_file', { path, name })
}

// ===== 用户资料 =====

export function saveProfile(profile: UserProfile): Promise<void> {
  return invoke<void>('save_profile', { profile })
}

export function loadProfile(): Promise<UserProfile | null> {
  return invoke<UserProfile | null>('load_profile')
}

// ===== Kimi =====

export function kimiChat(prompt: string): Promise<string> {
  return invoke<string>('kimi_chat', { prompt })
}

// ===== PDF =====

export function exportPdf(html: string, filename: string): Promise<string> {
  return invoke<string>('export_pdf', { html, filename })
}
