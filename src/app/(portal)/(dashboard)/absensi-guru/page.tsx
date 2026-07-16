'use client'

import React, { useEffect, useState, useRef } from 'react'
import { Calendar, CheckCircle2, Clock, XCircle, LogIn, LogOut, Activity, AlertCircle, Fingerprint, Filter, X } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '../../../../lib/supabase/client'

// Types
type AttendanceRecord = {
  id?: string
  staff_id: string
  date: string
  status?: string | null
  notes?: string | null
  check_in_time?: string | null
  check_out_time?: string | null
}

type Staff = {
  id: string
  name: string
  position: string
  rfid: string
  attendance?: AttendanceRecord | null
  attendances?: AttendanceRecord[]
}

type LogEntry = {
  id: string
  time: string
  message: string
  type: 'success' | 'error' | 'info'
}

type FilterType = 'hari' | 'minggu' | 'bulan'

export default function AbsensiGuruPage() {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [filterType, setFilterType] = useState<FilterType>('hari')
  const [staffs, setStaffs] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [showLog, setShowLog] = useState(false)
  
  // RFID Scanner Buffer
  const rfidBuffer = useRef<string>('')
  const scanTimeout = useRef<NodeJS.Timeout | null>(null)
  
  const formatTime = (isoString?: string | null) => {
    if (!isoString) return '-'
    const d = new Date(isoString)
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  const addLog = (message: string, type: 'success' | 'error' | 'info') => {
    setLogs(prev => {
      const newLog = { id: Date.now().toString(), time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), message, type }
      return [newLog, ...prev].slice(0, 50)
    })
  }

  const fetchAttendance = async (selectedDate: string, currentFilter: FilterType) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/attendance/guru?date=${selectedDate}&filter=${currentFilter}`)
      const data = await res.json()
      if (data.success) {
        setStaffs(data.data)
      }
    } catch (err) {
      console.error(err)
      addLog('Gagal memuat data absensi.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAttendance(date, filterType)
  }, [date, filterType])

  // Setup Supabase Realtime
  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'staff_attendance',
        },
        () => {
          fetchAttendance(date, filterType)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [date, filterType])

  // RFID Scanner Listener
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

  const handleScan = async (rfid: string) => {
    addLog(`Memproses scan...`, 'info')
    
    try {
      const res = await fetch('/api/attendance/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rfid })
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || 'Gagal memproses kartu')
      
      addLog(data.message || 'Scan berhasil', 'success')
      // Only show log panel if we want to force open it, but user might find it annoying if it auto opens.
      // setShowLog(true)
    } catch (err: any) {
      addLog(err.message, 'error')
    }
  }

  // Determine Default Status based on 09:00 rule
  const getAttendanceStatus = (att: AttendanceRecord | null | undefined) => {
    if (att && att.status) return att.status

    const selectedDate = new Date(date)
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    if (date < todayStr) return 'TIDAK MASUK'
    if (date === todayStr) {
      const hours = today.getHours()
      const minutes = today.getMinutes()
      if (hours > 9 || (hours === 9 && minutes > 0)) {
        return 'TIDAK MASUK'
      }
    }
    return '-'
  }

  // Calculate summaries for the selected period
  const globalSummary = {
    HADIR: 0,
    TIDAK_MASUK: 0,
    IZIN: 0,
    SAKIT: 0,
  }
  
  if (filterType === 'hari') {
    staffs.forEach(s => {
      const status = getAttendanceStatus(s.attendance)
      if (status === 'HADIR') globalSummary.HADIR++
      else if (status === 'IZIN') globalSummary.IZIN++
      else if (status === 'SAKIT') globalSummary.SAKIT++
      else if (status === 'TIDAK MASUK') globalSummary.TIDAK_MASUK++
    })
  } else {
    // For minggu/bulan, summarize all attendances
    staffs.forEach(s => {
      s.attendances?.forEach(att => {
        if (att.status === 'HADIR') globalSummary.HADIR++
        else if (att.status === 'IZIN') globalSummary.IZIN++
        else if (att.status === 'SAKIT') globalSummary.SAKIT++
      })
    })
  }

  return (
    <div className="w-full flex flex-col font-sans relative">
      
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Absensi Guru & Staff</h1>
            <p className="text-slate-500 text-sm mt-1">Sistem Absensi Real-Time via Scanner RFID.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Filter className="text-slate-400" size={16} />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as FilterType)}
                className="pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-btn-primary focus:ring-4 focus:ring-btn-primary/10 transition font-medium text-slate-700 shadow-sm outline-none appearance-none"
              >
                <option value="hari">Harian</option>
                <option value="minggu">Mingguan</option>
                <option value="bulan">Bulanan</option>
              </select>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Calendar className="text-slate-400" size={18} />
              </div>
              <input
                type={filterType === 'bulan' ? 'month' : 'date'}
                value={filterType === 'bulan' ? date.substring(0, 7) : date}
                onChange={(e) => {
                  let val = e.target.value
                  if (filterType === 'bulan' && val.length === 7) val += '-01'
                  setDate(val)
                }}
                className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-btn-primary focus:ring-4 focus:ring-btn-primary/10 transition font-medium text-slate-700 shadow-sm outline-none"
              />
            </div>

            <button 
              onClick={() => setShowLog(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-sm transition"
            >
              <Activity size={18} className="text-btn-secondary" />
              Activity Log
              {logs.length > 0 && (
                <span className="ml-1 bg-btn-secondary text-white text-xs px-2 py-0.5 rounded-full">{logs.length}</span>
              )}
            </button>
          </div>
        </div>

        {/* Listening Indicator (Only for daily view today) */}
        {filterType === 'hari' && date === new Date().toISOString().split('T')[0] && (
          <div className="bg-btn-primary/5 border border-btn-primary/10 rounded-2xl p-4 flex items-center justify-center gap-3 animate-pulse">
            <Fingerprint className="text-btn-primary" size={24} />
            <span className="text-btn-primary font-semibold text-sm">Sistem aktif mendengarkan Scanner RFID...</span>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 flex flex-col gap-2 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle2 size={20} />
              </div>
              <p className="text-[16px] font-bold text-slate-400 uppercase tracking-wider">Hadir</p>
            </div>
            <p className="text-3xl font-black text-slate-800 ml-1">{globalSummary.HADIR}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 flex flex-col gap-2 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Clock size={20} />
              </div>
              <p className="text-[16px] font-bold text-slate-400 uppercase tracking-wider">Izin</p>
            </div>
            <p className="text-3xl font-black text-slate-800 ml-1">{globalSummary.IZIN}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 flex flex-col gap-2 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                <AlertCircle size={20} />
              </div>
              <p className="text-[16px] font-bold text-slate-400 uppercase tracking-wider">Sakit</p>
            </div>
            <p className="text-3xl font-black text-slate-800 ml-1">{globalSummary.SAKIT}</p>
          </div>
          {filterType === 'hari' && (
            <div className="bg-white rounded-2xl p-5 flex flex-col gap-2 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                  <XCircle size={20} />
                </div>
                <p className="text-[16px] font-bold text-slate-400 uppercase tracking-wider">Tidak Masuk</p>
              </div>
              <p className="text-3xl font-black text-slate-800 ml-1">{globalSummary.TIDAK_MASUK}</p>
            </div>
          )}
        </div>

        {/* Staff Cards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full p-10 text-center text-slate-500 bg-white rounded-2xl border border-slate-100">
              Memuat data absensi...
            </div>
          ) : staffs.length === 0 ? (
            <div className="col-span-full p-10 text-center text-slate-500 bg-white rounded-2xl border border-slate-100">
              Belum ada data guru/staff yang aktif.
            </div>
          ) : (
            staffs.map((staff) => {
              
              if (filterType === 'hari') {
                const att = staff.attendance
                const status = getAttendanceStatus(att)
                
                let statusColor = 'bg-slate-100 text-slate-500 border-slate-200'
                if (status === 'HADIR') statusColor = 'bg-emerald-50 text-emerald-700 border-emerald-200'
                if (status === 'TERLAMBAT') statusColor = 'bg-yellow-50 text-yellow-700 border-yellow-200'
                if (status === 'IZIN') statusColor = 'bg-blue-50 text-blue-700 border-blue-200'
                if (status === 'SAKIT') statusColor = 'bg-orange-50 text-orange-700 border-orange-200'
                if (status === 'TIDAK MASUK' || status === 'ALPA') statusColor = 'bg-red-50 text-red-700 border-red-200'
                
                return (
                  <Link key={staff.id} href={`/guru/${staff.id}`} className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col gap-5 cursor-pointer hover:border-slate-300">
                    {/* Top info: Avatar + Name + Overall Status */}
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 shadow-inner">
                          {getInitials(staff.name)}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-md">{staff.name}</h3>
                          <p className="text-[14px]  text-slate-500 ">{staff.position}</p>
                        </div>
                      </div>
                      <div className={`px-4 py-1 mt-2 rounded-full text-[10px] font-bold border ${statusColor}`}>
                        {status}
                      </div>
                    </div>

                    {/* Bottom info: Check-in & Check-out Times */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center text-emerald-500 flex-shrink-0">
                          <LogIn size={14} />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider truncate">Waktu Masuk</p>
                          <p className="text-md font-semibold text-slate-700 truncate">{formatTime(att?.check_in_time)}</p>
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center text-orange-500 flex-shrink-0">
                          <LogOut size={14} />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider truncate">Waktu Keluar</p>
                          <p className="text-md font-semibold text-slate-700 truncate">{formatTime(att?.check_out_time)}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              } else {
                // Summary View for Week / Month
                const sum = { HADIR: 0, IZIN: 0, SAKIT: 0 }
                staff.attendances?.forEach(att => {
                  if (att.status === 'HADIR') sum.HADIR++
                  else if (att.status === 'IZIN') sum.IZIN++
                  else if (att.status === 'SAKIT') sum.SAKIT++
                })

                return (
                  <Link key={staff.id} href={`/guru/${staff.id}`} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col gap-5 cursor-pointer hover:border-slate-300">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 shadow-inner">
                        {getInitials(staff.name)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">{staff.name}</h3>
                        <p className="text-[11px] font-medium text-slate-500 mt-0.5">{staff.position}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-emerald-50 rounded-xl p-2 text-center border border-emerald-100">
                        <p className="text-[10px] font-bold text-emerald-600 uppercase">Hadir</p>
                        <p className="text-lg font-black text-emerald-700">{sum.HADIR}</p>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-2 text-center border border-blue-100">
                        <p className="text-[10px] font-bold text-blue-600 uppercase">Izin</p>
                        <p className="text-lg font-black text-blue-700">{sum.IZIN}</p>
                      </div>
                      <div className="bg-orange-50 rounded-xl p-2 text-center border border-orange-100">
                        <p className="text-[10px] font-bold text-orange-600 uppercase">Sakit</p>
                        <p className="text-lg font-black text-orange-700">{sum.SAKIT}</p>
                      </div>
                    </div>
                  </Link>
                )
              }
            })
          )}
        </div>
      </div>

      {/* RIGHT SLIDE-OVER - Realtime Log */}
      {showLog && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setShowLog(false)}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-slate-900 shadow-2xl z-50 flex flex-col transform transition-transform border-l border-slate-800">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="text-btn-secondary" size={20} />
                <h2 className="text-lg font-bold text-white">Live Activity Log</h2>
              </div>
              <button 
                onClick={() => setShowLog(false)}
                className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-50">
                  <Fingerprint className="text-slate-500" size={32} />
                  <p className="text-slate-400 text-sm">Menunggu aktivitas scan...</p>
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex gap-3 text-sm">
                    <div className="flex-shrink-0 mt-0.5">
                      {log.type === 'success' && <CheckCircle2 size={16} className="text-emerald-400" />}
                      {log.type === 'error' && <XCircle size={16} className="text-red-400" />}
                      {log.type === 'info' && <Clock size={16} className="text-blue-400" />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 font-mono font-medium mb-0.5">{log.time}</span>
                      <span className={`font-medium leading-snug ${
                        log.type === 'success' ? 'text-emerald-50' : 
                        log.type === 'error' ? 'text-red-200' : 'text-blue-50'
                      }`}>
                        {log.message}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

    </div>
  )
}

