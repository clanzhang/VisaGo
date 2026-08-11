// pages/Documents.tsx — 资料生成（一次填写，生成全部文档 + PDF 导出）
import { useMemo, useRef, useState } from 'react'
import { useI18n } from '@/i18n'
import { VButton, VBadge } from '@/components/common'
import { useVisaStore } from '@/stores/visaStore'
import { templates } from '@/data/templates'
import { countries, PROVINCES, OCCUPATIONS } from '@/data/countries'
import { exportElementToPdf } from '@/utils/pdf'
import { addDaysISO, todayISO } from '@/utils/date'
import type { DocumentData, UserProfile } from '@/types'

const EMPTY_PROFILE: UserProfile = {
  name: '',
  passportNumber: '',
  nationality: '中国',
  birthDate: '',
  occupation: 'employed',
  homeProvince: '',
  passportIssuedIn: '',
}

export default function Documents() {
  const { t } = useI18n()
  const { savedProfile, saveProfile } = useVisaStore()
  const [profile, setProfile] = useState<UserProfile>(savedProfile ?? EMPTY_PROFILE)
  const [destination, setDestination] = useState('日本')
  const [startDate, setStartDate] = useState(todayISO())
  const [endDate, setEndDate] = useState(addDaysISO(todayISO(), 7))
  const [days] = useState(3)
  const [flightNumber, setFlightNumber] = useState('')
  const [hotel, setHotel] = useState('')
  const [selected, setSelected] = useState<string[]>(['itinerary', 'employment'])
  const [exporting, setExporting] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

  const travelDays = useMemo(() => {
    return Array.from({ length: days }, (_, i) => addDaysISO(startDate, i))
  }, [startDate, days])

  const docData: DocumentData = {
    profile,
    trip: { destination, startDate, endDate, flightNumber, hotel },
    days: travelDays.map((date, i) => ({
      date,
      city: i === 0 ? destination : `${destination} · 第${i + 1}天`,
      transport: i === 0 ? '✈️ 出发' : '🚄 市内交通',
      accommodation: hotel || '待定',
      activity: i % 2 === 0 ? '观光游览' : '自由活动',
    })),
  }

  function toggleTemplate(key: string) {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )
  }

  async function exportPdf() {
    if (!previewRef.current) return
    setExporting(true)
    try {
      await exportElementToPdf(previewRef.current, { filename: `visago-${destination}.pdf`, title: `${destination} 签证材料` })
    } finally {
      setExporting(false)
    }
  }

  const field = (label: string, value: string) => (
    <div className="flex justify-between gap-4 py-1.5">
      <span className="shrink-0 text-ink/45">{label}</span>
      <span className="text-right font-medium text-ink">{value || '—'}</span>
    </div>
  )

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">{t('documents.title')}</h1>
        <p className="mt-1 text-base font-medium text-subtle">{t('documents.subtitle')}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 左侧：填写表单 */}
        <div className="flex flex-col gap-6">
          <div className="anim-card rounded-2xl bg-white p-6 shadow-card">
            <h2 className="mb-5 text-lg font-bold text-ink">{t('documents.personalInfo')}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink/60">{t('documents.name')}</label>
                <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink/60">{t('documents.passportNumber')}</label>
                <input value={profile.passportNumber} onChange={(e) => setProfile({ ...profile, passportNumber: e.target.value })} className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink/60">{t('documents.nationality')}</label>
                <input value={profile.nationality} onChange={(e) => setProfile({ ...profile, nationality: e.target.value })} className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink/60">{t('documents.occupation')}</label>
                <select value={profile.occupation} onChange={(e) => setProfile({ ...profile, occupation: e.target.value as UserProfile['occupation'] })} className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40">
                  {OCCUPATIONS.map((o) => (
                    <option key={o.value} value={o.value}>{t(`documents.occupation${o.value.charAt(0).toUpperCase() + o.value.slice(1)}`)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink/60">{t('documents.birthDate')}</label>
                <input type="date" value={profile.birthDate} onChange={(e) => setProfile({ ...profile, birthDate: e.target.value })} className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink/60">{t('documents.homeProvince')}</label>
                <select value={profile.homeProvince} onChange={(e) => setProfile({ ...profile, homeProvince: e.target.value })} className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40">
                  <option value="">{t('common.select')}</option>
                  {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <VButton variant="secondary" className="mt-5" onClick={() => { saveProfile(profile); }}>
              💾 {t('documents.saveProfile')}
            </VButton>
          </div>

          <div className="anim-card rounded-2xl bg-white p-6 shadow-card" style={{ animationDelay: '60ms' }}>
            <h2 className="mb-5 text-lg font-bold text-ink">{t('documents.tripInfo')}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink/60">{t('documents.destination')}</label>
                <select value={destination} onChange={(e) => setDestination(e.target.value)} className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40">
                  {countries.map((c) => <option key={c.id} value={c.name.zh}>{c.flag} {c.name.zh}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink/60">{t('documents.flightNumber')}</label>
                <input value={flightNumber} onChange={(e) => setFlightNumber(e.target.value)} placeholder="CA123" className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink/60">{t('documents.startDate')}</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink/60">{t('documents.endDate')}</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-ink/60">{t('documents.hotel')}</label>
                <input value={hotel} onChange={(e) => setHotel(e.target.value)} placeholder="XX Hotel, Tokyo" className="w-full rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary/40" />
              </div>
            </div>
          </div>

          <div className="anim-card rounded-2xl bg-white p-6 shadow-card" style={{ animationDelay: '120ms' }}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">{t('documents.templates')}</h2>
              <VBadge tone="primary">{t('documents.selectTemplate')}</VBadge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {templates.map((tmpl) => {
                const active = selected.includes(tmpl.key)
                return (
                  <button
                    key={tmpl.key}
                    onClick={() => toggleTemplate(tmpl.key)}
                    className={`rounded-xl border-2 p-4 text-left transition-all duration-150 ${active ? 'border-primary bg-primary/5' : 'border-ink/5 hover:border-ink/15'}`}
                  >
                    <div className="mb-1.5 text-xl">📄</div>
                    <div className="text-sm font-semibold text-ink">{tmpl.name.zh}</div>
                    <div className="mt-0.5 text-xs text-ink/45">{tmpl.description.zh}</div>
                  </button>
                )
              })}
            </div>
            <VButton className="mt-5 w-full" size="lg" onClick={exportPdf} disabled={exporting || selected.length === 0}>
              {exporting ? t('documents.exporting') : `⬇️ ${t('documents.exportPdf')}`}
            </VButton>
          </div>
        </div>

        {/* 右侧：实时预览 */}
        <div className="anim-card sticky top-8 h-fit rounded-2xl bg-white p-6 shadow-card" style={{ animationDelay: '60ms' }}>
          <h2 className="mb-5 text-lg font-bold text-ink">{t('documents.preview')}</h2>
          <div ref={previewRef} className="rounded-xl border border-ink/10 bg-white p-6 text-[13px]">
            {/* 行程单 */}
            {selected.includes('itinerary') && (
              <section className="mb-6">
                <h3 className="mb-3 border-b border-ink/10 pb-2 text-base font-bold text-ink">📅 行程单 / Travel Itinerary</h3>
                <div className="rounded-lg bg-[#F9F9F6] p-3">{field(t('documents.destination'), docData.trip.destination)}{field(t('documents.startDate'), docData.trip.startDate)}{field(t('documents.endDate'), docData.trip.endDate)}{field(t('documents.flightNumber'), docData.trip.flightNumber)}</div>
                <table className="mt-3 w-full text-left">
                  <thead>
                    <tr className="text-xs text-ink/45">
                      <th className="py-1 pr-2">{t('documents.date')}</th>
                      <th className="py-1 pr-2">{t('documents.city')}</th>
                      <th className="py-1 pr-2">{t('documents.transport')}</th>
                      <th className="py-1 pr-2">{t('documents.accommodation')}</th>
                      <th className="py-1">{t('documents.activity')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docData.days.map((d, i) => (
                      <tr key={i} className="border-t border-ink/5">
                        <td className="py-1.5 pr-2">{d.date}</td>
                        <td className="py-1.5 pr-2">{d.city}</td>
                        <td className="py-1.5 pr-2">{d.transport}</td>
                        <td className="py-1.5 pr-2">{d.accommodation}</td>
                        <td className="py-1.5">{d.activity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}

            {/* 在职证明 */}
            {selected.includes('employment') && (
              <section className="mb-6">
                <h3 className="mb-3 border-b border-ink/10 pb-2 text-base font-bold text-ink">💼 在职证明 / Employment Certificate</h3>
                <div className="rounded-lg bg-[#F9F9F6] p-3">{field(t('documents.name'), docData.profile.name)}{field(t('documents.passportNumber'), docData.profile.passportNumber)}{field(t('documents.occupation'), t(`documents.occupation${docData.profile.occupation.charAt(0).toUpperCase() + docData.profile.occupation.slice(1)}`))}{field('准假日期', `${docData.trip.startDate} 至 ${docData.trip.endDate}`)}</div>
              </section>
            )}

            {/* 邀请函 */}
            {selected.includes('invitation') && (
              <section className="mb-6">
                <h3 className="mb-3 border-b border-ink/10 pb-2 text-base font-bold text-ink">✉️ 邀请函 / Invitation Letter</h3>
                <div className="rounded-lg bg-[#F9F9F6] p-3">{field('邀请人', '—')}{field('被邀请人', docData.profile.name)}{field('关系', '—')}{field(t('documents.destination'), docData.trip.destination)}</div>
              </section>
            )}

            {/* 个人陈述 */}
            {selected.includes('cover') && (
              <section className="mb-6">
                <h3 className="mb-3 border-b border-ink/10 pb-2 text-base font-bold text-ink">📝 个人陈述 / Cover Letter</h3>
                <div className="rounded-lg bg-[#F9F9F6] p-3">
                  <p className="leading-relaxed text-ink/70">
                    本人 {docData.profile.name}，护照号 {docData.profile.passportNumber}，计划于 {docData.trip.startDate} 至 {docData.trip.endDate} 前往 {docData.trip.destination} 旅游，行程已安排妥当，承诺按期回国。
                  </p>
                </div>
              </section>
            )}

            {/* 检查清单 */}
            {selected.includes('checklist') && (
              <section>
                <h3 className="mb-3 border-b border-ink/10 pb-2 text-base font-bold text-ink">☑️ 材料检查清单 / Checklist</h3>
                <div className="space-y-1.5">
                  {['有效护照', '照片 2 张', '签证申请表', '在职证明', '银行流水', '行程单'].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-ink/70">
                      <span className="flex h-4 w-4 items-center justify-center rounded border border-ink/20 text-[10px] text-transparent">✓</span>
                      {item}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
