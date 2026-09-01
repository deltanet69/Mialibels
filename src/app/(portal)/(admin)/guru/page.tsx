'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { Plus, Search, Trash2, Edit3, Eye, Phone, Mail, UploadCloud, GraduationCap, X } from 'lucide-react'
import { GuruForm } from '@/components/portal/guru/GuruForm'
import { CsvImportGuru } from '@/components/portal/guru/CsvImportGuru'
import Link from 'next/link'

// Skeleton row component
function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-slate-100">
      <td className="py-4 pr-4 pl-5">
        <div className="h-4.5 bg-slate-100 rounded w-36 mb-1" />
      </td>
      <td className="py-4 pr-4"><div className="h-4.5 bg-slate-100 rounded w-28" /></td>
      <td className="py-4 pr-4">
        <div className="h-3.5 bg-slate-100 rounded w-24 mb-1.5" />
        <div className="h-3.5 bg-slate-100 rounded w-36" />
      </td>
      <td className="py-4 pr-4"><div className="h-4.5 bg-slate-100 rounded w-24" /></td>
      <td className="py-4 pr-4"><div className="h-6 bg-slate-100 rounded-full w-16" /></td>
      <td className="py-4 pr-5 text-right"><div className="h-8 bg-slate-100 rounded-2xl w-20 ml-auto" /></td>
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
  const [currentUser, setCurrentUser] = useState<any>(null)

  const fetchGuru = useCallback(async () => {
    setLoading(true)
    try {
      const [resGuru, resMe] = await Promise.all([
        fetch('/api/guru?_t=' + Date.now()),
        fetch('/api/auth/me')
      ])
      const data = await resGuru.json()
      const dataMe = await resMe.json()
      
      if (data.success) {
        setAllGuru(data.data)
      }
      if (dataMe.success) {
        setCurrentUser(dataMe.user)
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

  const canEdit = currentUser?.role === 'superadmin' || currentUser?.role === 'staff_operator'
  const canViewDetail = ['superadmin', 'staff_operator', 'staff', 'kepsek'].includes(currentUser?.role)

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
    
    const positionSortWeight: Record<string, number> = {
      'kepala sekolah': 1,
      'wakil kepala sekolah': 2,
      'bendahara': 3,
      'kurikulum': 4,
      'guru kelas': 5,
      'guru pengajar': 6,
      'guru': 6,
      'staff administrasi': 7,
      'staff sekolah': 8
    }
    
    filtered.sort((a, b) => {
      const posA = (a.position || '').toLowerCase()
      const posB = (b.position || '').toLowerCase()
      const weightA = positionSortWeight[posA] || 99
      const weightB = positionSortWeight[posB] || 99
      if (weightA !== weightB) {
        return weightA - weightB
      }
      return (a.name || '').localeCompare(b.name || '')
    })

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
          setAllGuru(prev => prev.filter(g => g.id !== id))
        }
      } catch (err) {
        console.error(err)
      }
    }
  }

  const hasActiveFilters = search || positionFilter !== 'all' || statusFilter !== 'all'

  return (
    <div className="font-sans space-y-6 sm:space-y-7 w-full pb-16">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2.5">
            <GraduationCap size={13} />
            <span>Pendidik &amp; Tenaga Kependidikan</span>
          </div>
          <h1 className="font-sans font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Data Guru &amp; Staff
          </h1>
          <p className="font-sans text-xs sm:text-sm text-slate-500 mt-1">
            Kelola data dewan guru, staff kependidikan, jabatan, dan penugasan kelas.
          </p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
            <button
              onClick={() => setShowImport(true)}
              className="btn-tactile flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-2xl hover:bg-slate-100 hover:text-slate-900 transition text-xs font-bold shadow-2xs cursor-pointer"
            >
              <UploadCloud size={15} />
              <span>Import CSV</span>
            </button>
            <button
              onClick={() => { setEditingGuru(null); setShowForm(true); }}
              className="btn-tactile flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl transition text-xs font-bold shadow-md shadow-blue-600/20 cursor-pointer"
            >
              <Plus size={16} className="stroke-[2.5]" />
              <span>Tambah Guru/Staff</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Table Card */}
      <div className="bg-white p-5 sm:p-7 rounded-3xl shadow-sm border border-slate-200/80 space-y-6">
        
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full flex-1">
            
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Cari nama, jabatan, atau email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition text-xs sm:text-sm font-medium text-slate-800 outline-none"
              />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Position filter */}
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition text-xs sm:text-sm font-semibold text-slate-700 outline-none cursor-pointer"
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
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition text-xs sm:text-sm font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>

            {!loading && (
              <span className="text-xs font-bold text-blue-800 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 whitespace-nowrap shrink-0 ml-auto sm:ml-0">
                {filteredGuru.length} Guru / Staff
              </span>
            )}
          </div>
        </div>

        {/* Desktop Table Layout */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[720px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-4 pr-4 pl-5">Nama Lengkap</th>
                <th className="py-4 pr-4">Jabatan</th>
                <th className="py-4 pr-4">Kontak</th>
                <th className="py-4 pr-4">Penugasan Kelas</th>
                <th className="py-4 pr-4">Status</th>
                <th className="py-4 pr-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              ) : paginatedGuru.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 text-xs sm:text-sm">
                    {hasActiveFilters
                      ? 'Tidak ada guru yang sesuai pencarian.'
                      : 'Tidak ada data guru/staff.'}
                  </td>
                </tr>
              ) : (
                paginatedGuru.map((guru) => (
                  <tr key={guru.id} className="hover:bg-blue-50/30 transition-colors group">
                    
                    {/* Name */}
                    <td className="py-4 pr-4 pl-5">
                      <Link 
                        href={`/guru/${guru.id}`} 
                        className="font-sans font-bold text-[14px] sm:text-[15px] text-slate-900 hover:text-blue-600 transition-colors leading-snug block"
                      >
                        {guru.name}
                      </Link>
                    </td>

                    {/* Position */}
                    <td className="py-4 pr-4 font-sans text-xs sm:text-sm text-slate-700 font-semibold">
                      {guru.position}
                    </td>

                    {/* Contact */}
                    <td className="py-4 pr-4 font-sans">
                      {guru.phone && (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 mb-0.5">
                          <Phone size={13} className="text-slate-400" />
                          <span>{guru.phone}</span>
                        </div>
                      )}
                      {guru.email && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <Mail size={13} className="text-slate-400" />
                          <span className="truncate max-w-[170px]">{guru.email}</span>
                        </div>
                      )}
                      {!guru.phone && !guru.email && <span className="text-slate-400 text-xs">—</span>}
                    </td>

                    {/* Class assignments */}
                    <td className="py-4 pr-4 font-sans">
                      {guru.homeroom_classrooms?.length > 0 && (
                        <div className="mb-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-indigo-50 border border-indigo-100 text-indigo-700">
                            Wali Kelas: {guru.homeroom_classrooms.map((c: any) => c.name).join(', ')}
                          </span>
                        </div>
                      )}
                      {guru.teaching_classes?.length > 0 && (
                        <div className="flex flex-wrap gap-1 items-center">
                          <span className="text-xs text-slate-500 font-medium mr-0.5">Ajar:</span>
                          {guru.teaching_classes.map((cls: string, idx: number) => (
                            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              {cls}
                            </span>
                          ))}
                        </div>
                      )}
                      {!guru.homeroom_classrooms?.length && !guru.teaching_classes?.length && (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-4 pr-4 font-sans">
                      {guru.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>Aktif</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          <span>Nonaktif</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 pr-5 text-right font-sans">
                      <div className="flex items-center justify-end gap-1.5">
                        {canViewDetail && (
                          <Link
                            href={`/guru/${guru.id}`}
                            className="p-2 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition"
                            title="Detail Profil Guru"
                          >
                            <Eye size={16} />
                          </Link>
                        )}
                        {canEdit && (
                          <>
                            <button
                              onClick={() => { setEditingGuru(guru); setShowForm(true); }}
                              className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition cursor-pointer"
                              title="Edit Guru"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(guru.id, guru.name)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                              title="Hapus Guru"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Layout */}
        <div className="block sm:hidden space-y-3.5 font-sans">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white border border-slate-100 p-4.5 rounded-2xl shadow-sm animate-pulse space-y-2">
                <div className="h-4.5 bg-slate-100 rounded w-32" />
                <div className="h-3.5 bg-slate-100 rounded w-24" />
              </div>
            ))
          ) : paginatedGuru.length === 0 ? (
            <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
              {hasActiveFilters
                ? 'Tidak ada guru yang sesuai pencarian.'
                : 'Tidak ada data guru/staff.'}
            </div>
          ) : (
            paginatedGuru.map((guru) => (
              <div key={guru.id} className="bg-white border border-slate-200/80 p-4.5 rounded-2xl shadow-2xs flex flex-col gap-3 relative">
                <div className="flex justify-between items-start">
                  <div>
                    {canViewDetail ? (
                      <Link href={`/guru/${guru.id}`} className="font-sans font-bold text-slate-900 text-base hover:text-blue-600 transition block mb-0.5">
                        {guru.name}
                      </Link>
                    ) : (
                      <span className="font-sans font-bold text-slate-900 text-base block mb-0.5">
                        {guru.name}
                      </span>
                    )}
                    <p className="text-xs sm:text-sm font-semibold text-blue-700">{guru.position}</p>
                  </div>
                  {guru.is_active ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Aktif</span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">Nonaktif</span>
                  )}
                </div>
                
                <div className="grid grid-cols-1 gap-1.5 text-xs text-slate-600">
                  {guru.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-slate-400 shrink-0" />
                      <span>{guru.phone}</span>
                    </div>
                  )}
                  {guru.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{guru.email}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 text-xs">
                  {guru.homeroom_classrooms?.length > 0 && (
                    <div className="mb-1.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-indigo-50 border border-indigo-100 text-indigo-700">
                        Wali Kelas: {guru.homeroom_classrooms.map((c: any) => c.name).join(', ')}
                      </span>
                    </div>
                  )}
                  {guru.teaching_classes?.length > 0 && (
                    <div className="flex flex-wrap gap-1 items-center">
                      <span className="text-xs text-slate-500 mr-1 font-medium">Mengajar:</span>
                      {guru.teaching_classes.map((cls: string, idx: number) => (
                        <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {cls}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  {canViewDetail && (
                    <Link
                      href={`/guru/${guru.id}`}
                      className="flex-1 flex justify-center items-center gap-1.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition"
                    >
                      <Eye size={14} /> Detail
                    </Link>
                  )}
                  {canEdit && (
                    <>
                      <button
                        onClick={() => { setEditingGuru(guru); setShowForm(true); }}
                        className="flex-1 flex justify-center items-center gap-1.5 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition cursor-pointer"
                      >
                        <Edit3 size={14} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(guru.id, guru.name)}
                        className="flex items-center justify-center p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition cursor-pointer"
                        title="Hapus"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {!loading && filteredGuru.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4 border-t border-slate-100 pt-6 font-sans">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span>Tampilkan</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-700 font-bold cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>guru/staff per halaman</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200/90 rounded-xl hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
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
                        className={`w-8 h-8 flex items-center justify-center text-xs font-bold rounded-xl transition cursor-pointer ${
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
                    return <span key={page} className="text-slate-400 text-xs">...</span>
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200/90 rounded-xl hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
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
