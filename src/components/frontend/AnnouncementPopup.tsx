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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 font-sans animate-in fade-in duration-300 overflow-y-auto">
      
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div 
        className="relative bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl w-full max-w-lg border border-slate-200/80 z-10 animate-in zoom-in-95 duration-300 flex flex-col max-h-[min(92dvh,92vh)] my-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="popup-title"
      >
        {/* Floating Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-2.5 right-2.5 z-30 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-md transition-transform hover:scale-105 shadow-md cursor-pointer shrink-0"
          aria-label="Tutup Pengumuman"
          title="Tutup (Esc)"
        >
          <X size={16} className="sm:w-[18px] sm:h-[18px]" />
        </button>

        {/* Scrollable Container */}
        <div className="overflow-y-auto custom-scrollbar flex flex-col flex-1">
          
          {/* Banner Media Container with responsive max height */}
          <div className="relative w-full bg-slate-950 flex items-center justify-center overflow-hidden max-h-[28vh] sm:max-h-[360px] min-h-[130px] shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeBanner.image}
              alt={activeBanner.title}
              className="w-full h-full object-contain max-h-[28vh] sm:max-h-[360px]"
            />
          </div>

          {/* Banner Details */}
          <div className="p-4 sm:p-6 space-y-3 bg-white flex-1 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] sm:text-xs font-bold border border-blue-100 uppercase tracking-wider">
                  <Megaphone size={11} />
                  <span>Pengumuman</span>
                </span>
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400">
                  MI Attaqwa 15 Babelan
                </span>
              </div>

              <h3 id="popup-title" className="font-sans font-extrabold text-base sm:text-lg md:text-xl text-slate-900 leading-snug tracking-tight break-words">
                {activeBanner.title}
              </h3>

              {activeBanner.description && (
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed break-words">
                  {activeBanner.description}
                </p>
              )}
            </div>

            {/* Action CTA & Close Button */}
            <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {activeBanner.link && (
                <Link
                  href={activeBanner.link}
                  onClick={handleClose}
                  className="w-full sm:flex-1 py-2.5 sm:py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 transition cursor-pointer text-center"
                >
                  <span>Lihat Selengkapnya</span>
                  <ArrowUpRight size={14} />
                </Link>
              )}

              <button
                type="button"
                onClick={handleClose}
                className={`w-full py-2.5 sm:py-3 px-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer text-center ${
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
