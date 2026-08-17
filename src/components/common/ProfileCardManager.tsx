// components/common/ProfileCardManager.tsx — 资料卡管理区块（列表 + 新建 + 详情弹窗）
// 受控组件：父组件持有 cards / activeCardId，通过事件回调同步变更
import { useState } from 'react'
import { VButton } from './VButton'
import { CARD_FIELD_SPECS, ProfileCardDetailModal } from './ProfileCardDetailModal'
import { useAppStore } from '@/stores/appStore'
import { useI18n } from '@/i18n'
import { useModalA11y } from '@/hooks/useModalA11y'
import { createProfile, deleteProfile, setActiveProfileId, type ProfileCard } from '@/api/tauri'

interface Props {
  /** 资料卡列表（父组件状态） */
  cards: ProfileCard[]
  /** 当前活跃卡 id */
  activeCardId: string | null
  /** 列表变更（新建/删除）回调 */
  onCardsChange: (cards: ProfileCard[]) => void
  /** 活跃卡变更回调 */
  onActiveCardChange: (id: string | null) => void
  /** 点击「去补充」：由父组件切换活跃卡并跳转扫描第一步 */
  onSupplement: (card: ProfileCard) => void
  /** 是否禁用（非 Tauri 环境） */
  disabled?: boolean
  /** 折叠为一行（Scan 第 2 步时收起，避免与文件识别任务抢注意力）；用户可展开 */
  collapsed?: boolean
}

export function ProfileCardManager({
  cards,
  activeCardId,
  onCardsChange,
  onActiveCardChange,
  onSupplement,
  disabled,
  collapsed = false,
}: Props) {
  const { toast } = useAppStore()
  const { t } = useI18n()
  const [showNameDialog, setShowNameDialog] = useState(false)
  // collapsed 时用户可展开查看
  const [forceOpen, setForceOpen] = useState(false)
  const open = !collapsed || forceOpen
  const [newCardName, setNewCardName] = useState('')
  const [detailCard, setDetailCard] = useState<ProfileCard | null>(null)
  const nameDialogRef = useModalA11y(showNameDialog, () => setShowNameDialog(false))

  // 新建资料卡
  async function handleCreateProfile() {
    if (disabled) {
      toast(t('scan.tauriOnly'), 'warning')
      return
    }
    try {
      const card = await createProfile(newCardName.trim() || '')
      onCardsChange([...cards, card])
      onActiveCardChange(card.id)
      await setActiveProfileId(card.id)
      setShowNameDialog(false)
      setNewCardName('')
      toast(t('profile.created', { name: card.name }), 'success')
    } catch (e) {
      toast(e instanceof Error ? e.message : t('profile.createFailed'), 'error')
    }
  }

  // 删除资料卡
  async function handleDeleteCard(card: ProfileCard) {
    if (!window.confirm(t('profile.deleteConfirm', { name: card.name }))) return
    try {
      await deleteProfile(card.id)
      onCardsChange(cards.filter((c) => c.id !== card.id))
      if (activeCardId === card.id) {
        onActiveCardChange(null)
        await setActiveProfileId(null)
      }
      toast(t('profile.deleted'), 'success')
    } catch (e) {
      toast(e instanceof Error ? e.message : t('profile.deleteFailed'), 'error')
    }
  }

  const completedTotal = cards.reduce((total, card) => {
    const fields = (card.fields ?? {}) as Record<string, unknown>
    return total + CARD_FIELD_SPECS.filter((field) => String(fields[field.key] ?? '').trim()).length
  }, 0)

  return (
    <>
      {/* 资料卡列表（多用户资料） */}
      <div className="overflow-hidden rounded-2xl border border-ink/5 bg-white shadow-card">
        <div className="flex flex-col gap-3 border-b border-ink/5 bg-[#FBFCFD] px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <span className="h-5 w-5 icon-[mdi-light--credit-card]" />
              </span>
              <h2 className="text-base font-bold text-ink">{t('profile.title')}</h2>
            </div>
            {!collapsed && <p className="mt-1 text-xs text-ink/60">{t('profile.subtitle')}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden rounded-full border border-ink/8 bg-white px-3 py-1.5 text-xs text-ink/60 sm:block">
              {t('profile.count', { count: cards.length, filled: completedTotal })}
            </div>
            <VButton size="sm" onClick={() => setShowNameDialog(true)}>
              <span className="h-4 w-4 icon-[mdi-light--plus]" />
              {t('profile.newCard')}
            </VButton>
            {collapsed && (
              <button
                type="button"
                onClick={() => setForceOpen((v) => !v)}
                aria-expanded={open}
                aria-label={open ? t('assistant.collapse') : t('assistant.expand')}
                className="flex h-7 w-7 items-center justify-center rounded-md text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <span className={`h-4 w-4 transition-transform ${open ? '' : 'rotate-180'} icon-[mdi-light--chevron-down]`} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {open && (cards.length === 0 ? (
          <div className="m-5 rounded-xl border border-dashed border-ink/15 bg-[#F8FAFC] px-4 py-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="h-7 w-7 icon-[mdi-light--account]" />
            </div>
            <div className="mt-3 text-sm font-semibold text-ink">{t('profile.emptyTitle')}</div>
            <div className="mt-1 text-xs text-ink/60">{t('profile.emptyDesc')}</div>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto px-5 py-3">
            {cards.map((card) => {
              const isActive = card.id === activeCardId
              const fields = (card.fields ?? {}) as Record<string, unknown>
              const name = (card.fields?.['name'] as string) || card.name || t('profile.unnamed')
              const passport = String(fields['passport_number'] ?? fields['passportNumber'] ?? '')
              const tail = passport.length >= 4 ? passport.slice(-4) : passport
              const filled = CARD_FIELD_SPECS.filter((field) => String(fields[field.key] ?? '').trim()).length
              const progress = Math.round((filled / CARD_FIELD_SPECS.length) * 100)
              const updated = card.updated_at ? new Date(card.updated_at).toLocaleString().slice(0, 16) : t('profile.noUpdatedAt')
              return (
                <div
                  key={card.id}
                  onClick={() => setDetailCard(card)}
                  className={`group relative w-48 shrink-0 cursor-pointer overflow-hidden rounded-xl border bg-white p-3 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card ${
                    isActive
                      ? 'border-primary/45 ring-2 ring-primary/10'
                      : 'border-ink/8 hover:border-primary/25'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E9F8FA] text-base font-bold text-primary">
                      {(name || '?').slice(0, 1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <div className="truncate text-sm font-bold text-ink">{name}</div>
                        {isActive && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-primary" title={t('profile.active')} />
                        )}
                      </div>
                      <div className="mt-0.5 truncate text-[11px] text-ink/60">
                        {tail ? t('profile.passportTail', { tail }) : t('profile.passportMissing')}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteCard(card)
                      }}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-ink/60 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                      title={t('profile.deleteCard')}
                      aria-label={t('profile.deleteCard')}
                    >
                      <span className="h-3.5 w-3.5 icon-[mdi-light--delete]" />
                    </button>
                  </div>

                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-[10px] text-ink/60">
                      <span>{isActive ? t('profile.active') : t('profile.progress', { progress })}</span>
                      <span>{t('profile.fillStatus', { filled, total: CARD_FIELD_SPECS.length })}</span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-ink/8">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-ink/60">
                    <span className="truncate">{updated}</span>
                    <span className="flex shrink-0 items-center gap-0.5 font-medium text-primary">
                      {t('profile.details')}
                      <span className="h-3 w-3 icon-[mdi-light--arrow-right]" />
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* 新建资料卡命名弹窗 */}
      {showNameDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" onClick={() => setShowNameDialog(false)}>
          <div
            ref={nameDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-name-dialog-title"
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="profile-name-dialog-title" className="text-base font-bold text-ink">{t('profile.nameDialogTitle')}</h3>
            <p className="mt-1 text-xs text-ink/60">{t('profile.nameDialogDesc')}</p>
            <input
              autoFocus
              value={newCardName}
              onChange={(e) => setNewCardName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateProfile()}
              placeholder={t('profile.namePlaceholder')}
              className="mt-4 w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-ink/60 focus:border-primary/40"
            />
            <div className="mt-4 flex justify-end gap-2">
              <VButton variant="secondary" size="sm" onClick={() => setShowNameDialog(false)}>{t('profile.cancel')}</VButton>
              <VButton size="sm" onClick={handleCreateProfile} disabled={!newCardName.trim()}>{t('profile.create')}</VButton>
            </div>
          </div>
        </div>
      )}

      {/* 资料卡详情弹窗 */}
      <ProfileCardDetailModal
        card={detailCard}
        onClose={() => setDetailCard(null)}
        onSupplement={() => {
          if (detailCard) onSupplement(detailCard)
        }}
      />
    </>
  )
}
