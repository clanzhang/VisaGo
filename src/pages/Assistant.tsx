// pages/Assistant.tsx
import { defineComponent, ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useLocalizedText } from '../composables/useVisaQuery'
import { countries, PROVINCES, OCCUPATIONS, DIFFICULTY_LABELS } from '../data/countries'
import { useVisaStore } from '../stores/visaStore'
import { useTrackerStore } from '../stores/trackerStore'
import { useNotification } from '../composables/useNotification'
import { CountryCard } from '../components/visa'
import { Checklist } from '../components/visa'
import { FeeCalculator } from '../components/visa'
import { VBadge, VButton } from '../components/common'
import { exportElementToPdf } from '../utils/pdf'
import type { Country, VisaType } from '../types'

const STEPS = ['step1', 'step2', 'step3', 'step4']

// 便捷事件处理辅助：从事件中提取 string 值
function val(e: Event): string {
  return (e.target as HTMLInputElement).value
}

export default defineComponent({
  name: 'Assistant',
  setup() {
    const { t } = useI18n()
    const { t: lt } = useLocalizedText()
    const route = useRoute()
    const router = useRouter()
    const visa = useVisaStore()
    const tracker = useTrackerStore()
    const notify = useNotification()

    const keyword = ref('')
    const resultEl = ref<HTMLDivElement | null>(null)
    const exporting = ref(false)

    // 从 URL 参数初始化国家
    onMounted(() => {
      const cid = route.query.country as string | undefined
      if (cid && countries.some((c) => c.id === cid)) {
        visa.setCountry(cid)
        visa.setStep(1)
      }
    })

    const country = computed(() => countries.find((c) => c.id === visa.selectedCountryId))
    const visaType = computed(() =>
      country.value?.visaTypes.find((v) => v.id === visa.selectedVisaTypeId),
    )

    const filteredCountries = computed(() => {
      const kw = keyword.value.trim().toLowerCase()
      if (!kw) return countries
      return countries.filter(
        (c) => c.name.zh.includes(kw) || c.name.en.toLowerCase().includes(kw),
      )
    })

    const canNext = computed(() => {
      if (visa.step === 0) return !!visa.selectedCountryId
      if (visa.step === 1) return !!visa.selectedVisaTypeId
      if (visa.step === 2)
        return !!visa.profile?.passportIssuedIn && !!visa.profile?.homeProvince && !!visa.profile?.occupation
      return false
    })

    const handleNext = () => {
      if (visa.step < 3) visa.setStep(visa.step + 1)
    }

    const handleReset = () => {
      visa.reset()
      keyword.value = ''
    }

    const trackThis = () => {
      if (!visa.selectedCountryId || !visa.selectedVisaTypeId) return
      tracker.addApplication({
        countryId: visa.selectedCountryId,
        visaTypeId: visa.selectedVisaTypeId,
        status: 'preparing',
        notes: '',
      })
      notify.success(t('tracker.newApplication'))
      router.push('/tracker')
    }

    const generatePdf = async () => {
      if (!resultEl.value) return
      exporting.value = true
      try {
        await exportElementToPdf(resultEl.value, {
          filename: `${lt(country.value?.name)}-${lt(visaType.value?.name)}-材料清单.pdf`,
          title: t('assistant.materials'),
        })
        notify.success(t('assistant.generatePdf'))
      } catch (e) {
        console.error(e)
        notify.error(t('common.error'))
      } finally {
        exporting.value = false
      }
    }

    const difficultyTone: Record<string, string> = { easy: 'green', medium: 'orange', hard: 'red' }
    void difficultyTone

    return () => (
      <div class="animate-page-in space-y-6">
        <div>
          <h1 class="text-3xl font-bold text-brand-dark tracking-wide">{t('assistant.title')}</h1>
          <p class="mt-1 text-sm text-brand-muted">{t('assistant.subtitle')}</p>
        </div>

        {/* Stepper */}
        <div class="flex items-center gap-2" role="tablist" aria-label="申请流程步骤">
          {STEPS.map((s, i) => (
            <div key={s} class="flex flex-1 items-center gap-2">
              <button
                onClick={() => i < visa.step && visa.setStep(i)}
                disabled={i > visa.step}
                class={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition-all ${
                  i < visa.step
                    ? 'bg-emerald-100 text-emerald-700 cursor-pointer'
                    : i === visa.step
                      ? 'bg-brand-blue text-white shadow'
                      : 'bg-gray-100 text-brand-muted'
                }`}
                aria-current={i === visa.step ? 'step' : undefined}
              >
                <span
                  class={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                    i < visa.step
                      ? 'bg-emerald-500 text-white'
                      : i === visa.step
                        ? 'bg-white text-brand-blue'
                        : 'bg-gray-200 text-brand-muted'
                  }`}
                >
                  {i < visa.step ? <span class="i-ri-check-line" /> : i + 1}
                </span>
                <span class="hidden sm:inline">{t(`assistant.${s}`)}</span>
              </button>
              {i < STEPS.length - 1 && (
                <span
                  class={`h-px flex-1 ${i < visa.step ? 'bg-emerald-300' : 'bg-gray-200'}`}
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: 选国家 */}
        {visa.step === 0 && (
          <section class="space-y-4 animate-step-in">
            <div class="relative max-w-md">
              <span
                class="absolute left-4 top-1/2 -translate-y-1/2 text-accent-orange i-ri-search-line"
                aria-hidden="true"
              />
              <input
                v-model={keyword.value}
                placeholder={t('assistant.searchPlaceholder')}
                class="input-base !pl-11 rounded-full"
              />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCountries.value.map((c) => (
                <CountryCard
                  key={c.id}
                  country={c}
                  selected={visa.selectedCountryId === c.id}
                  onClick={() => visa.setCountry(c.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Step 2: 选类型 */}
        {visa.step === 1 && country.value && (
          <section class="space-y-4 animate-step-in">
            <div class="flex items-center gap-3">
              <span class="text-3xl" aria-hidden="true">{country.value.flag}</span>
              <h2 class="text-xl font-semibold text-brand-dark">{lt(country.value.name)}</h2>
            </div>
            <div class="grid gap-4 sm:grid-cols-2">
              {country.value.visaTypes.map((vt) => (
                <VisaTypeCard
                  key={vt.id}
                  visaType={vt}
                  selected={visa.selectedVisaTypeId === vt.id}
                  onClick={() => visa.setVisaType(vt.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Step 3: 填身份 */}
        {visa.step === 2 && (
          <section class="max-w-2xl space-y-5 animate-step-in">
            <h2 class="text-xl font-semibold text-brand-dark">{t('assistant.identityTitle')}</h2>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-brand-dark">
                {t('assistant.passportIssuedIn')}
              </label>
              <select
                value={visa.profile?.passportIssuedIn ?? ''}
                onChange={(e) => visa.setProfile({ ...visa.profile, passportIssuedIn: val(e) })}
                class="input-base"
              >
                <option value="">{t('common.select')}</option>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-brand-dark">
                {t('assistant.homeProvince')}
              </label>
              <select
                value={visa.profile?.homeProvince ?? ''}
                onChange={(e) => visa.setProfile({ ...visa.profile, homeProvince: val(e) })}
                class="input-base"
              >
                <option value="">{t('common.select')}</option>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-brand-dark">
                {t('assistant.occupation')}
              </label>
              <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {OCCUPATIONS.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => visa.setProfile({ ...visa.profile, occupation: o.value })}
                    class={`card-base flex flex-col items-center gap-1.5 p-4 text-sm transition-all ${
                      visa.profile?.occupation === o.value
                        ? 'ring-2 ring-brand-blue border-brand-blue bg-brand-blue/5'
                        : ''
                    }`}
                  >
                    <span
                      class={`i-${o.icon} text-2xl ${
                        visa.profile?.occupation === o.value ? 'text-brand-blue' : 'text-brand-muted'
                      }`}
                      aria-hidden="true"
                    />
                    {t(`assistant.occupation${o.value.charAt(0).toUpperCase()}${o.value.slice(1)}`)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-brand-dark">
                {t('assistant.hasHistoryVisa')}
              </label>
              <div class="flex gap-3">
                {[true, false].map((v) => (
                  <button
                    key={String(v)}
                    onClick={() => visa.setProfile({ ...visa.profile, hasHistoryVisa: v })}
                    class={`rounded-full border px-6 py-2.5 text-sm transition-all ${
                      visa.profile?.hasHistoryVisa === v
                        ? 'border-brand-blue bg-brand-blue/10 text-brand-blue'
                        : 'border-gray-200 text-brand-muted hover:border-brand-blue/30'
                    }`}
                  >
                    {v ? t('assistant.yes') : t('assistant.no')}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Step 4: 结果 */}
        {visa.step === 3 && country.value && visaType.value && (
          <ResultView
            country={country.value}
            visaType={visaType.value}
            resultEl={resultEl}
            onReset={handleReset}
            onTrack={trackThis}
            onGeneratePdf={generatePdf}
            exporting={exporting.value}
          />
        )}

        {/* 底部导航 */}
        <div class="sticky bottom-6 z-20 flex items-center justify-between gap-3 pt-2">
          <VButton
            variant="ghost"
            onClick={() => (visa.step === 0 ? router.push('/') : visa.setStep(visa.step - 1))}
            disabled={visa.step === 0}
          >
            <span class="i-ri-arrow-left-line text-sm" aria-hidden="true" />
            {t('assistant.back')}
          </VButton>
          {visa.step < 3 && (
            <VButton variant="purple" onClick={handleNext} disabled={!canNext.value}>
              {t('assistant.next')}
              <span class="i-ri-arrow-right-line text-sm" aria-hidden="true" />
            </VButton>
          )}
          {visa.step === 3 && (
            <VButton variant="primary" onClick={handleReset}>
              <span class="i-ri-restart-line text-sm" aria-hidden="true" />
              {t('assistant.reset')}
            </VButton>
          )}
        </div>
      </div>
    )
  },
})

// ===== 签证类型卡片 =====
const VisaTypeCard = defineComponent({
  name: 'VisaTypeCard',
  props: {
    visaType: { type: Object as () => VisaType, required: true },
    selected: { type: Boolean, default: false },
  },
  emits: ['click'],
  setup(props, { emit }) {
    const { t: lt } = useLocalizedText()
    return () => (
      <button
        onClick={() => emit('click')}
        class={`card-base p-4 text-left w-full ${
          props.selected ? 'ring-2 ring-brand-blue border-brand-blue' : ''
        }`}
      >
        <div class="flex items-start justify-between gap-2">
          <h3 class="font-medium text-brand-dark">{lt(props.visaType.name)}</h3>
          <VBadge tone={props.visaType.entries === 'multiple' ? 'blue' : 'gray'}>
            {props.visaType.entries === 'multiple'
              ? lt({ zh: '多次', en: 'Multi' })
              : lt({ zh: '单次', en: 'Single' })}
          </VBadge>
        </div>
        <div class="mt-3 grid grid-cols-2 gap-2 text-xs">
          {[
            { label: lt({ zh: '停留', en: 'Stay' }), value: props.visaType.duration },
            { label: lt({ zh: '有效期', en: 'Validity' }), value: props.visaType.validity },
            {
              label: lt({ zh: '费用', en: 'Fee' }),
              value: `¥${props.visaType.fee.amount}`,
            },
            {
              label: lt({ zh: '周期', en: 'Processing' }),
              value: `${props.visaType.processingDays.min}-${props.visaType.processingDays.max} ${lt({ zh: '天', en: 'd' })}`,
            },
          ].map((item) => (
            <div key={item.label} class="rounded-xl bg-brand-bg px-3 py-2">
              <p class="text-brand-muted">{item.label}</p>
              <p class="mt-0.5 font-medium text-brand-dark">{item.value}</p>
            </div>
          ))}
        </div>
      </button>
    )
  },
})

// ===== 结果视图 =====
const ResultView = defineComponent({
  name: 'ResultView',
  props: {
    country: { type: Object as () => Country, required: true },
    visaType: { type: Object as () => VisaType, required: true },
    resultEl: { type: Object as () => any, required: true },
    exporting: { type: Boolean, default: false },
  },
  emits: ['reset', 'track', 'generatePdf'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const { t: lt } = useLocalizedText()
    const visa = useVisaStore()

    const matchedDistrict = computed(() => {
      const homeProvince = visa.profile?.homeProvince
      return (
        props.visaType.consularDistricts.find((d) => d.provinces.includes(homeProvince ?? '')) ??
        props.visaType.consularDistricts[0]
      )
    })

    // 甘特分段
    const segments = computed(() => {
      const mid = Math.floor(
        (props.visaType.processingDays.min + props.visaType.processingDays.max) / 2,
      )
      return [
        { name: lt({ zh: '材料准备', en: 'Prep' }), days: 3, color: '#0D0E32' },
        { name: lt({ zh: '受理', en: 'Accept' }), days: 2, color: '#0B1DA5' },
        { name: lt({ zh: '审核', en: 'Review' }), days: Math.max(mid - 5, 1), color: '#1C39C3' },
        { name: lt({ zh: '出签', en: 'Result' }), days: 2, color: '#7B2FBE' },
      ]
    })
    const totalDays = computed(() => segments.value.reduce((s, x) => s + x.days, 0))

    return () => (
      <div class="space-y-6 animate-step-in">
        {/* 结果卡 */}
        <div ref={props.resultEl} class="space-y-6">
          <div class="card-base p-6 bg-white">
            <div class="flex flex-wrap items-center gap-3">
              <span class="text-5xl" aria-hidden="true">{props.country.flag}</span>
              <div>
                <h2 class="text-2xl font-bold text-brand-dark">{lt(props.country.name)}</h2>
                <p class="text-sm text-brand-muted">{lt(props.visaType.name)}</p>
              </div>
              <div class="ml-auto">
                <VBadge tone={props.country.difficulty === 'easy' ? 'green' : props.country.difficulty === 'medium' ? 'orange' : 'red'}>
                  {t('encyclopedia.visaDifficulty')}:{' '}
                  {lt(DIFFICULTY_LABELS[props.country.difficulty])}
                </VBadge>
              </div>
            </div>

            <div class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: t('assistant.duration'), value: props.visaType.duration },
                { label: t('assistant.validity'), value: props.visaType.validity },
                {
                  label: t('assistant.entries'),
                  value:
                    props.visaType.entries === 'multiple'
                      ? lt({ zh: '多次', en: 'Multiple' })
                      : lt({ zh: '单次', en: 'Single' }),
                },
                { label: t('assistant.visaFee'), value: `¥${props.visaType.fee.amount}` },
              ].map((item) => (
                <div key={item.label} class="rounded-xl bg-brand-bg px-3 py-2.5">
                  <p class="text-xs text-brand-muted">{item.label}</p>
                  <p class="mt-0.5 text-sm font-semibold text-brand-dark">{item.value}</p>
                </div>
              ))}
            </div>

            {matchedDistrict.value && (
              <div class="mt-4 rounded-xl border border-brand-blue/30 bg-brand-blue/5 px-4 py-3">
                <p class="flex items-center gap-1.5 text-sm font-medium text-brand-dark">
                  <span class="i-ri-map-pin-line text-brand-blue" aria-hidden="true" />
                  {t('assistant.yourDistrict')}: {lt(matchedDistrict.value.name)}
                </p>
                {visa.profile?.homeProvince && (
                  <p class="mt-0.5 text-xs text-brand-muted">
                    {t('assistant.homeProvince')}: {visa.profile.homeProvince}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 材料清单 */}
          <section class="card-base p-6 bg-white">
            <h3 class="mb-4 flex items-center gap-2 text-base font-semibold text-brand-dark">
              <span class="i-ri-list-check text-brand-blue" aria-hidden="true" />
              {t('assistant.materials')}
            </h3>
            <Checklist requirements={props.visaType.requirements} />
          </section>

          {/* 费用明细 */}
          <section class="card-base p-6 bg-white">
            <FeeCalculator visaType={props.visaType} />
          </section>

          {/* 办理周期甘特 */}
          <section class="card-base p-6 bg-white">
            <div class="mb-2 flex items-center justify-between text-xs">
              <span class="font-medium text-brand-dark">{t('assistant.processingTime')}</span>
              <span class="text-brand-muted">
                {props.visaType.processingDays.min}-{props.visaType.processingDays.max}{' '}
                {t('assistant.days')}
              </span>
            </div>
            <div class="flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
              {segments.value.map((s, i) => (
                <div
                  key={i}
                  class="h-full transition-all"
                  style={{ width: `${(s.days / totalDays.value) * 100}%`, backgroundColor: s.color }}
                  title={`${s.name}: ~${s.days}${t('assistant.days')}`}
                />
              ))}
            </div>
            <div class="mt-1.5 flex justify-between text-[10px] text-brand-muted">
              <span>{lt({ zh: '开始', en: 'Start' })}</span>
              <span>{lt({ zh: '预计出签', en: 'Done' })}</span>
            </div>
          </section>

          {/* 注意事项 + 拒签原因 */}
          <section class="card-base p-6 bg-white">
            <h3 class="mb-3 flex items-center gap-2 text-base font-semibold text-brand-dark">
              <span class="i-ri-question-line text-brand-blue" aria-hidden="true" />
              {t('assistant.notes')}
            </h3>
            <p class="mb-4 text-sm leading-relaxed text-gray-600">{lt(props.visaType.tips)}</p>
            <h4 class="mb-2 text-sm font-semibold text-brand-dark">
              {t('assistant.rejectionReasons')}
            </h4>
            <ul class="space-y-1.5">
              {props.visaType.rejectionReasons.map((r, i) => (
                <li key={i} class="flex items-start gap-2 text-sm text-gray-600">
                  <span class="mt-0.5 i-ri-close-circle-fill text-red-400 shrink-0" aria-hidden="true" />
                  {lt(r)}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* 操作 */}
        <div class="flex flex-wrap gap-3">
          <VButton variant="purple" onClick={() => emit('generatePdf')} loading={props.exporting}>
            <span class="i-ri-file-download-line text-sm" aria-hidden="true" />
            {t('assistant.generatePdf')}
          </VButton>
          <VButton variant="primary" onClick={() => emit('track')}>
            <span class="i-ri-road-map-line text-sm" aria-hidden="true" />
            {t('assistant.trackApplication')}
          </VButton>
          <VButton variant="ghost" onClick={() => emit('reset')}>
            <span class="i-ri-restart-line text-sm" aria-hidden="true" />
            {t('assistant.reset')}
          </VButton>
        </div>
      </div>
    )
  },
})
