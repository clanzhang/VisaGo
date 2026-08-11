// App.tsx — 应用根组件与布局
import { Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout'
import { VToast } from '@/components/common'
import { I18nProvider } from '@/i18n'
import { AppStoreProvider } from '@/stores/appStore'
import { VisaStoreProvider } from '@/stores/visaStore'
import { TrackerStoreProvider } from '@/stores/trackerStore'
import Home from '@/pages/Home'
import Assistant from '@/pages/Assistant'
import Tracker from '@/pages/Tracker'
import Documents from '@/pages/Documents'
import Encyclopedia from '@/pages/Encyclopedia'
import CountryDetail from '@/pages/CountryDetail'
import Scan from '@/pages/Scan'

export default function App() {
  return (
    <I18nProvider>
      <AppStoreProvider>
        <VisaStoreProvider>
          <TrackerStoreProvider>
            <AppShell>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/assistant" element={<Assistant />} />
                <Route path="/tracker" element={<Tracker />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/encyclopedia" element={<Encyclopedia />} />
                <Route path="/encyclopedia/:id" element={<CountryDetail />} />
                <Route path="/scan" element={<Scan />} />
                <Route path="*" element={<Home />} />
              </Routes>
              <VToast />
            </AppShell>
          </TrackerStoreProvider>
        </VisaStoreProvider>
      </AppStoreProvider>
    </I18nProvider>
  )
}
