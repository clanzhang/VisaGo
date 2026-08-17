// components/layout/Sidebar.tsx — 左侧导航栏（深黑背景）
// 桌面：常驻（可 260/64 折叠）；≤768px：抽屉式覆盖（由 AppShell 控制开合）
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useI18n } from '@/i18n'
import { useVisaStore } from '@/stores/visaStore'
import { useUserIdentity } from '@/hooks/useUserIdentity'

const NAV_ITEMS = [
  { to: '/', key: 'home', icon: 'M3 12l9-9 9 9M5 10v10h14V10' },
  { to: '/assistant', key: 'assistant', icon: 'M12 4a4 4 0 100 8 4 4 0 000-8zM6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2' },
  { to: '/scan', key: 'scan', icon: 'M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5zM14 3v5h5M9 13h6M9 17h6' },
  { to: '/tracker', key: 'tracker', icon: 'M21 12a9 9 0 11-18 0 9 9 0 0118 0zM12 7v5l3 2' },
  { to: '/encyclopedia', key: 'encyclopedia', icon: 'M4 19.5A2.5 2.5 0 016.5 17H20V4H6.5A2.5 2.5 0 004 6.5v13zM20 8h-5' },
]

interface Props {
  /** 移动端抽屉是否打开（≤768px 生效） */
  mobileOpen?: boolean
  /** 移动端抽屉关闭（点击导航/遮罩时调用） */
  onCloseMobile?: () => void
}

export function Sidebar({ mobileOpen = false, onCloseMobile }: Props) {
  const { t, lang, setLang } = useI18n()
  const { reset } = useVisaStore()
  const { name, cardName } = useUserIdentity()
  const [expanded, setExpanded] = useState(true)

  /** 导航点击统一处理：事件 + 移动端关闭抽屉 */
  function handleNavClick(to: string) {
    // 点击「材料扫描」：通知 Scan 页重置到文件列表页（保留已扫描文件）
    if (to === '/scan') {
      window.dispatchEvent(new CustomEvent('visago:reset-scan'))
    }
    if (to === '/') reset()
    onCloseMobile?.()
  }

  /** 桌面侧栏内容（260/64 折叠） */
  const desktopAside = (
    <aside
      className={`hidden h-full shrink-0 flex-col bg-sidebar text-white transition-all duration-[390ms] ease-in-out md:flex ${
        expanded ? 'w-[260px]' : 'w-[64px]'
      }`}
    >
      <SidebarHeader
        expanded={expanded}
        onToggle={() => setExpanded((v) => !v)}
        collapseTitle={expanded ? t('sidebar.collapse') : t('sidebar.expand')}
        t={t}
      />
      <SidebarUser name={name} cardName={cardName} expanded={expanded} t={t} />
      <NavItems expanded={expanded} onNavigate={handleNavClick} t={t} />
      <SidebarFooter expanded={expanded} lang={lang} setLang={setLang} />
    </aside>
  )

  /** 移动端抽屉（覆盖层，固定 280px 全高） */
  const mobileDrawer = (
    <div className={`fixed inset-0 z-50 md:hidden ${mobileOpen ? '' : 'pointer-events-none'}`}>
      {/* 遮罩 */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onCloseMobile}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t('app.name')}
        className={`absolute inset-y-0 left-0 flex w-[280px] flex-col bg-sidebar text-white shadow-float transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 pt-7 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E0F7FA]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1460A4" strokeWidth="1.8">
                <path d="M3 7h12a3 3 0 013 3v8a3 3 0 01-3 3H3a1 1 0 01-1-1V8a1 1 0 011-1z" fill="#E0F7FA" stroke="#1460A4" />
                <path d="M3 7a1 1 0 011-1h4l3 3h4l3-3h2a1 1 0 011 1v3H3V7z" fill="#39A2B8" stroke="#1460A4" />
                <circle cx="10" cy="13" r="2.2" fill="#1460A4" />
              </svg>
            </div>
            <div className="leading-tight">
              <div className="whitespace-nowrap font-display text-[17px] font-bold tracking-tight">VisaGo</div>
              <div className="whitespace-nowrap text-[11px] text-white/55">{t('app.tagline')}</div>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
            aria-label={t('common.close')}
            title={t('common.close')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <SidebarUser name={name} cardName={cardName} expanded t={t} />
        <NavItems expanded onNavigate={handleNavClick} t={t} />
        <SidebarFooter expanded={expanded} lang={lang} setLang={setLang} />
      </aside>
    </div>
  )

  return (
    <>
      {desktopAside}
      {mobileDrawer}
    </>
  )
}

/** Logo + 折叠按钮 */
function SidebarHeader({
  expanded,
  onToggle,
  collapseTitle,
  t,
}: {
  expanded: boolean
  onToggle: () => void
  collapseTitle: string
  t: (key: string, params?: Record<string, string | number>) => string
}) {
  return (
    <div className={`flex items-center pt-7 pb-8 ${expanded ? 'gap-3 px-4' : 'flex-col gap-2 px-0'}`}>
      <div className={`flex items-center ${expanded ? 'gap-3' : 'justify-center'}`}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E0F7FA]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1460A4" strokeWidth="1.8">
            <path d="M3 7h12a3 3 0 013 3v8a3 3 0 01-3 3H3a1 1 0 01-1-1V8a1 1 0 011-1z" fill="#E0F7FA" stroke="#1460A4" />
            <path d="M3 7a1 1 0 011-1h4l3 3h4l3-3h2a1 1 0 011 1v3H3V7z" fill="#39A2B8" stroke="#1460A4" />
            <circle cx="10" cy="13" r="2.2" fill="#1460A4" />
          </svg>
        </div>
        <div className={`leading-tight transition-opacity duration-[260ms] ${expanded ? 'opacity-100' : 'w-0 overflow-hidden opacity-0'}`}>
          <div className="whitespace-nowrap font-display text-[17px] font-bold tracking-tight">VisaGo</div>
          <div className="whitespace-nowrap text-[11px] text-white/55">{t('app.tagline')}</div>
        </div>
      </div>
      <button
        onClick={onToggle}
        title={collapseTitle}
        aria-label={collapseTitle}
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white/60 transition-colors duration-150 hover:bg-white/10 hover:text-white ${
          expanded ? 'ml-auto' : ''
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {expanded ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
        </svg>
      </button>
    </div>
  )
}

/** 用户信息（真实来源，不编造身份） */
function SidebarUser({
  name,
  cardName,
  expanded,
  t,
}: {
  name: string
  cardName: string
  expanded: boolean
  t: (key: string, params?: Record<string, string | number>) => string
}) {
  return (
    <div className={`mb-6 flex items-center rounded-xl bg-white/5 py-2.5 transition-all duration-[390ms] ${expanded ? 'mx-4 gap-3 px-3' : 'mx-2 justify-center'}`}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#39A2B8] to-[#1460A4] text-sm font-semibold text-white">
        {name ? name.slice(0, 1) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
          </svg>
        )}
      </div>
      <div className={`leading-tight transition-opacity duration-[260ms] ${expanded ? 'opacity-100' : 'w-0 overflow-hidden opacity-0'}`}>
        <div className="whitespace-nowrap text-[13px] font-medium">{name || t('sidebar.anonymous')}</div>
        <div className="whitespace-nowrap text-[11px] text-white/55">
          {cardName || (name ? '' : t('sidebar.noProfile'))}
        </div>
      </div>
    </div>
  )
}

/** 导航列表 */
function NavItems({
  expanded,
  onNavigate,
  t,
}: {
  expanded: boolean
  onNavigate: (to: string) => void
  t: (key: string, params?: Record<string, string | number>) => string
}) {
  return (
    <nav className={`flex-1 space-y-1 ${expanded ? 'px-4' : 'px-0'}`}>
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          title={t(`nav.${item.key}`)}
          onClick={() => onNavigate(item.to)}
          className={({ isActive }) =>
            `group relative flex w-full items-center rounded-lg py-2.5 text-sm transition-all duration-[390ms] ${
              expanded ? 'gap-3 px-3.5' : 'justify-center px-0'
            } ${
              isActive
                ? 'bg-white/10 font-medium text-white'
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-[#1460A4] transition-opacity ${isActive ? 'opacity-100' : 'opacity-0'}`}
              />
              <svg
                className="shrink-0"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={item.icon} />
              </svg>
              <span className={`whitespace-nowrap transition-opacity duration-[260ms] ${expanded ? 'opacity-100' : 'w-0 overflow-hidden opacity-0'}`}>
                {t(`nav.${item.key}`)}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

/** 底部：语言切换 + 版本 */
function SidebarFooter({
  expanded,
  lang,
  setLang,
}: {
  expanded: boolean
  lang: string
  setLang: (l: 'zh-CN' | 'en-US') => void
}) {
  return (
    <div className={`overflow-hidden transition-all duration-[390ms] ${expanded ? 'px-4 pb-5 opacity-100' : 'h-0 pb-0 opacity-0'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 rounded-lg bg-white/5 px-2 py-1">
          {(['zh-CN', 'en-US'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`rounded-md px-2 py-1 text-xs transition-colors duration-150 ${
                lang === l ? 'bg-white font-semibold text-ink' : 'text-white/60 hover:text-white'
              }`}
            >
              {l === 'zh-CN' ? '中' : 'EN'}
            </button>
          ))}
        </div>
        <div className="text-[11px] text-white/55">v0.0.9</div>
      </div>
    </div>
  )
}
