'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Phone, Mail, Edit3, ShieldCheck, CalendarCheck, CalendarX, CalendarClock } from 'lucide-react'
import { GuruForm } from '@/components/portal/guru/GuruForm'

export default function GuruDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [guru, setGuru] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)

  const fetchGuru = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/guru/${id}`)
      const data = await res.json()
      if (data.success) {
        setGuru(data.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGuru()
  }, [id])

  if (loading) return <div className="p-6 text-slate-500">Memuat data guru...</div>
  
  if (!guru) return (
    <div className="p-6 text-center">
      <h2 className="text-xl font-bold text-slate-800">Guru tidak ditemukan</h2>
      <button onClick={() => router.back()} className="mt-4 text-blue-600 hover:underline">Kembali</button>
    </div>
  )

  const attendance = guru.staff_attendance || []
  
  // Calculate stats for current month
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  const thisMonthAttendance = attendance.filter((a: any) => {
    const d = new Date(a.date)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })

  const stats = {
    hadir: thisMonthAttendance.filter((a: any) => a.status === 'HADIR').length,
    izin: thisMonthAttendance.filter((a: any) => a.status === 'IZIN').length,
    sakit: thisMonthAttendance.filter((a: any) => a.status === 'SAKIT').length,
    alpa: thisMonthAttendance.filter((a: any) => a.status === 'ALPA').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/guru"
          className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Detail Guru / Staff</h1>
          <p className="text-slate-500">Profil dan ringkasan kehadiran.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quick Profile */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-4">
            <User size={40} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">{guru.name}</h2>
          <p className="text-slate-500 font-medium mt-1">{guru.position}</p>
          
          <div className="mt-4">
            {guru.is_active ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <ShieldCheck size={16} /> Aktif Mengajar
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                Nonaktif
              </span>
            )}
          </div>

          <div className="w-full h-px bg-slate-100 my-6"></div>

          <div className="w-full space-y-3 text-left">
            <div className="flex items-start gap-3">
              <Phone className="text-slate-400 shrink-0" size={18} />
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">No HP / WhatsApp</p>
                <p className="text-sm font-medium text-slate-700">{guru.phone || '-'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="text-slate-400 shrink-0" size={18} />
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</p>
                <p className="text-sm font-medium text-slate-700">{guru.email || '-'}</p>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setShowEdit(true)}
            className="mt-6 w-full flex items-center justify-center gap-2 bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl hover:bg-slate-100 transition font-medium"
          >
            <Edit3 size={18} /> Edit Profil
          </button>
        </div>

        {/* Right Column: Attendance History */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4 mb-6">
              Ringkasan Kehadiran Bulan Ini ({new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })})
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
                <CalendarCheck className="w-8 h-8 mx-auto text-green-500 mb-2" />
                <p className="text-2xl font-bold text-green-700">{stats.hadir}</p>
                <p className="text-xs font-bold uppercase text-green-600 mt-1">Hadir</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                <CalendarClock className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                <p className="text-2xl font-bold text-blue-700">{stats.izin}</p>
                <p className="text-xs font-bold uppercase text-blue-600 mt-1">Izin</p>
              </div>
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-center">
                <CalendarClock className="w-8 h-8 mx-auto text-orange-500 mb-2" />
                <p className="text-2xl font-bold text-orange-700">{stats.sakit}</p>
                <p className="text-xs font-bold uppercase text-orange-600 mt-1">Sakit</p>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
                <CalendarX className="w-8 h-8 mx-auto text-red-500 mb-2" />
                <p className="text-2xl font-bold text-red-700">{stats.alpa}</p>
                <p className="text-xs font-bold uppercase text-red-600 mt-1">Alpa</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4 mb-4">
              Catatan Kehadiran Terbaru
            </h3>

            {attendance.length === 0 ? (
              <p className="text-center text-slate-500 py-6">Belum ada riwayat kehadiran tercatat.</p>
            ) : (
              <div className="space-y-3">
                {attendance.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10).map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-800">{new Date(a.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      {a.notes && <p className="text-sm text-slate-500 mt-1">Catatan: {a.notes}</p>}
                    </div>
                    <div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold uppercase
                        ${a.status === 'HADIR' ? 'bg-green-100 text-green-700' : 
                          a.status === 'IZIN' ? 'bg-blue-100 text-blue-700' : 
                          a.status === 'SAKIT' ? 'bg-orange-100 text-orange-700' : 
                          'bg-red-100 text-red-700'}`}
                      >
                        {a.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
          </div>

        </div>
      </div>

      {showEdit && (
        <GuruForm 
          initialData={guru}
          onSuccess={fetchGuru}
          onClose={() => setShowEdit(false)}
        />
      )}
    </div>
  )
}
