'use client'

import React from 'react'
import { Users, ArrowRight, Sparkles, CheckCircle2, ShieldCheck, GraduationCap, School } from 'lucide-react'

type PpdbProgramQuotasProps = {
  settings: {
    academic_year: string
    is_active: boolean
    active_batch?: number
    batch_1_quota?: number
    stats?: {
      total: number
      totalQuota: number
      isTotalFull: boolean
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

export default function PpdbBatchQuotas({ settings, onRegisterClick }: PpdbProgramQuotasProps) {
  const fulldayTotal = settings.stats?.fullday?.total || 0
  const fulldayQuota = 30
  const fulldayPercent = Math.min(100, Math.round((fulldayTotal / fulldayQuota) * 100))
  const isFulldayFull = fulldayTotal >= fulldayQuota

  const regularTotal = settings.stats?.regular?.total || 0
  const totalQuota = Number(settings.batch_1_quota) || 120
  const regularQuota = Math.max(0, totalQuota - fulldayQuota)
  const regularPercent = Math.min(100, Math.round((regularTotal / regularQuota) * 100))

  return (
    <div className="font-sans w-full space-y-4 sm:space-y-5">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[11px] font-bold uppercase tracking-wider mb-1.5">
            <Users size={13} />
            <span>Program Kelas &amp; Kuota Penerimaan</span>
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight font-headline">
            Pilihan Program Kelas T.A {settings.academic_year}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Pendaftaran periode tunggal dibuka sampai target kuota total <strong>{totalQuota} siswa baru</strong> terpenuhi.
          </p>
        </div>

        {settings.is_active && onRegisterClick && (
          <button
            onClick={onRegisterClick}
            className="btn-tactile hidden sm:inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm shadow-blue-600/20 transition cursor-pointer shrink-0"
          >
            <span>Daftar Sekarang</span>
            <ArrowRight size={14} />
          </button>
        )}
      </div>

      {/* 2 Program Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        
        {/* Card 1: Kelas Fullday */}
        <div className="bg-white border-2 border-indigo-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-5 relative overflow-hidden">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-extrabold uppercase tracking-wider">
                <Sparkles size={12} />
                <span>Program Unggulan</span>
              </span>
              {isFulldayFull ? (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
                  Kuota Penuh
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold">
                  Maks. 30 Siswa
                </span>
              )}
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight font-headline">
                Kelas Fullday Madrasah
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                Pembelajaran terpadu dengan penguatan tahfidz Al-Qur&apos;an, adab dan akhlakul karimah, makan siang bersama, dan aktivitas sore terbimbing.
              </p>
            </div>

            {/* Quota Progress */}
            <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600">Keterisian Kuota Fullday</span>
                <span className="font-black text-indigo-700">{fulldayTotal} / {fulldayQuota} Siswa ({fulldayPercent}%)</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    isFulldayFull ? 'bg-rose-500' : 'bg-gradient-to-r from-indigo-500 to-blue-600'
                  }`}
                  style={{ width: `${fulldayPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
              <span>Target Hafalan Juz 30 + Surat Pilihan</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
              <span>Maksimal 30 siswa per kelas untuk bimbingan intensif</span>
            </div>
          </div>
        </div>

        {/* Card 2: Kelas Regular */}
        <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-5 relative overflow-hidden">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-extrabold uppercase tracking-wider">
                <School size={12} />
                <span>Program Standar Nasional</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                Tersedia
              </span>
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight font-headline">
                Kelas Regular Madrasah
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                Kurikulum terakreditasi A Kemenag dan Kemendikbudristek dengan pembiasaan sholat dhuha/dzuhur berjamaah dan kegiatan ekstrakurikuler.
              </p>
            </div>

            {/* Quota Progress */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600">Keterisian Kuota Regular</span>
                <span className="font-black text-blue-700">{regularTotal} / {regularQuota} Siswa ({regularPercent}%)</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-teal-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${regularPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
              <span>Kurikulum lengkap mata pelajaran umum &amp; agama</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
              <span>Tenaga pendidik berkompeten &amp; fasilitas madrasah lengkap</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
