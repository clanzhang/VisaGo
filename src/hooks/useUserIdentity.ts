// hooks/useUserIdentity.ts — 用户身份（真实来源，不编造）
// 优先级：Tauri 活跃资料卡 name → visago:user-profile（扫描保存）→ visago:profile（旧版保存）
import { useEffect, useState } from 'react'
import { isTauri, listProfiles, getActiveProfileId } from '@/api/tauri'
import { loadUserProfile } from '@/lib/user-profile'
import { CARD_FIELD_SPECS } from '@/components/common/ProfileCardDetailModal'

export interface UserIdentity {
  /** 真实姓名（任一来源）；为空表示未设置 */
  name: string
  /** 活跃资料卡的自定义名称（如「我的资料」）；为内部 ID（profile_XXX）时返回空 */
  cardName: string
  /** 活跃资料卡已填写的字段数（用于「已保存 N 项资料」展示） */
  filledCount: number
}

/** 内部资料卡 ID（如 profile_001 或「资料卡 profile_001」）不应直接暴露给用户 */
function isInternalCardName(raw: string): boolean {
  return /^(?:资料卡\s*)?profile_\d+$/i.test(raw.trim())
}

function countFilledFields(fields: Record<string, unknown>): number {
  return CARD_FIELD_SPECS.filter((f) => String(fields[f.key] ?? '').trim()).length
}

export function useUserIdentity(): UserIdentity {
  const [name, setName] = useState('')
  const [cardName, setCardName] = useState('')
  const [filledCount, setFilledCount] = useState(0)

  useEffect(() => {
    let cancelled = false

    const read = async () => {
      try {
        // 1) Tauri 活跃资料卡
        if (isTauri()) {
          try {
            const id = await getActiveProfileId()
            const cards = await listProfiles()
            const card = cards.find((c) => c.id === id)
            if (card) {
              const cardFields = (card.fields ?? {}) as Record<string, unknown>
              const rawName = card.name ?? ''
              const publicName = isInternalCardName(rawName) ? '' : rawName
              if (cardFields['name']) {
                if (!cancelled) {
                  setName(String(cardFields['name']))
                  setCardName(publicName)
                  setFilledCount(countFilledFields(cardFields))
                }
                return
              }
              if (!cancelled) {
                setCardName(publicName)
                setFilledCount(countFilledFields(cardFields))
              }
            }
          } catch {
            /* Tauri 不可用则继续走本地来源 */
          }
        }
        // 2) 扫描保存的资料库（visago:user-profile）
        const local = loadUserProfile()
        const localName = local?.id?.name?.trim() || local?.passport?.pinyinName?.trim() || ''
        if (localName) {
          if (!cancelled) setName(localName)
          return
        }
        // 3) 旧版保存的资料（visago:profile）
        const legacy = JSON.parse(localStorage.getItem('visago:profile') || 'null') as { name?: string } | null
        if (legacy?.name?.trim() && !cancelled) setName(legacy.name.trim())
      } catch {
        /* 保持匿名 */
      }
    }

    void read()
    // 资料卡保存后刷新
    window.addEventListener('visago:profile-updated', read)
    return () => {
      cancelled = true
      window.removeEventListener('visago:profile-updated', read)
    }
  }, [])

  return { name, cardName, filledCount }
}
