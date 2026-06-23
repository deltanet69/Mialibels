'use client'

import React, { useEffect, useState } from 'react'
import { Calendar, Save, CalendarCheck, CalendarClock, CalendarX, CalendarMinus } from 'lucide-react'

type AttendanceRecord = {
  staff_id: string
  date: string
  status?: string | null
  notes?: string | null
}

export default function AbsensiGuruPage() {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [staffs, setStaffs] = useState<any[]>([])
  const [attendanceState, setAttendanceState] = useState<Record<string, AttendanceRecord>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  const fetchAttendance = async (selectedDate: string) => {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/attendance/guru?date=${selectedDate}`)
      const data = await res.json()
      if (data.success) {
        setStaffs(data.data)
        
        // Initialize state
        const newState: Record<string, AttendanceRecord> = {}
        data.data.forEach((staff: any) => {
          newState[staff.id] = {
            staff_id: staff.id,
            date: selectedDate,
            status: staff.attendance?.status?.toUpperCase() || null,
            notes: staff.attendance?.notes || ''
          }
        })
        setAttendanceState(newState)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAttendance(date)
  }, [date])

  const handleStatusChange = (staffId: string, status: string) => {
    setAttendanceState(prev => {
      const current = prev[staffId]
      // Toggle off if same status clicked
      const newStatus = current.status === status ? null : status
      return { ...prev, [staffId]: { ...current, status: newStatus } }
    })
  }

  const handleNotesChange = (staffId: string, notes: string) => {
    setAttendanceState(prev => ({
      ...prev,
      [staffId]: { ...prev[staffId], notes }
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    
    // Only send records that have a status set
    const recordsToSave = Object.values(attendanceState).filter(r => r.status)

    if (recordsToSave.length === 0) {
      setMessage({ type: 'success', text: 'Tidak ada data absensi untuk disimpan.' })
      setSaving(false)
      return
    }

    try {
      const res = await fetch('/api/attendance/guru', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordsToSave)
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan absensi')
      
      setMessage({ type: 'success', text: 'Data absensi berhasil disimpan!' })
      // Auto dismiss message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  // Calculate summaries
  const summary = {
    HADIR: 0,
    IZIN: 0,
    SAKIT: 0,
    ALPA: 0
  }
  Object.values(attendanceState).forEach(r => {
    if (r.status === 'HADIR') summary.HADIR++
    if (r.status === 'IZIN') summary.IZIN++
    if (r.status === 'SAKIT') summary.SAKIT++
    if (r.status === 'ALPA') summary.ALPA++
  })

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Absensi Guru / Staff</h1>
          <p className="text-slate-500">Pencatatan kehadiran harian.</p>
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Calendar className="text-slate-400" size={20} />
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition font-medium text-slate-700 shadow-sm"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-slate-100">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CalendarCheck size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hadir</p>
            <p className="text-2xl font-black text-slate-800 leading-none">{summary.HADIR}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-slate-100">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <CalendarClock size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Izin</p>
            <p className="text-2xl font-black text-slate-800 leading-none">{summary.IZIN}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-slate-100">
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
            <CalendarMinus size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sakit</p>
            <p className="text-2xl font-black text-slate-800 leading-none">{summary.SAKIT}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-slate-100">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
            <CalendarX size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alpa</p>
            <p className="text-2xl font-black text-slate-800 leading-none">{summary.ALPA}</p>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
        }`}>
          {message.text}
        </div>
      )}

      {/* Main Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 p-5 bg-slate-50/50 border-b border-slate-100 text-sm font-semibold text-slate-600">
          <div className="col-span-4 pl-2">Nama Guru/Staff</div>
          <div className="col-span-4 text-center">Status Kehadiran</div>
          <div className="col-span-4 pr-2">Catatan (Opsional)</div>
        </div>

        {/* List */}
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-10 text-center text-slate-500">Memuat data absensi...</div>
          ) : staffs.length === 0 ? (
            <div className="p-10 text-center text-slate-500">Belum ada data guru/staff yang aktif.</div>
          ) : (
            staffs.map((staff) => {
              const currentStatus = attendanceState[staff.id]?.status
              const currentNotes = attendanceState[staff.id]?.notes || ''

              return (
                <div key={staff.id} className="p-4 md:p-5 flex flex-col md:grid md:grid-cols-12 gap-4 items-start md:items-center hover:bg-slate-50/30 transition">
                  {/* Name Info */}
                  <div className="md:col-span-4 w-full pl-0 md:pl-2">
                    <h3 className="font-bold text-slate-800 text-base">{staff.name}</h3>
                    <p className="text-slate-500 text-sm">{staff.position}</p>
                    {staff.rfid && <p className="text-xs text-slate-400 mt-0.5 font-mono">ID: {staff.rfid}</p>}
                  </div>

                  {/* Status Buttons */}
                  <div className="md:col-span-4 w-full flex justify-start md:justify-center">
                    <div className="flex bg-slate-100/80 p-1 rounded-xl">
                      <button
                        onClick={() => handleStatusChange(staff.id, 'HADIR')}
                        className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                          currentStatus === 'HADIR' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                        }`}
                      >
                        HADIR
                      </button>
                      <button
                        onClick={() => handleStatusChange(staff.id, 'IZIN')}
                        className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                          currentStatus === 'IZIN' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                        }`}
                      >
                        IZIN
                      </button>
                      <button
                        onClick={() => handleStatusChange(staff.id, 'SAKIT')}
                        className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                          currentStatus === 'SAKIT' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                        }`}
                      >
                        SAKIT
                      </button>
                      <button
                        onClick={() => handleStatusChange(staff.id, 'ALPA')}
                        className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                          currentStatus === 'ALPA' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                        }`}
                      >
                        ALPA
                      </button>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="md:col-span-4 w-full pr-0 md:pr-2">
                    <input 
                      type="text" 
                      placeholder="Tambahkan keterangan..." 
                      value={currentNotes}
                      onChange={(e) => handleNotesChange(staff.id, e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none text-sm"
                    />
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button 
            onClick={handleSave}
            disabled={loading || saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Menyimpan...' : 'Simpan Absensi'}
          </button>
        </div>

      </div>
    </div>
  )
}
