// vite-plugins/app-version.ts — 版本号注入插件（替代 define 固化值）
// 动机：define 的值在 dev server 启动时固化（patternsCache 缓存），改 package.json 后
// 必须重启 dev server 才能看到新版本。本插件改为在每次模块 transform 时读 package.json，
// 并用 watcher 监听 package.json 变化即时失效——dev 下改版本号刷新页面即生效，无需重启。
import { readFileSync } from 'node:fs'
import type { Plugin } from 'vite'

export function appVersionPlugin(): Plugin {
  let version: string | null = null

  function readVersion(): string {
    if (version) return version
    try {
      const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8')) as { version: string }
      version = pkg.version
    } catch {
      version = '0.0.0'
    }
    return version
  }

  return {
    name: 'visago:app-version',
    // 监听 package.json 变更：清缓存，让下一次 transform 读到新版本
    configureServer(server) {
      server.watcher.on('change', (file) => {
        if (String(file).endsWith('package.json')) version = null
      })
    },
    // 每次模块 transform 时替换（dev 下每次请求/HMR 都会重新执行）
    transform(code) {
      if (!code.includes('__APP_VERSION__')) return
      return {
        code: code.replaceAll('__APP_VERSION__', JSON.stringify(readVersion())),
        map: null,
      }
    },
  }
}
