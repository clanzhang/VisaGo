// hooks/useAIAssistant.ts — 本地知识库 AI 问答引擎（保留 Kimi 逻辑）
// 基于国家签证数据回答常见问题，模拟流式输出
import { useCallback, useRef, useState } from 'react'
import { countries, DIFFICULTY_LABELS } from '@/data/countries'
import { getVisaExtra } from '@/data/encyclopedia-extra'
import type { Country } from '@/types'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

/** 根据问题和国家数据检索答案（纯函数，保留自旧版） */
export function generateAnswer(question: string, country?: Country): string {
  const c = country
  const q = question.toLowerCase()

  if (!c) {
    const list = countries.map((x) => `${x.flag} ${x.name.zh}`).join('、')
    return `我目前支持以下国家的签证查询：${list}。你可以选择具体国家问我关于材料、费用、周期等问题。`
  }

  const visaType = c.visaTypes[0]
  const extra = visaType ? getVisaExtra(c.id, visaType.id) : undefined
  const diff = DIFFICULTY_LABELS[c.difficulty]

  // 材料
  if (/材料|材料清单|需要什么|准备|资料/.test(q)) {
    const list = visaType.requirements
      .slice(0, 6)
      .map((r, i) => `${i + 1}. ${r.name.zh}`)
      .join('\n')
    return `申请${c.name.zh}${visaType?.name.zh ?? ''}签证，核心材料包括：\n${list}\n\n如需完整材料清单，请在「材料要求」标签页按你的职业身份查看。`
  }

  // 费用
  if (/费用|多少钱|价格|花费/.test(q)) {
    const f = extra?.fees
    const total = f ? f.visaFee + f.serviceFee + f.courierFee + f.photoFee : 0
    return `${c.name.zh}${visaType?.name.zh ?? ''}签证费用参考：\n- 使馆签证费：¥${f?.visaFee ?? visaType?.fee.amount ?? 0}\n- 代办服务费：¥${f?.serviceFee ?? 0}\n- 快递费：¥${f?.courierFee ?? 0}\n- 照片费：¥${f?.photoFee ?? 0}\n- 合计约：¥${total}\n\n以上为参考值，实际以使馆/代办机构为准。`
  }

  // 周期/时间
  if (/多久|周期|时间|几天|工作日|出签/.test(q)) {
    return `${c.name.zh}${visaType?.name.zh ?? ''}签证办理周期约 ${visaType?.processingDays.min ?? 0}-${visaType?.processingDays.max ?? 0} 个工作日。\n流程：材料准备(3-7天) → 受理(1-2天) → 审核 → 出签。`
  }

  // 拒签
  if (/拒签|被拒|拒签原因/.test(q)) {
    const reasons = visaType?.rejectionReasons.map((r) => `• ${r.zh}`).join('\n')
    return `${c.name.zh}签证常见拒签原因：\n${reasons}\n\n应对建议：确保材料真实、资金充足、行程合理，强化归国约束力。`
  }

  // 免签
  if (/免签|落地签|电子签/.test(q)) {
    return `关于${c.name.zh}：\n${c.visaFree.zh}\n\n${visaType?.canApplyOnline ? '✅ 支持电子签/在线申请' : '❌ 暂不支持电子签，需线下办理'}`
  }

  // 面试/个人递签
  if (/面试|面签/.test(q)) {
    return visaType?.needInterview
      ? `${c.name.zh}${visaType.name.zh}需要面试（面签）。请提前准备面试材料并如实回答。`
      : `${c.name.zh}${visaType?.name.zh ?? ''}一般无需面试，材料齐全即可。`
  }
  if (/个人递签|自己去/.test(q)) {
    return visaType?.acceptPersonal
      ? `${c.name.zh}接受个人直接递签。`
      : `${c.name.zh}需通过指定代办机构递交，不接受个人递签。`
  }

  // 难度
  if (/难度|容易|难/.test(q)) {
    return `${c.name.zh}签证难度评级为「${diff.zh}」。\n${c.overview.zh}`
  }

  // 默认
  return `关于${c.name.zh}签证，我可以帮你查询：\n1. 所需材料（材料标签页可按职业身份查看）\n2. 费用明细（费用标签页）\n3. 办理周期（概览标签页）\n4. 常见拒签原因\n5. 免签/落地签政策\n\n你可以直接问我，如"需要什么材料"、"多少钱"、"多久能出签"。`
}

/** React 版流式输出 Hook */
export function useStreamingReply() {
  const [text, setText] = useState('')
  const [thinking, setThinking] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const stop = useCallback(() => {
    if (timer.current) {
      clearInterval(timer.current)
      timer.current = null
    }
  }, [])

  const streamAnswer = useCallback(
    (full: string, onDone?: () => void) => {
      stop()
      setText('')
      setThinking(true)
      const chars = full.split('')
      let i = 0
      timer.current = setInterval(() => {
        i += 2 // 每帧 2 字符，接近打字机
        setText(chars.slice(0, i).join(''))
        if (i >= chars.length) {
          stop()
          setThinking(false)
          onDone?.()
        }
      }, 20)
    },
    [stop],
  )

  return { text, thinking, streamAnswer, stop }
}
