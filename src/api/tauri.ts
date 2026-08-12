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

export function scanFolder(path: string): Promise<ScanResult> {
  return invoke<ScanResult>('scan_folder', { path })
}

export function scanFiles(paths: string[]): Promise<ScanResult> {
  return invoke<ScanResult>('scan_files', { paths })
}

// ===== 系统对话框（plugin-dialog）=====

/**
 * 弹系统文件夹选择器，让用户选要扫描的文件夹。
 * 返回选中的路径，取消返回 null。
 */
export async function pickFolder(title = '选择包含签证材料的文件夹'): Promise<string | null> {
  if (!isTauri()) return null
  const { open } = await import('@tauri-apps/plugin-dialog')
  const selected = await open({
    directory: true, // 选文件夹
    multiple: false, // 只选一个
    title,
  })
  return typeof selected === 'string' ? selected : null
}

/**
 * 弹系统文件选择器，让用户选单个或多个材料文件。
 * 返回路径数组，取消返回 null。
 */
export async function pickFiles(
  multiple = true,
  title = '选择签证材料文件（PDF/图片/DOCX）',
): Promise<string[] | null> {
  if (!isTauri()) return null
  const { open } = await import('@tauri-apps/plugin-dialog')
  const selected = await open({
    directory: false, // 选文件
    multiple,
    title,
    filters: [
      {
        name: '材料文件',
        extensions: ['pdf', 'jpg', 'jpeg', 'png', 'docx', 'doc'],
      },
    ],
  })
  if (selected === null) return null
  return Array.isArray(selected) ? selected : [selected]
}

export function recognizeFile(path: string, name: string): Promise<RecognizeResult> {
  return invoke<RecognizeResult>('recognize_file', { path, name })
}

// ===== 资料卡（多用户资料管理）=====

/** 资料卡（对应 Rust store::ProfileCard，snake_case 字段） */
export interface ProfileCard {
  id: string // profile_001
  name: string // 用户命名
  fields: Record<string, unknown> // 提取/填写的字段（snake_case）
  created_at: string
  updated_at: string
}

export function listProfiles(): Promise<ProfileCard[]> {
  return invoke<ProfileCard[]>('list_profiles')
}

export function createProfile(name: string): Promise<ProfileCard> {
  return invoke<ProfileCard>('create_profile', { name })
}

export function saveProfileCard(card: ProfileCard): Promise<void> {
  return invoke<void>('save_profile_card', { card })
}

export function deleteProfile(id: string): Promise<void> {
  return invoke<void>('delete_profile', { id })
}

export function getActiveProfileId(): Promise<string | null> {
  return invoke<string | null>('get_active_profile_id')
}

export function setActiveProfileId(id: string | null): Promise<void> {
  return invoke<void>('set_active_profile_id', { id })
}

// ===== 用户资料 =====

/**
 * 保存用户资料到 Rust 端（snake_case 结构）。
 * 前端可能传 camelCase 或 snake_case，这里统一归一化并补全缺失字段，
 * 避免 serde 反序列化失败导致保存失败。
 */
export function saveProfile(profile: UserProfile | Record<string, unknown>): Promise<void> {
  const src = (profile ?? {}) as Record<string, unknown>
  const str = (v: unknown): string => {
    if (v === null || v === undefined) return ''
    const s = String(v).trim()
    return s === 'null' || s === 'undefined' ? '' : s
  }
  const data = {
    name: str(src.name ?? src['name']),
    passport_number: str(src.passport_number ?? src.passportNumber),
    nationality: str(src.nationality ?? src['nationality']),
    birth_date: str(src.birth_date ?? src.birthDate),
    gender: str(src.gender ?? src['gender']),
    id_number: str(src.id_number ?? src.idNumber),
    phone: str(src.phone ?? src['phone']),
    address: str(src.address ?? src['address'] ?? src.home_address ?? src.homeAddress),
    home_province: str(src.home_province ?? src.homeProvince),
    occupation: str(src.occupation ?? src['occupation']),
    company: str(src.company ?? src['company']),
    position: str(src.position ?? src['position']),
    salary: str(src.salary ?? src['salary']),
    passport_issued_in: str(src.passport_issued_in ?? src.passportIssuedIn),
    has_history_visa: Boolean(src.has_history_visa ?? src.hasHistoryVisa ?? false),
  }
  console.log('[saveProfile] 发送数据:', JSON.stringify(data))
  return invoke<void>('save_profile', { profile: data })
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
