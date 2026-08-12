// components/common/SettingsModal.tsx — 设置弹窗（通用/通知/关于，左右分栏）
import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '@/i18n'
import { useAppStore } from '@/stores/appStore'
import { loadSettings, saveSettings, requestNotificationPermission, isTauri, type AppSettings } from '@/api/tauri'

type Section = 'general' | 'notify' | 'about'

const SECTIONS: { key: Section; label: string; icon: string }[] = [
  { key: 'general', label: '通用', icon: 'M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1' },
  { key: 'notify', label: '通知', icon: 'M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0' },
  { key: 'about', label: '关于', icon: 'M12 2a10 10 0 100 20 10 10 0 000-20zM12 8v4M12 16h.01' },
]

/** Toggle 开关组件：开启蓝色 #1460A4，关闭灰色 #D1D5DB，transition 200ms */
function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
        checked ? 'bg-[#1460A4]' : 'bg-[#D1D5DB]'
      } ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? 'translate-x-[22px]' : 'translate-x-[2px]'
        }`}
      />
    </button>
  )
}

export function SettingsModal() {
  const { setLang } = useI18n()
  const { toast, settingsOpen, openSettings, closeSettings } = useAppStore()
  const [section, setSection] = useState<Section>('general')
  const [settings, setSettings] = useState<AppSettings>({
    desktop_notification: false,
    notify_submission: true,
    notify_pre_issue: true,
    language: 'zh-CN',
  })

  // 监听 Tauri 菜单事件 open-preferences（macOS 菜单栏 visago → 偏好设置 ⌘,）
  useEffect(() => {
    if (!isTauri()) return
    let unlisten: (() => void) | undefined
    let cancelled = false
    ;(async () => {
      const { listen } = await import('@tauri-apps/api/event')
      if (cancelled) return
      unlisten = await listen('open-preferences', () => {
        console.log('[SettingsModal] 收到菜单事件 open-preferences，打开弹窗')
        openSettings()
      })
    })()
    return () => {
      cancelled = true
      unlisten?.()
    }
  }, [openSettings])

  // 打开时加载设置 + Esc 关闭
  useEffect(() => {
    if (!settingsOpen) return
    setSection('general')
    if (!isTauri()) return
    loadSettings()
      .then((s) => {
        setSettings(s)
        if (s.language) setLang(s.language === 'en-US' ? 'en-US' : 'zh-CN')
      })
      .catch((e) => console.warn('[SettingsModal] 加载设置失败:', e))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsOpen])

  useEffect(() => {
    if (!settingsOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSettings()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [settingsOpen, closeSettings])

  // 注意：所有 hooks 必须在条件 return 之前调用（React Hooks 规则）
  const notifyItems = useMemo(
    () => [
      { key: 'notify_submission' as const, title: '递签日提醒', desc: '递签当天提醒你带齐材料前往签证中心' },
      { key: 'notify_pre_issue' as const, title: '出签前 3 天提醒', desc: '预计出签前 3 天提醒你留意结果' },
    ],
    [],
  )

  if (!settingsOpen) return null

  // 更新设置并持久化
  const update = (patch: Partial<AppSettings>) => {
    const next = { ...settings, ...patch }
    setSettings(next)
    if (!isTauri()) return
    saveSettings(next).catch((e) => console.warn('[SettingsModal] 保存设置失败:', e))
    if (patch.language) setLang(patch.language === 'en-US' ? 'en-US' : 'zh-CN')
  }

  // 首次开启桌面通知时请求 macOS 权限
  const handleToggleDesktop = async (v: boolean) => {
    update({ desktop_notification: v })
    if (v && isTauri()) {
      try {
        const granted = await requestNotificationPermission()
        toast(granted ? '通知权限已开启' : '未获得通知权限，请在系统设置中允许', granted ? 'success' : 'warning')
      } catch (e) {
        console.warn('[SettingsModal] 请求通知权限失败:', e)
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/40 animate-[fadeIn_0.15s_ease]" onClick={closeSettings} />

      {/* 弹窗主体：640x420 白底圆角16 shadow-2xl */}
      <div className="relative flex h-[420px] w-[640px] max-w-full overflow-hidden rounded-2xl bg-white shadow-2xl animate-[fadeInUp_0.25s_ease]">
        {/* 左侧分类栏（160px 浅灰 #F3F4F6） */}
        <div className="w-[160px] shrink-0 space-y-1 bg-[#F3F4F6] p-3">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSection(s.key)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150 ${
                section === s.key ? 'bg-[#1460A4] font-medium text-white' : 'text-ink/55 hover:bg-white hover:text-ink'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={s.icon} />
              </svg>
              {s.label}
            </button>
          ))}
        </div>

        {/* 右侧内容区 */}
        <div className="relative flex-1 min-w-0 p-6">
          {/* 右上角关闭按钮 */}
          <button
            onClick={closeSettings}
            className="absolute right-4 top-4 rounded-lg p-1 text-ink/40 transition-colors hover:bg-ink/5 hover:text-ink"
            aria-label="关闭"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>

          <div className="h-full overflow-y-auto pr-1">
            {section === 'notify' && (
              <div className="space-y-6">
                {/* 启用桌面通知 */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-ink">启用桌面通知</div>
                    <div className="mt-0.5 text-xs text-ink/50">开启后，递签提醒、出签提醒将推送到系统通知中心</div>
                  </div>
                  <Toggle checked={settings.desktop_notification} onChange={handleToggleDesktop} />
                </div>

                {/* 通知类型（开启后才显示） */}
                {settings.desktop_notification && (
                  <div className="space-y-4 border-t border-ink/8 pt-5">
                    {notifyItems.map((item) => (
                      <div key={item.key} className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-sm font-medium text-ink">☑ {item.title}</div>
                          <div className="mt-0.5 text-xs text-ink/50">{item.desc}</div>
                        </div>
                        <Toggle
                          checked={settings[item.key]}
                          onChange={(v) => update({ [item.key]: v } as Partial<AppSettings>)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {section === 'general' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-ink">语言</div>
                    <div className="mt-0.5 text-xs text-ink/50">界面显示语言</div>
                  </div>
                  <select
                    value={settings.language}
                    onChange={(e) => update({ language: e.target.value })}
                    className="rounded-xl border border-ink/10 bg-white px-4 py-2 text-sm outline-none focus:border-primary/40"
                  >
                    <option value="zh-CN">中文</option>
                    <option value="en-US">English</option>
                  </select>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-ink/8 pt-5">
                  <div>
                    <div className="text-sm font-semibold text-ink">开机自动启动</div>
                    <div className="mt-0.5 text-xs text-ink/50">登录 macOS 后自动打开 VisaGo</div>
                  </div>
                  <Toggle checked={false} onChange={() => toast('开机自启暂未支持', 'info')} />
                </div>
              </div>
            )}

            {section === 'about' && (
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E0F7FA]">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1460A4" strokeWidth="1.8">
                      <path d="M3 7h12a3 3 0 013 3v8a3 3 0 01-3 3H3a1 1 0 01-1-1V8a1 1 0 011-1z" />
                      <path d="M3 7a1 1 0 011-1h4l3 3h4l3-3h2a1 1 0 011 1v3H3V7z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-display text-lg font-bold text-ink">VisaGo</div>
                    <div className="text-xs text-ink/50">版本 v0.0.9</div>
                  </div>
                </div>
                <div className="space-y-2 border-t border-ink/8 pt-4 text-sm">
                  <a
                    href="https://github.com/yourusername/visago"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-ink/70 transition-colors hover:text-[#1460A4]"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M12 2a10 10 0 00-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.2-3.4-1.2-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.4.1-2.9 0 0 .8-.3 2.8 1a9.7 9.7 0 015 0c2-1.3 2.8-1 2.8-1 .5 1.5.2 2.6.1 2.9.6.7 1 1.6 1 2.7 0 3.9-2.3 4.7-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10 10 0 0012 2z" />
                    </svg>
                    GitHub 仓库
                  </a>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toast('当前已是最新版本 v0.0.9', 'info')}
                      className="flex items-center gap-2 rounded-lg border border-ink/10 px-3 py-1.5 text-xs font-medium text-ink/70 transition-colors hover:border-[#1460A4]/40 hover:text-[#1460A4]"
                    >
                      🔄 检查更新
                    </button>
                  </div>
                  <div className="text-xs text-ink/40">Copyright © 2026 VisaGo. 保留所有权利。</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
