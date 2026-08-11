// pages/Tracker.tsx
import { defineComponent, ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocalizedText } from '../composables/useVisaQuery'
import { countries } from '../data/countries'
import { useTrackerStore, STATUS_ORDER } from '../stores/trackerStore'
import { useNotification } from '../composables/useNotification'
import { Timeline } from '../components/visa'
import { VBadge, VButton, VModal } from '../components/common'
import { formatDate, todayISO, addDaysISO } from '../utils/date'
import type { ApplicationStatus } from '../types'

const statusTone: Record<ApplicationStatus, string> = {
  preparing: 'gray',
  appointment_booked: 'blue',
  submitted: 'brand',
  under_review: 'orange',
  approved: 'green',
  rejected: 'red',
}

// 便捷事件处理辅助：从事件中提取 string 值
function val(e: Event): string {
  return (e.target as HTMLInputElement).value
}

interface FormState {
  countryId: string
  visaTypeId: string
  status: ApplicationStatus
  submitDate: string
  expectedDate: string
  notes: string
}

const emptyForm: FormState = {
  countryId: '',
  visaTypeId: '',
  status: 'preparing',
  submitDate: todayISO(),
  expectedDate: addDaysISO(todayISO(), 15),
  notes: '',
}

export default defineComponent({
  name: 'Tracker',
  setup() {
    const { t } = useI18n()
    const { t: lt } = useLocalizedText()
    const tracker = useTrackerStore()
    const notify = useNotification()

    const showForm = ref(false)
    const form = ref<FormState>({ ...emptyForm })
    const expandedId = ref<string | null>(null)
    const editNode = ref<{ appId: string; index: number } | null>(null)
    const nodeForm = ref<{ status: ApplicationStatus; date: string; note: string }>({
      status: 'preparing',
      date: todayISO(),
      note: '',
    })

    const selectedCountryVisaTypes = computed(() =>
      countries.find((c) => c.id === form.value.countryId)?.visaTypes ?? [],
    )

    const openCreate = () => {
      form.value = { ...emptyForm }
      showForm.value = true
    }

    const handleCreate = () => {
      if (!form.value.countryId || !form.value.visaTypeId) {
        notify.error(t('common.error'))
        return
      }
      const app = tracker.addApplication({
        countryId: form.value.countryId,
        visaTypeId: form.value.visaTypeId,
        status: form.value.status,
        notes: form.value.notes,
      })
      // 保存递签/预计出签日期到 timeline 备注或应用
      tracker.updateApplication(app.id, {
        notes: form.value.notes,
      })
      notify.success(t('tracker.newApplication'))
      showForm.value = false
    }

    const handleDelete = (id: string) => {
      if (window.confirm(`${t('tracker.delete')}?`)) {
        tracker.removeApplication(id)
        notify.info(t('tracker.delete'))
      }
    }

    const handleAddNode = (appId: string) => {
      if (!nodeForm.value.status) return
      tracker.addTimelineNode(appId, {
        status: nodeForm.value.status,
        date: nodeForm.value.date,
        note: nodeForm.value.note,
      })
      notify.success(t('tracker.addTimeline'))
      editNode.value = null
    }

    const handleEditNode = (appId: string, index: number) => {
      const app = tracker.applications.find((a) => a.id === appId)
      const node = app?.timeline[index]
      if (node) {
        nodeForm.value = {
          status: node.status,
          date: node.date ?? todayISO(),
          note: node.note ?? '',
        }
      }
      editNode.value = { appId, index }
    }

    const saveNode = () => {
      if (!editNode.value) return
      tracker.updateTimelineNode(editNode.value.appId, editNode.value.index, {
        date: nodeForm.value.date,
        note: nodeForm.value.note,
      })
      notify.success(t('common.save'))
      editNode.value = null
    }

    return () => (
      <div class="animate-page-in space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-brand-dark tracking-wide">{t('tracker.title')}</h1>
            <p class="mt-1 text-sm text-brand-muted">{t('tracker.subtitle')}</p>
          </div>
          <VButton variant="purple" onClick={openCreate}>
            <span class="i-ri-add-line text-sm" aria-hidden="true" />
            {t('tracker.newApplication')}
          </VButton>
        </div>

        {tracker.applications.length === 0 ? (
          <div class="card-base flex flex-col items-center gap-4 p-12 text-center">
            <span class="i-ri-road-map-line text-5xl text-brand-muted/50" aria-hidden="true" />
            <p class="text-brand-muted">{t('tracker.noApplications')}</p>
            <VButton variant="purple" onClick={openCreate}>
              <span class="i-ri-add-line text-sm" aria-hidden="true" />
              {t('tracker.newApplication')}
            </VButton>
          </div>
        ) : (
          <div class="grid gap-4 lg:grid-cols-2">
            {tracker.applications.map((app) => {
              const country = countries.find((c) => c.id === app.countryId)
              const visaType = country?.visaTypes.find((v) => v.id === app.visaTypeId)
              const expanded = expandedId.value === app.id
              const progressIdx = STATUS_ORDER.indexOf(app.status)

              return (
                <div key={app.id} class="card-base overflow-hidden">
                  {/* 头部 */}
                  <div class="flex items-center gap-3 border-b border-gray-50 p-4">
                    <span class="text-3xl" aria-hidden="true">{country?.flag ?? '🌍'}</span>
                    <div class="flex-1 min-w-0">
                      <p class="font-medium text-brand-dark truncate">{lt(country?.name)}</p>
                      <p class="text-xs text-brand-muted truncate">{lt(visaType?.name)}</p>
                    </div>
                    <VBadge tone={statusTone[app.status] as never}>
                      {t(`tracker.status.${app.status}`)}
                    </VBadge>
                  </div>

                  {/* 迷你进度条 */}
                  <div class="px-4 pt-4">
                    <div class="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        class="h-full rounded-full bg-gradient-to-r from-brand-blue to-accent-purple transition-all duration-500"
                        style={{ width: `${((progressIdx + 1) / STATUS_ORDER.length) * 100}%` }}
                      />
                    </div>
                    <p class="mt-1.5 text-xs text-brand-muted">
                      {app.createdAt ? formatDate(app.createdAt) : ''}
                    </p>
                  </div>

                  {/* 时间线 */}
                  <div class="px-4 pb-4">
                    <button
                      onClick={() => (expandedId.value = expanded ? null : app.id)}
                      class="mb-3 flex w-full items-center justify-between text-sm font-medium text-brand-dark"
                      aria-expanded={expanded}
                    >
                      <span>{t('tracker.addTimeline')}</span>
                      <span
                        class={`i-ri-arrow-down-s-line text-brand-muted transition-transform ${
                          expanded ? 'rotate-180' : ''
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                    {expanded && (
                      <div class="mb-4 space-y-2 rounded-xl border border-gray-100 bg-brand-bg/50 p-3">
                        <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
                          <select
                            value={nodeForm.value.status}
                            onChange={(e) =>
                              (nodeForm.value = {
                                ...nodeForm.value,
                                status: val(e) as ApplicationStatus,
                              })
                            }
                            class="input-base !py-1.5 text-xs"
                          >
                            {STATUS_ORDER.map((s) => (
                              <option key={s} value={s}>{t(`tracker.status.${s}`)}</option>
                            ))}
                          </select>
                          <input
                            type="date"
                            value={nodeForm.value.date}
                            onChange={(e) =>
                              (nodeForm.value = { ...nodeForm.value, date: val(e) })
                            }
                            class="input-base !py-1.5 text-xs"
                          />
                          <input
                            placeholder={t('tracker.note')}
                            value={nodeForm.value.note}
                            onChange={(e) =>
                              (nodeForm.value = { ...nodeForm.value, note: val(e) })
                            }
                            class="input-base !py-1.5 text-xs"
                          />
                        </div>
                        <VButton size="sm" variant="purple" block onClick={() => handleAddNode(app.id)}>
                          <span class="i-ri-add-line text-sm" aria-hidden="true" />
                          {t('tracker.addTimeline')}
                        </VButton>
                      </div>
                    )}
                    <Timeline
                      nodes={app.timeline}
                      currentStatus={app.status}
                      onEdit={(i: number) => handleEditNode(app.id, i)}
                    />
                  </div>

                  {/* 操作 */}
                  <div class="flex gap-2 border-t border-gray-50 p-4">
                    <VButton
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const idx = STATUS_ORDER.indexOf(app.status)
                        const next = STATUS_ORDER[Math.min(idx + 1, STATUS_ORDER.length - 1)]
                        tracker.setStatus(app.id, next)
                        notify.info(t(`tracker.status.${next}`))
                      }}
                      disabled={['approved', 'rejected'].includes(app.status)}
                    >
                      <span class="i-ri-arrow-right-line text-sm" aria-hidden="true" />
                      {t('tracker.nextStep')}
                    </VButton>
                    <VButton variant="danger" size="sm" onClick={() => handleDelete(app.id)}>
                      <span class="i-ri-delete-bin-line text-sm" aria-hidden="true" />
                      {t('tracker.delete')}
                    </VButton>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 编辑节点 Modal */}
        <VModal
          open={!!editNode.value}
          onClose={() => (editNode.value = null)}
          title={t('tracker.edit')}
          size="sm"
        >
          {editNode.value && (
            <div class="space-y-3">
              <div>
                <label class="mb-1 block text-xs font-medium text-brand-muted">
                  {t('tracker.date')}
                </label>
                <input
                  type="date"
                  value={nodeForm.value.date}
                  onChange={(e) => (nodeForm.value = { ...nodeForm.value, date: val(e) })}
                  class="input-base"
                />
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-brand-muted">
                  {t('tracker.note')}
                </label>
                <textarea
                  value={nodeForm.value.note}
                  onChange={(e) => (nodeForm.value = { ...nodeForm.value, note: val(e) })}
                  class="input-base min-h-20"
                />
              </div>
              <VButton block onClick={saveNode}>
                {t('common.save')}
              </VButton>
            </div>
          )}
        </VModal>

        {/* 新建申请 Modal */}
        <VModal
          open={showForm.value}
          onClose={() => (showForm.value = false)}
          title={t('tracker.newApplication')}
        >
          <div class="space-y-4">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-brand-dark">
                {t('tracker.country')}
              </label>
              <select
                value={form.value.countryId}
                onChange={(e) => {
                  form.value = { ...form.value, countryId: val(e), visaTypeId: '' }
                }}
                class="input-base"
              >
                <option value="">{t('common.select')}</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>{c.flag} {lt(c.name)}</option>
                ))}
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-brand-dark">
                {t('tracker.visaType')}
              </label>
              <select
                value={form.value.visaTypeId}
                onChange={(e) => (form.value = { ...form.value, visaTypeId: val(e) })}
                class="input-base"
                disabled={!form.value.countryId}
              >
                <option value="">{t('common.select')}</option>
                {selectedCountryVisaTypes.value.map((v) => (
                  <option key={v.id} value={v.id}>{lt(v.name)}</option>
                ))}
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-brand-dark">
                {t('tracker.statusLabel')}
              </label>
              <select
                value={form.value.status}
                onChange={(e) =>
                  (form.value = { ...form.value, status: val(e) as ApplicationStatus })
                }
                class="input-base"
              >
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>{t(`tracker.status.${s}`)}</option>
                ))}
              </select>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-brand-dark">
                  {t('tracker.submitDate')}
                </label>
                <input
                  type="date"
                  value={form.value.submitDate}
                  onChange={(e) => (form.value = { ...form.value, submitDate: val(e) })}
                  class="input-base"
                />
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-brand-dark">
                  {t('tracker.expectedDate')}
                </label>
                <input
                  type="date"
                  value={form.value.expectedDate}
                  onChange={(e) => (form.value = { ...form.value, expectedDate: val(e) })}
                  class="input-base"
                />
              </div>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-brand-dark">
                {t('tracker.notes')}
              </label>
              <textarea
                value={form.value.notes}
                onChange={(e) => (form.value = { ...form.value, notes: val(e) })}
                class="input-base min-h-20"
              />
            </div>
          </div>
          <div class="mt-5 flex justify-end gap-3">
            <VButton variant="ghost" onClick={() => (showForm.value = false)}>
              {t('tracker.cancel')}
            </VButton>
            <VButton variant="purple" onClick={handleCreate} disabled={!form.value.countryId || !form.value.visaTypeId}>
              <span class="i-ri-check-line text-sm" aria-hidden="true" />
              {t('tracker.create')}
            </VButton>
          </div>
        </VModal>
      </div>
    )
  },
})
