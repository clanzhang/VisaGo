// App.tsx — 应用根组件与布局
// 页面级代码分割：React.lazy 按路由懒加载，首屏只加载当前页 chunk，
// 避免 585KB 单 bundle 导致切换页面白屏/卡顿。
import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout'
import { VToast } from '@/components/common'
import { I18nProvider } from '@/i18n'
import { AppStoreProvider } from '@/stores/appStore'
import { VisaStoreProvider } from '@/stores/visaStore'
import { TrackerStoreProvider } from '@/stores/trackerStore'
import { useI18n } from '@/i18n'

// 每个页面独立 chunk，按需加载
const Home = lazy(() => import('@/pages/Home'))
const Assistant = lazy(() => import('@/pages/Assistant'))
const Tracker = lazy(() => import('@/pages/Tracker'))
const Encyclopedia = lazy(() => import('@/pages/Encyclopedia'))
const CountryDetail = lazy(() => import('@/pages/CountryDetail'))
const Scan = lazy(() => import('@/pages/Scan'))

/** 路由级加载态：与页面最终布局同尺寸的骨架，避免布局跳动（CLS） */
function RouteFallback() {
  const { t } = useI18n()
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#39A2B8] border-t-transparent" aria-hidden="true" />
        <span className="text-sm text-ink/60">{t('common.loading')}</span>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <AppStoreProvider>
        <VisaStoreProvider>
          <TrackerStoreProvider>
            <AppShell>
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/assistant" element={<Assistant />} />
                  <Route path="/tracker" element={<Tracker />} />
                  <Route path="/encyclopedia" element={<Encyclopedia />} />
                  <Route path="/encyclopedia/:id" element={<CountryDetail />} />
                  <Route path="/scan" element={<Scan />} />
                  <Route path="*" element={<Home />} />
                </Routes>
              </Suspense>
              <VToast />
            </AppShell>
          </TrackerStoreProvider>
        </VisaStoreProvider>
      </AppStoreProvider>
    </I18nProvider>
  )
}
