// components/common/SettingsModal.tsx — 设置弹窗（通知/AI 模型/关于，左右分栏）
// 语言切换统一走侧边栏 中/EN（localStorage: visago:lang 为唯一来源），弹窗内不再读/写 language。
// AppSettings 契约不变（含 language/kimi_api_key 字段原样透传，Rust 结构体不动，旧 settings.json 兼容）。
import { useEffect, useId, useMemo, useState } from 'react'
import { useI18n } from '@/i18n'
import { useAppStore } from '@/stores/appStore'
import { useModalA11y } from '@/hooks/useModalA11y'
import {
  loadSettings,
  saveSettings,
  requestNotificationPermission,
  testKimiConnection,
  isTauri,
  type AppSettings,
} from '@/api/tauri'

type Section = 'notify' | 'about' | 'ai'

const SECTIONS: { key: Section; labelKey: string; icon: string }[] = [
  { key: 'notify', labelKey: 'settings.notify', icon: 'M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0' },
  { key: 'ai', labelKey: 'settings.ai', icon: 'M12 2a7 7 0 017 7c0 2.4-1.2 4.5-3 5.7V17H8v-2.3C6.2 13.5 5 11.4 5 9a7 7 0 017-7zM9 20h6M10 23h4' },
  { key: 'about', labelKey: 'settings.about', icon: 'M12 2a10 10 0 100 20 10 10 0 000-20zM12 8v4M12 16h.01' },
]

/** 掩码摘要：只留首尾各 4 位（如 sk-****…a1b2），完整 Key 不长期停留 DOM */
function maskKey(key: string): string {
  const k = key.trim()
  if (k.length <= 8) return '****'
  return `${k.slice(0, 4)}****…${k.slice(-4)}`
}

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
  const { t } = useI18n()
  const { toast, settingsOpen, settingsSection, openSettings, closeSettings } = useAppStore()
  const titleId = useId()
  const dialogRef = useModalA11y(settingsOpen, closeSettings, titleId)
  const [section, setSection] = useState<Section>(settingsSection)
  const [settings, setSettings] = useState<AppSettings>({
    desktop_notification: false,
    notify_submission: true,
    notify_pre_issue: true,
    // 语言以 visago:lang 为唯一来源；此处仅占位，保存时原样透传，前端不再据此改语言
    language: 'zh-CN',
  })
  // AI Key 输入：编辑中才回填新值；已保存时显示掩码
  const [keyDraft, setKeyDraft] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [editingKey, setEditingKey] = useState(false)
  const [testingKey, setTestingKey] = useState(false)
  const hasSavedKey = !!settings.kimi_api_key?.trim()
  const tauriEnv = isTauri()

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

  // 打开时加载设置（不再据此改语言；语言唯一来源是 visago:lang）
  // 分区由 openSettings 指定（settingsSection），无指定时保持 notify
  useEffect(() => {
    if (!settingsOpen) return
    setSection(settingsSection)
    setKeyDraft('')
    setEditingKey(false)
    setShowKey(false)
    if (!isTauri()) return
    loadSettings()
      .then((s) => setSettings(s))
      .catch((e) => console.warn('[SettingsModal] 加载设置失败:', e))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsOpen, settingsSection])

  // 注意：所有 hooks 必须在条件 return 之前调用（React Hooks 规则）
  const notifyItems = useMemo(
    () => [
      { key: 'notify_submission' as const, titleKey: 'settings.notifySubmission', descKey: 'settings.notifySubmissionDesc' },
      { key: 'notify_pre_issue' as const, titleKey: 'settings.notifyPreIssue', descKey: 'settings.notifyPreIssueDesc' },
    ],
    [],
  )

  if (!settingsOpen) return null

  // 更新设置并持久化（language 字段原样透传，前端不再读写它）
  const update = (patch: Partial<AppSettings>) => {
    const next = { ...settings, ...patch }
    setSettings(next)
    if (!isTauri()) return
    saveSettings(next).catch((e) => console.warn('[SettingsModal] 保存设置失败:', e))
  }

  // 首次开启桌面通知时请求 macOS 权限
  const handleToggleDesktop = async (v: boolean) => {
    update({ desktop_notification: v })
    if (v && isTauri()) {
      try {
        const granted = await requestNotificationPermission()
        toast(granted ? t('settings.permissionGranted') : t('settings.permissionDenied'), granted ? 'success' : 'warning')
      } catch (e) {
        console.warn('[SettingsModal] 请求通知权限失败:', e)
      }
    }
  }

  // ===== AI Key =====

  /** 保存 Key（仅 Tauri 生效；Web 模式按钮已禁用，不会走到这里） */
  function handleSaveKey() {
    const k = keyDraft.trim()
    if (!k) return
    update({ kimi_api_key: k })
    setEditingKey(false)
    setKeyDraft('')
    toast(t('settings.apiKeySaved'), 'success')
  }

  /** 清除 Key */
  function handleClearKey() {
    update({ kimi_api_key: undefined })
    setEditingKey(false)
    setKeyDraft('')
    toast(t('settings.apiKeyCleared'), 'info')
  }

  /** 测试连接：优先测新填未保存的 Key，否则测当前生效 Key；区分 无效/限流/网络 三种失败 */
  async function handleTestKey() {
    if (testingKey) return
    setTestingKey(true)
    try {
      const res = await testKimiConnection(keyDraft.trim() || undefined)
      if (res.kind === 'ok') {
        toast(t('settings.apiKeyTestOk'), 'success')
      } else if (res.kind === 'invalid_key') {
        toast(t('settings.apiKeyTestInvalid'), 'error')
      } else if (res.kind === 'rate_limited') {
        toast(t('settings.apiKeyTestRateLimited'), 'warning')
      } else {
        toast(t('settings.apiKeyTestNetwork'), 'error')
      }
    } catch {
      toast(t('settings.apiKeyTestNetwork'), 'error')
    } finally {
      setTestingKey(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/40 animate-[fadeIn_0.15s_ease]" onClick={closeSettings} />

      {/* 弹窗主体：560x400 白底圆角16 shadow-2xl（两栏后收窄，与内容量匹配） */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex h-[400px] w-[560px] max-w-full overflow-hidden rounded-2xl bg-white shadow-2xl animate-[fadeInUp_0.25s_ease]"
      >
        {/* 隐藏标题（供 aria-labelledby 使用） */}
        <h2 id={titleId} className="sr-only">{t('app.name')} — {t('settings.title')}</h2>

        {/* 左侧分类栏（132px 浅灰 #F3F4F6） */}
        <div className="w-[132px] shrink-0 space-y-1 bg-[#F3F4F6] p-3">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSection(s.key)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150 ${
                section === s.key ? 'bg-[#1460A4] font-medium text-white' : 'text-ink/60 hover:bg-white hover:text-ink'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={s.icon} />
              </svg>
              {t(s.labelKey)}
            </button>
          ))}
        </div>

        {/* 右侧内容区 */}
        <div className="relative flex min-w-0 flex-1 flex-col p-6">
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {section === 'notify' && (
              <div className="space-y-6">
                {/* 启用桌面通知 */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-ink">{t('settings.desktopNotify')}</div>
                    <div className="mt-0.5 text-xs text-ink/60">{t('settings.desktopNotifyDesc')}</div>
                  </div>
                  <Toggle checked={settings.desktop_notification} onChange={handleToggleDesktop} />
                </div>

                {/* 通知类型（开启后才显示） */}
                {settings.desktop_notification && (
                  <div className="space-y-4 border-t border-ink/8 pt-5">
                    {notifyItems.map((item) => (
                      <div key={item.key} className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-1.5 text-sm font-medium text-ink">
                            <span className="h-4 w-4 text-[#39A2B8] icon-[mdi-light--bell]" aria-hidden="true" />
                            {t(item.titleKey)}
                          </div>
                          <div className="mt-0.5 text-xs text-ink/60">{t(item.descKey)}</div>
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

            {section === 'ai' && (
              <div className="space-y-5">
                <div>
                  <div className="text-sm font-semibold text-ink">{t('settings.apiKeyTitle')}</div>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink/60">{t('settings.apiKeyDesc')}</p>
                </div>

                {/* Web 模式：禁用并说明（Web 下填了也不会生效，明确标注不骗用户） */}
                {!tauriEnv ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
                    {t('settings.apiKeyWebDisabled')}
                  </div>
                ) : (
                  <>
                    {hasSavedKey && !editingKey ? (
                      <div className="rounded-xl border border-ink/5 bg-[#F9F9F6] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-xs text-ink/60">{t('settings.apiKeyStored')}</div>
                            <div className="mt-0.5 truncate font-mono text-sm text-ink">{maskKey(settings.kimi_api_key ?? '')}</div>
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingKey(true)
                                setKeyDraft('')
                              }}
                              className="rounded-lg border border-ink/10 px-3 py-1.5 text-xs font-medium text-ink/70 transition-colors hover:border-primary/40 hover:text-primary"
                            >
                              {t('settings.apiKeyReplace')}
                            </button>
                            <button
                              type="button"
                              onClick={handleClearKey}
                              className="rounded-lg border border-ink/10 px-3 py-1.5 text-xs font-medium text-ink/70 transition-colors hover:border-red-300 hover:text-red-600"
                            >
                              {t('settings.apiKeyClear')}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <label htmlFor="settings-api-key" className="sr-only">{t('settings.apiKeyTitle')}</label>
                          <input
                            id="settings-api-key"
                            type={showKey ? 'text' : 'password'}
                            value={keyDraft}
                            onChange={(e) => setKeyDraft(e.target.value)}
                            placeholder={t('settings.apiKeyPlaceholder')}
                            autoComplete="off"
                            spellCheck={false}
                            className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 font-mono text-sm outline-none focus:border-primary/40"
                          />
                          <button
                            type="button"
                            onClick={() => setShowKey((v) => !v)}
                            aria-label={showKey ? t('settings.apiKeyHide') : t('settings.apiKeyShow')}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink"
                          >
                            <span className={`h-4 w-4 icon-[mdi-light--${showKey ? 'eye-off' : 'eye'}]`} aria-hidden="true" />
                          </button>
                        </div>
                        {keyDraft && !keyDraft.trim().startsWith('sk-') && (
                          <p id="settings-api-key-hint" className="text-xs text-amber-700">{t('settings.apiKeyFormatHint')}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap items-center gap-1 text-xs text-ink/60">
                            <span>{t('settings.apiKeyGetKey')}</span>
                            <a
                              href="https://platform.moonshot.cn"
                              target="_blank"
                              rel="noreferrer"
                              className="font-medium text-primary underline-offset-2 hover:underline"
                            >
                              platform.moonshot.cn
                            </a>
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <button
                              type="button"
                              onClick={handleSaveKey}
                              disabled={!keyDraft.trim()}
                              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#0e4a80] disabled:cursor-not-allowed disabled:bg-ink/5 disabled:text-ink/40"
                            >
                              {t('common.save')}
                            </button>
                            {editingKey && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingKey(false)
                                  setKeyDraft('')
                                }}
                                className="rounded-lg border border-ink/10 px-3 py-1.5 text-xs font-medium text-ink/70 transition-colors hover:bg-ink/5"
                              >
                                {t('common.cancel')}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 测试连接：保存的 Key 或新填的 Key 均可测（Key 在 Rust 端） */}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleTestKey}
                        disabled={testingKey}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-ink/10 px-3 py-1.5 text-xs font-medium text-ink/70 transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {testingKey && <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden="true" />}
                        {testingKey ? t('settings.apiKeyTesting') : t('settings.apiKeyTest')}
                      </button>
                    </div>
                  </>
                )}

                <p className="border-t border-ink/8 pt-4 text-[11px] leading-relaxed text-ink/50">
                  {t('settings.apiKeyPlaintextNote')}
                </p>
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
                    <div className="text-xs text-ink/60">{t('settings.version', { version: __APP_VERSION__ })}</div>
                  </div>
                </div>
                <div className="space-y-2 border-t border-ink/8 pt-4 text-sm">
                  <a
                    href="https://github.com/clanzhang/VisaGo"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-ink/70 transition-colors hover:text-[#1460A4]"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M12 2a10 10 0 00-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.2-3.4-1.2-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.4.1-2.9 0 0 .8-.3 2.8 1a9.7 9.7 0 015 0c2-1.3 2.8-1 2.8-1 .5 1.5.2 2.6.1 2.9.6.7 1 1.6 1 2.7 0 3.9-2.3 4.7-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10 10 0 0012 2z" />
                    </svg>
                    {t('settings.githubRepo')}
                  </a>
                  <div className="text-xs text-ink/60">{t('settings.copyright')}</div>
                </div>
              </div>
            )}
          </div>

          {/* 底部居中「完成」按钮（macOS 风格） */}
          <div className="flex justify-center pt-4">
            <button
              onClick={closeSettings}
              className="rounded-lg bg-white px-6 py-2 text-sm font-medium text-[#1460A4] shadow-sm ring-1 ring-ink/10 transition-colors duration-150 hover:bg-[#F3F4F6]"
            >
              {t('settings.done')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
