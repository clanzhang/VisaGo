// pages/Tracker.tsx — 进度追踪
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/i18n'
import { VButton, VBadge, VModal, EmptyState } from '@/components/common'
import { Timeline } from '@/components/visa'
import { useTrackerStore } from '@/stores/trackerStore'
import { useAppStore } from '@/stores/appStore'
import { countries } from '@/data/countries'
import { addDaysISO, todayISO, relativeDayLabel, daysFromNow } from '@/utils/date'
import type { ApplicationStatus, VisaApplication } from '@/types'

const STATUS_TONE: Record<ApplicationStatus, 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'cyan'> = {
  preparing: 'default',
  appointment_booked: 'primary',
  submitted: 'cyan',
  under_review: 'warning',
  approved: 'success',
  rejected: 'danger',
}

const NEXT_STATUS: Record<ApplicationStatus, ApplicationStatus | null> = {
  preparing: 'appointment_booked',
  appointment_booked: 'submitted',
  submitted: 'under_review',
  under_review: 'approved',
  approved: null,
  rejected: null,
}

export default function Tracker() {
  const { t, pickL } = useI18n()
  const navigate = useNavigate()
  const { toast } = useAppStore()
  const { applications, addApplication, updateApplication, removeApplication, addTimelineNode } = useTrackerStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<VisaApplication | null>(null)
  const [countryId, setCountryId] = useState('')
  const [visaTypeId, setVisaTypeId] = useState('')
  const [status, setStatus] = useState<ApplicationStatus>('preparing')
  const [notes, setNotes] = useState('')
  const [submissionDate, setSubmissionDate] = useState('')
  const [expectedIssueDate, setExpectedIssueDate] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<VisaApplication | null>(null)

  /** 递签日期不能晚于今天（未来日期明显错误） */
  const dateInFuture = !!submissionDate && submissionDate > todayISO()
  /** 预计出签不能早于递签（行内校验，不用 alert） */
  const dateOrderInvalid =
    !!submissionDate && !!expectedIssueDate && expectedIssueDate < submissionDate
  const dateError = dateInFuture ? 'future' : dateOrderInvalid ? 'order' : null

  const countryOptions = countries.filter((c) => c.visaTypes.length > 0)
  const visaTypeOptions = useMemo(
    () => countryOptions.find((c) => c.id === countryId)?.visaTypes ?? [],
    [countryId, countryOptions],
  )

  /** 选中的签证类型（用于快捷预填与周期说明） */
  const selectedVisaType = visaTypeOptions.find((v) => v.id === visaTypeId)

  /** 「今天」快捷：填入递签日期，并自动预填预计出签（可编辑的估算值） */
  function quickFillSubmission(today: string) {
    setSubmissionDate(today)
    if (selectedVisaType) {
      setExpectedIssueDate((prev) => prev || addDaysISO(today, selectedVisaType.processingDays.max))
    }
  }

  /** 递签日期变化：若预计出签为空，自动预填估算值 */
  function onSubmissionDateChange(v: string) {
    setSubmissionDate(v)
    if (selectedVisaType && v) {
      setExpectedIssueDate((prev) => prev || addDaysISO(v, selectedVisaType.processingDays.max))
    }
  }

  /** 预计出签日期：用户填写优先，否则用 createdAt + 办理时长推算 */
  function expectedDateOf(app: VisaApplication): string {
    const country = countries.find((c) => c.id === app.countryId)
    const visaType = country?.visaTypes.find((v) => v.id === app.visaTypeId)
    if (!visaType) return app.expectedIssueDate ?? app.createdAt.slice(0, 10)
    return app.expectedIssueDate ?? addDaysISO(app.createdAt.slice(0, 10), visaType.processingDays.max)
  }

  /** 按紧急度排序：逾期/临近的排前面；数据异常（找不到国家/签证类型）排最后 */
  const sortedApplications = useMemo(
    () =>
      [...applications].sort((a, b) => {
        const isOrphan = (app: VisaApplication) => {
          const country = countries.find((c) => c.id === app.countryId)
          return !country || !country.visaTypes.find((v) => v.id === app.visaTypeId)
        }
        const oa = isOrphan(a)
        const ob = isOrphan(b)
        if (oa !== ob) return oa ? 1 : -1
        const da = daysFromNow(expectedDateOf(a))
        const db = daysFromNow(expectedDateOf(b))
        return da - db
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [applications],
  )

  function openCreate() {
    setEditing(null)
    setCountryId('')
    setVisaTypeId('')
    setStatus('preparing')
    setNotes('')
    setSubmissionDate('')
    setExpectedIssueDate('')
    setModalOpen(true)
  }

  function openEdit(app: VisaApplication) {
    setEditing(app)
    setCountryId(app.countryId)
    setVisaTypeId(app.visaTypeId)
    setStatus(app.status)
    setNotes(app.notes)
    setSubmissionDate(app.submissionDate ?? '')
    setExpectedIssueDate(app.expectedIssueDate ?? '')
    setModalOpen(true)
  }

  function submit() {
    if (!countryId || !visaTypeId) return
    if (dateError) return
    if (editing) {
      // 编辑：先更新基本字段；若状态变了，同时补一条时间线节点（与「推进」行为一致）
      const statusChanged = status !== editing.status
      updateApplication(editing.id, { countryId, visaTypeId, notes, submissionDate, expectedIssueDate })
      if (statusChanged) addTimelineNode(editing.id, { status, date: todayISO() })
      toast(t('tracker.savedToast'), 'success')
    } else {
      addApplication({ countryId, visaTypeId, status, notes, submissionDate, expectedIssueDate })
      toast(t('tracker.savedToast'), 'success')
    }
    setModalOpen(false)
  }

  function advance(app: VisaApplication) {
    const next = NEXT_STATUS[app.status]
    if (!next) return
    addTimelineNode(app.id, { status: next, date: todayISO() })
  }

  /** 显式标记拒签（NEXT_STATUS 无此路径，只能手动标记） */
  function markRejected(app: VisaApplication) {
    if (app.status === 'rejected') return
    addTimelineNode(app.id, { status: 'rejected', date: todayISO() })
    toast(t('tracker.rejectedToast'), 'success')
  }

  function confirmDelete(app: VisaApplication) {
    removeApplication(app.id)
    setDeleteTarget(null)
    toast(t('tracker.deletedToast'), 'success')
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">{t('tracker.title')}</h1>
          <p className="mt-1 text-base font-medium text-subtle">{t('tracker.subtitle')}</p>
        </div>
        {applications.length > 0 && (
          <VButton onClick={openCreate}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            {t('tracker.newApplication')}
          </VButton>
        )}
      </div>

      {applications.length === 0 ? (
        <EmptyState
          centered
          icon={
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1460A4" strokeWidth="1.6">
              <path d="M12 21a9 9 0 100-18 9 9 0 000 18z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
          title={t('tracker.emptyTitle')}
          desc={t('tracker.emptyDesc')}
          actions={
            <>
              <VButton onClick={openCreate}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                {t('tracker.newApplication')}
              </VButton>
              <VButton variant="secondary" onClick={() => navigate('/encyclopedia')}>
                {t('tracker.emptyBrowse')}
              </VButton>
            </>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {sortedApplications.map((app, idx) => {
            const country = countries.find((c) => c.id === app.countryId)
            const visaType = country?.visaTypes.find((v) => v.id === app.visaTypeId)

            // 数据异常：国家/签证类型对不上时不再静默消失，渲染降级卡片
            if (!country || !visaType) {
              return (
                <div
                  key={app.id}
                  className="anim-card flex flex-col gap-3 rounded-2xl border border-dashed border-amber-300 bg-amber-50/60 p-6"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                    <span className="h-4 w-4 shrink-0 icon-[mdi-light--alert-circle]" />
                    {t('tracker.degradedTitle')}
                  </div>
                  <p className="text-xs leading-relaxed text-amber-700">{t('tracker.degradedDesc')}</p>
                  <div className="mt-1 flex gap-2">
                    <VButton variant="secondary" size="sm" onClick={() => openEdit(app)}>
                      {t('tracker.edit')}
                    </VButton>
                    <VButton variant="ghost" size="sm" className="text-amber-700 hover:bg-amber-100" onClick={() => setDeleteTarget(app)}>
                      {t('tracker.delete')}
                    </VButton>
                  </div>
                </div>
              )
            }

            // 日期：用户填写优先，为空才回退到 createdAt/推算值（加「预估」标记）
            const submitDate = app.submissionDate ?? app.createdAt.slice(0, 10)
            const submitEstimated = !app.submissionDate
            const expectedDate = app.expectedIssueDate ?? addDaysISO(app.createdAt.slice(0, 10), visaType.processingDays.max)
            const expectedEstimated = !app.expectedIssueDate
            const diff = daysFromNow(expectedDate)
            const urgencyCls = diff < 0 ? 'text-red-600' : diff <= 3 ? 'text-amber-600' : 'text-ink'
            return (
              <div
                key={app.id}
                className="anim-card rounded-2xl bg-white p-6 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-card-lg"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{country.flag}</span>
                    <div>
                      <div className="text-base font-semibold text-ink">{pickL(country.name)}</div>
                      <div className="text-xs text-ink/60">{pickL(visaType.name)}</div>
                    </div>
                  </div>
                  <VBadge tone={STATUS_TONE[app.status]}>{t(`tracker.status.${app.status}`)}</VBadge>
                </div>

                {/* 日期区：预计出签 + 剩余天数最醒目，递签日期弱化 */}
                <div className="mb-4 grid grid-cols-3 items-center gap-3 rounded-xl bg-[#F9F9F6] p-3 text-center">
                  <div>
                    <div className="text-xs text-ink/60">{t('tracker.submissionDate')}</div>
                    <div className="mt-0.5 text-xs text-ink/50">{submitDate}</div>
                    {submitEstimated && (
                      <div className="text-[10px] text-ink/40">{t('tracker.estimated')}</div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-ink/60">{t('tracker.expectedDate')}</div>
                    <div className="mt-0.5 text-sm font-bold text-primary">{expectedDate}</div>
                    {expectedEstimated && (
                      <div className="text-[10px] text-ink/40">{t('tracker.estimated')}</div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-ink/60">{t('tracker.reminder')}</div>
                    <div className={`mt-0.5 text-sm font-bold ${urgencyCls}`}>{relativeDayLabel(expectedDate, t)}</div>
                  </div>
                </div>

                <div className="rounded-xl border border-ink/5 p-4">
                  <Timeline nodes={app.timeline} current={app.status} />
                </div>

                {app.notes && (
                  <p className="mt-3 rounded-lg bg-amber-50/70 px-3 py-2 text-xs text-ink/60">
                    📝 {app.notes}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-ink/5 pt-4">
                  <div className="flex items-center gap-1">
                    <VButton variant="ghost" size="sm" onClick={() => openEdit(app)}>
                      {t('tracker.edit')}
                    </VButton>
                    {/* 删除降级：ghost 图标，hover 才显红 */}
                    <button
                      onClick={() => setDeleteTarget(app)}
                      title={t('tracker.delete')}
                      aria-label={t('tracker.delete')}
                      className="rounded-lg p-2 text-ink/40 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
                        <path d="M10 11v6M14 11v6" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    {app.status !== 'rejected' && app.status !== 'approved' && (
                      <VButton variant="ghost" size="sm" className="text-ink/50 hover:text-red-600" onClick={() => markRejected(app)}>
                        {t('tracker.markRejected')}
                      </VButton>
                    )}
                    <VButton size="sm" disabled={!NEXT_STATUS[app.status]} onClick={() => advance(app)}>
                      {t('tracker.nextStep')} →
                    </VButton>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 新建/编辑弹窗 */}
      <VModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? t('tracker.editApplication') : t('tracker.newApplication')}
        footer={
          <>
            <div className="flex flex-1 items-center text-xs text-ink/60">
              {dateOrderInvalid
                ? t('tracker.dateOrderError')
                : !countryId || !visaTypeId
                  ? t('tracker.missingRequired')
                  : null}
            </div>
            <VButton variant="secondary" onClick={() => setModalOpen(false)}>{t('common.cancel')}</VButton>
            <VButton onClick={submit} disabled={!countryId || !visaTypeId || dateOrderInvalid}>{t('common.save')}</VButton>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="tracker-country" className="mb-1.5 block text-sm font-medium text-ink/60">{t('tracker.country')}</label>
            <select
              id="tracker-country"
              value={countryId}
              onChange={(e) => {
                setCountryId(e.target.value)
                setVisaTypeId('')
              }}
              className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40"
            >
              <option value="">{t('common.select')}</option>
              {countryOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.flag} {pickL(c.name)}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tracker-visa-type" className="mb-1.5 block text-sm font-medium text-ink/60">{t('tracker.visaType')}</label>
            <select
              id="tracker-visa-type"
              value={visaTypeId}
              onChange={(e) => setVisaTypeId(e.target.value)}
              disabled={!countryId}
              aria-describedby={!countryId ? 'tracker-visa-type-hint' : undefined}
              className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40 disabled:cursor-not-allowed disabled:bg-ink/5 disabled:text-ink/40"
            >
              <option value="">{t('common.select')}</option>
              {visaTypeOptions.map((v) => (
                <option key={v.id} value={v.id}>{pickL(v.name)}</option>
              ))}
            </select>
            {!countryId && (
              <p id="tracker-visa-type-hint" className="mt-1 text-xs text-ink/50">{t('tracker.selectCountryFirst')}</p>
            )}
          </div>
          <div>
            <label htmlFor="tracker-status" className="mb-1.5 block text-sm font-medium text-ink/60">{t('tracker.statusLabel')}</label>
            <select
              id="tracker-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
              className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40"
            >
              {(Object.keys(STATUS_TONE) as ApplicationStatus[]).map((s) => (
                <option key={s} value={s}>{t(`tracker.status.${s}`)}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tracker-notes" className="mb-1.5 block text-sm font-medium text-ink/60">{t('tracker.notes')}</label>
            <textarea
              id="tracker-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="tracker-submission-date" className="text-sm font-medium text-ink/60">{t('tracker.submissionDate')}</label>
                <button
                  type="button"
                  onClick={() => quickFillSubmission(todayISO())}
                  className="text-xs font-medium text-primary hover:text-[#0e4a80]"
                >
                  {t('tracker.todayShortcut')}
                </button>
              </div>
              <input
                id="tracker-submission-date"
                type="date"
                value={submissionDate}
                max={todayISO()}
                onChange={(e) => onSubmissionDateChange(e.target.value)}
                aria-invalid={dateInFuture}
                aria-describedby={dateInFuture ? 'tracker-date-error' : 'tracker-submission-date-hint'}
                className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40 ${
                  dateInFuture ? 'border-red-400' : 'border-ink/10'
                }`}
              />
              <p id="tracker-submission-date-hint" className="mt-1 text-xs text-ink/50">{t('tracker.submissionDateHint')}</p>
            </div>
            <div>
              <label htmlFor="tracker-expected-date" className="mb-1.5 block text-sm font-medium text-ink/60">{t('tracker.expectedIssueDate')}</label>
              <input
                id="tracker-expected-date"
                type="date"
                value={expectedIssueDate}
                min={submissionDate || todayISO()}
                onChange={(e) => setExpectedIssueDate(e.target.value)}
                aria-invalid={dateOrderInvalid}
                aria-describedby={dateOrderInvalid ? 'tracker-date-error' : 'tracker-expected-date-hint'}
                className={`w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40 ${
                  dateOrderInvalid ? 'border-red-400' : 'border-ink/10'
                }`}
              />
              <p id="tracker-expected-date-hint" className="mt-1 text-xs text-ink/50">
                {expectedIssueDate && !dateOrderInvalid ? t('tracker.autoFilledHint') : t('tracker.expectedDateHint')}
              </p>
            </div>
          </div>
          {dateError && (
            <p id="tracker-date-error" role="alert" className="text-xs text-red-600">
              {dateError === 'future' ? t('tracker.dateInFutureError') : t('tracker.dateOrderError')}
            </p>
          )}
          <p className="text-xs text-ink/50">{t('tracker.dateHint')}</p>
        </div>
      </VModal>

      {/* 删除确认 */}
      <VModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t('common.confirm')}
        footer={
          <>
            <VButton variant="secondary" onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</VButton>
            <VButton variant="danger" onClick={() => deleteTarget && confirmDelete(deleteTarget)}>
              {t('common.delete')}
            </VButton>
          </>
        }
      >
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-ink">{t('tracker.deleteConfirmTitle')}</p>
          <p className="text-sm text-ink/60">
            {deleteTarget
              ? t('tracker.deleteConfirmDesc', {
                  country: pickL(countries.find((c) => c.id === deleteTarget.countryId)?.name) ?? '',
                })
              : ''}
          </p>
        </div>
      </VModal>
    </div>
  )
}
