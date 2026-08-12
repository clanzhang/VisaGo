// pages/Assistant.tsx — 签证申请助手（四步流程）
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useI18n } from '@/i18n'
import { VButton, VBadge } from '@/components/common'
import { Checklist } from '@/components/visa'
import { useVisaStore } from '@/stores/visaStore'
import { useAppStore } from '@/stores/appStore'
import { useTrackerStore } from '@/stores/trackerStore'
import { useAIRecruit, type RecommendResult } from '@/hooks/useAIRecruit'
import { countries, PROVINCES, OCCUPATIONS, DIFFICULTY_LABELS } from '@/data/countries'
import { getVisaExtra, identityExtraRequirements, extraBasicRequirements } from '@/data/encyclopedia-extra'
import type { Requirement, UserProfile } from '@/types'

const STEPS = ['step1', 'step2', 'step3', 'step4']

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
  const { toast } = useAppStore()
  const [search, setSearch] = useState('')
  const [added, setAdded] = useState(false)
  // 已保存资料卡片：内联编辑开关 + 填入闪烁
  const [editingSaved, setEditingSaved] = useState(false)
  const [flashFilled, setFlashFilled] = useState(false)

  // 更新已保存资料（内联编辑）
  function updateSaved(patch: Partial<UserProfile>) {
    if (!savedProfile) return
    saveProfile({ ...savedProfile, ...patch })
  }

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

  const filtered = useMemo(
    () => countries.filter((c) => c.name.zh.includes(search) || c.name.en.toLowerCase().includes(search.toLowerCase())),
    [search],
  )

  const requirements = useMemo<Requirement[]>(() => {
    if (!visaType) return []
    const key = (profile?.occupation || 'employed') as keyof typeof identityExtraRequirements
    const extraReqs = identityExtraRequirements[key] ?? []
    const merged = [...extraBasicRequirements, ...visaType.requirements, ...extraReqs]
    return merged.filter((r, i, arr) => arr.findIndex((x) => x.id === r.id) === i)
  }, [visaType, profile?.occupation])

  const totalFees = useMemo(() => {
    if (!visaType) return 0
    const f = extra?.fees
    return f ? f.visaFee + f.serviceFee + f.courierFee + f.photoFee : visaType.fee.amount + (visaType.serviceFee?.amount ?? 0)
  }, [visaType, extra])

  const { recommend, loading: aiLoading } = useAIRecruit()
  const [recommendation, setRecommendation] = useState<RecommendResult | null>(null)
  const [aiRequested, setAiRequested] = useState(false)

  // 到达结果页时自动触发 Kimi 个性化推荐
  useEffect(() => {
    if (step === 3 && country && visaType && !aiRequested) {
      setAiRequested(true)
      recommend({
        country: country.name.zh,
        visaType: visaType.name.zh,
        profile: profile ?? {},
      }).then((res) => {
        if (res) setRecommendation(res)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, country, visaType, aiRequested])

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
            className="mb-5 w-full max-w-sm rounded-full border border-ink/8 bg-[#F9F9F6] px-5 py-2.5 text-sm outline-none placeholder:text-ink/35 focus:border-primary/40"
          />
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
              const total = vExtra ? vExtra.fees.visaFee + vExtra.fees.serviceFee + vExtra.fees.courierFee + vExtra.fees.photoFee : v.fee.amount
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
                      <div className="font-display text-lg font-bold text-primary">¥{total}</div>
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

          {/* 已保存资料摘要卡片 / 空状态卡片 */}
          {savedProfile ? (
            <div className="group mb-6 overflow-hidden rounded-xl border-l-[3px] border-[#1460A4] bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                {/* 顶部：头像 + 姓名 + 已保存标签 */}
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#39A2B8] to-[#1460A4] text-base font-semibold text-white">
                    {(savedProfile.name || '用').slice(0, 1)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-semibold text-ink">{savedProfile.name || '未命名'}</span>
                      <span className="rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">✓ 已保存</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink/55">
                      <span>护照 {savedProfile.passportNumber || '—'}</span>
                      <span className="text-ink/20">|</span>
                      <span>国籍 {savedProfile.nationality || '—'}</span>
                      <span className="text-ink/20">|</span>
                      <span>职业 {t(`documents.occupation${savedProfile.occupation.charAt(0).toUpperCase() + savedProfile.occupation.slice(1)}`)}</span>
                      <span className="text-ink/20">|</span>
                      <span>户籍 {savedProfile.homeProvince || '—'}</span>
                    </div>
                  </div>
                </div>
                {/* 底部操作按钮 */}
                <div className="flex shrink-0 items-center gap-2">
                  <VButton size="sm" variant="secondary" onClick={() => setEditingSaved(true)}>
                    ✏️ 编辑
                  </VButton>
                  <VButton
                    size="sm"
                    onClick={() => {
                      setProfile(savedProfile)
                      setFlashFilled(true)
                      toast('已填入已保存资料', 'success')
                      setTimeout(() => setFlashFilled(false), 1200)
                    }}
                  >
                    ✓ 使用此资料
                  </VButton>
                </div>
              </div>

              {/* 内联编辑表单（点「编辑」展开） */}
              {editingSaved && (
                <div className="border-t border-ink/5 bg-[#F9F9F6]/60 p-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-ink/60">{t('documents.name')}</label>
                      <input
                        value={savedProfile.name}
                        onChange={(e) => updateSaved({ name: e.target.value })}
                        className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-ink/60">{t('documents.passportNumber')}</label>
                      <input
                        value={savedProfile.passportNumber}
                        onChange={(e) => updateSaved({ passportNumber: e.target.value })}
                        className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-ink/60">{t('documents.nationality')}</label>
                      <input
                        value={savedProfile.nationality}
                        onChange={(e) => updateSaved({ nationality: e.target.value })}
                        className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-ink/60">{t('documents.occupation')}</label>
                      <select
                        value={savedProfile.occupation}
                        onChange={(e) => updateSaved({ occupation: e.target.value as UserProfile['occupation'] })}
                        className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40"
                      >
                        {OCCUPATIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {t(`documents.occupation${o.value.charAt(0).toUpperCase() + o.value.slice(1)}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-ink/60">{t('assistant.homeProvince')}</label>
                      <select
                        value={savedProfile.homeProvince}
                        onChange={(e) => updateSaved({ homeProvince: e.target.value })}
                        className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40"
                      >
                        {PROVINCES.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-ink/60">{t('assistant.passportIssuedIn')}</label>
                      <input
                        value={savedProfile.passportIssuedIn}
                        onChange={(e) => updateSaved({ passportIssuedIn: e.target.value })}
                        className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <VButton variant="secondary" size="sm" onClick={() => setEditingSaved(false)}>取消</VButton>
                    <VButton
                      size="sm"
                      onClick={() => {
                        saveProfile(savedProfile)
                        setEditingSaved(false)
                        toast('资料已更新', 'success')
                      }}
                    >
                      💾 保存修改
                    </VButton>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mb-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-ink/15 bg-[#F9F9F6] px-6 py-8 text-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-ink/5">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8A8A8A" strokeWidth="1.6">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="text-sm font-medium text-ink">还没有保存的资料</div>
              <p className="mt-1 text-xs text-ink/50">扫描你的身份证、护照等材料，自动提取信息</p>
              <VButton size="sm" className="mt-4" onClick={() => navigate('/scan')}>
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
                className={`w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40 ${flashFilled && profile?.name ? 'border-success bg-success/10' : ''}`}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink/60">{t('documents.passportNumber')}</label>
              <input
                value={profile?.passportNumber ?? ''}
                onChange={(e) => setProfile({ ...profile, passportNumber: e.target.value })}
                className={`w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40 ${flashFilled && profile?.passportNumber ? 'border-success bg-success/10' : ''}`}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink/60">{t('documents.nationality')}</label>
              <input
                value={profile?.nationality ?? ''}
                onChange={(e) => setProfile({ ...profile, nationality: e.target.value })}
                placeholder="中国"
                className={`w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40 ${flashFilled && profile?.nationality ? 'border-success bg-success/10' : ''}`}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink/60">{t('documents.occupation')}</label>
              <select
                value={profile?.occupation ?? ''}
                onChange={(e) => setProfile({ ...profile, occupation: e.target.value as UserProfile['occupation'] })}
                className={`w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40 ${flashFilled && profile?.occupation ? 'border-success bg-success/10' : ''}`}
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
                className={`w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40 ${flashFilled && profile?.passportIssuedIn ? 'border-success bg-success/10' : ''}`}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink/60">{t('assistant.homeProvince')}</label>
              <select
                value={profile?.homeProvince ?? ''}
                onChange={(e) => setProfile({ ...profile, homeProvince: e.target.value })}
                className={`w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40 ${flashFilled && profile?.homeProvince ? 'border-success bg-success/10' : ''}`}
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
                {recommendation?.district || visaType.consularDistricts.find((d) => d.provinces.includes(profile.homeProvince!))?.name.zh || t('common.noData')}
              </div>
            </div>
          )}

          {/* Kimi AI 个性化推荐 */}
          <div className="mb-6 rounded-2xl border border-[#39A2B8]/20 bg-gradient-to-br from-[#E0F7FA]/60 to-[#E8F5E9]/60 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#121C19] text-xs font-bold text-[#39A2B8]">K</span>
              <h3 className="text-sm font-semibold text-ink">Kimi AI 个性化签证方案</h3>
              {aiLoading && (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#39A2B8] border-t-transparent" />
              )}
            </div>

            {/* 隐藏 Kimi 个性化推荐报错横幅（失败时静默跳过推荐，保留静态材料清单） */}
            {/* {aiError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {aiError}
              </div>
            )} */}

            {recommendation ? (
              <div className="space-y-4">
                {/* 费用/周期估算 */}
                {(recommendation.feeEstimate || recommendation.processingEstimate) && (
                  <div className="flex flex-wrap gap-2">
                    {recommendation.processingEstimate && (
                      <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-ink shadow-sm">
                        ⏱ {recommendation.processingEstimate}
                      </span>
                    )}
                    {recommendation.feeEstimate && (
                      <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-ink shadow-sm">
                        💰 {recommendation.feeEstimate}
                      </span>
                    )}
                  </div>
                )}

                {/* AI 个性化材料 */}
                {recommendation.materials.length > 0 && (
                  <div>
                    <div className="mb-2 text-xs font-medium text-ink/45">AI 个性化材料清单</div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {recommendation.materials.map((m, i) => (
                        <div key={i} className="flex items-start gap-2 rounded-lg bg-white/80 px-3 py-2 text-[13px] text-ink/70">
                          <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${m.required ? 'bg-[#39A2B8]' : 'bg-ink/25'}`} />
                          <span>
                            {m.name}
                            {m.details && <span className="ml-1 text-xs text-ink/40">· {m.details}</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 风险提示 */}
                {recommendation.riskTips.length > 0 && (
                  <div className="rounded-lg bg-amber-50 px-3 py-2.5">
                    <div className="mb-1 text-xs font-semibold text-amber-700">⚠️ 风险提示</div>
                    <ul className="space-y-1">
                      {recommendation.riskTips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[13px] text-ink/65">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 提高通过率建议 */}
                {recommendation.approvalTips.length > 0 && (
                  <div className="rounded-lg bg-[#E8F5E9] px-3 py-2.5">
                    <div className="mb-1 text-xs font-semibold text-success">💡 提高通过率建议</div>
                    <ul className="space-y-1">
                      {recommendation.approvalTips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[13px] text-ink/65">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-success" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 常见拒签原因 */}
                {recommendation.rejectionReasons.length > 0 && (
                  <div className="rounded-lg bg-red-50 px-3 py-2.5">
                    <div className="mb-1 text-xs font-semibold text-red-600">常见拒签原因</div>
                    <ul className="space-y-1">
                      {recommendation.rejectionReasons.map((reason, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[13px] text-ink/65">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : aiLoading ? (
              <div className="flex items-center gap-2 rounded-lg bg-white/70 px-3 py-3 text-[13px] text-ink/50">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#39A2B8] border-t-transparent" />
                正在根据你的身份生成个性化方案…
              </div>
            ) : null}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* 材料 */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-ink">{t('assistant.materials')}</h3>
              <div className="max-h-[420px] overflow-y-auto rounded-xl border border-ink/5 p-4">
                <Checklist requirements={requirements} />
              </div>
            </div>

            {/* 费用与周期 */}
            <div className="space-y-4">
              <div className="rounded-xl border border-ink/5 p-5">
                <h3 className="mb-3 text-sm font-semibold text-ink">{t('assistant.feeBreakdown')}</h3>
                {(() => {
                  const f = extra?.fees
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
