// hooks/useAIData.ts — AI 数据获取与缓存层
// 策略：首次拉 Kimi → 缓存 localStorage（7 天）→ 到期后台静默刷新 → 失败用静态数据兜底
import { useCallback, useEffect, useRef, useState } from 'react'
import { kimiJson, KimiError } from '@/api/kimi'
import { HOME_DATA_PROMPT, VISA_DATA_PROMPT } from '@/api/prompts'
import { destinations as fallbackDestinations } from '@/data/mock'

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 天

interface CacheEntry<T> {
  data: T
  updatedAt: number
}

function readCache<T>(key: string): CacheEntry<T> | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as CacheEntry<T>
  } catch {
    return null
  }
}

function writeCache<T>(key: string, data: T) {
  try {
    const entry: CacheEntry<T> = { data, updatedAt: Date.now() }
    localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    /* ignore quota errors */
  }
}

function isExpired(entry: CacheEntry<unknown> | null): boolean {
  if (!entry) return true
  return Date.now() - entry.updatedAt > CACHE_TTL_MS
}

export interface HomeAIData {
  destinations: typeof fallbackDestinations
  hero: {
    assistantTitle: string
    assistantDesc: string
    encyclopediaTitle: string
    encyclopediaDesc: string
  }
}

/** AI 数据错误分类（供 UI 区分「Key 问题→引导去设置」与「临时故障→引导重试」） */
export type AIErrorKind = 'invalid_key' | 'rate_limited' | 'shape' | 'network'

export interface AIFetchError {
  kind: AIErrorKind
  message: string
}

function classifyAIError(e: unknown): AIFetchError {
  if (e instanceof KimiError) {
    // 形状/解析类错误属程序 bug，绝不伪装成「服务不可用」：控制台留可定位报错
    if (e.kind === 'shape') {
      console.error('[useAIData] IPC 返回形状异常（程序 bug，非服务故障）:', e.message, e)
    }
    return {
      kind: e.kind ?? 'network',
      message: e.message,
    }
  }
  return { kind: 'network', message: e instanceof Error ? e.message : String(e) }
}

/** 首页 AI 数据（目的地 + 统计 + Hero 文案） */
export function useHomeAIData() {
  const [data, setData] = useState<HomeAIData>(() => {
    const cached = readCache<HomeAIData>('visago:ai:home')
    if (cached) return cached.data
    return fallbackData()
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AIFetchError | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const fetching = useRef(false)

  const fetchFromAI = useCallback(async (force: boolean) => {
    if (fetching.current) return
    fetching.current = true
    if (force) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const result = await kimiJson<HomeAIData>(HOME_DATA_PROMPT, '请整理上述 6 个国家的签证概览数据。', {
        temperature: 0.2,
        maxTokens: 6000,
      })
      // 目的地卡片费用以官方数据为准（id 对应），避免 AI 生成过时金额
      const aiDests = result.destinations?.length ? result.destinations : fallbackDestinations
      const dests = aiDests.map((d) => {
        const official = fallbackDestinations.find((o) => o.id === d.id)
        return official ? { ...d, fee: official.fee } : d
      })
      const merged: HomeAIData = {
        destinations: dests,
        hero: {
          assistantTitle: result.hero?.assistantTitle || '',
          assistantDesc: result.hero?.assistantDesc || '',
          encyclopediaTitle: result.hero?.encyclopediaTitle || '',
          encyclopediaDesc: result.hero?.encyclopediaDesc || '',
        },
      }
      writeCache('visago:ai:home', merged)
      setData(merged)
    } catch (e) {
      const err = classifyAIError(e)
      setError(err)
      // 失败时用兜底数据
      if (force) setData(fallbackData())
    } finally {
      fetching.current = false
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // 首次加载：先读缓存，过期则后台静默刷新
  useEffect(() => {
    const cached = readCache<HomeAIData>('visago:ai:home')
    if (!isExpired(cached)) {
      // 有有效缓存直接用；同时后台刷新
      fetchFromAI(false).catch(() => {})
    } else {
      fetchFromAI(false).catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { data, loading, error, refreshing, refresh: () => fetchFromAI(true) }
}

function fallbackData(): HomeAIData {
  return {
    destinations: fallbackDestinations,
    hero: {
      assistantTitle: '',
      assistantDesc: '',
      encyclopediaTitle: '',
      encyclopediaDesc: '',
    },
  }
}

/** 国家详情 AI 数据（签证类型、材料、领区、FAQ） */
export function useCountryAIData(countryId: string | undefined) {
  const [data, setData] = useState<unknown | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AIFetchError | null>(null)

  const fetchFromAI = useCallback(async (force: boolean) => {
    if (!countryId) return
    const key = `visago:ai:country:${countryId}`
    if (!force) {
      const cached = readCache<unknown>(key)
      if (cached && !isExpired(cached)) {
        setData(cached.data)
        return
      }
    }
    setLoading(true)
    setError(null)
    try {
      const result = await kimiJson<unknown>(
        VISA_DATA_PROMPT,
        `请整理 ${countryId} 的完整签证信息，输出 JSON。`,
        { temperature: 0.2, maxTokens: 12000 },
      )
      writeCache(key, result)
      setData(result)
    } catch (e) {
      setError(classifyAIError(e))
    } finally {
      setLoading(false)
    }
  }, [countryId])

  useEffect(() => {
    if (countryId) {
      setData(null)
      fetchFromAI(false).catch(() => {})
    }
  }, [countryId, fetchFromAI])

  return { data, loading, error, refresh: () => fetchFromAI(true) }
}
