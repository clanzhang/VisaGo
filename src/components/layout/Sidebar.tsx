// components/layout/Sidebar.tsx — 左侧导航栏（240px，深黑背景）
import { NavLink } from 'react-router-dom'
import { useI18n } from '@/i18n'
import { useVisaStore } from '@/stores/visaStore'

const NAV_ITEMS = [
  { to: '/', key: 'home', icon: 'M3 12l9-9 9 9M5 10v10h14V10' },
  { to: '/assistant', key: 'assistant', icon: 'M12 4a4 4 0 100 8 4 4 0 000-8zM6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2' },
  { to: '/tracker', key: 'tracker', icon: 'M21 12a9 9 0 11-18 0 9 9 0 0118 0zM12 7v5l3 2' },
  { to: '/documents', key: 'documents', icon: 'M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5zM14 3v5h5M9 13h6M9 17h6' },
  { to: '/encyclopedia', key: 'encyclopedia', icon: 'M4 19.5A2.5 2.5 0 016.5 17H20V4H6.5A2.5 2.5 0 004 6.5v13zM20 8h-5' },
]

export function Sidebar() {
  const { t, lang, setLang } = useI18n()
  const { reset } = useVisaStore()

  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col bg-sidebar text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 pt-7 pb-8">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E0F7FA]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1460A4" strokeWidth="1.8">
            <path d="M3 7h12a3 3 0 013 3v8a3 3 0 01-3 3H3a1 1 0 01-1-1V8a1 1 0 011-1z" fill="#E0F7FA" stroke="#1460A4" />
            <path d="M3 7a1 1 0 011-1h4l3 3h4l3-3h2a1 1 0 011 1v3H3V7z" fill="#39A2B8" stroke="#1460A4" />
            <circle cx="10" cy="13" r="2.2" fill="#1460A4" />
          </svg>
        </div>
        <div className="leading-tight">
          <div className="font-display text-[17px] font-bold tracking-tight">VisaGo</div>
          <div className="text-[11px] text-white/50">{t('app.tagline')}</div>
        </div>
      </div>

      {/* 用户信息 */}
      <div className="mx-4 mb-6 flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#39A2B8] to-[#1460A4] text-sm font-semibold text-white">
          用户
        </div>
        <div className="leading-tight">
          <div className="text-[13px] font-medium">旅行者</div>
          <div className="text-[11px] text-white/50">VIP 会员</div>
        </div>
      </div>

      {/* 导航 */}
      <nav className="flex-1 space-y-1 px-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={() => item.to === '/' && reset()}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm transition-colors duration-150 ${
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
                <span>{t(`nav.${item.key}`)}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* 底部 */}
      <div className="flex items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2 rounded-lg bg-white/5 px-2 py-1">
          {(['zh-CN', 'en-US'] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`rounded-md px-2 py-1 text-xs transition-colors duration-150 ${
                lang === l ? 'bg-white font-semibold text-ink' : 'text-white/50 hover:text-white'
              }`}
            >
              {l === 'zh-CN' ? '中' : 'EN'}
            </button>
          ))}
        </div>
        <div className="text-[11px] text-white/30">v0.1.0</div>
      </div>
    </aside>
  )
}
