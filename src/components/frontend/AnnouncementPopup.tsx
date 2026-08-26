'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { X, ArrowUpRight, Megaphone, Calendar } from 'lucide-react'
import Link from 'next/link'

type Banner = {
  id: string
  title: string
  description?: string | null
  image: string
  link?: string | null
  is_active: boolean
  start_date?: string | null
  end_date?: string | null
  target_pages?: string | null
}

export default function AnnouncementPopup() {
  const pathname = usePathname()
  const [activeBanner, setActiveBanner] = useState<Banner | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [hasDismissed, setHasDismissed] = useState(false)

  const checkAndShowBanner = useCallback(async () => {
    try {
      const res = await fetch(`/api/banners/active?path=${encodeURIComponent(pathname)}&_t=${Date.now()}`)
      const data = await res.json()

      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        // Find the first banner that hasn't been dismissed in this session
        const firstUndismissed = data.data.find((b: Banner) => {
          try {
            return !sessionStorage.getItem(`dismissed_banner_${b.id}`)
          } catch (e) {
            return true
          }
        })

        if (firstUndismissed) {
          setActiveBanner(firstUndismissed)

          // 3-second delay according to specification
          const timer = setTimeout(() => {
            setIsOpen(true)
          }, 3000)

          return () => clearTimeout(timer)
        }
      }
    } catch (err) {
      console.error('Failed to fetch announcement popup:', err)
    }
  }, [pathname])

  useEffect(() => {
    // Only run for public frontend pages (skip if somehow mounted on admin)
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/login') || pathname.startsWith('/portal')) {
      return
    }

    setIsOpen(false)
    const cleanup = checkAndShowBanner()
    return () => {
      if (cleanup && typeof (cleanup as any).then === 'function') {
        (cleanup as any).then((c: any) => c && c())
      }
    }
  }, [pathname, checkAndShowBanner])

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const handleClose = () => {
    if (activeBanner) {
      try {
        sessionStorage.setItem(`dismissed_banner_${activeBanner.id}`, 'true')
      } catch (e) {}
    }
    setIsOpen(false)
  }

  if (!isOpen || !activeBanner) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 font-sans animate-in fade-in duration-300">
      
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div 
        className="relative bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-lg border border-white/20 z-10 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] my-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="popup-title"
      >
        {/* Floating Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-30 w-9 h-9 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-md transition-transform hover:scale-105 shadow-md cursor-pointer"
          aria-label="Tutup Pengumuman"
          title="Tutup (Esc)"
        >
          <X size={18} />
        </button>

        {/* Scrollable Container */}
        <div className="overflow-y-auto custom-scrollbar flex flex-col">
          
          {/* Banner Media Container with dynamic aspect ratio */}
          <div className="relative w-full bg-slate-950 flex items-center justify-center overflow-hidden min-h-[220px] max-h-[420px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeBanner.image}
              alt={activeBanner.title}
              className="w-full h-full object-contain max-h-[420px]"
            />
          </div>

          {/* Banner Details */}
          <div className="p-5 sm:p-6 space-y-3.5 bg-white">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100 uppercase tracking-wider">
                <Megaphone size={12} />
                <span>Pengumuman</span>
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                MI Attaqwa 15 Babelan
              </span>
            </div>

            <h3 id="popup-title" className="font-sans font-extrabold text-lg sm:text-xl text-slate-900 leading-snug tracking-tight">
              {activeBanner.title}
            </h3>

            {activeBanner.description && (
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {activeBanner.description}
              </p>
            )}

            {/* Action CTA & Close Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
              {activeBanner.link && (
                <Link
                  href={activeBanner.link}
                  onClick={handleClose}
                  className="w-full sm:flex-1 py-3 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition cursor-pointer"
                >
                  <span>Lihat Selengkapnya</span>
                  <ArrowUpRight size={15} />
                </Link>
              )}

              <button
                type="button"
                onClick={handleClose}
                className={`w-full py-3 px-5 rounded-2xl text-xs sm:text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer ${
                  activeBanner.link ? 'sm:w-auto' : ''
                }`}
              >
                Tutup
              </button>
            </div>

          </div>

        </div>
      </div>

    </div>
  )
}
