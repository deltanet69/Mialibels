'use client'

import React from 'react'
import { Calendar, Users, ArrowRight, Flame, Clock, CheckCircle2 } from 'lucide-react'

type BatchStats = {
  total: number
  approved: number
  quota: number
  isFull: boolean
}

type PpdbBatchQuotasProps = {
  settings: {
    academic_year: string
    is_active: boolean
    active_batch: number
    batch_1_name?: string
    batch_1_period?: string
    batch_1_quota: number
    batch_2_name?: string
    batch_2_period?: string
    batch_2_quota: number
    batch_3_name?: string
    batch_3_period?: string
    batch_3_quota: number
    stats?: {
      total: number
      batch1: BatchStats
      batch2: BatchStats
      batch3: BatchStats
    }
  }
  onRegisterClick?: () => void
}

export default function PpdbBatchQuotas({ settings, onRegisterClick }: PpdbBatchQuotasProps) {
  const activeBatch = settings.active_batch || 1

  const batches = [
    {
      number: 1,
      name: settings.batch_1_name || 'Gelombang 1 (Batch 1)',
      period: settings.batch_1_period || 'September – November',
      quota: settings.batch_1_quota || 75,
      stats: settings.stats?.batch1 || { total: 0, approved: 0, quota: 75, isFull: false },
      isActive: activeBatch === 1 && settings.is_active,
      isPassed: activeBatch > 1
    },
    {
      number: 2,
      name: settings.batch_2_name || 'Gelombang 2 (Batch 2)',
      period: settings.batch_2_period || 'Desember – Februari',
      quota: settings.batch_2_quota || 75,
      stats: settings.stats?.batch2 || { total: 0, approved: 0, quota: 75, isFull: false },
      isActive: activeBatch === 2 && settings.is_active,
      isPassed: activeBatch > 2
    },
    {
      number: 3,
      name: settings.batch_3_name || 'Gelombang 3 (Batch 3)',
      period: settings.batch_3_period || 'Maret – Mei',
      quota: settings.batch_3_quota || 75,
      stats: settings.stats?.batch3 || { total: 0, approved: 0, quota: 75, isFull: false },
      isActive: activeBatch === 3 && settings.is_active,
      isPassed: false
    }
  ]

  return (
    <div className="font-sans w-full space-y-4 sm:space-y-5">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[11px] font-bold uppercase tracking-wider mb-1.5">
            <Users size={13} />
            <span>Skema Gelombang &amp; Kuota Siswa</span>
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Jadwal &amp; Kuota Penerimaan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Penerimaan dibagi dalam 3 gelombang dengan kuota maksimal <strong>75 pendaftar per batch</strong>.
          </p>
        </div>

        {settings.is_active && onRegisterClick && (
          <button
            onClick={onRegisterClick}
            className="btn-tactile hidden sm:inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm shadow-blue-600/20 transition cursor-pointer shrink-0"
          >
            <span>Daftar Batch {activeBatch}</span>
            <ArrowRight size={14} />
          </button>
        )}
      </div>

      {/* 3 Batch Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {batches.map((b) => {
          const filled = b.stats.total || 0
          const percent = Math.min(Math.round((filled / b.quota) * 100), 100)
          const isFull = filled >= b.quota

          return (
            <div
              key={b.number}
              className={`rounded-2xl p-5 sm:p-6 border transition-all relative overflow-hidden flex flex-col justify-between ${
                b.isActive 
                  ? 'bg-gradient-to-b from-white to-blue-50/50 border-blue-500 shadow-md shadow-blue-500/10 ring-2 ring-blue-500/20' 
                  : 'bg-white border-slate-200/80 shadow-2xs hover:shadow-xs'
              }`}
            >
              {/* Top active flame badge */}
              {b.isActive && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white px-3.5 py-1 rounded-bl-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  <Flame size={12} className="text-amber-300 fill-amber-300" />
                  <span>Sedang Dibuka</span>
                </div>
              )}

              <div className="space-y-3">
                {/* Batch Badge & Period */}
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-extrabold ${
                    b.isActive 
                      ? 'bg-blue-600 text-white' 
                      : b.isPassed 
                        ? 'bg-slate-100 text-slate-500' 
                        : 'bg-slate-100 text-slate-700'
                  }`}>
                    Batch {b.number}
                  </span>
                  
                  {isFull && (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                      Kuota Penuh
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    {b.name}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mt-1">
                    <Calendar size={13} className="text-slate-400 shrink-0" />
                    <span>{b.period}</span>
                  </div>
                </div>

                {/* Quota Progress Bar */}
                <div className="pt-2 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-600">Pendaftar Masuk</span>
                    <span className="font-extrabold text-slate-900">
                      {filled} <span className="text-slate-400 font-normal">/ {b.quota} Kuota</span>
                    </span>
                  </div>

                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 rounded-full ${
                        isFull 
                          ? 'bg-rose-500' 
                          : b.isActive 
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600' 
                            : 'bg-slate-300'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-400">
                    <span>{b.quota - filled > 0 ? `Sisa ${b.quota - filled} kursi` : 'Penuh'}</span>
                    <span className="font-bold text-slate-700">{percent}% Terisi</span>
                  </div>
                </div>
              </div>

              {/* Card Footer status indicator */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  {b.isActive 
                    ? 'Pendaftaran aktif online' 
                    : b.isPassed 
                      ? 'Gelombang telah ditutup' 
                      : 'Gelombang mendatang'}
                </span>
                
                {b.isActive ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                )}
              </div>

            </div>
          )
        })}
      </div>

    </div>
  )
}
