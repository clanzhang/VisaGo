// pages/Scan.tsx — 桌面端三步走：扫描资料 → 核对信息 → 生成结果
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { VBadge, ProfileCardManager, StepIndicator } from '@/components/common'
import { ScanEmptyState, ScannedFileList, ReviewForm, ResultGenerator, type ScannedFileItem } from '@/components/visa'
import { FIELD_SPECS } from '@/data/field-specs'
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

type Step = 1 | 2 | 3

export default function Scan() {
  const { t } = useI18n()
  const { toast } = useAppStore()
  const [step, setStep] = useState<Step>(1)
  const [folder, setFolder] = useState('')
  const [items, setItems] = useState<ScannedFileItem[]>([])
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

  // 保存核对资料到当前活跃资料卡
  async function handleSaveToCard(cardName?: string) {
    if (!tauriEnv) {
      toast(t('scan.tauriOnly'), 'warning')
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
    } catch (e) {
      console.error('[Scan] 保存资料卡失败:', e)
      toast(e instanceof Error ? e.message : t('scan.saveFailed'), 'error')
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
  const itemsRef = useRef<ScannedFileItem[]>([])
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
    if (!append) setFolder(result.folder)

    if (result.files.length === 0) {
      if (!append) toast(t('scan.noFilesFound'), 'warning')
      return
    }
    setStep(2)
    if (append) {
      toast(t('scan.filesAppended', { count: fresh.length }), 'success')
      if (fresh.length > 0) {
        void handleRecognizeAllFresh(fresh)
      }
    } else {
      toast(t('scan.filesFound', { count: fresh.length }), 'success')
    }
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
      setItems((prev) =>
        prev.map((x) =>
          x.path === item.path
            ? { ...x, status: 'error', error: e instanceof Error ? `${e.name}: ${e.message}` : t('scan.recognizeFailed') }
            : x,
        ),
      )
    }
  }

  // 识别全部（串行，间隔 5 秒配合 Kimi 3 RPM 限额）
  async function handleRecognizeAll() {
    setRecognizingAll(true)
    const pending = items.filter((x) => x.status === 'pending' || x.status === 'error')
    for (let i = 0; i < pending.length; i++) {
      await handleRecognize(pending[i])
      // 非最后一个文件：间隔 5 秒，避免触发 429 限流
      if (i < pending.length - 1) {
        await new Promise((r) => setTimeout(r, 5000))
      }
    }
    setRecognizingAll(false)
    toast(t('scan.recognizeDone'), 'success')
  }

  // 追加后自动识别一组新文件（串行，间隔 5 秒配合 Kimi 3 RPM 限额）
  async function handleRecognizeAllFresh(fresh: ScannedFileItem[]) {
    setRecognizingAll(true)
    for (let i = 0; i < fresh.length; i++) {
      await handleRecognize(fresh[i])
      // 非最后一个文件：间隔 5 秒，避免触发 429 限流
      if (i < fresh.length - 1) {
        await new Promise((r) => setTimeout(r, 5000))
      }
    }
    setRecognizingAll(false)
    toast(t('scan.appendRecognizeDone'), 'success')
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
      toast(`${t('scan.saveFailed')}: ${msg}`, 'error')
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
      // 调试日志：打印生成参数与 prompt 长度
      console.log('[Scan] 生成参数:', { country, visaType, docType, userProfile: profile, tripData })
      console.log('[Scan] 生成 prompt 长度:', prompt.length, '字符')
      // 生成材料（尤其含行程明细）用 32k 模型，避免 8k token 超限
      const content = await kimiChat(prompt, 'moonshot-v1-32k')
      console.log('[Scan] 生成完成，长度:', content.length)
      setGenerated(content)
    } catch (e) {
      toast(e instanceof Error ? e.message : t('scan.generateFailed'), 'error')
    } finally {
      setGenerating(false)
    }
  }

  async function handleExport() {
    try {
      const path = await exportPdf(`<html><body><pre>${generated}</pre></body></html>`, `${country}-${docType}`)
      toast(t('scan.exportDone', { path }), 'success')
    } catch (e) {
      toast(e instanceof Error ? e.message : t('scan.exportFailed'), 'error')
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

      {/* 资料卡（列表 + 新建 + 详情弹窗） */}
      <ProfileCardManager
        cards={cards}
        activeCardId={activeCardId}
        onCardsChange={setCards}
        onActiveCardChange={setActiveCardId}
        disabled={!tauriEnv}
        onSupplement={(card) => {
          // 切到该资料卡，跳到第一步让用户补充扫描
          setActiveCardId(card.id)
          void setActiveProfileId(card.id)
          setStep(1)
          toast(t('scan.supplementHint'), 'info')
        }}
      />

      {/* 步骤指示器 */}
      <StepIndicator
        steps={[t('scan.stepScan'), t('scan.stepReview'), t('scan.stepResult')]}
        current={step - 1}
        startAtOne
        hideLabelOnMobile={false}
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
          folder={folder}
          scanning={scanning}
          recognizingAll={recognizingAll}
          recognizedCount={recognizedCount}
          onAddMore={handleAddMore}
          onRecognizeAll={handleRecognizeAll}
          onRecognize={handleRecognize}
          onNext={handleNextToConfirm}
        />
      )}

      {/* ===== 第三步：出结果（核对表单 + 生成） ===== */}
      {step === 3 && (
        <div className="flex flex-col gap-6">
          <ReviewForm
            profile={profile}
            missingFields={missingFields}
            onSave={handleSaveProfile}
            onBack={() => setStep(2)}
            onFieldChange={(key, value) => setProfile((prev) => ({ ...prev, [key]: value }))}
          />

          {/* 生成材料 */}
          <ResultGenerator
            country={country}
            visaType={visaType}
            docType={docType}
            tripData={tripData}
            generated={generated}
            generating={generating}
            onCountryChange={setCountry}
            onVisaTypeChange={setVisaType}
            onDocTypeChange={setDocType}
            onGenerate={handleGenerate}
            onExport={handleExport}
          />
        </div>
      )}
    </div>
  )
}
