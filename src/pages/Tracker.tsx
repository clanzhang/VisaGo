// pages/Tracker.tsx — 进度追踪
import { useMemo, useState } from 'react'
import { useI18n } from '@/i18n'
import { VButton, VBadge, VModal } from '@/components/common'
import { Timeline } from '@/components/visa'
import { useTrackerStore } from '@/stores/trackerStore'
import { countries } from '@/data/countries'
import { addDaysISO, todayISO, relativeDayLabel } from '@/utils/date'
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

  const countryOptions = countries.filter((c) => c.visaTypes.length > 0)
  const visaTypeOptions = useMemo(
    () => countryOptions.find((c) => c.id === countryId)?.visaTypes ?? [],
    [countryId, countryOptions],
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
    if (editing) {
      updateApplication(editing.id, { countryId, visaTypeId, status, notes, submissionDate, expectedIssueDate })
    } else {
      addApplication({ countryId, visaTypeId, status, notes, submissionDate, expectedIssueDate })
    }
    setModalOpen(false)
  }

  function advance(app: VisaApplication) {
    const next = NEXT_STATUS[app.status]
    if (!next) return
    addTimelineNode(app.id, { status: next, date: todayISO() })
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">{t('tracker.title')}</h1>
          <p className="mt-1 text-base font-medium text-subtle">{t('tracker.subtitle')}</p>
        </div>
        <VButton onClick={openCreate}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {t('tracker.newApplication')}
        </VButton>
      </div>

      {applications.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl bg-white p-16 text-center shadow-card">
          <div className="mb-4 text-5xl">🗂️</div>
          <p className="text-sm text-ink/50">{t('tracker.noApplications')}</p>
          <VButton className="mt-6" onClick={openCreate}>
            {t('tracker.newApplication')}
          </VButton>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {applications.map((app, idx) => {
            const country = countries.find((c) => c.id === app.countryId)
            const visaType = country?.visaTypes.find((v) => v.id === app.visaTypeId)
            if (!country || !visaType) return null
            const expectedDays = visaType.processingDays.max
            const expectedDate = addDaysISO(app.createdAt.slice(0, 10), expectedDays)
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
                      <div className="text-xs text-ink/55">{pickL(visaType.name)}</div>
                    </div>
                  </div>
                  <VBadge tone={STATUS_TONE[app.status]}>{t(`tracker.status.${app.status}`)}</VBadge>
                </div>

                <div className="mb-4 grid grid-cols-3 gap-3 rounded-xl bg-[#F9F9F6] p-3 text-center">
                  <div>
                    <div className="text-xs text-ink/40">{t('tracker.submitDate')}</div>
                    <div className="mt-0.5 text-sm font-semibold">{app.createdAt.slice(0, 10)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-ink/40">{t('tracker.expectedDate')}</div>
                    <div className="mt-0.5 text-sm font-semibold text-primary">{expectedDate}</div>
                  </div>
                  <div>
                    <div className="text-xs text-ink/40">{t('tracker.reminder')}</div>
                    <div className="mt-0.5 text-sm font-semibold">{relativeDayLabel(expectedDate)}</div>
                  </div>
                </div>

                <div className="rounded-xl border border-ink/5 p-4">
                  <Timeline nodes={app.timeline} current={app.status} />
                </div>

                {app.notes && (
                  <p className="mt-3 rounded-lg bg-amber-50/70 px-3 py-2 text-xs text-ink/55">
                    📝 {app.notes}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-ink/5 pt-4">
                  <div className="flex gap-2">
                    <VButton variant="secondary" size="sm" onClick={() => openEdit(app)}>
                      {t('tracker.edit')}
                    </VButton>
                    <VButton variant="danger" size="sm" onClick={() => setDeleteTarget(app)}>
                      {t('tracker.delete')}
                    </VButton>
                  </div>
                  <VButton size="sm" disabled={!NEXT_STATUS[app.status]} onClick={() => advance(app)}>
                    {t('tracker.nextStep')} →
                  </VButton>
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
            <VButton variant="secondary" onClick={() => setModalOpen(false)}>{t('common.cancel')}</VButton>
            <VButton onClick={submit} disabled={!countryId || !visaTypeId}>{t('common.save')}</VButton>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/60">{t('tracker.country')}</label>
            <select
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
            <label className="mb-1.5 block text-sm font-medium text-ink/60">{t('tracker.visaType')}</label>
            <select
              value={visaTypeId}
              onChange={(e) => setVisaTypeId(e.target.value)}
              className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40"
            >
              <option value="">{t('common.select')}</option>
              {visaTypeOptions.map((v) => (
                <option key={v.id} value={v.id}>{pickL(v.name)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/60">{t('tracker.statusLabel')}</label>
            <select
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
            <label className="mb-1.5 block text-sm font-medium text-ink/60">{t('tracker.notes')}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink/60">{t('tracker.submissionDate')}</label>
              <input
                type="date"
                value={submissionDate}
                onChange={(e) => setSubmissionDate(e.target.value)}
                className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink/60">{t('tracker.expectedIssueDate')}</label>
              <input
                type="date"
                value={expectedIssueDate}
                onChange={(e) => setExpectedIssueDate(e.target.value)}
                className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40"
              />
            </div>
          </div>
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
            <VButton
              variant="danger"
              onClick={() => {
                if (deleteTarget) removeApplication(deleteTarget.id)
                setDeleteTarget(null)
              }}
            >
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
