// components/visa/MaterialChecklist.tsx — 材料清单（自动推进式）
// 页面加载自动完成可自动化的 6 项，用户只需处理证件照 + 银行流水
import { useEffect, useMemo, useRef, useState } from 'react'
import { VButton, VModal } from '@/components/common'
import { useI18n } from '@/i18n'
import { checkMaterials, type MaterialItem } from '@/lib/material-check'
import { generateApplicationForm, generateEmploymentCertificate, generateItinerary } from '@/lib/doc-generator'
import { checkPassportPhoto, PHOTO_CHECKS, type PhotoCheckResult } from '@/lib/photo-check'
import { checkBankStatement, type BankCheckResult } from '@/lib/bank-check'
import { exportPdf, isTauri, listProfiles, getActiveProfileId, getScannedFiles, recognizeFile, type ScannedFileRecord } from '@/api/tauri'
import type { UserProfile } from '@/lib/user-profile'

interface Props {
  countryName?: string
  tripDates?: { start: string; end: string }
  /** 所有材料是否全部就绪（全部 ready / auto-generate）的变化回调 */
  onAllReady?: (ready: boolean) => void
  /** 未完成材料 id 变化回调（用于「还差 N 项材料」提示） */
  onIncompleteChange?: (ids: string[]) => void
  /** 高亮第一个未完成项（Step 4 CTA 点击后短暂闪烁引导） */
  pendingHighlight?: boolean
}

/** 把 Rust 资料卡扁平 snake_case 字段 → checkMaterials 期望的嵌套 UserProfile */
function fieldsToProfile(fields: Record<string, unknown>): UserProfile {
  const str = (v: unknown): string => (v === null || v === undefined ? '' : String(v))
  // family：优先用 Kimi 返回的 family 数组；没有则回退到 family_members / family_relation
  const rawFamily = Array.isArray(fields['family'])
    ? fields['family']
    : str(fields['family_members'])
      ? [{ name: str(fields['name']), relation: str(fields['family_relation'] ?? '本人') }]
      : []
  const family = (rawFamily as { name?: unknown; relation?: unknown; idNumber?: unknown }[]).map((m) => ({
    name: str(m.name),
    relation: str(m.relation),
    idNumber: str(m.idNumber),
  }))
  return {
    id: {
      name: str(fields['name']),
      idNumber: str(fields['id_number']),
      address: str(fields['home_address'] ?? fields['address']),
    },
    passport: {
      pinyinName: str(fields['passport_pinyin'] ?? fields['name']),
      passportNumber: str(fields['passport_number']),
      issueDate: str(fields['passport_issue_date']),
      expiryDate: str(fields['passport_expiry_date']),
    },
    family,
    employment: {
      company: str(fields['company']),
      position: str(fields['position']),
      salary: str(fields['salary']),
      startDate: str(fields['employment_start_date']),
      companyAddress: str(fields['company_address']),
      companyPhone: str(fields['company_phone']),
    },
    phone: str(fields['phone']),
    homeAddress: str(fields['home_address'] ?? fields['address']),
  }
}

export function MaterialChecklist({
  countryName = '目标国家',
  tripDates,
  onAllReady,
  onIncompleteChange,
  pendingHighlight = false,
}: Props) {
  const { t } = useI18n()
  const [items, setItems] = useState<MaterialItem[]>([])
  const [photoResult, setPhotoResult] = useState<PhotoCheckResult | null>(null)
  const [bankResult, setBankResult] = useState<BankCheckResult | null>(null)
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generatingLabel, setGeneratingLabel] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentUploadTarget, setCurrentUploadTarget] = useState<string>('')
  // 已扫描文件记录（用于来源标注与预览）
  const [scannedFiles, setScannedFiles] = useState<ScannedFileRecord[]>([])
  // 活跃资料卡名（用于来源标注）
  const [cardName, setCardName] = useState('')
  // 已完成项次级菜单（dots-vertical）
  const [menuFor, setMenuFor] = useState<string | null>(null)
  // 上传文件类型不符 → VModal 确认（不再用 window.confirm）
  const [categoryConfirm, setCategoryConfirm] = useState<{ targetId: string; got: string; expected: string } | null>(null)
  // 预览弹窗
  const [previewItem, setPreviewItem] = useState<MaterialItem | null>(null)
  const [previewState, setPreviewState] = useState<{ loading: boolean; content: string; kind: 'photo' | 'text' | 'none' }>({
    loading: false,
    content: '',
    kind: 'none',
  })
  const fileRef = useRef<HTMLInputElement>(null)

  /** 材料 id → 期望的 Kimi 识别 category（中文），用于上传类型校验 */
  const TARGET_CATEGORY: Record<string, string> = {
    id: '身份证',
    passport: '护照',
    family: '户口本',
    employment: '在职证明',
    itinerary: '行程',
    application: '申请表',
  }

  const dates = tripDates ?? {
    start: new Date().toISOString().slice(0, 10),
    end: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  }

  /** 读取用户资料：Tauri 从活跃 Rust 资料卡读取，返回 checkMaterials 需要的结构 */
  async function loadProfile(): Promise<UserProfile | null> {
    if (isTauri()) {
      try {
        const id = await getActiveProfileId()
        const cards = await listProfiles()
        const card = cards.find((c) => c.id === id)
        if (card?.fields) {
          setCardName(card.name)
          return fieldsToProfile(card.fields as Record<string, unknown>)
        }
      } catch (e) {
        console.warn('[MaterialChecklist] 读取 Rust 资料卡失败:', e)
      }
      return null
    }
    return null
  }

  // 重新检测：读资料卡 + 查已扫描文件 → 刷新材料状态（挂载与 profile-updated 事件共用）
  const refreshMaterials = async () => {
    setLoading(true)
    const profile = await loadProfile()
    // 先取已扫描文件记录（识别过的户口本/银行流水/身份证等），传给 checkMaterials 统一判断
    let scannedFiles: ScannedFileRecord[] = []
    if (isTauri()) {
      try {
        const scanned = await getScannedFiles()
        scannedFiles = scanned?.files ?? []
      } catch (e) {
        console.warn('[MaterialChecklist] 读取已扫描文件失败:', e)
      }
    }
    const list = checkMaterials(profile, scannedFiles)
    setScannedFiles(scannedFiles)
    setItems(list)
    setLoading(false)
    return profile
  }

  // 页面加载自动跑检测；资料卡更新时重新检测
  // 注意：不再自动生成行程——行程是 AI 建议内容，应等用户显式点「生成」再生成，
  // 避免用户什么都没做就得到一份 AI 编造的「假行程」（原静默自动生成已移除）。
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const profile = await refreshMaterials()
      if (cancelled || !profile) return
    }
    void run()
    // 资料卡保存后（Scan 页 dispatch）重新检测
    const onProfileUpdated = () => {
      console.log('[MaterialChecklist] 收到资料卡更新事件，重新检测')
      void refreshMaterials()
    }
    window.addEventListener('visago:profile-updated', onProfileUpdated)
    return () => {
      cancelled = true
      window.removeEventListener('visago:profile-updated', onProfileUpdated)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 是否所有材料都完成（ready / auto-generate）
  const allDone = useMemo(
    () => items.length > 0 && items.every((i) => i.status === 'ready' || i.status === 'auto-generate'),
    [items],
  )

  // 通知父组件：全部就绪状态变化
  useEffect(() => {
    onAllReady?.(allDone)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone])

  // 通知父组件：未完成材料（用于「还差 N 项材料」提示）
  const incomplete = items.filter((i) => i.status === 'need-photo' || i.status === 'need-user')
  const incompleteIds = incomplete.map((i) => i.id)
  useEffect(() => {
    onIncompleteChange?.(incompleteIds)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incompleteIds.join(',')])

  // 待处理组展开/折叠（有未完成项时默认折叠「自动完成」组，减少视觉噪音）
  const [autoCollapsed, setAutoCollapsed] = useState(true)

  // Esc 关闭次级菜单
  useEffect(() => {
    if (!menuFor) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuFor(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuFor])

  // 高亮第一个未完成项（Step 4 CTA 引导）：仅在高亮信号变化时滚动一次
  useEffect(() => {
    if (pendingHighlight && incomplete.length > 0) {
      document.getElementById(`material-${incomplete[0].id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingHighlight])

  const updateItem = (id: string, patch: Partial<MaterialItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)))
  }

  /** 本地化材料显示名（lib 里的中文数据不直接展示） */
  const itemName = (item: MaterialItem) => t(`scan.materialName_${item.id}`)

  /** 8 类材料可区分图标（统一尺寸与容器） */
  const MATERIAL_ICONS: Record<string, string> = {
    id: 'account',
    passport: 'book',
    family: 'home',
    application: 'file',
    employment: 'briefcase',
    itinerary: 'map-marker',
    photo: 'camera',
    bank: 'bank',
  }

  /** 状态语义：完成=success / 待操作=warning / 不合规=danger / 系统生成=cyan；配图标不只靠颜色 */
  function statusMeta(item: MaterialItem) {
    const photoFailed = item.id === 'photo' && !!photoResult && !photoResult.passed
    if (item.status === 'ready') {
      return { label: t('scan.materialStatus_ready'), cls: 'bg-success/10 text-success', icon: 'check-circle' }
    }
    if (item.status === 'auto-generate') {
      return { label: t('scan.materialStatus_auto'), cls: 'bg-cyan/10 text-cyan', icon: 'file' }
    }
    if (item.status === 'need-photo' && photoFailed) {
      return { label: t('scan.materialStatus_invalid'), cls: 'bg-red-500/10 text-red-600', icon: 'alert-circle' }
    }
    if (item.status === 'need-photo') {
      return { label: t('scan.materialStatus_photo'), cls: 'bg-amber-500/10 text-amber-600', icon: 'camera' }
    }
    return { label: t('scan.materialStatus_user'), cls: 'bg-amber-500/10 text-amber-600', icon: 'alert-circle' }
  }

  /** 副文案：只在提供新信息时出现——已完成项显示来源（资料卡/已扫描文件/已保存），未完成项显示上传要求与前置规格 */
  const itemAction = (item: MaterialItem) => {
    if (item.status === 'ready') {
      if (item.id === 'photo') return t('scan.sourcePhotoSaved')
      const cat = item.id === 'bank' ? '银行流水' : TARGET_CATEGORY[item.id]
      const rec = cat ? scannedFiles.find((f) => f.doc_category === cat) : undefined
      if (rec) return t('scan.sourceFromScannedName', { name: rec.name })
      if (cardName) return t('scan.sourceFromCardName', { name: cardName })
      return t('scan.sourceFromCard')
    }
    if (item.status === 'auto-generate') {
      if (item.id === 'employment' && item.progress < 100) return t('scan.materialHint_employmentPartial')
      // 行程是 AI 生成建议：明确标注，避免用户误当真实计划
      if (item.id === 'itinerary') return t('scan.itineraryAiNote')
      return t(`scan.materialHint_${item.id}`)
    }
    // 未完成项：上传说明 + 前置规格（C14：先写要求，再让用户传）
    return t(`scan.materialHint_${item.id}`)
  }

  /** 预览：photo 显示真实图片；已扫描项显示文件+识别字段；自动生成项实时生成文本；无内容则说明原因 */
  async function openPreview(item: MaterialItem) {
    setPreviewItem(item)
    setPreviewState({ loading: true, content: '', kind: 'none' })
    if (item.id === 'photo') {
      setPreviewState({ loading: false, content: photoDataUrl ?? '', kind: photoDataUrl ? 'photo' : 'none' })
      return
    }
    const expectedCat = item.id === 'bank' ? '银行流水' : TARGET_CATEGORY[item.id]
    const scanned = expectedCat ? scannedFiles.find((f) => f.doc_category === expectedCat) ?? null : null
    if (scanned) {
      const fields = Object.entries(scanned.fields ?? {})
        .map(([k, v]) => `${k}: ${String(v)}`)
        .join('\n')
      setPreviewState({
        loading: false,
        content: `${t('scan.previewScannedFile', { name: scanned.name })}${fields ? `\n\n${t('scan.previewFields')}:\n${fields}` : ''}`,
        kind: 'text',
      })
      return
    }
    if (item.status === 'auto-generate') {
      try {
        const profile = await loadProfile()
        let content = ''
        if (item.id === 'application' && profile) content = (await generateApplicationForm(profile, countryName)).content
        else if (item.id === 'employment' && profile) content = (await generateEmploymentCertificate(profile, dates)).content
        else if (item.id === 'itinerary') content = (await generateItinerary(countryName, dates)).content
        setPreviewState({ loading: false, content, kind: content ? 'text' : 'none' })
      } catch {
        setPreviewState({ loading: false, content: '', kind: 'none' })
      }
      return
    }
    setPreviewState({ loading: false, content: '', kind: 'none' })
  }

  // 一键生成：申请表 + 在职证明 + 行程（Kimi 队列本身串行，逐项推进便于分阶段反馈）
  async function handleGenerateAll() {
    const profile = await loadProfile()
    if (!profile) return
    setGenerating(true)
    const stages = [
      { id: 'application' as const, label: t('scan.materialName_application'), run: () => generateApplicationForm(profile, countryName) },
      { id: 'employment' as const, label: t('scan.materialName_employment'), run: () => generateEmploymentCertificate(profile, dates) },
      { id: 'itinerary' as const, label: t('scan.materialName_itinerary'), run: () => generateItinerary(countryName, dates) },
    ]
    try {
      let first: { content: string; filename: string } | null = null
      for (let i = 0; i < stages.length; i++) {
        setGeneratingLabel(t('scan.generatingStep', { n: i + 1, total: stages.length, name: stages[i].label }))
        try {
          const doc = await stages[i].run()
          updateItem(stages[i].id, { status: 'auto-generate', progress: 100 })
          if (i === 0) first = doc
        } catch {
          /* 单项失败不阻塞后续 */
        }
      }
      setGeneratingLabel('')
      // 导出第一份（申请表）作为示例
      if (first) {
        await exportPdf(first.content, first.filename.replace('.pdf', '')).catch(() => {})
      }
    } finally {
      setGenerating(false)
      setGeneratingLabel('')
    }
  }

  // 证件照上传 + 检测
  async function handlePhotoUpload(file: File) {
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      setPhotoDataUrl(dataUrl)
      const base64 = dataUrl.split(',')[1]
      const result = await checkPassportPhoto(base64)
      setPhotoResult(result)
      if (result.passed) {
        // 持久化证件照：写入 localStorage，刷新页面后仍显示"已归档"不要求重新上传
        const filePath = (file as unknown as { path?: string }).path ?? file.name
        localStorage.setItem('visago:photo', filePath)
        console.log('[MaterialChecklist] 证件照已保存:', filePath)
        updateItem('photo', { status: 'ready', progress: 100 })
      } else {
        updateItem('photo', { status: 'need-photo', progress: 30 })
      }
    }
    reader.readAsDataURL(file)
  }

  // 银行流水上传 + 检查
  async function handleBankUpload(file: File) {
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      const base64 = dataUrl.split(',')[1]
      const profile = await loadProfile()
      const result = await checkBankStatement(base64, {
        applicantName: profile?.passport?.pinyinName || profile?.id?.name,
      })
      setBankResult(result)
      updateItem('bank', {
        status: result.coversRequired && result.matchApplicant ? 'ready' : 'need-user',
        progress: result.matchApplicant ? 80 : 40,
      })
    }
    reader.readAsDataURL(file)
  }

  // 其他材料上传：Kimi 识别文件类型，与目标不符则确认
  async function handleOtherUpload(file: File, targetId: string) {
    const filePath = (file as unknown as { path?: string }).path
    if (!filePath) {
      updateItem(targetId, { status: 'need-user', progress: 30 })
      return
    }
    try {
      const res = await recognizeFile(filePath, file.name)
      const expected = TARGET_CATEGORY[targetId]
      const got = res.category || ''
      // 类型不符 → VModal 确认（说明检测到 X、你选的是 Y、继续会怎样）
      if (expected && got && !got.includes(expected) && !expected.includes(got)) {
        setCategoryConfirm({ targetId, got, expected })
        return
      }
      updateItem(targetId, { status: 'ready', progress: 100 })
    } catch (e) {
      console.warn('[MaterialChecklist] 上传识别失败:', e)
      updateItem(targetId, { status: 'need-user', progress: 30 })
    }
  }


  const auto = items.filter((i) => i.status === 'ready' || i.status === 'auto-generate')
  // 来源构成（自动完成横幅）：已扫描文件 / 资料卡 / 系统生成
  const catOf = (id: string) => (id === 'bank' ? '银行流水' : TARGET_CATEGORY[id])
  const scannedCats = new Set(scannedFiles.map((f) => f.doc_category))
  const fromScanned = items.filter((i) => i.status === 'ready' && catOf(i.id) && scannedCats.has(catOf(i.id))).length
  const fromCard = items.filter(
    (i) => i.status === 'ready' && !(catOf(i.id) && scannedCats.has(catOf(i.id))) && ['id', 'passport', 'family', 'employment'].includes(i.id),
  ).length
  const generated = items.filter((i) => i.status === 'auto-generate').length
  const doneCount = items.filter((i) => i.status === 'ready' || i.status === 'auto-generate').length
  // 自动完成组是否展开：有未完成项时默认折叠，全部完成时始终展开
  const isAutoOpen = !autoCollapsed || incomplete.length === 0

  /** 单行材料项：未完成项唯一实心「上传」；已完成项一个轻量「查看」+ 次级菜单 */
  function renderItemRow(item: MaterialItem, highlight: boolean) {
    const meta = statusMeta(item)
    const completed = item.status === 'ready' || item.status === 'auto-generate'
    const needsFileInput = item.id === 'photo' || item.id === 'bank' || item.id === 'id' || item.id === 'passport' || item.id === 'family'
    return (
      <div
        key={item.id}
        id={`material-${item.id}`}
        className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
          highlight ? 'border-amber-400 ring-2 ring-amber-300/60' : 'border-ink/5'
        }`}
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F5F7FA] text-ink/60 ${
            MATERIAL_ICONS[item.id] ? `icon-[mdi-light--${MATERIAL_ICONS[item.id]}]` : 'icon-[mdi-light--file]'
          }`}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="min-w-0 truncate text-sm font-medium text-ink">{itemName(item)}</span>
            <span className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.cls}`}>
              <span className={`h-3 w-3 ${meta.icon ? `icon-[mdi-light--${meta.icon}]` : ''}`} aria-hidden="true" />
              {meta.label}
            </span>
          </div>
          <div className="mt-1 truncate text-xs text-ink/60">{itemAction(item)}</div>
        </div>
        {completed ? (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => openPreview(item)}
              className="rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/5 hover:text-[#0e4a80] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              {t('scan.preview')}
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuFor(menuFor === item.id ? null : item.id)}
                aria-label={t('scan.moreActions')}
                aria-expanded={menuFor === item.id}
                className="flex h-7 w-7 items-center justify-center rounded-md text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <span className="h-4 w-4 icon-[mdi-light--dots-vertical]" aria-hidden="true" />
              </button>
              {menuFor === item.id && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMenuFor(null)} />
                  <div role="menu" className="absolute right-0 top-full z-40 mt-1 w-36 overflow-hidden rounded-lg border border-ink/5 bg-white py-1 shadow-card-lg">
                    {needsFileInput ? (
                      <button
                        role="menuitem"
                        type="button"
                        onClick={() => {
                          setMenuFor(null)
                          setCurrentUploadTarget(item.id)
                          fileRef.current?.click()
                        }}
                        className="block w-full px-3 py-1.5 text-left text-xs text-ink hover:bg-ink/5"
                      >
                        {t('scan.reupload')}
                      </button>
                    ) : (
                      <button
                        role="menuitem"
                        type="button"
                        onClick={() => {
                          setMenuFor(null)
                          handleGenerateAll()
                        }}
                        disabled={generating}
                        className="block w-full px-3 py-1.5 text-left text-xs text-ink hover:bg-ink/5 disabled:cursor-not-allowed disabled:text-ink/40"
                      >
                        {t('scan.regenerate')}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <VButton
            size="sm"
            onClick={() => {
              const target = item.id === 'bank' ? 'bank' : item.id
              setCurrentUploadTarget(target)
              fileRef.current?.click()
            }}
          >
            {t('scan.upload')}
          </VButton>
        )}
      </div>
    )
  }

  return (
    <div>
      {/* 自动完成提示：说明已完成数量与数据来源（去内部术语） */}
      <div className="mb-4 rounded-xl border border-[#E0F7FA] bg-[#E0F7FA]/40 px-4 py-2.5 text-xs text-ink/70">
        {generating && !loading ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3.5 w-3.5 animate-spin icon-[mdi-light--refresh]" aria-hidden="true" />
            {t('scan.autoGenerating')}
          </span>
        ) : (
          <>
            {t('scan.autoProgress', { done: doneCount, total: items.length })}
            {(fromCard > 0 || fromScanned > 0 || generated > 0) && (
              <span className="text-ink/60">
                {fromCard > 0 ? ` · ${t('scan.sourceCard', { n: fromCard })}` : ''}
                {fromScanned > 0 ? ` · ${t('scan.sourceScanned', { n: fromScanned })}` : ''}
                {generated > 0 ? ` · ${t('scan.sourceGenerated', { n: generated })}` : ''}
              </span>
            )}
          </>
        )}
      </div>

      {/* 材料列表（加载中显示骨架，避免空白闪烁；按「需要你处理 / 自动完成」分组） */}
      <div aria-busy={loading}>
        {loading && items.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-ink/5 px-4 py-3">
                <div className="h-6 w-6 animate-pulse rounded-full bg-[#E8EEF4]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 animate-pulse rounded bg-[#E8EEF4]" />
                  <div className="h-3 w-64 animate-pulse rounded bg-[#EEF2F6]" />
                </div>
                <div className="h-8 w-20 animate-pulse rounded-lg bg-[#E8EEF4]" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {/* 待处理组：置顶且始终展开（未完成项是绝对焦点） */}
            {incomplete.length > 0 && (
              <div className="flex items-center gap-2 pt-1">
                <p className="whitespace-nowrap text-xs font-semibold text-ink/70">
                  {t('scan.materialsGroupPending', { n: incomplete.length })}
                </p>
                <div className="h-px flex-1 bg-ink/8" />
              </div>
            )}
            {incomplete.length > 0 && incomplete.map((item, idx) => renderItemRow(item, pendingHighlight && idx === 0))}

            {/* 自动完成组：显示准确分母，默认折叠 */}
            {auto.length > 0 && (
              <>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <p className="whitespace-nowrap text-xs font-semibold text-ink/70">
                    {t('scan.materialsGroupAuto', { done: auto.length, total: items.length })}
                  </p>
                  <div className="flex shrink-0 items-center gap-1">
                    <VButton variant="ghost" size="sm" onClick={handleGenerateAll} disabled={generating}>
                      {generating && generatingLabel ? generatingLabel : generating ? t('scan.generating') : t('scan.oneClickGenerate')}
                    </VButton>
                    <button
                      type="button"
                      onClick={() => setAutoCollapsed((v) => !v)}
                      aria-expanded={isAutoOpen}
                      aria-controls="material-auto-group-body"
                      className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    >
                      {isAutoOpen ? t('assistant.collapse') : t('assistant.expand')}
                      <span className={`h-3.5 w-3.5 transition-transform ${isAutoOpen ? '' : 'rotate-180'} icon-[mdi-light--chevron-down]`} aria-hidden="true" />
                    </button>
                  </div>
                </div>
                {isAutoOpen && (
                  <div id="material-auto-group-body" className="space-y-2">
                    {auto.map((item) => renderItemRow(item, false))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* 隐藏文件输入（用于拍照/上传） */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f && currentUploadTarget) {
            if (currentUploadTarget === 'photo') handlePhotoUpload(f)
            else if (currentUploadTarget === 'bank') handleBankUpload(f)
            else handleOtherUpload(f, currentUploadTarget)
          }
          e.target.value = ''
        }}
      />

      {/* 证件照检测结果 */}
      {photoResult && (
        <div className={`mt-4 rounded-xl border px-4 py-3 ${photoResult.passed ? 'border-success/40 bg-success/5' : 'border-red-200 bg-red-50'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-semibold ${photoResult.passed ? 'text-success' : 'text-red-600'}`}>
              {photoResult.passed ? t('scan.photoPassed') : t('scan.photoFailed')}
            </span>
            <span className="text-xs text-ink/60">{t('scan.photoScore', { score: photoResult.score })}</span>
          </div>
          {!photoResult.passed && (
            <ul className="mt-2 space-y-1 text-xs text-red-700">
              {photoResult.issues.map((iss, i) => (
                <li key={i}>· {iss}</li>
              ))}
            </ul>
          )}
          {photoDataUrl && <img src={photoDataUrl} alt={t('scan.photoPreview')} className="mt-3 h-24 rounded-lg border border-ink/10" />}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PHOTO_CHECKS.map((c) => (
              <span key={c} className="rounded-full bg-white px-2 py-0.5 text-[11px] text-ink/60">{c}</span>
            ))}
          </div>
        </div>
      )}

      {/* 银行流水检查结果 */}
      {bankResult && (
        <div className={`mt-4 rounded-xl border px-4 py-3 ${bankResult.matchApplicant && bankResult.coversRequired ? 'border-success/40 bg-success/5' : 'border-amber-200 bg-amber-50'}`}>
          <div className="text-sm font-semibold text-ink">{bankResult.bank || t('scan.materialName_bank')}</div>
          <div className="mt-1 space-y-0.5 text-xs text-ink/70">
            <div>{t('scan.bankAccount')}：{bankResult.accountName || '—'}{bankResult.matchApplicant ? ' ✅' : ` ⚠️ ${t('scan.bankNotApplicant')}`}</div>
            <div>{t('scan.bankCoveredLabel')}：{bankResult.coversRequired ? `✅ ${t('scan.bankCovered')}` : `⚠️ ${t('scan.bankNotCovered')}`}</div>
            <div>{t('scan.bankBalance')}：¥{bankResult.balance.toLocaleString()}</div>
          </div>
          {bankResult.issues.length > 0 && (
            <div className="mt-1 text-xs text-amber-700">{bankResult.issues[0]}</div>
          )}
        </div>
      )}
      {/* 上传文件类型不符 → 确认（VModal，说明继续会怎样） */}
      <VModal
        open={!!categoryConfirm}
        onClose={() => setCategoryConfirm(null)}
        title={t('scan.confirmCategoryTitle')}
        footer={
          <>
            <VButton variant="secondary" onClick={() => setCategoryConfirm(null)}>
              {t('common.cancel')}
            </VButton>
            <VButton
              onClick={() => {
                if (categoryConfirm) {
                  updateItem(categoryConfirm.targetId, { status: 'ready', progress: 100 })
                }
                setCategoryConfirm(null)
              }}
            >
              {t('scan.uploadAnyway', { expected: categoryConfirm?.expected ?? '' })}
            </VButton>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink/70">
          {categoryConfirm ? t('scan.confirmCategory', { got: categoryConfirm.got, expected: categoryConfirm.expected }) : ''}
        </p>
        <p className="mt-2 text-xs text-ink/60">{t('scan.confirmCategoryHint')}</p>
      </VModal>

      {/* 预览弹窗：真实内容（照片/已扫描文件/实时生成文档），无内容时说明原因 */}
      <VModal
        open={!!previewItem}
        onClose={() => setPreviewItem(null)}
        title={previewItem ? itemName(previewItem) : ''}
        width="max-w-2xl"
      >
        {previewState.loading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-ink/60">
            <span className="h-4 w-4 animate-spin icon-[mdi-light--refresh]" aria-hidden="true" />
            {t('scan.previewGenerating')}
          </div>
        ) : previewState.kind === 'photo' && previewState.content ? (
          <img src={previewState.content} alt={t('scan.preview')} className="mx-auto max-h-[420px] rounded-lg border border-ink/10" />
        ) : previewState.kind === 'text' ? (
          <pre className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap rounded-xl bg-[#F9F9F6] p-4 text-sm leading-relaxed text-ink/80">
            {previewState.content}
          </pre>
        ) : (
          <p className="py-8 text-center text-sm text-ink/60">
            {previewItem?.id === 'photo' ? t('scan.previewPhotoHint') : t('scan.previewNoContent')}
          </p>
        )}
      </VModal>
    </div>
  )
}
