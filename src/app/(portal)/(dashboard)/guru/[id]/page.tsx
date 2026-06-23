'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  MapPin, 
  GraduationCap, 
  BookOpen, 
  Edit3,
  CalendarCheck,
  CalendarClock,
  CalendarX,
  CalendarMinus,
  UserCircle,
  IdCard
} from 'lucide-react'
import { GuruForm } from '@/components/portal/guru/GuruForm'

export default function DetailGuruPage() {
  const params = useParams()
  const router = useRouter()
  const [guru, setGuru] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const fetchGuru = async () => {
    try {
      const res = await fetch(`/api/guru/${params.id}`)
      const data = await res.json()
      if (data.success) {
        setGuru(data.data)
      }
    } catch (error) {
      console.error('Error fetching guru detail:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGuru()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!guru) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Data tidak ditemukan</h2>
        <p className="text-slate-500 mb-6">Data guru atau staff ini mungkin telah dihapus.</p>
        <Link href="/guru" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition">
          Kembali ke Data Guru
        </Link>
      </div>
    )
  }

  // Calculate attendance for current month
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  const currentMonthAttendance = (guru.staff_attendance || []).filter((att: any) => {
    const attDate = new Date(att.date)
    return attDate.getMonth() === currentMonth && attDate.getFullYear() === currentYear
  })

  const totalHadir = currentMonthAttendance.filter((a: any) => a.status?.toUpperCase() === 'HADIR').length
  const totalIzin = currentMonthAttendance.filter((a: any) => a.status?.toUpperCase() === 'IZIN').length
  const totalSakit = currentMonthAttendance.filter((a: any) => a.status?.toUpperCase() === 'SAKIT').length
  const totalAlpa = currentMonthAttendance.filter((a: any) => a.status?.toUpperCase() === 'ALPA' || a.status?.toUpperCase() === 'TANPA KETERANGAN').length

  const monthName = new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' })

  // Recent attendance (last 5)
  const recentAttendance = [...(guru.staff_attendance || [])]
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link 
          href="/guru" 
          className="p-2 bg-white rounded-xl shadow-sm text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition border border-slate-200"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Detail Guru / Staff</h1>
          <p className="text-slate-500">Profil dan ringkasan kehadiran.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-8 flex flex-col items-center text-center border-b border-slate-100">
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4 overflow-hidden shadow-inner">
                {guru.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={guru.image} alt={guru.name} className="w-full h-full object-cover" />
                ) : (
                  <UserCircle size={48} />
                )}
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-1">{guru.name}</h2>
              <p className="text-slate-500 font-medium mb-4">{guru.position}</p>
              
              <span className={`px-4 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
                guru.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${guru.is_active ? 'bg-green-600' : 'bg-red-600'}`}></span>
                {guru.is_active ? 'Aktif Mengajar' : 'Non Aktif'}
              </span>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Phone size={18} className="text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">No HP / WhatsApp</p>
                    <p className="text-sm font-medium text-slate-700">{guru.phone || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail size={18} className="text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Email</p>
                    <p className="text-sm font-medium text-slate-700">{guru.email || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Alamat</p>
                    <p className="text-sm font-medium text-slate-700 leading-relaxed">{guru.address || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <IdCard size={18} className="text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">ID / RFID Kartu</p>
                    <p className="text-sm font-mono font-medium text-slate-700">{guru.rfid || 'Belum terdaftar'}</p>
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-100"></div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <GraduationCap size={18} className="text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Pendidikan Terakhir</p>
                    <p className="text-sm font-medium text-slate-700">{guru.education_level || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BookOpen size={18} className="text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Jurusan / Fakultas</p>
                    <p className="text-sm font-medium text-slate-700">{guru.major || '-'}</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setShowForm(true)}
                className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium rounded-xl border border-slate-200 transition"
              >
                <Edit3 size={16} /> Edit Profil
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Attendance */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Summary Cards */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 mb-6">Ringkasan Kehadiran Bulan Ini ({monthName})</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-emerald-50 rounded-2xl p-4 flex flex-col items-center justify-center text-center border border-emerald-100/50">
                <CalendarCheck className="text-emerald-500 mb-2" size={24} />
                <span className="text-2xl font-black text-emerald-600 leading-none mb-1">{totalHadir}</span>
                <span className="text-[10px] font-bold text-emerald-700/70 uppercase tracking-wider">Hadir</span>
              </div>
              <div className="bg-blue-50 rounded-2xl p-4 flex flex-col items-center justify-center text-center border border-blue-100/50">
                <CalendarClock className="text-blue-500 mb-2" size={24} />
                <span className="text-2xl font-black text-blue-600 leading-none mb-1">{totalIzin}</span>
                <span className="text-[10px] font-bold text-blue-700/70 uppercase tracking-wider">Izin</span>
              </div>
              <div className="bg-orange-50 rounded-2xl p-4 flex flex-col items-center justify-center text-center border border-orange-100/50">
                <CalendarMinus className="text-orange-500 mb-2" size={24} />
                <span className="text-2xl font-black text-orange-600 leading-none mb-1">{totalSakit}</span>
                <span className="text-[10px] font-bold text-orange-700/70 uppercase tracking-wider">Sakit</span>
              </div>
              <div className="bg-red-50 rounded-2xl p-4 flex flex-col items-center justify-center text-center border border-red-100/50">
                <CalendarX className="text-red-500 mb-2" size={24} />
                <span className="text-2xl font-black text-red-600 leading-none mb-1">{totalAlpa}</span>
                <span className="text-[10px] font-bold text-red-700/70 uppercase tracking-wider">Alpa</span>
              </div>
            </div>
          </div>

          {/* Recent Attendance List */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Catatan Kehadiran Terbaru</h3>
            </div>
            
            <div className="p-0">
              {recentAttendance.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm font-medium">
                  Belum ada riwayat kehadiran tercatat.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentAttendance.map((att: any) => (
                    <div key={att.id} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition">
                      <div>
                        <p className="font-medium text-slate-800 text-sm">
                          {new Date(att.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        {att.notes && <p className="text-xs text-slate-500 mt-1">{att.notes}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        {(att.check_in_time || att.check_out_time) && (
                          <div className="text-xs text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200">
                            {att.check_in_time && <span>In: {new Date(att.check_in_time).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</span>}
                            {att.check_out_time && <span className="ml-2">Out: {new Date(att.check_out_time).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}</span>}
                          </div>
                        )}
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          att.status?.toUpperCase() === 'HADIR' ? 'bg-emerald-100 text-emerald-700' :
                          att.status?.toUpperCase() === 'IZIN' ? 'bg-blue-100 text-blue-700' :
                          att.status?.toUpperCase() === 'SAKIT' ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {att.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {showForm && (
        <GuruForm 
          initialData={guru} 
          onSuccess={fetchGuru} 
          onClose={() => setShowForm(false)} 
        />
      )}
    </div>
  )
}
