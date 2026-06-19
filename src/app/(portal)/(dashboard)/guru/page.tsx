'use client'

import React, { useEffect, useState } from 'react'
import { Plus, Search, Trash2, Edit3, Eye, Phone, Mail } from 'lucide-react'
import { GuruForm } from '@/components/portal/guru/GuruForm'
import Link from 'next/link'

export default function GuruPage() {
  const [guruList, setGuruList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingGuru, setEditingGuru] = useState<any | null>(null)

  const fetchGuru = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/guru?search=${encodeURIComponent(search)}`)
      const data = await res.json()
      if (data.success) {
        setGuruList(data.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchGuru()
    }, 500)
    return () => clearTimeout(delay)
  }, [search])

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus data guru ${name}?`)) {
      try {
        const res = await fetch(`/api/guru/${id}`, { method: 'DELETE' })
        if (res.ok) fetchGuru()
      } catch (err) {
        console.error(err)
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Data Guru & Staff</h1>
          <p className="text-slate-500">Kelola informasi guru, staff, dan riwayat absensinya.</p>
        </div>
        <button 
          onClick={() => { setEditingGuru(null); setShowForm(true); }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition shadow-sm font-medium"
        >
          <Plus size={18} />
          Tambah Guru/Staff
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Cari nama atau jabatan..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-sm font-semibold text-slate-500 uppercase tracking-wider">
                <th className="pb-3 pr-4">Nama Lengkap</th>
                <th className="pb-3 pr-4">Jabatan</th>
                <th className="pb-3 pr-4">Kontak</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-500">Memuat data...</td>
                </tr>
              ) : guruList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-500">Tidak ada data guru/staff ditemukan.</td>
                </tr>
              ) : (
                guruList.map((guru) => (
                  <tr key={guru.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition group">
                    <td className="py-3 pr-4">
                      <div className="font-bold text-slate-800">{guru.name}</div>
                    </td>
                    <td className="py-3 pr-4 text-slate-600 font-medium">{guru.position}</td>
                    <td className="py-3 pr-4">
                      {guru.phone && (
                        <div className="flex items-center gap-1.5 text-sm text-slate-600 mb-1">
                          <Phone size={14} className="text-slate-400" /> {guru.phone}
                        </div>
                      )}
                      {guru.email && (
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <Mail size={14} className="text-slate-400" /> {guru.email}
                        </div>
                      )}
                      {!guru.phone && !guru.email && <span className="text-slate-400 text-sm">-</span>}
                    </td>
                    <td className="py-3 pr-4">
                      {guru.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Aktif</span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Nonaktif</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                        <Link 
                          href={`/guru/${guru.id}`}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Detail Guru"
                        >
                          <Eye size={18} />
                        </Link>
                        <button 
                          onClick={() => { setEditingGuru(guru); setShowForm(true); }}
                          className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(guru.id, guru.name)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Hapus"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <GuruForm 
          initialData={editingGuru}
          onSuccess={fetchGuru}
          onClose={() => { setShowForm(false); setEditingGuru(null); }}
        />
      )}
    </div>
  )
}
