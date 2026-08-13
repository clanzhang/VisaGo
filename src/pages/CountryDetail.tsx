// pages/CountryDetail.tsx — 国家详情页（静态兜底 + Kimi AI 实时数据）
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useI18n } from '@/i18n'
import { VButton, VBadge } from '@/components/common'
import { FeeCalculator, AIAssistant, RequirementList } from '@/components/visa'
import { countries, DIFFICULTY_LABELS } from '@/data/countries'
import { PROVINCES } from '@/data/countries'
import { useCountryAIData } from '@/hooks/useAIData'
import type { AiCountryData } from '@/types/ai'

const IDENTITY_KEYS = ['employed', 'student', 'retired', 'freelance'] as const

/** 新西兰翻译提示条（全站唯一的醒目提示） */
const NZ_TRANSLATION_BANNER = {
  text: '新西兰签证要求所有非英文材料必须提供翻译件',
  bg: '#FFF3E0',
  border: '#F5A623',
}

export default function CountryDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useI18n()
  const country = countries.find((c) => c.id === id)
  const { data: aiData, loading: aiLoading, refresh: aiRefresh } = useCountryAIData(id)

  const [visaTypeId, setVisaTypeId] = useState(country?.visaTypes[0]?.id ?? '')
  const [tab, setTab] = useState<'materials' | 'fee' | 'districts' | 'faq'>('materials')
  const [province, setProvince] = useState('')
  const [aiOpen, setAiOpen] = useState(false)

  const ai = aiData as AiCountryData | null
  const aiVisaType = ai?.visaTypes?.[0]

  const visaType = useMemo(
    () => country?.visaTypes.find((v) => v.id === visaTypeId) ?? country?.visaTypes[0],
    [country, visaTypeId],
  )

  const matchedDistrict = useMemo(() => {
    if (!province) return null
    return visaType?.consularDistricts.find((d) => d.provinces.includes(province)) ?? null
  }, [province, visaType])

  if (!country || !visaType) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center text-sm text-ink/40 shadow-card">
        {t('common.noData')}
      </div>
    )
  }

  const difficultyTone =
    country.difficulty === 'easy' ? 'success' : country.difficulty === 'medium' ? 'warning' : 'danger'

  return (
    <div className="flex flex-col gap-8">
      {/* 返回 + 标题 */}
      <div>
        <button
          onClick={() => navigate('/encyclopedia')}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink/50 transition-colors hover:text-ink"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
          {t('encyclopedia.backToList')}
        </button>
        <div className="flex items-center gap-4">
          <span className="text-5xl">{country.flag}</span>
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
              {country.name.zh}
            </h1>
            <p className="mt-1 text-sm text-ink/50">{country.name.en} · {country.region}</p>
          </div>
          <VBadge tone={difficultyTone} className="ml-2">
            {t('encyclopedia.difficultyLabel')}: {DIFFICULTY_LABELS[country.difficulty].zh}
          </VBadge>
        </div>
      </div>

      {/* 概览 + 免签政策 */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="anim-card rounded-2xl bg-white p-6 shadow-card">
          <h3 className="mb-2 text-sm font-medium text-subtle">{t('encyclopedia.overview')}</h3>
          <p className="text-sm leading-relaxed text-ink/70">{country.overview.zh}</p>
        </div>
        <div className="anim-card rounded-2xl bg-white p-6 shadow-card" style={{ animationDelay: '60ms' }}>
          <h3 className="mb-2 text-sm font-medium text-subtle">{t('encyclopedia.visaFreePolicy')}</h3>
          <p className="text-sm leading-relaxed text-ink/70">{country.visaFree.zh}</p>
        </div>
      </div>

      {/* 签证类型选择 */}
      <div className="anim-card rounded-2xl bg-white p-6 shadow-card" style={{ animationDelay: '120ms' }}>
        <h3 className="mb-4 text-sm font-medium text-subtle">{t('encyclopedia.visaTypeTab')}</h3>
        <div className="flex flex-wrap gap-3">
          {country.visaTypes.map((v) => (
            <button
              key={v.id}
              onClick={() => setVisaTypeId(v.id)}
              className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-150 ${
                visaType.id === v.id
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-ink/10 text-ink/60 hover:border-ink/25'
              }`}
            >
              {v.name.zh}
            </button>
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: t('encyclopedia.duration'), value: visaType.duration },
            { label: t('encyclopedia.validity'), value: visaType.validity },
            { label: t('encyclopedia.entries'), value: visaType.entries === 'single' ? t('encyclopedia.single') : t('encyclopedia.multiple') },
            { label: t('encyclopedia.processingTime'), value: `${visaType.processingDays.min}-${visaType.processingDays.max} ${t('assistant.days')}` },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-[#F9F9F6] px-4 py-3">
              <div className="text-xs text-ink/40">{item.label}</div>
              <div className="mt-0.5 text-sm font-semibold text-ink">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Kimi AI 实时数据 */}
      <div className="anim-card rounded-2xl bg-white p-6 shadow-card" style={{ animationDelay: '160ms' }}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#121C19] text-xs font-bold text-[#39A2B8]">K</span>
            <h3 className="text-sm font-semibold text-ink">Kimi AI 实时签证数据</h3>
            {ai?.lastUpdated && (
              <span className="text-xs text-ink/40">更新于 {ai.lastUpdated}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {aiLoading && (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#39A2B8] border-t-transparent" />
            )}
            <VButton variant="secondary" size="sm" onClick={() => aiRefresh()} disabled={aiLoading}>
              刷新数据
            </VButton>
          </div>
        </div>

        {/* 隐藏 AI 数据加载报错横幅（仅静默失败，保留静态数据展示） */}
        {/* {aiError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {aiError}
            <button onClick={() => aiRefresh()} className="ml-3 font-medium underline underline-offset-2">
              点击重试
            </button>
          </div>
        )} */}

        {aiLoading && !ai ? (
          <div className="flex items-center gap-3 rounded-xl bg-[#F9F9F6] px-4 py-6 text-sm text-ink/50">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#39A2B8] border-t-transparent" />
            正在从 Kimi 获取 {country?.name.zh} 最新签证信息…
          </div>
        ) : aiVisaType ? (
          <div className="space-y-5">
            {/* 身份分层材料 */}
            <div>
              <div className="mb-2 text-xs font-medium text-ink/45">按身份分层的材料清单</div>
              <div className="grid gap-3 sm:grid-cols-2">
                {IDENTITY_KEYS.map((key) => {
                  const list = aiVisaType.identityRequirements?.[key]
                  if (!list || list.length === 0) return null
                  const label = t(`encyclopedia.identity${key.charAt(0).toUpperCase() + key.slice(1)}`)
                  return (
                    <div key={key} className="rounded-xl border border-ink/5 p-4">
                      <div className="mb-2 text-sm font-semibold text-ink">{label}</div>
                      <ul className="space-y-1.5">
                        {list.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-[13px] text-ink/65">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#39A2B8]" />
                            <span>
                              {r.name}
                              {r.details && <span className="ml-1 text-xs text-ink/40">· {r.details}</span>}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 核心材料分类 */}
            {aiVisaType.requirements && (
              <div className="grid gap-3 sm:grid-cols-2">
                {(['basic', 'financial', 'identity', 'travel'] as const).map((cat) => {
                  const list = aiVisaType.requirements?.[cat]
                  if (!list || list.length === 0) return null
                  const label = t(`encyclopedia.${cat}Materials`)
                  return (
                    <div key={cat} className="rounded-xl border border-ink/5 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-semibold text-ink">{label}</span>
                        <VBadge>{list.length}</VBadge>
                      </div>
                      <ul className="space-y-1.5">
                        {list.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-[13px] text-ink/65">
                            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${r.required ? 'bg-primary' : 'bg-ink/25'}`} />
                            <span>
                              {r.name}
                              {r.details && <span className="ml-1 text-xs text-ink/40">· {r.details}</span>}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            )}

            {/* FAQ */}
            {ai?.faq && ai.faq.length > 0 && (
              <div>
                <div className="mb-2 text-xs font-medium text-ink/45">AI 整理 FAQ</div>
                <div className="space-y-2">
                  {ai.faq.map((f, i) => (
                    <details key={i} className="group rounded-xl border border-ink/5 p-3">
                      <summary className="cursor-pointer list-none text-sm font-medium text-ink">
                        <span className="mr-2 text-[#39A2B8]">Q.</span>
                        {f.question}
                        <span className="float-right text-ink/30 transition-transform group-open:rotate-45">+</span>
                      </summary>
                      <p className="mt-2 pl-6 text-[13px] leading-relaxed text-ink/60">{f.answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            )}

            {ai?.tips && (
              <div className="rounded-xl bg-[#E8F5E9] px-4 py-3 text-sm text-ink/70">
                💡 {ai.tips}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* 标签页 */}
      <div className="anim-card rounded-2xl bg-white p-6 shadow-card" style={{ animationDelay: '180ms' }}>
        <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-ink/5 pb-4">
          {([
            ['materials', t('encyclopedia.materials')],
            ['fee', t('encyclopedia.feeTab')],
            ['districts', t('encyclopedia.districtsTab')],
            ['faq', t('encyclopedia.faqTab')],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-150 ${
                tab === key ? 'bg-ink text-white' : 'text-ink/55 hover:bg-ink/5 hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <VButton variant="secondary" size="sm" onClick={() => setAiOpen(true)}>
              <span className="text-sm">🤖</span> {t('encyclopedia.askAI')}
            </VButton>
            <VButton
              size="sm"
              onClick={() =>
                navigate('/assistant', {
                  state: { countryId: country.id, visaTypeId: visaType.id },
                })
              }
            >
              {t('encyclopedia.startApplication')}
            </VButton>
          </div>
        </div>

        {tab === 'materials' && (
          country.id === 'new-zealand' || country.id === 'schengen' ? (
            <div>
              <RequirementList
                countryName={country.name.zh}
                requirements={visaType.requirements}
                translationBanner={
                  country.id === 'new-zealand'
                    ? NZ_TRANSLATION_BANNER
                    : null
                }
              />
              {/* 引导到申请页 */}
              <div className="mt-6 flex items-center justify-between rounded-2xl border border-dashed border-ink/15 bg-[#F9F9F6] px-5 py-4">
                <div>
                  <div className="text-sm font-bold text-ink">去申请签证</div>
                  <div className="mt-0.5 text-xs text-ink/50">
                    材料自动检测、一键生成与递交在「申请签证」页面完成
                  </div>
                </div>
                <VButton
                  size="sm"
                  onClick={() =>
                    navigate('/assistant', {
                      state: { countryId: country.id, visaTypeId: visaType.id },
                    })
                  }
                >
                  去申请签证 →
                </VButton>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-ink/15 bg-[#F9F9F6] px-6 py-12 text-center">
              <span className="text-4xl">📋</span>
              <h4 className="text-base font-bold text-ink">查看详细材料</h4>
              <p className="max-w-md text-sm text-ink/50">
                材料清单、自动检测、一键生成与递交均在「申请签证」页面完成，避免信息分散。
              </p>
              <VButton
                size="lg"
                className="mt-2"
                onClick={() =>
                  navigate('/assistant', {
                    state: { countryId: country.id, visaTypeId: visaType.id },
                  })
                }
              >
                去申请签证 →
              </VButton>
            </div>
          )
        )}

        {tab === 'fee' && (
          <FeeCalculator countryId={country.id} visaType={visaType} />
        )}

        {tab === 'districts' && (
          <div>
            <div className="mb-5">
              <label className="mb-2 block text-sm font-medium text-ink/60">
                {t('encyclopedia.provinceSearch')}
              </label>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full max-w-sm rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40"
              >
                <option value="">{t('encyclopedia.provincePlaceholder')}</option>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              {matchedDistrict && (
                <div className="mt-3 rounded-xl bg-[#E0F7FA] px-4 py-3 text-sm text-ink">
                  <span className="font-medium text-primary">{t('encyclopedia.currentDistrict')}：</span>
                  {matchedDistrict.name.zh}
                </div>
              )}
            </div>
            <div className="space-y-3">
              {visaType.consularDistricts.map((d, i) => (
                <div key={i} className="rounded-xl border border-ink/5 p-4">
                  <div className="text-sm font-semibold text-ink">{d.name.zh}</div>
                  <div className="mt-1 text-xs text-ink/45">{t('encyclopedia.coverCities')}: {d.provinces.join('、')}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'faq' && (
          <div className="space-y-3">
            {visaType.faq.map((f, i) => (
              <details key={i} className="group rounded-xl border border-ink/5 p-4">
                <summary className="cursor-pointer list-none text-sm font-medium text-ink">
                  <span className="mr-2 text-primary">Q.</span>
                  {f.question.zh}
                  <span className="float-right text-ink/30 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 pl-6 text-sm leading-relaxed text-ink/60">{f.answer.zh}</p>
              </details>
            ))}
            {visaType.rejectionReasons.length > 0 && (
              <div className="rounded-xl bg-red-50/60 p-4">
                <div className="mb-2 text-sm font-semibold text-red-600">
                  {t('assistant.rejectionReasons')}
                </div>
                <ul className="space-y-1.5">
                  {visaType.rejectionReasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] text-ink/60">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                      {r.zh}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 近期政策 */}
      {country.announcements.length > 0 && (
        <div className="anim-card rounded-2xl bg-white p-6 shadow-card" style={{ animationDelay: '240ms' }}>
          <h3 className="mb-4 text-sm font-medium text-subtle">{t('encyclopedia.announcements')}</h3>
          <div className="space-y-3">
            {country.announcements.map((a, i) => (
              <div key={i} className="flex gap-3 rounded-xl border border-ink/5 p-4">
                <span className="shrink-0 text-xs font-medium text-ink/35">{a.date}</span>
                <div>
                  <div className="text-sm font-semibold text-ink">{a.title.zh}</div>
                  <p className="mt-0.5 text-[13px] text-ink/55">{a.content.zh}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI 助手 */}
      <AIAssistant open={aiOpen} onClose={() => setAiOpen(false)} country={country} />
    </div>
  )
}
