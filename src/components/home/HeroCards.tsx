// components/home/HeroCards.tsx — 两个并排插画 CTA 卡片
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/i18n'

/** 护照+地球 插画（浅蓝卡片） */
function PassportIllustration() {
  return (
    <svg width="150" height="150" viewBox="0 0 150 150" fill="none" className="anim-card" style={{ animationDelay: '0ms' }}>
      {/* 地球 */}
      <circle cx="75" cy="75" r="42" fill="#A7DCE4" opacity="0.35" />
      <g stroke="#1460A4" strokeWidth="1.4" opacity="0.5">
        <ellipse cx="75" cy="75" rx="42" ry="18" />
        <ellipse cx="75" cy="75" rx="18" ry="42" />
        <path d="M33 75h84M52 39c-6 10-6 26 0 36m46-36c6 10 6 26 0 36" />
      </g>
      {/* 护照 */}
      <g transform="rotate(-6 75 90)">
        <rect x="42" y="62" width="66" height="52" rx="8" fill="#FFFFFF" stroke="#1460A4" strokeWidth="2.4" />
        <rect x="42" y="62" width="66" height="16" rx="8" fill="#1460A4" />
        <circle cx="60" cy="88" r="9" fill="#E0F7FA" stroke="#1460A4" strokeWidth="1.6" />
        <circle cx="60" cy="88" r="3.5" fill="#39A2B8" />
        <rect x="76" y="81" width="20" height="3" rx="1.5" fill="#1460A4" opacity="0.5" />
        <rect x="76" y="89" width="16" height="3" rx="1.5" fill="#1460A4" opacity="0.3" />
        <rect x="76" y="97" width="18" height="3" rx="1.5" fill="#1460A4" opacity="0.4" />
      </g>
      {/* 飞机 */}
      <path d="M96 36l4-8 5 1-3 8 8 3-4 5-10-4-9 7-1-5 8-4z" fill="#39A2B8" />
    </svg>
  )
}

/** 手机+地图 插画（浅绿卡片） */
function MapIllustration() {
  return (
    <svg width="150" height="150" viewBox="0 0 150 150" fill="none" className="anim-card" style={{ animationDelay: '80ms' }}>
      {/* 地图 */}
      <g stroke="#4F9E28" strokeWidth="1.6" strokeLinecap="round" opacity="0.45">
        <path d="M28 96c8-14 18-16 28-6s20 8 30-6 22-8 30 2M28 96v20M86 84v22M56 108v10" />
        <circle cx="30" cy="92" r="2.5" fill="#4F9E28" />
        <circle cx="114" cy="80" r="2.5" fill="#4F9E28" />
      </g>
      {/* 手机 */}
      <g transform="rotate(8 75 70)">
        <rect x="52" y="34" width="46" height="84" rx="12" fill="#FFFFFF" stroke="#4F9E28" strokeWidth="2.4" />
        <rect x="60" y="44" width="30" height="46" rx="6" fill="#E8F5E9" />
        <circle cx="75" cy="58" r="6" fill="#4F9E28" />
        <path d="M64 70l4-3 4 3 3-5M86 70l-4-3-4 3-3-5" stroke="#4F9E28" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        <rect x="69" y="94" width="12" height="3.5" rx="1.75" fill="#4F9E28" opacity="0.5" />
      </g>
      {/* 定位 pin */}
      <circle cx="105" cy="118" r="7" fill="#4F9E28" />
      <circle cx="105" cy="118" r="2.8" fill="#fff" />
    </svg>
  )
}

export function HeroCards() {
  const { t } = useI18n()
  const navigate = useNavigate()

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* 签证申请助手 */}
      <div
        className="anim-card flex cursor-pointer items-center justify-between rounded-2xl bg-[#E0F7FA] p-8 transition-all duration-200 hover:-translate-y-1 hover:shadow-card-lg"
        style={{ animationDelay: '0ms' }}
        onClick={() => navigate('/assistant')}
      >
        <PassportIllustration />
        <div className="ml-6 flex-1 text-left">
          <h3 className="font-display text-xl font-bold text-ink">{t('home.heroAssistantTitle')}</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink/60">{t('home.heroAssistantDesc')}</p>
          <button className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2 text-sm font-semibold text-ink shadow-sm transition-colors duration-150 hover:bg-gray-50">
            {t('home.heroAssistantCta')}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* 签证百科 */}
      <div
        className="anim-card flex cursor-pointer items-center justify-between rounded-2xl bg-[#E8F5E9] p-8 transition-all duration-200 hover:-translate-y-1 hover:shadow-card-lg"
        style={{ animationDelay: '80ms' }}
        onClick={() => navigate('/encyclopedia')}
      >
        <MapIllustration />
        <div className="ml-6 flex-1 text-left">
          <h3 className="font-display text-xl font-bold text-ink">{t('home.heroEncyclopediaTitle')}</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink/60">{t('home.heroEncyclopediaDesc')}</p>
          <button className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2 text-sm font-semibold text-ink shadow-sm transition-colors duration-150 hover:bg-gray-50">
            {t('home.heroEncyclopediaCta')}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
