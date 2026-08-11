'use client'

import React, { useEffect, useState, useRef } from 'react'
import { Calendar, CheckCircle2, Clock, XCircle, LogIn, LogOut, Activity, AlertCircle, Fingerprint, Filter, X, LayoutGrid, List, ArrowDownAZ, ArrowUpAZ, Bell } from 'lucide-react'
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
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])
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
    if (!isoString) return '-'
    const validIso = (!isoString.endsWith('Z') && !isoString.includes('+')) ? `${isoString}Z` : isoString
    const d = new Date(validIso)
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

  // Polling every 15s (quiet fallback — no spinner)
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
      if (status === 'HADIR') personalSummary.HADIR++
      else if (status === 'IZIN') personalSummary.IZIN++
      else if (status === 'SAKIT') personalSummary.SAKIT++
      else if (status === 'TIDAK MASUK') personalSummary.TIDAK_MASUK++
    } else {
      myStaffRecord.attendances?.forEach(att => {
        if (att.status === 'HADIR') personalSummary.HADIR++
        else if (att.status === 'IZIN') personalSummary.IZIN++
        else if (att.status === 'SAKIT') personalSummary.SAKIT++
      })
    }
  }

  const activeSummary = (isGuru && viewPersonalOnly) ? personalSummary : globalSummary;
  const activeStaffs = (isGuru && viewPersonalOnly) ? (myStaffRecord ? [myStaffRecord] : []) : staffs;

  return (
    <div className="w-full flex flex-col font-sans relative">
      
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Absensi Guru & Staff</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-slate-500 text-md">Sistem Absensi RF ID Card Dewan Guru MI ATTAQWA 15 BABELAN.</p>
              {isSyncing && (
                <span className="flex items-center gap-1 text-xs text-emerald-500 font-medium">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Sync...
                </span>
              )}
            </div>
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
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-medium rounded-xl shadow-sm transition"
              title="Urutkan Nama"
            >
              {sortOrder === 'asc' ? <ArrowDownAZ size={18} /> : <ArrowUpAZ size={18} />}
            </button>

            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'card' ? 'bg-white shadow-sm text-btn-primary' : 'text-slate-400 hover:text-slate-600'}`}
                title="Card View"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-btn-primary' : 'text-slate-400 hover:text-slate-600'}`}
                title="List View"
              >
                <List size={18} />
              </button>
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
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Hadir</p>
              <h3 className="text-3xl font-bold text-emerald-600">{activeSummary.HADIR}</h3>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center">
              <CheckCircle2 className="text-emerald-500" size={24} />
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Izin</p>
              <h3 className="text-3xl font-bold text-blue-600">{activeSummary.IZIN}</h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
              <Activity className="text-blue-500" size={24} />
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Sakit</p>
              <h3 className="text-3xl font-bold text-amber-500">{activeSummary.SAKIT}</h3>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center">
              <AlertCircle className="text-amber-500" size={24} />
            </div>
          </div>
          
          {filterType === 'hari' && (
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Tidak Masuk</p>
                <h3 className="text-3xl font-bold text-rose-500">{activeSummary.TIDAK_MASUK}</h3>
              </div>
              <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center">
                <XCircle className="text-rose-500" size={24} />
              </div>
            </div>
          )}
        </div>

        {/* Staff Cards List */}
        <div className={viewMode === 'card' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "flex flex-col gap-3"}>
          {loading ? (
            <div className="col-span-full p-10 text-center text-slate-500 bg-white rounded-2xl border border-slate-100">
              Memuat data absensi...
            </div>
          ) : activeStaffs.length === 0 ? (
            <div className="col-span-full p-10 text-center text-slate-500 bg-white rounded-2xl border border-slate-100">
              {viewPersonalOnly && isGuru ? 'Data absensi pribadi belum tersedia.' : 'Belum ada data guru/staff yang aktif.'}
            </div>
          ) : (
            [...activeStaffs]
              .sort((a, b) => sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name))
              .map((staff) => {
              
              if (filterType === 'hari') {
                const att = staff.attendance
                const status = getAttendanceStatus(att)
                
                let statusColor = 'bg-slate-100 text-slate-500 border-slate-200'
                if (status === 'HADIR') statusColor = 'bg-emerald-50 text-emerald-700 border-emerald-200'
                if (status === 'TERLAMBAT') statusColor = 'bg-yellow-50 text-yellow-700 border-yellow-200'
                if (status === 'IZIN') statusColor = 'bg-blue-50 text-blue-700 border-blue-200'
                if (status === 'SAKIT') statusColor = 'bg-orange-50 text-orange-700 border-orange-200'
                if (status === 'TIDAK MASUK' || status === 'ALPA') statusColor = 'bg-red-50 text-red-700 border-red-200'
                
                if (viewMode === 'list') {
                  return (
                    <Link key={staff.id} href={`/guru/${staff.id}`} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex items-center justify-between cursor-pointer hover:border-slate-300">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 shadow-inner flex-shrink-0 overflow-hidden">
                          {staff.image ? <img src={staff.image} alt={staff.name} className="w-full h-full object-cover" /> : getInitials(staff.name)}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-md line-clamp-1">{staff.name}</h3>
                          <p className="text-[14px] text-slate-500 line-clamp-1">{staff.position}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 md:gap-24 ml-4">
                        <div className="flex flex-col items-end hidden sm:flex">
                          <p className="text-[14px] font-bold text-slate-400 uppercase tracking-wider">Masuk</p>
                          <p className="text-md font-semibold text-slate-700">{formatTime(att?.check_in_time)}</p>
                        </div>
                        <div className="flex flex-col items-end hidden sm:flex">
                          <p className="text-[14px] font-bold text-slate-400 uppercase tracking-wider">Keluar</p>
                          <p className="text-md font-semibold text-slate-700">{formatTime(att?.check_out_time)}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold border ${statusColor} w-20 md:w-24 text-center flex-shrink-0`}>
                          {status}
                        </div>
                      </div>
                    </Link>
                  )
                }

                return (
                  <Link key={staff.id} href={`/guru/${staff.id}`} className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col gap-3 cursor-pointer hover:border-slate-300">
                    {/* Top info: Avatar + Name + Overall Status */}
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 shadow-inner overflow-hidden">
                          {staff.image ? <img src={staff.image} alt={staff.name} className="w-full h-full object-cover" /> : getInitials(staff.name)}
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
                        {/* <div className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center text-emerald-500 flex-shrink-0">
                          <LogIn size={14} />
                        </div> */}
                        <div className="overflow-hidden">
                          <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider truncate">Waktu Masuk</p>
                          <p className="text-md font-semibold text-slate-700 truncate">{formatTime(att?.check_in_time)}</p>
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center gap-3">
                        {/* <div className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center text-orange-500 flex-shrink-0">
                          <LogOut size={14} />
                        </div> */}
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

                if (viewMode === 'list') {
                  return (
                    <Link key={staff.id} href={`/guru/${staff.id}`} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:border-slate-300">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 shadow-inner flex-shrink-0 overflow-hidden">
                          {staff.image ? <img src={staff.image} alt={staff.name} className="w-full h-full object-cover" /> : getInitials(staff.name)}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm line-clamp-1">{staff.name}</h3>
                          <p className="text-[12px] text-slate-500 line-clamp-1">{staff.position}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="bg-emerald-50 rounded-lg px-3 py-1.5 flex items-center justify-between md:justify-center gap-2 border border-emerald-100 flex-1 md:flex-initial">
                          <p className="text-[10px] font-bold text-emerald-600 uppercase">Hadir</p>
                          <p className="text-sm font-black text-emerald-700">{sum.HADIR}</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg px-3 py-1.5 flex items-center justify-between md:justify-center gap-2 border border-blue-100 flex-1 md:flex-initial">
                          <p className="text-[10px] font-bold text-blue-600 uppercase">Izin</p>
                          <p className="text-sm font-black text-blue-700">{sum.IZIN}</p>
                        </div>
                        <div className="bg-orange-50 rounded-lg px-3 py-1.5 flex items-center justify-between md:justify-center gap-2 border border-orange-100 flex-1 md:flex-initial">
                          <p className="text-[10px] font-bold text-orange-600 uppercase">Sakit</p>
                          <p className="text-sm font-black text-orange-700">{sum.SAKIT}</p>
                        </div>
                      </div>
                    </Link>
                  )
                }

                return (
                  <Link key={staff.id} href={`/guru/${staff.id}`} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col gap-5 cursor-pointer hover:border-slate-300">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 shadow-inner overflow-hidden">
                        {staff.image ? <img src={staff.image} alt={staff.name} className="w-full h-full object-cover" /> : getInitials(staff.name)}
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

