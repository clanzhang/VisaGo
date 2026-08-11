// components/layout/AppHeader.tsx
import { defineComponent, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import LangSwitch from './LangSwitch'

const navItems = [
  { to: '/', labelKey: 'nav.home', icon: 'ri:home-4-line', end: true },
  { to: '/assistant', labelKey: 'nav.assistant', icon: 'ri:magic-line' },
  { to: '/tracker', labelKey: 'nav.tracker', icon: 'ri:road-map-line' },
  { to: '/documents', labelKey: 'nav.documents', icon: 'ri:file-list-3-line' },
  { to: '/encyclopedia', labelKey: 'nav.encyclopedia', icon: 'ri:book-2-line' },
]

export default defineComponent({
  name: 'AppHeader',
  setup() {
    const { t } = useI18n()
    const scrolled = ref(false)

    const onScroll = () => {
      scrolled.value = window.scrollY > 10
    }

    onMounted(() => window.addEventListener('scroll', onScroll))
    onUnmounted(() => window.removeEventListener('scroll', onScroll))

    return () => (
      <header
        class={`fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-brand-dark to-brand-blue transition-shadow ${
          scrolled.value ? 'shadow-lg' : ''
        }`}
      >
        <div class="container-app flex h-16 items-center justify-between">
          <RouterLink to="/" class="flex items-center gap-2.5">
            <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-accent-orange">
              <span class="i-ri-flight-takeoff-line text-lg" aria-hidden="true" />
            </span>
            <span class="flex flex-col leading-tight">
              <span class="text-lg font-bold text-white tracking-wide">{t('app.name')}</span>
              <span class="text-[10px] text-white/60">{t('app.tagline')}</span>
            </span>
          </RouterLink>

          <nav class="hidden lg:flex items-center gap-1" aria-label="主导航">
            {navItems.map((item) => (
              <RouterLink
                key={item.to}
                to={item.to}
                class="group relative px-3.5 py-2 text-sm font-medium text-white/85 transition-colors hover:text-white"
              >
                {t(item.labelKey)}
                <span class="absolute bottom-0 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-accent-orange transition-all duration-300 group-hover:w-full" />
              </RouterLink>
            ))}
          </nav>

          <div class="flex items-center gap-2">
            <LangSwitch />
          </div>
        </div>
      </header>
    )
  },
})
