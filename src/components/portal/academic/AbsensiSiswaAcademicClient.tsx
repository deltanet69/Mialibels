'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Calendar,
  CalendarDays,
  CalendarCheck2,
  BarChart3,
  Search,
  Filter,
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
  RefreshCw,
  CalendarRange,
  Layers,
  GraduationCap,
  Activity,
  Flame,
  UserCheck,
  UserX,
  HeartPulse
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

const CACHE_KEY_PREFIX = 'academic_attendance_overview_v3_'

type DailyStudent = {
  id: string
  name: string
  student_number: string
  nisn?: string
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

type WeeklyDaySlot = {
  date: string
  dayName: string
  dayLabel: string
  present_count: number
  total_students: number
  percentage: number
}

type WeeklyClassMatrix = {
  id: string
  name: string
  slug: string
  homeroom_teacher: string
  total_students: number
  days: WeeklyDaySlot[]
  weekly_average: number
}

type WeeklyStudent = {
  id: string
  name: string
  student_number: string
  nisn?: string
  class_id: string
  class_name: string
  days: Record<string, { status: string | null; entry_time: string | null; exit_time: string | null }>
  summary: {
    hadir: number
    izin: number
    sakit: number
    alpha: number
    total_days: number
    percentage: number
  }
}

type MonthlyClassRecap = {
  id: string
  name: string
  slug: string
  homeroom_teacher: string
  total_students: number
  total_records: number
  hadir: number
  izin: number
  sakit: number
  alpha: number
  percentage: number
}

type MonthlyStudent = {
  id: string
  name: string
  student_number: string
  nisn?: string
  class_id: string
  class_name: string
  summary: {
    hadir: number
    izin: number
    sakit: number
    alpha: number
    total_records: number
    percentage: number
  }
}

type ClassroomSummary = {
  id: string
  name: string
  slug: string
  homeroom_teacher: string
  total_students: number
  present_count: number
  izin_count: number
  sakit_count: number
  alpha_count: number
  belum_count: number
  percentage: number
}

// Grade Color Styling Map
const GRADE_THEMES: Record<string, {
  gradient: string
  bgLight: string
  border: string
  text: string
  badge: string
  ring: string
}> = {
  '1': {
    gradient: 'from-sky-500 via-indigo-600 to-blue-700',
    bgLight: 'bg-indigo-50/70 hover:bg-indigo-50',
    border: 'border-indigo-100 hover:border-indigo-300',
    text: 'text-indigo-700',
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    ring: 'ring-indigo-400'
  },
  '2': {
    gradient: 'from-emerald-500 via-teal-600 to-cyan-700',
    bgLight: 'bg-emerald-50/70 hover:bg-emerald-50',
    border: 'border-emerald-100 hover:border-emerald-300',
    text: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    ring: 'ring-emerald-400'
  },
  '3': {
    gradient: 'from-violet-500 via-purple-600 to-fuchsia-700',
    bgLight: 'bg-purple-50/70 hover:bg-purple-50',
    border: 'border-purple-100 hover:border-purple-300',
    text: 'text-purple-700',
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
    ring: 'ring-purple-400'
  },
  '4': {
    gradient: 'from-amber-500 via-orange-600 to-rose-600',
    bgLight: 'bg-amber-50/70 hover:bg-amber-50',
    border: 'border-amber-100 hover:border-amber-300',
    text: 'text-amber-800',
    badge: 'bg-amber-100 text-amber-900 border-amber-200',
    ring: 'ring-amber-400'
  },
  '5': {
    gradient: 'from-rose-500 via-pink-600 to-red-600',
    bgLight: 'bg-rose-50/70 hover:bg-rose-50',
    border: 'border-rose-100 hover:border-rose-300',
    text: 'text-rose-700',
    badge: 'bg-rose-100 text-rose-800 border-rose-200',
    ring: 'ring-rose-400'
  },
  '6': {
    gradient: 'from-blue-600 via-cyan-600 to-teal-700',
    bgLight: 'bg-cyan-50/70 hover:bg-cyan-50',
    border: 'border-cyan-100 hover:border-cyan-300',
    text: 'text-cyan-800',
    badge: 'bg-cyan-100 text-cyan-900 border-cyan-200',
    ring: 'ring-cyan-400'
  }
}

const getGradeTheme = (className: string) => {
  const digit = (className || '').replace(/[^0-9]/g, '')[0] || '1'
  return GRADE_THEMES[digit] || GRADE_THEMES['1']
}

export default function AbsensiSiswaAcademicClient() {
  const getLocalDateString = () => {
    const d = new Date()
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().split('T')[0]
  }

  const [date, setDate] = useState(getLocalDateString())
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL')
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('ALL')

  // Month & Year for monthly recap
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Data states
  const [kpiData, setKpiData] = useState<any>(null)
  const [classrooms, setClassrooms] = useState<ClassroomSummary[]>([])
  const [dailyStudents, setDailyStudents] = useState<DailyStudent[]>([])
  const [weeklyMatrix, setWeeklyMatrix] = useState<WeeklyClassMatrix[]>([])
  const [weeklyStudents, setWeeklyStudents] = useState<WeeklyStudent[]>([])
  const [monthlyRecap, setMonthlyRecap] = useState<MonthlyClassRecap[]>([])
  const [monthlyStudents, setMonthlyStudents] = useState<MonthlyStudent[]>([])
  const [weekDays, setWeekDays] = useState<{ date: string; dayName: string; dayLabel: string }[]>([])

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]

  const formatDisplayDate = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number)
      const dt = new Date(y, m - 1, d)
      const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
      const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
      return `${dayNames[dt.getDay()]}, ${d} ${monthShort[m - 1]} ${y}`
    } catch {
      return dateStr
    }
  }

  // 1. Instant Cache Hydration on Mount
  useEffect(() => {
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}${activeTab}_${date}_${selectedClassId}_${month}_${year}`
      const cached = sessionStorage.getItem(cacheKey) || sessionStorage.getItem(`${CACHE_KEY_PREFIX}daily`)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed.data) {
          applyData(parsed.data)
          setLoading(false)
        }
      }
    } catch (e) {
      // Ignore sessionStorage errors
    }
  }, [])

  const applyData = (data: any) => {
    if (!data) return
    setKpiData(data.kpi || null)
    setClassrooms(data.classrooms || [])
    setWeekDays(data.weekDays || [])
    setWeeklyMatrix(data.weekly_matrix || [])
    setMonthlyRecap(data.monthly_recap || [])

    if (data.students) {
      setDailyStudents(data.students.daily || [])
      setWeeklyStudents(data.students.weekly || [])
      setMonthlyStudents(data.students.monthly || [])
    }
  }

  // 2. Fetch Data from API
  const fetchData = async (isBackground = false) => {
    if (!isBackground) {
      setIsRefreshing(true)
    }
    try {
      const res = await fetch(
        `/api/attendance/students/overview?viewMode=${activeTab}&date=${date}&classId=${selectedClassId}&month=${month}&year=${year}&_t=${Date.now()}`
      )
      const json = await res.json()
      if (json.success && json.data) {
        applyData(json.data)

        // Save to sessionStorage for 0ms instant loading
        try {
          const cacheKey = `${CACHE_KEY_PREFIX}${activeTab}_${date}_${selectedClassId}_${month}_${year}`
          sessionStorage.setItem(cacheKey, JSON.stringify(json))
          if (activeTab === 'daily') {
            sessionStorage.setItem(`${CACHE_KEY_PREFIX}daily`, JSON.stringify(json))
          }
        } catch (err) {
          // quota safely handled
        }
      }
    } catch (e) {
      console.error('Error fetching academic attendance overview:', e)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData(false)
  }, [activeTab, date, selectedClassId, month, year])

  // 3. Supabase Realtime live sync
  useEffect(() => {
    try {
      const channel = supabase.channel('mia-attendance-academic-sync')
      channel
        .on('broadcast', { event: 'scan_result_siswa' }, () => {
          fetchData(true)
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    } catch (e) {
      console.error('Realtime sync error', e)
    }
  }, [activeTab, date, selectedClassId, month, year])

  // Month navigation
  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  // Date shifting
  const shiftDate = (days: number) => {
    const d = new Date(date + 'T00:00:00')
    d.setDate(d.getDate() + days)
    setDate(d.toISOString().split('T')[0])
  }

  const displayedClassrooms = useMemo(() => {
    if (selectedGradeFilter === 'ALL') return classrooms
    return classrooms.filter(c => c.name.startsWith(selectedGradeFilter))
  }, [classrooms, selectedGradeFilter])

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12 font-sans">

      {/* ──────────────────────────────────────────────────────────── */}
      {/* 1. TOP HEADER & CONTROLS (CLEAN & MODERN LIGHT DESIGN) */}
      {/* ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-5 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs">

        {/* Left: Brand Title & Subtitle */}
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/70 text-blue-700 text-[11px] font-black uppercase tracking-wider shadow-2xs">
              <span>Pusat Monitoring Akademik</span>
            </span>

            {/* Real-time Indicator Badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>RFID &amp; Classroom Live Sync</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Rekap Absensi Siswa Madrasah</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Monitoring presensi terpadu 723 siswa pada 24 rombel kelas secara harian, mingguan, dan bulanan.
          </p>
        </div>

        {/* Right: Tab Mode Selector & Dynamic Range Toolbar */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">

          {/* Mode Switcher Segmented Tabs */}
          <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 inline-flex gap-1 shadow-inner">
            <button
              onClick={() => setActiveTab('daily')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${activeTab === 'daily'
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <CalendarDays size={14} className={activeTab === 'daily' ? 'text-blue-600' : 'text-slate-400'} />
              <span>Harian</span>
            </button>

            <button
              onClick={() => setActiveTab('weekly')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${activeTab === 'weekly'
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <CalendarRange size={14} className={activeTab === 'weekly' ? 'text-blue-600' : 'text-slate-400'} />
              <span>Mingguan</span>
            </button>

            <button
              onClick={() => setActiveTab('monthly')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${activeTab === 'monthly'
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <BarChart3 size={14} className={activeTab === 'monthly' ? 'text-blue-600' : 'text-slate-400'} />
              <span>Bulanan</span>
            </button>
          </div>

          {/* Dynamic Date & Period Controls */}
          {activeTab === 'daily' && (
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-2xl p-1 shadow-2xs">
              <button
                onClick={() => shiftDate(-1)}
                className="p-1.5 hover:bg-slate-200/70 rounded-xl transition text-slate-600 cursor-pointer"
                title="Hari Sebelumnya"
              >
                <ChevronLeft size={15} />
              </button>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent text-xs font-black text-slate-800 outline-none cursor-pointer px-2"
              />
              <button
                onClick={() => shiftDate(1)}
                className="p-1.5 hover:bg-slate-200/70 rounded-xl transition text-slate-600 cursor-pointer"
                title="Hari Berikutnya"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          )}

          {activeTab === 'weekly' && (
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-2xl p-1 shadow-2xs">
              <button
                onClick={() => shiftDate(-7)}
                className="p-1.5 hover:bg-slate-200/70 rounded-xl transition text-slate-600 cursor-pointer"
                title="Minggu Sebelumnya"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-xs font-black text-slate-800 px-2.5">
                {weekDays.length > 0 ? `${weekDays[0].dayLabel} — ${weekDays[weekDays.length - 1].dayLabel}` : 'Minggu Ini'}
              </span>
              <button
                onClick={() => shiftDate(7)}
                className="p-1.5 hover:bg-slate-200/70 rounded-xl transition text-slate-600 cursor-pointer"
                title="Minggu Berikutnya"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          )}

          {activeTab === 'monthly' && (
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-2xl p-1 shadow-2xs">
              <button
                onClick={prevMonth}
                className="p-1.5 hover:bg-slate-200/70 rounded-xl transition text-slate-600 cursor-pointer"
                title="Bulan Sebelumnya"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-xs font-black text-slate-800 px-3 min-w-[130px] text-center">
                {monthNames[month - 1]} {year}
              </span>
              <button
                onClick={nextMonth}
                className="p-1.5 hover:bg-slate-200/70 rounded-xl transition text-slate-600 cursor-pointer"
                title="Bulan Berikutnya"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => fetchData(false)}
              title="Muat Ulang Data"
              className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-2xl transition cursor-pointer shadow-2xs"
            >
              <RefreshCw size={15} className={isRefreshing ? 'animate-spin text-blue-600' : ''} />
            </button>

            <button
              onClick={handlePrint}
              title="Cetak Laporan Presensi"
              className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-2xl transition cursor-pointer shadow-2xs"
            >
              <Printer size={15} />
            </button>
          </div>

        </div>
      </div>

      {loading && !kpiData ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-16 flex flex-col justify-center items-center gap-3 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
          <span className="text-sm font-extrabold text-slate-700">Menghubungkan Data Absensi Seluruh Rombel...</span>
        </div>
      ) : (
        <>
          {/* ──────────────────────────────────────────────────────────── */}
          {/* 2. PLAYFUL & MODERN KPI METRIC CARDS */}
          {/* ──────────────────────────────────────────────────────────── */}
          {kpiData && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 sm:gap-4">

              {/* Card 1: Total Siswa */}
              <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Siswa</span>
                  <div className="w-9 h-9 rounded-2xl bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center text-slate-700 transition">
                    <Users size={16} />
                  </div>
                </div>
                <div className="mt-3.5">
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {kpiData.total_students}
                  </div>
                  <span className="text-xs font-bold text-slate-400 block mt-0.5">
                    {classrooms.length} Rombel Kelas
                  </span>
                </div>
              </div>

              {/* Card 2: Siswa Hadir (Highlight Card) */}
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 hover:shadow-xl transition-all flex flex-col justify-between relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/20 rounded-full blur-lg pointer-events-none" />
                <div className="flex items-center justify-between relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-100">
                    {activeTab === 'daily' ? 'Hadir Hari Ini' : activeTab === 'weekly' ? 'Hadir Mingguan' : 'Hadir Bulanan'}
                  </span>
                  <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                    <CheckCircle2 size={16} />
                  </div>
                </div>
                <div className="mt-3.5 relative z-10 flex items-baseline justify-between gap-1">
                  <div>
                    <span className="text-2xl sm:text-3xl font-black tracking-tight">
                      {activeTab === 'daily' ? kpiData.daily?.total_present : activeTab === 'weekly' ? kpiData.weekly?.total_present_slots : kpiData.monthly?.total_hadir}
                    </span>
                    <span className="text-xs font-bold text-emerald-100 ml-1">
                      {activeTab === 'daily' ? 'Siswa' : 'Kehadiran'}
                    </span>
                  </div>
                  <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-white/25 backdrop-blur-md text-white border border-white/20 shadow-xs">
                    {activeTab === 'daily' ? `${kpiData.daily?.percentage}%` : activeTab === 'weekly' ? `${kpiData.weekly?.percentage}%` : `${kpiData.monthly?.percentage}%`}
                  </span>
                </div>
              </div>

              {/* Card 3: Izin & Sakit */}
              <div className="p-4 sm:p-5 rounded-3xl bg-amber-50/90 border border-amber-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider">Izin &amp; Sakit</span>
                  <div className="w-9 h-9 rounded-2xl bg-amber-200/70 flex items-center justify-center text-amber-800">
                    <HeartPulse size={16} />
                  </div>
                </div>
                <div className="mt-3.5">
                  <div className="text-2xl sm:text-3xl font-black text-amber-950 tracking-tight">
                    {activeTab === 'daily'
                      ? (kpiData.daily?.total_izin + kpiData.daily?.total_sakit)
                      : activeTab === 'weekly'
                        ? (kpiData.weekly?.total_izin + kpiData.weekly?.total_sakit)
                        : (kpiData.monthly?.total_izin + kpiData.monthly?.total_sakit)}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs font-bold text-amber-700">
                    <span>{activeTab === 'daily' ? kpiData.daily?.total_izin : activeTab === 'weekly' ? kpiData.weekly?.total_izin : kpiData.monthly?.total_izin} Izin</span>
                    <span>&bull;</span>
                    <span>{activeTab === 'daily' ? kpiData.daily?.total_sakit : activeTab === 'weekly' ? kpiData.weekly?.total_sakit : kpiData.monthly?.total_sakit} Sakit</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Alpha */}
              <div className="p-4 sm:p-5 rounded-3xl bg-rose-50/90 border border-rose-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-rose-800 uppercase tracking-wider">Alpha (Tanpa Ket.)</span>
                  <div className="w-9 h-9 rounded-2xl bg-rose-200/70 flex items-center justify-center text-rose-800">
                    <UserX size={16} />
                  </div>
                </div>
                <div className="mt-3.5">
                  <div className="text-2xl sm:text-3xl font-black text-rose-950 tracking-tight">
                    {activeTab === 'daily' ? kpiData.daily?.total_alpha : activeTab === 'weekly' ? kpiData.weekly?.total_alpha : kpiData.monthly?.total_alpha}
                  </div>
                  <span className="text-xs font-bold text-rose-700 block mt-0.5">Siswa Tidak Masuk</span>
                </div>
              </div>

              {/* Card 5: Belum Presensi / Status */}
              <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between col-span-2 md:col-span-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    {activeTab === 'daily' ? 'Belum Presensi' : 'Status Mesin'}
                  </span>
                  <div className="w-9 h-9 rounded-2xl bg-slate-200/80 flex items-center justify-center text-slate-700">
                    <Clock size={16} />
                  </div>
                </div>
                <div className="mt-3.5">
                  {activeTab === 'daily' ? (
                    <>
                      <div className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                        {kpiData.daily?.total_belum}
                      </div>
                      <span className="text-xs font-bold text-slate-400 block mt-0.5">Siswa Belum Scan</span>
                    </>
                  ) : (
                    <>
                      <div className="text-sm font-black text-emerald-600 flex items-center gap-1.5">
                        <ShieldCheck size={18} /> Aktif Otomatis
                      </div>
                      <span className="text-[11px] font-bold text-slate-400 block mt-0.5">
                        24 Rombel Terhubung
                      </span>
                    </>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ──────────────────────────────────────────────────────────── */}
          {/* 3. GRADE FILTER BUTTONS BAR */}
          {/* ──────────────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between gap-4 flex-wrap bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2">
              <Layers size={15} className="text-slate-400" />
              <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Filter Jenjang Kelas:</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'ALL', label: 'Semua Rombel (24)' },
                { id: '1', label: 'Kelas 1 (A-D)' },
                { id: '2', label: 'Kelas 2 (A-D)' },
                { id: '3', label: 'Kelas 3 (A-D)' },
                { id: '4', label: 'Kelas 4 (A-D)' },
                { id: '5', label: 'Kelas 5 (A-D)' },
                { id: '6', label: 'Kelas 6 (A-D)' },
              ].map(grade => {
                const isActive = selectedGradeFilter === grade.id
                return (
                  <button
                    key={grade.id}
                    onClick={() => {
                      setSelectedGradeFilter(grade.id)
                      if (selectedClassId !== 'ALL' && !selectedClassId.startsWith(grade.id) && grade.id !== 'ALL') {
                        setSelectedClassId('ALL')
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${isActive
                        ? 'bg-slate-900 text-white shadow-sm scale-[1.02]'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                  >
                    {grade.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────────── */}
          {/* 4. TAB 1: MONITORING HARIAN */}
          {/* ──────────────────────────────────────────────────────────── */}
          {activeTab === 'daily' && (
            <>
              {/* Classroom Cards Grid */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-indigo-600" />
                      <span>Ringkasan Kehadiran per Rombel Kelas</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Pantau status kehadiran, izin, sakit, dan alpha tiap rombel secara real-time.
                    </p>
                  </div>
                  {selectedClassId !== 'ALL' && (
                    <button
                      onClick={() => setSelectedClassId('ALL')}
                      className="text-xs font-black text-blue-600 hover:text-blue-800 flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 transition cursor-pointer shadow-xs"
                    >
                      <span>Tampilkan Semua ({classrooms.length} Kelas)</span>
                      <XCircle size={14} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
                  {displayedClassrooms.map((c) => {
                    const isSelected = selectedClassId === c.id || selectedClassId === c.name
                    const theme = getGradeTheme(c.name)

                    let progressColor = 'bg-emerald-500'
                    if (c.percentage < 70) progressColor = 'bg-rose-500'
                    else if (c.percentage < 85) progressColor = 'bg-amber-500'

                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedClassId(isSelected ? 'ALL' : c.id)}
                        className={`p-4 rounded-3xl border transition-all duration-200 cursor-pointer flex flex-col justify-between group ${isSelected
                            ? `bg-white ${theme.border} shadow-lg ring-2 ${theme.ring} scale-[1.01]`
                            : `bg-white ${theme.border} ${theme.bgLight} shadow-xs hover:shadow-md hover:scale-[1.01]`
                          }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                              {/* Grade Badge */}
                              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${theme.gradient} text-white font-black text-base flex items-center justify-center shadow-md`}>
                                {c.name.replace(/kelas\s*/i, '')}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-black text-sm text-slate-900 group-hover:text-blue-600 transition truncate">
                                  Kelas {c.name}
                                </h4>
                                <span className="text-[11px] font-bold text-slate-500 truncate block max-w-[130px]" title={c.homeroom_teacher}>
                                  {c.homeroom_teacher}
                                </span>
                              </div>
                            </div>

                            {/* Percentage Badge */}
                            <div className="text-right flex flex-col items-end">
                              <span className={`text-base font-black ${c.percentage >= 85 ? 'text-emerald-600' : c.percentage >= 70 ? 'text-amber-600' : 'text-slate-800'
                                }`}>
                                {c.percentage}%
                              </span>
                              <span className="text-[9px] font-extrabold uppercase text-slate-400">
                                Hadir
                              </span>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full bg-slate-200/80 h-2 rounded-full mt-3.5 overflow-hidden p-0.5">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                              style={{ width: `${Math.min(100, c.percentage)}%` }}
                            />
                          </div>
                        </div>

                        {/* Card Sub-Metrics Footer */}
                        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-black">
                              {c.present_count} / {c.total_students}
                            </span>
                            {(c.izin_count > 0 || c.sakit_count > 0) && (
                              <span className="px-1.5 py-0.5 rounded-lg bg-amber-100 text-amber-800 text-[10px] font-bold">
                                {c.izin_count + c.sakit_count} I/S
                              </span>
                            )}
                            {c.alpha_count > 0 && (
                              <span className="px-1.5 py-0.5 rounded-lg bg-rose-100 text-rose-800 text-[10px] font-bold">
                                {c.alpha_count} A
                              </span>
                            )}
                          </div>

                          <Link
                            href={`/classroom/${c.slug}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 text-slate-400 hover:text-blue-600 transition cursor-pointer"
                            title="Buka Ruang Kelas"
                          >
                            <ExternalLink size={15} />
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {/* ──────────────────────────────────────────────────────────── */}
          {/* 5. TAB 2: REKAPITULASI MINGGUAN */}
          {/* ──────────────────────────────────────────────────────────── */}
          {activeTab === 'weekly' && (
            <div className="space-y-6">

              {/* Weekly Matrix Overview per Class */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <div>
                    <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <Activity className="w-5 h-5 text-indigo-600" />
                      <span>Matriks Kehadiran Mingguan per Rombel Kelas</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Rincian persentase kehadiran harian (Senin - Sabtu) untuk setiap rombel kelas.
                    </p>
                  </div>
                  <div className="text-xs font-black text-indigo-600 bg-indigo-50 px-3.5 py-1.5 rounded-xl border border-indigo-200/70 inline-flex items-center gap-1.5 shadow-xs">
                    <CalendarRange size={14} />
                    <span>{weekDays.length > 0 ? `${weekDays[0].dayLabel} — ${weekDays[weekDays.length - 1].dayLabel}` : ''}</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4 w-28">Kelas</th>
                        <th className="py-3 px-4 w-44">Wali Kelas</th>
                        <th className="py-3 px-4 text-center w-20">Siswa</th>
                        {weekDays.map(d => (
                          <th key={d.date} className="py-3 px-3 text-center">
                            {d.dayName}
                            <span className="block text-[9px] font-semibold text-slate-400">
                              {d.date.split('-')[2]}/{d.date.split('-')[1]}
                            </span>
                          </th>
                        ))}
                        <th className="py-3 px-4 text-center w-28">Rata-rata</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {weeklyMatrix.map((item) => {
                        const theme = getGradeTheme(item.name)
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4">
                              <span className={`font-black text-xs px-2.5 py-1 rounded-xl border ${theme.badge} inline-block`}>
                                Kelas {item.name}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-xs font-bold text-slate-600 truncate max-w-[160px]">
                              {item.homeroom_teacher}
                            </td>
                            <td className="py-3 px-4 text-center text-xs font-black text-slate-800">
                              {item.total_students}
                            </td>
                            {item.days.map(d => (
                              <td key={d.date} className="py-3 px-3 text-center">
                                <div className="inline-flex flex-col items-center">
                                  <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${d.percentage >= 85
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      : d.percentage >= 70
                                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                                    }`}>
                                    {d.present_count} <span className="text-[10px] font-normal">({d.percentage}%)</span>
                                  </span>
                                </div>
                              </td>
                            ))}
                            <td className="py-3 px-4 text-center">
                              <span className={`text-xs font-black px-2.5 py-1 rounded-xl ${item.weekly_average >= 85
                                  ? 'bg-emerald-500 text-white shadow-xs'
                                  : item.weekly_average >= 70
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-slate-600 text-white'
                                }`}>
                                {item.weekly_average}%
                              </span>
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

          {/* ──────────────────────────────────────────────────────────── */}
          {/* 6. TAB 3: REKAPITULASI BULANAN ROMBEL */}
          {/* ──────────────────────────────────────────────────────────── */}
          {activeTab === 'monthly' && (
            <div className="space-y-6">

              {/* Leaderboard per Rombel Kelas */}
              <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <div>
                    <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <Flame className="w-5 h-5 text-amber-500" />
                      <span>Peringkat &amp; Rekapitulasi Rombel Kelas ({monthNames[month - 1]} {year})</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Tingkat kehadiran siswa seluruh kelas dalam satu bulan penuh.
                    </p>
                  </div>
                  <div className="text-xs font-black text-blue-600 bg-blue-50 px-3.5 py-1.5 rounded-xl border border-blue-200 inline-flex items-center gap-1.5">
                    <Award size={15} />
                    <span>Total {monthlyRecap.length} Rombel Kelas</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {monthlyRecap.map((item, rank) => {
                    const theme = getGradeTheme(item.name)
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedClassId(selectedClassId === item.id ? 'ALL' : item.id)}
                        className={`p-4 rounded-3xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${selectedClassId === item.id
                            ? `bg-white ${theme.border} ring-2 ${theme.ring} shadow-md`
                            : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-xs'
                          }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shadow-xs ${rank === 0
                                  ? 'bg-amber-400 text-slate-950 font-black ring-2 ring-amber-300'
                                  : rank === 1
                                    ? 'bg-slate-200 text-slate-800'
                                    : rank === 2
                                      ? 'bg-amber-700 text-white'
                                      : 'bg-slate-100 text-slate-600'
                                }`}>
                                {rank === 0 ? '🏆 1' : rank === 1 ? '🥈 2' : rank === 2 ? '🥉 3' : `#${rank + 1}`}
                              </span>
                              <div>
                                <h4 className="font-black text-sm text-slate-900">Kelas {item.name}</h4>
                                <span className="text-[11px] font-bold text-slate-400 truncate block max-w-[130px]">
                                  {item.homeroom_teacher}
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-base font-black text-slate-900">{item.percentage}%</span>
                              <span className="text-[10px] font-bold text-slate-400 block">Rata-rata</span>
                            </div>
                          </div>

                          <div className="w-full bg-slate-100 h-2 rounded-full mt-3.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${item.percentage >= 85 ? 'bg-emerald-500' : item.percentage >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                              style={{ width: `${Math.min(100, item.percentage)}%` }}
                            />
                          </div>
                        </div>

                        <div className="mt-3.5 pt-3 border-t border-slate-100 grid grid-cols-4 gap-1.5 text-center text-[10px]">
                          <div className="bg-emerald-50 text-emerald-800 py-1 rounded-lg font-black">
                            {item.hadir} <span className="block text-[8px] font-medium text-emerald-600">Hadir</span>
                          </div>
                          <div className="bg-amber-50 text-amber-800 py-1 rounded-lg font-black">
                            {item.izin} <span className="block text-[8px] font-medium text-amber-600">Izin</span>
                          </div>
                          <div className="bg-blue-50 text-blue-800 py-1 rounded-lg font-black">
                            {item.sakit} <span className="block text-[8px] font-medium text-blue-600">Sakit</span>
                          </div>
                          <div className="bg-rose-50 text-rose-800 py-1 rounded-lg font-black">
                            {item.alpha} <span className="block text-[8px] font-medium text-rose-600">Alpha</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

        </>
      )}

    </div>
  )
}
