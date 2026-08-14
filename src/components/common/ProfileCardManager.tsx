// components/common/ProfileCardManager.tsx — 资料卡管理区块（列表 + 新建 + 详情弹窗）
// 受控组件：父组件持有 cards / activeCardId，通过事件回调同步变更
import { useState } from 'react'
import { VButton } from './VButton'
import { ProfileCardDetailModal } from './ProfileCardDetailModal'
import { useAppStore } from '@/stores/appStore'
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
}

export function ProfileCardManager({
  cards,
  activeCardId,
  onCardsChange,
  onActiveCardChange,
  onSupplement,
  disabled,
}: Props) {
  const { toast } = useAppStore()
  const [showNameDialog, setShowNameDialog] = useState(false)
  const [newCardName, setNewCardName] = useState('')
  const [detailCard, setDetailCard] = useState<ProfileCard | null>(null)

  // 新建资料卡
  async function handleCreateProfile() {
    if (disabled) {
      toast('请使用 Tauri 桌面端管理资料卡', 'warning')
      return
    }
    try {
      const card = await createProfile(newCardName.trim() || '')
      onCardsChange([...cards, card])
      onActiveCardChange(card.id)
      await setActiveProfileId(card.id)
      setShowNameDialog(false)
      setNewCardName('')
      toast(`已创建「${card.name}」`, 'success')
    } catch (e) {
      toast(e instanceof Error ? e.message : '创建失败', 'error')
    }
  }

  // 删除资料卡
  async function handleDeleteCard(card: ProfileCard) {
    if (!window.confirm(`确定删除「${card.name}」？此操作不可恢复。`)) return
    try {
      await deleteProfile(card.id)
      onCardsChange(cards.filter((c) => c.id !== card.id))
      if (activeCardId === card.id) {
        onActiveCardChange(null)
        await setActiveProfileId(null)
      }
      toast('资料卡已删除', 'success')
    } catch (e) {
      toast(e instanceof Error ? e.message : '删除失败', 'error')
    }
  }

  return (
    <>
      {/* 资料卡列表（多用户资料） */}
      <div className="rounded-2xl bg-white p-5 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-ink">👤 资料卡</h2>
            <p className="text-xs text-ink/45">每次扫描保存为一张资料卡，切换即可使用不同人（如自己 / 家人）的资料</p>
          </div>
          <VButton size="sm" onClick={() => setShowNameDialog(true)}>
            ＋ 新建资料卡
          </VButton>
        </div>

        {cards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink/15 bg-[#F9F9F6] px-4 py-5 text-center text-xs text-ink/45">
            还没有资料卡。扫描识别后保存，或点击右上角「＋ 新建资料卡」。
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {cards.map((card) => {
              const isActive = card.id === activeCardId
              const name = (card.fields?.['name'] as string) || card.name || '未命名'
              const passport = String(card.fields?.['passport_number'] ?? card.fields?.['passportNumber'] ?? '')
              const tail = passport.length >= 4 ? passport.slice(-4) : passport
              return (
                <div
                  key={card.id}
                  onClick={() => setDetailCard(card)}
                  className={`group relative w-44 shrink-0 cursor-pointer rounded-xl border p-3 transition-all duration-150 ${
                    isActive
                      ? 'border-[#1460A4] bg-[#E0F7FA]/60 shadow-sm'
                      : 'border-ink/8 bg-white hover:border-[#1460A4]/40 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#39A2B8] to-[#1460A4] text-xs font-semibold text-white">
                      {(name || '?').slice(0, 1)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold text-ink">{name}</div>
                      <div className="text-[11px] text-ink/45">{tail ? `护照 ···${tail}` : '未填护照号'}</div>
                    </div>
                    {isActive && (
                      <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-[#1460A4]" title="当前活跃" />
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-ink/40">
                    <span>{card.updated_at ? new Date(card.updated_at).toLocaleString().slice(0, 16) : ''}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteCard(card)
                      }}
                      className="rounded px-1 text-ink/30 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                      title="删除资料卡"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 新建资料卡命名弹窗 */}
      {showNameDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" onClick={() => setShowNameDialog(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-ink">新建资料卡</h3>
            <p className="mt-1 text-xs text-ink/50">给这张资料卡起个名字，例如「我的资料」「老婆的资料」「爸妈的资料」</p>
            <input
              autoFocus
              value={newCardName}
              onChange={(e) => setNewCardName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateProfile()}
              placeholder="如：我的资料"
              className="mt-4 w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40"
            />
            <div className="mt-4 flex justify-end gap-2">
              <VButton variant="secondary" size="sm" onClick={() => setShowNameDialog(false)}>取消</VButton>
              <VButton size="sm" onClick={handleCreateProfile} disabled={!newCardName.trim()}>创建</VButton>
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
