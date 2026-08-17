// components/visa/MaterialChecklist.tsx — 材料清单（自动推进式）
// 页面加载自动完成可自动化的 6 项，用户只需处理证件照 + 银行流水
import { useEffect, useMemo, useRef, useState } from 'react'
import { VButton } from '@/components/common'
import { useI18n } from '@/i18n'
import { checkMaterials, materialProgress, type MaterialItem } from '@/lib/material-check'
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

export function MaterialChecklist({ countryName = '目标国家', tripDates, onAllReady }: Props) {
  const { t } = useI18n()
  const [items, setItems] = useState<MaterialItem[]>([])
  const [photoResult, setPhotoResult] = useState<PhotoCheckResult | null>(null)
  const [bankResult, setBankResult] = useState<BankCheckResult | null>(null)
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generatingLabel, setGeneratingLabel] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentUploadTarget, setCurrentUploadTarget] = useState<string>('')
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
        if (card?.fields) return fieldsToProfile(card.fields as Record<string, unknown>)
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
    setItems(list)
    setLoading(false)
    return profile
  }

  // 页面加载自动跑一遍检测 + 生成；监听资料卡更新事件自动刷新
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const profile = await refreshMaterials()
      if (cancelled || !profile) return
      // 自动生成行程（Kimi）——静默执行，失败不阻塞
      try {
        setGenerating(true)
        await generateItinerary(countryName, dates)
      } catch {
        /* 静默 */
      } finally {
        setGenerating(false)
      }
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

  const percent = useMemo(() => materialProgress(items), [items])

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

  const updateItem = (id: string, patch: Partial<MaterialItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)))
  }

  /** 本地化材料显示名 / 状态 / 提示（lib 里的中文数据不直接展示） */
  const itemName = (item: MaterialItem) => t(`scan.materialName_${item.id}`)
  const itemStatusLabel = (item: MaterialItem) => {
    if (item.status === 'ready') return t('scan.materialStatus_ready')
    if (item.status === 'auto-generate') return t('scan.materialStatus_auto')
    if (item.status === 'need-photo') return t('scan.materialStatus_photo')
    return t('scan.materialStatus_user')
  }
  const itemAction = (item: MaterialItem) => {
    if (item.status === 'ready') return t('scan.materialReused')
    if (item.id === 'employment' && item.status === 'auto-generate' && item.progress < 100) {
      return t('scan.materialHint_employmentPartial')
    }
    return t(`scan.materialHint_${item.id}`)
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
      // 类型不符 → 弹确认
      if (expected && got && !got.includes(expected) && !expected.includes(got)) {
        const ok = window.confirm(`${t('scan.confirmCategory', { got, expected })}`)
        if (!ok) return
      }
      updateItem(targetId, { status: 'ready', progress: 100 })
    } catch (e) {
      console.warn('[MaterialChecklist] 上传识别失败:', e)
      updateItem(targetId, { status: 'need-user', progress: 30 })
    }
  }

  // 操作按钮
  function renderAction(item: MaterialItem) {
    if (item.status === 'ready' || item.status === 'auto-generate') {
      return (
        <div className="flex shrink-0 items-center gap-2">
          <VButton size="sm" variant="secondary" onClick={() => exportPdf(`<pre>${item.name}</pre>`, item.name).catch(() => {})}>
            {t('scan.preview')}
          </VButton>
          {item.id === 'photo' || item.id === 'bank' || item.id === 'id' || item.id === 'passport' || item.id === 'family' ? (
            <VButton
              size="sm"
              variant="secondary"
              onClick={() => {
                setCurrentUploadTarget(item.id)
                fileRef.current?.click()
              }}
            >
              {t('scan.reupload')}
            </VButton>
          ) : (
            <VButton size="sm" variant="secondary" onClick={handleGenerateAll} disabled={generating}>
              {t('scan.regenerate')}
            </VButton>
          )}
        </div>
      )
    }
    if (item.status === 'need-photo') {
      return (
        <VButton size="sm" onClick={() => { setCurrentUploadTarget('photo'); fileRef.current?.click() }}>{t('scan.upload')}</VButton>
      )
    }
    // need-user：根据材料类型设置上传目标
    return (
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
    )
  }

  const autoDoneCount = items.filter((i) => i.status === 'ready' || i.status === 'auto-generate').length

  return (
    <div>
      {/* 进度条 */}
      <div className="mb-5 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#F3F4F6]">
          <div
            className="h-full rounded-full bg-[#39A2B8] transition-all duration-700 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-sm font-semibold text-ink/70">{percent}%</span>
      </div>

      {/* 自动推进提示 */}
      <div className="mb-4 rounded-xl border border-[#E0F7FA] bg-[#E0F7FA]/40 px-4 py-2.5 text-xs text-ink/70">
        {t('scan.autoProgress', { done: autoDoneCount })}
      </div>

      {/* 一键生成（长任务：显示分阶段进度文案） */}
      <div className="mb-5">
        <VButton onClick={handleGenerateAll} disabled={generating} className="w-full">
          {generating && generatingLabel ? `⏳ ${generatingLabel}` : generating ? t('scan.generating') : t('scan.oneClickGenerate')}
        </VButton>
      </div>

      {/* 材料列表（加载中显示骨架，避免空白闪烁） */}
      <div className="space-y-2" aria-busy={loading}>
        {loading && items.length === 0 && (
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
        )}
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 rounded-xl border border-ink/5 px-4 py-3">
            <span className="text-base">{item.id === 'photo' ? '📸' : item.id === 'bank' ? '🏦' : '📄'}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-ink">{itemName(item)}</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  item.status === 'ready' || item.status === 'auto-generate'
                    ? 'bg-success/10 text-success'
                    : 'bg-amber-500/10 text-amber-600'
                }`}>
                  {itemStatusLabel(item)}
                </span>
              </div>
              <div className="mt-1 text-xs text-ink/60">{itemAction(item)}</div>
              {/* 进度 */}
              <div className="mt-1.5 h-1 w-32 overflow-hidden rounded-full bg-[#F3F4F6]">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${item.status === 'need-photo' || item.status === 'need-user' ? 'bg-amber-400' : 'bg-[#39A2B8]'}`}
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
            {renderAction(item)}
          </div>
        ))}
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
            <ul className="mt-2 space-y-1 text-xs text-red-600/80">
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
    </div>
  )
}
