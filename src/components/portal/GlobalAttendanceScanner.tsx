'use client'

import React, { useEffect, useState, useRef } from 'react'
import { Bell, X } from 'lucide-react'
import { supabase } from '../../lib/supabase/client'
import { generateRfidVariants } from '@/lib/rfidUtils'
import { 
  TEACHER_ATTENDANCE_CONFIG, 
  determineTeacherShift, 
  evaluateTeacherCheckIn 
} from '@/config/attendanceRules'

// ─────────────────────────────────────────────────────────────────────────────
// DIRECT SUPABASE SCAN GURU — BYPASS HOSTINGER WAF SEPENUHNYA
// ─────────────────────────────────────────────────────────────────────────────
const staffScanCache = new Map<string, { timestamp: number; response: any }>()
const STAFF_DEDUP_MS = 2500
const scheduleCache = new Map<string, { timestamp: number; schedules: any[] }>()
const SCHEDULE_TTL = 5 * 60 * 1000

async function getTeacherSchedulesDirect(teacherId: string): Promise<any[]> {
  const cached = scheduleCache.get(teacherId)
  if (cached && Date.now() - cached.timestamp < SCHEDULE_TTL) return cached.schedules

  const [{ data: schedulesData }, { data: homeroomClassrooms }] = await Promise.all([
    supabase
      .from('classroom_schedules')
      .select('id, day, time, classroom_id, classroom:classrooms(id, name, level)')
      .eq('teacher_id', teacherId),
    supabase
      .from('classrooms')
      .select('id, name, level')
      .eq('homeroom_teacher_id', teacherId)
  ])

  const allSchedules = [
    ...((schedulesData as any[]) || []),
    ...((homeroomClassrooms as any[]) || []).map((c: any) => ({
      day: '', time: '', classroom: { name: c.name }, classroom_name: c.name
    }))
  ]

  scheduleCache.set(teacherId, { timestamp: Date.now(), schedules: allSchedules })
  return allSchedules
}

async function scanStaffDirect(rfid: string): Promise<any> {
  const cleanRfid = String(rfid).trim().toUpperCase()
  const now = Date.now()

  const cached = staffScanCache.get(cleanRfid)
  if (cached && now - cached.timestamp < STAFF_DEDUP_MS) return cached.response

  const rfidVariants = generateRfidVariants(cleanRfid)

  const { data: staffsData, error: staffError } = await supabase
    .from('staffs')
    .select('id, name, position, rfid, image, is_active')
    .in('rfid', rfidVariants)
    .eq('is_active', true)
    .limit(1)

  if (staffError) throw staffError
  const staffs = (staffsData as any[]) || []

  if (staffs.length === 0) {
    return { success: false, error: `Kartu RFID/NFC (${cleanRfid}) belum terdaftar pada data guru/staf aktif.` }
  }

  const staff = staffs[0]
  const today = new Date()
  const offset = 7 * 60 * 60 * 1000
  const localDate = new Date(today.getTime() + offset)
  const dateStr = localDate.toISOString().split('T')[0]
  const nowIso = new Date().toISOString()
  const hours = localDate.getUTCHours()
  const mins = localDate.getUTCMinutes()
  const currentTimeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  const daysIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const todayDayName = daysIndo[localDate.getUTCDay()]

  const allTeacherSchedules = await getTeacherSchedulesDirect(staff.id)
  const shiftData = determineTeacherShift(staff, allTeacherSchedules, todayDayName)
  let shiftConfig: any = TEACHER_ATTENDANCE_CONFIG.MORNING_SHIFT
  if (shiftData.shift === 'Siang') shiftConfig = TEACHER_ATTENDANCE_CONFIG.AFTERNOON_SHIFT
  else if (shiftData.shift === 'Khusus') shiftConfig = TEACHER_ATTENDANCE_CONFIG.SPECIAL_SHIFT

  const { data: existingRecords, error: checkError } = await supabase
    .from('staff_attendance')
    .select('id, staff_id, date, status, notes, check_in_time, check_out_time')
    .eq('staff_id', staff.id)
    .eq('date', dateStr)
    .limit(1)

  if (checkError) throw checkError
  const existingRecord: any = (existingRecords as any[])?.length > 0 ? (existingRecords as any[])[0] : null

  if (!existingRecord) {
    const checkInEval = evaluateTeacherCheckIn(shiftData, hours, mins)

    const { data: newRecord, error: insertError } = await supabase
      .from('staff_attendance')
      .insert({
        staff_id: staff.id, date: dateStr, status: checkInEval.status,
        notes: checkInEval.notes, check_in_time: nowIso, updated_at: nowIso
      } as any)
      .select('id, staff_id, date, status, notes, check_in_time, check_out_time')
      .single()

    if (insertError) throw insertError

    const msg = checkInEval.isLate
      ? `Absen Masuk [Datang Terlambat] (${currentTimeStr} WIB - ${shiftConfig.name}): ${staff.name}`
      : `Absen Masuk [Tepat Waktu] (${currentTimeStr} WIB - ${shiftConfig.name}): ${staff.name}`

    const successResp = { success: true, action: 'check-in', status: checkInEval.status, is_late: checkInEval.isLate, shift: shiftData.shift, message: msg, data: newRecord, staff: { ...staff, status: checkInEval.status, is_late: checkInEval.isLate, shift: shiftData.shift } }
    staffScanCache.set(cleanRfid, { timestamp: now, response: successResp })
    return successResp

  } else {
    if (existingRecord.check_out_time) {
      const resp = { success: false, action: 'already-checked-out', error: `${staff.name} sudah melakukan Absen Pulang hari ini.` }
      staffScanCache.set(cleanRfid, { timestamp: now, response: resp })
      return resp
    }

    const currentMinutes = hours * 60 + mins
    const minCheckoutMinutes = shiftConfig.CHECKOUT_MIN_TIME.hours * 60 + shiftConfig.CHECKOUT_MIN_TIME.minutes

    if (currentMinutes < minCheckoutMinutes) {
      const resp = { success: false, action: 'too-early-checkout', error: `${staff.name} (${staff.position || 'Guru'}) - Belum waktunya absen pulang ${shiftConfig.name} (Minimal pukul ${shiftConfig.CHECKOUT_MIN_TIME.timeString} WIB)` }
      staffScanCache.set(cleanRfid, { timestamp: now, response: resp })
      return resp
    }

    const { data: updateRecord, error: updateError } = await (supabase.from('staff_attendance') as any)
      .update({ check_out_time: nowIso, updated_at: nowIso })
      .eq('id', existingRecord.id)
      .select()
      .single()

    if (updateError) throw updateError

    const outResp = { success: true, action: 'check-out', message: `Berhasil Absen Pulang (${currentTimeStr} WIB): ${staff.name}`, data: updateRecord, staff }
    staffScanCache.set(cleanRfid, { timestamp: now, response: outResp })
    return outResp
  }
}

export function GlobalAttendanceScanner() {
  const [toast, setToast] = useState<{show: boolean, message: string}>({show: false, message: ''})
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const clientIdRef = useRef(Math.random().toString(36).substring(7))
  const broadcastChannelRef = useRef<any>(null)
  
  const rfidBuffer = useRef<string>('')
  const scanTimeout = useRef<NodeJS.Timeout | null>(null)

  const showToast = (message: string) => {
    setToast({show: true, message})
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    toastTimeoutRef.current = setTimeout(() => setToast({show: false, message: ''}), 5000)
  }
  const showToastRef = useRef(showToast)
  showToastRef.current = showToast

  useEffect(() => {
    const channel = supabase.channel('mia-attendance-sync')
    
    channel
      .on('broadcast', { event: 'scan_result' }, (payload) => {
        const data = payload.payload
        if (data.sender === clientIdRef.current) return
        const msg = data.success ? (data.message || 'Scan absensi berhasil!') : (data.error || 'Scan absensi gagal')
        showToastRef.current(msg)
        window.dispatchEvent(new CustomEvent('mia_local_scan', { detail: data }))
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          broadcastChannelRef.current = channel
        }
      })
      
    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return

      if (e.key === 'Enter') {
        const scannedRfid = rfidBuffer.current.trim()
        if (scannedRfid.length > 3) {
          handleScan(scannedRfid)
        }
        rfidBuffer.current = ''
        return
      }

      if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
        rfidBuffer.current += e.key
        
        if (scanTimeout.current) clearTimeout(scanTimeout.current)
        scanTimeout.current = setTimeout(() => {
          rfidBuffer.current = ''
        }, 150)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (scanTimeout.current) clearTimeout(scanTimeout.current)
    }
  }, [])

  const pendingRfidsRef = useRef<string[]>([])
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isSendingRef = useRef(false)
  const lastScannedRfidRef = useRef<{ rfid: string; time: number }>({ rfid: '', time: 0 })

  const flushBatch = async () => {
    if (isSendingRef.current || pendingRfidsRef.current.length === 0) return
    isSendingRef.current = true

    const batchRfids = [...pendingRfidsRef.current]
    pendingRfidsRef.current = []

    // Proses setiap RFID langsung ke Supabase — tidak melalui Hostinger
    for (const rfid of batchRfids) {
      try {
        const item = await scanStaffDirect(rfid)

        if (item.success) {
          showToastRef.current(item.message || 'Scan berhasil!')
          window.dispatchEvent(new CustomEvent('mia_local_scan', { detail: {
            success: true, message: item.message, action: item.action, staff: item.staff
          }}))
          if (broadcastChannelRef.current) {
            broadcastChannelRef.current.send({
              type: 'broadcast', event: 'scan_result',
              payload: { sender: clientIdRef.current, success: true, message: item.message, action: item.action, staff: item.staff }
            })
          }
        } else {
          showToastRef.current(item.error || 'Gagal memproses kartu')
          window.dispatchEvent(new CustomEvent('mia_local_scan', { detail: { success: false, message: item.error || 'Gagal memproses kartu' } }))
        }

        if (batchRfids.length > 1) {
          await new Promise(r => setTimeout(r, 1200))
        }
      } catch (err: any) {
        showToastRef.current(err.message || 'Gagal memproses kartu guru')
      }
    }

    isSendingRef.current = false

    if (pendingRfidsRef.current.length > 0) {
      await flushBatch()
    }
  }

  const handleScan = (rfid: string) => {
    const cleanRfid = String(rfid).trim().toUpperCase()
    const now = Date.now()

    if (lastScannedRfidRef.current.rfid === cleanRfid && (now - lastScannedRfidRef.current.time) < 3000) {
      return
    }

    lastScannedRfidRef.current = { rfid: cleanRfid, time: now }
    pendingRfidsRef.current.push(cleanRfid)

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      flushBatch()
    }, 800)
  }


  if (!toast.show) return null

  return (
    <div className="fixed bottom-6 right-6 z-[99999] animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-none">
      <div className="bg-white border border-emerald-100 shadow-lg shadow-emerald-100/50 rounded-2xl p-4 pr-12 flex items-center gap-4 relative pointer-events-auto">
        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
          <Bell size={18} />
        </div>
        <p className="text-sm text-slate-700 font-medium">{toast.message}</p>
        <button
          onClick={() => setToast({show: false, message: ''})}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
