'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Sparkles, CheckCircle2, ShieldCheck, BookOpen, Clock, HeartHandshake, Phone, ArrowRight, HelpCircle, FileCheck, Award, GraduationCap, ChevronDown, UserCheck, AlertCircle, MessageCircle, ExternalLink } from 'lucide-react'
import PpdbBatchQuotas from './PpdbBatchQuotas'
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
    active_batch: 1,
    batch_1_quota: 75,
    batch_2_quota: 75,
    batch_3_quota: 75,
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

  const activeBatch = currentSettings.active_batch || 1
  let isFull = false
  if (currentSettings.stats) {
    if (activeBatch === 1) isFull = currentSettings.stats.batch1?.isFull
    else if (activeBatch === 2) isFull = currentSettings.stats.batch2?.isFull
    else if (activeBatch === 3) isFull = currentSettings.stats.batch3?.isFull
  }

  return (
    <div className="font-sans min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-blue-600 selection:text-white pb-20">
      
      {/* ════════════════════════════════════════════════════════════════════
          TOP BRANDING & ADMISSION NAVBAR (Dedicated for SPMB Portal)
         ════════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40  backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
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
              <span>Gelombang {currentSettings.active_batch || 1} Dibuka</span>
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
          HERO BANNER (Clean, High Contrast, Normal Readable Font)
         ════════════════════════════════════════════════════════════════════ */}
      <section className="bg-gradient-to-b from-[#002244] via-[#002d5a] to-[#001e3d] text-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        

        <div className="max-w-6xl mx-auto relative z-10 text-center space-y-5">
          
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-amber-300 text-xs font-bold tracking-wide">
            <Sparkles size={14} className="text-amber-400" />
            <span>Sistem Penerimaan Murid Baru (SPMB) Online</span>
          </div>

          {/* Heading with normal font-sans */}
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white">
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
              <span>Usia Min. 6 Thn 6 Bln</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-xs font-semibold text-slate-100">
              <GraduationCap size={14} className="text-amber-400 shrink-0" />
              <span>Biaya Rp {(Number(currentSettings.registration_fee) || 300000).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-xs font-semibold text-slate-100">
              <ShieldCheck size={14} className="text-teal-400 shrink-0" />
              <span>Maks 75 Siswa / Gelombang</span>
            </div>
          </div>

          {/* Direct CTA Buttons */}
          <div className="flex flex-col xs:flex-row items-center justify-center gap-3 pt-3">
            {currentSettings.is_active && !isFull ? (
              <button
                onClick={() => scrollToForm('register')}
                className="btn-tactile w-[600px] xs:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 px-6 sm:px-8 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition cursor-pointer"
              >
                <span>Isi Formulir Pendaftaran</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <div className="px-5 py-2.5 rounded-xl bg-rose-500/20 border border-rose-400/30 text-rose-200 font-bold text-xs">
                {isFull ? `Kuota Gelombang ${activeBatch} Telah Penuh` : 'Pendaftaran SPMB Sedang Ditutup'}
              </div>
            )}

            <button
              onClick={() => scrollToForm('status')}
              className="btn-tactile w-[600px] xs:w-auto flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-bold text-xs sm:text-sm border border-white/20 backdrop-blur-md transition cursor-pointer"
            >
              <span>Cek Status / Upload Berkas</span>
            </button>
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          MAIN CONTENT CONTAINER (Proportional, Clean Spacing)
         ════════════════════════════════════════════════════════════════════ */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-14 mt-8 sm:mt-10">
        
        
        {/* 2. Interactive Tab Navigation (Form vs Status Checker) */}
        <section ref={formRef} className="space-y-6 scroll-mt-24"> 
           

          {/* Active Tab View */}
          {activeTab === 'register' ? (
            currentSettings.is_active && !isFull ? (
              <PpdbRegistrationForm settings={currentSettings} />
            ) : (
              <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/80 shadow-2xs text-center max-w-6xl mx-auto space-y-4">
                <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
                  <AlertCircle size={28} />
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  {isFull ? `Kuota Gelombang ${activeBatch} Telah Penuh` : 'Pendaftaran SPMB Sedang Ditutup'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  {isFull 
                    ? `Mohon maaf, saat ini pendaftaran murid baru MI Attaqwa 15 Babelan untuk Gelombang ${activeBatch} telah mencapai batas kuota maksimal.` 
                    : 'Mohon maaf, saat ini pendaftaran murid baru MI Attaqwa 15 Babelan sedang tidak dibuka.'}
                </p>
                <div className="pt-2">
                  <a
                    href={`https://wa.me/${waNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-tactile inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20"
                  >
                    <Phone size={15} />
                    <span>Hubungi Panitia SPMB</span>
                  </a>
                </div>
              </div>
            )
          ) : (
            <PpdbStatusChecker whatsappContact={currentSettings.whatsapp_contact} />
          )}

        </section>
      </main>

      {/* ════════════════════════════════════════════════════════════════════
          MINIMAL CLEAN SPMB FOOTER
         ════════════════════════════════════════════════════════════════════ */}
      <footer className="mt-20 border-t border-slate-200/80 bg-white py-8 px-4 text-center">
        <div className="max-w-5xl mx-auto space-y-2">
          <p className="text-xs sm:text-sm font-bold text-slate-800">
            Panitia Sistem Penerimaan Murid Baru (SPMB) &bull; MI Attaqwa 15 Babelan
          </p>
          <p className="text-xs text-slate-400">
            Jl. Raya Babelan Kota, Kec. Babelan, Kab. Bekasi &bull; Kontak: +{waNumber}
          </p>
          <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 max-w-xs mx-auto">
            &copy; 2027 MI Attaqwa 15 Babelan. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  )
}

function SearchIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden transition">
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-slate-800 hover:text-blue-600 transition cursor-pointer"
      >
        <span>{question}</span>
        <ChevronDown size={17} className={`text-slate-400 transition-transform shrink-0 ${open ? 'rotate-180 text-blue-600' : ''}`} />
      </button>
      {open && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
          {answer}
        </div>
      )}
    </div>
  )
}
