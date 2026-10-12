'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import {
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  BookOpen,
  Clock,
  HeartHandshake,
  Phone,
  ArrowRight,
  HelpCircle,
  FileCheck,
  Award,
  GraduationCap,
  ChevronDown,
  UserCheck,
  AlertCircle,
  MessageCircle,
  ExternalLink,
  Users,
  Lock,
  CalendarX
} from 'lucide-react'
import PpdbRegistrationForm from './PpdbRegistrationForm'
import PpdbStatusChecker from './PpdbStatusChecker'
import PpdbRequirements from './PpdbRequirements'
import PpdbSchedule from './PpdbSchedule'
import PpdbFaq from './PpdbFaq'

type PpdbClientPageProps = {
  initialSettings?: any
}

export default function PpdbClientPage({ initialSettings }: PpdbClientPageProps) {
  const [settings, setSettings] = useState<any>(initialSettings || null)
  
  // Jika initialSettings ada dan pendaftaran ditutup, arahkan default tab ke 'status'
  const isInitiallyOpen = initialSettings ? Boolean(initialSettings.is_active && !initialSettings.stats?.isTotalFull) : false
  const [activeTab, setActiveTab] = useState<'register' | 'status'>(isInitiallyOpen ? 'register' : 'status')
  const [loading, setLoading] = useState(!initialSettings)

  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/spmb/settings?_t=' + Date.now(), { cache: 'no-store' })
        const json = await res.json()
        if (json.success && json.data) {
          setSettings(json.data)
          // Jika pendaftaran ditutup, otomatis pindah ke tab status agar tidak melihat form error
          if (!json.data.is_active || json.data.stats?.isTotalFull) {
            setActiveTab('status')
          }
        }
      } catch (err) {
        console.error('Error fetching SPMB settings:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  // Default fallback jika data belum siap — default is_active: false demi keamanan
  const currentSettings = settings || {
    academic_year: '2027/2028',
    is_active: false,
    batch_1_quota: 150,
    registration_fee: 300000,
    bank_name: 'Bank BTN',
    bank_account_number: '2820-15-0010-3158',
    bank_account_holder: 'MI ATTAQWA 15 BABELAN',
    whatsapp_contact: '6281234567890'
  }

  const isTotalFull = Boolean(currentSettings.stats?.isTotalFull)
  const isRegistrationOpen = Boolean(currentSettings.is_active && !isTotalFull)

  const scrollToForm = (tab: 'register' | 'status' = 'register') => {
    setActiveTab(tab)
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const waNumber = (currentSettings.whatsapp_contact || '6281234567890').replace(/[^0-9]/g, '')

  return (
    <div className="font-sans min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-blue-600 selection:text-white pb-20">
      
      {/* ════════════════════════════════════════════════════════════════════
          TOP BRANDING & ADMISSION NAVBAR (Dedicated for SPMB Portal)
         ════════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3">
          
          {/* Logo & School Identity */}
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm sm:text-base text-slate-900 tracking-tight leading-none">
                  MI ATTAQWA 15 BABELAN 
                </span>
              </div>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-500 mt-0.5">
                Portal SPMB Online Tahun Ajaran {currentSettings.academic_year}
              </p>
            </div>
          </div>

          {/* Right Action: Status Badge & WhatsApp Help */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isRegistrationOpen ? (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Pendaftaran SPMB Dibuka</span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Pendaftaran SPMB Ditutup</span>
              </div>
            )}

            <a
              href={`https://wa.me/${waNumber}?text=Halo%20Panitia%20SPMB%20MI%20Attaqwa%2015,%20saya%20ingin%20bertanya%20seputar%20pendaftaran%20murid%20baru.`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-tactile inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-emerald-600/20 transition cursor-pointer"
            >
              <MessageCircle size={15} />
              <span className="hidden xs:inline">Bantuan WA</span>
            </a>
          </div>

        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════════════
          HERO BANNER
         ════════════════════════════════════════════════════════════════════ */}
      <section className="bg-gradient-to-b from-[#002244] via-[#002d5a] to-[#001e3d] text-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 text-center space-y-5">
          
          {/* Status Badge */}
          {isRegistrationOpen ? (
            <div className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-amber-300 text-xs font-bold tracking-wide">
              <span>Sistem Penerimaan Murid Baru (SPMB) Online</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full bg-rose-500/20 backdrop-blur-md border border-rose-400/40 text-rose-200 text-xs font-bold tracking-wide">
              <Lock size={13} className="text-rose-400" />
              <span>Pendaftaran SPMB T.A {currentSettings.academic_year} Ditutup</span>
            </div>
          )}

          {/* Heading */}
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white font-headline">
            Membentuk Generasi Qur&apos;ani, <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-teal-200">
              Berakhlak Mulia &amp; Berprestasi
            </span>
          </h1>

          {/* Subtitle */}
          {isRegistrationOpen ? (
            <p className="text-xs sm:text-base text-slate-200 max-w-2xl mx-auto leading-relaxed font-normal">
              Selamat datang di portal resmi pendaftaran siswa baru MI Attaqwa 15 Babelan. Pendaftaran tahun ajaran <strong>{currentSettings.academic_year}</strong> telah dibuka secara online, mudah, dan transparan.
            </p>
          ) : (
            <p className="text-xs sm:text-base text-rose-100 max-w-2xl mx-auto leading-relaxed font-normal bg-rose-950/40 border border-rose-500/30 p-3.5 rounded-2xl">
              Mohon maaf, sistem pendaftaran online murid baru MI Attaqwa 15 Tahun Ajaran <strong>{currentSettings.academic_year}</strong> saat ini <strong>Belum dibuka</strong> oleh panitia atau kuota penerimaan telah terpenuhi. Bagi calon wali murid yang sudah mendaftar, silakan lakukan pengecekan status di bawah.
            </p>
          )}

          {/* Key Metric Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-xs font-semibold text-slate-100">
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
              <span>Usia Min. 6 Thn 5 Bln</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-xs font-semibold text-slate-100">
              <GraduationCap size={14} className="text-amber-400 shrink-0" />
              <span>Biaya Rp {(Number(currentSettings.registration_fee) || 300000).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-xs font-semibold text-slate-100">
              <ShieldCheck size={14} className="text-teal-400 shrink-0" />
              <span>Pilihan Kelas Fullday &amp; Regular</span>
            </div>
          </div>

          {/* Direct CTA Buttons */}
          <div className="max-w-5xl mx-auto flex flex-col xs:flex-row items-center justify-center gap-3 pt-3">
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
          MAIN CONTENT AREA (Direct Form & Status Tabs)
         ════════════════════════════════════════════════════════════════════ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20 space-y-8">
        
        {/* ── MAIN INTERACTIVE TABS (DAFTAR vs CEK STATUS) ── */}
        <div ref={formRef} className="pt-2 scroll-mt-24">
          
          {/* Tab Switcher */}
          <div className="flex items-center justify-center mb-8">
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

          {/* Tab Content Display */}
          {activeTab === 'register' ? (
            isRegistrationOpen ? (
              <PpdbRegistrationForm settings={currentSettings} />
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

      {/* ── INFORMASI LENGKAP SPMB (Syarat, Jadwal, FAQ) ── */}
      <section className="mt-16 space-y-6">
        <PpdbRequirements />
        <PpdbSchedule />
        <PpdbFaq />
      </section>

    </div>
  )
}
