// pages/Assistant.tsx — 签证申请助手（四步流程）
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useI18n } from '@/i18n'
import { VButton, VBadge } from '@/components/common'
import { MaterialChecklist } from '@/components/visa'
import { useVisaStore } from '@/stores/visaStore'
import { useTrackerStore } from '@/stores/trackerStore'
import { listProfiles, getActiveProfileId, isTauri } from '@/api/tauri'
import { countries, PROVINCES, OCCUPATIONS, DIFFICULTY_LABELS } from '@/data/countries'
import { getVisaExtra } from '@/data/encyclopedia-extra'
import { getVisaOfficialFee, formatFee } from '@/data/visa-fees'
import type { UserProfile } from '@/types'

const STEPS = ['step1', 'step2', 'step3', 'step4']

/** 把 Rust 资料卡 snake_case fields 转成前端 camelCase UserProfile */
function cardFieldsToProfile(fields: Record<string, unknown>): UserProfile {
  const str = (v: unknown): string => (v === null || v === undefined ? '' : String(v))
  const occ = str(fields['occupation']).toLowerCase()
  const occupation = (['employed', 'student', 'retired', 'freelance'].includes(occ) ? occ : 'employed') as UserProfile['occupation']
  return {
    name: str(fields['name']),
    passportNumber: str(fields['passport_number']),
    nationality: str(fields['nationality']),
    birthDate: str(fields['birth_date']),
    occupation,
    company: str(fields['company']) || undefined,
    position: str(fields['position']) || undefined,
    salary: str(fields['salary']) || undefined,
    homeProvince: str(fields['home_province']),
    passportIssuedIn: str(fields['passport_issued_in']),
    hasHistoryVisa: Boolean(fields['has_history_visa']),
  }
}

export default function Assistant() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const {
    step, setStep,
    selectedCountryId, setCountry,
    selectedVisaTypeId, setVisaType,
    profile, setProfile, reset,
    savedProfile, saveProfile,
  } = useVisaStore()
  const { addApplication } = useTrackerStore()
  const [search, setSearch] = useState('')
  const [added, setAdded] = useState(false)
  // 地区筛选 tab（'' = 全部）
  const [regionTab, setRegionTab] = useState('')
  // 活跃资料卡（从材料扫描保存，自动读取）
  const [activeCard, setActiveCard] = useState<UserProfile | null>(null)
  const [activeCardName, setActiveCardName] = useState('')

  // 挂载时读取活跃资料卡
  useEffect(() => {
    if (!isTauri()) return
    ;(async () => {
      try {
        const id = await getActiveProfileId()
        if (!id) {
          // 兼容旧版 localStorage 保存的资料
          if (savedProfile) setActiveCard(savedProfile)
          return
        }
        const cards = await listProfiles()
        const card = cards.find((c) => c.id === id)
        if (card) {
          const p = cardFieldsToProfile(card.fields ?? {})
          setActiveCard(p)
          setActiveCardName(card.name)
          // 自动填入申请流程
          setProfile(p)
        }
      } catch (e) {
        console.warn('[Assistant] 读取活跃资料卡失败:', e)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 从详情页跳转带参
  useEffect(() => {
    const state = location.state as { countryId?: string; visaTypeId?: string } | null
    if (state?.countryId) {
      setCountry(state.countryId)
      setStep(1)
    }
  }, [location.state, setCountry, setStep])

  const country = countries.find((c) => c.id === selectedCountryId)
  const visaType = country?.visaTypes.find((v) => v.id === selectedVisaTypeId) ?? null
  const extra = visaType ? getVisaExtra(country!.id, visaType.id) : undefined

  // 签证类型筛选 tab：全部 / 互免签证 / 单方面免签 / 落地签 / 电子签 / 需通行证
  const REGION_TABS = ['', '互免签证', '单方面免签', '落地签', '电子签', '需通行证'] as const

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase()
    return countries.filter((c) => {
      // 先按 tab 筛签证类型
      if (regionTab && c.visaType !== regionTab) {
        return false
      }
      // 再按 search 过滤名称
      if (kw) {
        return c.name.zh.includes(kw) || c.name.en.toLowerCase().includes(kw)
      }
      return true
    })
  }, [search, regionTab])

  const totalFees = useMemo(() => {
    if (!visaType) return 0
    const f = extra?.fees
    return f ? f.visaFee + f.serviceFee + f.courierFee + f.photoFee : visaType.fee.amount + (visaType.serviceFee?.amount ?? 0)
  }, [visaType, extra])

  function startTracking() {
    if (!country || !visaType) return
    addApplication({
      countryId: country.id,
      visaTypeId: visaType.id,
      status: 'preparing',
      notes: '',
    })
    setAdded(true)
    setTimeout(() => navigate('/tracker'), 1200)
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">{t('assistant.title')}</h1>
        <p className="mt-1 text-base font-medium text-subtle">{t('assistant.subtitle')}</p>
      </div>

      {/* 步骤指示器 */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                i < step ? 'bg-success text-white' : i === step ? 'bg-primary text-white' : 'bg-ink/8 text-ink/40'
              }`}
            >
              {i < step ? '✓' : i + 1}
            </button>
            <span className={`hidden text-sm sm:block ${i <= step ? 'font-medium text-ink' : 'text-ink/40'}`}>
              {t(`assistant.${s}`)}
            </span>
            {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 ${i < step ? 'bg-success' : 'bg-ink/8'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: 选国家 */}
      {step === 0 && (
        <div className="anim-card rounded-2xl bg-white p-6 shadow-card">
          <h2 className="mb-5 text-lg font-bold text-ink">{t('assistant.selectCountry')}</h2>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('assistant.searchPlaceholder')}
            className="mb-4 w-full max-w-sm rounded-full border border-ink/8 bg-[#F9F9F6] px-5 py-2.5 text-sm outline-none placeholder:text-ink/35 focus:border-primary/40"
          />
          {/* 地区筛选 tab */}
          <div className="mb-5 flex flex-wrap gap-2">
            {REGION_TABS.map((r) => (
              <button
                key={r || 'all'}
                onClick={() => setRegionTab(r)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-150 ${
                  regionTab === r
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-ink/10 text-ink/55 hover:border-ink/25 hover:text-ink'
                }`}
              >
                {r || '全部'}
              </button>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => {
              const active = c.id === selectedCountryId
              return (
                <button
                  key={c.id}
                  onClick={() => setCountry(c.id)}
                  className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all duration-150 ${
                    active ? 'border-primary bg-primary/5' : 'border-ink/5 hover:border-ink/15'
                  }`}
                >
                  <span className="text-3xl">{c.flag}</span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-ink">{c.name.zh}</div>
                    <div className="text-xs text-ink/40">{c.name.en}</div>
                  </div>
                  <VBadge tone={c.difficulty === 'easy' ? 'success' : c.difficulty === 'medium' ? 'warning' : 'danger'}>
                    {DIFFICULTY_LABELS[c.difficulty].zh}
                  </VBadge>
                </button>
              )
            })}
          </div>
          <div className="mt-6 flex justify-end">
            <VButton size="lg" disabled={!country} onClick={() => setStep(1)}>
              {t('assistant.next')}
            </VButton>
          </div>
        </div>
      )}

      {/* Step 2: 选类型 */}
      {step === 1 && country && (
        <div className="anim-card rounded-2xl bg-white p-6 shadow-card">
          <h2 className="mb-5 text-lg font-bold text-ink">
            {country.flag} {country.name.zh} — {t('assistant.selectVisaType')}
          </h2>
          <div className="space-y-4">
            {country.visaTypes.map((v) => {
              const active = v.id === selectedVisaTypeId
              const vExtra = getVisaExtra(country.id, v.id)
              const vOfficial = getVisaOfficialFee(country.id, v.id, {
                serviceFee: vExtra?.fees.serviceFee ?? v.serviceFee?.amount ?? 0,
                courierFee: vExtra?.fees.courierFee ?? 0,
                photoFee: vExtra?.fees.photoFee ?? 0,
              })
              const total = vExtra ? vExtra.fees.visaFee + vExtra.fees.serviceFee + vExtra.fees.courierFee + vExtra.fees.photoFee : v.fee.amount
              const showFrom = vOfficial && vOfficial.tiers.length > 1
              const allFree = vOfficial ? vOfficial.tiers.every((tr) => tr.currency === 'FREE' || tr.amount === 0) : false
              const firstPaid = vOfficial?.tiers.find((tr) => tr.currency !== 'FREE')
              return (
                <button
                  key={v.id}
                  onClick={() => setVisaType(v.id)}
                  className={`w-full rounded-2xl border-2 p-5 text-left transition-all duration-150 ${
                    active ? 'border-primary bg-primary/5' : 'border-ink/5 hover:border-ink/15'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-base font-semibold text-ink">{v.name.zh}</div>
                      <div className="mt-1 text-xs text-ink/45">
                        {t('assistant.duration')}: {v.duration} · {t('assistant.validity')}: {v.validity}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-lg font-bold text-primary">
                        {vOfficial
                          ? allFree
                            ? '免费'
                            : showFrom
                              ? `${firstPaid ? formatFee(firstPaid) : ''} 起`
                              : firstPaid
                                ? formatFee(firstPaid)
                                : `¥${total}`
                          : `¥${total}`}
                      </div>
                      {showFrom && (
                        <div className="mt-0.5 text-[11px] text-ink/45">
                          {vOfficial?.tiers.map((tr) => formatFee(tr)).join(' / ')}
                        </div>
                      )}
                      <div className="text-xs text-ink/40">{t('assistant.total')}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <VBadge tone={v.entries === 'single' ? 'default' : 'primary'}>
                      {v.entries === 'single' ? t('assistant.single') : t('assistant.multiple')}
                    </VBadge>
                    {v.needInterview && <VBadge tone="warning">{t('assistant.needInterview')}</VBadge>}
                    {v.canApplyOnline && <VBadge tone="cyan">{t('assistant.canApplyOnline')}</VBadge>}
                    <VBadge tone="success">
                      {v.processingDays.min}-{v.processingDays.max} {t('assistant.days')}
                    </VBadge>
                  </div>
                </button>
              )
            })}
          </div>
          <div className="mt-6 flex justify-between">
            <VButton variant="secondary" size="lg" onClick={() => setStep(0)}>
              {t('assistant.back')}
            </VButton>
            <VButton size="lg" disabled={!visaType} onClick={() => setStep(2)}>
              {t('assistant.next')}
            </VButton>
          </div>
        </div>
      )}

      {/* Step 3: 填身份 */}
      {step === 2 && country && visaType && (
        <div className="anim-card rounded-2xl bg-white p-6 shadow-card">
          <h2 className="mb-5 text-lg font-bold text-ink">{t('assistant.identityTitle')}</h2>

          {/* 活跃资料卡提示（从材料扫描自动读取） */}
          {activeCard ? (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-success/30 bg-success/5 px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#39A2B8] to-[#1460A4] text-sm font-semibold text-white">
                {(activeCard.name || '用').slice(0, 1)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-ink">
                  {activeCard.name || '未命名'} <span className="ml-1 rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-medium text-success">✓ 已自动读取</span>
                </div>
                <div className="mt-0.5 truncate text-xs text-ink/50">
                  护照 {activeCard.passportNumber || '—'} · 国籍 {activeCard.nationality || '—'} · 职业 {t(`documents.occupation${activeCard.occupation.charAt(0).toUpperCase() + activeCard.occupation.slice(1)}`)} · 户籍 {activeCard.homeProvince || '—'}
                  {activeCardName && `（${activeCardName}）`}
                </div>
              </div>
              <VButton variant="secondary" size="sm" onClick={() => navigate('/scan')}>
                📁 管理资料卡
              </VButton>
            </div>
          ) : (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <span className="text-lg">📢</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-amber-700">请先去材料扫描录入信息</div>
                <div className="mt-0.5 text-xs text-amber-600/70">扫描身份证、护照等材料会自动提取信息保存为资料卡，申请时自动填入</div>
              </div>
              <VButton size="sm" onClick={() => navigate('/scan')}>
                📁 去扫描材料
              </VButton>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink/60">{t('documents.name')}</label>
              <input
                value={profile?.name ?? ''}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink/60">{t('documents.passportNumber')}</label>
              <input
                value={profile?.passportNumber ?? ''}
                onChange={(e) => setProfile({ ...profile, passportNumber: e.target.value })}
                className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink/60">{t('documents.nationality')}</label>
              <input
                value={profile?.nationality ?? ''}
                onChange={(e) => setProfile({ ...profile, nationality: e.target.value })}
                placeholder="中国"
                className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink/60">{t('documents.occupation')}</label>
              <select
                value={profile?.occupation ?? ''}
                onChange={(e) => setProfile({ ...profile, occupation: e.target.value as UserProfile['occupation'] })}
                className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40"
              >
                <option value="">{t('common.select')}</option>
                {OCCUPATIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {t(`documents.occupation${o.value.charAt(0).toUpperCase() + o.value.slice(1)}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink/60">{t('assistant.passportIssuedIn')}</label>
              <input
                value={profile?.passportIssuedIn ?? ''}
                onChange={(e) => setProfile({ ...profile, passportIssuedIn: e.target.value })}
                className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink/60">{t('assistant.homeProvince')}</label>
              <select
                value={profile?.homeProvince ?? ''}
                onChange={(e) => setProfile({ ...profile, homeProvince: e.target.value })}
                className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40"
              >
                <option value="">{t('common.select')}</option>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-between">
            <VButton variant="secondary" size="lg" onClick={() => setStep(1)}>
              {t('assistant.back')}
            </VButton>
            <VButton
              size="lg"
              onClick={() => {
                const p: UserProfile = {
                  name: profile?.name || '申请人',
                  passportNumber: profile?.passportNumber || '',
                  nationality: profile?.nationality || '中国',
                  birthDate: profile?.birthDate || '',
                  occupation: (profile?.occupation || 'employed') as UserProfile['occupation'],
                  homeProvince: profile?.homeProvince || '北京',
                  passportIssuedIn: profile?.passportIssuedIn || '',
                }
                saveProfile(p)
                setStep(3)
              }}
            >
              {t('assistant.next')}
            </VButton>
          </div>
        </div>
      )}

      {/* Step 4: 结果 */}
      {step === 3 && country && visaType && (
        <div className="anim-card rounded-2xl bg-white p-6 shadow-card">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">
              {country.flag} {country.name.zh} · {visaType.name.zh}
            </h2>
            <div className="flex gap-2">
              <VButton variant="secondary" size="sm" onClick={reset}>
                {t('assistant.reset')}
              </VButton>
              <VButton variant="secondary" size="sm" onClick={() => setStep(2)}>
                {t('assistant.back')}
              </VButton>
            </div>
          </div>

          {/* 领区 */}
          {profile?.homeProvince && (
            <div className="mb-6 rounded-xl bg-[#E0F7FA] px-5 py-4">
              <div className="text-xs text-ink/50">{t('assistant.yourDistrict')}</div>
              <div className="mt-1 text-sm font-semibold text-primary">
                {visaType.consularDistricts.find((d) => d.provinces.includes(profile.homeProvince!))?.name.zh || t('common.noData')}
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {/* 材料（自动检测/上传/生成） */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-ink">{t('assistant.materials')}</h3>
              <div className="max-h-[640px] overflow-y-auto rounded-xl border border-ink/5 p-4">
                <MaterialChecklist
                  countryName={country?.name.zh ?? ''}
                  tripDates={{
                    start: new Date().toISOString().slice(0, 10),
                    end: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
                  }}
                />
              </div>
            </div>

            {/* 费用与周期 */}
            <div className="space-y-4">
              <div className="rounded-xl border border-ink/5 p-5">
                <h3 className="mb-3 text-sm font-semibold text-ink">{t('assistant.feeBreakdown')}</h3>
                {(() => {
                  const f = extra?.fees
                  const official = getVisaOfficialFee(country.id, visaType.id, {
                    serviceFee: f?.serviceFee ?? visaType.serviceFee?.amount ?? 0,
                    courierFee: f?.courierFee ?? 0,
                    photoFee: f?.photoFee ?? 0,
                  })
                  if (official && official.tiers.length > 0) {
                    const firstPaidTier = official.tiers.find((tr) => tr.currency !== 'FREE')
                    return (
                      <>
                        <div className="space-y-2">
                          {official.tiers.map((tr, i) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span className="text-ink/55">{tr.label.zh}</span>
                              <span className="font-medium">{formatFee(tr)}</span>
                            </div>
                          ))}
                          {official.serviceFee > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-ink/55">{t('assistant.serviceFee')}</span>
                              <span className="font-medium">¥{official.serviceFee}</span>
                            </div>
                          )}
                          {official.courierFee > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-ink/55">{t('encyclopedia.courierFee')}</span>
                              <span className="font-medium">¥{official.courierFee}</span>
                            </div>
                          )}
                          {official.photoFee > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-ink/55">{t('encyclopedia.photoFee')}</span>
                              <span className="font-medium">¥{official.photoFee}</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-3 flex justify-between border-t border-ink/10 pt-3">
                          <span className="text-sm font-medium">{t('assistant.total')}</span>
                          <span className="font-display text-lg font-bold text-primary">
                            {firstPaidTier ? `${formatFee(firstPaidTier)} 起` : '免费'}
                          </span>
                        </div>
                        {(official.effectiveFrom || official.note || official.freeNote) && (
                          <div className="mt-3 space-y-1 text-xs text-ink/40">
                            {official.effectiveFrom && <p>📅 {t('encyclopedia.effectiveFrom')}: {official.effectiveFrom}</p>}
                            {official.freeNote && <p>{official.freeNote.zh}</p>}
                            {official.note && <p>ℹ️ {official.note.zh}</p>}
                          </div>
                        )}
                      </>
                    )
                  }
                  const rows = [
                    { label: t('assistant.visaFee'), value: f?.visaFee ?? visaType.fee.amount },
                    { label: t('assistant.serviceFee'), value: f?.serviceFee ?? visaType.serviceFee?.amount ?? 0 },
                    { label: t('encyclopedia.courierFee'), value: f?.courierFee ?? 0 },
                    { label: t('encyclopedia.photoFee'), value: f?.photoFee ?? 0 },
                  ]
                  return (
                    <>
                      <div className="space-y-2">
                        {rows.map((r) => (
                          <div key={r.label} className="flex justify-between text-sm">
                            <span className="text-ink/55">{r.label}</span>
                            <span className="font-medium">¥{r.value}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex justify-between border-t border-ink/10 pt-3">
                        <span className="text-sm font-medium">{t('assistant.total')}</span>
                        <span className="font-display text-lg font-bold text-primary">¥{totalFees}</span>
                      </div>
                    </>
                  )
                })()}
              </div>

              <div className="rounded-xl border border-ink/5 p-5">
                <h3 className="mb-3 text-sm font-semibold text-ink">{t('assistant.processingTime')}</h3>
                <div className="text-2xl font-bold text-ink">
                  {visaType.processingDays.min}-{visaType.processingDays.max}
                  <span className="ml-1 text-sm font-normal text-ink/50">{t('assistant.days')}</span>
                </div>
                <div className="mt-2 text-xs text-ink/45">
                  {visaType.needInterview ? '🔴 ' : '🟢 '}
                  {visaType.needInterview ? t('encyclopedia.needInterview') + '：' + t('common.yes') : t('encyclopedia.needInterview') + '：' + t('common.no')}
                </div>
              </div>

              <div className="rounded-xl bg-[#F9F9F6] p-5">
                <h3 className="mb-2 text-sm font-semibold text-ink">{t('assistant.notes')}</h3>
                <p className="text-sm leading-relaxed text-ink/60">{visaType.tips.zh}</p>
              </div>

              <VButton
                size="lg"
                className="w-full"
                onClick={startTracking}
                disabled={added}
              >
                {added ? '✓ ' : '+ '}
                {t('assistant.trackApplication')}
              </VButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
