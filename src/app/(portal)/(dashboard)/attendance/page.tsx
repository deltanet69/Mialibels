'use client'

import React, { useEffect, useState } from 'react'
import { Calendar as CalendarIcon, Save, AlertCircle } from 'lucide-react'

export default function AttendancePage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [staffs, setStaffs] = useState<any[]>([])
  const [attendance, setAttendance] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })

  const fetchData = async (selectedDate: string) => {
    setLoading(true)
    setMessage({ text: '', type: '' })
    try {
      // 1. Fetch all active staffs
      const staffRes = await fetch(`/api/guru`)
      const staffData = await staffRes.json()
      
      // 2. Fetch attendance for the selected date
      const attRes = await fetch(`/api/attendance?date=${selectedDate}`)
      const attData = await attRes.json()

      if (staffData.success) {
        const activeStaffs = staffData.data.filter((s: any) => s.is_active)
        setStaffs(activeStaffs)

        // Map existing attendance to state
        const attMap: Record<string, any> = {}
        if (attData.success && attData.data) {
          attData.data.forEach((record: any) => {
            attMap[record.staff_id] = {
              status: record.status,
              notes: record.notes || ''
            }
          })
        }

        // Initialize state for staffs without record yet
        activeStaffs.forEach((staff: any) => {
          if (!attMap[staff.id]) {
            attMap[staff.id] = {
              status: 'HADIR', // default
              notes: ''
            }
          }
        })
        
        setAttendance(attMap)
      }
    } catch (err) {
      console.error(err)
      setMessage({ text: 'Gagal memuat data.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(date)
  }, [date])

  const handleStatusChange = (staffId: string, status: string) => {
    setAttendance(prev => ({
      ...prev,
      [staffId]: { ...prev[staffId], status }
    }))
  }

  const handleNotesChange = (staffId: string, notes: string) => {
    setAttendance(prev => ({
      ...prev,
      [staffId]: { ...prev[staffId], notes }
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage({ text: '', type: '' })
    try {
      const records = staffs.map(staff => ({
        staff_id: staff.id,
        status: attendance[staff.id].status,
        notes: attendance[staff.id].notes
      }))

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, records })
      })

      const data = await res.json()
      if (res.ok) {
        setMessage({ text: 'Data absensi berhasil disimpan!', type: 'success' })
      } else {
        throw new Error(data.error)
      }
    } catch (err: any) {
      console.error(err)
      setMessage({ text: err.message || 'Gagal menyimpan absensi.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Absensi Guru / Staff</h1>
          <p className="text-slate-500">Pencatatan kehadiran harian.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm">
          <div className="pl-3 text-slate-500">
            <CalendarIcon size={20} />
          </div>
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-1.5 outline-none bg-transparent font-medium text-slate-700"
          />
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          <AlertCircle size={20} />
          <p className="font-medium text-sm">{message.text}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-slate-500">Memuat data guru...</div>
        ) : staffs.length === 0 ? (
          <div className="p-10 text-center text-slate-500">Belum ada data guru aktif. Silakan tambah data di menu Data Guru.</div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-sm font-semibold text-slate-600">
                    <th className="p-4">Nama Guru/Staff</th>
                    <th className="p-4 w-64 text-center">Status Kehadiran</th>
                    <th className="p-4">Catatan (Opsional)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staffs.map(staff => (
                    <tr key={staff.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4">
                        <p className="font-bold text-slate-800">{staff.name}</p>
                        <p className="text-sm text-slate-500">{staff.position}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center bg-slate-100 rounded-xl p-1 gap-1">
                          {['HADIR', 'IZIN', 'SAKIT', 'ALPA'].map((status) => (
                            <button
                              key={status}
                              onClick={() => handleStatusChange(staff.id, status)}
                              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition ${
                                attendance[staff.id]?.status === status
                                  ? status === 'HADIR' ? 'bg-green-500 text-white shadow-sm'
                                    : status === 'IZIN' ? 'bg-blue-500 text-white shadow-sm'
                                    : status === 'SAKIT' ? 'bg-orange-500 text-white shadow-sm'
                                    : 'bg-red-500 text-white shadow-sm'
                                  : 'text-slate-500 hover:bg-slate-200'
                              }`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">
                        <input 
                          type="text" 
                          value={attendance[staff.id]?.notes || ''}
                          onChange={(e) => handleNotesChange(staff.id, e.target.value)}
                          placeholder="Tambahkan keterangan..."
                          className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
              >
                <Save size={18} />
                {saving ? 'Menyimpan...' : 'Simpan Absensi'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
