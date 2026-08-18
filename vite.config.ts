import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { appVersionPlugin } from './vite-plugins/app-version'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 读取 .env，Key 仅在 dev server 端使用，不暴露给浏览器
  const env = loadEnv(mode, process.cwd(), '')
  const kimiKey = env.KIMI_API_KEY
  const kimiBase = env.KIMI_BASE_URL || 'https://api.moonshot.cn/v1'

  return {
    // 版本号不再用 define 固化（define 在 dev server 启动时缓存，改版本号需重启）；
    // 改由 appVersionPlugin 在每次 transform 时读 package.json，dev 下刷新即生效。
    plugins: [appVersionPlugin(), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    // Tauri 期望固定端口，避免随机
    clearScreen: false,
    server: {
      port: 1420,
      strictPort: true,
      watch: {
        // 忽略 src-tauri 下的 Rust 变更，避免触发前端重载
        ignored: ['**/src-tauri/**'],
      },
      proxy: {
        // Kimi API 代理：浏览器只请求 /kimi/*，Key 由 dev server 注入，绝不进入前端 bundle
        '/kimi': {
          target: kimiBase,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/kimi/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (kimiKey) {
                proxyReq.setHeader('Authorization', `Bearer ${kimiKey}`)
              }
            })
          },
        },
      },
    },
    build: {
      target: 'es2021',
    },
  }
})
