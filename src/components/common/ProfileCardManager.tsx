// components/common/ProfileCardManager.tsx — 资料卡管理区块（列表 + 新建 + 详情弹窗）
// 受控组件：父组件持有 cards / activeCardId，通过事件回调同步变更
import { useState } from 'react'
import { VButton } from './VButton'
import { CARD_FIELD_SPECS, ProfileCardDetailModal } from './ProfileCardDetailModal'
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

  const completedTotal = cards.reduce((total, card) => {
    const fields = (card.fields ?? {}) as Record<string, unknown>
    return total + CARD_FIELD_SPECS.filter((field) => String(fields[field.key] ?? '').trim()).length
  }, 0)

  return (
    <>
      {/* 资料卡列表（多用户资料） */}
      <div className="overflow-hidden rounded-2xl border border-ink/5 bg-white shadow-card">
        <div className="flex flex-col gap-4 border-b border-ink/5 bg-[#FBFCFD] px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <span className="h-5 w-5 icon-[mdi-light--credit-card]" />
              </span>
              <h2 className="text-base font-bold text-ink">资料卡</h2>
            </div>
            <p className="mt-1 text-xs text-ink/45">为自己、家人或同行人保存一份独立资料，扫描时可直接切换使用。</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden rounded-full border border-ink/8 bg-white px-3 py-1.5 text-xs text-ink/55 sm:block">
              {cards.length} 张卡 · 已填 {completedTotal} 项
            </div>
            <VButton size="sm" onClick={() => setShowNameDialog(true)}>
              <span className="h-4 w-4 icon-[mdi-light--plus]" />
              新建资料卡
            </VButton>
          </div>
        </div>

        {cards.length === 0 ? (
          <div className="m-5 rounded-xl border border-dashed border-ink/15 bg-[#F8FAFC] px-4 py-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="h-7 w-7 icon-[mdi-light--account]" />
            </div>
            <div className="mt-3 text-sm font-semibold text-ink">还没有资料卡</div>
            <div className="mt-1 text-xs text-ink/45">扫描识别后保存，或点击右上角新建一张资料卡。</div>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto px-5 py-4">
            {cards.map((card) => {
              const isActive = card.id === activeCardId
              const fields = (card.fields ?? {}) as Record<string, unknown>
              const name = (card.fields?.['name'] as string) || card.name || '未命名'
              const passport = String(fields['passport_number'] ?? fields['passportNumber'] ?? '')
              const tail = passport.length >= 4 ? passport.slice(-4) : passport
              const nationality = String(fields['nationality'] ?? '待补充')
              const phone = String(fields['phone'] ?? '待补充')
              const filled = CARD_FIELD_SPECS.filter((field) => String(fields[field.key] ?? '').trim()).length
              const progress = Math.round((filled / CARD_FIELD_SPECS.length) * 100)
              const updated = card.updated_at ? new Date(card.updated_at).toLocaleString().slice(0, 16) : '暂无更新时间'
              return (
                <div
                  key={card.id}
                  onClick={() => setDetailCard(card)}
                  className={`group relative w-72 shrink-0 cursor-pointer overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-lg ${
                    isActive
                      ? 'border-primary/45 ring-2 ring-primary/10'
                      : 'border-ink/8 hover:border-primary/25'
                  }`}
                >
                  <div className="h-20 bg-[linear-gradient(135deg,#1460A4_0%,#39A2B8_48%,#BEEAF2_100%)]">
                    <div className="flex justify-end p-3">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        isActive ? 'bg-white text-primary shadow-sm' : 'bg-white/75 text-ink/55'
                      }`}>
                        {isActive ? '当前使用' : `${progress}% 完成`}
                      </span>
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    <div className="-mt-8 flex items-end justify-between gap-3">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-white bg-[#E9F8FA] text-xl font-bold text-primary shadow-sm">
                        {(name || '?').slice(0, 1)}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteCard(card)
                        }}
                        className="mb-1 flex h-8 w-8 items-center justify-center rounded-full border border-ink/8 bg-white text-ink/30 opacity-0 shadow-sm transition-opacity hover:border-red-200 hover:text-red-500 group-hover:opacity-100"
                        title="删除资料卡"
                        aria-label="删除资料卡"
                      >
                        <span className="h-4 w-4 icon-[mdi-light--delete]" />
                      </button>
                    </div>

                    <div className="mt-3">
                      <div className="truncate text-lg font-bold leading-tight text-ink">{name}</div>
                      <div className="mt-1 text-xs text-ink/45">{tail ? `护照尾号 ${tail}` : '护照号待补充'}</div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl bg-[#F5F7FA] px-3 py-2">
                        <div className="text-ink/40">国籍</div>
                        <div className="truncate font-semibold text-ink">{nationality}</div>
                      </div>
                      <div className="rounded-xl bg-[#F5F7FA] px-3 py-2">
                        <div className="text-ink/40">手机号</div>
                        <div className="truncate font-semibold text-ink">{phone}</div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="mb-1.5 flex items-center justify-between text-[11px] text-ink/45">
                        <span>资料完整度</span>
                        <span>{filled}/{CARD_FIELD_SPECS.length}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-ink/8">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-ink/40">
                      <span className="truncate">{updated}</span>
                      <span className="flex items-center gap-1 font-medium text-primary">
                        查看详情
                        <span className="h-3.5 w-3.5 icon-[mdi-light--arrow-right]" />
                      </span>
                    </div>
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
