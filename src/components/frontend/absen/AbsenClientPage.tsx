'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { 
  CheckCircle2, 
  XCircle, 
  Users, 
  Clock, 
  Wifi, 
  Search, 
  UserCheck, 
  UserX, 
  GraduationCap, 
  Sparkles,
  ShieldCheck,
  Briefcase,
  Sun,
  Sunset,
  Award,
  Layers,
  CheckCircle,
  Timer
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { isAfternoonClass } from '@/config/attendanceRules'

// Helper for Indonesian date
const getIndonesianDate = () => {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  
  const d = new Date()
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

const formatTime = (isoString?: string | null) => {
  if (!isoString) return '-'
  if (isoString.includes(':') && isoString.length <= 8) {
    return isoString.substring(0, 5)
  }
  try {
    const validIso = (!isoString.endsWith('Z') && !isoString.includes('+')) ? `${isoString}Z` : isoString
    const d = new Date(validIso)
    if (isNaN(d.getTime())) return isoString
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  } catch (e) {
    return String(isoString)
  }
}

type PopupData = {
  type: 'success' | 'error' | 'idle'
  message: string
  action?: 'check-in' | 'check-out' | 'already-checked-out' | 'too-early-checkout'
  staff?: {
    id?: string
    name: string
    position?: string
    image?: string
    status?: string
    is_late?: boolean
    shift?: string
  }
}

type StaffAttendance = {
  id: string
  name: string
  position: string
  image?: string | null
  attendance?: {
    check_in_time?: string
    check_out_time?: string
    status?: string
    notes?: string
  } | null
}

export default function AbsenClientPage() {
  const [mounted, setMounted] = useState(false)
  const [time, setTime] = useState(new Date())
  const [popup, setPopup] = useState<PopupData>({ type: 'idle', message: '' })
  const popupTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const [nfcSupported, setNfcSupported] = useState(false)
  const [nfcActive, setNfcActive] = useState(false)
  
  const [allStaffs, setAllStaffs] = useState<StaffAttendance[]>([])
  const [lastScannedStaffId, setLastScannedStaffId] = useState<string | null>(null)

  // Filter tabs: 'HADIR' | 'BELUM_HADIR' | 'ALL'
  const [viewFilter, setViewFilter] = useState<'HADIR' | 'BELUM_HADIR' | 'ALL'>('HADIR')
  const [searchQuery, setSearchQuery] = useState('')

  const clientIdRef = useRef(Math.random().toString(36).substring(7))
  const broadcastChannelRef = useRef<any>(null)
  const showPopupRef = useRef<(data: PopupData) => void>(() => {})

  // Subtle audio chime feedback
  const playBeep = (isSuccess: boolean) => {
    try {
      if (typeof window === 'undefined') return
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContext) return
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)

      if (isSuccess) {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime) // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1) // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2) // G5
        gain.gain.setValueAtTime(0.25, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45)
        osc.start()
        osc.stop(ctx.currentTime + 0.45)
      } else {
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(220, ctx.currentTime)
        gain.gain.setValueAtTime(0.25, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35)
        osc.start()
        osc.stop(ctx.currentTime + 0.35)
      }
    } catch (e) {
      // Audio context might be restricted before interaction
    }
  }

  const showPopup = (data: PopupData) => {
    setPopup(data)
    playBeep(data.type === 'success')

    if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current)
    popupTimeoutRef.current = setTimeout(() => {
      setPopup({ type: 'idle', message: '' })
    }, 4000)
  }
  const closePopup = () => setPopup({ type: 'idle', message: '' })
  showPopupRef.current = showPopup

  const fetchAttendanceList = async () => {
    try {
      const today = new Date()
      const offset = 7 * 60 * 60 * 1000 // UTC+7
      const localDate = new Date(today.getTime() + offset)
      const dateStr = localDate.toISOString().split('T')[0]
      
      const res = await fetch(`/api/attendance/guru?date=${dateStr}&filter=hari&_t=${Date.now()}`)
      const data = await res.json()
      
      if (data.success && data.data) {
        setAllStaffs(data.data)
      }
    } catch (err) {
      console.error('Error fetching teacher attendance list', err)
    }
  }

  // Realtime clock & Mount
  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setTime(new Date()), 1000)
    if (typeof window !== 'undefined' && 'NDEFReader' in window) setNfcSupported(true)
    
    fetchAttendanceList()
    
    return () => clearInterval(timer)
  }, [])

  // Supabase Realtime Broadcast Listener
  useEffect(() => {
    try {
      const channel = supabase.channel('mia-attendance-sync')
      
      channel
        .on(
          'broadcast',
          { event: 'scan_result' },
          (payload) => {
            const data = payload.payload
            if (data.sender === clientIdRef.current) return

            showPopupRef.current({
              type: data.success ? 'success' : 'error',
              message: data.message,
              action: data.action,
              staff: data.staff
            })
            
            fetchAttendanceList()
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            broadcastChannelRef.current = channel
          }
        })
        
      return () => { supabase.removeChannel(channel) }
    } catch (e) {
      console.error('Realtime subscription error', e)
    }
  }, [])

  const startNfcScan = async () => {
    try {
      // @ts-ignore
      const ndef = new window.NDEFReader()
      await ndef.scan()
      setNfcActive(true)

      showPopup({
        type: 'idle',
        message: 'Sensor NFC HP Aktif! Silakan tempelkan kartu di punggung ponsel.'
      })

      const handleReading = async (event: any) => {
        const serialNumber = event.serialNumber
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate([80, 40, 80])
        }

        if (serialNumber) {
          const cleanRfid = serialNumber.replace(/[:\s-]/g, '').toUpperCase()
          processRFID(cleanRfid)
        } else {
          showPopup({ type: 'error', message: 'Kartu NFC terdeteksi tanpa serial number.' })
        }
      }

      // @ts-ignore
      ndef.onreading = handleReading
      // @ts-ignore
      ndef.addEventListener('reading', handleReading)

      // @ts-ignore
      ndef.onreadingerror = () => {
        showPopup({ type: 'error', message: 'Gagal membaca kartu NFC. Pastikan kartu menempel stabil.' })
      }
    } catch (error: any) {
      console.error(error)
      showPopup({ 
        type: 'error', 
        message: error.name === 'NotAllowedError' 
          ? 'Izin NFC ditolak pada browser.' 
          : 'Gagal mengaktifkan NFC (Pastikan NFC aktif di pengaturan HP & browser Chrome mendukung Web NFC).' 
      })
    }
  }

  // Lock to prevent rapid double scans
  const isScanningRef = useRef(false)
  const lastScannedRfidRef = useRef<{rfid: string, time: number}>({rfid: '', time: 0})

  const processRFID = async (rfid: string) => {
    const now = Date.now()
    if (isScanningRef.current) return
    if (lastScannedRfidRef.current.rfid === rfid && (now - lastScannedRfidRef.current.time) < 3000) {
      return
    }
    
    isScanningRef.current = true
    lastScannedRfidRef.current = { rfid, time: now }

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
      
      if (data.success && data.staff?.id) {
        setLastScannedStaffId(data.staff.id)
        setTimeout(() => setLastScannedStaffId(null), 8000)
      }

      showPopup(popupPayload)
      
      if (data.success) {
        fetchAttendanceList()
      }
      
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
    } finally {
      isScanningRef.current = false
    }
  }

  // Auto RFID Scanner listener (USB scanner)
  useEffect(() => {
    let rfidBuffer = ''
    let lastKeyTime = Date.now()
    let scanTimeoutId: NodeJS.Timeout

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      const currentTime = Date.now()
      if (currentTime - lastKeyTime > 200) {
        rfidBuffer = ''
      }

      lastKeyTime = currentTime
      clearTimeout(scanTimeoutId)

      if (e.key === 'Enter') {
        if (rfidBuffer.length > 0) {
          processRFID(rfidBuffer.trim().toUpperCase())
          rfidBuffer = ''
        }
        return
      }

      if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
        rfidBuffer += e.key

        scanTimeoutId = setTimeout(() => {
          if (rfidBuffer.length >= 5) {
            processRFID(rfidBuffer.trim().toUpperCase())
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

  // Categorize staff
  const presentList = useMemo(() => {
    const list = allStaffs.filter(s => s.attendance && s.attendance.check_in_time)
    return list.sort((a, b) => {
      const getValidTime = (iso?: string) => {
        if (!iso) return 0
        const validIso = (!iso.endsWith('Z') && !iso.includes('+')) ? `${iso}Z` : iso
        const d = new Date(validIso).getTime()
        return isNaN(d) ? 0 : d
      }
      return getValidTime(b.attendance?.check_in_time) - getValidTime(a.attendance?.check_in_time)
    })
  }, [allStaffs])

  const absentList = useMemo(() => {
    return allStaffs.filter(s => !s.attendance || !s.attendance.check_in_time)
  }, [allStaffs])

  const lateCount = useMemo(() => {
    return presentList.filter(s => (s.attendance?.status || '').toUpperCase() === 'TERLAMBAT').length
  }, [presentList])

  const onTimeCount = useMemo(() => {
    return presentList.filter(s => (s.attendance?.status || '').toUpperCase() === 'HADIR').length
  }, [presentList])

  // Filtered list to display
  const displayedStaffs = useMemo(() => {
    let list: StaffAttendance[] = []
    if (viewFilter === 'HADIR') list = presentList
    else if (viewFilter === 'BELUM_HADIR') list = absentList
    else list = allStaffs

    if (!searchQuery.trim()) return list
    const q = searchQuery.toLowerCase()
    return list.filter(s => 
      (s.name || '').toLowerCase().includes(q) || 
      (s.position || '').toLowerCase().includes(q)
    )
  }, [viewFilter, presentList, absentList, allStaffs, searchQuery])

  const totalStaffCount = allStaffs.length
  const presentCount = presentList.length
  const presentPercentage = totalStaffCount > 0 
    ? Math.round((presentCount / totalStaffCount) * 100) 
    : 0

  if (!mounted) {
    return <div className="h-screen w-full bg-[#060a12] flex items-center justify-center" />
  }

  return (
    <main className="min-h-screen md:h-screen md:max-h-screen w-full bg-[#060a12] text-slate-100 flex flex-col font-sans select-none overflow-y-auto md:overflow-hidden relative">
      
      {/* ──────────────────────────────────────────────────────────── */}
      {/* 1. BACKGROUND WITH ROYAL CYAN, SAPPHIRE & EMERALD GLOWS */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <video 
          src="/vid/bgvid.mp4" 
          autoPlay 
          loop 
          muted 
          playsInline
          className="object-cover w-full h-full opacity-15 scale-105 filter blur-[0.8px]"
        />
        {/* Deep Slate/Obsidian Overlay */}
        <div className="absolute inset-0 bg-[#060a12]/60 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#060a12] via-[#060a12]/85 to-[#08101e]/95" />
        
        {/* Eye-catching Electric Cyan & Sapphire Aurora Glows (NO YELLOW) */}
        <div className="absolute -top-32 left-1/4 w-[700px] h-[500px] bg-cyan-500/12 blur-[160px] rounded-full" />
        <div className="absolute -top-32 right-1/4 w-[700px] h-[500px] bg-indigo-600/15 blur-[160px] rounded-full" />
        <div className="absolute bottom-0 left-1/3 w-[800px] h-[350px] bg-emerald-500/10 blur-[180px] rounded-full" />
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 2. TOP EXECUTIVE HEADER - PRESTIGIOUS CYAN & SAPPHIRE THEME */}
      {/* ──────────────────────────────────────────────────────────── */}
      <header className="relative z-20 bg-[#0a1120]/95 backdrop-blur-xl border-b border-cyan-500/20 px-3 md:px-8 py-3 shadow-2xl flex-shrink-0">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-[1900px] mx-auto w-full">
          
          {/* Brand & Executive Identity */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto text-center sm:text-left">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/logosmart/smartputihver.png" 
              alt="Logo SMART MI Attaqwa 15" 
              className="h-11 md:h-13 object-contain filter drop-shadow-[0_2px_12px_rgba(6,182,212,0.25)] mx-auto sm:mx-0" 
            />
          </div>

          {/* Center: Live Digital Clock & Indonesian Date (Pure Cyan & Mint) */}
          <div className="flex flex-col items-center justify-center bg-[#060a12]/95 px-5 md:px-7 py-2 rounded-2xl border border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.12)] w-full sm:w-auto mt-2 md:mt-0">
            <div className="flex items-center gap-1.5 md:gap-2 text-xl md:text-3xl font-black tracking-tight text-white font-mono">
              <span className="text-white">{time.getHours().toString().padStart(2, '0')}</span>
              <span className="text-cyan-400 animate-pulse font-light">:</span>
              <span className="text-white">{time.getMinutes().toString().padStart(2, '0')}</span>
              <span className="text-cyan-400 animate-pulse font-light">:</span>
              <span className="text-cyan-300">{time.getSeconds().toString().padStart(2, '0')}</span>
              <span className="text-[9px] md:text-[11px] font-sans font-bold text-cyan-300 ml-1.5 px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30">WIB</span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-[11px] text-slate-300 font-medium mt-0.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{getIndonesianDate()}</span>
            </div>
          </div>

          {/* Right: Scanner Status & Total Hadir Pill */}
          <div className="flex flex-row flex-wrap justify-center sm:justify-end items-center gap-2.5 w-full md:w-auto mt-2 md:mt-0">
            
            {/* NFC Button if smartphone */}
            {nfcSupported && !nfcActive && (
              <button
                onClick={startNfcScan}
                className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-[10px] md:text-xs font-bold shadow-lg shadow-cyan-600/20 transition transform hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer border border-cyan-400/40"
              >
                <Wifi className="w-3.5 h-3.5" />
                NFC Smartphone
              </button>
            )}

            {/* Live Scanner Siaga Pill */}
            <div className="flex items-center gap-2.5 bg-emerald-950/80 border border-emerald-500/50 px-3 md:px-4 py-2 rounded-xl text-emerald-300 text-[10px] md:text-xs font-black shadow-lg shadow-emerald-950/50 backdrop-blur-md">
              <span className="relative flex h-2 md:h-2.5 w-2 md:w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
                <span className="relative inline-flex rounded-full h-2 md:h-2.5 w-2 md:w-2.5 bg-emerald-500"></span>
              </span>
              <span className="tracking-wider">SCANNER SIAGA</span>
            </div>

            {/* Total Hadir Guru Pill */}
            <div className="bg-[#0b1424]/95 border border-cyan-500/30 px-3 md:px-4 py-1.5 rounded-xl text-center sm:text-right shadow-inner">
              <div className="text-[9px] md:text-[10px] uppercase font-bold text-cyan-400/90 tracking-wider">
                Total Kehadiran
              </div>
              <div className="text-sm md:text-lg font-black text-white flex items-center justify-center sm:justify-end gap-1 md:gap-0">
                {presentCount} <span className="text-slate-400 text-[10px] md:text-xs font-semibold ml-1">/ {totalStaffCount} Guru</span>
                <span className="ml-1.5 md:ml-2 text-[10px] md:text-xs font-bold text-cyan-400">({presentPercentage}%)</span>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 3. MAIN BODY - EXECUTIVE ROSTER (INNER SCROLLABLE) */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 relative z-10 p-3 sm:p-4 lg:p-6 flex flex-col gap-4 max-w-[1900px] w-full mx-auto overflow-visible md:overflow-hidden h-auto md:h-full">
        
        {/* Banner Summary (Executive Style) */}
        <section className="bg-gradient-to-r from-[#0a1222]/95 via-[#0c1830]/90 to-[#0a1222]/95 backdrop-blur-xl rounded-3xl border border-cyan-500/25 p-4 lg:p-5 shadow-2xl relative overflow-hidden flex flex-col xl:flex-row items-center justify-between gap-4 flex-shrink-0">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 bottom-0 w-80 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Left: Identity */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center sm:text-left z-10 w-full xl:w-auto">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-cyan-500 via-teal-600 to-indigo-700 border border-cyan-300/40 flex items-center justify-center font-black text-white shadow-xl shadow-cyan-500/25 flex-shrink-0">
              <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div>
              <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                  Madrasah Ibtidaiyah Attaqwa 15
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-400 font-semibold">Tahun Ajaran 2026/2027</span>
              </div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-white tracking-tight mt-1 flex flex-col sm:flex-row items-center gap-1 sm:gap-2.5">
                Daftar Presensi Dewan Guru & Staf
                <span className="text-[10px] sm:text-xs font-bold text-cyan-400/80">({totalStaffCount} Pendidik Terdaftar)</span>
              </h2>
            </div>
          </div>

          {/* Center/Right: Executive Metrics & Filter Tabs */}
          <div className="flex flex-col md:flex-row flex-wrap items-center gap-3.5 w-full xl:w-auto justify-center xl:justify-end z-10 mt-2 xl:mt-0">
            
            {/* Quick Stat Pill */}
            <div className="bg-[#060a12]/90 border border-slate-800 px-3 sm:px-4 py-2 rounded-2xl flex flex-wrap justify-center items-center gap-3 sm:gap-4 shadow-inner w-full md:w-auto">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <div className="text-center sm:text-left">
                  <span className="text-[8px] sm:text-[9px] uppercase font-bold text-slate-400 block">Tepat Waktu</span>
                  <span className="text-sm sm:text-base font-black text-emerald-400">{onTimeCount}</span>
                </div>
              </div>

              <div className="h-5 sm:h-7 w-[1px] bg-slate-800 hidden sm:block" />

              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                <div className="text-center sm:text-left">
                  <span className="text-[8px] sm:text-[9px] uppercase font-bold text-slate-400 block">Terlambat</span>
                  <span className="text-sm sm:text-base font-black text-orange-400">{lateCount}</span>
                </div>
              </div>

              <div className="h-5 sm:h-7 w-[1px] bg-slate-800 hidden sm:block" />

              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-rose-400" />
                <div className="text-center sm:text-left">
                  <span className="text-[8px] sm:text-[9px] uppercase font-bold text-slate-400 block">Belum Hadir</span>
                  <span className="text-sm sm:text-base font-black text-rose-400">{totalStaffCount - presentCount}</span>
                </div>
              </div>
            </div>

            {/* Segmented Filter Buttons */}
            <div className="flex flex-wrap justify-center items-center p-1 bg-[#060a12]/90 rounded-2xl border border-slate-800 shadow-md w-full md:w-auto">
              <button
                onClick={() => setViewFilter('HADIR')}
                className={`px-3 sm:px-4 py-2 rounded-xl text-[10px] sm:text-xs font-black transition-all flex items-center justify-center gap-1.5 sm:gap-2 flex-1 md:flex-none ${
                  viewFilter === 'HADIR'
                    ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-lg shadow-cyan-900/50'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-300" />
                Sudah Hadir <span className="hidden sm:inline">({presentCount})</span>
              </button>
              <button
                onClick={() => setViewFilter('BELUM_HADIR')}
                className={`px-3 sm:px-4 py-2 rounded-xl text-[10px] sm:text-xs font-black transition-all flex items-center justify-center gap-1.5 sm:gap-2 flex-1 md:flex-none ${
                  viewFilter === 'BELUM_HADIR'
                    ? 'bg-gradient-to-r from-orange-600 to-rose-600 text-white shadow-lg shadow-orange-900/50'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-300" />
                Belum <span className="hidden sm:inline">Hadir ({totalStaffCount - presentCount})</span>
              </button>
              <button
                onClick={() => setViewFilter('ALL')}
                className={`px-3 sm:px-4 py-2 rounded-xl text-[10px] sm:text-xs font-black transition-all flex items-center justify-center gap-1.5 sm:gap-2 flex-1 md:flex-none ${
                  viewFilter === 'ALL'
                    ? 'bg-slate-800 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Semua <span className="hidden sm:inline">({totalStaffCount})</span>
              </button>
            </div>

          </div>
        </section>

        {/* Search bar & count indicator (Fixed) */}
        <div className="flex items-center justify-between gap-4 flex-shrink-0">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
            <input
              type="text"
              placeholder="Cari nama guru, wali kelas, atau jabatan struktural..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a1222]/90 border border-slate-800 focus:border-cyan-500/60 rounded-2xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none backdrop-blur-md shadow-inner transition"
            />
          </div>

          <div className="text-xs font-bold text-slate-400 bg-[#0a1222]/80 px-4 py-2 rounded-xl border border-slate-800">
            Menampilkan <span className="text-cyan-300 font-extrabold text-sm">{displayedStaffs.length}</span> Tenaga Pendidik
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────── */}
        {/* 4. LARGE EXECUTIVE TEACHER CARDS GRID */}
        {/* ──────────────────────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar overscroll-contain">
          {displayedStaffs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-[#0a1222]/40 rounded-3xl border border-slate-800/80 text-center">
              <Users className="w-14 h-14 text-slate-600 mb-3" />
              <p className="text-lg font-bold text-slate-300">Tidak ada data guru / staf</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md">
                {viewFilter === 'HADIR'
                  ? 'Belum ada dewan guru yang melakukan presensi pada filter ini'
                  : 'Seluruh dewan guru telah melakukan presensi'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 pb-2">
              {displayedStaffs.map((staff, idx) => {
                const isPresent = !!(staff.attendance && staff.attendance.check_in_time)
                const isNewlyScanned = lastScannedStaffId === staff.id
                const isLate = (staff.attendance?.status || '').toUpperCase() === 'TERLAMBAT'

                // Determine if this teacher is afternoon class based on position
                const isAfternoon = isAfternoonClass(staff.position)

                return (
                  <div
                    key={staff.id}
                    className={`p-5 rounded-3xl border transition-all duration-300 flex flex-col justify-between gap-4 relative overflow-hidden group ${
                      isNewlyScanned
                        ? 'ring-2 ring-cyan-400 border-cyan-400 bg-gradient-to-br from-indigo-950/60 via-[#0a1730] to-[#060a12] scale-[1.01] shadow-[0_0_35px_rgba(6,182,212,0.3)] animate-pulse'
                        : isPresent
                        ? isLate
                          ? 'bg-gradient-to-br from-[#181122]/95 via-[#100c1a]/90 to-[#090710]/95 border-orange-500/30 hover:border-orange-400/60 shadow-lg'
                          : 'bg-gradient-to-br from-[#0a1828]/95 via-[#081220]/90 to-[#050c14]/95 border-indigo-800/30 hover:border-cyan-400/60 shadow-lg'
                        : 'bg-[#080d1a]/75 border-slate-800/60 opacity-70 hover:opacity-100 hover:border-slate-700'
                    }`}
                  >
                    {/* Top Section: Photo (Large 64x64px) + Name + Jabatan + Status Badge */}
                    <div className="flex items-start gap-4 min-w-0">
                      
                      {/* Large Photo Avatar (64x64px) with double ring */}
                      <div className="relative flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={staff.image || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(staff.name || 'G') + '&background=0284c7&color=fff&size=160'} 
                          alt={staff.name}
                          onError={(e) => { 
                            e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(staff.name || 'G') + '&background=0284c7&color=fff&size=160' 
                          }}
                          className={`w-16 h-16 rounded-2xl object-cover border-2 shadow-md transition-transform group-hover:scale-105 ${
                            isPresent 
                              ? isLate 
                                ? 'border-orange-400 ring-4 ring-orange-500/20' 
                                : 'border-indigo-800 ring-4 ring-cyan-500/20'
                              : 'border-slate-700 opacity-60'
                          }`}
                        />
                        <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#060a12] border border-cyan-500/40 flex items-center justify-center text-[10px] font-black text-cyan-300 shadow">
                          {idx + 1}
                        </div>
                      </div>

                      {/* Name & Position Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-bold text-base lg:text-lg text-white truncate tracking-tight group-hover:text-cyan-100 transition">
                            {staff.name}
                          </h3>
                        </div>

                        {/* Position Badge & Shift Indicator */}
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg bg-slate-800/90 text-slate-200 border border-slate-700 flex items-center gap-1.5 shadow-sm">
                            <Briefcase className="w-3 h-3 text-cyan-400" />
                            <span className="truncate max-w-[180px]">{staff.position || 'Dewan Guru'}</span>
                          </span>

                          {/* Shift Label */}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                            isAfternoon
                              ? 'bg-indigo-950/60 text-indigo-300 border-indigo-500/30'
                              : 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30'
                          }`}>
                            {isAfternoon ? <Sunset className="w-3 h-3 text-indigo-300" /> : <Sun className="w-3 h-3 text-cyan-300" />}
                            {isAfternoon ? 'Shift Siang' : 'Shift Pagi'}
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* Bottom Section: Attendance Timestamps & Status Pill */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
                      
                      {/* Left: Status Badge */}
                      <div>
                        {isPresent ? (
                          isLate ? (
                            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-950/90 to-rose-950/80 text-orange-300 border border-orange-500/50 px-3.5 py-1 rounded-xl text-xs font-black shadow-md shadow-orange-950/50">
                              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                              <span>Hadir Terlambat</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-950/90 to-teal-950/80 text-emerald-300 border border-emerald-500/50 px-3.5 py-1 rounded-xl text-xs font-black shadow-md shadow-emerald-950/50">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                              <span>Hadir Tepat Waktu</span>
                            </div>
                          )
                        ) : (
                          <div className="inline-flex items-center gap-1.5 bg-slate-900/90 text-slate-400 border border-slate-800 px-3 py-1 rounded-xl text-xs font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                            <span>Belum Hadir</span>
                          </div>
                        )}
                      </div>

                      {/* Right: Digital Timestamps (Masuk & Pulang) */}
                      <div className="flex items-center gap-2">
                        {isPresent ? (
                          <>
                            {/* Jam Masuk */}
                            <div className="flex flex-col items-center bg-[#060a12]/90 border border-emerald-500/40 px-3.5 py-1 rounded-xl shadow-inner min-w-[80px]">
                              <span className="text-[8px] font-black text-emerald-400 uppercase tracking-wider">Jam Masuk</span>
                              <span className="text-md font-medium text-white font-mono leading-tight mt-0.5">
                                {formatTime(staff.attendance?.check_in_time)}
                              </span>
                            </div>

                            {/* Jam Pulang */}
                            <div className="flex flex-col items-center bg-[#060a12]/90 border border-cyan-500/40 px-3.5 py-1 rounded-xl shadow-inner min-w-[80px]">
                              <span className="text-[8px] font-black text-cyan-400 uppercase tracking-wider">Jam Pulang</span>
                              <span className="text-sm font-black text-white font-mono leading-tight mt-0.5">
                                {staff.attendance?.check_out_time ? formatTime(staff.attendance.check_out_time) : '- - : - -'}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="text-xs font-bold text-slate-600 font-mono italic px-3 py-1 bg-slate-900/50 rounded-lg border border-slate-800">
                            Belum Ada Presensi
                          </div>
                        )}
                      </div>

                    </div>

                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 5. POPUP MODAL ALERT ON RFID SCAN */}
      {/* ──────────────────────────────────────────────────────────── */}
      {popup.type !== 'idle' && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={closePopup}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-b from-[#0a1428] to-[#060a12] text-white rounded-3xl p-7 lg:p-8 max-w-md w-full shadow-[0_0_60px_rgba(6,182,212,0.25)] border border-cyan-500/40 flex flex-col items-center animate-in zoom-in-95 duration-200 relative overflow-hidden"
          >
            {popup.type === 'success' ? (
              <>
                <div className="w-20 h-20 rounded-full bg-cyan-500/20 border-2 border-cyan-500/50 text-cyan-300 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/20 animate-bounce-short">
                  <CheckCircle2 size={52} />
                </div>

                {popup.staff && (
                  <div className="flex flex-col items-center mb-5 w-full text-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={popup.staff.image || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(popup.staff?.name || 'G') + '&background=0284c7&color=fff&size=180'}
                      alt={popup.staff.name}
                      onError={(e) => { 
                        e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(popup.staff?.name || 'G') + '&background=0284c7&color=fff&size=180' 
                      }}
                      className="w-28 h-28 rounded-2xl object-cover border-4 border-cyan-400/80 shadow-2xl mb-3"
                    />
                    <h3 className="text-xl lg:text-2xl font-black text-white tracking-tight">{popup.staff.name}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="px-3.5 py-1 bg-slate-800/90 text-slate-200 border border-slate-700 rounded-lg font-extrabold text-xs">
                        {popup.staff.position || 'Dewan Guru'}
                      </span>
                      {popup.staff.shift && (
                        <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 rounded-lg font-extrabold text-xs flex items-center gap-1">
                          <Timer className="w-3.5 h-3.5" />
                          {popup.staff.shift}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-gradient-to-r from-cyan-500 via-teal-500 to-indigo-600 text-white px-6 py-3.5 rounded-2xl font-black text-lg text-center w-full shadow-lg shadow-cyan-500/25">
                  {popup.action === 'check-in' ? 'BERHASIL ABSEN MASUK' : 'BERHASIL ABSEN PULANG'}
                </div>

                <div className="mt-4 text-cyan-300 font-bold text-xs flex items-center gap-1.5 bg-[#060a12] px-4 py-1.5 rounded-xl border border-cyan-500/20">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  Waktu Scan: {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-rose-500/20 border-2 border-rose-500/50 text-rose-400 flex items-center justify-center mb-4 shadow-lg shadow-rose-500/20">
                  <XCircle size={52} />
                </div>
                <h3 className="text-xl font-black text-white text-center mb-2">Presensi Gagal</h3>
                <p className="text-slate-300 text-center text-sm mb-6 leading-relaxed max-w-xs">{popup.message}</p>
                <button
                  className="bg-rose-600 hover:bg-rose-500 text-white px-6 py-3 rounded-2xl font-black text-sm text-center w-full transition cursor-pointer shadow-lg active:scale-98"
                  onClick={closePopup}
                >
                  TUTUP & SILAKAN COBA LAGI
                </button>
              </>
            )}
          </div>
        </div>
      )}

    </main>
  )
}
