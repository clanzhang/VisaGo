// App.tsx
import { defineComponent } from 'vue'
import { RouterView } from 'vue-router'
import { AppHeader, AppSidebar } from './components/layout'
import VToast from './components/common/VToast'

export default defineComponent({
  name: 'App',
  setup() {
    return () => (
      <div class="min-h-screen bg-brand-bg text-brand-dark">
        <AppHeader />
        <AppSidebar />
        <main class="container-app pt-24 pb-12 xl:pl-64">
          <RouterView />
        </main>
        <VToast />
      </div>
    )
  },
})
