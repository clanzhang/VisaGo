// App.tsx
import { defineComponent } from 'vue'
import { RouterView } from 'vue-router'
import { AppHeader } from './components/layout'
import VToast from './components/common/VToast'

export default defineComponent({
  name: 'App',
  setup() {
    return () => (
      <div class="min-h-screen bg-brand-bg text-brand-dark">
        <AppHeader />
        <main class="container-app pt-24 pb-12">
          <RouterView />
        </main>
        <VToast />
      </div>
    )
  },
})
