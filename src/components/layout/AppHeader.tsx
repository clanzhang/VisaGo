// components/layout/AppHeader.tsx
import { defineComponent, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute } from 'vue-router'
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
    const route = useRoute()
    const scrolled = ref(false)
    const menuOpen = ref(false)

    const onScroll = () => {
      scrolled.value = window.scrollY > 10
    }

    const closeMenu = () => (menuOpen.value = false)

    onMounted(() => window.addEventListener('scroll', onScroll))
    onUnmounted(() => window.removeEventListener('scroll', onScroll))

    return () => (
      <header
        class={`fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-brand-dark to-brand-blue transition-shadow ${
          scrolled.value ? 'shadow-lg' : ''
        }`}
      >
        <div class="container-app flex h-16 items-center justify-between">
          <RouterLink to="/" class="flex items-center gap-2.5" onClick={closeMenu}>
            <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-accent-orange">
              <span class="i-ri-flight-takeoff-line text-lg" aria-hidden="true" />
            </span>
            <span class="flex flex-col leading-tight">
              <span class="text-lg font-bold text-white tracking-wide">{t('app.name')}</span>
              <span class="text-[10px] text-white/60">{t('app.tagline')}</span>
            </span>
          </RouterLink>

          {/* 桌面端导航 */}
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
            {/* 移动端汉堡按钮 */}
            <button
              onClick={() => (menuOpen.value = !menuOpen.value)}
              class="flex h-10 w-10 items-center justify-center rounded-xl text-white transition-colors hover:bg-white/10 lg:hidden"
              aria-label={t('nav.menu')}
              aria-expanded={menuOpen.value}
            >
              <span
                class={`i-${menuOpen.value ? 'ri-close-line' : 'ri-menu-line'} text-xl`}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        {/* 移动端右侧滑出抽屉 */}
        <div
          class={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
            menuOpen.value ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          onClick={closeMenu}
          aria-hidden={!menuOpen.value}
        >
          {/* 遮罩 */}
          <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          {/* 抽屉 */}
          <div
            class={`absolute top-0 right-0 h-full w-72 max-w-[85vw] bg-white shadow-2xl transition-transform duration-300 ${
              menuOpen.value ? 'translate-x-0' : 'translate-x-full'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div class="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <span class="text-base font-bold text-brand-dark">VisaGo</span>
              <button
                onClick={closeMenu}
                class="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label={t('ai.close')}
              >
                <span class="i-ri-close-line text-lg" aria-hidden="true" />
              </button>
            </div>
            <nav class="flex flex-col gap-1 p-3" aria-label="移动端导航">
              {navItems.map((item) => {
                const active = item.end
                  ? route.path === item.to
                  : route.path.startsWith(item.to)
                return (
                  <RouterLink
                    key={item.to}
                    to={item.to}
                    onClick={closeMenu}
                    class={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                      active
                        ? 'bg-brand-blue text-white shadow-sm'
                        : 'text-brand-dark/70 hover:bg-brand-bg hover:text-brand-dark'
                    }`}
                  >
                    <span class={`i-${item.icon} text-lg`} aria-hidden="true" />
                    {t(item.labelKey)}
                  </RouterLink>
                )
              })}
            </nav>
            <div class="absolute bottom-0 left-0 right-0 border-t border-gray-100 px-6 py-4 text-xs text-brand-muted">
              <p>VisaGo v0.1.0</p>
              <p class="mt-1">MVP · 数据仅供参考</p>
            </div>
          </div>
        </div>
      </header>
    )
  },
})
