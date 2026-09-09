'use client'

import React, { useState, useEffect } from 'react'
import { Users, ArrowRight, Sparkles, CheckCircle2, School, GraduationCap } from 'lucide-react'
import { getSpmbUrl } from '@/lib/urls'

type PpdbProgramQuotasProps = {
  settings?: {
    academic_year?: string
    is_active?: boolean
    batch_1_quota?: number
    stats?: {
      total?: number
      totalQuota?: number
      isTotalFull?: boolean
      fullday?: {
        total: number
        approved: number
        quota: number
        isFull: boolean
      }
      regular?: {
        total: number
        approved: number
        quota: number
        isFull: boolean
      }
    }
  }
  onRegisterClick?: () => void
}

export default function PpdbBatchQuotas({ settings: initialSettings, onRegisterClick }: PpdbProgramQuotasProps) {
  const [dataSettings, setDataSettings] = useState<any>(initialSettings || null)

  useEffect(() => {
    if (!initialSettings) {
      fetch('/api/spmb/settings?_t=' + Date.now())
        .then(res => res.json())
        .then(json => {
          if (json.success) setDataSettings(json.data)
        })
        .catch(err => console.error('Failed to fetch SPMB settings:', err))
    }
  }, [initialSettings])

  const currentSettings = dataSettings || {
    academic_year: '2027/2028',
    is_active: true,
    batch_1_quota: 120
  }

  const fulldayTotal = currentSettings.stats?.fullday?.total || 0
  const fulldayQuota = 30
  const fulldayPercent = Math.min(100, Math.round((fulldayTotal / fulldayQuota) * 100))
  const isFulldayFull = fulldayTotal >= fulldayQuota

  const regularTotal = currentSettings.stats?.regular?.total || 0
  const totalQuota = Number(currentSettings.batch_1_quota) || 120
  const regularQuota = Math.max(0, totalQuota - fulldayQuota)
  const regularPercent = Math.min(100, Math.round((regularTotal / regularQuota) * 100))

  const spmbAppUrl = typeof window !== 'undefined' && window.location.hostname.includes('spmb.') 
    ? '/spmb-app' 
    : getSpmbUrl()

  return (
    <section className="py-12 sm:py-16 bg-[#F4F7FC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-6 sm:p-10 rounded-3xl sm:rounded-[2.5rem] border border-slate-200/80 shadow-xl shadow-slate-900/5 space-y-6">
          
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
                <Users size={13} />
                <span>Program Kelas &amp; Kuota Penerimaan</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-headline">
                Pilihan Program Kelas T.A {currentSettings.academic_year || '2027/2028'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Pendaftaran periode tunggal dibuka sampai target kuota total <strong>{totalQuota} siswa baru</strong> terpenuhi.
              </p>
            </div>

            {currentSettings.is_active && (
              onRegisterClick ? (
                <button
                  onClick={onRegisterClick}
                  className="btn-tactile inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 transition cursor-pointer shrink-0"
                >
                  <span>Daftar Sekarang</span>
                  <ArrowRight size={15} />
                </button>
              ) : (
                <a
                  href={spmbAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-tactile inline-flex items-center gap-2 bg-btn-secondary hover:brightness-110 text-white px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-orange-950/20 transition cursor-pointer shrink-0"
                >
                  <GraduationCap size={16} />
                  <span>Daftar SPMB Online</span>
                  <ArrowRight size={15} />
                </a>
              )
            )}
          </div>

          {/* 2 Program Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 pt-2">
            
            {/* Card 1: Kelas Fullday */}
            <div className="bg-gradient-to-br from-white to-indigo-50/30 border-2 border-indigo-200/80 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-6 relative overflow-hidden">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-extrabold uppercase tracking-wider">
                    <Sparkles size={12} />
                    <span>Program Unggulan</span>
                  </span>
                  {isFulldayFull ? (
                    <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
                      Kuota Penuh
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold">
                      Maks. 30 Siswa
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-headline">
                    Kelas Fullday Madrasah
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                    Pembelajaran terpadu dengan penguatan tahfidz Al-Qur&apos;an, adab dan akhlakul karimah, makan siang bersama, dan aktivitas sore terbimbing.
                  </p>
                </div>

                {/* Quota Progress */}
                <div className="bg-white p-4 rounded-2xl border border-indigo-100/80 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">Keterisian Kuota Fullday</span>
                    <span className="font-black text-indigo-700">{fulldayTotal} / {fulldayQuota} Siswa ({fulldayPercent}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFulldayFull ? 'bg-rose-500' : 'bg-gradient-to-r from-indigo-500 to-blue-600'
                      }`}
                      style={{ width: `${fulldayPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span>Target Hafalan Juz 30 + Surat Pilihan</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span>Maksimal 30 siswa per kelas untuk bimbingan intensif</span>
                </div>
              </div>
            </div>

            {/* Card 2: Kelas Regular */}
            <div className="bg-gradient-to-br from-white to-blue-50/20 border-2 border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-6 relative overflow-hidden">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-extrabold uppercase tracking-wider">
                    <School size={12} />
                    <span>Program Standar Nasional</span>
                  </span>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                    Tersedia
                  </span>
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-headline">
                    Kelas Regular Madrasah
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                    Kurikulum terakreditasi A Kemenag dan Kemendikbudristek dengan pembiasaan sholat dhuha/dzuhur berjamaah dan kegiatan ekstrakurikuler.
                  </p>
                </div>

                {/* Quota Progress */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">Keterisian Kuota Regular</span>
                    <span className="font-black text-blue-700">{regularTotal} / {regularQuota} Siswa ({regularPercent}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-teal-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${regularPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span>Kurikulum lengkap mata pelajaran umum &amp; agama</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span>Tenaga pendidik berkompeten &amp; fasilitas madrasah lengkap</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  )
}
