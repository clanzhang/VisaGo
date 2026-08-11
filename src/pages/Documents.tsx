// pages/Documents.tsx
import { defineComponent, ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocalizedText } from '../composables/useVisaQuery'
import { countries, PROVINCES, OCCUPATIONS } from '../data/countries'
import { templates } from '../data/templates'
import { useVisaStore } from '../stores/visaStore'
import { useNotification } from '../composables/useNotification'
import { VBadge, VButton } from '../components/common'
import { exportElementToPdf } from '../utils/pdf'
import { dateRange, formatDate, todayISO, addDaysISO } from '../utils/date'
import type {
  DocumentData,
  DocumentTemplateKey,
  TravelDay,
  UserProfile,
} from '../types'

// 便捷事件处理辅助：从事件中提取 string 值
function val(e: Event): string {
  return (e.target as HTMLInputElement).value
}

export default defineComponent({
  name: 'Documents',
  setup() {
    const { t } = useI18n()
    const { t: lt, isZh } = useLocalizedText()
    const visa = useVisaStore()
    const notify = useNotification()

    const profile = ref<UserProfile>(
      visa.savedProfile ?? {
        name: '',
        passportNumber: '',
        nationality: '中国',
        birthDate: '',
        occupation: 'employed',
        company: '',
        position: '',
        salary: '',
        homeProvince: '',
        passportIssuedIn: '',
      },
    )

    const trip = ref({
      destination: '日本',
      startDate: addDaysISO(todayISO(), 30),
      endDate: addDaysISO(todayISO(), 36),
      flightNumber: 'CA927',
      hotel: '东京新宿某酒店',
    })

    const invitee = ref({ invitee: '', relation: '', costBearer: '申请人' })
    const coverText = ref('')
    const activeTemplate = ref<DocumentTemplateKey>('itinerary')
    const makeDays = () => {
      const range = dateRange(addDaysISO(todayISO(), 30), addDaysISO(todayISO(), 36))
      return range.map((d, i) => ({
        date: d,
        city: i === 0 ? '东京' : i === range.length - 1 ? '东京' : '京都',
        transport: i === 0 ? 'CA927 航班' : '新干线',
        accommodation: '东京新宿某酒店',
        activity: i % 2 === 0 ? '游览景点，品尝当地美食' : '购物与休闲',
      }))
    }
    const days = ref<TravelDay[]>(makeDays())

    const exporting = ref(false)
    const previewEl = ref<HTMLDivElement | null>(null)

    const documentData = computed<DocumentData>(() => ({
      profile: profile.value,
      trip: trip.value,
      days: days.value,
      invitee: invitee.value.invitee,
      relation: invitee.value.relation,
      costBearer: invitee.value.costBearer,
      coverText: coverText.value,
    }))

    const handleSave = () => {
      visa.saveProfile(profile.value)
      notify.success(t('documents.saved'))
    }

    const handleExport = async () => {
      if (!previewEl.value) return
      exporting.value = true
      try {
        const template = templates.find((x) => x.key === activeTemplate.value)!
        const fileName = `${template.name.zh}-${profile.value.name || 'VisaGo'}.pdf`
        await exportElementToPdf(previewEl.value, { filename: fileName })
        notify.success(t('documents.exportPdf'))
      } catch (err) {
        console.error(err)
        notify.error(t('common.error'))
      } finally {
        exporting.value = false
      }
    }

    // 更新日期时同步生成行程天数
    const syncDays = (start: string, end: string) => {
      const range = dateRange(start, end)
      days.value = range.map((d, i) =>
        days.value[i]
          ? { ...days.value[i], date: d }
          : { date: d, city: '东京', transport: '', accommodation: '', activity: '' },
      )
    }

    return () => (
      <div class="animate-page-in space-y-6">
        <div>
          <h1 class="text-3xl font-bold text-brand-dark tracking-wide">{t('documents.title')}</h1>
          <p class="mt-1 text-sm text-brand-muted">{t('documents.subtitle')}</p>
        </div>

        {/* 模板选择 */}
        <div class="card-base p-5">
          <h2 class="mb-3 flex items-center gap-2 text-base font-semibold text-brand-dark">
            <span class="i-ri-file-list-3-line text-brand-blue" aria-hidden="true" />
            {t('documents.templates')}
          </h2>
          <div class="flex flex-wrap gap-3">
            {templates.map((tmpl) => (
              <button
                key={tmpl.key}
                onClick={() => (activeTemplate.value = tmpl.key)}
                class={`card-base flex items-center gap-3 px-4 py-3 transition-all ${
                  activeTemplate.value === tmpl.key
                    ? 'ring-2 ring-brand-blue border-brand-blue bg-brand-blue/5'
                    : ''
                }`}
              >
                <span
                  class={`i-${tmpl.icon} text-xl ${
                    activeTemplate.value === tmpl.key ? 'text-brand-blue' : 'text-brand-muted'
                  }`}
                  aria-hidden="true"
                />
                <span class="text-left">
                  <span class="block text-sm font-medium text-brand-dark">{lt(tmpl.name)}</span>
                  <span class="block text-xs text-brand-muted">{lt(tmpl.description)}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div class="grid gap-6 lg:grid-cols-2">
          {/* 左侧表单 */}
          <div class="space-y-5">
            {/* 个人信息 */}
            <section class="card-base p-5">
              <h2 class="mb-4 flex items-center gap-2 text-base font-semibold text-brand-dark">
                <span class="i-ri-user-6-line text-brand-blue" aria-hidden="true" />
                {t('documents.personalInfo')}
              </h2>
              <div class="grid grid-cols-2 gap-3">
                <Field label={t('documents.name')}>
                  <input
                    class="input-base"
                    value={profile.value.name}
                    onChange={(e) => (profile.value = { ...profile.value, name: val(e) })}
                  />
                </Field>
                <Field label={t('documents.passportNumber')}>
                  <input
                    class="input-base"
                    value={profile.value.passportNumber}
                    onChange={(e) =>
                      (profile.value = { ...profile.value, passportNumber: val(e) })
                    }
                  />
                </Field>
                <Field label={t('documents.nationality')}>
                  <input
                    class="input-base"
                    value={profile.value.nationality}
                    onChange={(e) =>
                      (profile.value = { ...profile.value, nationality: val(e) })
                    }
                  />
                </Field>
                <Field label={t('documents.birthDate')}>
                  <input
                    type="date"
                    class="input-base"
                    value={profile.value.birthDate}
                    onChange={(e) =>
                      (profile.value = { ...profile.value, birthDate: val(e) })
                    }
                  />
                </Field>
                <Field label={t('documents.occupation')}>
                  <select
                    class="input-base"
                    value={profile.value.occupation}
                    onChange={(e) =>
                      (profile.value = {
                        ...profile.value,
                        occupation: val(e) as UserProfile['occupation'],
                      })
                    }
                  >
                    {OCCUPATIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {t(
                          `documents.occupation${o.value.charAt(0).toUpperCase()}${o.value.slice(1)}`,
                        )}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t('documents.homeProvince')}>
                  <select
                    class="input-base"
                    value={profile.value.homeProvince}
                    onChange={(e) =>
                      (profile.value = { ...profile.value, homeProvince: val(e) })
                    }
                  >
                    <option value="">{t('common.select')}</option>
                    {PROVINCES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </Field>
                <Field label={t('documents.company')}>
                  <input
                    class="input-base"
                    value={profile.value.company ?? ''}
                    onChange={(e) =>
                      (profile.value = { ...profile.value, company: val(e) })
                    }
                  />
                </Field>
                <Field label={t('documents.position')}>
                  <input
                    class="input-base"
                    value={profile.value.position ?? ''}
                    onChange={(e) =>
                      (profile.value = { ...profile.value, position: val(e) })
                    }
                  />
                </Field>
                <Field label={t('documents.salary')}>
                  <input
                    class="input-base"
                    value={profile.value.salary ?? ''}
                    onChange={(e) =>
                      (profile.value = { ...profile.value, salary: val(e) })
                    }
                  />
                </Field>
              </div>
              <VButton variant="ghost" size="sm" class="mt-4" onClick={handleSave}>
                <span class="i-ri-save-3-line text-sm" aria-hidden="true" />
                {t('documents.saveProfile')}
              </VButton>
            </section>

            {/* 行程信息 */}
            <section class="card-base p-5">
              <h2 class="mb-4 flex items-center gap-2 text-base font-semibold text-brand-dark">
                <span class="i-ri-map-2-line text-brand-blue" aria-hidden="true" />
                {t('documents.tripInfo')}
              </h2>
              <div class="grid grid-cols-2 gap-3">
                <Field label={t('documents.destination')}>
                  <select
                    class="input-base"
                    value={trip.value.destination}
                    onChange={(e) =>
                      (trip.value = { ...trip.value, destination: val(e) })
                    }
                  >
                    {countries.map((c) => (
                      <option key={c.id} value={lt(c.name)}>{c.flag} {lt(c.name)}</option>
                    ))}
                  </select>
                </Field>
                <Field label={t('documents.flightNumber')}>
                  <input
                    class="input-base"
                    value={trip.value.flightNumber}
                    onChange={(e) =>
                      (trip.value = { ...trip.value, flightNumber: val(e) })
                    }
                  />
                </Field>
                <Field label={t('documents.startDate')}>
                  <input
                    type="date"
                    class="input-base"
                    value={trip.value.startDate}
                    onChange={(e) => {
                      trip.value = { ...trip.value, startDate: val(e) }
                      syncDays(val(e), trip.value.endDate)
                    }}
                  />
                </Field>
                <Field label={t('documents.endDate')}>
                  <input
                    type="date"
                    class="input-base"
                    value={trip.value.endDate}
                    onChange={(e) => {
                      trip.value = { ...trip.value, endDate: val(e) }
                      syncDays(trip.value.startDate, val(e))
                    }}
                  />
                </Field>
                <Field label={t('documents.hotel')} full>
                  <input
                    class="input-base"
                    value={trip.value.hotel}
                    onChange={(e) => (trip.value = { ...trip.value, hotel: val(e) })}
                  />
                </Field>
              </div>
            </section>

            {/* 邀请函信息 */}
            <section class="card-base p-5">
              <h2 class="mb-4 flex items-center gap-2 text-base font-semibold text-brand-dark">
                <span class="i-ri-mail-line text-brand-blue" aria-hidden="true" />
                {t('documents.invitationInfo')}
              </h2>
              <div class="grid grid-cols-2 gap-3">
                <Field label={t('documents.invitee')}>
                  <input
                    class="input-base"
                    value={invitee.value.invitee}
                    onChange={(e) =>
                      (invitee.value = { ...invitee.value, invitee: val(e) })
                    }
                  />
                </Field>
                <Field label={t('documents.relation')}>
                  <input
                    class="input-base"
                    value={invitee.value.relation}
                    onChange={(e) =>
                      (invitee.value = { ...invitee.value, relation: val(e) })
                    }
                  />
                </Field>
                <Field label={t('documents.costBearer')} full>
                  <input
                    class="input-base"
                    value={invitee.value.costBearer}
                    onChange={(e) =>
                      (invitee.value = { ...invitee.value, costBearer: val(e) })
                    }
                  />
                </Field>
              </div>
            </section>

            {/* 解释信 */}
            <section class="card-base p-5">
              <h2 class="mb-4 flex items-center gap-2 text-base font-semibold text-brand-dark">
                <span class="i-ri-file-add-line text-brand-blue" aria-hidden="true" />
                {t('documents.coverText')}
              </h2>
              <textarea
                class="input-base min-h-28"
                value={coverText.value}
                onChange={(e) => (coverText.value = val(e))}
                placeholder={t('documents.coverText')}
              />
            </section>

            {/* 按天行程 */}
            <section class="card-base p-5">
              <div class="mb-4 flex items-center justify-between">
                <h2 class="flex items-center gap-2 text-base font-semibold text-brand-dark">
                  <span class="i-ri-calendar-line text-brand-blue" aria-hidden="true" />
                  {t('documents.dayByDay')}
                </h2>
                <VButton
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    (days.value = [
                      ...days.value,
                      {
                        date: addDaysISO(
                          days.value[days.value.length - 1]?.date ?? todayISO(),
                          1,
                        ),
                        city: '',
                        transport: '',
                        accommodation: '',
                        activity: '',
                      },
                    ])
                  }
                >
                  <span class="i-ri-add-line text-sm" aria-hidden="true" />
                  {t('documents.addDay')}
                </VButton>
              </div>
              <div class="space-y-3">
                {days.value.map((d, i) => (
                  <div key={i} class="rounded-xl border border-gray-100 p-3">
                    <div class="mb-2 flex items-center justify-between">
                      <VBadge tone="brand">{t('documents.date')}: {formatDate(d.date)}</VBadge>
                      {days.value.length > 1 && (
                        <button
                          onClick={() => (days.value = days.value.filter((_, x) => x !== i))}
                          class="text-brand-muted hover:text-red-500 transition-colors"
                          aria-label={t('tracker.delete')}
                        >
                          <span class="i-ri-close-line text-base" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                      <input
                        class="input-base !py-1.5 text-xs"
                        placeholder={t('documents.city')}
                        value={d.city}
                        onChange={(e) =>
                          (days.value = days.value.map((x, xi) =>
                            xi === i ? { ...x, city: val(e) } : x,
                          ))
                        }
                      />
                      <input
                        class="input-base !py-1.5 text-xs"
                        placeholder={t('documents.transport')}
                        value={d.transport}
                        onChange={(e) =>
                          (days.value = days.value.map((x, xi) =>
                            xi === i ? { ...x, transport: val(e) } : x,
                          ))
                        }
                      />
                      <input
                        class="input-base !py-1.5 text-xs"
                        placeholder={t('documents.accommodation')}
                        value={d.accommodation}
                        onChange={(e) =>
                          (days.value = days.value.map((x, xi) =>
                            xi === i ? { ...x, accommodation: val(e) } : x,
                          ))
                        }
                      />
                      <input
                        class="input-base !py-1.5 text-xs"
                        placeholder={t('documents.activity')}
                        value={d.activity}
                        onChange={(e) =>
                          (days.value = days.value.map((x, xi) =>
                            xi === i ? { ...x, activity: val(e) } : x,
                          ))
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* 右侧预览 */}
          <div class="lg:sticky lg:top-20 h-fit space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="flex items-center gap-2 text-base font-semibold text-brand-dark">
                <span class="i-ri-eye-line text-brand-blue" aria-hidden="true" />
                {t('documents.preview')}
              </h2>
              <VButton variant="purple" onClick={handleExport} loading={exporting.value}>
                <span class="i-ri-download-2-line text-sm" aria-hidden="true" />
                {exporting.value ? t('documents.exporting') : t('documents.exportPdf')}
              </VButton>
            </div>
            <div
              ref={previewEl}
              class="rounded-16px border border-gray-200 bg-white p-8 shadow-lg"
              style="aspect-ratio: 210/297; max-height: 80vh; overflow: hidden; font-family: 'Noto Sans SC', sans-serif;"
            >
              <DocumentPreview template={activeTemplate.value} data={documentData.value} isZh={isZh.value} />
            </div>
            <p class="text-xs text-brand-muted">{t('documents.employmentNote')}</p>
          </div>
        </div>
      </div>
    )
  },
})

const Field = defineComponent({
  name: 'Field',
  props: {
    label: { type: String, required: true },
    full: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    return () => (
      <label class={`block ${props.full ? 'col-span-2' : ''}`}>
        <span class="mb-1 block text-xs font-medium text-brand-muted">{props.label}</span>
        {slots.default?.()}
      </label>
    )
  },
})

// ==================== 文档预览 ====================
const DocumentPreview = defineComponent({
  name: 'DocumentPreview',
  props: {
    template: { type: String as () => DocumentTemplateKey, required: true },
    data: { type: Object as () => DocumentData, required: true },
    isZh: { type: Boolean, default: true },
  },
  setup(props) {
    // props.data 是响应式的，渲染时通过 getData() 读取最新值
    const getData = () => props.data
    const profile = () => getData().profile
    const trip = () => getData().trip
    const days = () => getData().days

    const DocHeader = ({ title }: { title: string }) => (
      <div class="border-b-2 border-accent-orange pb-3">
        <h3 class="text-xl font-bold text-brand-dark" style="font-family: 'Outfit', sans-serif;">
          {title}
        </h3>
        <p class="mt-1 text-xs text-brand-muted">VisaGo · {todayISO()}</p>
      </div>
    )

    const ItineraryView = () => (
      <div class="text-sm leading-relaxed text-gray-700">
        <DocHeader title={props.isZh ? '旅行行程单' : 'Travel Itinerary'} />
        <p class="mt-2">
          {props.isZh ? '申请人' : 'Applicant'}: <b>{profile().name || '________'}</b>
        </p>
        <p>
          {props.isZh ? '护照号' : 'Passport No.'}: <b>{profile().passportNumber || '________'}</b>
        </p>
        <p>
          {props.isZh ? '目的地' : 'Destination'}: <b>{trip().destination}</b>
        </p>
        <p>
          {props.isZh ? '行程日期' : 'Dates'}: {trip().startDate} ~ {trip().endDate}
        </p>
        <p>
          {props.isZh ? '航班' : 'Flight'}: {trip().flightNumber} · {props.isZh ? '酒店' : 'Hotel'}:{' '}
          {trip().hotel}
        </p>
        <table class="mt-4 w-full border-collapse text-xs">
          <thead>
            <tr class="bg-brand-dark text-white">
              <th class="border border-gray-200 p-2 text-left">{props.isZh ? '日期' : 'Date'}</th>
              <th class="border border-gray-200 p-2 text-left">{props.isZh ? '城市' : 'City'}</th>
              <th class="border border-gray-200 p-2 text-left">{props.isZh ? '交通' : 'Transport'}</th>
              <th class="border border-gray-200 p-2 text-left">{props.isZh ? '住宿' : 'Hotel'}</th>
              <th class="border border-gray-200 p-2 text-left">{props.isZh ? '活动' : 'Activity'}</th>
            </tr>
          </thead>
          <tbody>
            {days().map((d: TravelDay, i: number) => (
              <tr key={i} class={i % 2 ? 'bg-brand-bg' : ''}>
                <td class="border border-gray-200 p-2 whitespace-nowrap">{d.date}</td>
                <td class="border border-gray-200 p-2">{d.city}</td>
                <td class="border border-gray-200 p-2">{d.transport}</td>
                <td class="border border-gray-200 p-2">{d.accommodation}</td>
                <td class="border border-gray-200 p-2">{d.activity}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p class="mt-4 text-xs text-brand-muted">
          {props.isZh ? '本行程单仅供签证申请使用。' : 'For visa application purposes only.'}
        </p>
      </div>
    )

    const EmploymentView = () => (
      <div class="text-sm leading-relaxed text-gray-700">
        <DocHeader title={props.isZh ? '在职证明' : 'Certificate of Employment'} />
        <p class="mt-4">
          {props.isZh ? '兹证明' : 'This is to certify that'} <b>{profile().name || '________'}</b>{' '}
          {props.isZh ? '（护照号' : '(Passport No.'} {profile().passportNumber || '________'}
          {props.isZh ? '）为本公司正式员工，担任' : ') is a full-time employee, holding the position of '}
          <b>{profile().position || '________'}</b>
          {props.isZh ? '，月薪人民币' : ', with a monthly salary of RMB '}
          <b>{profile().salary || '________'}</b>
          {props.isZh ? '元。' : '.'}
        </p>
        <p class="mt-3">
          {props.isZh ? '该员工计划于' : 'The employee plans to travel from '}
          <b>{trip().startDate}</b> {props.isZh ? '至' : 'to'} <b>{trip().endDate}</b>
          {props.isZh
            ? `前往${trip().destination}旅行，公司批准上述假期。`
            : ` to ${trip().destination}. The company approves the leave.`}
        </p>
        <p class="mt-3">
          {props.isZh
            ? '其旅行结束后将按时回国继续工作，特此证明。'
            : 'He/She will return on time. This is to certify.'}
        </p>
        <div class="mt-8 flex items-end justify-between">
          <div>
            <p>{props.isZh ? '公司名称' : 'Company'}: <b>{profile().company || '________'}</b></p>
            <p>{props.isZh ? '联系人' : 'Contact'}: ________</p>
            <p>{props.isZh ? '联系电话' : 'Tel'}: ________</p>
          </div>
          <div class="text-center">
            <div class="flex h-12 w-24 items-center justify-center rounded border border-dashed border-gray-300 text-xs text-brand-muted">
              {props.isZh ? '盖章处' : 'Seal'}
            </div>
            <p class="mt-1 text-xs">{props.isZh ? '公司盖章' : 'Company Seal'}</p>
          </div>
        </div>
        <p class="mt-4 text-right text-xs text-brand-muted">
          {props.isZh ? '日期' : 'Date'}: {todayISO()}
        </p>
      </div>
    )

    const InvitationView = () => (
      <div class="text-sm leading-relaxed text-gray-700">
        <DocHeader title={props.isZh ? '邀请函' : 'Invitation Letter'} />
        <p class="mt-4">{props.isZh ? '尊敬的签证官：' : 'Dear Visa Officer,'}</p>
        <p class="mt-2">
          {props.isZh ? '本人' : 'I, '} <b>{props.data.invitee || '________'}</b>{' '}
          {props.isZh
            ? `，是${trip().destination}的${props.data.relation || '________'}。特此邀请`
            : `, ${props.data.relation || '________'} in ${trip().destination}, hereby invite `}
          <b>{profile().name || '________'}</b>{' '}
          {props.isZh ? '（护照号' : '(Passport No.'} {profile().passportNumber || '________'}
          {props.isZh ? '）在' : ') to visit during '}
          <b>{trip().startDate}</b> {props.isZh ? '至' : 'to'} <b>{trip().endDate}</b>.
        </p>
        <p class="mt-2">
          {props.isZh ? '此行目的为旅游/探亲，行程期间费用由' : 'The purpose is tourism/family visit. Expenses will be covered by '}
          <b>{props.data.costBearer || '申请人'}</b>
          {props.isZh ? '承担。' : '.'}
        </p>
        <p class="mt-2">
          {props.isZh
            ? '我们保证申请人将按时回国，不从事与签证不符的活动。'
            : 'We guarantee the applicant will return on time.'}
        </p>
        <div class="mt-8 flex justify-end">
          <div class="text-center">
            <p><b>{props.data.invitee || '________'}</b></p>
            <p class="text-xs text-brand-muted">{props.isZh ? '邀请人签字' : 'Inviter Signature'}</p>
            <p class="mt-1 text-xs text-brand-muted">{todayISO()}</p>
          </div>
        </div>
      </div>
    )

    const CoverView = () => (
      <div class="text-sm leading-relaxed text-gray-700">
        <DocHeader title={props.isZh ? '个人陈述 / 解释信' : 'Cover Letter'} />
        <p class="mt-4">{props.isZh ? '尊敬的签证官：' : 'Dear Visa Officer,'}</p>
        <p class="mt-2">
          {props.isZh ? '我叫' : 'My name is '}<b>{profile().name || '________'}</b>
          {props.isZh ? '，护照号' : ', passport No.'} {profile().passportNumber || '________'}
          {props.isZh
            ? `，计划于 ${trip().startDate} 至 ${trip().endDate} 前往${trip().destination}旅行。`
            : `, planning to visit ${trip().destination} from ${trip().startDate} to ${trip().endDate}.`}
        </p>
        <p class="mt-2">
          {props.isZh
            ? `此次旅行的主要目的是观光旅游。我已预订往返机票（${trip().flightNumber}）及酒店（${trip().hotel}）。`
            : `The purpose is sightseeing. I have booked flights (${trip().flightNumber}) and a hotel (${trip().hotel}).`}
        </p>
        <p class="mt-2">
          {props.isZh
            ? `我在${profile().homeProvince || '中国'}有稳定的工作（${profile().position || '________'}）和固定收入（约 ${profile().salary || '________'} 元/月），并有家人和房产在中国，确保我会按时回国。`
            : `I have a stable job (${profile().position || '________'}) with regular income in ${profile().homeProvince || 'China'}, ensuring I will return on time.`}
        </p>
        {props.data.coverText && <p class="mt-2">{props.data.coverText}</p>}
        <p class="mt-4">{props.isZh ? '感谢您审阅我的申请。' : 'Thank you for considering my application.'}</p>
        <p class="mt-6 text-right">{props.isZh ? '申请人签名：________' : 'Signature: ________'}</p>
        <p class="text-right text-xs text-brand-muted">{todayISO()}</p>
      </div>
    )

    const ChecklistView = () => (
      <div class="text-sm leading-relaxed text-gray-700">
        <DocHeader title={props.isZh ? '签证申请材料检查清单' : 'Visa Application Checklist'} />
        <p class="mt-2 text-xs text-brand-muted">
          {props.isZh ? '申请人' : 'Applicant'}: {profile().name || '________'} ·{' '}
          {props.isZh ? '目的地' : 'Destination'}: {trip().destination}
        </p>
        <ul class="mt-4 space-y-2.5">
          {[
            props.isZh ? '有效护照（有效期 6 个月以上，2 页空白）' : 'Valid passport (6+ months, 2 blank pages)',
            props.isZh ? '白底彩色证件照 2 张' : '2 white-background photos',
            props.isZh ? '签证申请表（如实填写）' : 'Completed application form',
            props.isZh ? '在职证明（加盖公章，含准假信息）' : 'Employment certificate (stamped)',
            props.isZh ? '营业执照副本复印件（加盖公章）' : 'Business license copy (stamped)',
            props.isZh ? '近 6 个月银行流水（余额充足）' : 'Bank statements (6 months)',
            props.isZh ? '详细行程单（英文）' : 'Detailed itinerary (English)',
            props.isZh ? '往返机票预订单' : 'Round-trip flight booking',
            props.isZh ? '全程酒店预订单' : 'All hotel reservations',
            props.isZh ? '申根医疗保险（如需）' : 'Travel insurance (if applicable)',
          ].map((item, i) => (
            <li key={i} class="flex items-start gap-3">
              <span
                class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-gray-300"
                aria-hidden="true"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p class="mt-6 text-xs text-brand-muted">
          {props.isZh ? '请逐项核对并在提交前确认所有材料齐全。' : 'Verify all items before submission.'}
        </p>
      </div>
    )

    return () => {
      switch (props.template) {
        case 'itinerary':
          return ItineraryView()
        case 'employment':
          return EmploymentView()
        case 'invitation':
          return InvitationView()
        case 'cover':
          return CoverView()
        case 'checklist':
          return ChecklistView()
        default:
          return null
      }
    }
  },
})
