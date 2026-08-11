// components/global.ts
// 全局注册 vue-router 组件（供 TSX 使用）
import { RouterLink, RouterView } from 'vue-router'
import type { App } from 'vue'

export function registerGlobalComponents(app: App) {
  app.component('RouterLink', RouterLink)
  app.component('RouterView', RouterView)
}
