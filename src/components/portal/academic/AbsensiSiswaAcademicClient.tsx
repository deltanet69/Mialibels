'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  HeartPulse, 
  Clock, 
  CalendarDays, 
  BarChart3, 
  Search, 
  Filter, 
  ArrowRight, 
  TrendingUp, 
  Award, 
  Printer, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  School, 
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RefreshCw
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

type KPI = {
  total_students: number
  total_present: number
  total_late: number
  total_izin: number
  total_sakit: number
  total_alpha: number
  total_belum: number
  percentage: number
}

type ClassroomSummary = {
  id: string
  name: string
  slug: string
  academic_year: string
  level: number
  homeroom_teacher: string
  total_students: number
  present_count: number
  izin_count: number
  sakit_count: number
  alpha_count: number
  belum_count: number
  percentage: number
}

type StudentRecord = {
  id: string
  name: string
  student_number: string
  nisn?: string
  gender?: string
  class_id: string
  class_name: string
  attendance: {
    status: string | null
    reason?: string
    entry_time?: string | null
    exit_time?: string | null
    is_present: boolean
    is_late: boolean
    is_manual: boolean
  }
}

type MonthlyRecapClass = {
  id: string
  name: string
  slug: string
  total_students: number
  total_records: number
  hadir: number
  izin: number
  sakit: number
  alpha: number
  percentage: number
}

export default function AbsensiSiswaAcademicClient() {
  const getLocalDateString = () => {
    const d = new Date()
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().split('T')[0]
  }

  const [date, setDate] = useState(getLocalDateString())
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly'>('daily')

  // Month & Year for monthly recap
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const [loading, setLoading] = useState(true)
  const [kpi, setKpi] = useState<KPI | null>(null)
  const [classrooms, setClassrooms] = useState<ClassroomSummary[]>([])
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [monthlyRecap, setMonthlyRecap] = useState<MonthlyRecapClass[]>([])

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/attendance/students/overview?date=${date}&classId=${selectedClassId}&month=${month}&year=${year}&_t=` + Date.now()
      )
      const json = await res.json()
      if (json.success && json.data) {
        setKpi(json.data.kpi)
        setClassrooms(json.data.classrooms || [])
        setStudents(json.data.students || [])
        setMonthlyRecap(json.data.monthly_recap || [])
      }
    } catch (e) {
      console.error('Error fetching academic attendance overview', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [date, selectedClassId, month, year])

  // Supabase Realtime live sync from RFID scanner pos and classroom updates
  useEffect(() => {
    try {
      const channel = supabase.channel('mia-attendance-academic-sync')
      channel
        .on(
          'broadcast',
          { event: 'scan_result_siswa' },
          () => {
            fetchData()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    } catch (e) {
      console.error('Realtime sync error', e)
    }
  }, [date, selectedClassId, month, year])

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  // Filtered student list
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      // Search
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch = !q || s.name.toLowerCase().includes(q) || (s.nisn && s.nisn.includes(q)) || (s.student_number && s.student_number.includes(q))
      if (!matchesSearch) return false

      // Status
      if (statusFilter === 'ALL') return true
      if (statusFilter === 'HADIR') return s.attendance.is_present
      if (statusFilter === 'IZIN') return (s.attendance.status || '').toLowerCase() === 'izin'
      if (statusFilter === 'SAKIT') return (s.attendance.status || '').toLowerCase() === 'sakit'
      if (statusFilter === 'ALPHA') return (s.attendance.status || '').toLowerCase() === 'alpha'
      if (statusFilter === 'BELUM') return !s.attendance.status
      return true
    })
  }, [students, searchQuery, statusFilter])

  // Avatar generator helper
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  const getAvatarBg = (name: string) => {
    const colors = [
      'bg-blue-100 text-blue-700 border-blue-200',
      'bg-indigo-100 text-indigo-700 border-indigo-200',
      'bg-emerald-100 text-emerald-700 border-emerald-200',
      'bg-amber-100 text-amber-700 border-amber-200',
      'bg-purple-100 text-purple-700 border-purple-200',
      'bg-rose-100 text-rose-700 border-rose-200',
      'bg-teal-100 text-teal-700 border-teal-200',
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i)
    return colors[hash % colors.length]
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      
      {/* ──────────────────────────────────────────────────────────── */}
      {/* 1. TOP HEADER & MAIN TAB SELECTOR */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800 tracking-wider">
              Akademik
            </span>
            <span className="text-xs font-bold text-slate-400">Pusat Monitoring Terpadu</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2.5">
            <School className="w-7 h-7 text-blue-600" />
            <span>Rekap Absensi Siswa Madrasah</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pantau kehadiran seluruh siswa dari scan kartu RFID maupun input wali kelas dalam satu halaman.
          </p>
        </div>

        {/* Tab Selector & Date Picker */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80 inline-flex shadow-2xs">
            <button
              onClick={() => setActiveTab('daily')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'daily'
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <CalendarDays size={14} className={activeTab === 'daily' ? 'text-blue-600' : 'text-slate-400'} />
              <span>Monitoring Harian</span>
            </button>

            <button
              onClick={() => setActiveTab('monthly')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'monthly'
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BarChart3 size={14} className={activeTab === 'monthly' ? 'text-blue-600' : 'text-slate-400'} />
              <span>Rekap Bulanan Rombel</span>
            </button>
          </div>

          {activeTab === 'daily' && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/90 rounded-2xl px-3.5 py-2 shadow-2xs">
              <CalendarDays size={15} className="text-blue-600" />
              <input 
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent text-xs font-black text-slate-800 outline-none cursor-pointer"
              />
            </div>
          )}

          <button
            onClick={fetchData}
            title="Muat Ulang Data"
            className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-2xl transition cursor-pointer shadow-2xs"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-blue-600' : ''} />
          </button>
        </div>
      </div>

      {loading && !kpi ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-16 flex flex-col justify-center items-center gap-3 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <span className="text-sm font-bold text-slate-600">Menghubungkan Data Absensi Seluruh Rombel...</span>
        </div>
      ) : (
        <>
          {/* ──────────────────────────────────────────────────────────── */}
          {/* 2. SCHOOL-WIDE KPI METRIC CARDS */}
          {/* ──────────────────────────────────────────────────────────── */}
          {kpi && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
              
              {/* Total Siswa Madrasah */}
              <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Siswa Aktif</span>
                  <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                    <Users size={14} />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl lg:text-3xl font-black text-slate-900">{kpi.total_students}</span>
                  <span className="text-xs font-bold text-slate-400 ml-1.5">Siswa</span>
                </div>
              </div>

              {/* Total Hadir Hari Ini */}
              <div className="p-4 rounded-3xl bg-emerald-500 text-white shadow-md flex flex-col justify-between relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-2 -translate-y-2 w-20 h-20 bg-white/15 rounded-full blur-lg pointer-events-none" />
                <div className="flex items-center justify-between relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-100">Siswa Hadir</span>
                  <div className="w-7 h-7 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                    <CheckCircle2 size={14} />
                  </div>
                </div>
                <div className="mt-3 relative z-10 flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl lg:text-3xl font-black">{kpi.total_present}</span>
                    <span className="text-xs font-bold text-emerald-100 ml-1">Siswa</span>
                  </div>
                  <span className="text-sm font-black px-2 py-0.5 rounded-lg bg-white/20 text-white">
                    {kpi.percentage}%
                  </span>
                </div>
              </div>

              {/* Izin & Sakit */}
              <div className="p-4 rounded-3xl bg-amber-50/80 border border-amber-200/80 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider">Izin &amp; Sakit</span>
                  <div className="w-7 h-7 rounded-xl bg-amber-200/60 flex items-center justify-center text-amber-700">
                    <AlertCircle size={14} />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl lg:text-3xl font-black text-amber-950">{kpi.total_izin + kpi.total_sakit}</span>
                  <span className="text-[11px] font-bold text-amber-700">
                    ({kpi.total_izin} Izin, {kpi.total_sakit} Sakit)
                  </span>
                </div>
              </div>

              {/* Alpha */}
              <div className="p-4 rounded-3xl bg-rose-50/80 border border-rose-200/80 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-rose-800 uppercase tracking-wider">Alpha (Tanpa Ket.)</span>
                  <div className="w-7 h-7 rounded-xl bg-rose-200/60 flex items-center justify-center text-rose-700">
                    <XCircle size={14} />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl lg:text-3xl font-black text-rose-950">{kpi.total_alpha}</span>
                  <span className="text-xs font-bold text-rose-700 ml-1">Siswa</span>
                </div>
              </div>

              {/* Belum Scan / Belum Input */}
              <div className="p-4 rounded-3xl bg-slate-100/90 border border-slate-200/80 shadow-2xs flex flex-col justify-between col-span-2 md:col-span-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">Belum Presensi</span>
                  <div className="w-7 h-7 rounded-xl bg-slate-200 flex items-center justify-center text-slate-600">
                    <Clock size={14} />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl lg:text-3xl font-black text-slate-800">{kpi.total_belum}</span>
                  <span className="text-xs font-bold text-slate-500 ml-1">Siswa</span>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'daily' ? (
            <>
              {/* ──────────────────────────────────────────────────────────── */}
              {/* 3. CLASSROOM OVERVIEW GRID CARDS (Quick Rombel Breakdown) */}
              {/* ──────────────────────────────────────────────────────────── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-900 tracking-tight">
                      Ringkasan Kehadiran per Rombel Kelas
                    </h3>
                    <p className="text-xs text-slate-500">
                      Klik kelas untuk memfilter daftar siswa di bawah atau kelola kelas langsung.
                    </p>
                  </div>
                  {selectedClassId !== 'ALL' && (
                    <button
                      onClick={() => setSelectedClassId('ALL')}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Tampilkan Semua Kelas</span>
                      <XCircle size={13} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                  {classrooms.map((c) => {
                    const isSelected = selectedClassId === c.id
                    let badgeProgress = 'bg-emerald-500'
                    if (c.percentage < 70) badgeProgress = 'bg-rose-500'
                    else if (c.percentage < 85) badgeProgress = 'bg-amber-500'

                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedClassId(isSelected ? 'ALL' : c.id)}
                        className={`p-4 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between group ${
                          isSelected
                            ? 'bg-blue-50/70 border-blue-400 shadow-md ring-2 ring-blue-300'
                            : 'bg-white border-slate-200/80 hover:border-blue-200 hover:shadow-sm'
                        }`}
                      >
                        <div>
                          {/* Card Header: Class Code + Percentage */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-700 text-white font-black text-sm flex items-center justify-center shadow-2xs">
                                {c.name.replace(/kelas\s*/i, '')}
                              </div>
                              <div>
                                <h4 className="font-black text-sm text-slate-800 group-hover:text-blue-600 transition">
                                  {c.name}
                                </h4>
                                <span className="text-[11px] font-semibold text-slate-400 truncate block max-w-[130px]">
                                  {c.homeroom_teacher}
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-base font-black text-slate-900">{c.percentage}%</span>
                              <span className="text-[10px] font-bold text-slate-400 block">Hadir</span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${badgeProgress}`}
                              style={{ width: `${Math.min(100, c.percentage)}%` }}
                            />
                          </div>
                        </div>

                        {/* Card Footer: Metrics & Link */}
                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          <div className="font-bold text-slate-600">
                            <span className="text-emerald-600 font-extrabold">{c.present_count}</span>
                            <span className="text-slate-400"> / {c.total_students} Hadir</span>
                          </div>

                          <Link
                            href={`/classroom/${c.slug}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 text-slate-400 hover:text-blue-600 transition"
                            title="Buka Halaman Kelas"
                          >
                            <ExternalLink size={14} />
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* ──────────────────────────────────────────────────────────── */}
              {/* 4. MASTER STUDENT ATTENDANCE TABLE */}
              {/* ──────────────────────────────────────────────────────────── */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
                
                {/* Table Filter Toolbar */}
                <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/40">
                  
                  {/* Search and Class Filter */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative w-full sm:w-72">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input
                        type="text"
                        placeholder="Cari nama siswa / NISN..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200/90 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-500 shadow-2xs"
                      />
                    </div>

                    {/* Class Selector Dropdown */}
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-200/90 rounded-xl text-xs font-extrabold text-slate-700 outline-none cursor-pointer shadow-2xs"
                    >
                      <option value="ALL">Semua Rombel Kelas ({classrooms.length})</option>
                      {classrooms.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.total_students} Siswa)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status Pills Filter */}
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 flex-wrap">
                    {[
                      { id: 'ALL', label: 'Semua' },
                      { id: 'HADIR', label: 'Hadir' },
                      { id: 'IZIN', label: 'Izin' },
                      { id: 'SAKIT', label: 'Sakit' },
                      { id: 'ALPHA', label: 'Alpha' },
                      { id: 'BELUM', label: 'Belum' },
                    ].map(st => (
                      <button
                        key={st.id}
                        onClick={() => setStatusFilter(st.id)}
                        className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                          statusFilter === st.id
                            ? 'bg-white text-blue-600 shadow-xs border border-slate-200/60'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[760px]">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4 w-12 text-center">No</th>
                        <th className="py-3 px-4 w-32">NISN / NIS</th>
                        <th className="py-3 px-4">Nama Siswa</th>
                        <th className="py-3 px-4 w-28">Kelas</th>
                        <th className="py-3 px-4 text-center w-28">Jam Masuk</th>
                        <th className="py-3 px-4 text-center w-28">Jam Keluar</th>
                        <th className="py-3 px-4 text-center w-36">Status</th>
                        <th className="py-3 px-4">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-400 text-xs font-medium">
                            {searchQuery ? 'Tidak ada siswa yang sesuai pencarian.' : 'Belum ada data siswa.'}
                          </td>
                        </tr>
                      ) : filteredStudents.map((student, idx) => {
                        const avatarStyle = getAvatarBg(student.name)
                        const isPresent = student.attendance.is_present
                        const isLate = student.attendance.is_late
                        const statusStr = (student.attendance.status || '').toLowerCase()

                        return (
                          <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                            
                            {/* No */}
                            <td className="py-3.5 px-4 text-center text-xs font-bold text-slate-400">
                              {idx + 1}
                            </td>

                            {/* NISN / NIS */}
                            <td className="py-3.5 px-4">
                              <span className="font-mono font-bold text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 inline-block">
                                {student.nisn || student.student_number || '—'}
                              </span>
                            </td>

                            {/* Nama Siswa */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs border ${avatarStyle} flex-shrink-0 shadow-2xs`}>
                                  {getInitials(student.name)}
                                </div>
                                <div className="font-bold text-xs text-slate-800 tracking-tight">
                                  {student.name}
                                </div>
                              </div>
                            </td>

                            {/* Kelas */}
                            <td className="py-3.5 px-4">
                              <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-blue-50 text-blue-700 border border-blue-200/80 inline-block">
                                {student.class_name}
                              </span>
                            </td>

                            {/* Jam Masuk */}
                            <td className="py-3.5 px-4 text-center">
                              {student.attendance.entry_time ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold font-mono border border-emerald-200">
                                  <Clock className="w-3 h-3 text-emerald-600" />
                                  <span>{student.attendance.entry_time}</span>
                                </span>
                              ) : (
                                <span className="text-slate-300 text-xs font-mono">—</span>
                              )}
                            </td>

                            {/* Jam Keluar */}
                            <td className="py-3.5 px-4 text-center">
                              {student.attendance.exit_time ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[11px] font-bold font-mono border border-amber-200">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>{student.attendance.exit_time}</span>
                                </span>
                              ) : (
                                <span className="text-slate-300 text-xs font-mono">—</span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4 text-center">
                              {isPresent ? (
                                isLate ? (
                                  <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-300 inline-block">
                                    Terlambat
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 inline-block">
                                    Hadir Tepat Waktu
                                  </span>
                                )
                              ) : statusStr === 'izin' ? (
                                <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-300 inline-block">
                                  Izin
                                </span>
                              ) : statusStr === 'sakit' ? (
                                <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-blue-100 text-blue-800 border border-blue-300 inline-block">
                                  Sakit
                                </span>
                              ) : statusStr === 'alpha' ? (
                                <span className="px-2.5 py-1 rounded-xl text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-300 inline-block">
                                  Alpha
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-slate-100 text-slate-400 border border-slate-200 inline-block">
                                  Belum Presensi
                                </span>
                              )}
                            </td>

                            {/* Keterangan */}
                            <td className="py-3.5 px-4 text-xs text-slate-500 font-medium">
                              {student.attendance.reason || (student.attendance.is_manual ? 'Input Manual Wali Kelas' : 'Scan Kartu RFID')}
                            </td>

                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-bold text-slate-500">
                  <span>Menampilkan <strong>{filteredStudents.length}</strong> dari {students.length} Siswa</span>
                  <span className="text-slate-400">Sinkronisasi otomatis dari mesin pos RFID &amp; Classroom</span>
                </div>

              </div>
            </>
          ) : (
            /* ──────────────────────────────────────────────────────────── */
            /* 5. MULTI-CLASS MONTHLY RECAP TAB */
            /* ──────────────────────────────────────────────────────────── */
            <div className="space-y-6">
              
              {/* Monthly Selector */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800 tracking-wider">
                    Rekapitulasi Bulanan
                  </span>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight mt-1">
                    Bulan {monthNames[month - 1]} {year}
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-slate-100/90 border border-slate-200/80 rounded-2xl p-1 shadow-2xs">
                    <button 
                      onClick={prevMonth}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl transition cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-xs font-black text-slate-700 min-w-[120px] text-center">
                      {monthNames[month - 1]} {year}
                    </span>
                    <button 
                      onClick={nextMonth}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl transition cursor-pointer"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl text-xs font-black transition-all shadow-2xs cursor-pointer"
                  >
                    <Printer size={14} className="text-blue-600" />
                    <span>Cetak Rekap</span>
                  </button>
                </div>
              </div>

              {/* Leaderboard Table per Class */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/40">
                  <h3 className="font-black text-base text-slate-900">
                    Peringkat &amp; Rekapitulasi Kehadiran Antar Rombel Kelas
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Urutan kelas berdasarkan persentase kehadiran tertinggi selama bulan {monthNames[month - 1]} {year}.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                        <th className="py-3.5 px-4 w-16 text-center">Peringkat</th>
                        <th className="py-3.5 px-4">Nama Rombel Kelas</th>
                        <th className="py-3.5 px-4 text-center w-28">Total Siswa</th>
                        <th className="py-3.5 px-4 text-center w-24">Total Hadir</th>
                        <th className="py-3.5 px-4 text-center w-24">Total Izin</th>
                        <th className="py-3.5 px-4 text-center w-24">Total Sakit</th>
                        <th className="py-3.5 px-4 text-center w-24">Total Alpha</th>
                        <th className="py-3.5 px-6 text-center w-36">% Rata-Rata</th>
                        <th className="py-3.5 px-4 text-center w-28">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {monthlyRecap.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-slate-400 text-xs font-medium">
                            Belum ada rekaman absensi pada bulan ini.
                          </td>
                        </tr>
                      ) : monthlyRecap.map((c, idx) => {
                        let rankBadge = 'bg-slate-100 text-slate-600'
                        if (idx === 0) rankBadge = 'bg-amber-100 text-amber-800 border-amber-300'
                        else if (idx === 1) rankBadge = 'bg-slate-200 text-slate-800 border-slate-300'
                        else if (idx === 2) rankBadge = 'bg-amber-50 text-amber-700 border-amber-200'

                        let pctColor = 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        if (c.percentage < 75) pctColor = 'bg-rose-100 text-rose-800 border-rose-300'
                        else if (c.percentage < 85) pctColor = 'bg-amber-100 text-amber-800 border-amber-300'

                        return (
                          <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-4 px-4 text-center">
                              <span className={`w-7 h-7 rounded-xl font-black text-xs inline-flex items-center justify-center border ${rankBadge}`}>
                                {idx + 1}
                              </span>
                            </td>

                            <td className="py-4 px-4 font-black text-sm text-slate-800">
                              {c.name}
                            </td>

                            <td className="py-4 px-4 text-center text-xs font-bold text-slate-600">
                              {c.total_students} Siswa
                            </td>

                            <td className="py-4 px-4 text-center">
                              <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block">
                                {c.hadir}
                              </span>
                            </td>

                            <td className="py-4 px-4 text-center">
                              <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-amber-50 text-amber-700 border border-amber-200 inline-block">
                                {c.izin}
                              </span>
                            </td>

                            <td className="py-4 px-4 text-center">
                              <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-blue-50 text-blue-700 border border-blue-200 inline-block">
                                {c.sakit}
                              </span>
                            </td>

                            <td className="py-4 px-4 text-center">
                              <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-rose-50 text-rose-700 border border-rose-200 inline-block">
                                {c.alpha}
                              </span>
                            </td>

                            <td className="py-4 px-6 text-center">
                              <span className={`px-3 py-1 rounded-xl text-xs font-black border ${pctColor} inline-block shadow-2xs`}>
                                {c.percentage}%
                              </span>
                            </td>

                            <td className="py-4 px-4 text-center">
                              <Link
                                href={`/classroom/${c.slug}`}
                                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 text-xs font-bold transition inline-flex items-center gap-1"
                              >
                                <span>Detail</span>
                                <ArrowRight size={12} />
                              </Link>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>
          )}
        </>
      )}

    </div>
  )
}
