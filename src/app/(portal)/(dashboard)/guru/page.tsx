'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { Plus, Search, Trash2, Edit3, Eye, Phone, Mail, UploadCloud } from 'lucide-react'
import { GuruForm } from '@/components/portal/guru/GuruForm'
import { CsvImportGuru } from '@/components/portal/guru/CsvImportGuru'
import Link from 'next/link'

// Skeleton row component
function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-slate-50">
      <td className="py-3 pr-4">
        <div className="h-4 bg-slate-100 rounded w-32 mb-1" />
      </td>
      <td className="py-3 pr-4"><div className="h-4 bg-slate-100 rounded w-28" /></td>
      <td className="py-3 pr-4">
        <div className="h-3 bg-slate-100 rounded w-24 mb-1.5" />
        <div className="h-3 bg-slate-100 rounded w-36" />
      </td>
      <td className="py-3 pr-4"><div className="h-4 bg-slate-100 rounded w-24" /></td>
      <td className="py-3 pr-4"><div className="h-5 bg-slate-100 rounded-full w-14" /></td>
      <td className="py-3 pr-4 text-right"><div className="h-7 bg-slate-100 rounded w-20 ml-auto" /></td>
    </tr>
  )
}

export default function GuruPage() {
  // Raw data fetched once from server
  const [allGuru, setAllGuru] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Client-side search and filters
  const [search, setSearch] = useState('')
  const [positionFilter, setPositionFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editingGuru, setEditingGuru] = useState<any | null>(null)

  // Fetch ALL guru once on mount — no search param
  const fetchGuru = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/guru')
      const data = await res.json()
      if (data.success) {
        setAllGuru(data.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGuru()
  }, [fetchGuru])

  // Unique positions for filter
  const positions = useMemo(() => {
    const unique = Array.from(new Set(allGuru.map(g => g.position).filter(Boolean)))
    return unique.sort()
  }, [allGuru])

  // Instant client-side filtering — no API call
  const filteredGuru = useMemo(() => {
    let filtered = allGuru

    if (positionFilter !== 'all') {
      filtered = filtered.filter(g => g.position === positionFilter)
    }

    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active'
      filtered = filtered.filter(g => g.is_active === isActive)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      filtered = filtered.filter(g =>
        g.name?.toLowerCase().includes(q) ||
        g.position?.toLowerCase().includes(q) ||
        g.email?.toLowerCase().includes(q) ||
        g.phone?.toLowerCase().includes(q)
      )
    }
    return filtered
  }, [allGuru, search, positionFilter, statusFilter])

  // Reset page when filter/search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [search, positionFilter, statusFilter, itemsPerPage])

  // Pagination logic
  const totalPages = Math.ceil(filteredGuru.length / itemsPerPage)
  const paginatedGuru = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredGuru.slice(start, start + itemsPerPage)
  }, [filteredGuru, currentPage, itemsPerPage])

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus data guru ${name}?`)) {
      try {
        const res = await fetch(`/api/guru/${id}`, { method: 'DELETE' })
        if (res.ok) {
          // Optimistic update — no re-fetch
          setAllGuru(prev => prev.filter(g => g.id !== id))
        }
      } catch (err) {
        console.error(err)
      }
    }
  }

  const hasActiveFilters = search || positionFilter !== 'all' || statusFilter !== 'all'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Data Guru &amp; Staff</h1>
          <p className="text-slate-500">Kelola informasi guru, staff, dan riwayat absensinya.</p>
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
            onClick={() => { setEditingGuru(null); setShowForm(true); }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition shadow-sm font-medium"
          >
            <Plus size={18} />
            Tambah Guru/Staff
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full flex-1">
            {/* Search */}
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Cari nama, jabatan, atau email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none"
              />
            </div>

            {/* Position filter */}
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none text-slate-700"
            >
              <option value="all">Semua Jabatan</option>
              {positions.map((p: any) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none text-slate-700"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>

            {!loading && (
              <span className="text-sm text-slate-400 whitespace-nowrap shrink-0 ml-auto sm:ml-0">
                {filteredGuru.length} guru/staff
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-sm font-semibold text-slate-500 uppercase tracking-wider">
                <th className="pb-3 pr-4">Nama Lengkap</th>
                <th className="pb-3 pr-4">Jabatan</th>
                <th className="pb-3 pr-4">Kontak</th>
                <th className="pb-3 pr-4">Tugas Kelas</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              ) : paginatedGuru.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500">
                    {hasActiveFilters
                      ? 'Tidak ada guru yang sesuai pencarian.'
                      : 'Tidak ada data guru/staff.'}
                  </td>
                </tr>
              ) : (
                paginatedGuru.map((guru) => (
                  <tr key={guru.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition group">
                    <td className="py-3 pr-4">
                      <Link href={`/guru/${guru.id}`} className="font-bold text-slate-800 hover:text-blue-600 transition block">
                        {guru.name}
                      </Link>
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
                      {guru.homeroom_classrooms?.length > 0 && (
                        <div className="mb-1.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 border border-indigo-100 text-indigo-700" title="Wali Kelas">
                            Wali Kelas: {guru.homeroom_classrooms.map((c: any) => c.name).join(', ')}
                          </span>
                        </div>
                      )}
                      {guru.teaching_classes?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs text-slate-500 mr-1 flex items-center">Mengajar:</span>
                          {guru.teaching_classes.map((cls: string, idx: number) => (
                            <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                              {cls}
                            </span>
                          ))}
                        </div>
                      )}
                      {!guru.homeroom_classrooms?.length && !guru.teaching_classes?.length && (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
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

        {/* Pagination Controls */}
        {!loading && filteredGuru.length > 0 && (
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
              guru/staff per halaman
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
        <CsvImportGuru
          onSuccess={fetchGuru}
          onClose={() => setShowImport(false)}
        />
      )}

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
