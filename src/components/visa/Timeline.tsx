// components/visa/Timeline.tsx
import { defineComponent, type PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ApplicationStatus, TimelineNode } from '../../types'
import { formatDateShort } from '../../utils/date'

const STATUS_ICONS: Record<ApplicationStatus, string> = {
  preparing: 'ri:file-list-3-line',
  appointment_booked: 'ri:calendar-line',
  submitted: 'ri:send-plane-line',
  under_review: 'ri:line-chart-line',
  approved: 'ri:checkbox-circle-fill',
  rejected: 'ri:close-circle-fill',
}

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  preparing: 'bg-gray-200 text-gray-500',
  appointment_booked: 'bg-blue-100 text-blue-600',
  submitted: 'bg-brand-blue/10 text-brand-blue',
  under_review: 'bg-orange-100 text-orange-600',
  approved: 'bg-emerald-100 text-emerald-600',
  rejected: 'bg-red-100 text-red-600',
}

export default defineComponent({
  name: 'Timeline',
  props: {
    nodes: { type: Array as PropType<TimelineNode[]>, required: true },
    currentStatus: { type: String as PropType<ApplicationStatus>, required: true },
  },
  emits: ['edit'],
  setup(props, { emit }) {
    const { t } = useI18n()

    return () => {
      const displayNodes: TimelineNode[] =
        props.nodes.length > 0 ? props.nodes : [{ status: props.currentStatus }]

      return (
        <ol class="relative space-y-4 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-px before:bg-gray-200">
          {displayNodes.map((node, i) => (
            <li key={i} class="relative flex gap-4 pl-0">
              <span
                class={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  STATUS_COLORS[node.status]
                } ${node.status === props.currentStatus && !node.date ? 'animate-ping-ring' : ''}`}
                aria-hidden="true"
              >
                <span class={`i-${STATUS_ICONS[node.status]} text-base`} />
              </span>
              <div class="flex-1 pb-1">
                <button
                  onClick={() => emit('edit', i)}
                  class="w-full rounded-xl border border-gray-100 p-3 text-left transition-all hover:border-brand-blue/30 hover:bg-brand-bg"
                >
                  <div class="flex items-center justify-between gap-2">
                    <p class="text-sm font-medium text-brand-dark">
                      {t(`tracker.status.${node.status}`)}
                    </p>
                    {node.date && (
                      <span class="text-xs text-brand-muted">{formatDateShort(node.date)}</span>
                    )}
                  </div>
                  {node.note && <p class="mt-1 text-xs text-gray-500">{node.note}</p>}
                </button>
              </div>
            </li>
          ))}
        </ol>
      )
    }
  },
})
