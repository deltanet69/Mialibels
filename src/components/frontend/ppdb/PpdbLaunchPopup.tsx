'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'

type Props = {
  mode: 'countdown' | 'closed'
  year: string
  openAtMs: number
  initialNow: number
  getNow: () => number
  onElapsed: () => void
  onClose?: () => void
  closeNote?: string
  totalQuota: number
  fulldayQuota: number
  regularQuota: number
  docs: string[]
}

const pad = (n: number) => String(n).padStart(2, '0')

const openAtLabel = (ms: number) =>
  new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta'
  }).format(ms).replace(/\./g, '.') + ' WIB'

// Precision Timer Tile - Clean, Modern & Purposeful
function CountdownTile({
  value,
  label,
  accent = false
}: {
  value: string
  label: string
  accent?: boolean
}) {
  return (
    <div
      className={`relative flex-1 min-w-0 flex flex-col items-center justify-center py-4 sm:py-5 px-2 rounded-2xl transition-transform select-none ${
        accent ? 'bg-[#002957] border-2 border-amber-400/90 shadow-md' : 'bg-[#002957] shadow-md'
      }`}
    >
      {/* Digit Display */}
      <span
        key={value}
        className={`launch-digit block text-4xl sm:text-6xl font-black tabular-nums tracking-tight font-headline leading-none ${
          accent ? 'text-amber-400' : 'text-white'
        }`}
      >
        {value}
      </span>

      {/* Sublabel */}
      <span
        className={`mt-2 block text-xs sm:text-sm font-bold uppercase tracking-wider ${
          accent ? 'text-amber-300 font-extrabold' : 'text-blue-200'
        }`}
      >
        {label}
      </span>
    </div>
  )
}

export default function PpdbLaunchPopup({
  mode,
  year,
  openAtMs,
  initialNow,
  getNow,
  onElapsed,
  onClose,
  closeNote,
  totalQuota,
  fulldayQuota,
  regularQuota,
  docs
}: Props) {
  const [now, setNow] = useState(initialNow)

  useEffect(() => {
    if (mode !== 'countdown') return
    const id = setInterval(() => {
      const n = getNow()
      setNow(n)
      if (n >= openAtMs) {
        clearInterval(id)
        onElapsed()
      }
    }, 1000)
    return () => clearInterval(id)
  }, [mode, openAtMs, getNow, onElapsed])

  useEffect(() => {
    if (!onClose) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  // Kunci scroll halaman selama modal aktif
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const left = Math.max(0, openAtMs - now)
  const s = Math.floor(left / 1000)
  const days = Math.floor(s / 86400)
  const hours = Math.floor((s % 86400) / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  const seconds = s % 60

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="launch-title"
      onClick={(e) => {
        if (onClose && e.target === e.currentTarget) onClose()
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/75 backdrop-blur-sm font-sans antialiased"
    >
      <style>{`
        @keyframes popup-rise {
          from { opacity: 0; transform: scale(0.96) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes digit-tick {
          from { opacity: 0.6; transform: translateY(-2px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .launch-popup-card {
          animation: popup-rise 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .launch-digit {
          animation: digit-tick 0.2s ease-out;
        }
        @media (prefers-reduced-motion: reduce) {
          .launch-popup-card, .launch-digit { animation: none; }
        }
      `}</style>

      {/* Main Dialog Card */}
      <div className="launch-popup-card relative w-full max-w-xl bg-white text-slate-900 rounded-3xl shadow-2xl overflow-hidden my-auto border border-slate-100">
        
        {/* Close Button */}
        {onClose && (
          <button
            type="button"
            aria-label="Tutup"
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition cursor-pointer"
          >
            <X size={20} />
          </button>
        )}

        {/* Modal Body */}
        <div className="p-6 sm:p-9 space-y-6">
          
          {/* Logo Sekolah Resmi */}
          <div>
            <Image
              src="/logomi.png"
              alt="Logo MI Attaqwa 15 Babelan"
              width={594}
              height={138}
              priority
              className="h-11 sm:h-13 w-auto object-contain"
            />
          </div>

          {/* Headline */}
          <div>
            <h2
              id="launch-title"
              className="text-2xl sm:text-4xl font-black tracking-tight text-[#002957] font-headline leading-tight"
            >
              SPMB Tahun Ajaran {year}
            </h2>
          </div>

          {/* ════════════════════════════════════════════════════════════════
              MODE 1: COUNTDOWN POPUP
             ════════════════════════════════════════════════════════════════ */}
          {mode === 'countdown' ? (
            <div className="space-y-6">
              
              {/* Subheadline: Waktu Pembukaan */}
              <div>
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Akan dibuka secara umum pada:
                </p>
                <p className="mt-1 text-base sm:text-lg font-bold text-slate-800">
                  {openAtLabel(openAtMs)}
                </p>
              </div>

              {/* Countdown Display */}
              <div
                className={`grid gap-2 sm:gap-3 ${
                  days > 0 ? 'grid-cols-4' : 'grid-cols-3'
                }`}
                role="timer"
                aria-label="Hitung mundur pembukaan SPMB"
              >
                {days > 0 && <CountdownTile value={pad(days)} label="hari" />}
                <CountdownTile value={pad(hours)} label="jam" />
                <CountdownTile value={pad(minutes)} label="menit" />
                <CountdownTile value={pad(seconds)} label="detik" accent />
              </div>

              {/* Notes: Dokumen yang Dibutuhkan */}
              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed border-t border-slate-100 pt-5">
                <p className="font-bold text-slate-900">
                  Harap persiapkan dokumen yang dibutuhkan untuk pendaftaran:
                </p>
                <p className="text-slate-600 mt-1">
                  {docs.join(' • ')}
                </p>
              </div>

            </div>
          ) : (
            /* ════════════════════════════════════════════════════════════════
               MODE 2: KUOTA TERPENUHI (CLOSED) POPUP
               ════════════════════════════════════════════════════════════════ */
            <div className="space-y-6">
              
              {/* Subheadline */}
              <div>
                <p className="text-base sm:text-xl font-bold text-slate-800">
                  Alhamdulillah, kuota SPMB sudah terpenuhi
                </p>
              </div>

              {/* Highlight Text Hero Banner */}
              <div className="rounded-2xl bg-[#002957] px-6 py-8 sm:py-10 text-center shadow-md">
                <span className="block text-6xl sm:text-8xl font-black text-amber-400 font-headline tracking-tight leading-none">
                  {totalQuota} Siswa
                </span>
              </div>

              {/* Notes: Rincian Kuota Kelas */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <p className="text-base sm:text-lg font-bold text-slate-800">
                  Kelas Full day {fulldayQuota} | Kelas Regular {regularQuota}
                </p>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Pendaftaran ditutup karena seluruh kuota telah terpenuhi. Jika ada berkas calon siswa yang tidak memenuhi syarat verifikasi atau mengundurkan diri, kuota akan dibuka kembali secara otomatis.
                </p>
                {closeNote && <p className="text-sm font-semibold text-slate-800">{closeNote}</p>}
              </div>

            </div>
          )}

        </div>

        {/* Footer Resmi */}
        <div className="bg-[#002957] px-6 sm:px-9 py-4 text-white flex flex-col sm:flex-row items-center justify-between gap-1 text-center sm:text-left">
          <p className="text-xs sm:text-sm font-bold">
            Panitia SPMB Online Tahun Ajaran {year}
          </p>
          <p className="text-xs sm:text-sm text-blue-200 font-medium">
            MI Attaqwa 15 Babelan
          </p>
        </div>

      </div>
    </div>
  )
}
