// stores/trackerStore.tsx — 进度追踪状态（localStorage 持久化 + Rust 申请目录同步）
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { isTauri, saveApplication, deleteApplication } from '@/api/tauri'
import { countries } from '@/data/countries'
import type { TimelineNode, VisaApplication } from '@/types'

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function load(): VisaApplication[] {
  try {
    return JSON.parse(localStorage.getItem('visago:tracker') || '[]')
  } catch {
    return []
  }
}

/** 把申请同步到 Rust applications/<id>.json（含提醒日期，供 check_reminders 读取） */
function syncToRust(app: VisaApplication) {
  if (!isTauri()) return
  const country = countries.find((c) => c.id === app.countryId)
  const visaType = country?.visaTypes.find((v) => v.id === app.visaTypeId)
  const payload: Record<string, unknown> = {
    id: app.id,
    title: `${country?.name.zh ?? ''} ${visaType?.name.zh ?? ''}`.trim(),
    countryName: country?.name.zh ?? '',
    visaTypeName: visaType?.name.zh ?? '',
    status: app.status,
    submission_date: app.submissionDate ?? null,
    expected_issue_date: app.expectedIssueDate ?? null,
    updated_at: app.updatedAt,
  }
  saveApplication(app.id, payload).catch((e) => console.warn('[tracker] 同步到 Rust 失败:', e))
}

interface TrackerStoreValue {
  applications: VisaApplication[]
  addApplication: (app: Omit<VisaApplication, 'id' | 'createdAt' | 'updatedAt' | 'timeline'>) => VisaApplication
  updateApplication: (id: string, patch: Partial<VisaApplication>) => void
  removeApplication: (id: string) => void
  addTimelineNode: (id: string, node: TimelineNode) => void
}

const TrackerStoreContext = createContext<TrackerStoreValue | null>(null)

export function TrackerStoreProvider({ children }: { children: ReactNode }) {
  const [applications, setApplications] = useState<VisaApplication[]>(load)

  const persist = useCallback((apps: VisaApplication[]) => {
    localStorage.setItem('visago:tracker', JSON.stringify(apps))
  }, [])

  const addApplication = useCallback<TrackerStoreValue['addApplication']>(
    (app) => {
      const now = new Date().toISOString()
      const newApp: VisaApplication = {
        ...app,
        id: uid(),
        createdAt: now,
        updatedAt: now,
        timeline: [{ status: app.status }],
      }
      setApplications((prev) => {
        const next = [newApp, ...prev]
        persist(next)
        return next
      })
      syncToRust(newApp)
      return newApp
    },
    [persist],
  )

  const updateApplication = useCallback(
    (id: string, patch: Partial<VisaApplication>) => {
      setApplications((prev) => {
        const next = prev.map((a) => {
          if (a.id !== id) return a
          const updated = { ...a, ...patch, updatedAt: new Date().toISOString() }
          syncToRust(updated)
          return updated
        })
        persist(next)
        return next
      })
    },
    [persist],
  )

  const removeApplication = useCallback(
    (id: string) => {
      setApplications((prev) => {
        const next = prev.filter((a) => a.id !== id)
        persist(next)
        return next
      })
      if (isTauri()) {
        deleteApplication(id).catch((e) => console.warn('[tracker] 删除 Rust 申请失败:', e))
      }
    },
    [persist],
  )

  const addTimelineNode = useCallback(
    (id: string, node: TimelineNode) => {
      setApplications((prev) => {
        const next = prev.map((a) =>
          a.id === id
            ? {
                ...a,
                status: node.status,
                timeline: [...a.timeline, node],
                updatedAt: new Date().toISOString(),
              }
            : a,
        )
        persist(next)
        return next
      })
    },
    [persist],
  )

  const value = useMemo<TrackerStoreValue>(
    () => ({ applications, addApplication, updateApplication, removeApplication, addTimelineNode }),
    [applications, addApplication, updateApplication, removeApplication, addTimelineNode],
  )

  return <TrackerStoreContext.Provider value={value}>{children}</TrackerStoreContext.Provider>
}

export function useTrackerStore(): TrackerStoreValue {
  const ctx = useContext(TrackerStoreContext)
  if (!ctx) throw new Error('useTrackerStore must be used within TrackerStoreProvider')
  return ctx
}
