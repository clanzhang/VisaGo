// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { router } from './router'
import { i18n } from './i18n'
import App from './App'
import 'virtual:uno.css'
import './assets/styles/global.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(i18n)
app.mount('#app')
