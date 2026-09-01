'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Download, Loader2, BookOpen } from 'lucide-react'

type TeachingLog = {
  id: string
  date: string
  status: string
  started_at: string
  ended_at: string | null
  teacher: {
    id: string
    name: string
    rfid: string
  } | null
  schedule: {
    id: string
    name: string
    day_of_week: string
    start_time: string
    end_time: string
    classroom: {
      name: string
    } | null
  } | null
}

export default function RekapMengajarPage() {
  const [filterType, setFilterType] = useState<'mingguan' | 'bulanan'>('mingguan')
  const [logs, setLogs] = useState<TeachingLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Date range state
  const today = new Date()
  const [currentDate, setCurrentDate] = useState(today)

  const getWeekRange = (date: Date) => {
    const day = date.getDay() || 7 // Make Sunday (0) the 7th day
    const firstDay = new Date(date)
    firstDay.setDate(date.getDate() - day + 1)
    const lastDay = new Date(firstDay)
    lastDay.setDate(firstDay.getDate() + 6)
    return { start: firstDay, end: lastDay }
  }

  const getMonthRange = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    return { start: firstDay, end: lastDay }
  }

  const { start, end } = filterType === 'mingguan' ? getWeekRange(currentDate) : getMonthRange(currentDate)

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true)
      setError(null)
      try {
        const startStr = start.toISOString().split('T')[0]
        const endStr = end.toISOString().split('T')[0]
        const res = await fetch(`/api/teaching-attendance/recap?startDate=${startStr}&endDate=${endStr}`)
        const data = await res.json()
        if (data.success) {
          setLogs(data.data)
        } else {
          setError(data.error)
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [start.getTime(), end.getTime(), filterType])

  const nextPeriod = () => {
    const newDate = new Date(currentDate)
    if (filterType === 'mingguan') {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const prevPeriod = () => {
    const newDate = new Date(currentDate)
    if (filterType === 'mingguan') {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setMonth(newDate.getMonth() - 1)
    }
    setCurrentDate(newDate)
  }

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return '-'
    const validIso = (!isoString.endsWith('Z') && !isoString.includes('+')) ? `${isoString}Z` : isoString
    const d = new Date(validIso)
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }

  const handleExportCSV = () => {
    if (logs.length === 0) return alert('Tidak ada data untuk diekspor.')

    const headers = ['Tanggal', 'Waktu', 'Guru', 'Kelas', 'Mata Pelajaran', 'Waktu Mulai', 'Status']
    const csvRows = [headers.join(',')]

    logs.forEach(log => {
      const date = new Date(log.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
      const time = `${log.schedule?.start_time?.slice(0,5)} - ${log.schedule?.end_time?.slice(0,5)}`
      const teacher = log.teacher?.name || '-'
      const classroom = log.schedule?.classroom?.name || '-'
      const subject = log.schedule?.name || '-'
      const startTime = formatTime(log.started_at)
      const status = log.status

      // Escape quotes and wrap in quotes for CSV
      const row = [date, time, teacher, classroom, subject, startTime, status].map(field => `"${field}"`)
      csvRows.push(row.join(','))
    })

    const csvString = csvRows.join('\n')
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `rekap_mengajar_${start.toISOString().split('T')[0]}_to_${end.toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex flex-col gap-6 h-full p-4 lg:p-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Rekapitulasi Kehadiran Mengajar</h1>
          <p className="text-slate-500 mt-1">Pantau jadwal dan absensi jam pelajaran guru</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setFilterType('mingguan')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${filterType === 'mingguan' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Mingguan
            </button>
            <button
              onClick={() => setFilterType('bulanan')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${filterType === 'bulanan' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Bulanan
            </button>
          </div>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition print:hidden"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700 transition print:hidden"
          >
            <span className="hidden sm:inline">Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm print:hidden">
        <button onClick={prevPeriod} className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-600 font-semibold text-sm">
          &laquo; Sebelumnya
        </button>
        <div className="flex items-center gap-2 text-slate-800 font-bold">
          <Calendar size={18} className="text-blue-500" />
          {filterType === 'mingguan' 
            ? `${start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
            : start.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
          }
        </div>
        <button onClick={nextPeriod} className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-600 font-semibold text-sm">
          Selanjutnya &raquo;
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex-grow flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 font-medium">{error}</div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <BookOpen size={48} className="mb-4 opacity-50" />
            <p className="font-medium">Tidak ada data kehadiran mengajar pada periode ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 font-semibold text-slate-600 text-sm">Tanggal</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm">Waktu</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm">Guru</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm">Kelas</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm">Mata Pelajaran</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm">Waktu Mulai</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-sm font-medium text-slate-800">
                      {new Date(log.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </td>
                    <td className="p-4 text-sm text-slate-600 font-mono">
                      {log.schedule?.start_time?.slice(0,5)} - {log.schedule?.end_time?.slice(0,5)}
                    </td>
                    <td className="p-4 text-sm font-bold text-slate-800">
                      {log.teacher?.name || '-'}
                    </td>
                    <td className="p-4 text-sm font-semibold text-blue-700">
                      {log.schedule?.classroom?.name || '-'}
                    </td>
                    <td className="p-4 text-sm text-slate-700">
                      {log.schedule?.name || '-'}
                    </td>
                    <td className="p-4 text-sm text-slate-600 font-mono">
                      {formatTime(log.started_at)}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-green-100 text-green-700">
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .bg-white.rounded-2xl.border.border-slate-100.shadow-sm.overflow-hidden, 
          .bg-white.rounded-2xl.border.border-slate-100.shadow-sm.overflow-hidden * {
            visibility: visible;
          }
          .bg-white.rounded-2xl.border.border-slate-100.shadow-sm.overflow-hidden {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none;
            box-shadow: none;
          }
        }
      `}} />
    </div>
  )
}
