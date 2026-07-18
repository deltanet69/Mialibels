'use client'

import React, { useState, useEffect, useRef } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'

// Helper for Indonesian date
const getIndonesianDate = () => {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  
  const d = new Date()
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

type PopupData = {
  type: 'success' | 'error' | 'idle'
  message: string
  action?: 'check-in' | 'check-out' | 'already-checked-out'
  staff?: {
    name: string
    position: string
    image: string
  }
}

export default function AbsenPage() {
  const [time, setTime] = useState(new Date())
  const [popup, setPopup] = useState<PopupData>({ type: 'idle', message: '' })
  const popupTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const [nfcSupported, setNfcSupported] = useState(false)
  const [nfcActive, setNfcActive] = useState(false)

  // Realtime clock & NFC check
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    
    // Check NFC Support
    if ('NDEFReader' in window) {
      setNfcSupported(true)
    }

    return () => clearInterval(timer)
  }, [])

  const startNfcScan = async () => {
    try {
      // @ts-ignore - NDEFReader is not in standard TS DOM lib yet
      const ndef = new window.NDEFReader()
      await ndef.scan()
      setNfcActive(true)

      // @ts-ignore
      ndef.addEventListener('reading', ({ serialNumber }) => {
        if (serialNumber) {
          // Typically serial number is e.g. "04:a1:b2:c3:d4:e5:f6"
          // We can strip colons or convert to decimal. 
          // For now, let's just send the raw serial number or stripped hex
          const cleanRfid = serialNumber.replace(/:/g, '').toUpperCase()
          
          // Some USB scanners output decimal. If they stored decimal, we can try to convert the first 4 bytes to dec:
          // e.g. parseInt(cleanRfid.substring(0,8), 16).toString().padStart(10, '0')
          // But to be safe, let's send both or just cleanRfid and let the backend/user handle matching.
          // Let's assume the user will input exactly what the scanner gives.
          // For simplicity, we just send cleanRfid. If it fails, they can register the cleanRfid in DB.
          
          processRFID(cleanRfid)
        }
      })
      
      // @ts-ignore
      ndef.addEventListener('readingerror', () => {
        showPopup({
          type: 'error',
          message: 'Gagal membaca kartu NFC. Coba dekatkan lagi.'
        })
      })

    } catch (error) {
      console.error(error)
      showPopup({
        type: 'error',
        message: 'NFC tidak diizinkan atau tidak didukung di perangkat ini.'
      })
    }
  }

  const processRFID = async (rfid: string) => {
    try {
      const res = await fetch('/api/attendance/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rfid })
      })
      const data = await res.json()
      
      if (data.success) {
        showPopup({
          type: 'success',
          message: data.message,
          action: data.action,
          staff: data.staff
        })
      } else {
        showPopup({
          type: 'error',
          message: data.error || 'Absensi gagal, silakan coba lagi.',
          action: data.action
        })
      }
    } catch (error) {
      showPopup({
        type: 'error',
        message: 'Koneksi ke server bermasalah.'
      })
    }
  }

  const showPopup = (data: PopupData) => {
    setPopup(data)
    if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current)
    
    popupTimeoutRef.current = setTimeout(() => {
      setPopup({ type: 'idle', message: '' })
    }, 3000) // 3 seconds timeout
  }

  // Auto RFID Scanner listener
  useEffect(() => {
    let rfidBuffer = ''
    let lastKeyTime = Date.now()
    let scanTimeoutId: NodeJS.Timeout

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore inputs (just in case)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      const currentTime = Date.now()

      // Reset buffer if delay is too long (human typing vs scanner)
      // Usually scanner types very fast (< 50ms per key)
      if (currentTime - lastKeyTime > 200) {
        rfidBuffer = ''
      }

      lastKeyTime = currentTime
      clearTimeout(scanTimeoutId)

      if (e.key === 'Enter') {
        if (rfidBuffer.length > 0) {
          processRFID(rfidBuffer)
          rfidBuffer = ''
        }
        return
      }

      if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
        rfidBuffer += e.key

        // Auto submit if no new key within 100ms
        scanTimeoutId = setTimeout(() => {
          if (rfidBuffer.length >= 5) {
            processRFID(rfidBuffer)
            rfidBuffer = ''
          }
        }, 100)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      clearTimeout(scanTimeoutId)
    }
  }, [])

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-slate-900 text-white font-sans flex flex-col items-center justify-center">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <video 
          src="/vid/bgvid.mp4" 
          autoPlay 
          loop 
          muted 
          playsInline
          className="object-cover w-full h-full opacity-60"
        />
        <div className="absolute inset-0 bg-blue-900/40 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-slate-900/80" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full px-4">
        {/* Logo */}
        <div className="mb-10 flex flex-col items-center animate-in slide-in-from-top-10 duration-700 fade-in">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logoputih.png" alt="Logo MI Attaqwa 15" className="h-16 md:h-12 mb-10 object-contain" />
        </div>

        {/* Titles */}
        <div className="text-center mb-6 animate-in slide-in-from-bottom-10 duration-700 delay-150 fade-in fill-mode-both">
          <h2 className="text-yellow-400 text-2xl md:text-3xl font-bold tracking-widest uppercase mb-2">
            Absensi Dewan Guru
          </h2>
          <h1 className="text-white text-4xl md:text-6xl font-extrabold uppercase tracking-wide drop-shadow-lg">
            MI ATTAQWA 15 BABELAN - BEKASI
          </h1>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 px-6 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md mb-20 animate-in zoom-in duration-700 delay-300 fade-in fill-mode-both">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
          <span className="text-lg font-medium">{getIndonesianDate()}</span>
        </div>

        {/* Clock */}
        <div className="flex gap-4 md:gap-6 text-6xl md:text-[9rem] font-bold tracking-tighter drop-shadow-2xl mb-16">
          <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-8 flex items-center justify-center min-w-[100px] md:min-w-[180px]">
            {time.getHours().toString().padStart(2, '0').charAt(0)}
          </div>
          <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-8 flex items-center justify-center min-w-[100px] md:min-w-[180px]">
            {time.getHours().toString().padStart(2, '0').charAt(1)}
          </div>
          <div className="text-white flex items-center justify-center -mt-4 animate-pulse">:</div>
          <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-8 flex items-center justify-center min-w-[100px] md:min-w-[180px]">
            {time.getMinutes().toString().padStart(2, '0').charAt(0)}
          </div>
          <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-8 flex items-center justify-center min-w-[100px] md:min-w-[180px]">
            {time.getMinutes().toString().padStart(2, '0').charAt(1)}
          </div>
        </div>
      </div>

      {/* Footer Text & NFC Button */}
      <div className="absolute bottom-8 z-10 flex flex-col items-center gap-4 animate-in fade-in duration-1000 delay-500 fill-mode-both">
        {nfcSupported && !nfcActive && (
          <button 
            onClick={startNfcScan}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg font-medium tracking-wide transition transform hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22V2c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v20c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1Z"/><path d="M6 12h12"/><path d="M12 2v.01"/><path d="M12 7v.01"/><path d="M12 17v.01"/></svg>
            Aktifkan Sensor NFC HP
          </button>
        )}
        
        {nfcActive && (
          <div className="px-6 py-3 bg-green-500/20 border border-green-500/50 text-green-400 rounded-xl font-medium flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            NFC Siaga: Tempelkan Kartu
          </div>
        )}

        <div className="text-slate-400 text-sm md:text-base">
          Harap hubungi administrator jika absensi <span className="text-yellow-400 font-medium">gagal / bermasalah</span>
        </div>
      </div>

      {/* Popup Notification */}
      {popup.type !== 'idle' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white text-slate-900 rounded-3xl p-8 max-w-lg w-full shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-200">
            
            {popup.type === 'success' ? (
              <>
                <div className="w-24 h-24 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-6">
                  <CheckCircle size={64} />
                </div>
                {popup.staff && (
                  <div className="flex flex-col items-center mb-6 w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={popup.staff.image || '/images/default-avatar.png'} 
                      alt={popup.staff.name}
                      onError={(e) => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(popup.staff?.name || 'G') + '&background=0D8ABC&color=fff' }}
                      className="w-32 h-32 rounded-full object-cover border-4 border-slate-100 shadow-md mb-4"
                    />
                    <h3 className="text-2xl font-bold text-slate-800 text-center">{popup.staff.name}</h3>
                    <p className="text-blue-600 font-medium text-lg">{popup.staff.position}</p>
                  </div>
                )}
                <div className="bg-green-50 text-green-700 px-6 py-3 rounded-xl font-semibold text-xl text-center w-full">
                  {popup.action === 'check-in' ? 'BERHASIL CHECK-IN' : 'BERHASIL CHECK-OUT'}
                </div>
                <div className="mt-4 text-slate-500 font-medium">
                  {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
                </div>
              </>
            ) : (
              <>
                <div className="w-24 h-24 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-6">
                  <XCircle size={64} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 text-center mb-2">Absensi Gagal</h3>
                <p className="text-slate-600 text-center text-lg mb-6">{popup.message}</p>
                <div className="bg-red-50 text-red-700 px-6 py-3 rounded-xl font-semibold text-lg text-center w-full">
                  SILAKAN COBA LAGI
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </main>
  )
}
