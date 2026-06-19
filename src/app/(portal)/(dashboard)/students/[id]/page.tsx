'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Phone, Mail, MapPin, Edit3, ShieldCheck, Wallet, PiggyBank, Calendar, Clock } from 'lucide-react'
import { StudentForm } from '@/components/portal/students/StudentForm'

export default function StudentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [activeTab, setActiveTab] = useState<'profil' | 'spp' | 'tabungan'>('profil')

  const fetchStudent = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/students/${id}`)
      const data = await res.json()
      if (data.success) {
        setStudent(data.data)
      } else {
        // Handle not found
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudent()
  }, [id])

  if (loading) {
    return <div className="p-6 text-slate-500">Memuat data siswa...</div>
  }

  if (!student) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold text-slate-800">Siswa tidak ditemukan</h2>
        <button onClick={() => router.back()} className="mt-4 text-blue-600 hover:underline">Kembali</button>
      </div>
    )
  }

  const account = student.student_accounts?.[0]
  const sppPayments = student.spp_payments || []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/students"
          className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Detail Siswa</h1>
          <p className="text-slate-500">Profil, riwayat SPP, dan tabungan.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quick Profile */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
            <User size={40} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">{student.name}</h2>
          <p className="text-slate-500 font-medium mt-1">{student.student_number} • {student.class}</p>
          
          <div className="mt-4">
            {student.is_active ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <ShieldCheck size={16} /> Aktif Belajar
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
              <User className="text-slate-400 shrink-0" size={18} />
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Orang Tua/Wali</p>
                <p className="text-sm font-medium text-slate-700">{student.parent_name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="text-slate-400 shrink-0" size={18} />
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">No HP</p>
                <p className="text-sm font-medium text-slate-700">{student.parent_phone}</p>
              </div>
            </div>
            {student.parent_email && (
              <div className="flex items-start gap-3">
                <Mail className="text-slate-400 shrink-0" size={18} />
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</p>
                  <p className="text-sm font-medium text-slate-700">{student.parent_email}</p>
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => setShowEdit(true)}
            className="mt-6 w-full flex items-center justify-center gap-2 bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl hover:bg-slate-100 transition font-medium"
          >
            <Edit3 size={18} /> Edit Profil
          </button>
        </div>

        {/* Right Column: Tabs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-2 flex gap-2 overflow-x-auto">
            <button 
              onClick={() => setActiveTab('profil')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${activeTab === 'profil' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <User size={18} /> Info Lengkap
            </button>
            <button 
              onClick={() => setActiveTab('spp')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${activeTab === 'spp' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Wallet size={18} /> Riwayat SPP
            </button>
            <button 
              onClick={() => setActiveTab('tabungan')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${activeTab === 'tabungan' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <PiggyBank size={18} /> Tabungan
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 min-h-[400px]">
            {activeTab === 'profil' && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4">Informasi Tambahan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Didaftarkan Pada</p>
                    <p className="text-slate-800">{new Date(student.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Terakhir Diupdate</p>
                    <p className="text-slate-800">{new Date(student.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-slate-500 mb-1">Catatan Khusus</p>
                    <p className="text-slate-800">{student.description || 'Tidak ada catatan.'}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'spp' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-bold text-slate-800">Riwayat Pembayaran SPP</h3>
                  <Link href={`/finance/spp?student=${student.id}`} className="text-sm font-medium text-blue-600 hover:underline">Kelola SPP</Link>
                </div>
                
                {sppPayments.length === 0 ? (
                  <div className="text-center py-10 text-slate-500">
                    <Wallet className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p>Belum ada tagihan/pembayaran SPP tercatat.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sppPayments.map((spp: any) => (
                      <div key={spp.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${spp.status === 'PAID' ? 'bg-green-100 text-green-600' : spp.status === 'LATE' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                            <Calendar size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">SPP Bulan {spp.month} {spp.year}</p>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">Jatuh Tempo: {new Date(spp.due_date).toLocaleDateString('id-ID')}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-800">Rp {spp.amount.toLocaleString('id-ID')}</p>
                          <p className={`text-xs font-bold mt-0.5 uppercase ${spp.status === 'PAID' ? 'text-green-600' : spp.status === 'LATE' ? 'text-red-600' : 'text-orange-600'}`}>{spp.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'tabungan' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-bold text-slate-800">Informasi Tabungan</h3>
                  <Link href={`/finance/savings?student=${student.id}`} className="text-sm font-medium text-blue-600 hover:underline">Kelola Tabungan</Link>
                </div>
                
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg">
                  <p className="text-blue-100 text-sm font-medium mb-1">Total Saldo Tabungan</p>
                  <h2 className="text-4xl font-bold">
                    Rp {account ? account.balance.toLocaleString('id-ID') : '0'}
                  </h2>
                  <div className="mt-4 text-sm font-medium text-blue-200 flex items-center gap-2">
                    <Clock size={16} /> Diperbarui {account ? new Date(account.updated_at).toLocaleDateString('id-ID') : '-'}
                  </div>
                </div>

                <div className="pt-4 text-center text-slate-500 text-sm">
                  Untuk melihat rincian transaksi (Setor/Tarik), silakan masuk ke menu Kelola Tabungan.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showEdit && (
        <StudentForm 
          initialData={student}
          onSuccess={fetchStudent}
          onClose={() => setShowEdit(false)}
        />
      )}
    </div>
  )
}
