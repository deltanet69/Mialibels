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
  Users
} from 'lucide-react'
import PpdbRegistrationForm from './PpdbRegistrationForm'
import PpdbStatusChecker from './PpdbStatusChecker'

type PpdbClientPageProps = {
  initialSettings?: any
}

export default function PpdbClientPage({ initialSettings }: PpdbClientPageProps) {
  const [settings, setSettings] = useState<any>(initialSettings || null)
  const [activeTab, setActiveTab] = useState<'register' | 'status'>('register')
  const [loading, setLoading] = useState(!initialSettings)

  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/spmb/settings?_t=' + Date.now())
        const json = await res.json()
        if (json.success) {
          setSettings(json.data)
        }
      } catch (err) {
        console.error('Error fetching SPMB settings:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const currentSettings = settings || {
    academic_year: '2027/2028',
    is_active: true,
    batch_1_quota: 120,
    registration_fee: 300000,
    bank_name: 'Bank BTN',
    bank_account_number: '00129-01-30-00015-9',
    bank_account_holder: 'MI ATTAQWA 15 BABELAN',
    whatsapp_contact: '6281234567890'
  }

  const scrollToForm = (tab: 'register' | 'status' = 'register') => {
    setActiveTab(tab)
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const waNumber = (currentSettings.whatsapp_contact || '6281234567890').replace(/[^0-9]/g, '')
  const isTotalFull = Boolean(currentSettings.stats?.isTotalFull)

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

          {/* Right Action & WhatsApp Help */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Pendaftaran SPMB Dibuka</span>
            </div>

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
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-amber-300 text-xs font-bold tracking-wide">
            {/* <Sparkles size={14} className="text-amber-400" /> */}
            <span>Sistem Penerimaan Murid Baru (SPMB) Online</span>
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white font-headline">
            Membentuk Generasi Qur&apos;ani, <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-teal-200">
              Berakhlak Mulia &amp; Berprestasi
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-base text-slate-200 max-w-2xl mx-auto leading-relaxed font-normal">
            Selamat datang di portal resmi pendaftaran siswa baru MI Attaqwa 15 Babelan. Pendaftaran tahun ajaran <strong>{currentSettings.academic_year}</strong> telah dibuka secara online, mudah, dan transparan.
          </p>

          {/* Key Metric Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-xs font-semibold text-slate-100">
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
              <span>Usia Min. 6 Tahun</span>
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
            {currentSettings.is_active && !isTotalFull ? (
              <button
                onClick={() => scrollToForm('register')}
                className="btn-tactile w-full xs:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 px-6 sm:px-8 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition cursor-pointer"
              >
                <span>Isi Formulir Pendaftaran</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <div className="px-5 py-2.5 rounded-xl bg-rose-500/20 border border-rose-400/30 text-rose-200 font-bold text-xs">
                Pendaftaran SPMB Sedang Ditutup / Kuota Terpenuhi
              </div>
            )}

            <button
              onClick={() => scrollToForm('status')}
              className="btn-tactile w-full xs:w-auto flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 sm:px-6 py-3 rounded-xl font-bold text-xs sm:text-sm border border-white/20 transition cursor-pointer"
            >
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
          {/* <div className="flex items-center justify-center mb-8">
            <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1 shadow-inner max-w-md w-full">
              <button
                onClick={() => setActiveTab('register')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  activeTab === 'register'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileCheck size={16} className={activeTab === 'register' ? 'text-blue-600' : ''} />
                <span>Formulir Pendaftaran</span>
              </button>

              <button
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
          </div> */}

          {/* Tab Content Display */}
          {activeTab === 'register' ? (
            <PpdbRegistrationForm settings={currentSettings} />
          ) : (
            <PpdbStatusChecker />
          )}

        </div>

      </main>

    </div>
  )
}
