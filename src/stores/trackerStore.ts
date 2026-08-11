// stores/trackerStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ApplicationStatus, TimelineNode, VisaApplication } from '../types'

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

export const useTrackerStore = defineStore('tracker', () => {
  const applications = ref<VisaApplication[]>(load())

  function persist() {
    localStorage.setItem('visago:tracker', JSON.stringify(applications.value))
  }

  function addApplication(
    app: Omit<VisaApplication, 'id' | 'createdAt' | 'updatedAt' | 'timeline'>,
  ): VisaApplication {
    const now = new Date().toISOString()
    const newApp: VisaApplication = {
      ...app,
      id: uid(),
      createdAt: now,
      updatedAt: now,
      timeline: [{ status: app.status }],
    }
    applications.value = [newApp, ...applications.value]
    persist()
    return newApp
  }

  function updateApplication(id: string, patch: Partial<VisaApplication>) {
    applications.value = applications.value.map((a) =>
      a.id === id ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a,
    )
    persist()
  }

  function removeApplication(id: string) {
    applications.value = applications.value.filter((a) => a.id !== id)
    persist()
  }

  function addTimelineNode(id: string, node: TimelineNode) {
    applications.value = applications.value.map((a) =>
      a.id === id
        ? {
            ...a,
            status: node.status,
            timeline: [...a.timeline, node],
            updatedAt: new Date().toISOString(),
          }
        : a,
    )
    persist()
  }

  function updateTimelineNode(id: string, index: number, patch: Partial<TimelineNode>) {
    applications.value = applications.value.map((a) =>
      a.id === id
        ? {
            ...a,
            timeline: a.timeline.map((n, i) => (i === index ? { ...n, ...patch } : n)),
            updatedAt: new Date().toISOString(),
          }
        : a,
    )
    persist()
  }

  function setStatus(id: string, status: ApplicationStatus) {
    applications.value = applications.value.map((a) =>
      a.id === id
        ? {
            ...a,
            status,
            timeline: [
              ...a.timeline,
              { status, date: new Date().toISOString().slice(0, 10) },
            ],
            updatedAt: new Date().toISOString(),
          }
        : a,
    )
    persist()
  }

  return {
    applications,
    addApplication,
    updateApplication,
    removeApplication,
    addTimelineNode,
    updateTimelineNode,
    setStatus,
  }
})

export const STATUS_ORDER: ApplicationStatus[] = [
  'preparing',
  'appointment_booked',
  'submitted',
  'under_review',
  'approved',
  'rejected',
]
