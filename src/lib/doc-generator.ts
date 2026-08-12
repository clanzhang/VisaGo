// lib/doc-generator.ts — 自动生成签证材料
// 3 个生成函数：申请表（PDF）/ 在职证明（DOCX）/ 行程安排（Kimi → DOCX）
// 实际生成落地为 HTML/DOC 文本；Tauri 端可接 exporter::export_pdf / 模板渲染

import { kimiChat } from '@/api/kimi'
import type { UserProfile } from './user-profile'

export interface GeneratedDoc {
  filename: string
  content: string // HTML 或纯文本内容
  mime: 'application/pdf' | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' | 'text/plain'
}

/** 生成签证申请表内容（从护照 + 资料库预填） */
export async function generateApplicationForm(profile: UserProfile | null, country: string): Promise<GeneratedDoc> {
  const p = profile
  const name = p?.passport?.pinyinName || p?.id?.name || ''
  const passport = p?.passport?.passportNumber || ''
  const idNumber = p?.id?.idNumber || ''
  const address = p?.homeAddress || p?.id?.address || ''
  const phone = p?.phone || ''
  const email = p?.email || ''

  const content = `
<html><body style="font-family: sans-serif; padding: 32px; max-width: 720px; margin: auto;">
  <h2 style="text-align:center;">${country} 签证申请表</h2>
  <table style="width:100%; border-collapse: collapse; margin-top:24px; font-size:14px;">
    <tr><td style="padding:8px;border-bottom:1px solid #eee;width:140px;">姓名（拼音）</td><td style="padding:8px;border-bottom:1px solid #eee;">${name}</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #eee;">护照号</td><td style="padding:8px;border-bottom:1px solid #eee;">${passport}</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #eee;">身份证号</td><td style="padding:8px;border-bottom:1px solid #eee;">${idNumber}</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #eee;">联系电话</td><td style="padding:8px;border-bottom:1px solid #eee;">${phone}</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #eee;">电子邮箱</td><td style="padding:8px;border-bottom:1px solid #eee;">${email}</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #eee;">家庭住址</td><td style="padding:8px;border-bottom:1px solid #eee;">${address}</td></tr>
    <tr><td style="padding:8px;border-bottom:1px solid #eee;">申请国家</td><td style="padding:8px;border-bottom:1px solid #eee;">${country}</td></tr>
  </table>
  <p style="margin-top:24px; font-size:12px; color:#999;">本表由 VisaGo 自动预填生成，请核对后签名。</p>
</body></html>`
  return { filename: `签证申请表-${country}.pdf`, content, mime: 'application/pdf' }
}

/** 生成在职证明（从在职信息 + 行程日期套模板） */
export async function generateEmploymentCertificate(
  profile: UserProfile | null,
  tripDates: { start: string; end: string },
): Promise<GeneratedDoc> {
  const emp = profile?.employment
  const name = profile?.passport?.pinyinName || profile?.id?.name || '________'
  const company = emp?.company || '________'
  const position = emp?.position || '________'
  const salary = emp?.salary || '________'
  const companyAddress = emp?.companyAddress || '________'
  const companyPhone = emp?.companyPhone || '________'

  const content = `
<html><body style="font-family: serif; padding: 48px; max-width: 680px; margin: auto; line-height: 1.8;">
  <h3 style="text-align:center;">在 职 证 明</h3>
  <p style="text-align:right;">日期：${new Date().toLocaleDateString('zh-CN')}</p>
  <p>兹证明 <b>${name}</b> 为我司正式员工，现任 <b>${position}</b>，月薪 <b>${salary}</b> 元。</p>
  <p>该员工计划于 <b>${tripDates.start}</b> 至 <b>${tripDates.end}</b> 期间出国旅行，我司准予其休假，并保证其在旅行结束后按期回国返岗。</p>
  <p>特此证明。</p>
  <br/><br/>
  <p><b>${company}</b></p>
  <p>地址：${companyAddress}</p>
  <p>电话：${companyPhone}</p>
  <p style="margin-top:32px;">（公司盖章）</p>
</body></html>`
  return { filename: '在职证明.docx', content, mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
}

/** 生成行程安排（Kimi 生成） */
export async function generateItinerary(
  destination: string,
  dates: { start: string; end: string },
  preferences?: string,
): Promise<GeneratedDoc> {
  const prompt = `请为以下行程生成一份正式的英文+中文双语行程安排，适合签证申请使用。
目的地：${destination}
日期：${dates.start} 至 ${dates.end}
偏好：${preferences || '常规观光，节奏轻松'}
要求：按天列出（Day 1、Day 2…），每天含日期、城市、主要活动、住宿建议。不要使用占位符。`
  const text = await kimiChat([{ role: 'user', content: prompt }])
  const html = `<html><body style="font-family: sans-serif; padding: 32px; line-height:1.8;"><h2>${destination} 行程安排</h2><pre style="white-space:pre-wrap;font-size:14px;">${text}</pre></body></html>`
  return { filename: `行程安排-${destination}.docx`, content: html, mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
}
