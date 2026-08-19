'use client'

import React, { useState, useEffect, useRef } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase/client'

// Helper for Indonesian date
const getIndonesianDate = () => {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  
  const d = new Date()
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

const formatTime = (isoString?: string | null) => {
  if (!isoString) return '-'
  const validIso = (!isoString.endsWith('Z') && !isoString.includes('+')) ? `${isoString}Z` : isoString
  const d = new Date(validIso)
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
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

type StaffAttendance = {
  id: string
  name: string
  position: string
  attendance?: {
    check_in_time?: string
    check_out_time?: string
    status?: string
  } | null
}

export default function AbsenPage() {
  const [mounted, setMounted] = useState(false)
  const [time, setTime] = useState(new Date())
  const [popup, setPopup] = useState<PopupData>({ type: 'idle', message: '' })
  const popupTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const [nfcSupported, setNfcSupported] = useState(false)
  const [nfcActive, setNfcActive] = useState(false)
  
  const [staffs, setStaffs] = useState<StaffAttendance[]>([])
  const [totalStaff, setTotalStaff] = useState(0)
  const [presentStaff, setPresentStaff] = useState(0)

  // --- showPopup defined early so refs & effects can use it ---
  const showPopupRef = useRef<(data: PopupData) => void>(() => {})
  
  const showPopup = (data: PopupData) => {
    setPopup(data)
    if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current)
    popupTimeoutRef.current = setTimeout(() => {
      setPopup({ type: 'idle', message: '' })
    }, 1000)
  }
  const closePopup = () => setPopup({ type: 'idle', message: '' })

  // Always keep ref pointing to latest showPopup
  showPopupRef.current = showPopup

  const clientIdRef = useRef(Math.random().toString(36).substring(7))
  const broadcastChannelRef = useRef<any>(null)

  const fetchAttendanceList = async () => {
    try {
      const today = new Date()
      const offset = 7 * 60 * 60 * 1000 // UTC+7
      const localDate = new Date(today.getTime() + offset)
      const dateStr = localDate.toISOString().split('T')[0]
      
      const res = await fetch(`/api/attendance/guru?date=${dateStr}&filter=hari&_t=${Date.now()}`)
      const data = await res.json()
      
      if (data.success && data.data) {
        const allStaffs = data.data
        setTotalStaff(allStaffs.length)
        
        // Filter those who are present today (checked in)
        const presentList = allStaffs.filter((s: any) => s.attendance && s.attendance.check_in_time)
        // Sort by most recently checked in first
        presentList.sort((a: any, b: any) => {
           const timeA = new Date(a.attendance.check_in_time).getTime()
           const timeB = new Date(b.attendance.check_in_time).getTime()
           return timeB - timeA
        })
        
        setPresentStaff(presentList.length)
        setStaffs(presentList)
      }
    } catch (err) {
      console.error('Error fetching attendance list', err)
    }
  }

  // Realtime clock & Mount
  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setTime(new Date()), 1000)
    if ('NDEFReader' in window) setNfcSupported(true)
    
    fetchAttendanceList()
    
    return () => clearInterval(timer)
  }, [])

  // ================================================================
  // Supabase Realtime Broadcast (Replaces BroadcastChannel & DB listener)
  // Works seamlessly across subdomains, tabs, and devices.
  // ================================================================
  useEffect(() => {
    const channel = supabase.channel('mia-attendance-sync')
    
    channel
      .on(
        'broadcast',
        { event: 'scan_result' },
        (payload) => {
          const data = payload.payload
          if (data.sender === clientIdRef.current) return // Ignore own broadcast
          
          showPopupRef.current({
            type: data.success ? 'success' : 'error',
            message: data.message,
            action: data.action,
            staff: data.staff
          })
          
          // Refresh list
          if (data.success) {
            fetchAttendanceList()
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          broadcastChannelRef.current = channel
        }
      })
      
    return () => { supabase.removeChannel(channel) }
  }, [])

  const startNfcScan = async () => {
    try {
      // @ts-ignore
      const ndef = new window.NDEFReader()
      await ndef.scan()
      setNfcActive(true)
      // @ts-ignore
      ndef.addEventListener('reading', ({ serialNumber }: any) => {
        if (serialNumber) {
          const cleanRfid = serialNumber.replace(/:/g, '').toUpperCase()
          processRFID(cleanRfid)
        }
      })
      // @ts-ignore
      ndef.addEventListener('readingerror', () => {
        showPopup({ type: 'error', message: 'Gagal membaca kartu NFC. Coba dekatkan lagi.' })
      })
    } catch (error) {
      console.error(error)
      showPopup({ type: 'error', message: 'NFC tidak diizinkan atau tidak didukung.' })
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
      
      const popupPayload: PopupData = data.success
        ? { type: 'success', message: data.message, action: data.action, staff: data.staff }
        : { type: 'error', message: data.error || 'Absensi gagal, silakan coba lagi.', action: data.action }
      
      showPopup(popupPayload)
      
      if (data.success) {
        fetchAttendanceList()
      }
      
      // Broadcast via Supabase (Cross-subdomain, instant)
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.send({
          type: 'broadcast',
          event: 'scan_result',
          payload: {
            sender: clientIdRef.current,
            success: data.success,
            message: data.success ? data.message : (data.error || 'Absensi gagal'),
            action: data.action,
            staff: data.staff
          }
        })
      }

    } catch (error) {
      showPopup({ type: 'error', message: 'Koneksi ke server bermasalah.' })
    }
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

  if (!mounted) {
    return <div className="h-screen w-full bg-slate-900 relative overflow-hidden flex items-center justify-center" />
  }

  return (
    <main className="relative h-screen w-full overflow-hidden bg-white text-slate-800 font-sans flex flex-col md:flex-row">
      {/* LEFT SIDE - ATTENDANCE LIST */}
      <div className="w-full md:w-[35%] lg:w-[30%] min-w-[320px] max-w-md h-[40vh] md:h-full bg-white z-20 shadow-[10px_0_30px_rgba(0,0,0,0.1)] flex flex-col order-2 md:order-1 relative">
        <div className="p-6 lg:p-8 border-b border-slate-100 flex-shrink-0 bg-white">
          <h2 className="text-xl lg:text-2xl font-extrabold text-slate-800 tracking-tight">Daftar Kehadiran Dewan Guru</h2>
          <p className="text-slate-500 font-medium mt-2">Total Guru hadir <span className="font-bold text-slate-700">{presentStaff}/{totalStaff}</span></p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {staffs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <p>Belum ada data kehadiran hari ini</p>
            </div>
          ) : (
            staffs.map((staff, index) => (
              <div key={staff.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between transition-all hover:shadow-md animate-in slide-in-from-left-4 fade-in duration-300">
                <div className="flex items-center gap-4 w-full">
                  <div className="flex-shrink-0 w-6 text-center font-bold text-slate-300 text-lg">
                    {index + 1}.
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 text-sm truncate">{staff.name}</h3>
                    <p className="text-[11px] text-blue-600 font-medium truncate">{staff.position}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <div className="flex items-center justify-between w-[80px]">
                      <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Masuk</span>
                      <span className="text-xs font-semibold text-slate-700">{formatTime(staff.attendance?.check_in_time)}</span>
                    </div>
                    <div className="flex items-center justify-between w-[80px]">
                      <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">Keluar</span>
                      <span className="text-xs font-semibold text-slate-700">{formatTime(staff.attendance?.check_out_time)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT SIDE - SCANNER AREA */}
      <div className="flex-1 h-[60vh] md:h-full relative flex flex-col items-center justify-center text-white overflow-hidden order-1 md:order-2">
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
          <div className="mb-6 lg:mb-10 flex flex-col items-center animate-in slide-in-from-top-10 duration-700 fade-in">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logosmart/smartputihver.png" alt="Logo MI Attaqwa 15" className="h-30 lg:h-30 object-contain" />
          </div>

          {/* Titles */}
          <div className="text-center mb-6 animate-in slide-in-from-bottom-10 duration-700 delay-150 fade-in fill-mode-both">
            <h2 className="text-yellow-400 text-lg md:text-2xl font-bold tracking-widest uppercase mb-2">
              Absensi Dewan Guru
            </h2>
            <h1 className="text-white text-3xl md:text-5xl font-extrabold uppercase tracking-wide drop-shadow-lg">
              MI ATTAQWA 15 BABELAN
            </h1>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2 px-6 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md mb-8 lg:mb-12 animate-in zoom-in duration-700 delay-300 fade-in fill-mode-both">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <span className="text-base lg:text-lg font-medium">{getIndonesianDate()}</span>
          </div>

          {/* Clock */}
          <div className="flex gap-2 md:gap-4 lg:gap-6 text-5xl md:text-7xl lg:text-[8rem] font-bold tracking-tighter drop-shadow-2xl mb-12">
            <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 lg:p-8 flex items-center justify-center min-w-[70px] lg:min-w-[140px]">
              {time.getHours().toString().padStart(2, '0').charAt(0)}
            </div>
            <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 lg:p-8 flex items-center justify-center min-w-[70px] lg:min-w-[140px]">
              {time.getHours().toString().padStart(2, '0').charAt(1)}
            </div>
            <div className="text-white flex items-center justify-center -mt-2 lg:-mt-4 animate-pulse">:</div>
            <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 lg:p-8 flex items-center justify-center min-w-[70px] lg:min-w-[140px]">
              {time.getMinutes().toString().padStart(2, '0').charAt(0)}
            </div>
            <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 lg:p-8 flex items-center justify-center min-w-[70px] lg:min-w-[140px]">
              {time.getMinutes().toString().padStart(2, '0').charAt(1)}
            </div>
          </div>
        </div>

        {/* Footer Text & NFC Button */}
        <div className="absolute bottom-6 z-10 flex flex-col items-center gap-4 animate-in fade-in duration-1000 delay-500 fill-mode-both w-full px-4">
          {nfcSupported && !nfcActive && (
            <button 
              onClick={startNfcScan}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg font-medium tracking-wide transition transform hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 22V2c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v20c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1Z"/><path d="M6 12h12"/><path d="M12 2v.01"/><path d="M12 7v.01"/><path d="M12 17v.01"/></svg>
              Aktifkan Sensor NFC HP
            </button>
          )}
          
          {nfcActive && (
            <div className="px-5 py-2.5 bg-green-500/20 border border-green-500/50 text-green-400 rounded-xl font-medium flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              NFC Siaga: Tempelkan Kartu
            </div>
          )}

          <div className="text-slate-400 text-xs md:text-sm text-center">
            Harap hubungi administrator jika absensi <span className="text-yellow-400 font-medium">gagal / bermasalah</span>
          </div>
        </div>
      </div>

      {/* Popup Notification */}
      {popup.type !== 'idle' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white text-slate-900 rounded-3xl p-8 max-w-lg w-full shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-200">
            
            {popup.type === 'success' ? (
              <>
                <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-6">
                  <CheckCircle size={56} className="lg:w-16 lg:h-16" />
                </div>
                {popup.staff && (
                  <div className="flex flex-col items-center mb-6 w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={popup.staff.image || '/images/default-avatar.png'} 
                      alt={popup.staff.name}
                      onError={(e) => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(popup.staff?.name || 'G') + '&background=0D8ABC&color=fff' }}
                      className="w-28 h-28 lg:w-32 lg:h-32 rounded-full object-cover border-4 border-slate-100 shadow-md mb-4"
                    />
                    <h3 className="text-xl lg:text-2xl font-bold text-slate-800 text-center">{popup.staff.name}</h3>
                    <p className="text-blue-600 font-medium text-base lg:text-lg">{popup.staff.position}</p>
                  </div>
                )}
                <div className="bg-green-50 text-green-700 px-6 py-3 rounded-xl font-semibold text-lg lg:text-xl text-center w-full">
                  {popup.action === 'check-in' ? 'BERHASIL ABSEN MASUK' : 'BERHASIL ABSEN PULANG'}
                </div>
                <div className="mt-4 text-slate-500 font-medium text-sm lg:text-base">
                  {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-6">
                  <XCircle size={56} className="lg:w-16 lg:h-16" />
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-slate-800 text-center mb-2">Absensi Gagal</h3>
                <p className="text-slate-600 text-center text-base lg:text-lg mb-6">{popup.message}</p>
                <div className="bg-red-50 text-red-700 px-6 py-3 rounded-xl font-semibold text-base lg:text-lg text-center w-full">
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
