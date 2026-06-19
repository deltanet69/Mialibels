'use client'

import React, { useEffect, useState } from 'react'
import { Plus, UploadCloud, Search, Trash2, Edit3, MoreVertical, Eye } from 'lucide-react'
import { CsvImport } from '@/components/portal/students/CsvImport'
import { StudentForm } from '@/components/portal/students/StudentForm'
import Link from 'next/link'

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState<any | null>(null)

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/students?search=${encodeURIComponent(search)}`)
      const data = await res.json()
      if (data.success) {
        setStudents(data.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // debounce search
    const delay = setTimeout(() => {
      fetchStudents()
    }, 500)
    return () => clearTimeout(delay)
  }, [search])

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus data siswa ${name}? Data SPP dan Tabungan terkait juga akan terhapus!`)) {
      try {
        const res = await fetch(`/api/students/${id}`, { method: 'DELETE' })
        if (res.ok) fetchStudents()
      } catch (err) {
        console.error(err)
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Data Siswa</h1>
          <p className="text-slate-500">Kelola data siswa, absensi, dan profil.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setShowImport(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition font-medium"
          >
            <UploadCloud size={18} />
            Import CSV
          </button>
          <button 
            onClick={() => { setEditingStudent(null); setShowForm(true); }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition shadow-sm font-medium"
          >
            <Plus size={18} />
            Tambah Siswa
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Cari nama atau NIS..." 
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
                <th className="pb-3 pr-4">NIS</th>
                <th className="pb-3 pr-4">Nama Lengkap</th>
                <th className="pb-3 pr-4">Kelas</th>
                <th className="pb-3 pr-4">Orang Tua</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500">Memuat data...</td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500">Tidak ada data siswa ditemukan.</td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition group">
                    <td className="py-3 pr-4 font-medium text-slate-700">{student.student_number}</td>
                    <td className="py-3 pr-4">
                      <div className="font-medium text-slate-800">{student.name}</div>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{student.class}</td>
                    <td className="py-3 pr-4">
                      <div className="text-sm text-slate-800">{student.parent_name}</div>
                      <div className="text-xs text-slate-500">{student.parent_phone}</div>
                    </td>
                    <td className="py-3 pr-4">
                      {student.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Aktif</span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Nonaktif</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                        <Link 
                          href={`/students/${student.id}`}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Detail Siswa"
                        >
                          <Eye size={18} />
                        </Link>
                        <button 
                          onClick={() => { setEditingStudent(student); setShowForm(true); }}
                          className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(student.id, student.name)}
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

      {showImport && (
        <CsvImport 
          onSuccess={fetchStudents} 
          onClose={() => setShowImport(false)} 
        />
      )}

      {showForm && (
        <StudentForm 
          initialData={editingStudent}
          onSuccess={fetchStudents}
          onClose={() => { setShowForm(false); setEditingStudent(null); }}
        />
      )}
    </div>
  )
}
