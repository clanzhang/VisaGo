// pages/CountryDetail.tsx
import { defineComponent, ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useLocalizedText } from '../composables/useVisaQuery'
import { countries, DIFFICULTY_LABELS } from '../data/countries'
import { getVisaExtra, getDistrictCity } from '../data/encyclopedia-extra'
import { getFeeBreakdown, getVisaFlags, useChecklistProgress } from '../composables/useEncyclopedia'
import { VBadge, VButton } from '../components/common'
import { AIAssistant } from '../components/visa'
import type { Requirement, VisaType } from '../types'

type TabKey = 'overview' | 'types' | 'materials' | 'fee' | 'districts' | 'faq'

export default defineComponent({
  name: 'CountryDetail',
  setup() {
    const { t } = useI18n()
    const { t: lt } = useLocalizedText()
    const route = useRoute()
    const router = useRouter()
    const activeTab = ref<TabKey>('overview')
    const openFaq = ref<number | null>(0)
    const openType = ref<number | null>(0)
    const identity = ref<'employed' | 'student' | 'retired' | 'freelance'>('employed')
    const checked = ref<Set<string>>(new Set())
    const province = ref('')
    const scrolled = ref(false)

    const country = computed(() => countries.find((c) => c.id === route.params.id))

    watch(
      () => route.params.id,
      () => {
        activeTab.value = 'overview'
        openFaq.value = 0
        openType.value = 0
        checked.value = new Set()
      },
    )

    // 吸顶 Tab 阴影
    const onScroll = () => (scrolled.value = window.scrollY > 220)
    onMounted(() => window.addEventListener('scroll', onScroll))
    onUnmounted(() => window.removeEventListener('scroll', onScroll))

    const difficultyLabel = (key: string) =>
      DIFFICULTY_LABELS[key as keyof typeof DIFFICULTY_LABELS]

    const tabs: { key: TabKey; labelKey: string; icon: string }[] = [
      { key: 'overview', labelKey: 'encyclopedia.overview', icon: 'ri:layout-2-line' },
      { key: 'types', labelKey: 'encyclopedia.visaTypeTab', icon: 'ri:list-check' },
      { key: 'materials', labelKey: 'encyclopedia.materials', icon: 'ri:file-list-3-line' },
      { key: 'fee', labelKey: 'encyclopedia.feeTab', icon: 'ri:wallet-3-line' },
      { key: 'districts', labelKey: 'encyclopedia.districtsTab', icon: 'ri:map-pin-line' },
      { key: 'faq', labelKey: 'encyclopedia.faqTab', icon: 'ri:question-line' },
    ]

    // 主签证类型（默认展示第一个）
    const primaryVisaType = computed<VisaType | undefined>(() => country.value?.visaTypes[0])

    // 最低费用 + 最短周期
    const minFee = computed(() => {
      const c = country.value
      return c ? Math.min(...c.visaTypes.map((v) => v.fee.amount)) : 0
    })
    const minDays = computed(() => {
      const c = country.value
      return c ? Math.min(...c.visaTypes.map((v) => v.processingDays.min)) : 0
    })
    const maxDays = computed(() => {
      const c = country.value
      return c ? Math.max(...c.visaTypes.map((v) => v.processingDays.max)) : 0
    })

    // 材料要求（身份视角）
    const currentRequirements = computed<Requirement[]>(() => {
      if (!primaryVisaType.value) return []
      const base = [...primaryVisaType.value.requirements]
      // 按身份补充材料（按名称去重，避免与基础材料重复）
      const extraByIdentity = getIdentityExtras(identity.value)
      const combined = [...base]
      for (const r of extraByIdentity) {
        if (!combined.some((x) => x.name.zh === r.name.zh)) combined.push(r)
      }
      return combined
    })

    // 完成度
    const { done, percent } = useChecklistProgress(
      currentRequirements.value.length,
      () => currentRequirements.value.filter((r) => checked.value.has(r.id)).length,
    )

    const toggleCheck = (id: string) => {
      const next = new Set(checked.value)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      checked.value = next
    }

    // 领区匹配
    const matchedDistricts = computed(() => {
      const c = country.value
      if (!c || !province.value) return []
      return c.visaTypes[0]?.consularDistricts.filter((d) =>
        d.provinces.includes(province.value),
      ) ?? []
    })

    // 身份材料补充（按关键词去重：基础已含的项不重复添加）
    function getIdentityExtras(occ: string): Requirement[] {
      const map: Record<string, Requirement[]> = {
        employed: [
          { id: 'emp-idcard', name: { zh: '身份证复印件', en: 'ID card copy' }, category: 'basic', required: true, format: 'copy', translationRequired: false },
          { id: 'emp-hukou', name: { zh: '户口本复印件', en: 'Household registration copy' }, category: 'basic', required: true, format: 'copy', translationRequired: false },
        ],
        student: [
          { id: 'stu-cert', name: { zh: '在读证明（学校盖章）', en: 'School certificate' }, category: 'identity', required: true, format: 'original', translationRequired: true },
          { id: 'stu-parent', name: { zh: '出资人（父母）流水/在职证明', en: 'Sponsor bank statement' }, category: 'financial', required: true, format: 'copy', translationRequired: false },
        ],
        retired: [
          { id: 'ret-cert', name: { zh: '退休证复印件', en: 'Pension certificate' }, category: 'identity', required: true, format: 'copy', translationRequired: false },
          { id: 'ret-pension', name: { zh: '养老金流水', en: 'Pension statement' }, category: 'financial', required: true, format: 'original', translationRequired: false },
        ],
        freelance: [
          { id: 'fre-letter', name: { zh: '收入来源解释信', en: 'Income explanation' }, category: 'identity', required: true, format: 'original', translationRequired: true },
          { id: 'fre-asset', name: { zh: '资产证明（房产/车产）', en: 'Asset certificates' }, category: 'financial', required: false, format: 'copy', translationRequired: false },
        ],
      }
      return map[occ] ?? []
    }

    // 导出材料清单 PDF
    const exportMaterialsPdf = async () => {
      const { exportElementToPdf } = await import('../utils/pdf')
      const el = document.getElementById('material-checklist')
      if (el) await exportElementToPdf(el, { filename: `${lt(country.value?.name)}-材料清单.pdf` })
    }

    const identityOptions = [
      { key: 'employed', labelKey: 'encyclopedia.identityEmployed' },
      { key: 'student', labelKey: 'encyclopedia.identityStudent' },
      { key: 'retired', labelKey: 'encyclopedia.identityRetired' },
      { key: 'freelance', labelKey: 'encyclopedia.identityFreelance' },
    ] as const

    const reqLabel = (required: boolean) =>
      required
        ? { text: t('encyclopedia.required'), cls: 'bg-brand-blue text-white' }
        : { text: t('encyclopedia.optional'), cls: 'bg-gray-200 text-gray-600' }

    return () => {
      if (!country.value) {
        return (
          <div class="card-base flex flex-col items-center gap-4 p-10 text-center">
            <span class="i-ri-alert-line text-5xl text-brand-muted/50" aria-hidden="true" />
            <p class="text-brand-muted">{t('common.noData')}</p>
            <RouterLink to="/encyclopedia">
              <span class="btn-primary inline-flex">{t('encyclopedia.backToList')}</span>
            </RouterLink>
          </div>
        )
      }

      const c = country.value

      return (
        <div class="animate-page-in pb-24">
          {/* 顶部 Banner */}
          <section class="relative overflow-hidden bg-gradient-to-br from-brand-dark via-brand-blue to-brand-blue text-white">
            {/* 几何装饰 */}
            <div class="absolute inset-0" aria-hidden="true">
              <div class="absolute left-8 top-6 h-6 w-6 rotate-45 bg-white/10" />
              <div class="absolute right-24 top-10 h-4 w-4 rounded-full bg-white/15" />
              <div class="absolute right-10 bottom-10 h-8 w-8 rotate-12 bg-white/5" />
              <div class="absolute left-1/3 bottom-8 h-1 w-20 rounded-full bg-white/10" />
            </div>

            <div class="container-app relative py-10 sm:py-12" style="min-height: 220px;">
              <button
                onClick={() => router.push('/encyclopedia')}
                class="mb-4 inline-flex items-center gap-1 text-sm text-white/60 hover:text-white"
              >
                <span class="i-ri-arrow-left-line text-base" aria-hidden="true" />
                {t('encyclopedia.backToList')}
              </button>

              <div class="flex flex-wrap items-end gap-4">
                <span class="text-6xl leading-none" aria-hidden="true">{c.flag}</span>
                <div class="flex-1">
                  <h1 class="text-3xl font-bold tracking-wide">{lt(c.name)}</h1>
                  <p class="text-base text-white/60">{c.name.en}</p>
                </div>
              </div>

              <p class="mt-3 max-w-xl text-sm leading-relaxed text-white/80">{lt(c.overview)}</p>

              {/* 数据标签 */}
              <div class="mt-5 flex flex-wrap gap-2">
                <span class="rounded-full bg-white/15 px-3 py-1.5 text-xs">
                  {t('encyclopedia.visaDifficulty')}: {lt(difficultyLabel(c.difficulty))}
                </span>
                <span class="rounded-full bg-white/15 px-3 py-1.5 text-xs">
                  {c.visaTypes.length} {t('encyclopedia.visaTypes')}
                </span>
                <span class="rounded-full bg-white/15 px-3 py-1.5 text-xs">
                  {t('encyclopedia.minFee')}: ¥{minFee.value}
                </span>
                <span class="rounded-full bg-white/15 px-3 py-1.5 text-xs">
                  {t('encyclopedia.processingTime')}: {minDays.value}-{maxDays.value} {t('assistant.days')}
                </span>
              </div>
            </div>
          </section>

          {/* 粘性 Tab 导航 */}
          <div class={`sticky top-16 z-30 border-b border-gray-100 bg-white/95 backdrop-blur-lg ${scrolled.value ? 'shadow-md' : ''}`}>
            <div class="container-app flex gap-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => (activeTab.value = tab.key)}
                  class={`relative shrink-0 px-4 py-3 text-sm font-medium transition-all ${
                    activeTab.value === tab.key ? 'text-brand-blue' : 'text-brand-muted hover:text-brand-dark'
                  }`}
                >
                  <span class="flex items-center gap-1.5">
                    <span class={`i-${tab.icon} text-sm`} aria-hidden="true" />
                    {t(tab.labelKey)}
                  </span>
                  {activeTab.value === tab.key && (
                    <span class="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-brand-blue transition-all" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab 内容 */}
          <div class="container-app py-6">
            {/* Tab 1: 概览 */}
            {activeTab.value === 'overview' && (
              <div class="space-y-6">
                <section>
                  <h2 class="mb-4 flex items-center gap-2 text-lg font-semibold text-brand-dark">
                    <span class="i-ri-list-check text-brand-blue" aria-hidden="true" />
                    {t('encyclopedia.overviewSub')}
                  </h2>
                  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {c.visaTypes.map((vt) => {
                      const flags = getVisaFlags(c.id, vt.id)
                      const extra = getVisaExtra(c.id, vt.id)
                      return (
                        <button
                          key={vt.id}
                          onClick={() => {
                            openType.value = c.visaTypes.findIndex((x) => x.id === vt.id)
                            activeTab.value = 'types'
                          }}
                          class="card-base p-5 text-left hover:-translate-y-1"
                        >
                          <div class="flex items-start justify-between">
                            <span class="text-2xl" aria-hidden="true">
                              {vt.category === 'business' ? '💼' : '🏖'}
                            </span>
                            <VBadge tone={vt.entries === 'multiple' ? 'blue' : 'gray'}>
                              {t(`encyclopedia.${vt.entries}`)}
                            </VBadge>
                          </div>
                          <h3 class="mt-3 font-semibold text-brand-dark">{lt(vt.name)}</h3>
                          <div class="mt-2 space-y-1 text-xs text-brand-muted">
                            <p>{t('encyclopedia.duration')}: {vt.duration}</p>
                            <p>{t('encyclopedia.validity')}: {vt.validity}</p>
                            <p>{t('encyclopedia.fee')}: ¥{vt.fee.amount}</p>
                            <p>{t('encyclopedia.processingTime')}: {vt.processingDays.min}-{vt.processingDays.max} {t('assistant.days')}</p>
                          </div>
                          {extra && (
                            <div class="mt-3 flex flex-wrap gap-1.5">
                              <VBadge tone={flags.canApplyOnline ? 'green' : 'gray'}>
                                {flags.canApplyOnline ? '✅ ' : ''}{t('encyclopedia.canApplyOnline')}
                              </VBadge>
                            </div>
                          )}
                          <span class="mt-3 inline-flex items-center gap-1 text-xs text-accent-purple">
                            {t('encyclopedia.viewAll')} →
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </section>

                {/* 免签政策 */}
                <section class="card-base border-accent-orange/30 bg-accent-orange/5 p-5">
                  <h2 class="mb-3 flex items-center gap-2 text-lg font-semibold text-brand-dark">
                    <span class="i-ri-ticket-2-line text-accent-orange" aria-hidden="true" />
                    {t('encyclopedia.visaFreeSub')}
                  </h2>
                  <p class="text-sm leading-relaxed text-gray-600">{lt(c.visaFree)}</p>
                </section>

                {/* 近期政策变动 */}
                <section>
                  <h2 class="mb-4 flex items-center gap-2 text-lg font-semibold text-brand-dark">
                    <span class="i-ri-megaphone-line text-blue-600" aria-hidden="true" />
                    {t('encyclopedia.announcements')}
                  </h2>
                  {c.announcements.length > 0 ? (
                    <div class="space-y-3">
                      {c.announcements.map((a, i) => (
                        <div key={i} class="card-base p-4">
                          <div class="flex items-center gap-2">
                            <span class="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">{a.date}</span>
                            <b class="text-sm text-brand-dark">{lt(a.title)}</b>
                          </div>
                          <p class="mt-1.5 text-sm text-gray-600">{lt(a.content)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p class="text-sm text-brand-muted">{t('encyclopedia.noAnnouncements')}</p>
                  )}
                </section>
              </div>
            )}

            {/* Tab 2: 签证类型 */}
            {activeTab.value === 'types' && (
              <div class="space-y-4">
                {c.visaTypes.map((vt, idx) => {
                  const isOpen = openType.value === idx
                  const flags = getVisaFlags(c.id, vt.id)
                  return (
                    <div
                      key={vt.id}
                      class={`overflow-hidden rounded-24px border transition-all ${
                        isOpen ? 'border-brand-blue/30 shadow-md' : 'border-gray-100 bg-white'
                      }`}
                    >
                      <button
                        onClick={() => (openType.value = isOpen ? -1 : idx)}
                        class="flex w-full items-center justify-between gap-3 p-5 text-left"
                        aria-expanded={isOpen}
                      >
                        <div class="flex items-center gap-3">
                          <span class="text-2xl" aria-hidden="true">
                            {vt.category === 'business' ? '💼' : '🏖'}
                          </span>
                          <div>
                            <h3 class="font-semibold text-brand-dark">{lt(vt.name)}</h3>
                            <p class="text-xs text-brand-muted">
                              {t('encyclopedia.duration')}: {vt.duration} · {t('encyclopedia.validity')}: {vt.validity} · {t(`encyclopedia.${vt.entries}`)}
                            </p>
                          </div>
                        </div>
                        <div class="flex items-center gap-3">
                          <span class="text-sm font-semibold text-accent-purple">¥{vt.fee.amount}</span>
                          <span class={`i-ri-arrow-down-s-line text-brand-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                        </div>
                      </button>

                      {isOpen && (
                        <div class="border-t border-gray-50 p-5">
                          {/* 关键信息 */}
                          <div class="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {[
                              { label: t('encyclopedia.duration'), value: vt.duration },
                              { label: t('encyclopedia.validity'), value: vt.validity },
                              { label: t('encyclopedia.entries'), value: t(`encyclopedia.${vt.entries}`) },
                              { label: t('encyclopedia.processingTime'), value: `${vt.processingDays.min}-${vt.processingDays.max} ${t('assistant.days')}` },
                            ].map((item) => (
                              <div key={item.label} class="rounded-xl bg-brand-bg px-3 py-2.5">
                                <p class="text-xs text-brand-muted">{item.label}</p>
                                <p class="mt-0.5 text-sm font-semibold text-brand-dark">{item.value}</p>
                              </div>
                            ))}
                          </div>

                          {/* 标志信息 */}
                          <div class="mb-5 flex flex-wrap gap-2">
                            <VBadge tone={flags.needInterview ? 'orange' : 'green'}>
                              {t('encyclopedia.needInterview')}: {flags.needInterview ? t('encyclopedia.yes') : t('encyclopedia.no')}
                            </VBadge>
                            <VBadge tone={flags.canApplyOnline ? 'green' : 'gray'}>
                              {t('encyclopedia.canApplyOnline')}: {flags.canApplyOnline ? t('encyclopedia.yes') : t('encyclopedia.no')}
                            </VBadge>
                            <VBadge tone={flags.acceptPersonal ? 'green' : 'red'}>
                              {t('encyclopedia.acceptPersonal')}: {flags.acceptPersonal ? t('encyclopedia.yes') : t('encyclopedia.no')}
                            </VBadge>
                          </div>

                          {flags.targetAudience.zh && (
                            <div class="mb-5 rounded-xl border border-brand-blue/20 bg-brand-blue/5 px-4 py-3">
                              <p class="text-xs font-medium text-brand-blue">{t('encyclopedia.targetAudience')}</p>
                              <p class="mt-1 text-sm text-brand-dark">{lt(flags.targetAudience)}</p>
                            </div>
                          )}

                          {/* 材料分组 */}
                          <h4 class="mb-3 text-sm font-semibold text-brand-dark">{t('encyclopedia.requirements')}</h4>
                          {(['basic', 'identity', 'financial', 'travel', 'extra'] as const).map((cat) => {
                            const items = vt.requirements.filter((r) => r.category === cat)
                            if (items.length === 0) return null
                            const catLabel: Record<string, string> = {
                              basic: t('encyclopedia.basicMaterials'),
                              identity: t('encyclopedia.identityMaterials'),
                              financial: t('encyclopedia.financialMaterials'),
                              travel: t('encyclopedia.travelMaterials'),
                              extra: t('encyclopedia.extraMaterials'),
                            }
                            return (
                              <div key={cat} class="mb-4">
                                <p class="mb-2 flex items-center gap-1.5 text-xs font-semibold text-brand-dark">
                                  <span class={`i-${cat === 'basic' ? 'ri-file-list-3-line' : cat === 'identity' ? 'ri-id-card-line' : cat === 'financial' ? 'ri-wallet-3-line' : cat === 'travel' ? 'ri-flight-takeoff-line' : 'ri-add-circle-line'} text-brand-blue`} aria-hidden="true" />
                                  {catLabel[cat]}
                                </p>
                                <div class="space-y-1.5">
                                  {items.map((r) => {
                                    const label = reqLabel(r.required)
                                    return (
                                      <div key={r.id} class="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2">
                                        <span class="text-sm text-brand-dark">{lt(r.name)}</span>
                                        <div class="flex shrink-0 gap-1.5">
                                          <span class={`rounded px-2 py-0.5 text-[10px] font-medium ${label.cls}`}>{label.text}</span>
                                          <span class="rounded bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
                                            {t(`encyclopedia.${r.format}`)}
                                          </span>
                                          {r.translationRequired && (
                                            <span class="rounded bg-blue-50 px-2 py-0.5 text-[10px] text-blue-600">
                                              {t('encyclopedia.translation')}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })}

                          {/* 注意事项 + 拒签原因 */}
                          <div class="mb-4 rounded-xl bg-brand-bg p-4">
                            <p class="text-xs font-medium text-brand-muted">{t('common.tips')}</p>
                            <p class="mt-1 text-sm text-brand-dark">{lt(vt.tips)}</p>
                          </div>
                          <div class="mb-5">
                            <p class="mb-2 text-xs font-semibold text-brand-dark">{t('encyclopedia.faqTab')} · 拒签</p>
                            <div class="space-y-1.5">
                              {vt.rejectionReasons.map((r, i) => (
                                <p key={i} class="flex items-start gap-1.5 text-sm text-gray-600">
                                  <span class="mt-0.5 i-ri-close-circle-fill text-red-400" aria-hidden="true" />
                                  {lt(r)}
                                </p>
                              ))}
                            </div>
                          </div>

                          <RouterLink to={`/assistant?country=${c.id}&type=${vt.id}`}>
                            <span class="btn-purple inline-flex w-full justify-center">
                              {t('encyclopedia.startApplication')}
                              <span class="i-ri-arrow-right-line text-sm" aria-hidden="true" />
                            </span>
                          </RouterLink>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Tab 3: 材料要求（身份视角） */}
            {activeTab.value === 'materials' && (
              <div class="space-y-5">
                {/* 身份选择器 */}
                <div class="flex flex-wrap gap-2">
                  {identityOptions.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => (identity.value = opt.key)}
                      class={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        identity.value === opt.key
                          ? 'bg-brand-blue text-white shadow'
                          : 'border border-gray-200 text-brand-muted hover:border-brand-blue/40'
                      }`}
                    >
                      {t(opt.labelKey)}
                    </button>
                  ))}
                </div>

                {/* 完成度 */}
                <div class="card-base p-5">
                  <div class="mb-2 flex items-center justify-between text-sm">
                    <span class="font-medium text-brand-dark">
                      {t('encyclopedia.identityEmployed') === '' ? '' : ''}
                      {lt(c.name)} · {t(`encyclopedia.identity${identity.value.charAt(0).toUpperCase()}${identity.value.slice(1)}`)} · {t('encyclopedia.completion')}
                    </span>
                    <span class="font-semibold text-brand-blue">{done.value}/{currentRequirements.value.length} · {percent.value}%</span>
                  </div>
                  <div class="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      class="h-full rounded-full bg-gradient-to-r from-brand-blue to-accent-purple transition-all duration-500"
                      style={{ width: `${percent.value}%` }}
                    />
                  </div>
                </div>

                {/* 材料清单 */}
                <div id="material-checklist" class="card-base p-5">
                  {(['basic', 'identity', 'financial', 'travel', 'extra'] as const).map((cat) => {
                    const items = currentRequirements.value.filter((r) => r.category === cat)
                    if (items.length === 0) return null
                    const catLabel: Record<string, string> = {
                      basic: t('encyclopedia.basicMaterials'),
                      identity: t('encyclopedia.identityMaterials'),
                      financial: t('encyclopedia.financialMaterials'),
                      travel: t('encyclopedia.travelMaterials'),
                      extra: t('encyclopedia.extraMaterials'),
                    }
                    return (
                      <div key={cat} class="mb-5">
                        <p class="mb-2 flex items-center gap-1.5 text-sm font-semibold text-brand-dark">
                          <span class={`i-${cat === 'basic' ? 'ri-file-list-3-line' : cat === 'identity' ? 'ri-id-card-line' : cat === 'financial' ? 'ri-wallet-3-line' : cat === 'travel' ? 'ri-flight-takeoff-line' : 'ri-add-circle-line'} text-brand-blue`} aria-hidden="true" />
                          {catLabel[cat]}
                        </p>
                        <div class="space-y-1.5">
                          {items.map((r) => {
                            const isChecked = checked.value.has(r.id)
                            const label = reqLabel(r.required)
                            return (
                              <button
                                key={r.id}
                                onClick={() => toggleCheck(r.id)}
                                class={`flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${
                                  isChecked ? 'border-brand-blue/40 bg-brand-blue/5' : 'border-gray-100 hover:border-brand-blue/20'
                                }`}
                              >
                                <span class={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${isChecked ? 'border-brand-blue bg-brand-blue text-white' : 'border-gray-300 bg-white'}`} aria-hidden="true">
                                  {isChecked && <span class="i-ri-check-line text-xs" />}
                                </span>
                                <span class="flex-1">
                                  <span class="block text-sm text-brand-dark">{lt(r.name)}</span>
                                  <span class="mt-1 flex flex-wrap gap-1.5">
                                    <span class={`rounded px-2 py-0.5 text-[10px] font-medium ${label.cls}`}>{label.text}</span>
                                    <span class="rounded bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">{t(`encyclopedia.${r.format}`)}</span>
                                    {r.translationRequired && (
                                      <span class="rounded bg-blue-50 px-2 py-0.5 text-[10px] text-blue-600">{t('encyclopedia.translation')}</span>
                                    )}
                                  </span>
                                  {r.notes && <span class="mt-1 block text-xs text-brand-muted">💡 {lt(r.notes)}</span>}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* 操作 */}
                <div class="flex flex-wrap gap-3">
                  <VButton variant="purple" onClick={exportMaterialsPdf}>
                    <span class="i-ri-file-download-line text-sm" aria-hidden="true" />
                    {t('encyclopedia.exportPdf')}
                  </VButton>
                </div>
              </div>
            )}

            {/* Tab 4: 费用 */}
            {activeTab.value === 'fee' && (
              <div class="space-y-5">
                <div class="card-base overflow-hidden p-0">
                  <div class="overflow-x-auto">
                    <table class="w-full min-w-[520px] text-sm">
                      <thead>
                        <tr class="border-b border-gray-100 bg-brand-bg text-left text-xs text-brand-muted">
                          <th class="px-5 py-3 font-medium">{t('encyclopedia.feeComparison')}</th>
                          {c.visaTypes.map((vt) => (
                            <th key={vt.id} class="px-4 py-3 font-medium">{lt(vt.name)}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(['visaFee', 'serviceFee', 'courierFee', 'photoFee'] as const).map((feeKey) => (
                          <tr key={feeKey} class="border-b border-gray-50">
                            <td class="px-5 py-3 text-gray-500">
                              {t(`encyclopedia.${feeKey === 'visaFee' ? 'visaFee' : feeKey === 'serviceFee' ? 'serviceFee' : feeKey === 'courierFee' ? 'courierFee' : 'photoFee'}`)}
                            </td>
                            {c.visaTypes.map((vt) => {
                              const fees = getFeeBreakdown(c.id, vt.id)
                              return <td key={vt.id} class="px-4 py-3 font-medium text-brand-dark">¥{fees[feeKey]}</td>
                            })}
                          </tr>
                        ))}
                        <tr>
                          <td class="px-5 py-3 font-semibold text-brand-dark">{t('encyclopedia.total')}</td>
                          {c.visaTypes.map((vt) => {
                            const fees = getFeeBreakdown(c.id, vt.id)
                            const total = fees.visaFee + fees.serviceFee + fees.courierFee + fees.photoFee
                            return <td key={vt.id} class="px-4 py-3 font-bold text-accent-purple">¥{total}</td>
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <p class="text-xs text-brand-muted">* {t('encyclopedia.feeNote')}</p>
              </div>
            )}

            {/* Tab 5: 领区 */}
            {activeTab.value === 'districts' && (
              <div class="space-y-5">
                {/* 省份匹配 */}
                <div class="card-base p-5">
                  <label class="mb-2 block text-sm font-medium text-brand-dark">
                    {t('encyclopedia.provinceSearch')}
                  </label>
                  <input
                    v-model={province.value}
                    placeholder={t('encyclopedia.provincePlaceholder')}
                    class="input-base max-w-sm"
                  />
                  {matchedDistricts.value.length > 0 && (
                    <div class="mt-3">
                      <p class="mb-2 text-xs font-semibold text-accent-purple">
                        {t('encyclopedia.currentDistrict')}:
                      </p>
                      {matchedDistricts.value.map((d, i) => (
                        <p key={i} class="text-sm font-medium text-brand-dark">
                          🏛 {lt(d.name)}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {/* 领区卡片 */}
                <div class="grid gap-3 sm:grid-cols-2">
                  {c.visaTypes[0]?.consularDistricts.map((d, i) => (
                    <div
                      key={i}
                      class={`card-base p-4 ${
                        matchedDistricts.value.includes(d) ? 'border-accent-purple ring-1 ring-accent-purple' : ''
                      }`}
                    >
                      <h3 class="flex items-center gap-2 text-sm font-medium text-brand-dark">
                        <span class="i-ri-bank-line text-brand-blue" aria-hidden="true" />
                        {lt(d.name)}
                        {getDistrictCity(c.id, i) && (
                          <span class="text-xs text-brand-muted">· {getDistrictCity(c.id, i)}</span>
                        )}
                      </h3>
                      <p class="mt-2 text-xs leading-relaxed text-brand-muted">
                        {t('encyclopedia.coverCities')}: {d.provinces.join('、')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 6: FAQ */}
            {activeTab.value === 'faq' && (
              <div class="space-y-2">
                {c.visaTypes.flatMap((vt) => vt.faq).map((item, i) => {
                  const isOpen = openFaq.value === i
                  return (
                    <div
                      key={i}
                      class={`overflow-hidden rounded-16px border transition-all ${
                        isOpen ? 'border-brand-blue/30 bg-brand-blue/5' : 'border-gray-100 bg-white'
                      }`}
                    >
                      <button
                        onClick={() => (openFaq.value = isOpen ? -1 : i)}
                        class="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
                        aria-expanded={isOpen}
                      >
                        <span class="flex items-center gap-2 text-sm font-medium text-brand-dark">
                          <span class="i-ri-question-line text-brand-blue" aria-hidden="true" />
                          {lt(item.question)}
                        </span>
                        <span
                          class={`i-ri-arrow-down-s-line text-brand-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
                          aria-hidden="true"
                        />
                      </button>
                      {isOpen && (
                        <p class="px-4 pb-4 pl-10 text-sm leading-relaxed text-gray-600">{lt(item.answer)}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 底部操作栏 */}
          <div class="container-app mt-4 flex flex-wrap items-center gap-3 rounded-24px border border-gray-100 bg-white p-5">
            <RouterLink to={`/assistant?country=${c.id}`}>
              <span class="btn-purple inline-flex">
                <span class="i-ri-rocket-2-line text-sm" aria-hidden="true" />
                {t('encyclopedia.startApplication')}
              </span>
            </RouterLink>
            <RouterLink to={`/encyclopedia/compare?ids=${c.id}`}>
              <span class="btn-primary inline-flex">
                <span class="i-ri-bar-chart-2-line text-sm" aria-hidden="true" />
                {t('encyclopedia.compareOther')}
              </span>
            </RouterLink>
          </div>

          {/* AI 浮窗 */}
          <AIAssistant country={c} />
        </div>
      )
    }
  },
})
