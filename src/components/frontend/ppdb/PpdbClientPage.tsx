'use client'

import React, { useState, useEffect, useRef, useReducer, useCallback } from 'react'
import {
  CheckCircle2,
  ShieldCheck,
  Clock,
  ArrowRight,
  HelpCircle,
  FileCheck,
  GraduationCap,
  ChevronDown,
  UserCheck,
  AlertCircle,
  MessageCircle,
  Lock,
  FileText,
  CalendarDays
} from 'lucide-react'
import PpdbRegistrationForm from './PpdbRegistrationForm'
import PpdbStatusChecker from './PpdbStatusChecker'
import PpdbLaunchPopup from './PpdbLaunchPopup'

type PpdbClientPageProps = {
  initialSettings?: any
}

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

const SYARAT = [
  'Usia minimal 6 tahun 5 bulan per 16 Juli 2027 (sesuai KMA 1503/2025). Cek dengan alat Cek Usia di samping.',
  'Beragama Islam dan siap mengikuti pembiasaan ibadah serta tahfidz di madrasah.',
  'Orang tua dan anak bersedia mematuhi tata tertib madrasah.',
  'Biaya pendaftaran Rp 300.000 dibayar via transfer BTN atau QRIS panitia — tidak dapat dikembalikan.'
]

const BERKAS_UPLOAD = [
  { t: 'Akta Kelahiran Anak', req: true },
  { t: 'Kartu Keluarga (KK) Terbaru', req: true },
  { t: 'KTP Ayah & Ibu', req: true },
  { t: 'SK Tamat Belajar PAUD/TK/RA', req: false }
]

const BERKAS_FISIK = [
  { t: 'Fotokopi Akta Kelahiran', n: '2 lembar' },
  { t: 'Fotokopi Kartu Keluarga (barcode terbaru)', n: '2 lembar' },
  { t: 'Fotokopi KTP Ayah & Ibu', n: '2 lembar' }
]

const FAQS = [
  {
    q: 'Berapa biaya pendaftaran dan apakah bisa dikembalikan?',
    a: 'Biaya pendaftaran Rp 300.000, dibayar via transfer ke Bank BTN 2820-15-0010-3158 a.n. MI ATTAQWA 15 BABELAN atau QRIS melalui panitia. Biaya yang sudah dibayarkan tidak dapat dikembalikan (non-refundable).'
  },
  {
    q: 'Bagaimana cara cek status pendaftaran?',
    a: 'Buka tab Cek Status di halaman ini, lalu masukkan Nomor Registrasi (contoh: MI2027001) atau nomor WhatsApp yang dipakai saat mendaftar. Hasil verifikasi panitia juga dikirim ke email yang didaftarkan.'
  },
  {
    q: 'Kapan berkas fisik diserahkan ke madrasah?',
    a: 'Berkas fisik diserahkan saat daftar ulang, setelah status pendaftaran dinyatakan Approved: fotokopi Akta Kelahiran, Kartu Keluarga, dan KTP Ayah & Ibu masing-masing 2 lembar — map merah untuk Fullday, hijau untuk Reguler.'
  }
]

/* ── Alat cek usia: date picker 3 dropdown, patokan 16 Juli 2027 (sama dengan validasi formulir) ── */
function CekUsia() {
  const [d, setD] = useState('')
  const [m, setM] = useState('')
  const [y, setY] = useState('')

  let result: React.ReactNode = (
    <div className="mt-3 rounded-xl border-[1.5px] border-dashed border-blue-300 bg-white px-3.5 py-2.5 text-[13px] font-semibold text-slate-500">
      Pilih tanggal, bulan, dan tahun lahir anak — hasilnya langsung muncul di sini.
    </div>
  )

  if (d && m && y) {
    let years = 2027 - Number(y)
    let months = 6 - (Number(m) - 1)
    let days = 16 - Number(d)
    if (days < 0) { months -= 1; days += 30 }
    if (months < 0) { years -= 1; months += 12 }
    const valid = years > 6 || (years === 6 && months >= 5)
    result = valid ? (
      <div className="mt-3 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-[13px] font-bold leading-relaxed text-emerald-800">
        Memenuhi syarat — usia anak {years} tahun {months} bulan per 16 Juli 2027.
        <span className="block text-xs font-semibold">Silakan lanjut isi formulir di atas.</span>
      </div>
    ) : (
      <div className="mt-3 rounded-xl bg-rose-50 px-3.5 py-2.5 text-[13px] font-bold leading-relaxed text-rose-800">
        Belum memenuhi syarat — usia anak baru {years} tahun {months} bulan per 16 Juli 2027.
        <span className="block text-xs font-semibold">Syarat minimal 6 tahun 5 bulan (lahir maksimal 16 Februari 2021).</span>
      </div>
    )
  }

  const selCls = 'w-full rounded-xl border-[1.5px] border-slate-200 bg-white px-2.5 py-2.5 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:outline-none'

  return (
    <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4">
      <p className="text-[13px] font-extrabold text-slate-900">Cek Usia Anak</p>
      <p className="mb-2.5 mt-0.5 text-xs font-medium text-[#3D5A80]">Pastikan usia anak memenuhi syarat sebelum mengisi formulir.</p>
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Tanggal Lahir Anak — pilih, tidak perlu mengetik</span>
      <div className="grid grid-cols-[1fr_1.5fr_1.2fr] gap-2">
        <select aria-label="Tanggal" className={selCls} value={d} onChange={(e) => setD(e.target.value)}>
          <option value="">Tgl</option>
          {Array.from({ length: 31 }, (_, i) => (<option key={i + 1} value={i + 1}>{i + 1}</option>))}
        </select>
        <select aria-label="Bulan" className={selCls} value={m} onChange={(e) => setM(e.target.value)}>
          <option value="">Bulan</option>
          {BULAN.map((n, i) => (<option key={n} value={i + 1}>{n}</option>))}
        </select>
        <select aria-label="Tahun" className={selCls} value={y} onChange={(e) => setY(e.target.value)}>
          <option value="">Tahun</option>
          {[2023, 2022, 2021, 2020, 2019, 2018, 2017].map((yy) => (<option key={yy} value={yy}>{yy}</option>))}
        </select>
      </div>
      {result}
    </div>
  )
}

export default function PpdbClientPage({ initialSettings }: PpdbClientPageProps) {
  const [settings, setSettings] = useState<any>(initialSettings || null)

  // Jika initialSettings ada dan pendaftaran ditutup, arahkan default tab ke 'status'
  const isInitiallyOpen = initialSettings ? Boolean(initialSettings.is_active && !initialSettings.stats?.isTotalFull) : false
  const [activeTab, setActiveTab] = useState<'register' | 'status'>(isInitiallyOpen ? 'register' : 'status')
  const [loading, setLoading] = useState(!initialSettings)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const formRef = useRef<HTMLDivElement>(null)

  // Jam acuan = jam server (selisih dihitung saat settings diambil), bukan jam perangkat pengunjung.
  const offsetRef = useRef<number | null>(null)
  const [, rerender] = useReducer((x: number) => x + 1, 0)
  // Preview popup: ?preview=countdown[&t=detik] atau ?preview=closed
  const [preview, setPreview] = useState<{ mode: 'countdown' | 'closed'; target: number } | null>(null)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const m = q.get('preview')
    if (m === 'countdown' || m === 'closed') {
      const t = Number(q.get('t'))
      setPreview({ mode: m, target: Date.now() + (t > 0 ? t : 5400) * 1000 })
    }
  }, [])

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/spmb/settings?_t=' + Date.now(), { cache: 'no-store' })
        const json = await res.json()
        if (json.success && json.data) {
          offsetRef.current = Number(json.data.server_now) - Date.now() || 0
          setSettings(json.data)
          // Jika pendaftaran ditutup, otomatis pindah ke tab status agar tidak melihat form error
          if (!json.data.is_active || json.data.stats?.isTotalFull) {
            setActiveTab('status')
          }
        }
      } catch (err) {
        console.error('Error fetching SPMB settings:', err)
        if (offsetRef.current === null) offsetRef.current = 0
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  // Default fallback jika data belum siap — tanpa open_at = tetap tertutup demi keamanan
  const baseSettings = settings || {
    academic_year: '2027/2028',
    is_active: false,
    batch_1_quota: 150,
    registration_fee: 300000,
    bank_name: 'Bank BTN',
    bank_account_number: '2820-15-0010-3158',
    bank_account_holder: 'MI ATTAQWA 15 BABELAN',
    whatsapp_contact: '628567858268'
  }

  const initialNow: number = Number(initialSettings?.server_now) || 0
  const getNow = useCallback(() => (offsetRef.current === null ? initialNow : Date.now() + offsetRef.current), [initialNow])
  const realOpenAt = baseSettings.open_at ? Date.parse(baseSettings.open_at) : 0
  const beforeOpen = getNow() < realOpenAt
  const currentSettings = baseSettings
  const isTotalFull = Boolean(currentSettings.stats?.isTotalFull)
  const popupMode: 'countdown' | 'closed' | null = preview ? preview.mode : beforeOpen ? 'countdown' : isTotalFull ? 'closed' : null
  const [dismissed, setDismissed] = useState(false)
  const showPopup = !!popupMode && !(popupMode === 'countdown' && dismissed)
  const isRegistrationOpen = Boolean(currentSettings.is_active && !isTotalFull && !beforeOpen)

  // Saat waktu buka tiba tanpa reload: ambil ulang settings (server menyalakan SPMB otomatis), lalu buka tab formulir.
  const onElapsed = useCallback(async () => {
    try {
      const res = await fetch('/api/spmb/settings?_t=' + Date.now(), { cache: 'no-store' })
      const json = await res.json()
      if (json.success && json.data) {
        offsetRef.current = Number(json.data.server_now) - Date.now() || 0
        setSettings(json.data)
        if (json.data.is_active && !json.data.stats?.isTotalFull) setActiveTab('register')
      }
    } catch (err) {
      console.error('Error refreshing SPMB settings:', err)
    }
    rerender()
  }, [])

  // Tab yang tertidur / timer ditahan browser: cek ulang saat tab aktif kembali.
  useEffect(() => {
    if (!beforeOpen) return
    const check = () => { if (document.visibilityState === 'visible' && getNow() >= realOpenAt) onElapsed() }
    document.addEventListener('visibilitychange', check)
    window.addEventListener('focus', check)
    return () => { document.removeEventListener('visibilitychange', check); window.removeEventListener('focus', check) }
  }, [beforeOpen, realOpenAt, getNow, onElapsed])

  // Popup sudah ditutup pengunjung: tetap buka formulir tepat saat waktunya tiba.
  useEffect(() => {
    if (!dismissed || !beforeOpen) return
    const id = setTimeout(onElapsed, Math.max(0, realOpenAt - getNow()) + 50)
    return () => clearTimeout(id)
  }, [dismissed, beforeOpen, realOpenAt, getNow, onElapsed])

  const scrollToForm = (tab: 'register' | 'status' = 'register') => {
    setActiveTab(tab)
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const rawWa = (currentSettings.whatsapp_contact || '628567858268').replace(/[^0-9]/g, '')
  const waNumber = rawWa.startsWith('0') ? '62' + rawWa.slice(1) : rawWa
  const feeText = 'Rp ' + (Number(currentSettings.registration_fee) || 300000).toLocaleString('id-ID')
  const fd = currentSettings.stats?.fullday
  const rg = currentSettings.stats?.regular

  const h2Cls = 'flex items-center gap-2.5 text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-headline'
  const h2Bar = <span className="h-[21px] w-[5px] flex-none rounded-full bg-amber-500" />

  return (
    <>
    {showPopup && popupMode && (
      <PpdbLaunchPopup
        mode={popupMode}
        year={currentSettings.academic_year}
        openAtMs={preview?.mode === 'countdown' ? preview.target : realOpenAt}
        initialNow={preview ? Date.now() : initialNow}
        getNow={preview ? Date.now : getNow}
        onElapsed={onElapsed}
        onClose={popupMode === 'countdown' ? () => setDismissed(true) : undefined}
        totalQuota={Number(currentSettings.stats?.totalQuota) || 150}
        fulldayQuota={fd?.quota ?? 75}
        regularQuota={rg?.quota ?? 75}
        docs={BERKAS_UPLOAD.filter((b) => b.req).map((b) => b.t.replace(' Terbaru', ''))}
      />
    )}
    <div inert={showPopup ? true : undefined} className="font-sans min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-blue-600 selection:text-white pb-20 relative">

      {/* ════════════════════════════════════════════════════════════════════
          NAVBAR — overlay transparan di atas hero
         ════════════════════════════════════════════════════════════════════ */}
      <header className="absolute inset-x-0 top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-[72px] flex items-center justify-between gap-3">
          <div>
            <span className="font-black text-sm sm:text-base text-white tracking-tight leading-none">
              MI ATTAQWA 15 BABELAN
            </span>
            <p className="text-[11px] sm:text-xs font-semibold text-blue-200 mt-0.5">
              Portal SPMB Online Tahun Ajaran {currentSettings.academic_year}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {isRegistrationOpen ? (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-emerald-300 text-xs font-bold backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Pendaftaran Dibuka</span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-rose-300 text-xs font-bold backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span>Pendaftaran Ditutup</span>
              </div>
            )}

            <a
              href={`https://wa.me/${waNumber}?text=Halo%20Panitia%20SPMB%20MI%20Attaqwa%2015,%20saya%20ingin%20bertanya%20seputar%20pendaftaran%20murid%20baru.`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-tactile inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-emerald-950/30 transition cursor-pointer"
            >
              <MessageCircle size={15} />
              <span>Bantuan WA</span>
            </a>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════════════
          HERO — ringkas: pill jadwal buka, judul, 4 chip fakta, CTA
         ════════════════════════════════════════════════════════════════════ */}
      <section className="bg-gradient-to-b from-[#002957] via-[#00244a] to-[#001E3D] text-white px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-14 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl mx-auto relative z-10 text-center space-y-5">
          {isRegistrationOpen ? (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-amber-300 text-xs font-bold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Pendaftaran dibuka Sabtu, 7 November 2026 · 08.00 WIB</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/20 backdrop-blur-md border border-rose-400/40 text-rose-200 text-xs font-bold tracking-wide">
              <Lock size={13} className="text-rose-400" />
              <span>Pendaftaran SPMB T.A {currentSettings.academic_year} Ditutup</span>
            </div>
          )}

          <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-tight leading-tight text-white font-headline">
            Pendaftaran Murid Baru {currentSettings.academic_year}
          </h1>

          {isRegistrationOpen ? (
            <p className="text-sm sm:text-base text-blue-100/90 max-w-xl mx-auto leading-relaxed">
              Satu halaman untuk semua: cek persyaratan, isi formulir, bayar, lalu pantau status — tanpa antre di kantor.
            </p>
          ) : (
            <p className="text-xs sm:text-base text-rose-100 max-w-2xl mx-auto leading-relaxed bg-rose-950/40 border border-rose-500/30 p-3.5 rounded-2xl">
              Mohon maaf, sistem pendaftaran online murid baru MI Attaqwa 15 Tahun Ajaran <strong>{currentSettings.academic_year}</strong> saat ini <strong>Belum dibuka</strong> oleh panitia atau kuota penerimaan telah terpenuhi. Bagi calon wali murid yang sudah mendaftar, silakan lakukan pengecekan status di bawah.
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/[.07] border border-white/[.14] text-xs font-semibold text-slate-100">
              <CalendarDays size={14} className="text-amber-400 shrink-0" />
              <span>Dibuka 7 Nov 2026</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/[.07] border border-white/[.14] text-xs font-semibold text-slate-100">
              <GraduationCap size={14} className="text-amber-400 shrink-0" />
              <span>Kuota 150 — Fullday 75 · Reguler 75</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/[.07] border border-white/[.14] text-xs font-semibold text-slate-100">
              <FileCheck size={14} className="text-amber-400 shrink-0" />
              <span>Biaya {feeText}</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/[.07] border border-white/[.14] text-xs font-semibold text-slate-100">
              <CheckCircle2 size={14} className="text-amber-400 shrink-0" />
              <span>Usia min. 6 th 5 bln</span>
            </div>
          </div>

          <div className="flex flex-col xs:flex-row items-center justify-center gap-3 pt-2">
            {isRegistrationOpen ? (
              <button
                onClick={() => scrollToForm('register')}
                className="btn-tactile w-full xs:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 px-6 sm:px-8 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition cursor-pointer"
              >
                <span>Isi Formulir Pendaftaran</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <div className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-200 font-bold text-xs sm:text-sm">
                <Lock size={15} />
                <span>Pendaftaran belum dibuka</span>
              </div>
            )}

            <button
              onClick={() => scrollToForm('status')}
              className={`btn-tactile w-full xs:w-auto flex items-center justify-center gap-2 px-6 sm:px-7 py-3 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer ${
                !isRegistrationOpen
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 hover:from-amber-300 hover:to-amber-400'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }`}
            >
              <UserCheck size={16} />
              <span>Cek Status Pendaftaran</span>
            </button>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          KARTU UTAMA — tab Formulir / Cek Status + strip kuota approved
         ════════════════════════════════════════════════════════════════════ */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        <div ref={formRef} className="scroll-mt-24">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1 shadow-inner max-w-md w-full">
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  activeTab === 'register'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isRegistrationOpen ? (
                  <FileCheck size={16} className={activeTab === 'register' ? 'text-blue-600' : ''} />
                ) : (
                  <Lock size={16} className="text-rose-500" />
                )}
                <span>Formulir Pendaftaran {isRegistrationOpen ? '' : '(Ditutup)'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('status')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  activeTab === 'status'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck size={16} className={activeTab === 'status' ? 'text-blue-600' : ''} />
                <span>Cek Status Pendaftaran</span>
              </button>
            </div>
          </div>

          {activeTab === 'register' ? (
            isRegistrationOpen ? (
              <div>
                {/* Strip kuota — angka = pendaftar Approved (online + manual), sesuai aturan panitia */}
                <div className="max-w-5xl mx-auto mb-5 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center shadow-sm">
                  <p className="text-[13px] font-bold text-slate-700">
                    Kuota Fullday <b className="text-slate-900">{fd?.approved ?? 0}/{fd?.quota ?? 75}</b>
                    <span className="mx-2 text-slate-300">|</span>
                    Kuota Reguler <b className="text-slate-900">{rg?.approved ?? 0}/{rg?.quota ?? 75}</b>
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    Kuota terisi dari pendaftaran yang sudah disetujui panitia — online dan manual di kantor. Berubah setiap ada persetujuan atau penolakan.
                  </p>
                </div>
                <PpdbRegistrationForm settings={currentSettings} />
              </div>
            ) : (
              /* Notice saat pendaftaran ditutup — Mencegah akses formulir sama sekali */
              <div className="bg-white rounded-3xl p-6 sm:p-12 text-center border border-rose-200/80 shadow-xl shadow-slate-900/5 max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
                  <Lock size={36} className="animate-pulse" />
                </div>

                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold uppercase tracking-wider">
                    <AlertCircle size={14} />
                    <span>Akses Formulir Ditutup</span>
                  </div>
                  <h3 className="text-xl sm:text-3xl font-extrabold text-slate-900 font-headline">
                    Pendaftaran SPMB Online Sedang Ditutup
                  </h3>
                  <p className="text-xs sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
                    Mohon maaf, sistem penerimaan murid baru MI Attaqwa 15 Tahun Ajaran <strong>{currentSettings.academic_year}</strong> saat ini sedang ditutup sementara oleh pihak panitia madrasah.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 text-left max-w-xl mx-auto space-y-2.5 text-xs sm:text-sm text-slate-700">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Calon murid yang sudah mendaftar</strong> tetap dapat memantau proses verifikasi berkas dan pengumuman melalui tab <strong>Cek Status Pendaftaran</strong>.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <HelpCircle size={16} className="text-blue-600 shrink-0 mt-0.5" />
                    <span>Untuk informasi pembukaan pendaftaran gelombang berikutnya atau konsultasi kuota, silakan hubungi kontak panitia madrasah via WhatsApp.</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('status')}
                    className="btn-tactile w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition cursor-pointer"
                  >
                    <UserCheck size={16} />
                    <span>Buka Cek Status Pendaftaran</span>
                  </button>
                  <a
                    href={`https://wa.me/${waNumber}?text=Halo%20Panitia%20SPMB%20MI%20Attaqwa%2015,%20saya%20ingin%20menanyakan%20jadwal%20pembukaan%20pendaftaran%20murid%20baru.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-tactile w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition cursor-pointer"
                  >
                    <MessageCircle size={16} />
                    <span>Hubungi Panitia via WA</span>
                  </a>
                </div>
              </div>
            )
          ) : (
            <PpdbStatusChecker />
          )}
        </div>
      </main>

      {/* ════════════════════════════════════════════════════════════════════
          INFO — Jadwal & Alur (satu kartu terang)
         ════════════════════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          <h2 className={h2Cls}>{h2Bar}Jadwal &amp; Alur Pendaftaran</h2>
          <div className="mt-6 grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-blue-700">
                <CalendarDays size={15} /> Jadwal
              </h3>
              <div className="mt-3.5 space-y-3.5 text-sm leading-relaxed text-slate-600">
                <p className="flex gap-2.5"><Clock size={16} className="mt-0.5 flex-none text-blue-600" /><span><b className="text-slate-900">Pendaftaran dibuka</b><br />Sabtu, 7 November 2026 pukul 08.00 WIB — satu gelombang, langsung ditutup saat kuota 150 terpenuhi.</span></p>
                <p className="flex gap-2.5"><Clock size={16} className="mt-0.5 flex-none text-blue-600" /><span><b className="text-slate-900">Verifikasi &amp; observasi</b><br />Dilakukan panitia secara berkala setelah berkas masuk; pantau hasilnya di tab Cek Status.</span></p>
                <p className="flex gap-2.5"><Clock size={16} className="mt-0.5 flex-none text-blue-600" /><span><b className="text-slate-900">Daftar ulang</b><br />Setelah status Approved — serahkan berkas fisik ke sekretariat madrasah.</span></p>
              </div>
            </div>
            <div>
              <h3 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-blue-700">
                <ShieldCheck size={15} /> Alur — 3 Tahap Saja
              </h3>
              <div className="mt-3.5 space-y-3.5">
                {[
                  { t: 'Isi formulir & bayar', d: 'Lengkapi 4 langkah formulir di atas, transfer biaya pendaftaran, lalu unggah buktinya.' },
                  { t: 'Verifikasi panitia', d: 'Panitia memeriksa berkas dan usia anak. Pantau hasilnya lewat tab Cek Status.' },
                  { t: 'Daftar ulang', d: 'Status Approved? Serahkan berkas fisik ke sekretariat untuk mengunci kursi anak.' }
                ].map((s, i) => (
                  <div key={s.t} className="flex gap-3">
                    <span className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full bg-blue-600 text-xs font-extrabold text-white">{i + 1}</span>
                    <p className="text-sm leading-relaxed text-slate-600"><b className="text-slate-900">{s.t}</b><br />{s.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          PERSYARATAN — syarat + cek usia interaktif | listing berkas
         ════════════════════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          <h2 className={h2Cls}>{h2Bar}Persyaratan Pendaftaran</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">Cek dulu sebelum mengisi formulir — kurang dari satu menit.</p>

          <div className="mt-6 grid gap-9 md:grid-cols-2">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-700">Syarat Umum</h3>
              <ul className="mt-3.5 space-y-2.5 text-sm leading-relaxed text-slate-600">
                {SYARAT.map((s) => (
                  <li key={s} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-[23px] w-[23px] flex-none items-center justify-center rounded-full bg-emerald-50">
                      <CheckCircle2 size={13} className="text-emerald-600" />
                    </span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
              <CekUsia />
            </div>

            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-700">Berkas yang Diunggah</h3>
              <div className="mt-3.5 space-y-2.5">
                {BERKAS_UPLOAD.map((b) => (
                  <div key={b.t} className="flex items-center gap-3 rounded-xl border-[1.5px] border-slate-200 px-3.5 py-3 transition hover:border-blue-300 hover:shadow-sm">
                    <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-lg bg-blue-50">
                      <FileText size={16} className="text-blue-600" />
                    </span>
                    <span className="text-sm font-semibold text-slate-800">
                      {b.t}
                      <small className="block text-[11.5px] font-semibold text-slate-500">Foto / scan jelas · JPG, PNG, atau PDF</small>
                    </span>
                    {b.req ? (
                      <span className="ml-auto flex-none rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-extrabold text-rose-700">Wajib</span>
                    ) : (
                      <span className="ml-auto flex-none rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-extrabold text-slate-500">Opsional</span>
                    )}
                  </div>
                ))}
              </div>

              <h3 className="mt-6 text-xs font-extrabold uppercase tracking-wider text-blue-700">Fisik saat daftar ulang</h3>
              <div className="mt-1.5">
                {BERKAS_FISIK.map((f) => (
                  <div key={f.t} className="flex items-center justify-between gap-3 border-t border-dashed border-slate-200 py-2 text-sm text-slate-600 first:border-t-0">
                    <span>{f.t}</span>
                    <b className="whitespace-nowrap text-slate-900">{f.n}</b>
                  </div>
                ))}
              </div>
              <p className="mt-2.5 text-xs font-medium text-slate-500">Map merah untuk Fullday, hijau untuk Reguler.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          FAQ — 3 pertanyaan teratas + strip WhatsApp
         ════════════════════════════════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          <h2 className={h2Cls}>{h2Bar}Sering Ditanyakan</h2>
          <div className="mt-5 space-y-2.5">
            {FAQS.map((f, i) => {
              const open = openFaq === i
              return (
                <div key={f.q} className={`rounded-2xl border-[1.5px] transition ${open ? 'border-blue-500' : 'border-slate-200'}`}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="flex w-full items-center justify-between gap-3 px-4.5 py-4 text-left cursor-pointer"
                  >
                    <span className="text-sm font-bold text-slate-900 sm:text-[15px]">{f.q}</span>
                    <ChevronDown size={18} className={`flex-none text-blue-600 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
                  </button>
                  <div className={`grid transition-all duration-300 ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      <p className="px-4.5 pb-4.5 text-sm leading-relaxed text-slate-600">{f.a}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-5 flex flex-col items-start justify-between gap-3 rounded-2xl bg-slate-50 px-5 py-4 sm:flex-row sm:items-center">
            <p className="text-sm font-semibold text-slate-700">Masih ada yang ingin ditanyakan? Panitia siap membantu.</p>
            <a
              href={`https://wa.me/${waNumber}?text=Halo%20Panitia%20SPMB%20MI%20Attaqwa%2015,%20saya%20ingin%20bertanya%20seputar%20pendaftaran%20murid%20baru.`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-tactile inline-flex flex-none items-center gap-1.5 rounded-xl bg-emerald-600 px-4.5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              <MessageCircle size={15} />
              <span>Chat Panitia</span>
            </a>
          </div>
        </div>

        <p className="mt-8 text-center text-xs font-medium text-slate-400">
          MI Attaqwa 15 Babelan — Portal SPMB Online {currentSettings.academic_year}
        </p>
      </section>

    </div>
    </>
  )
}
