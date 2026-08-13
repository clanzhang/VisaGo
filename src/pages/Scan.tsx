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
  exportPdf,
  kimiChat,
  isTauri,
  listProfiles,
  createProfile,
  saveProfileCard,
  deleteProfile,
  getActiveProfileId,
  setActiveProfileId,
  type ScanResult,
  type RecognizeResult,
  type ProfileCard,
} from '@/api/tauri'

type Step = 1 | 2 | 3

interface RecognizedItem {
  path: string
  name: string
  fileType: string
  category: string
  fields: Record<string, unknown>
  summary: string
  status: 'pending' | 'recognizing' | 'done' | 'error'
  error?: string
}

// 从文件提取的行程数据（识别行程单时填充）
interface TripData {
  destination?: string
  start_date?: string
  end_date?: string
  days?: number
  cities?: string[]
  daily_plan?: { day?: number; date?: string; city?: string; activity?: string; transport?: string; accommodation?: string }[]
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

  // 从识别结果提取的行程数据（用于生成行程单）
  const [tripData, setTripData] = useState<TripData | null>(null)

  // 出结果：选国家/签证类型
  const [country, setCountry] = useState('日本')
  const [visaType, setVisaType] = useState('旅游签证')
  const [docType, setDocType] = useState<'itinerary' | 'employment' | 'cover'>('itinerary')
  const [generated, setGenerated] = useState('')
  const [generating, setGenerating] = useState(false)

  const tauriEnv = isTauri()

  // ===== 资料卡（多用户资料）=====
  const [cards, setCards] = useState<ProfileCard[]>([])
  const [activeCardId, setActiveCardId] = useState<string | null>(null)
  const [showNameDialog, setShowNameDialog] = useState(false)
  const [newCardName, setNewCardName] = useState('')

  // 加载资料卡列表与活跃卡
  useEffect(() => {
    if (!tauriEnv) return
    ;(async () => {
      try {
        const list = await listProfiles()
        setCards(list)
        const active = await getActiveProfileId()
        setActiveCardId(active)
      } catch (e) {
        console.warn('[Scan] 加载资料卡失败:', e)
      }
    })()
  }, [tauriEnv])

  // 新建资料卡
  async function handleCreateProfile() {
    if (!tauriEnv) {
      toast('请使用 Tauri 桌面端管理资料卡', 'warning')
      return
    }
    try {
      const card = await createProfile(newCardName.trim() || '')
      setCards((prev) => [...prev, card])
      setActiveCardId(card.id)
      await setActiveProfileId(card.id)
      setShowNameDialog(false)
      setNewCardName('')
      toast(`已创建「${card.name}」`, 'success')
    } catch (e) {
      toast(e instanceof Error ? e.message : '创建失败', 'error')
    }
  }

  // 切换活跃资料卡
  async function handleSwitchCard(id: string) {
    setActiveCardId(id)
    try {
      await setActiveProfileId(id)
      toast('已切换到该资料卡', 'success')
    } catch (e) {
      console.warn('[Scan] 切换活跃卡失败:', e)
    }
  }

  // 删除资料卡
  async function handleDeleteCard(card: ProfileCard) {
    if (!window.confirm(`确定删除「${card.name}」？此操作不可恢复。`)) return
    try {
      await deleteProfile(card.id)
      setCards((prev) => prev.filter((c) => c.id !== card.id))
      if (activeCardId === card.id) {
        setActiveCardId(null)
        await setActiveProfileId(null)
      }
      toast('资料卡已删除', 'success')
    } catch (e) {
      toast(e instanceof Error ? e.message : '删除失败', 'error')
    }
  }

  // 保存核对资料到当前活跃资料卡
  async function handleSaveToCard(cardName?: string) {
    if (!tauriEnv) {
      toast('请使用 Tauri 桌面端保存', 'warning')
      return
    }
    try {
      // 若没有活跃卡，自动新建一张
      let id = activeCardId
      let cardsNow = cards
      if (!id) {
        const card = await createProfile(cardName ?? '')
        cardsNow = [...cards, card]
        setCards(cardsNow)
        id = card.id
        setActiveCardId(id)
        await setActiveProfileId(id)
      }
      // 更新卡片字段（snake_case，与 Rust UserProfile 一致）
      const target = cardsNow.find((c) => c.id === id)
      if (!target) return
      const fields: Record<string, unknown> = { ...profile }
      // 姓名兜底
      if (!fields['name'] && cardName) fields['name'] = cardName
      await saveProfileCard({ ...target, fields })
      // 同步更新列表
      setCards((prev) => prev.map((c) => (c.id === id ? { ...c, fields, updated_at: new Date().toISOString() } : c)))
      toast('已保存到资料卡', 'success')
    } catch (e) {
      console.error('[Scan] 保存资料卡失败:', e)
      toast(e instanceof Error ? e.message : '保存失败', 'error')
    }
  }

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
    // 字段名归一化：Kimi 可能返回的别名 → 前端期望的 key
    const FIELD_ALIASES: Record<string, string> = {
      home_address: 'address',
      full_name: 'name',
      phone_number: 'phone',
      passport_no: 'passport_number',
      id_card: 'id_number',
      date_of_birth: 'birth_date',
      province: 'home_province',
      employer: 'company',
      job_title: 'position',
      monthly_salary: 'salary',
      work_unit: 'company',
      address: 'address',
    }
    let trip: TripData | null = null
    for (const item of items) {
      if (item.status !== 'done') continue
      const fields = (item.fields ?? {}) as Record<string, unknown>
      // 调试：打印 Kimi 返回的字段 keys，对比前端期望
      console.log('[Scan] 文件识别返回 keys:', item.name, Object.keys(fields))
      console.log('[Scan] 前端期望 keys:', fieldKeys)
      // 提取行程数据（识别为行程单的文件）
      const rawTrip = fields['trip']
      if (rawTrip && typeof rawTrip === 'object' && !Array.isArray(rawTrip)) {
        trip = rawTrip as TripData
        console.log('[Scan] 识别到行程数据:', trip)
      }
      // 先按别名归一化，再按 FIELD_SPECS 取 key
      const normalized: Record<string, unknown> = { ...fields }
      for (const [alias, key] of Object.entries(FIELD_ALIASES)) {
        if (alias !== key && normalized[alias] !== undefined && normalized[key] === undefined) {
          normalized[key] = normalized[alias]
        }
      }
      for (const k of fieldKeys) {
        // 已填过则跳过（后续文件不覆盖）
        if (merged[k]) continue
        const v = normalized[k]
        if (v === null || v === undefined) continue
        const clean = String(v).trim()
        if (clean && clean !== 'null' && clean !== '暂无' && !merged[k]) {
          merged[k] = clean
        }
      }
    }
    setProfile(merged)
    setTripData(trip)
    setStep(3)
  }

  async function handleSaveProfile() {
    try {
      console.log('[Scan] handleSaveProfile 被调用，profile=', profile)
      await handleSaveToCard()
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

      // 行程单：把识别出的真实行程数据传给 Kimi，避免占位符
      let tripSection = ''
      if (docType === 'itinerary') {
        if (tripData) {
          const daysText = (tripData.daily_plan ?? [])
            .map((d) => `第${d.day ?? '?'}天(${d.date ?? ''}) ${d.city ?? ''}: ${d.activity ?? ''}${d.transport ? `【交通:${d.transport}】` : ''}${d.accommodation ? `【住宿:${d.accommodation}】` : ''}`)
            .join('\n')
          tripSection = `\n\n已从用户上传的行程文件提取到的真实行程数据（务必使用这些数据，不要用占位符或编造）：\n`
            + `出发日期：${tripData.start_date ?? '未知'}\n`
            + `返回日期：${tripData.end_date ?? '未知'}\n`
            + `目的地：${tripData.destination ?? country}\n`
            + `天数：${tripData.days ?? (tripData.daily_plan?.length ?? '未知')}\n`
            + `城市：${(tripData.cities ?? []).join('、') || '未知'}\n`
            + `每日安排：\n${daysText || '（文件中无每日明细）'}`
        } else {
          tripSection = '\n\n（注意：未识别到行程文件。如用户上传了行程单请据实生成，不要使用 [具体日期]/[具体天数] 占位符；行程信息不完整时请用合理假设并标注。）'
        }
      }

      console.log('[Scan] handleGenerate tripData=', tripData)
      const prompt = `根据以下用户信息，生成${docName}。要求：正式、符合签证申请规范、中英文各一版。\n\n用户信息：\n${info}\n\n申请：${country} ${visaType}${tripSection}`
      const content = await kimiChat(prompt)
      console.log('[Scan] 生成完成，长度:', content.length)
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

      {/* 资料卡列表（多用户资料） */}
      <div className="rounded-2xl bg-white p-5 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-ink">👤 资料卡</h2>
            <p className="text-xs text-ink/45">每次扫描保存为一张资料卡，切换即可使用不同人（如自己 / 家人）的资料</p>
          </div>
          <VButton size="sm" onClick={() => setShowNameDialog(true)}>
            ＋ 新建资料卡
          </VButton>
        </div>

        {cards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink/15 bg-[#F9F9F6] px-4 py-5 text-center text-xs text-ink/45">
            还没有资料卡。扫描识别后保存，或点击右上角「＋ 新建资料卡」。
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {cards.map((card) => {
              const isActive = card.id === activeCardId
              const name = (card.fields?.['name'] as string) || card.name || '未命名'
              const passport = String(card.fields?.['passport_number'] ?? card.fields?.['passportNumber'] ?? '')
              const tail = passport.length >= 4 ? passport.slice(-4) : passport
              return (
                <div
                  key={card.id}
                  onClick={() => handleSwitchCard(card.id)}
                  className={`group relative w-44 shrink-0 cursor-pointer rounded-xl border p-3 transition-all duration-150 ${
                    isActive
                      ? 'border-[#1460A4] bg-[#E0F7FA]/60 shadow-sm'
                      : 'border-ink/8 bg-white hover:border-[#1460A4]/40 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#39A2B8] to-[#1460A4] text-xs font-semibold text-white">
                      {(name || '?').slice(0, 1)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold text-ink">{name}</div>
                      <div className="text-[11px] text-ink/45">{tail ? `护照 ···${tail}` : '未填护照号'}</div>
                    </div>
                    {isActive && (
                      <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-[#1460A4]" title="当前活跃" />
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-ink/40">
                    <span>{card.updated_at ? new Date(card.updated_at).toLocaleString().slice(0, 16) : ''}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteCard(card)
                      }}
                      className="rounded px-1 text-ink/30 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                      title="删除资料卡"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 新建资料卡命名弹窗 */}
      {showNameDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" onClick={() => setShowNameDialog(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-ink">新建资料卡</h3>
            <p className="mt-1 text-xs text-ink/50">给这张资料卡起个名字，例如「我的资料」「老婆的资料」「爸妈的资料」</p>
            <input
              autoFocus
              value={newCardName}
              onChange={(e) => setNewCardName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateProfile()}
              placeholder="如：我的资料"
              className="mt-4 w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40"
            />
            <div className="mt-4 flex justify-end gap-2">
              <VButton variant="secondary" size="sm" onClick={() => setShowNameDialog(false)}>取消</VButton>
              <VButton size="sm" onClick={handleCreateProfile} disabled={!newCardName.trim()}>创建</VButton>
            </div>
          </div>
        </div>
      )}

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

                {/* 行程数据预览（识别到行程文件时显示） */}
                {docType === 'itinerary' && tripData && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
                      <span>🗺️</span> 已从行程文件提取数据
                    </div>
                    <dl className="space-y-1 text-xs text-ink/70">
                      <div className="flex justify-between"><dt className="text-ink/50">目的地</dt><dd className="font-medium">{tripData.destination || country}</dd></div>
                      <div className="flex justify-between"><dt className="text-ink/50">出发</dt><dd className="font-medium">{tripData.start_date || '—'}</dd></div>
                      <div className="flex justify-between"><dt className="text-ink/50">返回</dt><dd className="font-medium">{tripData.end_date || '—'}</dd></div>
                      <div className="flex justify-between"><dt className="text-ink/50">天数</dt><dd className="font-medium">{tripData.days ?? tripData.daily_plan?.length ?? '—'}</dd></div>
                      <div className="flex justify-between"><dt className="text-ink/50">城市</dt><dd className="font-medium">{(tripData.cities ?? []).join('、') || '—'}</dd></div>
                    </dl>
                    {tripData.daily_plan && tripData.daily_plan.length > 0 && (
                      <div className="mt-2 border-t border-primary/15 pt-2">
                        <div className="mb-1 text-[11px] text-ink/50">每日安排</div>
                        <div className="max-h-28 space-y-0.5 overflow-y-auto text-[11px] text-ink/70">
                          {tripData.daily_plan.map((d, i) => (
                            <div key={i}>· 第{d.day ?? i + 1}天 {d.date ? `(${d.date})` : ''} {d.city || ''}：{d.activity || ''}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

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
