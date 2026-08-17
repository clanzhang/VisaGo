// hooks/useUserIdentity.ts — 用户身份（真实来源，不编造）
// 优先级：Tauri 活跃资料卡 name → visago:user-profile（扫描保存）→ visago:profile（旧版保存）
import { useEffect, useState } from 'react'
import { isTauri, listProfiles, getActiveProfileId } from '@/api/tauri'
import { loadUserProfile } from '@/lib/user-profile'

export interface UserIdentity {
  /** 真实姓名（任一来源）；为空表示未设置 */
  name: string
  /** 活跃资料卡的自定义名称（如「我的资料」） */
  cardName: string
}

export function useUserIdentity(): UserIdentity {
  const [name, setName] = useState('')
  const [cardName, setCardName] = useState('')

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
              if (cardFields['name']) {
                if (!cancelled) {
                  setName(String(cardFields['name']))
                  setCardName(card.name)
                }
                return
              }
              if (!cancelled) setCardName(card.name)
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

  return { name, cardName }
}
