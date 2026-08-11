// components/visa/FeeCalculator.tsx
// 费用估算器
import { defineComponent, computed, type PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import type { VisaType } from '../../types'
import VBadge from '../common/VBadge'

export default defineComponent({
  name: 'FeeCalculator',
  props: {
    visaType: { type: Object as PropType<VisaType>, required: true },
  },
  setup(props) {
    const { t } = useI18n()
    const courierFee = 50
    const serviceFee = computed(() => props.visaType.serviceFee?.amount ?? 300)
    const total = computed(
      () => props.visaType.fee.amount + serviceFee.value + courierFee,
    )

    return () => (
      <div>
        <div class="mb-4 flex items-center justify-between">
          <h3 class="flex items-center gap-2 text-base font-semibold text-brand-dark">
            <span class="i-ri-wallet-3-line text-accent-orange" aria-hidden="true" />
            {t('assistant.feeBreakdown')}
          </h3>
          <VBadge class="!bg-accent-purple !text-white !border-transparent">
            <span class="i-ri-calculator-line text-xs" aria-hidden="true" />
            {t('common.tips')}
          </VBadge>
        </div>
        <div class="space-y-2 text-sm">
          {[
            { label: t('assistant.visaFee'), value: props.visaType.fee.amount },
            { label: t('assistant.serviceFee'), value: serviceFee.value },
            { label: t('assistant.courierFee'), value: courierFee },
          ].map((row) => (
            <div
              key={row.label}
              class="flex items-center justify-between border-b border-gray-50 pb-2"
            >
              <span class="text-gray-500">{row.label}</span>
              <span class="font-medium text-brand-dark">¥{row.value}</span>
            </div>
          ))}
          <div class="flex items-center justify-between pt-1">
            <span class="font-semibold text-brand-dark">{t('assistant.total')}</span>
            <span class="text-xl font-bold text-accent-purple">¥{total.value}</span>
          </div>
        </div>
      </div>
    )
  },
})
