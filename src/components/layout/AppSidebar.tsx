// components/layout/AppSidebar.tsx
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'

const items = [
  { to: '/', labelKey: 'nav.home', icon: 'ri:home-4-line', end: true },
  { to: '/assistant', labelKey: 'nav.assistant', icon: 'ri:magic-line' },
  { to: '/tracker', labelKey: 'nav.tracker', icon: 'ri:road-map-line' },
  { to: '/documents', labelKey: 'nav.documents', icon: 'ri:file-list-3-line' },
  { to: '/encyclopedia', labelKey: 'nav.encyclopedia', icon: 'ri:book-2-line' },
]

export default defineComponent({
  name: 'AppSidebar',
  setup() {
    const { t } = useI18n()

    return () => (
      <aside class="hidden xl:flex fixed left-0 top-16 bottom-0 w-52 flex-col border-r border-gray-100 bg-white py-6">
        <nav class="flex flex-1 flex-col gap-1 px-3" aria-label="侧边栏导航">
          {items.map((item) => (
            <RouterLink
              key={item.to}
              to={item.to}
              class="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all text-brand-dark/70 hover:bg-brand-bg hover:text-brand-dark"
              activeClass="!bg-brand-blue !text-white shadow-sm"
            >
              <span class={`i-${item.icon} text-lg`} aria-hidden="true" />
              {t(item.labelKey)}
            </RouterLink>
          ))}
        </nav>
        <div class="px-6 pt-4 text-xs text-brand-muted">
          <p>VisaGo v0.1.0</p>
          <p class="mt-1">MVP · 数据仅供参考</p>
        </div>
      </aside>
    )
  },
})
