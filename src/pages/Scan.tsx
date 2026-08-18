// pages/Scan.tsx — 桌面端三步走：扫描资料 → 核对信息 → 生成结果
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { VBadge, ProfileCardManager, StepIndicator } from '@/components/common'
import { ScanEmptyState, ScannedFileList, ReviewForm, ResultGenerator, type ScannedFileItem } from '@/components/visa'
import { FIELD_SPECS, OCCUPATION_VALUES } from '@/data/field-specs'
import { countries } from '@/data/countries'
import type { TripData } from '@/types'
import { useAppStore } from '@/stores/appStore'
import { useI18n } from '@/i18n'
import {
  scanFiles,
  pickFiles,
  recognizeFile,
  exportPdf,
  kimiChat,
  isTauri,
  listProfiles,
  createProfile,
  saveProfileCard,
  getActiveProfileId,
  setActiveProfileId,
  type ScanResult,
  type RecognizeResult,
  type ProfileCard,
} from '@/api/tauri'

type Step = 1 | 2 | 3 | 4

/** P2-15：生成目标默认值 —— 优先沿用「申请签证」草稿里的目的地，否则回退日本 */
function loadTargetDefaults(): { countryId: string; visaTypeId: string } {
  const japan = countries.find((c) => c.id === 'japan')
  const fallback = { countryId: japan?.id ?? '', visaTypeId: japan?.visaTypes[0]?.id ?? '' }
  try {
    const raw = localStorage.getItem('visago:assistant:draft')
    if (!raw) return fallback
    const d = JSON.parse(raw) as { selectedCountryId?: string; selectedVisaTypeId?: string }
    const c = countries.find((x) => x.id === d.selectedCountryId)
    if (!c) return fallback
    const v = c.visaTypes.find((x) => x.id === d.selectedVisaTypeId)
    return { countryId: c.id, visaTypeId: v?.id ?? c.visaTypes[0]?.id ?? '' }
  } catch {
    return fallback
  }
}

/** D20：已扫描文件持久化 key（切页/刷新后可恢复，识别结果不丢） */
const SCAN_ITEMS_KEY = 'visago:scan-items'

/** 从 localStorage 恢复已扫描文件；进行中的项归为 pending（可续跑） */
function loadStoredItems(): ScannedFileItem[] {
  try {
    const raw = localStorage.getItem(SCAN_ITEMS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ScannedFileItem[]
    return Array.isArray(parsed)
      ? parsed.map((x) => (x.status === 'recognizing' ? { ...x, status: 'pending' as const } : x))
      : []
  } catch {
    return []
  }
}

export default function Scan() {
  const { t } = useI18n()
  const { toast } = useAppStore()
  const storedItems = useMemo(() => loadStoredItems(), [])
  const [step, setStep] = useState<Step>(storedItems.length > 0 ? 2 : 1)
  const [items, setItems] = useState<ScannedFileItem[]>(storedItems)
  const [scanning, setScanning] = useState(false)
  const [recognizingAll, setRecognizingAll] = useState(false)
  // 识别进度：第几个/共几个 + 当前文件名 + 阶段（识别中/等待限流）+ 倒计时
  const [recognizeProgress, setRecognizeProgress] = useState<{
    done: number
    total: number
    currentName: string
    phase: 'recognizing' | 'waiting'
    secondsLeft: number
  } | null>(null)
  // 批量识别取消标记（A3：可中断）
  const cancelRef = useRef(false)

  // 核对表单（从识别结果汇总）
  const [profile, setProfile] = useState<Record<string, string>>({})
  // P0/P1：进入核对时的聚合快照（脏状态对比基准）
  const [profileBaseline, setProfileBaseline] = useState<Record<string, string>>({})
  // P1-7：每个字段的来源文件（key → 文件名）
  const [profileSource, setProfileSource] = useState<Record<string, string>>({})
  // P0-1：occupation 无法映射到枚举时的建议值（更像职位）
  const [occupationSuggestion, setOccupationSuggestion] = useState<string | null>(null)
  // P2-21：行程数据的来源文件
  const [tripSource, setTripSource] = useState<string | null>(null)

  // 从识别结果提取的行程数据（用于生成行程单）
  const [tripData, setTripData] = useState<TripData | null>(null)

  // 出结果：选国家/签证类型（P2-15：id 取值，复用 countries.ts；默认沿用申请流程草稿目的地）
  const targetDefaults = useMemo(loadTargetDefaults, [])
  const [countryId, setCountryId] = useState(targetDefaults.countryId)
  const [visaTypeId, setVisaTypeId] = useState(targetDefaults.visaTypeId)
  const [docType, setDocType] = useState<'itinerary' | 'employment' | 'cover'>('itinerary')
  const [generated, setGenerated] = useState('')
  const [generating, setGenerating] = useState(false)
  const [exporting, setExporting] = useState(false)
  // P2-17：生成分阶段反馈 + 已耗时 + 取消
  const [genPhase, setGenPhase] = useState<'preparing' | 'writing' | 'polishing' | null>(null)
  const [genElapsed, setGenElapsed] = useState(0)
  const cancelGenerateRef = useRef(false)
  // P2-19：导出结果（可读提示 + 路径展示）
  const [exportResult, setExportResult] = useState<string | null>(null)

  const tauriEnv = isTauri()

  // ===== 资料卡（多用户资料）=====
  const [cards, setCards] = useState<ProfileCard[]>([])
  const [activeCardId, setActiveCardId] = useState<string | null>(null)

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

  // 保存核对资料到当前活跃资料卡（返回是否成功，供表单显示保存态）
  async function handleSaveToCard(cardName?: string): Promise<boolean> {
    if (!tauriEnv) {
      toast(t('scan.tauriOnly'), 'warning')
      return false
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
      if (!target) return false
      // 规范化字段：确保 key 统一为英文 snake_case（中文 key / 别名 → 英文）
      const fields: Record<string, unknown> = {}
      const normMap: Record<string, string> = {
        '姓名': 'name', '护照号': 'passport_number', '身份证号': 'id_number',
        '国籍': 'nationality', '出生日期': 'birth_date', '性别': 'gender',
        '手机号': 'phone', '家庭住址': 'address', '户籍省份': 'home_province',
        '户籍': 'home_province', '护照签发地': 'passport_issued_in', '签发地': 'passport_issued_in',
        '职业': 'occupation', '工作单位': 'company', '公司': 'company',
        '职位': 'position', '月薪': 'salary', '薪资': 'salary',
      }
      for (const [k, v] of Object.entries(profile)) {
        const canon = normMap[k] ?? k
        if (v !== undefined && v !== null && String(v).trim() !== '' && String(v).trim() !== 'null') {
          fields[canon] = v
        }
      }
      // occupation 中文 → 英文枚举值（在职/学生/退休/自由职业）
      if (fields['occupation']) {
        const occMap: Record<string, string> = {
          '在职': 'employed', '在职人员': 'employed', 'employed': 'employed',
          '学生': 'student', 'student': 'student',
          '退休': 'retired', '退休人员': 'retired', 'retired': 'retired',
          '自由职业': 'freelance', '自由职业者': 'freelance', 'freelance': 'freelance',
        }
        const rawOcc = String(fields['occupation']).trim()
        fields['occupation'] = occMap[rawOcc] ?? rawOcc
      }
      // 姓名兜底
      if (!fields['name'] && cardName) fields['name'] = cardName
      // 户口本家庭数据：从识别结果（items）中提取 family 数组，统一写入 fields.family
      // （Kimi 识别户口本时返回 family 数组，handleNextToConfirm 只聚合标量字段会丢失它）
      const familyArr = items
        .filter((it) => it.status === 'done')
        .map((it) => (it.fields ?? {})['family'])
        .find((f) => Array.isArray(f) && f.length > 0)
      if (Array.isArray(familyArr) && familyArr.length > 0) {
        console.log('[Scan] 保存资料卡：写入 family', familyArr.length, '人', familyArr)
        fields['family'] = familyArr
      }
      await saveProfileCard({ ...target, fields })
      // 同步写 localStorage（key: visago:user-profile），供 MaterialChecklist 等读取
      localStorage.setItem('visago:user-profile', JSON.stringify(buildProfileForStorage(fields)))
      // 通知 MaterialChecklist 等组件：资料卡已更新，重新检测材料状态
      window.dispatchEvent(new CustomEvent('visago:profile-updated', { detail: { id } }))
      // 同步更新列表
      setCards((prev) => prev.map((c) => (c.id === id ? { ...c, fields, updated_at: new Date().toISOString() } : c)))
      toast(t('scan.savedToCard'), 'success')
      return true
    } catch (e) {
      console.error('[Scan] 保存资料卡失败:', e)
      toast(e instanceof Error ? e.message : t('scan.saveFailed'), 'error')
      return false
    }
  }

  /** 把规范化后的资料字段（snake_case）转成 MaterialChecklist 需要的嵌套结构 */
  function buildProfileForStorage(fields: Record<string, unknown>) {
    const str = (v: unknown): string => (v === null || v === undefined ? '' : String(v))
    // family：优先用 Kimi 返回的 family 数组；没有则回退（有户籍省份时用申请人本人占位）
    const rawFamily = Array.isArray(fields['family']) ? fields['family'] : null
    const family = rawFamily
      ? (rawFamily as { name?: unknown; relation?: unknown; idNumber?: unknown }[]).map((m) => ({
          name: str(m.name),
          relation: str(m.relation),
          idNumber: str(m.idNumber),
        }))
      : fields['home_province']
        ? [{ name: str(fields['name']), relation: '本人' }]
        : []
    return {
      id: {
        name: str(fields['name']),
        idNumber: str(fields['id_number']),
      },
      passport: {
        passportNumber: str(fields['passport_number']),
        pinyinName: str(fields['name']),
        issuedIn: str(fields['passport_issued_in']),
      },
      employment: {
        company: str(fields['company']),
        position: str(fields['position']),
        salary: str(fields['salary']),
      },
      family,
      address: str(fields['address']),
      homeProvince: str(fields['home_province']),
      nationality: str(fields['nationality']),
      birthDate: str(fields['birth_date']),
      gender: str(fields['gender']),
      phone: str(fields['phone']),
      occupation: str(fields['occupation']),
    }
  }

  // 用 ref 跟踪 items，供追加合并与导航重置使用
  const itemsRef = useRef<ScannedFileItem[]>(storedItems)
  useEffect(() => {
    itemsRef.current = items
  }, [items])

  // D20：items 变化时防抖持久化（切页/刷新后可恢复；清空时移除 key）
  useEffect(() => {
    if (items.length === 0) {
      try {
        localStorage.removeItem(SCAN_ITEMS_KEY)
      } catch {
        /* ignore */
      }
      return
    }
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(SCAN_ITEMS_KEY, JSON.stringify(items))
      } catch {
        /* quota：忽略，不阻塞流程 */
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [items])

  // 卸载（切页）时停止批量识别，避免后台空跑 Kimi 配额
  useEffect(
    () => () => {
      cancelRef.current = true
    },
    [],
  )

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

  /** 弹系统文件选择器，选单个或多个文件后扫描 */
  async function handlePickFiles() {
    if (!tauriEnv) {
      toast(t('scan.tauriScanOnly'), 'warning')
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
      toast(e instanceof Error ? e.message : `${t('scan.scanFailed')}: ${String(e)}`, 'error')
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

    if (result.files.length === 0) {
      if (!append) toast(t('scan.noFilesFound'), 'warning')
      return
    }
    setStep(2)
    if (append) {
      const dupCount = result.files.length - fresh.length
      if (fresh.length > 0) toast(t('scan.filesAppended', { count: fresh.length }), 'success')
      // C15：追加时去重命中要明确反馈，不静默
      if (dupCount > 0) toast(t('scan.duplicatesSkipped', { n: dupCount }), 'info')
      if (fresh.length > 0) {
        void handleRecognizeAllFresh(fresh)
      }
    } else {
      toast(t('scan.filesFound', { count: fresh.length }), 'success')
    }
  }

  /** 移除误选文件（C14）：识别中禁止，移除后计数/进度同步更新 */
  function handleRemoveItem(path: string) {
    setItems((prev) => prev.filter((x) => x.path !== path))
    toast(t('scan.fileRemoved'), 'info')
  }

  /** 追加更多文件：重新弹选择器，新文件追加到列表并自动识别 */
  async function handleAddMore() {
    if (!tauriEnv) {
      toast(t('scan.tauriScanOnly'), 'warning')
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
      toast(e instanceof Error ? e.message : t('scan.scanFailed'), 'error')
    } finally {
      setScanning(false)
    }
  }

  /** 把识别异常分类成人类可读的原因（A5） */
  function classifyRecognizeError(e: unknown): { kind: string; message: string } {
    const msg = e instanceof Error ? e.message : String(e)
    const lower = msg.toLowerCase()
    if (lower.includes('429') || lower.includes('rate') || lower.includes('限流')) {
      return { kind: 'rate-limit', message: t('scan.errRateLimit') }
    }
    if (lower.includes('401') || lower.includes('unauthorized') || lower.includes('api key') || lower.includes('invalid key')) {
      return { kind: 'auth', message: t('scan.errAuth') }
    }
    if (lower.includes('timeout') || lower.includes('超时')) {
      return { kind: 'timeout', message: t('scan.errTimeout') }
    }
    if (lower.includes('parse') || lower.includes('json') || lower.includes('无法解析')) {
      return { kind: 'parse', message: t('scan.errParse') }
    }
    return { kind: 'network', message: t('scan.errNetwork') }
  }

  // 识别单个文件
  async function handleRecognize(item: ScannedFileItem) {
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
      const { kind, message } = classifyRecognizeError(e)
      setItems((prev) =>
        prev.map((x) =>
          x.path === item.path
            ? {
                ...x,
                status: 'error',
                errorKind: kind,
                error: e instanceof Error ? `${e.name}: ${e.message}` : message,
              }
            : x,
        ),
      )
    }
  }

  /** 串行识别一组文件：保留 5 秒间隔（Kimi 3 RPM 限流保护），支持停止、整体进度与倒计时反馈 */
  async function runRecognition(targets: ScannedFileItem[]) {
    if (targets.length === 0) return
    cancelRef.current = false
    setRecognizingAll(true)
    const total = targets.length
    setRecognizeProgress({ done: 0, total, currentName: targets[0].name, phase: 'recognizing', secondsLeft: 0 })
    for (let i = 0; i < total; i++) {
      if (cancelRef.current) break
      const item = targets[i]
      setRecognizeProgress((p) => (p ? { ...p, currentName: item.name, phase: 'recognizing', secondsLeft: 0 } : p))
      await handleRecognize(item)
      setRecognizeProgress((p) => (p ? { ...p, done: i + 1 } : p))
      if (cancelRef.current) break
      // 非最后一个文件：5 秒间隔 + 逐秒倒计时，把"疑似卡死"变成"已知机制"
      if (i < total - 1) {
        for (let s = 5; s >= 1; s--) {
          if (cancelRef.current) break
          setRecognizeProgress((p) => (p ? { ...p, phase: 'waiting', secondsLeft: s } : p))
          await new Promise((r) => setTimeout(r, 1000))
        }
      }
    }
    // 取消：把仍在识别的项回 pending（已识别的保留，可续跑）
    if (cancelRef.current) {
      setItems((prev) => prev.map((x) => (x.status === 'recognizing' ? { ...x, status: 'pending' as const } : x)))
      toast(t('scan.recognizeStopped'), 'info')
    } else {
      const failed = itemsRef.current.filter((x) => x.status === 'error').length
      if (failed > 0) {
        toast(t('scan.recognizePartialDone', { done: total - failed, failed }), 'warning')
      } else {
        toast(t('scan.recognizeDone'), 'success')
      }
    }
    setRecognizingAll(false)
    setRecognizeProgress(null)
  }

  // 识别全部（串行，间隔 5 秒配合 Kimi 3 RPM 限额）
  function handleRecognizeAll() {
    const pending = itemsRef.current.filter((x) => x.status === 'pending' || x.status === 'error')
    void runRecognition(pending)
  }

  // 追加后自动识别一组新文件（串行，间隔 5 秒配合 Kimi 3 RPM 限额）
  function handleRecognizeAllFresh(fresh: ScannedFileItem[]) {
    void runRecognition(fresh)
  }

  // 停止批量识别（A3）
  function handleStopRecognize() {
    cancelRef.current = true
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
      // 中文 key 兜底（Kimi 可能返回中文）
      姓名: 'name',
      护照号: 'passport_number',
      身份证号: 'id_number',
      国籍: 'nationality',
      出生日期: 'birth_date',
      性别: 'gender',
      手机号: 'phone',
      家庭住址: 'address',
      户籍省份: 'home_province',
      户籍: 'home_province',
      护照签发地: 'passport_issued_in',
      签发地: 'passport_issued_in',
      职业: 'occupation',
      工作单位: 'company',
      公司: 'company',
      职位: 'position',
      月薪: 'salary',
      薪资: 'salary',
      // passport_issued_in 别名
      passport_issue_place: 'passport_issued_in',
      issue_place: 'passport_issued_in',
      issued_in: 'passport_issued_in',
    }
    let trip: TripData | null = null
    let tripSrc: string | null = null
    // P1-7：记录每个字段首次被填充时来自哪个文件（不改变聚合规则）
    const source: Record<string, string> = {}
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
        tripSrc = item.name
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
          source[k] = item.name
        }
      }
    }

    // P0-1：occupation 归一化为枚举；无法映射时不静默丢弃，提示并建议填入职位
    const occRaw = (merged['occupation'] ?? '').trim()
    if (occRaw) {
      const occZh: Record<string, string> = {
        在职: 'employed', 在职人员: 'employed',
        学生: 'student', 学生身份: 'student',
        退休: 'retired', 退休人员: 'retired',
        自由职业: 'freelance', 自由职业者: 'freelance',
      }
      const mapped = occZh[occRaw] ?? (OCCUPATION_VALUES.includes(occRaw.toLowerCase() as (typeof OCCUPATION_VALUES)[number]) ? occRaw.toLowerCase() : null)
      if (mapped) {
        merged['occupation'] = mapped
      } else {
        // 识别到「软件工程师」这类岗位名 → 不写入枚举，建议填入职位
        merged['occupation'] = ''
        if (!merged['position']) merged['position'] = occRaw
        setOccupationSuggestion(occRaw)
      }
    }

    // P0-2：salary 归一化为数字串（支持「38万」类写法）
    const rawSal = (merged['salary'] ?? '').trim()
    if (rawSal) {
      if (rawSal.includes('万')) {
        const n = parseFloat(rawSal.replace(/[^\d.]/g, ''))
        merged['salary'] = Number.isFinite(n) ? String(Math.round(n * 10000)) : ''
      } else {
        merged['salary'] = rawSal.replace(/[^\d]/g, '')
      }
    }

    setProfile(merged)
    setProfileBaseline({ ...merged })
    setProfileSource(source)
    setTripSource(tripSrc)
    setTripData(trip)
    setStep(3)
  }

  async function handleSaveProfile(): Promise<boolean> {
    console.log('[Scan] handleSaveProfile 被调用，profile=', profile)
    const ok = await handleSaveToCard()
    if (ok) {
      // P1-10：保存成功后更新脏状态基准
      setProfileBaseline({ ...profile })
    }
    return ok
  }

  // ===== 第四步：生成 =====
  async function handleGenerate(reviseNote?: string) {
    if (generating) return
    cancelGenerateRef.current = false
    setGenerating(true)
    setGenerated('')
    setExportResult(null)
    setGenPhase('preparing')
    setGenElapsed(0)
    const start = Date.now()
    const elapsedTimer = setInterval(() => setGenElapsed(Math.floor((Date.now() - start) / 1000)), 1000)
    const phaseTimer = setTimeout(() => setGenPhase('writing'), 4000)
    const phaseTimer2 = setTimeout(() => setGenPhase('polishing'), 20000)
    try {
      const c = countries.find((x) => x.id === countryId)
      const v = c?.visaTypes.find((x) => x.id === visaTypeId)
      const countryName = c?.name.zh ?? countryId
      const visaTypeName = v?.name.zh ?? ''
      const info = Object.entries(profile)
        .map(([k, val]) => `${FIELD_SPECS.find((f) => f.key === k)?.label ?? k}: ${val}`)
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
            + `目的地：${tripData.destination ?? countryName}\n`
            + `天数：${tripData.days ?? (tripData.daily_plan?.length ?? '未知')}\n`
            + `城市：${(tripData.cities ?? []).join('、') || '未知'}\n`
            + `每日安排：\n${daysText || '（文件中无每日明细）'}`
        } else {
          tripSection = '\n\n（注意：未识别到行程文件。如用户上传了行程单请据实生成，不要使用 [具体日期]/[具体天数] 占位符；行程信息不完整时请用合理假设并标注。）'
        }
      }

      let prompt = `根据以下用户信息，生成${docName}。要求：正式、符合签证申请规范、中英文各一版。\n\n用户信息：\n${info}\n\n申请：${countryName} ${visaTypeName}${tripSection}`
      // P2-18：重新生成可带修改要求
      if (reviseNote?.trim()) {
        prompt += `\n\n用户修改要求：${reviseNote.trim()}`
      }
      console.log('[Scan] 生成 prompt 长度:', prompt.length, '字符')
      // 生成材料（尤其含行程明细）用 32k 模型，避免 8k token 超限
      const content = await kimiChat(prompt, 'moonshot-v1-32k')
      if (cancelGenerateRef.current) {
        toast(t('scan.generateCancelled'), 'info')
      } else {
        setGenerated(content)
      }
    } catch (e) {
      if (!cancelGenerateRef.current) {
        toast(e instanceof Error ? e.message : t('scan.generateFailed'), 'error')
      }
    } finally {
      clearInterval(elapsedTimer)
      clearTimeout(phaseTimer)
      clearTimeout(phaseTimer2)
      setGenerating(false)
      setGenPhase(null)
      setGenElapsed(0)
    }
  }

  // P2-17：取消生成（放弃等待，丢弃结果）
  function handleCancelGenerate() {
    cancelGenerateRef.current = true
    setGenerating(false)
    setGenPhase(null)
    toast(t('scan.generateCancelled'), 'info')
  }


  async function handleExport(content: string) {
    if (exporting) return
    setExporting(true)
    try {
      const c = countries.find((x) => x.id === countryId)
      const v = c?.visaTypes.find((x) => x.id === visaTypeId)
      const base = `${c?.name.zh ?? countryId}-${v?.name.zh ?? docType}`
      const path = await exportPdf(`<html><body><pre>${content}</pre></body></html>`, base)
      setExportResult(path)
      toast(t('scan.exportOk'), 'success')
    } catch (e) {
      toast(e instanceof Error ? e.message : t('scan.exportFailed'), 'error')
    } finally {
      setExporting(false)
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
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">{t('scan.title')}</h1>
          <p className="mt-1 text-base font-medium text-subtle">
            {t('scan.subtitle')}
          </p>
        </div>
        {!tauriEnv && (
          <VBadge tone="warning">{t('scan.webModeBadge')}</VBadge>
        )}
      </div>

      {/* 步骤指示器：sticky 常驻页面顶部，不随资料卡区块高度漂移 */}
      <div className="sticky top-0 z-20 -mx-4 border-b border-ink/5 bg-bg px-4 pb-3 pt-1 sm:-mx-8 sm:px-8">
        <StepIndicator
          steps={[t('scan.stepPickFiles'), t('scan.stepRecognize'), t('scan.stepReview'), t('scan.stepResult')]}
          current={step - 1}
          startAtOne
          hideLabelOnMobile={false}
        />
      </div>

      {/* 资料卡（列表 + 新建 + 详情弹窗）；第 2 步折叠为一行，不与文件识别抢注意力 */}
      <ProfileCardManager
        cards={cards}
        activeCardId={activeCardId}
        onCardsChange={setCards}
        onActiveCardChange={setActiveCardId}
        disabled={!tauriEnv}
        collapsed={step === 2}
        onSupplement={(card) => {
          // 切到该资料卡，跳到第一步让用户补充扫描
          setActiveCardId(card.id)
          void setActiveProfileId(card.id)
          setStep(1)
          toast(t('scan.supplementHint'), 'info')
        }}
      />

      {/* ===== 第一步：扫描 ===== */}
      {step === 1 && (
        <ScanEmptyState
          scanning={scanning}
          isTauriEnv={tauriEnv}
          onPickFiles={handlePickFiles}
        />
      )}

      {/* ===== 第二步：文件列表 + 核对表单 ===== */}
      {step === 2 && (
        <ScannedFileList
          items={items}
          scanning={scanning}
          recognizingAll={recognizingAll}
          recognizeProgress={recognizeProgress}
          recognizedCount={recognizedCount}
          onAddMore={handleAddMore}
          onRecognizeAll={handleRecognizeAll}
          onStopRecognize={handleStopRecognize}
          onRecognize={handleRecognize}
          onRemove={handleRemoveItem}
          onNext={handleNextToConfirm}
        />
      )}

      {/* ===== 第三步：核对信息（P2-14：与生成材料拆为两步） ===== */}
      {step === 3 && (
        <ReviewForm
          profile={profile}
          baseline={profileBaseline}
          source={profileSource}
          occupationSuggestion={occupationSuggestion}
          missingFields={missingFields}
          items={items}
          onSave={handleSaveProfile}
          onBack={() => setStep(2)}
          onContinue={() => setStep(4)}
          onFieldChange={(key, value) => setProfile((prev) => ({ ...prev, [key]: value }))}
        />
      )}

      {/* ===== 第四步：生成材料 ===== */}
      {step === 4 && (
        <ResultGenerator
          profile={profile}
          tripSource={tripSource}
          countryId={countryId}
          visaTypeId={visaTypeId}
          docType={docType}
          tripData={tripData}
          generated={generated}
          generating={generating}
          genPhase={genPhase}
          genElapsed={genElapsed}
          exporting={exporting}
          exportResult={exportResult}
          onCountryIdChange={setCountryId}
          onVisaTypeIdChange={setVisaTypeId}
          onDocTypeChange={setDocType}
          onTripDataChange={setTripData}
          onGenerate={(note) => handleGenerate(note)}
          onCancelGenerate={handleCancelGenerate}
          onExport={handleExport}
          onBack={() => setStep(3)}
        />
      )}
    </div>
  )
}
