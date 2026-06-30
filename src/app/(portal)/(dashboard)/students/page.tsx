'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { Plus, UploadCloud, Search, Trash2, Edit3, Eye } from 'lucide-react'
import { CsvImport } from '@/components/portal/students/CsvImport'
import { StudentForm } from '@/components/portal/students/StudentForm'
import Link from 'next/link'

// Skeleton row component
function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-slate-50">
      <td className="py-3 pr-4"><div className="h-4 bg-slate-100 rounded w-20" /></td>
      <td className="py-3 pr-4"><div className="h-4 bg-slate-100 rounded w-36" /></td>
      <td className="py-3 pr-4"><div className="h-4 bg-slate-100 rounded w-12" /></td>
      <td className="py-3 pr-4">
        <div className="h-4 bg-slate-100 rounded w-28 mb-1" />
        <div className="h-3 bg-slate-100 rounded w-20" />
      </td>
      <td className="py-3 pr-4"><div className="h-5 bg-slate-100 rounded-full w-14" /></td>
      <td className="py-3 pr-4 text-right"><div className="h-7 bg-slate-100 rounded w-20 ml-auto" /></td>
    </tr>
  )
}

export default function StudentsPage() {
  // Raw data fetched once from server
  const [allStudents, setAllStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Client-side search and filters
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('all')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const [showImport, setShowImport] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState<any | null>(null)

  // Fetch ALL students once on mount — no search param needed
  const fetchStudents = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/students')
      const data = await res.json()
      if (data.success) {
        setAllStudents(data.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  // Unique classes for filter
  const classes = useMemo(() => {
    const uniqueClasses = Array.from(new Set(allStudents.map(s => s.class).filter(Boolean)))
    return uniqueClasses.sort()
  }, [allStudents])

  // Instant client-side filtering — no API call
  const filteredStudents = useMemo(() => {
    let filtered = allStudents

    if (classFilter !== 'all') {
      filtered = filtered.filter(s => s.class === classFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      filtered = filtered.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.student_number?.toLowerCase().includes(q) ||
        s.class?.toLowerCase().includes(q) ||
        s.nisn?.toLowerCase().includes(q)
      )
    }
    return filtered
  }, [allStudents, search, classFilter])

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [search, classFilter, itemsPerPage])

  // Pagination logic
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage)
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredStudents.slice(start, start + itemsPerPage)
  }, [filteredStudents, currentPage, itemsPerPage])

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus data siswa ${name}? Data SPP dan Tabungan terkait juga akan terhapus!`)) {
      try {
        const res = await fetch(`/api/students/${id}`, { method: 'DELETE' })
        if (res.ok) {
          // Optimistic update — remove locally without re-fetch
          setAllStudents(prev => prev.filter(s => s.id !== id))
        }
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
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-1">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="Cari nama, NIS, atau kelas..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none"
              />
            </div>
            
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none text-slate-700"
            >
              <option value="all">Semua Kelas</option>
              {classes.map((c: any) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {!loading && (
              <span className="text-sm text-slate-400 whitespace-nowrap shrink-0 ml-auto sm:ml-0">
                {filteredStudents.length} siswa
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-sm font-semibold text-slate-500 uppercase tracking-wider">
                <th className="pb-3 pr-4">NIS / NISN</th>
                <th className="pb-3 pr-4">Nama Lengkap</th>
                <th className="pb-3 pr-4">Kelas</th>
                <th className="pb-3 pr-4">Orang Tua</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              ) : paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500">
                    {search || classFilter !== 'all' ? `Tidak ada siswa yang sesuai pencarian.` : 'Tidak ada data siswa.'}
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student) => (
                  <tr key={student.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition group">
                    <td className="py-3 pr-4">
                      <div className="font-medium text-slate-700">{student.student_number}</div>
                      {student.nisn && <div className="text-xs text-slate-500">{student.nisn}</div>}
                    </td>
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

        {/* Pagination Controls */}
        {!loading && filteredStudents.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4 border-t border-slate-100 pt-6">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              Tampilkan
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-slate-700 font-medium"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              siswa per halaman
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Sebelumnya
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const page = i + 1;
                  // Show max 5 pages, with current page in middle if possible
                  if (
                    totalPages <= 5 || 
                    page === 1 || 
                    page === totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 flex items-center justify-center text-sm font-medium rounded-lg transition ${
                          currentPage === page 
                            ? 'bg-blue-600 text-white shadow-sm' 
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  }
                  
                  if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="text-slate-400">...</span>
                  }
                  
                  return null;
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
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
