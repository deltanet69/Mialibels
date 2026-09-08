'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import {
  Plus, Search, Trash2, Edit3, Eye, Megaphone, Star, Sparkles,
  Layers, LayoutGrid, List, Clock, Calendar, Globe, Home,
  AlertTriangle, X, ExternalLink, Check, Loader2, ArrowUpDown,
  CheckCircle2, AlertCircle, ArrowUpRight, ToggleLeft, ToggleRight
} from 'lucide-react'
import Link from 'next/link'
import { BannerForm } from '@/components/portal/banners/BannerForm'

const PAGE_NAMES: Record<string, string> = {
  '/': 'Beranda',
  '/news': 'Berita',
  '/spmb': 'SPMB',
  '/ppdb': 'SPMB',
  '/about': 'Profil',
  '/akademik': 'Akademik',
  '/contact': 'Kontak',
}

const getTargetBadge = (target: string | null) => {
  if (!target || target === 'all') {
    return { label: 'Semua Halaman', icon: Globe, badge: 'bg-blue-50 text-blue-700 border-blue-200' }
  }
  if (target === 'home') {
    return { label: 'Hanya Beranda', icon: Home, badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
  }
  try {
    if (target.startsWith('[') && target.endsWith(']')) {
      const arr = JSON.parse(target)
      const count = Array.isArray(arr) ? arr.length : 1
      return { label: `${count} Halaman Khusus`, icon: Layers, badge: 'bg-purple-50 text-purple-700 border-purple-200' }
    }
  } catch (e) {}
  return { label: 'Halaman Khusus', icon: Layers, badge: 'bg-purple-50 text-purple-700 border-purple-200' }
}

const getDateStatus = (startDate: string | null, endDate: string | null) => {
  if (!startDate && !endDate) {
    return { label: 'Selalu Aktif', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', isExpired: false, isUpcoming: false }
  }
  const now = new Date()
  if (startDate && new Date(startDate) > now) {
    return {
      label: `Akan Tayang (${new Date(startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })})`,
      badge: 'bg-amber-50 text-amber-800 border-amber-200',
      isExpired: false,
      isUpcoming: true
    }
  }
  if (endDate && new Date(endDate) < now) {
    return {
      label: 'Kedaluwarsa',
      badge: 'bg-rose-50 text-rose-700 border-rose-200',
      isExpired: true,
      isUpcoming: false
    }
  }
  return {
    label: `Hingga ${endDate ? new Date(endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'Selesai'}`,
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    isExpired: false,
    isUpcoming: false
  }
}

export default function BannersPage() {
  const [banners, setBanners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'title'>('latest')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

  const [showForm, setShowForm] = useState(false)
  const [editingBanner, setEditingBanner] = useState<any | null>(null)
  const [previewingBanner, setPreviewingBanner] = useState<any | null>(null)
  const [deletingBanner, setDeletingBanner] = useState<{ id: string; title: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(8)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const fetchBanners = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/banners?_t=${Date.now()}`)
      const data = await res.json()
      if (data.success) {
        setBanners(data.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch banners:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBanners()
  }, [fetchBanners])

  const filteredAndSortedBanners = useMemo(() => {
    let result = [...banners]

    if (statusFilter === 'active') {
      result = result.filter(b => b.is_active)
    } else if (statusFilter === 'inactive') {
      result = result.filter(b => !b.is_active)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(b =>
        b.title?.toLowerCase().includes(q) ||
        b.description?.toLowerCase().includes(q) ||
        b.target_pages?.toLowerCase().includes(q)
      )
    }

    result.sort((a, b) => {
      if (sortBy === 'latest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '')
      return 0
    })

    return result
  }, [banners, statusFilter, search, sortBy])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, sortBy, itemsPerPage])

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedBanners.length / itemsPerPage))
  const paginatedBanners = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredAndSortedBanners.slice(start, start + itemsPerPage)
  }, [filteredAndSortedBanners, currentPage, itemsPerPage])

  const stats = useMemo(() => {
    const totalBanners = banners.length
    const activeCount = banners.filter(b => b.is_active).length
    const homeCount = banners.filter(b => b.target_pages === 'home').length
    const globalCount = banners.filter(b => !b.target_pages || b.target_pages === 'all').length
    const customCount = banners.filter(b => b.target_pages && b.target_pages !== 'all' && b.target_pages !== 'home').length
    return { totalBanners, activeCount, homeCount, globalCount, customCount }
  }, [banners])

  const handleToggleActive = async (banner: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const newStatus = !banner.is_active

    // Optimistic Update
    setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, is_active: newStatus } : b))

    try {
      const res = await fetch(`/api/banners/${banner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newStatus })
      })
      if (!res.ok) throw new Error()
      showToast(newStatus ? '✅ Banner diaktifkan untuk tayang!' : '⏸️ Banner dinonaktifkan')
    } catch {
      fetchBanners()
    }
  }

  const confirmDelete = async () => {
    if (!deletingBanner) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/banners/${deletingBanner.id}`, { method: 'DELETE' })
      if (res.ok) {
        setBanners(prev => prev.filter(b => b.id !== deletingBanner.id))
        showToast('Banner berhasil dihapus.')
        setDeletingBanner(null)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="font-sans space-y-6 sm:space-y-7 w-full pb-16">
      
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-semibold border border-slate-700 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check size={14} className="stroke-[3]" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2.5">
            <Megaphone size={13} />
            <span>Pemberitahuan &amp; Popup Interaktif</span>
          </div>
          <h1 className="font-sans font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Banner Pengumuman
          </h1>
          <p className="font-sans text-xs sm:text-sm text-slate-500 mt-1.5 max-w-2xl leading-relaxed">
            Kelola popup pengumuman urgent atau info penting sekolah. Otomatis tayang di 3 detik pertama kunjungan website sesuai filter tanggal &amp; target halaman.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto relative z-10 flex-wrap sm:flex-nowrap">
          <Link
            href="/"
            target="_blank"
            className="btn-tactile flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-2xl hover:bg-slate-100 hover:text-slate-900 transition text-xs font-bold shadow-2xs"
          >
            <ExternalLink size={15} />
            <span>Lihat Website</span>
          </Link>
          <button
            onClick={() => { setEditingBanner(null); setShowForm(true); }}
            className="btn-tactile flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl transition text-xs font-bold shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <Plus size={16} className="stroke-[2.5]" />
            <span>Tambah Banner Baru</span>
          </button>
        </div>
      </div>

      {/* Bento Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        
        {/* Card 1: Total Banner */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Total Banner
              </span>
              <p className="font-sans font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                {stats.totalBanners}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Megaphone size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[12px] font-medium text-slate-500">
            <span>Semua riwayat pengumuman</span>
          </div>
        </div>

        {/* Card 2: Banner Aktif (Tayang) */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Sedang Aktif
              </span>
              <p className="font-sans font-extrabold text-2xl sm:text-3xl text-emerald-600 tracking-tight">
                {stats.activeCount}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[12px] font-medium text-emerald-600">
            <span>Siap muncul di popup pengunjung</span>
          </div>
        </div>

        {/* Card 3: Global vs Home Target */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Target Beranda
              </span>
              <p className="font-sans font-extrabold text-2xl sm:text-3xl text-indigo-600 tracking-tight">
                {stats.homeCount}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
              <Home size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[12px] font-medium text-indigo-600">
            <span>Khusus beranda utama</span>
          </div>
        </div>

        {/* Card 4: Target Halaman Khusus/Global */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Target Global/Khusus
              </span>
              <p className="font-sans font-extrabold text-2xl sm:text-3xl text-purple-700 tracking-tight">
                {stats.globalCount + stats.customCount}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
              <Globe size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[12px] font-medium text-purple-600">
            <span>Seluruh web atau rute terpilih</span>
          </div>
        </div>

      </div>

      {/* Main Content Area */}
      <div className="bg-white p-5 sm:p-7 rounded-3xl shadow-sm border border-slate-200/80 space-y-6">
        
        {/* Controls Toolbar: Search, Status Filter, Sort, View Mode */}
        <div className="flex flex-col gap-4">
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative w-full sm:w-88">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input
                type="text"
                placeholder="Cari judul pengumuman, target..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition"
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

            {/* Right: Sort & View Mode Switcher */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              
              {/* Sort Selector */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 text-xs font-semibold text-slate-700">
                <ArrowUpDown size={13} className="text-slate-400" />
                <span className="text-slate-400 hidden md:inline">Urutkan:</span>
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-transparent outline-none cursor-pointer text-xs font-bold text-slate-800"
                >
                  <option value="latest">Terbaru</option>
                  <option value="oldest">Terlama</option>
                  <option value="title">Judul (A - Z)</option>
                </select>
              </div>

              {/* View Switcher: Table vs Grid */}
              <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition text-xs font-bold ${
                    viewMode === 'table'
                      ? 'bg-white text-blue-700 shadow-2xs font-extrabold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <List size={15} />
                  <span className="hidden sm:inline">Tabel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition text-xs font-bold ${
                    viewMode === 'grid'
                      ? 'bg-white text-blue-700 shadow-2xs font-extrabold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <LayoutGrid size={15} />
                  <span className="hidden sm:inline">Kartu</span>
                </button>
              </div>

            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {[
              { key: 'all', label: 'Semua Banner', emoji: '📢', count: stats.totalBanners },
              { key: 'active', label: 'Aktif (Tayang)', emoji: '🟢', count: stats.activeCount },
              { key: 'inactive', label: 'Nonaktif (Draf)', emoji: '⚪', count: stats.totalBanners - stats.activeCount },
            ].map(tab => {
              const isSelected = statusFilter === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key as any)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{tab.emoji}</span>
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>

        </div>

        {/* Content View */}
        {loading ? (
          /* Shimmer Loading */
          viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <tbody>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="animate-pulse border-b border-slate-100">
                      <td className="py-4 pr-4 pl-4 w-20"><div className="w-20 h-14 bg-slate-100 rounded-2xl" /></td>
                      <td className="py-4 pr-4 space-y-2">
                        <div className="h-4.5 bg-slate-100 rounded-lg w-72" />
                        <div className="h-3.5 bg-slate-100 rounded-lg w-44" />
                      </td>
                      <td className="py-4 pr-4"><div className="h-7 bg-slate-100 rounded-full w-24" /></td>
                      <td className="py-4 pr-4"><div className="h-7 bg-slate-100 rounded-full w-28" /></td>
                      <td className="py-4 pr-4"><div className="h-8 bg-slate-100 rounded-full w-14" /></td>
                      <td className="py-4 pr-4 text-right"><div className="h-8 bg-slate-100 rounded-2xl w-24 ml-auto" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-slate-50 rounded-3xl p-4 border border-slate-100 animate-pulse space-y-3">
                  <div className="aspect-[4/3] bg-slate-200 rounded-2xl w-full" />
                  <div className="h-4.5 bg-slate-200 rounded w-3/4" />
                  <div className="h-3.5 bg-slate-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          )
        ) : filteredAndSortedBanners.length === 0 ? (
          /* Empty State */
          <div className="py-16 text-center flex flex-col items-center justify-center bg-slate-50/60 rounded-3xl border border-dashed border-slate-200">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3.5 shadow-2xs">
              <Megaphone size={28} />
            </div>
            <h3 className="font-sans font-bold text-lg text-slate-800">
              {search || statusFilter !== 'all' ? 'Tidak Ada Banner yang Cocok' : 'Belum Ada Banner Pengumuman'}
            </h3>
            <p className="font-sans text-xs sm:text-sm text-slate-500 max-w-sm mt-1 mb-5">
              {search || statusFilter !== 'all'
                ? `Coba ubah kata kunci "${search}" atau reset filter status.`
                : 'Mulai buat popup pengumuman pertama madrasah dengan mudah.'}
            </p>
            <button
              onClick={() => { setEditingBanner(null); setShowForm(true); }}
              className="btn-tactile inline-flex items-center gap-2 bg-blue-600 text-white text-xs font-bold px-5 py-2.5 rounded-2xl hover:bg-blue-700 transition shadow-sm"
            >
              <Plus size={15} />
              <span>Tambah Banner Baru</span>
            </button>
          </div>
        ) : viewMode === 'table' ? (
          /* ======================================================== */
          /* TABLE VIEW MODE                                          */
          /* ======================================================== */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 pr-4 pl-4">Banner &amp; Judul</th>
                  <th className="py-4 pr-4">Target Penayangan</th>
                  <th className="py-4 pr-4">Masa Berlaku</th>
                  <th className="py-4 pr-4 text-center">Status Tayang</th>
                  <th className="py-4 pr-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {paginatedBanners.map((banner) => {
                  const targetCfg = getTargetBadge(banner.target_pages)
                  const TargetIcon = targetCfg.icon
                  const dateCfg = getDateStatus(banner.start_date, banner.end_date)

                  return (
                    <tr
                      key={banner.id}
                      className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                      onClick={() => { setEditingBanner(banner); setShowForm(true); }}
                      title="Klik untuk mengedit banner ini"
                    >
                      {/* Banner Image & Title */}
                      <td className="py-4 pr-4 pl-4 max-w-md">
                        <div className="flex items-center gap-3.5">
                          <div
                            className="relative w-20 h-14 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shrink-0 shadow-2xs group/img"
                            onClick={(e) => { e.stopPropagation(); setPreviewingBanner(banner); }}
                            title="Klik untuk pratinjau popup simulator"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={banner.image}
                              alt={banner.title}
                              className="object-contain w-full h-full group-hover/img:scale-108 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white transition">
                              <Eye size={14} />
                            </div>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-sans font-bold text-[14px] sm:text-[15px] text-slate-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-1">
                                {banner.title}
                              </span>
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 shrink-0">
                                <Edit3 size={13} />
                              </span>
                            </div>

                            {banner.description && (
                              <p className="text-xs text-slate-500 font-medium line-clamp-1 mt-0.5">
                                {banner.description}
                              </p>
                            )}

                            {banner.link && (
                              <div className="flex items-center gap-1 mt-1 text-[11px] text-blue-600 font-mono">
                                <ArrowUpRight size={11} />
                                <span className="truncate max-w-[200px]">{banner.link}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Target Pages */}
                      <td className="py-4 pr-4" onClick={(e) => e.stopPropagation()}>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${targetCfg.badge}`}>
                          <TargetIcon size={12} />
                          <span>{targetCfg.label}</span>
                        </span>
                      </td>

                      {/* Date Range */}
                      <td className="py-4 pr-4 text-xs font-medium text-slate-600" onClick={(e) => e.stopPropagation()}>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${dateCfg.badge}`}>
                          <Calendar size={12} />
                          <span>{dateCfg.label}</span>
                        </span>
                      </td>

                      {/* Status Toggle Switch */}
                      <td className="py-4 pr-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => handleToggleActive(banner, e)}
                          className={`px-3 py-1.5 rounded-2xl text-xs font-bold border transition flex items-center justify-center gap-1.5 mx-auto cursor-pointer ${
                            banner.is_active
                              ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                          }`}
                          title={banner.is_active ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                        >
                          <span className={`w-2 h-2 rounded-full ${banner.is_active ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
                          <span>{banner.is_active ? 'Aktif' : 'Nonaktif'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPreviewingBanner(banner)}
                            className="p-2 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition"
                            title="Pratinjau Popup Simulator"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => { setEditingBanner(banner); setShowForm(true); }}
                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition"
                            title="Edit Banner"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => setDeletingBanner({ id: banner.id, title: banner.title })}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                            title="Hapus Banner"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* ======================================================== */
          /* GRID VIEW MODE (Visual Cards)                            */
          /* ======================================================== */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {paginatedBanners.map((banner) => {
              const targetCfg = getTargetBadge(banner.target_pages)
              const TargetIcon = targetCfg.icon
              const dateCfg = getDateStatus(banner.start_date, banner.end_date)

              return (
                <div
                  key={banner.id}
                  onClick={() => { setEditingBanner(banner); setShowForm(true); }}
                  className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group relative cursor-pointer"
                  title="Klik untuk mengedit banner ini"
                >
                  {/* Thumbnail Banner */}
                  <div className="relative aspect-[4/3] w-full bg-slate-950 overflow-hidden flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={banner.image}
                      alt={banner.title}
                      className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Target Pill */}
                    <div className="absolute top-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md shadow-2xs border flex items-center gap-1 ${targetCfg.badge}`}>
                        <TargetIcon size={11} />
                        <span>{targetCfg.label}</span>
                      </span>
                    </div>

                    {/* Status Pill */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleActive(banner, e)}
                      className={`absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full text-[11px] font-bold transition shadow-sm flex items-center gap-1 cursor-pointer ${
                        banner.is_active
                          ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                          : 'bg-slate-900/80 text-white backdrop-blur-xs'
                      }`}
                      title={banner.is_active ? 'Status: Aktif' : 'Status: Nonaktif'}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${banner.is_active ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
                      <span>{banner.is_active ? 'Aktif' : 'Nonaktif'}</span>
                    </button>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold mb-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${dateCfg.badge}`}>
                          {dateCfg.label}
                        </span>
                      </div>

                      <h3 className="font-sans font-bold text-base text-slate-900 leading-snug group-hover:text-blue-600 transition line-clamp-2 mb-1">
                        {banner.title}
                      </h3>

                      {banner.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {banner.description}
                        </p>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setPreviewingBanner(banner)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <Eye size={13} />
                        <span>Pratinjau</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setEditingBanner(banner); setShowForm(true); }}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition"
                          title="Edit"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => setDeletingBanner({ id: banner.id, title: banner.title })}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && filteredAndSortedBanners.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-slate-100 gap-4">
            <div className="text-xs font-medium text-slate-500">
              Menampilkan {Math.min(filteredAndSortedBanners.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(filteredAndSortedBanners.length, currentPage * itemsPerPage)} dari {filteredAndSortedBanners.length} banner
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Sebelumnya
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition ${
                      currentPage === i + 1
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Selanjutnya
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Standalone Banner Preview Modal (Simulator) */}
      {previewingBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-md border border-white/20 animate-in zoom-in-95 duration-200 relative flex flex-col">
            <button
              onClick={() => setPreviewingBanner(null)}
              className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition"
              title="Tutup Preview"
            >
              <X size={16} />
            </button>

            {/* Banner Media */}
            <div className="relative aspect-[4/3] w-full bg-slate-950 flex items-center justify-center overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewingBanner.image}
                alt={previewingBanner.title}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Content */}
            <div className="p-6 space-y-3 bg-white">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                  Pengumuman Resmi
                </span>
                <span className="text-[10px] text-slate-400">Muncul setelah 3 detik</span>
              </div>
              <h3 className="font-bold text-slate-900 text-lg leading-snug">
                {previewingBanner.title}
              </h3>
              {previewingBanner.description && (
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {previewingBanner.description}
                </p>
              )}

              {previewingBanner.link && (
                <div className="pt-2">
                  <Link
                    href={previewingBanner.link}
                    target="_blank"
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
                  >
                    <span>Buka Informasi Terkait</span>
                    <ArrowUpRight size={14} />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xs border border-rose-100">
              <AlertTriangle size={26} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Hapus Banner Pengumuman?</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Apakah Anda yakin ingin menghapus banner <strong className="text-slate-800">&quot;{deletingBanner.title}&quot;</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeletingBanner(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                <span>{isDeleting ? 'Menghapus...' : 'Hapus Banner'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner Create / Edit Modal Form */}
      {showForm && (
        <BannerForm
          initialData={editingBanner}
          onSuccess={() => {
            fetchBanners()
            showToast(editingBanner ? 'Banner berhasil diperbarui!' : 'Banner baru berhasil diterbitkan!')
          }}
          onClose={() => {
            setShowForm(false)
            setEditingBanner(null)
          }}
        />
      )}

    </div>
  )
}
