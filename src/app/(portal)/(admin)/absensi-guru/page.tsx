'use client'

import React, { useEffect, useState, useRef } from 'react'
import { Calendar, CheckCircle2, Clock, XCircle, LogIn, LogOut, Activity, AlertCircle, Fingerprint, Filter, X, LayoutGrid, List, ArrowDownAZ, ArrowUpAZ, Bell, Trash2, ClipboardCheck } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '../../../../lib/supabase/client'
import { canManageTeachers } from '@/lib/rbac'

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
  image?: string | null
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
  const [date, setDate] = useState<string>(() => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  })
  const [filterType, setFilterType] = useState<FilterType>('hari')
  const [staffs, setStaffs] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [showLog, setShowLog] = useState(false)
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [viewPersonalOnly, setViewPersonalOnly] = useState<boolean>(true)

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return '—'
    const validIso = (!isoString.endsWith('Z') && !isoString.includes('+')) ? `${isoString}Z` : isoString
    const d = new Date(validIso)
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }

  const handleSoftDelete = async (e: React.MouseEvent, staffId: string, type: 'in' | 'out') => {
    e.preventDefault();
    if (!confirm(`Yakin ingin menghapus jam ${type === 'in' ? 'masuk' : 'pulang'} untuk guru ini?`)) return;

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: date,
          records: [
            {
              staff_id: staffId,
              status: type === 'in' ? 'DELETE_IN' : 'DELETE_OUT'
            }
          ]
        })
      });
      const data = await res.json();
      if (data.success) {
        addLog(`Berhasil menghapus jam ${type === 'in' ? 'masuk' : 'pulang'}`, 'success');
        fetchSilentRef.current(dateRef.current, filterTypeRef.current);
      } else {
        addLog(`Gagal: ${data.error}`, 'error');
      }
    } catch (err: any) {
      addLog(`Error: ${err.message}`, 'error');
    }
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

  // ================================================================
  // REFS: Always hold latest values to prevent stale closures
  // ================================================================
  const dateRef = useRef(date)
  const filterTypeRef = useRef(filterType)
  const fetchSilentRef = useRef<(d: string, f: FilterType) => void>(() => {})

  // Keep refs in sync with state on every render
  dateRef.current = date
  filterTypeRef.current = filterType

  // FULL fetch (with loading spinner) — for initial load & filter/date change
  const fetchAttendance = async (selectedDate: string, currentFilter: FilterType) => {
    setLoading(true)
    try {
      const [resAtt, resMe] = await Promise.all([
        fetch(`/api/attendance/guru?date=${selectedDate}&filter=${currentFilter}&_t=${Date.now()}`),
        fetch('/api/auth/me')
      ])
      const data = await resAtt.json()
      const dataMe = await resMe.json()
      
      if (data.success) setStaffs(data.data)
      if (dataMe.success) setCurrentUser(dataMe.user)
    } catch (err) {
      console.error(err)
      addLog('Gagal memuat data absensi.', 'error')
    } finally {
      setLoading(false)
    }
  }

  // SILENT fetch (no spinner, just sync dot) — for realtime/polling background refresh
  const fetchSilent = async (selectedDate: string, currentFilter: FilterType) => {
    setIsSyncing(true)
    try {
      const res = await fetch(`/api/attendance/guru?date=${selectedDate}&filter=${currentFilter}&_t=${Date.now()}`)
      const data = await res.json()
      if (data.success) setStaffs(data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSyncing(false)
    }
  }

  // Keep silent ref in sync
  fetchSilentRef.current = fetchSilent

  useEffect(() => {
    fetchAttendance(date, filterType)
  }, [date, filterType])

  // ================================================================
  // Supabase Realtime (DB changes) & Local Scan Listener
  // ================================================================
  useEffect(() => {
    // 1. Listen to DB changes directly (uses a separate channel to avoid clash)
    const channel = supabase.channel('dashboard-absensi-db')
    
    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'staff_attendance' },
        (payload) => {
          fetchSilentRef.current(dateRef.current, filterTypeRef.current)
        }
      )
      .subscribe()
      
    // 2. Listen to local scan events from GlobalAttendanceScanner
    const handleLocalScan = (e: any) => {
      const data = e.detail
      const msg = data.success ? (data.message || 'Scan absensi berhasil!') : (data.error || 'Scan absensi gagal')
      addLog(msg, data.success ? 'success' : 'error')
      fetchSilentRef.current(dateRef.current, filterTypeRef.current)
    }
    
    window.addEventListener('mia_local_scan', handleLocalScan)
      
    return () => { 
      supabase.removeChannel(channel)
      window.removeEventListener('mia_local_scan', handleLocalScan)
    }
  }, [])

  // Polling every 15s (quiet fallback — no spinner)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSilentRef.current(dateRef.current, filterTypeRef.current)
    }, 15000)
    return () => clearInterval(interval)
  }, [])

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
    return 'BELUM SCAN'
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
      if (status === 'HADIR' || status === 'TERLAMBAT') globalSummary.HADIR++
      else if (status === 'IZIN') globalSummary.IZIN++
      else if (status === 'SAKIT') globalSummary.SAKIT++
      else if (status === 'TIDAK MASUK' || status === 'ALPA') globalSummary.TIDAK_MASUK++
    })
  } else {
    // For minggu/bulan, summarize all attendances
    staffs.forEach(s => {
      s.attendances?.forEach(att => {
        if (att.status === 'HADIR' || att.status === 'TERLAMBAT') globalSummary.HADIR++
        else if (att.status === 'IZIN') globalSummary.IZIN++
        else if (att.status === 'SAKIT') globalSummary.SAKIT++
      })
    })
  }

  const canManageAttendance = canManageTeachers(currentUser?.role);
  const isGuru = currentUser?.role?.toLowerCase().includes('guru') || currentUser?.role === 'staff';
  const myStaffRecord = isGuru && currentUser?.staffId ? staffs.find(s => s.id === currentUser.staffId) : null;
  
  const personalSummary = {
    HADIR: 0,
    TIDAK_MASUK: 0,
    IZIN: 0,
    SAKIT: 0,
  }

  if (myStaffRecord) {
    if (filterType === 'hari') {
      const status = getAttendanceStatus(myStaffRecord.attendance)
      if (status === 'HADIR' || status === 'TERLAMBAT') personalSummary.HADIR++
      else if (status === 'IZIN') personalSummary.IZIN++
      else if (status === 'SAKIT') personalSummary.SAKIT++
      else if (status === 'TIDAK MASUK' || status === 'ALPA') personalSummary.TIDAK_MASUK++
    } else {
      myStaffRecord.attendances?.forEach(att => {
        if (att.status === 'HADIR' || att.status === 'TERLAMBAT') personalSummary.HADIR++
        else if (att.status === 'IZIN') personalSummary.IZIN++
        else if (att.status === 'SAKIT') personalSummary.SAKIT++
      })
    }
  }

  const activeSummary = (isGuru && viewPersonalOnly) ? personalSummary : globalSummary;
  const activeStaffs = (isGuru && viewPersonalOnly) ? (myStaffRecord ? [myStaffRecord] : []) : staffs;

  return (
    <div className="font-sans space-y-6 sm:space-y-7 w-full pb-16">
      
      {/* Header Bar */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2.5">
            <ClipboardCheck size={13} />
            <span>Presensi Digital Dewan Guru</span>
          </div>
          <h1 className="font-sans font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Absensi Guru &amp; Staff
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="font-sans text-xs sm:text-sm text-slate-500">
              Sistem absensi terintegrasi RFID card dewan guru MI Attaqwa 15 Babelan.
            </p>
            {isSyncing && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Realtime Sync
              </span>
            )}
          </div>
        </div>
        
        {/* Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
          
          {/* Filter Periode */}
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
              <Filter size={15} />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
              className="pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-700 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none cursor-pointer"
            >
              <option value="hari">Harian</option>
              <option value="minggu">Mingguan</option>
              <option value="bulan">Bulanan</option>
            </select>
          </div>

          {/* Date Picker */}
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
              <Calendar size={15} />
            </div>
            <input
              type={filterType === 'bulan' ? 'month' : 'date'}
              value={filterType === 'bulan' ? date.substring(0, 7) : date}
              onChange={(e) => {
                let val = e.target.value
                if (filterType === 'bulan' && val.length === 7) val += '-01'
                setDate(val)
              }}
              className="pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-700 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none cursor-pointer"
            />
          </div>

          {/* Sort Order */}
          <button
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-2xl transition cursor-pointer"
            title="Urutkan Nama"
          >
            {sortOrder === 'asc' ? <ArrowDownAZ size={17} /> : <ArrowUpAZ size={17} />}
          </button>

          {/* View Mode Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
            <button
              onClick={() => setViewMode('card')}
              className={`p-2 rounded-xl transition cursor-pointer ${viewMode === 'card' ? 'bg-white shadow-2xs text-blue-700' : 'text-slate-500 hover:text-slate-800'}`}
              title="Tampilan Kartu"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-xl transition cursor-pointer ${viewMode === 'list' ? 'bg-white shadow-2xs text-blue-700' : 'text-slate-500 hover:text-slate-800'}`}
              title="Tampilan List"
            >
              <List size={16} />
            </button>
          </div>

          {/* Personal vs All (For Guru) */}
          {isGuru && (
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
              <button
                onClick={() => setViewPersonalOnly(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${viewPersonalOnly ? 'bg-white shadow-2xs text-blue-700' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                <span>Saya</span>
              </button>
              <button
                onClick={() => setViewPersonalOnly(false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${!viewPersonalOnly ? 'bg-white shadow-2xs text-blue-700' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                <span>Semua</span>
              </button>
            </div>
          )}

          {/* Activity Log Button */}
          <button 
            onClick={() => setShowLog(true)}
            className="btn-tactile flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl shadow-sm transition cursor-pointer"
          >
            <Activity size={15} className="text-amber-400" />
            <span>Activity Log</span>
            {logs.length > 0 && (
              <span className="bg-amber-500 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">{logs.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* RFID Listening Banner */}
      {filterType === 'hari' && date === new Date().toISOString().split('T')[0] && (
        <div className="bg-blue-50/80 border border-blue-200/80 rounded-3xl p-4 flex items-center justify-center gap-3 text-blue-800 font-sans shadow-2xs">
          <Fingerprint className="text-blue-600 animate-pulse shrink-0" size={22} />
          <span className="text-xs sm:text-sm font-bold">Sistem siap mendengarkan scan kartu RFID realtime...</span>
        </div>
      )}

      {/* Summary Stats Bento Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 font-sans">
        
        {/* Hadir */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between hover:shadow-md transition">
          <div>
            <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Hadir</span>
            <h3 className="font-sans font-extrabold text-2xl sm:text-3xl text-emerald-600 tracking-tight">{activeSummary.HADIR}</h3>
          </div>
          <div className="w-11 h-11 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 size={22} />
          </div>
        </div>
        
        {/* Izin */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between hover:shadow-md transition">
          <div>
            <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Izin</span>
            <h3 className="font-sans font-extrabold text-2xl sm:text-3xl text-blue-600 tracking-tight">{activeSummary.IZIN}</h3>
          </div>
          <div className="w-11 h-11 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
            <Activity size={22} />
          </div>
        </div>
        
        {/* Sakit */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between hover:shadow-md transition">
          <div>
            <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Sakit</span>
            <h3 className="font-sans font-extrabold text-2xl sm:text-3xl text-amber-600 tracking-tight">{activeSummary.SAKIT}</h3>
          </div>
          <div className="w-11 h-11 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
            <AlertCircle size={22} />
          </div>
        </div>
        
        {/* Tidak Masuk */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between hover:shadow-md transition">
          <div>
            <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tidak Masuk</span>
            <h3 className="font-sans font-extrabold text-2xl sm:text-3xl text-rose-600 tracking-tight">{activeSummary.TIDAK_MASUK}</h3>
          </div>
          <div className="w-11 h-11 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center text-rose-600 shrink-0">
            <XCircle size={22} />
          </div>
        </div>
      </div>

      {/* Staff Attendance Display */}
      <div className={viewMode === 'card' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "flex flex-col gap-3"}>
        {loading ? (
          <div className="col-span-full p-12 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 text-xs sm:text-sm font-semibold">
            Memuat data absensi dewan guru...
          </div>
        ) : activeStaffs.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 text-xs sm:text-sm">
            {viewPersonalOnly && isGuru ? 'Data absensi pribadi belum tersedia untuk periode ini.' : 'Belum ada data guru/staff yang aktif.'}
          </div>
        ) : (
          [...activeStaffs]
            .sort((a, b) => sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name))
            .map((staff) => {
            
            if (filterType === 'hari') {
              const att = staff.attendance
              const status = getAttendanceStatus(att)
              
              let statusColor = 'bg-slate-100 text-slate-700 border-slate-200'
              if (status === 'HADIR') statusColor = 'bg-emerald-50 text-emerald-700 border-emerald-200'
              if (status === 'TERLAMBAT') statusColor = 'bg-amber-50 text-amber-800 border-amber-200'
              if (status === 'IZIN') statusColor = 'bg-blue-50 text-blue-700 border-blue-200'
              if (status === 'SAKIT') statusColor = 'bg-orange-50 text-orange-700 border-orange-200'
              if (status === 'TIDAK MASUK' || status === 'ALPA') statusColor = 'bg-rose-50 text-rose-700 border-rose-200'
              
              if (viewMode === 'list') {
                return (
                  <Link 
                    key={staff.id} 
                    href={`/guru/${staff.id}`} 
                    className="bg-white rounded-2xl p-4 sm:p-5 shadow-2xs border border-slate-200/80 hover:shadow-md hover:border-blue-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer font-sans"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-bold text-slate-600 shadow-2xs shrink-0 overflow-hidden border border-slate-200">
                        {staff.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={staff.image} alt={staff.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{getInitials(staff.name)}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-sans font-bold text-slate-900 text-base leading-snug hover:text-blue-600 transition">
                          {staff.name}
                        </h3>
                        <p className="font-sans text-xs sm:text-sm text-slate-500 font-medium">
                          {staff.position}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 sm:gap-8 justify-between sm:justify-end">
                      <div className="flex flex-col items-start sm:items-end relative group pr-4">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Masuk</span>
                        <div className="flex items-center gap-2">
                          <span className="font-sans text-sm sm:text-base font-bold text-slate-800">
                            {formatTime(att?.check_in_time)}
                          </span>
                          {canManageAttendance && att?.check_in_time && (
                            <button 
                              onClick={(e) => handleSoftDelete(e, staff.id, 'in')} 
                              className="p-1 bg-rose-50 text-rose-600 rounded-lg opacity-0 group-hover:opacity-100 transition hover:bg-rose-100 cursor-pointer" 
                              title="Hapus jam masuk"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-start sm:items-end relative group pr-4">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Keluar</span>
                        <div className="flex items-center gap-2">
                          <span className="font-sans text-sm sm:text-base font-bold text-slate-800">
                            {formatTime(att?.check_out_time)}
                          </span>
                          {canManageAttendance && att?.check_out_time && (
                            <button 
                              onClick={(e) => handleSoftDelete(e, staff.id, 'out')} 
                              className="p-1 bg-rose-50 text-rose-600 rounded-lg opacity-0 group-hover:opacity-100 transition hover:bg-rose-100 cursor-pointer" 
                              title="Hapus jam pulang"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColor} text-center shrink-0`}>
                        {status}
                      </div>
                    </div>
                  </Link>
                )
              }

              return (
                <Link 
                  key={staff.id} 
                  href={`/guru/${staff.id}`} 
                  className="bg-white rounded-3xl p-5 shadow-2xs border border-slate-200/80 hover:shadow-md hover:border-blue-300 transition-all flex flex-col gap-4 cursor-pointer font-sans"
                >
                  {/* Top info: Avatar + Name + Status */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-bold text-slate-600 shadow-2xs shrink-0 overflow-hidden border border-slate-200">
                        {staff.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={staff.image} alt={staff.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{getInitials(staff.name)}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-sans font-bold text-slate-900 text-base leading-snug hover:text-blue-600 transition">
                          {staff.name}
                        </h3>
                        <p className="font-sans text-xs sm:text-sm text-slate-500 font-medium">
                          {staff.position}
                        </p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColor} shrink-0`}>
                      {status}
                    </div>
                  </div>

                  {/* Bottom info: Check-in & Check-out Times */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 flex flex-col justify-center relative group">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Waktu Masuk</span>
                      <span className="font-sans text-sm sm:text-base font-bold text-slate-800 mt-0.5">
                        {formatTime(att?.check_in_time)}
                      </span>
                      {canManageAttendance && att?.check_in_time && (
                        <button 
                          onClick={(e) => handleSoftDelete(e, staff.id, 'in')} 
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-rose-50 text-rose-600 rounded-xl opacity-0 group-hover:opacity-100 transition hover:bg-rose-100 cursor-pointer" 
                          title="Hapus jam masuk"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 flex flex-col justify-center relative group">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Waktu Keluar</span>
                      <span className="font-sans text-sm sm:text-base font-bold text-slate-800 mt-0.5">
                        {formatTime(att?.check_out_time)}
                      </span>
                      {canManageAttendance && att?.check_out_time && (
                        <button 
                          onClick={(e) => handleSoftDelete(e, staff.id, 'out')} 
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-rose-50 text-rose-600 rounded-xl opacity-0 group-hover:opacity-100 transition hover:bg-rose-100 cursor-pointer" 
                          title="Hapus jam pulang"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </Link>
              )
            } else {
              // Summary View for Week / Month
              const sum = { HADIR: 0, IZIN: 0, SAKIT: 0 }
              staff.attendances?.forEach(att => {
                if (att.status === 'HADIR' || att.status === 'TERLAMBAT') sum.HADIR++
                else if (att.status === 'IZIN') sum.IZIN++
                else if (att.status === 'SAKIT') sum.SAKIT++
              })

              if (viewMode === 'list') {
                return (
                  <Link 
                    key={staff.id} 
                    href={`/guru/${staff.id}`} 
                    className="bg-white rounded-2xl p-4 sm:p-5 shadow-2xs border border-slate-200/80 hover:shadow-md hover:border-blue-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer font-sans"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-bold text-slate-600 shadow-2xs shrink-0 overflow-hidden border border-slate-200">
                        {staff.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={staff.image} alt={staff.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{getInitials(staff.name)}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-sans font-bold text-slate-900 text-base leading-snug hover:text-blue-600 transition">
                          {staff.name}
                        </h3>
                        <p className="font-sans text-xs sm:text-sm text-slate-500 font-medium">{staff.position}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto font-sans">
                      <div className="bg-emerald-50 rounded-2xl px-4 py-2 flex items-center justify-between md:justify-center gap-2.5 border border-emerald-100 flex-1 md:flex-initial">
                        <span className="text-xs font-bold text-emerald-700 uppercase">Hadir</span>
                        <span className="text-base font-extrabold text-emerald-800">{sum.HADIR}</span>
                      </div>
                      <div className="bg-blue-50 rounded-2xl px-4 py-2 flex items-center justify-between md:justify-center gap-2.5 border border-blue-100 flex-1 md:flex-initial">
                        <span className="text-xs font-bold text-blue-700 uppercase">Izin</span>
                        <span className="text-base font-extrabold text-blue-800">{sum.IZIN}</span>
                      </div>
                      <div className="bg-orange-50 rounded-2xl px-4 py-2 flex items-center justify-between md:justify-center gap-2.5 border border-orange-100 flex-1 md:flex-initial">
                        <span className="text-xs font-bold text-orange-700 uppercase">Sakit</span>
                        <span className="text-base font-extrabold text-orange-800">{sum.SAKIT}</span>
                      </div>
                    </div>
                  </Link>
                )
              }

              return (
                <Link 
                  key={staff.id} 
                  href={`/guru/${staff.id}`} 
                  className="bg-white rounded-3xl p-5 shadow-2xs border border-slate-200/80 hover:shadow-md hover:border-blue-300 transition flex flex-col gap-4 cursor-pointer font-sans"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-bold text-slate-600 shadow-2xs shrink-0 overflow-hidden border border-slate-200">
                      {staff.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={staff.image} alt={staff.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{getInitials(staff.name)}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-sans font-bold text-slate-900 text-base leading-snug hover:text-blue-600 transition">
                        {staff.name}
                      </h3>
                      <p className="font-sans text-xs sm:text-sm text-slate-500 font-medium">{staff.position}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2.5 font-sans">
                    <div className="bg-emerald-50 rounded-2xl p-2.5 text-center border border-emerald-100">
                      <span className="text-[11px] font-bold text-emerald-700 uppercase block">Hadir</span>
                      <span className="text-lg font-extrabold text-emerald-800 mt-0.5 block">{sum.HADIR}</span>
                    </div>
                    <div className="bg-blue-50 rounded-2xl p-2.5 text-center border border-blue-100">
                      <span className="text-[11px] font-bold text-blue-700 uppercase block">Izin</span>
                      <span className="text-lg font-extrabold text-blue-800 mt-0.5 block">{sum.IZIN}</span>
                    </div>
                    <div className="bg-orange-50 rounded-2xl p-2.5 text-center border border-orange-100">
                      <span className="text-[11px] font-bold text-orange-700 uppercase block">Sakit</span>
                      <span className="text-lg font-extrabold text-orange-800 mt-0.5 block">{sum.SAKIT}</span>
                    </div>
                  </div>
                </Link>
              )
            }
          })
        )}
      </div>

      {/* RIGHT SLIDE-OVER - Realtime Log */}
      {showLog && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 transition-opacity"
            onClick={() => setShowLog(false)}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-slate-900 shadow-2xl z-50 flex flex-col transform transition-transform border-l border-slate-800 font-sans">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Activity className="text-amber-400" size={20} />
                <h2 className="font-sans text-lg font-bold text-white">Live Activity Log</h2>
              </div>
              <button 
                onClick={() => setShowLog(false)}
                className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-3.5 custom-scrollbar">
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-50 py-16">
                  <Fingerprint className="text-slate-500" size={32} />
                  <p className="text-slate-400 text-xs sm:text-sm">Menunggu aktivitas scan...</p>
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex gap-3 text-xs sm:text-sm bg-slate-800/60 p-3 rounded-2xl border border-slate-800">
                    <div className="flex-shrink-0 mt-0.5">
                      {log.type === 'success' && <CheckCircle2 size={16} className="text-emerald-400" />}
                      {log.type === 'error' && <XCircle size={16} className="text-rose-400" />}
                      {log.type === 'info' && <Clock size={16} className="text-blue-400" />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] text-slate-400 font-mono font-medium mb-0.5">{log.time}</span>
                      <span className={`font-semibold leading-snug ${
                        log.type === 'success' ? 'text-emerald-300' : 
                        log.type === 'error' ? 'text-rose-300' : 'text-blue-300'
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
