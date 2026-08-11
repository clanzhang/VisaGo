// pages/Scan.tsx — 桌面端三步走：扫描资料 → 核对信息 → 生成结果
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { VButton, VBadge } from '@/components/common'
import { useAppStore } from '@/stores/appStore'
import {
  scanFolder,
  scanFiles,
  pickFolder,
  pickFiles,
  recognizeFile,
  saveProfile,
  exportPdf,
  kimiChat,
  isTauri,
  type ScanResult,
  type RecognizeResult,
} from '@/api/tauri'

type Step = 1 | 2 | 3

interface RecognizedItem {
  path: string
  name: string
  fileType: string
  category: string
  fields: Record<string, string>
  summary: string
  status: 'pending' | 'recognizing' | 'done' | 'error'
  error?: string
}

// 材料字段规范（用于核对表单 + 缺失检测）
const FIELD_SPECS = [
  { key: 'name', label: '姓名', required: true },
  { key: 'passport_number', label: '护照号', required: true },
  { key: 'id_number', label: '身份证号', required: true },
  { key: 'nationality', label: '国籍', required: true },
  { key: 'birth_date', label: '出生日期', required: true },
  { key: 'gender', label: '性别', required: false },
  { key: 'phone', label: '手机号', required: false },
  { key: 'address', label: '家庭住址', required: false },
  { key: 'home_province', label: '户籍省份', required: true },
  { key: 'occupation', label: '职业', required: true },
  { key: 'company', label: '工作单位', required: false },
  { key: 'position', label: '职位', required: false },
  { key: 'salary', label: '月薪', required: false },
]

export default function Scan() {
  const { toast } = useAppStore()
  const [step, setStep] = useState<Step>(1)
  const [folder, setFolder] = useState('')
  const [items, setItems] = useState<RecognizedItem[]>([])
  const [scanning, setScanning] = useState(false)
  const [recognizingAll, setRecognizingAll] = useState(false)

  // 核对表单（从识别结果汇总）
  const [profile, setProfile] = useState<Record<string, string>>({})

  // 出结果：选国家/签证类型
  const [country, setCountry] = useState('日本')
  const [visaType, setVisaType] = useState('旅游签证')
  const [docType, setDocType] = useState<'itinerary' | 'employment' | 'cover'>('itinerary')
  const [generated, setGenerated] = useState('')
  const [generating, setGenerating] = useState(false)

  const tauriEnv = isTauri()

  // 用 ref 跟踪 items，供追加合并与导航重置使用
  const itemsRef = useRef<RecognizedItem[]>([])
  useEffect(() => {
    itemsRef.current = items
  }, [items])

  // 侧边栏/导航再次进入「材料扫描」时，重置到文件列表页（保留已扫描文件）
  const location = useLocation()
  const navKeyRef = useRef(location.key)
  useEffect(() => {
    if (location.pathname === '/scan' && location.key !== navKeyRef.current) {
      navKeyRef.current = location.key
      setStep(itemsRef.current.length > 0 ? 2 : 1)
    }
  }, [location.pathname, location.key])

  // 侧边栏点击「材料扫描」事件：回到文件列表页（保留已扫描文件，可追加）
  useEffect(() => {
    const handler = () => {
      console.log('[Scan] 收到侧边栏重置事件，回到文件列表页')
      setStep(itemsRef.current.length > 0 ? 2 : 1)
    }
    window.addEventListener('visago:reset-scan', handler)
    return () => window.removeEventListener('visago:reset-scan', handler)
  }, [])

  // ===== 第一步：扫描 =====

  /** 弹系统文件夹选择器，选文件夹后扫描 */
  async function handlePickFolder() {
    if (!tauriEnv) {
      toast('请使用 Tauri 桌面端进行扫描', 'warning')
      return
    }
    setScanning(true)
    try {
      console.log('[Scan] 弹文件夹选择器...')
      const folder = await pickFolder()
      if (!folder) {
        console.log('[Scan] 用户取消了文件夹选择')
        setScanning(false)
        return
      }
      console.log('[Scan] 用户选择文件夹:', folder)
      const result: ScanResult = await scanFolder(folder)
      applyScanResult(result)
    } catch (e) {
      console.error('[Scan] 扫描失败:', e)
      toast(e instanceof Error ? e.message : `扫描失败: ${String(e)}`, 'error')
    } finally {
      setScanning(false)
    }
  }

  /** 弹系统文件选择器，选单个或多个文件后扫描 */
  async function handlePickFiles() {
    if (!tauriEnv) {
      toast('请使用 Tauri 桌面端进行扫描', 'warning')
      return
    }
    setScanning(true)
    try {
      console.log('[Scan] 弹文件选择器...')
      const files = await pickFiles(true)
      if (!files || files.length === 0) {
        console.log('[Scan] 用户取消了文件选择')
        setScanning(false)
        return
      }
      console.log('[Scan] 用户选择文件数:', files.length)
      const result: ScanResult = await scanFiles(files)
      applyScanResult(result)
    } catch (e) {
      console.error('[Scan] 扫描失败:', e)
      toast(e instanceof Error ? e.message : `扫描失败: ${String(e)}`, 'error')
    } finally {
      setScanning(false)
    }
  }

  /** 把扫描结果应用到状态；append=true 时追加（去重）而非覆盖 */
  function applyScanResult(result: ScanResult, append = false) {
    const base = append ? itemsRef.current : []
    const existing = new Set(base.map((i) => i.path))
    const fresh = result.files
      .filter((f) => !existing.has(f.path))
      .map((f) => ({
        path: f.path,
        name: f.name,
        fileType: f.file_type,
        category: '',
        fields: {},
        summary: '',
        status: 'pending' as const,
      }))
    const merged = [...base, ...fresh]
    setItems(merged)
    if (!append) setFolder(result.folder)

    if (result.files.length === 0) {
      if (!append) toast('未找到支持的材料文件（pdf/jpg/png/docx/doc）', 'warning')
      return
    }
    setStep(2)
    if (append) {
      toast(`追加 ${fresh.length} 个文件`, 'success')
      if (fresh.length > 0) {
        void handleRecognizeAllFresh(fresh)
      }
    } else {
      toast(`找到 ${fresh.length} 个文件`, 'success')
    }
  }

  /** 追加更多文件：重新弹选择器，新文件追加到列表并自动识别 */
  async function handleAddMore() {
    if (!tauriEnv) {
      toast('请使用 Tauri 桌面端进行扫描', 'warning')
      return
    }
    setScanning(true)
    try {
      console.log('[Scan] 追加：弹文件选择器...')
      const files = await pickFiles(true, '选择要追加的材料文件（可多选）')
      if (!files || files.length === 0) {
        setScanning(false)
        return
      }
      console.log('[Scan] 追加：用户选择', files.length, '个文件')
      const result: ScanResult = await scanFiles(files)
      applyScanResult(result, true)
    } catch (e) {
      console.error('[Scan] 追加失败:', e)
      toast(e instanceof Error ? e.message : '追加扫描失败', 'error')
    } finally {
      setScanning(false)
    }
  }

  // 识别单个文件
  async function handleRecognize(item: RecognizedItem) {
    setItems((prev) =>
      prev.map((x) => (x.path === item.path ? { ...x, status: 'recognizing' } : x)),
    )
    try {
      console.log('[Scan] 调用 recognize_file:', item.name)
      const res: RecognizeResult = await recognizeFile(item.path, item.name)
      console.log('[Scan] recognize_file 成功:', res)
      setItems((prev) =>
        prev.map((x) =>
          x.path === item.path
            ? {
                ...x,
                category: res.category,
                fields: (res.fields ?? {}) as Record<string, string>,
                summary: res.summary,
                status: 'done',
              }
            : x,
        ),
      )
    } catch (e) {
      console.error('[Scan] recognize_file 失败:', item.name, e)
      setItems((prev) =>
        prev.map((x) =>
          x.path === item.path
            ? { ...x, status: 'error', error: e instanceof Error ? `${e.name}: ${e.message}` : '识别失败' }
            : x,
        ),
      )
    }
  }

  // 识别全部（串行）
  async function handleRecognizeAll() {
    setRecognizingAll(true)
    const pending = items.filter((x) => x.status === 'pending' || x.status === 'error')
    for (const item of pending) {
      await handleRecognize(item)
    }
    setRecognizingAll(false)
    toast('识别完成', 'success')
  }

  // 追加后自动识别一组新文件（串行）
  async function handleRecognizeAllFresh(fresh: RecognizedItem[]) {
    setRecognizingAll(true)
    for (const item of fresh) {
      await handleRecognize(item)
    }
    setRecognizingAll(false)
    toast('追加文件识别完成', 'success')
  }

  // 从识别结果聚合字段到核对表单
  async function handleNextToConfirm() {
    const merged: Record<string, string> = {}
    // Kimi 返回的字段键与 FIELD_SPECS 一致（name/passport_number 等英文键）
    const fieldKeys = FIELD_SPECS.map((f) => f.key)
    for (const item of items) {
      if (item.status !== 'done') continue
      const fields = (item.fields ?? {}) as Record<string, unknown>
      for (const k of fieldKeys) {
        // 已填过则跳过（后续文件不覆盖）
        if (merged[k]) continue
        const v = fields[k]
        if (v === null || v === undefined) continue
        const clean = String(v).trim()
        if (clean && clean !== 'null' && clean !== '暂无' && !merged[k]) {
          merged[k] = clean
        }
      }
    }
    setProfile(merged)
    setStep(3)
  }

  async function handleSaveProfile() {
    try {
      console.log('[Scan] handleSaveProfile 被调用，profile=', profile)
      await saveProfile(profile)
      toast('资料已保存', 'success')
    } catch (e) {
      console.error('[Scan] 保存失败:', e)
      const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
      toast(`保存失败: ${msg}`, 'error')
    }
  }

  // ===== 第三步：生成 =====
  async function handleGenerate() {
    setGenerating(true)
    setGenerated('')
    try {
      const info = Object.entries(profile)
        .map(([k, v]) => `${FIELD_SPECS.find((f) => f.key === k)?.label ?? k}: ${v}`)
        .join('\n')
      const docName = docType === 'itinerary' ? '行程单' : docType === 'employment' ? '在职证明' : '解释信'
      const prompt = `根据以下用户信息，生成${docName}。要求：正式、符合签证申请规范、中英文各一版。\n\n用户信息：\n${info}\n\n申请：${country} ${visaType}`
      const content = await kimiChat(prompt)
      setGenerated(content)
    } catch (e) {
      toast(e instanceof Error ? e.message : '生成失败', 'error')
    } finally {
      setGenerating(false)
    }
  }

  async function handleExport() {
    try {
      const path = await exportPdf(`<html><body><pre>${generated}</pre></body></html>`, `${country}-${docType}`)
      toast(`已导出: ${path}`, 'success')
    } catch (e) {
      toast(e instanceof Error ? e.message : '导出失败', 'error')
    }
  }

  // 材料缺失检测
  const missingFields = useMemo(
    () => FIELD_SPECS.filter((f) => f.required && !profile[f.key]),
    [profile],
  )

  const recognizedCount = items.filter((x) => x.status === 'done').length

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">材料扫描助手</h1>
          <p className="mt-1 text-base font-medium text-subtle">
            选文件夹 → 自动识别 → 核对信息 → 生成材料
          </p>
        </div>
        {!tauriEnv && (
          <VBadge tone="warning">当前为 Web 模式，需在 Tauri 桌面端使用完整功能</VBadge>
        )}
      </div>

      {/* 步骤指示器 */}
      <div className="flex items-center gap-2">
        {(['扫描', '核对', '出结果'] as const).map((label, i) => {
          const n = (i + 1) as Step
          return (
            <div key={label} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  n < step ? 'bg-success text-white' : n === step ? 'bg-primary text-white' : 'bg-ink/8 text-ink/40'
                }`}
              >
                {n < step ? '✓' : n}
              </div>
              <span className={`text-sm ${n <= step ? 'font-medium text-ink' : 'text-ink/40'}`}>{label}</span>
              {i < 2 && <div className={`h-0.5 flex-1 ${n < step ? 'bg-success' : 'bg-ink/8'}`} />}
            </div>
          )
        })}
      </div>

      {/* ===== 第一步：扫描 ===== */}
      {step === 1 && (
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
            <VButton size="lg" onClick={handlePickFolder} disabled={scanning}>
              {scanning ? '打开选择器…' : '📁 选文件夹扫描'}
            </VButton>
            <VButton size="lg" variant="secondary" onClick={handlePickFiles} disabled={scanning}>
              {scanning ? '打开选择器…' : '📄 选文件扫描'}
            </VButton>
          </div>
          {!tauriEnv && (
            <p className="mt-4 text-xs text-warning">桌面端才能弹出系统选择器，Web 模式仅演示</p>
          )}
        </div>
      )}

      {/* ===== 第二步：文件列表 + 核对表单 ===== */}
      {step === 2 && (
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl bg-white p-6 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-ink">已扫描文件</h2>
                <p className="text-xs text-ink/45">
                  共 {items.length} 个文件{items.length > 0 && ` · ${folder}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <VButton size="sm" variant="secondary" onClick={handleAddMore} disabled={scanning}>
                  {scanning ? '选择器中…' : '+ 添加更多文件'}
                </VButton>
                <VButton size="sm" onClick={handleRecognizeAll} disabled={recognizingAll}>
                  {recognizingAll ? '识别中…' : `🤖 识别全部 (${recognizedCount}/${items.length})`}
                </VButton>
              </div>
            </div>

            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.path} className="flex items-center gap-3 rounded-xl border border-ink/5 px-4 py-3">
                  <span className="text-lg">📄</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink">{item.name}</div>
                    <div className="text-xs text-ink/40">
                      {item.fileType.toUpperCase()} · {item.category || '未识别'}
                    </div>
                  </div>
                  {item.status === 'pending' && (
                    <VButton size="sm" variant="secondary" onClick={() => handleRecognize(item)}>
                      识别
                    </VButton>
                  )}
                  {item.status === 'recognizing' && (
                    <span className="flex items-center gap-1.5 text-xs text-ink/50">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#39A2B8] border-t-transparent" />
                      识别中
                    </span>
                  )}
                  {item.status === 'done' && (
                    <VBadge tone="success">✓ {item.category}</VBadge>
                  )}
                  {item.status === 'error' && (
                    <VBadge tone="danger">{item.error}</VBadge>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <VButton onClick={handleNextToConfirm} disabled={recognizedCount === 0}>
                下一步：核对信息 →
              </VButton>
            </div>
          </div>
        </div>
      )}

      {/* ===== 第三步：出结果（核对表单 + 生成） ===== */}
      {step === 3 && (
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl bg-white p-6 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">核对自动提取的信息</h2>
              <div className="flex gap-2">
                <VButton variant="secondary" size="sm" onClick={handleSaveProfile}>
                  💾 保存
                </VButton>
                <VButton size="sm" onClick={() => setStep(2)}>
                  返回文件列表
                </VButton>
              </div>
            </div>

            {/* 缺失提示 */}
            {missingFields.length > 0 && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <div className="text-sm font-semibold text-amber-700">
                  文件中未找到 {missingFields.length} 项信息，请核对或补充：
                </div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {missingFields.map((f) => (
                    <span key={f.key} className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-amber-700">
                      {f.label}（文件中未找到）
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-xs text-amber-600/70">
                  💡 提示：可补充扫描身份证/护照/户口本等材料自动获取，或在下方手动补填
                </p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {FIELD_SPECS.map((f) => {
                const filled = !!profile[f.key]
                return (
                  <div key={f.key} className={`rounded-xl border p-4 ${filled ? 'border-success/30 bg-success/5' : 'border-red-200 bg-red-50/50'}`}>
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${filled ? 'bg-success' : 'bg-red-400'}`} />
                      <label className="text-sm font-medium text-ink">
                        {f.label} {f.required && <span className="text-red-500">*</span>}
                      </label>
                      {!filled && (
                        <span className="ml-auto text-[11px] text-red-500/70">文件中未找到</span>
                      )}
                    </div>
                    <input
                      value={profile[f.key] ?? ''}
                      onChange={(e) => setProfile({ ...profile, [f.key]: e.target.value })}
                      placeholder={filled ? (f.required ? '必填' : '选填') : '文件中未找到，请补充'}
                      className="w-full rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm outline-none focus:border-primary/40"
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* 生成材料 */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl bg-white p-6 shadow-card">
              <h2 className="mb-4 text-lg font-bold text-ink">选择申请目标</h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink/60">国家</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40"
                  >
                    {['日本', '韩国', '泰国', '申根', '美国', '英国', '澳大利亚'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink/60">签证类型</label>
                  <select
                    value={visaType}
                    onChange={(e) => setVisaType(e.target.value)}
                    className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40"
                  >
                    {['旅游签证', '商务签证', '探亲签证', '学生签证'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink/60">生成文档类型</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['itinerary', 'employment', 'cover'] as const).map((dt) => (
                      <button
                        key={dt}
                        onClick={() => setDocType(dt)}
                        className={`rounded-lg border-2 px-2 py-2 text-xs font-medium transition-all ${
                          docType === dt ? 'border-primary bg-primary/5 text-primary' : 'border-ink/10 text-ink/55'
                        }`}
                      >
                        {dt === 'itinerary' ? '行程单' : dt === 'employment' ? '在职证明' : '解释信'}
                      </button>
                    ))}
                  </div>
                </div>
                <VButton className="w-full" onClick={handleGenerate} disabled={generating}>
                  {generating ? '生成中…' : '✨ AI 生成材料'}
                </VButton>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-card">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-ink">生成结果</h2>
                {generated && (
                  <VButton variant="secondary" size="sm" onClick={handleExport}>
                    ⬇️ 导出 PDF
                  </VButton>
                )}
              </div>
              {generated ? (
                <pre className="max-h-[480px] overflow-y-auto whitespace-pre-wrap rounded-xl bg-[#F9F9F6] p-4 text-sm leading-relaxed text-ink/75">
                  {generated}
                </pre>
              ) : (
                <div className="flex h-64 items-center justify-center rounded-xl bg-[#F9F9F6] text-sm text-ink/40">
                  点击「AI 生成材料」获取文档
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
