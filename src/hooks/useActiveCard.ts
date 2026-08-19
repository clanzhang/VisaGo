// hooks/useActiveCard.ts — 当前活跃资料卡（个人资料弹窗数据源）
// 读取：getActiveProfileId + listProfiles → 活跃卡；监听 visago:profile-updated 自动刷新。
// 与 useUserIdentity 同源但返回完整卡对象（供 ProfileCardDetailModal 展示）。
import { useCallback, useEffect, useState } from 'react'
import { isTauri, listProfiles, getActiveProfileId, type ProfileCard } from '@/api/tauri'

export function useActiveCard() {
  const [card, setCard] = useState<ProfileCard | null>(null)
  const [loaded, setLoaded] = useState(false)

  const refresh = useCallback(async () => {
    if (!isTauri()) {
      setCard(null)
      setLoaded(true)
      return
    }
    try {
      const id = await getActiveProfileId()
      const cards = await listProfiles()
      const active = cards.find((c) => c.id === id) ?? null
      setCard(active)
    } catch {
      setCard(null)
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => {
    void refresh()
    // 资料卡保存/切换/删除后刷新（Scan 页 dispatch 的既有事件）
    window.addEventListener('visago:profile-updated', refresh)
    return () => window.removeEventListener('visago:profile-updated', refresh)
  }, [refresh])

  return { card, loaded, refresh }
}
