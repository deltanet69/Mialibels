'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { CheckCircle, XCircle, Users, Sparkles, Clock, Wifi, ShieldCheck, UserCheck, AlertCircle, UserX, Search } from 'lucide-react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { generateRfidVariants } from '@/lib/rfidUtils'
import { ATTENDANCE_CONFIG, evaluateStudentCheckIn } from '@/config/attendanceRules'

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

// ─────────────────────────────────────────────────────────────────────────────
// DIRECT SUPABASE SCAN — BYPASS HOSTINGER WAF SEPENUHNYA
// Fungsi ini berjalan di browser dan berkomunikasi langsung dengan
// supabase.co — Hostinger tidak punya kendali sama sekali atas koneksi ini.
// ─────────────────────────────────────────────────────────────────────────────
const clientScanCache = new Map<string, { timestamp: number; response: any }>()
const CLIENT_DEDUP_MS = 2500

function cleanClassCode(raw?: string | null): string {
  if (!raw) return ''
  return raw.toLowerCase()
    .replace(/kelas/g, '').replace(/ruang/g, '').replace(/gedung/g, '')
    .replace(/[^a-z0-9]/g, '').trim()
}

async function scanRfidDirect(rfid: string, className: string): Promise<any> {
  const cleanRfid = String(rfid).trim().toUpperCase()
  const now = Date.now()

  const cached = clientScanCache.get(cleanRfid)
  if (cached && now - cached.timestamp < CLIENT_DEDUP_MS) return cached.response

  const rfidVariants = generateRfidVariants(cleanRfid)

  const { data: studentsData, error: studentError } = await supabase
    .from('students')
    .select('id, name, class, rfid_number, is_active')
    .in('rfid_number', rfidVariants)
    .eq('is_active', true)
    .limit(1)

  if (studentError) throw studentError
  const students = (studentsData || []) as any[]
  if (students.length === 0) {
    return { success: false, error: `Kartu RFID/NFC (${cleanRfid}) belum terdaftar pada data siswa aktif.` }
  }

  const student = students[0]
  const studentClean = cleanClassCode(student.class)
  const deviceClean = cleanClassCode(className)
  const rawClassLower = (className || '').toLowerCase().trim()

  let isClassAllowed = false
  let rejectionReason = ''

  if (rawClassLower === 'kelas1' || deviceClean === 'kelas1' || deviceClean === '1bcd') {
    if (['1b', '1c', '1d'].includes(studentClean)) isClassAllowed = true
    else if (studentClean === '1a') { rejectionReason = `Siswa ${student.name} (Kelas 1A) terdaftar di Pos Gedung 1. Silakan lakukan absensi di Pos Kelas 1A.` }
    else { rejectionReason = `Siswa ${student.name} (${student.class || 'Tanpa Kelas'}) tidak diizinkan di Pos Absensi Gedung 2.` }
  } else if (deviceClean === '1a' || rawClassLower === '1a') {
    if (studentClean === '1a') isClassAllowed = true
    else if (['1b', '1c', '1d'].includes(studentClean)) { rejectionReason = `Siswa ${student.name} (${student.class}) terdaftar di Pos Gedung 2.` }
    else { rejectionReason = `Siswa ${student.name} (${student.class || 'Tanpa Kelas'}) tidak diizinkan di Pos Absensi Kelas 1A.` }
  } else if (deviceClean) {
    if (studentClean === deviceClean) isClassAllowed = true
    else { rejectionReason = `Siswa ${student.name} (${student.class || 'Tanpa Kelas'}) tidak diizinkan di Pos Kelas ${className.toUpperCase()}.` }
  } else {
    isClassAllowed = true
  }

  if (!isClassAllowed) {
    return { success: false, action: 'wrong-class', error: rejectionReason || `Siswa ${student.name} tidak diizinkan di mesin absensi ini.`, student: { id: student.id, name: student.name, class: student.class } }
  }

  const today = new Date()
  const offset = 7 * 60 * 60 * 1000
  const localDate = new Date(today.getTime() + offset)
  const dateStr = localDate.toISOString().split('T')[0]
  const hours = localDate.getUTCHours()
  const mins = localDate.getUTCMinutes()
  const currentTimeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`

  const { data: existingRecords, error: checkError } = await supabase
    .from('student_attendances')
    .select('id, student_id, date, status, entry_time, exit_time')
    .eq('student_id', student.id)
    .eq('date', dateStr)
    .limit(1)

  if (checkError) throw checkError
  const existingRecord = existingRecords && existingRecords.length > 0 ? existingRecords[0] : null

  if (!existingRecord) {
    const checkInEval = evaluateStudentCheckIn(hours, mins)

    if (!checkInEval.allowed) {
      if (checkInEval.status === 'Alpha') {
        supabase.from('student_attendances').insert({
          student_id: student.id, date: dateStr, status: 'Alpha',
          entry_time: currentTimeStr,
          notes: `Scan ditolak: Lewat batas jam masuk (${currentTimeStr} WIB)`
        } as any).then(() => {})
      }
      const lockResp = { success: false, action: 'locked', status: checkInEval.status, error: checkInEval.message, student: { ...student, status: checkInEval.status, entry_time: currentTimeStr } }
      clientScanCache.set(cleanRfid, { timestamp: now, response: lockResp })
      return lockResp
    }

    const { data: newRecord, error: insertError } = await supabase
      .from('student_attendances')
      .insert({ student_id: student.id, date: dateStr, status: checkInEval.status, entry_time: currentTimeStr } as any)
      .select('id, student_id, date, status, entry_time, exit_time')
      .single()

    if (insertError) throw insertError

    const isLate = checkInEval.isLate
    const msg = isLate
      ? `Absen Masuk [Terlambat Datang] (${currentTimeStr}): ${student.name}`
      : `Absen Masuk [Tepat Waktu] (${currentTimeStr}): ${student.name}`

    const notifyData = { student_id: student.id, type: 'check-in', message: msg }
    const successResp = { success: true, action: 'check-in', status: checkInEval.status, is_late: isLate, entry_time: currentTimeStr, message: msg, data: newRecord, student: { ...student, status: checkInEval.status, is_late: isLate, entry_time: currentTimeStr }, notifyData }
    clientScanCache.set(cleanRfid, { timestamp: now, response: successResp })
    return successResp

  } else {
    if (existingRecord.status === 'Alpha') {
      const alphaResp = { success: false, action: 'locked', error: `${student.name} tercatat Alpha (tidak absen masuk sebelum ${ATTENDANCE_CONFIG.LATE_LIMIT.timeString} WIB).` }
      clientScanCache.set(cleanRfid, { timestamp: now, response: alphaResp })
      return alphaResp
    }

    if (existingRecord.exit_time) {
      const checkedOutResp = { success: false, action: 'already-checked-out', error: `${student.name} sudah melakukan Absen Pulang hari ini.` }
      clientScanCache.set(cleanRfid, { timestamp: now, response: checkedOutResp })
      return checkedOutResp
    }

    const currentMinutes = hours * 60 + mins
    const minCheckoutMinutes = ATTENDANCE_CONFIG.CHECKOUT_MIN_TIME.hours * 60 + ATTENDANCE_CONFIG.CHECKOUT_MIN_TIME.minutes

    if (currentMinutes < minCheckoutMinutes) {
      const earlyResp = { success: false, action: 'early-checkout', error: `Belum waktunya absen pulang (Minimal pukul ${ATTENDANCE_CONFIG.CHECKOUT_MIN_TIME.timeString} WIB)` }
      clientScanCache.set(cleanRfid, { timestamp: now, response: earlyResp })
      return earlyResp
    }

    const { data: updateRecord, error: updateError } = await (supabase.from('student_attendances') as any)
      .update({ exit_time: currentTimeStr, updated_at: new Date().toISOString() })
      .eq('id', existingRecord.id)
      .select('id, student_id, date, status, entry_time, exit_time')
      .single()

    if (updateError) throw updateError

    const msg = `Berhasil Absen Pulang (${currentTimeStr}): ${student.name}`
    const notifyData = { student_id: student.id, type: 'check-out', message: msg }

    const outResp = { success: true, action: 'check-out', status: existingRecord.status || 'Hadir', exit_time: currentTimeStr, message: msg, data: updateRecord, student: { ...student, exit_time: currentTimeStr }, notifyData }
    clientScanCache.set(cleanRfid, { timestamp: now, response: outResp })
    return outResp
  }
}

export default function AbsenSiswaPage() {

  const params = useParams()
  const rawClassName = (params.class as string) || ''
  const formattedClassName = rawClassName.toUpperCase()
  const isClass1A = formattedClassName === '1A' || formattedClassName.includes('1A')

  const [mounted, setMounted] = useState(false)
  const [time, setTime] = useState(new Date())
  const [popup, setPopup] = useState<PopupData>({ type: 'idle', message: '' })
  const popupTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [nfcSupported, setNfcSupported] = useState(false)
  const [nfcActive, setNfcActive] = useState(false)

  const [allStudents, setAllStudents] = useState<StudentAttendance[]>([])
  const [totalStudents, setTotalStudents] = useState(0)
  const [presentStudentsCount, setPresentStudentsCount] = useState(0)
  const [lastScannedStudentId, setLastScannedStudentId] = useState<string | null>(null)

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

  const lastFetchTimeRef = useRef<number>(0)
  const isFetchingRef = useRef<boolean>(false)

  // Helper untuk update state siswa secara instan (optimistic UI) tanpa membebani server dengan re-fetch
  const updateStudentInState = (
    studentData: any, 
    action?: string, 
    entryTime?: string, 
    exitTime?: string, 
    status?: string
  ) => {
    if (!studentData?.id) return

    setAllStudents((prev) => {
      let alreadyPresentBefore = false
      const updated = prev.map((s) => {
        if (s.id === studentData.id) {
          if (s.attendance && s.attendance.entry_time && s.attendance.status !== 'Alpha') {
            alreadyPresentBefore = true
          }
          const prevAtt = s.attendance || {}
          return {
            ...s,
            attendance: {
              ...prevAtt,
              entry_time: entryTime || studentData.entry_time || prevAtt.entry_time || '',
              exit_time: exitTime || studentData.exit_time || prevAtt.exit_time || '',
              status: status || studentData.status || prevAtt.status || 'Hadir'
            }
          }
        }
        return s
      })

      const presentCount = updated.filter(
        (s) => s.attendance && s.attendance.entry_time && s.attendance.status !== 'Alpha'
      ).length
      setPresentStudentsCount(presentCount)

      return updated
    })
  }

  const fetchAttendanceList = async (force: boolean = false) => {
    const now = Date.now()
    if (isFetchingRef.current) return
    if (!force && (now - lastFetchTimeRef.current < 15000)) return

    isFetchingRef.current = true
    lastFetchTimeRef.current = now

    try {
      const today = new Date()
      const offset = 7 * 60 * 60 * 1000
      const localDate = new Date(today.getTime() + offset)
      const dateStr = localDate.toISOString().split('T')[0]

      // ── DIRECT SUPABASE — bypass Hostinger sepenuhnya ──
      // 1. Ambil semua siswa aktif sesuai kelas
      let studentsQuery = supabase
        .from('students')
        .select('id, name, class, rfid_number, is_active')
        .eq('is_active', true)
        .order('name')

      // Filter kelas sesuai device
      const rawClassLower = (rawClassName || '').toLowerCase().trim()
      if (rawClassLower === 'kelas1' || rawClassLower === '1bcd') {
        studentsQuery = studentsQuery.in('class', ['1B', '1C', '1D', '1b', '1c', '1d'])
      } else if (rawClassLower === '1a') {
        studentsQuery = studentsQuery.eq('class', '1A')
      } else if (rawClassName) {
        studentsQuery = studentsQuery.ilike('class', rawClassName.toUpperCase())
      }

      const { data: studentsData, error: studentsError } = await studentsQuery
      if (studentsError) throw studentsError
      const students = (studentsData || []) as any[]

      // 2. Ambil attendance hari ini untuk semua siswa tersebut
      const studentIds = students.map((s: any) => s.id)
      let attendanceMap: Record<string, any> = {}

      if (studentIds.length > 0) {
        const { data: attendanceData } = await supabase
          .from('student_attendances')
          .select('id, student_id, date, status, entry_time, exit_time')
          .eq('date', dateStr)
          .in('student_id', studentIds)

        for (const att of (attendanceData || []) as any[]) {
          attendanceMap[att.student_id] = att
        }
      }

      // 3. Gabungkan
      const combined = students.map((s: any) => ({
        ...s,
        attendance: attendanceMap[s.id] || null
      }))

      const presentCount = combined.filter(
        (s: any) => s.attendance?.entry_time && s.attendance?.status !== 'Alpha'
      ).length

      setTotalStudents(students.length)
      setPresentStudentsCount(presentCount)
      setAllStudents(combined)
    } catch (err) {
      console.error('Error fetching student attendance list', err)
    } finally {
      isFetchingRef.current = false
    }
  }


  // Realtime clock & initial mount
  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setTime(new Date()), 1000)
    if (typeof window !== 'undefined' && 'NDEFReader' in window) setNfcSupported(true)

    if (rawClassName) {
      fetchAttendanceList(true)
    }

    // Background sync saat tab aktif kembali
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchAttendanceList(false)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [rawClassName])

  // Supabase Realtime broadcast listener (Scoped strictly to this class channel)
  useEffect(() => {
    try {
      const cleanClassName = (rawClassName || '').toLowerCase().replace(/kelas/g, '').replace(/[^a-z0-9]/g, '').trim()
      const channelName = isClass1A ? 'mia-attendance-sync-1a' : `mia-attendance-sync-${cleanClassName || 'all'}`
      const channel = supabase.channel(channelName)

      channel
        .on(
          'broadcast',
          { event: 'scan_result_siswa' },
          (payload) => {
            const data = payload.payload
            if (data.sender === clientIdRef.current) return

            // Hanya proses scan berhasil untuk kelas ini
            if (!data.success || !data.student || !data.student.class) return

            const studClean = data.student.class.toLowerCase().replace(/kelas/g, '').replace(/[^a-z0-9]/g, '').trim()
            const isMatch = isClass1A ? studClean === '1a' : (cleanClassName ? studClean === cleanClassName : true)

            if (!isMatch) return

            showPopupRef.current({
              type: 'success',
              message: data.message,
              action: data.action,
              student: data.student
            })

            if (data.student?.id) {
              setLastScannedStudentId(data.student.id)
              setTimeout(() => setLastScannedStudentId(null), 8000)
            }

            // Update state secara optimis instan dari broadcast payload
            updateStudentInState(
              data.student,
              data.action,
              data.entry_time,
              data.exit_time,
              data.status
            )
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
  }, [rawClassName, isClass1A])

  // ─────────────────────────────────────────────────────────────────
  // RFID DEBOUNCE BATCH SENDER
  // Semua scan dikumpulkan selama 800ms setelah kartu TERAKHIR di-scan,
  // baru dikirim dalam 1 request tunggal. Menjamin hanya 1 HTTP request
  // yang menyentuh server Hostinger per "sesi scan brutal" —
  // mustahil trigger WAF IP ban dari jaringan sekolah (NAT).
  // ─────────────────────────────────────────────────────────────────
  const pendingRfidsRef = useRef<string[]>([])
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isSendingRef = useRef(false)
  const lastScannedRfidRef = useRef<{ rfid: string, time: number }>({ rfid: '', time: 0 })

  const displayBatchResults = async (results: any[]) => {
    for (const item of results) {
      const popupPayload: PopupData = item.success
        ? { type: 'success', message: item.message, action: item.action, student: item.student }
        : { type: 'error', message: item.error || 'Absensi gagal.', action: item.action }

      if (item.success && item.student?.id) {
        setLastScannedStudentId(item.student.id)
        setTimeout(() => setLastScannedStudentId(null), 8000)
        updateStudentInState(
          item.student, item.action, item.entry_time, item.exit_time, item.status
        )
        if (broadcastChannelRef.current) {
          broadcastChannelRef.current.send({
            type: 'broadcast',
            event: 'scan_result_siswa',
            payload: {
              sender: clientIdRef.current,
              success: true,
              message: item.message,
              action: item.action,
              status: item.status,
              entry_time: item.entry_time,
              exit_time: item.exit_time,
              student: item.student
            }
          })
        }
      }

      showPopup(popupPayload)

      // Jika batch > 1, beri jeda 1.5 detik agar popup bisa dibaca
      if (results.length > 1) {
        await new Promise(r => setTimeout(r, 1500))
      }
    }
  }

  const flushBatch = async () => {
    if (isSendingRef.current || pendingRfidsRef.current.length === 0) return
    isSendingRef.current = true

    // Ambil semua yang ada di pending
    const batchRfids = [...pendingRfidsRef.current]
    pendingRfidsRef.current = []

    // Proses setiap RFID langsung ke Supabase — tidak melalui Hostinger
    const results: any[] = []
    const notificationsToSend: any[] = []

    for (const rfid of batchRfids) {
      try {
        const result = await scanRfidDirect(rfid, rawClassName)
        results.push(result)
        if (result.success && result.notifyData) {
          notificationsToSend.push(result.notifyData)
        }
      } catch (err: any) {
        results.push({ success: false, error: err.message || 'Gagal memproses kartu.' })
      }
    }

    if (notificationsToSend.length > 0) {
      // Fire-and-forget push notif batch via server (satu request saja untuk semua)
      fetch('/api/attendance-siswa/notify', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ notifications: notificationsToSend }) 
      }).catch(() => {})
    }

    await displayBatchResults(results)

    isSendingRef.current = false

    if (pendingRfidsRef.current.length > 0) {
      await flushBatch()
    }
  }


  const processRfid = (rfid: string) => {
    const cleanRfid = String(rfid).trim().toUpperCase()
    const now = Date.now()

    // Cegah scan kartu SAMA dalam 3 detik
    if (lastScannedRfidRef.current.rfid === cleanRfid && (now - lastScannedRfidRef.current.time) < 3000) {
      return
    }

    lastScannedRfidRef.current = { rfid: cleanRfid, time: now }

    // Tambahkan ke pending batch
    pendingRfidsRef.current.push(cleanRfid)

    // Reset debounce timer: tunggu 800ms setelah kartu TERAKHIR di-scan
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      flushBatch()
    }, 800)
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
        if (rfidBuffer.length >= 4) {
          processRfid(rfidBuffer.toUpperCase())
          rfidBuffer = ''
        }
        return
      }

      if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
        rfidBuffer += e.key

        // Wait for typing to complete if scanner does not emit Enter
        scanTimeoutId = setTimeout(() => {
          if (rfidBuffer.length >= 4) {
            processRfid(rfidBuffer.toUpperCase())
            rfidBuffer = ''
          }
        }, 350)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      clearTimeout(scanTimeoutId)
    }
  }, [rawClassName])

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
          const rfid = serialNumber.replace(/[:\s-]/g, '').toUpperCase()
          await processRfid(rfid)
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
      console.error('NFC Error:', error)
      showPopup({ 
        type: 'error', 
        message: error.name === 'NotAllowedError' 
          ? 'Izin NFC ditolak pada browser.' 
          : 'Gagal mengaktifkan NFC (Pastikan NFC aktif di pengaturan HP & browser Chrome mendukung Web NFC).' 
      })
    }
  }

  // Categorize students
  const presentList = useMemo(() => {
    const list = allStudents.filter(s => s.attendance && s.attendance.entry_time && s.attendance.status !== 'Alpha')
    return list.sort((a, b) => (b.attendance?.entry_time || '').localeCompare(a.attendance?.entry_time || ''))
  }, [allStudents])

  const absentList = useMemo(() => {
    return allStudents.filter(s => !s.attendance || !s.attendance.entry_time || s.attendance.status === 'Alpha')
  }, [allStudents])

  // Filtered list to display
  const displayedStudents = useMemo(() => {
    let list: StudentAttendance[] = []
    if (viewFilter === 'HADIR') list = presentList
    else if (viewFilter === 'BELUM_HADIR') list = absentList
    else list = allStudents

    if (!searchQuery.trim()) return list
    const q = searchQuery.toLowerCase()
    return list.filter(s => s.name.toLowerCase().includes(q))
  }, [viewFilter, presentList, absentList, allStudents, searchQuery])

  const presentPercentage = totalStudents > 0 
    ? Math.round((presentStudentsCount / totalStudents) * 100) 
    : 0

  if (!mounted) {
    return <div className="h-screen w-full bg-slate-950 flex items-center justify-center" />
  }

  return (
    <main className="min-h-screen md:h-screen md:max-h-screen w-full bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-y-auto md:overflow-hidden relative">
      
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
        <div className="absolute -top-40 left-1/4 w-[600px] h-[400px] bg-sky-600/15 blur-[140px] rounded-full" />
        <div className="absolute -top-40 right-1/4 w-[600px] h-[400px] bg-indigo-600/15 blur-[140px] rounded-full" />
        <div className="absolute bottom-0 left-1/3 w-[700px] h-[300px] bg-emerald-600/10 blur-[150px] rounded-full" />
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 1. TOP HEADER - MOBILE RESPONSIVE */}
      {/* ──────────────────────────────────────────────────────────── */}
      <header className="relative z-20 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 px-3 md:px-6 py-3 shadow-xl flex-shrink-0">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full">
          
          {/* Brand & Kiosk Location */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto text-center sm:text-left">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/logosmart/smartputihver.png" 
              alt="Logo MI Attaqwa 15" 
              className="h-10 md:h-12 object-contain filter drop-shadow mx-auto sm:mx-0" 
            />
            <div className="flex flex-col items-center sm:items-start">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-sky-400 text-slate-950 tracking-wider shadow-sm">
                  {isClass1A ? 'Gedung 1' : 'Gedung Madrasah'}
                </span>
                <span className="text-[10px] md:text-[11px] font-bold text-slate-400 tracking-wide">
                  Pos Absensi Siswa Kelas {formattedClassName}
                </span>
              </div>
              <h1 className="text-sm md:text-lg font-black text-white tracking-wide uppercase mt-1 drop-shadow-sm leading-tight text-center sm:text-left">
                MI Attaqwa 15 Babelan
              </h1>
            </div>
          </div>

          {/* Center: Live Digital Clock & Indonesian Date */}
          <div className="flex flex-col items-center justify-center bg-slate-950/70 px-4 md:px-5 py-2 rounded-2xl border border-white/10 shadow-inner w-full sm:w-auto mt-2 md:mt-0">
            <div className="flex items-center gap-1.5 text-lg md:text-2xl font-black tracking-tight text-white font-mono">
              <span>{time.getHours().toString().padStart(2, '0')}</span>
              <span className="text-amber-400 animate-pulse font-light">:</span>
              <span>{time.getMinutes().toString().padStart(2, '0')}</span>
              <span className="text-amber-400 animate-pulse font-light">:</span>
              <span className="text-amber-300">{time.getSeconds().toString().padStart(2, '0')}</span>
              <span className="text-[9px] md:text-[10px] font-sans font-bold text-slate-400 ml-1">WIB</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] md:text-[11px] text-slate-300 font-medium">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>{getIndonesianDate()}</span>
            </div>
          </div>

          {/* Right: Scanner Status & Total Hadir Pill */}
          <div className="flex flex-row flex-wrap justify-center sm:justify-end items-center gap-2.5 w-full md:w-auto mt-2 md:mt-0">
            
            {/* NFC Button if smartphone */}
            {nfcSupported && !nfcActive && (
              <button
                onClick={startNfcScan}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] md:text-[11px] font-bold shadow-lg transition transform hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer border border-blue-400/40"
              >
                <Wifi className="w-3 h-3" />
                NFC HP
              </button>
            )}

            {/* Live Scanner Siaga Pill */}
            <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-500/40 px-3 py-2 rounded-xl text-emerald-400 text-[10px] md:text-xs font-bold shadow-sm backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>SCANNER SIAGA</span>
            </div>

            {/* Total Hadir Card for this class */}
            <div className="bg-slate-800/90 border border-slate-700/80 px-3.5 py-1.5 rounded-xl text-right">
              <div className="text-[8px] md:text-[9px] uppercase font-bold text-slate-400 tracking-wider text-center sm:text-right">
                Kelas {formattedClassName}
              </div>
              <div className="text-xs md:text-base font-black text-white text-center sm:text-right">
                {presentStudentsCount} <span className="text-slate-400 text-[10px] md:text-xs font-semibold">/ {totalStudents}</span>
                <span className="ml-1 md:ml-1.5 text-[10px] md:text-xs font-bold text-emerald-400">({presentPercentage}%)</span>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 2. MAIN BODY - FULL ROSTER / INNER SCROLLABLE ONLY */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 relative z-10 p-3 lg:p-4 flex flex-col gap-3 max-w-[1800px] w-full mx-auto overflow-visible md:overflow-hidden h-auto md:h-full">
        
        {/* Class Banner Summary (Fixed) */}
        <section className="bg-slate-900/90 backdrop-blur-md rounded-2xl lg:rounded-3xl border border-sky-500/30 p-3.5 lg:p-4 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4 flex-shrink-0">
          <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-48 h-48 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Left: Class Identity */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto text-center sm:text-left z-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-700 border border-white/20 flex items-center justify-center font-black text-xl text-white shadow-lg mx-auto sm:mx-0">
              {formattedClassName}
            </div>
            <div>
              <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-sky-500/20 text-sky-300 border border-sky-400/40">
                  {isClass1A ? 'Gedung 1 - Lantai 1' : 'Unit Kelas'}
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-400 font-semibold">Tahun Ajaran 2026/2027</span>
              </div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-white tracking-tight mt-1 text-center sm:text-left">
                Daftar Kehadiran Siswa Kelas {formattedClassName}
              </h2>
            </div>
          </div>

          {/* Center/Right: Metrics & Tabs */}
          <div className="flex flex-col md:flex-row flex-wrap items-center gap-3 w-full md:w-auto justify-center md:justify-end z-10 mt-2 md:mt-0">
            
            {/* Quick Stat Pill */}
            <div className="bg-slate-950/70 border border-slate-800 px-3.5 py-1.5 rounded-xl flex flex-wrap justify-center items-center gap-3 w-full md:w-auto">
              <div className="text-center sm:text-left">
                <span className="text-[8px] sm:text-[9px] uppercase font-bold text-slate-400 block">Sudah Hadir</span>
                <span className="text-sm sm:text-base font-black text-emerald-400">{presentStudentsCount} Siswa</span>
              </div>
              <div className="h-6 w-[1px] bg-slate-800 hidden sm:block" />
              <div className="text-center sm:text-left">
                <span className="text-[8px] sm:text-[9px] uppercase font-bold text-slate-400 block">Belum Hadir</span>
                <span className="text-sm sm:text-base font-black text-amber-400">{totalStudents - presentStudentsCount} Siswa</span>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap justify-center items-center p-1 bg-slate-950/80 rounded-xl border border-slate-800 w-full md:w-auto">
              <button
                onClick={() => setViewFilter('HADIR')}
                className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-black transition-all flex items-center justify-center gap-1.5 flex-1 md:flex-none ${
                  viewFilter === 'HADIR'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserCheck className="w-3 h-3" />
                Sudah <span className="hidden sm:inline">Hadir ({presentStudentsCount})</span>
              </button>
              <button
                onClick={() => setViewFilter('BELUM_HADIR')}
                className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-black transition-all flex items-center justify-center gap-1.5 flex-1 md:flex-none ${
                  viewFilter === 'BELUM_HADIR'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserX className="w-3 h-3" />
                Belum <span className="hidden sm:inline">Hadir ({totalStudents - presentStudentsCount})</span>
              </button>
              <button
                onClick={() => setViewFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-black transition-all flex-1 md:flex-none text-center ${
                  viewFilter === 'ALL'
                    ? 'bg-slate-800 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Semua <span className="hidden sm:inline">({totalStudents})</span>
              </button>
            </div>

          </div>
        </section>

        {/* Search bar & count indicator (Fixed) */}
        <div className="flex items-center justify-between gap-4 flex-shrink-0">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder={`Cari nama siswa kelas ${formattedClassName}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50 backdrop-blur-sm"
            />
          </div>

          <div className="text-[11px] font-bold text-slate-400">
            Menampilkan <span className="text-white font-extrabold">{displayedStudents.length}</span> siswa
          </div>
        </div>

        {/* Student Cards Grid (Scrollable di dalam area ini) */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar overscroll-contain">
          {displayedStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800/80 text-center">
              <Users className="w-10 h-10 text-slate-600 mb-2" />
              <p className="text-sm font-bold text-slate-300">Tidak ada data siswa</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {viewFilter === 'HADIR' 
                  ? `Belum ada siswa Kelas ${formattedClassName} yang melakukan scan hari ini`
                  : 'Seluruh siswa telah melakukan absensi'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {displayedStudents.map((student, idx) => {
                const isPresent = !!(student.attendance && student.attendance.entry_time && student.attendance.status !== 'Alpha')
                const isNewlyScanned = lastScannedStudentId === student.id
                const isLate = student.attendance?.status === 'Terlambat'
                const isAfterLockTime = time.getHours() > 7 || (time.getHours() === 7 && time.getMinutes() > 15)
                const isExplicitAlpha = student.attendance?.status === 'Alpha'

                return (
                  <div
                    key={student.id}
                    className={`p-3 rounded-xl border transition-all duration-300 flex items-center justify-between gap-2.5 ${
                      isNewlyScanned
                        ? 'ring-2 ring-sky-400 border-sky-400 bg-sky-950/40 scale-[1.01] shadow-2xl animate-pulse'
                        : isPresent
                        ? 'bg-slate-900/90 border-slate-800/90 hover:border-slate-700 shadow-sm'
                        : isExplicitAlpha
                        ? 'bg-rose-950/20 border-rose-900/40 opacity-85 hover:opacity-100'
                        : 'bg-slate-950/60 border-slate-800/40 opacity-70 hover:opacity-100'
                    }`}
                  >
                    {/* Left: Avatar / Number & Name */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-[11px] flex-shrink-0 border ${
                        isPresent 
                          ? 'bg-sky-950/70 border-sky-500/30 text-sky-400' 
                          : isExplicitAlpha
                          ? 'bg-rose-950/70 border-rose-500/30 text-rose-400'
                          : 'bg-slate-800/70 border-slate-700/50 text-slate-500'
                      }`}>
                        {idx + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-extrabold text-xs lg:text-sm text-white truncate tracking-tight">
                          {student.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                            {student.class}
                          </span>
                          {isPresent ? (
                            isLate ? (
                              <span className="text-[9px] font-extrabold text-amber-400 bg-amber-950/60 px-1.5 py-0.2 rounded-md border border-amber-500/40">
                                Terlambat
                              </span>
                            ) : (
                              <span className="text-[9px] font-extrabold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded-md border border-emerald-500/40">
                                Tepat Waktu
                              </span>
                            )
                          ) : (
                            isExplicitAlpha || isAfterLockTime ? (
                              <span className="text-[9px] font-extrabold text-rose-400 bg-rose-950/60 px-1.5 py-0.2 rounded-md border border-rose-500/40">
                                Alpha
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold text-slate-500 bg-slate-900 px-1.5 py-0.2 rounded-md border border-slate-800">
                                Belum Hadir
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Timestamps */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {isPresent ? (
                        <>
                          <div className="flex items-center gap-1 bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                            <span className="text-[8px] font-black text-emerald-400 uppercase tracking-wider">Masuk</span>
                            <span className="text-[11px] font-black text-white font-mono">
                              {formatTime(student.attendance?.entry_time)}
                            </span>
                          </div>
                          {student.attendance?.exit_time && (
                            <div className="flex items-center gap-1 bg-amber-950/70 border border-amber-500/30 px-2 py-0.5 rounded-md">
                              <span className="text-[8px] font-black text-amber-400 uppercase tracking-wider">Pulang</span>
                              <span className="text-[11px] font-black text-white font-mono">
                                {formatTime(student.attendance?.exit_time)}
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-[10px] font-bold text-slate-500 italic">
                          - - : - -
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

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
                    <span className="mt-1 px-4 py-1 bg-sky-500/30 text-sky-300 border border-sky-400/40 rounded-full font-extrabold text-sm">
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
