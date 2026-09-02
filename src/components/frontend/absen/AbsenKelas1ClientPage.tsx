'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { CheckCircle, XCircle, Users, Sparkles, Clock, Wifi, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

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
  const validIso = (!isoString.endsWith('Z') && !isoString.includes('+')) ? `${isoString}Z` : isoString
  const d = new Date(validIso)
  if (isNaN(d.getTime())) return isoString
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

type PopupData = {
  type: 'success' | 'error' | 'idle'
  message: string
  action?: 'check-in' | 'check-out' | 'already-checked-out' | 'early-checkout'
  student?: {
    name: string
    class: string
  }
}

type StudentAttendance = {
  id: string
  name: string
  class: string
  attendance?: {
    entry_time?: string
    exit_time?: string
    status?: string
  } | null
}

const CLASS_CONFIGS = [
  {
    code: '1B',
    title: 'Kelas 1B',
    subtitle: 'Gedung 2 - Ruang 1',
    theme: {
      border: 'border-indigo-500/40',
      borderCard: 'border-indigo-500/20 hover:border-indigo-500/50',
      bgGlow: 'bg-indigo-500/10',
      headerGradient: 'from-indigo-600 via-indigo-700 to-blue-700',
      badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40',
      badgeSolid: 'bg-indigo-500 text-white',
      cardBg: 'bg-slate-900/80',
      highlightBorder: 'ring-2 ring-indigo-400 border-indigo-400',
      accentText: 'text-indigo-400',
      progressBar: 'bg-indigo-500',
    }
  },
  {
    code: '1C',
    title: 'Kelas 1C',
    subtitle: 'Gedung 2 - Ruang 2',
    theme: {
      border: 'border-emerald-500/40',
      borderCard: 'border-emerald-500/20 hover:border-emerald-500/50',
      bgGlow: 'bg-emerald-500/10',
      headerGradient: 'from-emerald-600 via-emerald-700 to-teal-700',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
      badgeSolid: 'bg-emerald-500 text-white',
      cardBg: 'bg-slate-900/80',
      highlightBorder: 'ring-2 ring-emerald-400 border-emerald-400',
      accentText: 'text-emerald-400',
      progressBar: 'bg-emerald-500',
    }
  },
  {
    code: '1D',
    title: 'Kelas 1D',
    subtitle: 'Gedung 2 - Ruang 3',
    theme: {
      border: 'border-purple-500/40',
      borderCard: 'border-purple-500/20 hover:border-purple-500/50',
      bgGlow: 'bg-purple-500/10',
      headerGradient: 'from-purple-600 via-purple-700 to-fuchsia-700',
      badge: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
      badgeSolid: 'bg-purple-500 text-white',
      cardBg: 'bg-slate-900/80',
      highlightBorder: 'ring-2 ring-purple-400 border-purple-400',
      accentText: 'text-purple-400',
      progressBar: 'bg-purple-500',
    }
  }
]

export default function AbsenKelas1ClientPage() {
  const [mounted, setMounted] = useState(false)
  const [time, setTime] = useState(new Date())
  const [popup, setPopup] = useState<PopupData>({ type: 'idle', message: '' })
  const popupTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [nfcSupported, setNfcSupported] = useState(false)
  const [nfcActive, setNfcActive] = useState(false)

  const [students, setStudents] = useState<StudentAttendance[]>([])
  const [lastScannedStudentId, setLastScannedStudentId] = useState<string | null>(null)

  const clientIdRef = useRef(Math.random().toString(36).substring(7))
  const broadcastChannelRef = useRef<any>(null)
  const showPopupRef = useRef<(data: PopupData) => void>(() => {})

  // Play subtle chime sound on successful attendance scan
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
        osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1) // A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35)
        osc.start()
        osc.stop(ctx.currentTime + 0.35)
      } else {
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(220, ctx.currentTime)
        gain.gain.setValueAtTime(0.25, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
        osc.start()
        osc.stop(ctx.currentTime + 0.3)
      }
    } catch (e) {
      // Audio context might be restricted before user interaction
    }
  }

  const showPopup = (data: PopupData) => {
    setPopup(data)
    playBeep(data.type === 'success')

    if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current)
    popupTimeoutRef.current = setTimeout(() => {
      setPopup({ type: 'idle', message: '' })
    }, 3500)
  }
  const closePopup = () => setPopup({ type: 'idle', message: '' })
  showPopupRef.current = showPopup

  const fetchAttendanceList = async () => {
    try {
      const today = new Date()
      const offset = 7 * 60 * 60 * 1000 // UTC+7
      const localDate = new Date(today.getTime() + offset)
      const dateStr = localDate.toISOString().split('T')[0]

      const res = await fetch(`/api/attendance-siswa/list?className=kelas1&date=${dateStr}&_t=${Date.now()}`)
      const data = await res.json()

      if (data.success && data.data) {
        setStudents(data.data)
      }
    } catch (err) {
      console.error('Error fetching multi-class attendance list', err)
    }
  }

  // Realtime Clock & Mount
  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setTime(new Date()), 1000)
    if (typeof window !== 'undefined' && 'NDEFReader' in window) setNfcSupported(true)

    fetchAttendanceList()

    return () => clearInterval(timer)
  }, [])

  // Supabase Realtime Sync
  useEffect(() => {
    try {
      const channel = supabase.channel('mia-attendance-siswa-sync')

      channel
        .on(
          'broadcast',
          { event: 'scan_result_siswa' },
          (payload) => {
            const data = payload.payload
            if (data.sender === clientIdRef.current) return

            showPopupRef.current({
              type: data.success ? 'success' : 'error',
              message: data.message,
              action: data.action,
              student: data.student
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

  // RFID Scan Locking
  const isScanningRef = useRef(false)
  const lastScannedRfidRef = useRef<{ rfid: string, time: number }>({ rfid: '', time: 0 })

  const processRfid = async (rfid: string) => {
    const now = Date.now()
    if (isScanningRef.current) return
    if (lastScannedRfidRef.current.rfid === rfid && (now - lastScannedRfidRef.current.time) < 3000) {
      return
    }

    isScanningRef.current = true
    lastScannedRfidRef.current = { rfid, time: now }

    try {
      const res = await fetch('/api/attendance-siswa/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rfid, className: 'kelas1' })
      })

      const data = await res.json()

      const popupPayload: PopupData = data.success
        ? { type: 'success', message: data.message, action: data.action, student: data.student }
        : { type: 'error', message: data.error || 'Absensi gagal, silakan coba lagi.', action: data.action }

      if (data.success && data.student?.id) {
        setLastScannedStudentId(data.student.id)
        setTimeout(() => setLastScannedStudentId(null), 8000)
      }

      showPopup(popupPayload)

      if (data.success) {
        fetchAttendanceList()
      }

      // Broadcast via Supabase
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.send({
          type: 'broadcast',
          event: 'scan_result_siswa',
          payload: {
            sender: clientIdRef.current,
            success: data.success,
            message: data.success ? data.message : (data.error || 'Absensi gagal'),
            action: data.action,
            student: data.student
          }
        })
      }
    } catch (err: any) {
      showPopup({
        type: 'error',
        message: 'Gagal terhubung ke server absensi.'
      })
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
          processRfid(rfidBuffer.toUpperCase())
          rfidBuffer = ''
        }
        return
      }

      if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
        rfidBuffer += e.key

        scanTimeoutId = setTimeout(() => {
          if (rfidBuffer.length >= 5) {
            processRfid(rfidBuffer.toUpperCase())
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

  const startNfcScan = async () => {
    try {
      // @ts-ignore
      const ndef = new window.NDEFReader()
      await ndef.scan()
      setNfcActive(true)

      // @ts-ignore
      ndef.addEventListener('reading', async ({ serialNumber }: any) => {
        if (serialNumber) {
          let rfid = serialNumber.replace(/:/g, '').toUpperCase()
          await processRfid(rfid)
        }
      })
      // @ts-ignore
      ndef.addEventListener('readingerror', () => {
        showPopup({ type: 'error', message: 'Gagal membaca kartu NFC. Coba dekatkan lagi.' })
      })
    } catch (error) {
      console.error('NFC Error:', error)
      showPopup({ type: 'error', message: 'NFC tidak diizinkan atau tidak didukung.' })
    }
  }

  // Normalize class code helper (strictly match 1B, 1C, 1D)
  const normalizeClassCode = (rawClass?: string): string => {
    if (!rawClass) return ''
    const clean = rawClass.toUpperCase().replace(/\s+/g, '')
    if (clean.includes('1B')) return '1B'
    if (clean.includes('1C')) return '1C'
    if (clean.includes('1D')) return '1D'
    return ''
  }

  // Categorize students per class exclusively for 1B, 1C, 1D
  const classStudentsMap = useMemo(() => {
    const map: Record<string, { present: StudentAttendance[]; total: number; all: StudentAttendance[] }> = {
      '1B': { present: [], total: 0, all: [] },
      '1C': { present: [], total: 0, all: [] },
      '1D': { present: [], total: 0, all: [] }
    }

    students.forEach((s) => {
      const code = normalizeClassCode(s.class)
      if (code && map[code]) {
        map[code].total += 1
        map[code].all.push(s)
        if (s.attendance && s.attendance.entry_time) {
          map[code].present.push(s)
        }
      }
    })

    // Sort present students by entry_time descending (latest scan first)
    Object.keys(map).forEach((code) => {
      map[code].present.sort((a, b) => {
        return (b.attendance?.entry_time || '').localeCompare(a.attendance?.entry_time || '')
      })
    })

    return map
  }, [students])

  // Calculate precise stats exclusively for Gedung 2 (1B + 1C + 1D)
  const gedung2Stats = useMemo(() => {
    let total = 0
    let present = 0
    CLASS_CONFIGS.forEach((cfg) => {
      const c = classStudentsMap[cfg.code]
      if (c) {
        total += c.total
        present += c.present.length
      }
    })
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0
    return { total, present, percentage }
  }, [classStudentsMap])

  if (!mounted) {
    return <div className="h-screen w-full bg-slate-950 flex items-center justify-center" />
  }

  return (
    <main className="h-screen max-h-screen w-full bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-hidden relative">
      
      {/* ──────────────────────────────────────────────────────────── */}
      {/* BACKGROUND VIDEO WITH SUBTLE 85-90% DARK OVERLAY */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <video 
          src="/vid/bgvid.mp4" 
          autoPlay 
          loop 
          muted 
          playsInline
          className="object-cover w-full h-full opacity-20 scale-105 filter blur-[0.5px]"
        />
        {/* Dark overlay 85-90% darkness */}
        <div className="absolute inset-0 bg-slate-950/85 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-950/90" />
        
        {/* Ambient Glow Accents */}
        <div className="absolute -top-40 left-1/4 w-[600px] h-[400px] bg-indigo-600/15 blur-[140px] rounded-full" />
        <div className="absolute -top-40 right-1/4 w-[600px] h-[400px] bg-purple-600/15 blur-[140px] rounded-full" />
        <div className="absolute bottom-0 left-1/3 w-[700px] h-[300px] bg-emerald-600/10 blur-[150px] rounded-full" />
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 1. TOP HEADER - FIXED HEIGHT, NON-SCROLLABLE */}
      {/* ──────────────────────────────────────────────────────────── */}
      <header className="relative z-20 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-6 py-2.5 shadow-xl flex-shrink-0">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Brand & Kiosk Location */}
          <div className="flex items-center gap-3.5 text-left">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/logosmart/smartputihver.png" 
              alt="Logo MI Attaqwa 15" 
              className="h-10 md:h-12 object-contain filter drop-shadow" 
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-400 text-slate-950 tracking-wider shadow-sm">
                  Gedung 2
                </span>
                <span className="text-[11px] font-bold text-slate-400 tracking-wide">
                  Pos Absensi Siswa Kelas 1
                </span>
              </div>
              <h1 className="text-base md:text-lg font-black text-white tracking-wide uppercase mt-0.5 drop-shadow-sm leading-tight">
                MI Attaqwa 15 Babelan
              </h1>
            </div>
          </div>

          {/* Center: Live Digital Clock & Indonesian Date */}
          <div className="flex flex-col items-center justify-center bg-slate-950/70 px-5 py-1.5 rounded-2xl border border-white/10 shadow-inner">
            <div className="flex items-center gap-1.5 text-xl md:text-2xl font-black tracking-tight text-white font-mono">
              <span>{time.getHours().toString().padStart(2, '0')}</span>
              <span className="text-amber-400 animate-pulse font-light">:</span>
              <span>{time.getMinutes().toString().padStart(2, '0')}</span>
              <span className="text-amber-400 animate-pulse font-light">:</span>
              <span className="text-amber-300">{time.getSeconds().toString().padStart(2, '0')}</span>
              <span className="text-[10px] font-sans font-bold text-slate-400 ml-1">WIB</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-300 font-medium">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>{getIndonesianDate()}</span>
            </div>
          </div>

          {/* Right: Scanner Status & Total Hadir Pill */}
          <div className="flex items-center gap-2.5">
            
            {/* NFC Button if smartphone */}
            {nfcSupported && !nfcActive && (
              <button
                onClick={startNfcScan}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[11px] font-bold shadow-lg transition transform hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer border border-blue-400/40"
              >
                <Wifi className="w-3 h-3" />
                NFC HP
              </button>
            )}

            {/* Live Scanner Siaga Pill */}
            <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-xl text-emerald-400 text-xs font-bold shadow-sm backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>SCANNER SIAGA</span>
            </div>

            {/* Total Hadir Gedung 2 (Accurate: 1B + 1C + 1D) */}
            <div className="bg-slate-800/90 border border-slate-700/80 px-3.5 py-1 rounded-xl text-right">
              <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Gedung 2 Madrasah</div>
              <div className="text-sm md:text-base font-black text-white">
                {gedung2Stats.present} <span className="text-slate-400 text-xs font-semibold">/ {gedung2Stats.total}</span>
                <span className="ml-1.5 text-xs font-bold text-emerald-400">({gedung2Stats.percentage}%)</span>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 2. MAIN BODY - 3 SECTION COLUMNS (INNER SCROLLABLE ONLY) */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 relative z-10 p-3 lg:p-4 grid grid-cols-1 md:grid-cols-3 gap-3.5 lg:gap-4.5 max-w-[1800px] w-full mx-auto overflow-hidden">
        
        {CLASS_CONFIGS.map((cfg) => {
          const classData = classStudentsMap[cfg.code] || { present: [], total: 0, all: [] }
          const presentList = classData.present
          const totalCount = classData.total
          const presentCount = presentList.length
          const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0

          return (
            <section
              key={cfg.code}
              className={`flex flex-col h-full min-h-0 bg-slate-900/90 backdrop-blur-md rounded-2xl lg:rounded-3xl border ${cfg.theme.border} shadow-2xl overflow-hidden relative`}
            >
              {/* Column Header (Fixed) */}
              <div className={`p-3 lg:p-4 bg-gradient-to-r ${cfg.theme.headerGradient} text-white shadow-md relative overflow-hidden flex-shrink-0`}>
                <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center font-black text-lg shadow-inner">
                      {cfg.code}
                    </div>
                    <div>
                      <h2 className="text-lg font-black tracking-wide text-white drop-shadow-sm leading-snug">
                        {cfg.title}
                      </h2>
                      <p className="text-[11px] text-white/80 font-medium">
                        {cfg.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xl font-black text-white drop-shadow-md">
                      {presentCount}
                      <span className="text-white/70 text-xs font-semibold ml-1">/ {totalCount}</span>
                    </span>
                    <span className="block text-[10px] font-extrabold text-white/90 uppercase tracking-wider">
                      {percentage}% Hadir
                    </span>
                  </div>
                </div>

                {/* Live Progress Bar */}
                <div className="w-full bg-black/30 h-1.5 rounded-full mt-2.5 overflow-hidden p-0.5 border border-white/10">
                  <div 
                    className="bg-white h-full rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${Math.min(100, percentage)}%` }}
                  />
                </div>
              </div>

              {/* Column Scrollable Content (List Siswa Scrollable di dalam section) */}
              <div className="flex-1 min-h-0 overflow-y-auto p-2.5 lg:p-3 space-y-2 bg-slate-950/40 custom-scrollbar overscroll-contain">
                {presentList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full min-h-[180px] text-slate-500 text-center p-4 space-y-1.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-800/60 flex items-center justify-center text-slate-600 border border-slate-700/50">
                      <Users className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-400">Belum ada siswa yang scan</p>
                    <p className="text-[11px] text-slate-500 max-w-[180px]">
                      Tempelkan kartu RFID siswa Kelas {cfg.code} pada scanner
                    </p>
                  </div>
                ) : (
                  presentList.map((student, idx) => {
                    const isNewlyScanned = lastScannedStudentId === student.id
                    const isLate = student.attendance?.status === 'Terlambat'

                    return (
                      <div
                        key={student.id}
                        className={`p-2.5 lg:p-3 rounded-xl border transition-all duration-300 flex items-center justify-between gap-2.5 ${
                          isNewlyScanned 
                            ? `${cfg.theme.highlightBorder} bg-white/10 scale-[1.01] shadow-xl animate-pulse` 
                            : `${cfg.theme.cardBg} ${cfg.theme.borderCard} hover:bg-slate-800/80 shadow-sm`
                        }`}
                      >
                        {/* Left: Number & Student Name */}
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-6 h-6 rounded-lg bg-slate-800/90 border border-slate-700/60 flex items-center justify-center font-extrabold text-[11px] text-slate-400 flex-shrink-0">
                            {idx + 1}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="font-extrabold text-xs lg:text-sm text-white truncate tracking-tight">
                              {student.name}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md border ${cfg.theme.badge}`}>
                                {student.class}
                              </span>
                              {isLate ? (
                                <span className="text-[9px] font-extrabold text-amber-400 bg-amber-950/60 px-1.5 py-0.2 rounded-md border border-amber-500/40">
                                  Terlambat
                                </span>
                              ) : (
                                <span className="text-[9px] font-extrabold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded-md border border-emerald-500/40">
                                  Tepat Waktu
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Scan Timestamps */}
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          {/* Jam Masuk */}
                          <div className="flex items-center gap-1 bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                            <span className="text-[8px] font-black text-emerald-400 uppercase tracking-wider">Masuk</span>
                            <span className="text-[11px] font-black text-white font-mono">
                              {formatTime(student.attendance?.entry_time)}
                            </span>
                          </div>

                          {/* Jam Pulang */}
                          {student.attendance?.exit_time && (
                            <div className="flex items-center gap-1 bg-amber-950/70 border border-amber-500/30 px-2 py-0.5 rounded-md">
                              <span className="text-[8px] font-black text-amber-400 uppercase tracking-wider">Pulang</span>
                              <span className="text-[11px] font-black text-white font-mono">
                                {formatTime(student.attendance?.exit_time)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Column Footer Status (Fixed) */}
              <div className="p-2 bg-slate-950/90 border-t border-slate-800/80 text-center flex items-center justify-between px-3 text-[11px] font-bold text-slate-400 flex-shrink-0">
                <span>Kehadiran {cfg.code}</span>
                <span className={cfg.theme.accentText}>{presentCount} Siswa Terdata</span>
              </div>
            </section>
          )
        })}

      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 3. POPUP MODAL ALERT ON RFID SCAN */}
      {/* ──────────────────────────────────────────────────────────── */}
      {popup.type !== 'idle' && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={closePopup}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 text-white rounded-3xl p-6 lg:p-8 max-w-md w-full shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-slate-700/80 flex flex-col items-center animate-in zoom-in-95 duration-200 relative overflow-hidden"
          >
            {popup.type === 'success' ? (
              <>
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mb-4 shadow-lg animate-bounce-short">
                  <CheckCircle size={52} />
                </div>

                {popup.student && (
                  <div className="flex flex-col items-center mb-5 w-full text-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={'https://ui-avatars.com/api/?name=' + encodeURIComponent(popup.student?.name || 'S') + '&background=0D8ABC&color=fff&size=150'}
                      alt={popup.student.name}
                      className="w-24 h-24 rounded-full object-cover border-4 border-emerald-500/40 shadow-xl mb-3"
                    />
                    <h3 className="text-xl lg:text-2xl font-black text-white tracking-tight">{popup.student.name}</h3>
                    <span className="mt-1 px-4 py-1 bg-indigo-500/30 text-indigo-300 border border-indigo-400/40 rounded-full font-extrabold text-sm">
                      {popup.student.class}
                    </span>
                  </div>
                )}

                <div className="bg-emerald-500 text-slate-950 px-6 py-3 rounded-2xl font-black text-lg text-center w-full shadow-lg">
                  {popup.action === 'check-in' ? 'BERHASIL ABSEN MASUK' : 'BERHASIL ABSEN PULANG'}
                </div>

                <div className="mt-4 text-slate-400 font-bold text-xs flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Waktu Scan: {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mb-4 shadow-lg">
                  <XCircle size={52} />
                </div>
                <h3 className="text-xl font-black text-white text-center mb-2">Absensi Gagal</h3>
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
