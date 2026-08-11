// components/visa/Timeline.tsx — 申请进度时间线
import { useI18n } from '@/i18n'
import type { ApplicationStatus, TimelineNode } from '@/types'

interface Props {
  nodes: TimelineNode[]
  current?: ApplicationStatus
}

const statusOrder: ApplicationStatus[] = [
  'preparing',
  'appointment_booked',
  'submitted',
  'under_review',
  'approved',
  'rejected',
]

const statusTone: Record<ApplicationStatus, string> = {
  preparing: 'bg-[#6B7280]',
  appointment_booked: 'bg-[#1460A4]',
  submitted: 'bg-[#39A2B8]',
  under_review: 'bg-[#E5B454]',
  approved: 'bg-[#4F9E28]',
  rejected: 'bg-red-500',
}

export function Timeline({ nodes, current }: Props) {
  const { t } = useI18n()

  const activeIndex = current
    ? statusOrder.findIndex((s) => s === current)
    : nodes.length - 1

  return (
    <div className="relative space-y-0 pl-6">
      <span className="absolute left-[9px] top-2 h-full w-0.5 bg-[#F3F4F6]" />
      {nodes.map((node, i) => {
        const isActive = i === activeIndex || i < activeIndex
        return (
          <div key={i} className="relative pb-4 last:pb-0">
            <span
              className={`absolute -left-6 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white shadow ${isActive ? statusTone[node.status] : 'bg-[#E5E7EB]'}`}
            />
            <div className="text-sm font-medium">{t(`tracker.status.${node.status}`)}</div>
            {node.date && (
              <div className="text-xs text-ink/40">
                {node.date} {node.note && `· ${node.note}`}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
