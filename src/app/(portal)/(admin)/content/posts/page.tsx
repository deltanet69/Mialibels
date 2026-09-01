'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { 
  Plus, Search, Trash2, Edit3, Eye, FileText, Star, Sparkles, 
  Layers, LayoutGrid, List, Clock, Calendar, User, 
  AlertTriangle, X, ExternalLink, Newspaper, 
  Check, Loader2, ArrowUpDown, ArrowRight, BookOpen, Trophy, 
  Megaphone, School, Flame
} from 'lucide-react'
import Link from 'next/link'
import { PostForm } from '@/components/portal/posts/PostForm'

const CATEGORIES = [
  'Semua',
  'Berita Sekolah',
  'Artikel Pendidikan',
  'Prestasi',
  'Pengumuman'
]

const CATEGORY_CONFIG: Record<string, { label: string; icon: any; emoji: string; color: string; badge: string; pill: string; activePill: string }> = {
  'Berita Sekolah': {
    label: 'Berita Sekolah',
    icon: School,
    emoji: '🏫',
    color: 'text-blue-700',
    badge: 'bg-blue-50 text-blue-700 border-blue-200/90 hover:bg-blue-100/80',
    pill: 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50',
    activePill: 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
  },
  'Artikel Pendidikan': {
    label: 'Artikel Pendidikan',
    icon: BookOpen,
    emoji: '📚',
    color: 'text-emerald-700',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/90 hover:bg-emerald-100/80',
    pill: 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50',
    activePill: 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-500/20'
  },
  'Prestasi': {
    label: 'Prestasi',
    icon: Trophy,
    emoji: '🏆',
    color: 'text-amber-800',
    badge: 'bg-amber-50 text-amber-800 border-amber-200/90 hover:bg-amber-100/80',
    pill: 'bg-white text-slate-700 border-slate-200 hover:border-amber-300 hover:bg-amber-50/50',
    activePill: 'bg-amber-600 text-white border-amber-600 shadow-sm shadow-amber-500/20'
  },
  'Pengumuman': {
    label: 'Pengumuman',
    icon: Megaphone,
    emoji: '📢',
    color: 'text-purple-700',
    badge: 'bg-purple-50 text-purple-700 border-purple-200/90 hover:bg-purple-100/80',
    pill: 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50/50',
    activePill: 'bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-500/20'
  }
}

const getCategoryBadgeClass = (category: string) => {
  return CATEGORY_CONFIG[category]?.badge || 'bg-slate-100 text-slate-700 border-slate-200'
}

const getCategoryEmoji = (category: string) => {
  return CATEGORY_CONFIG[category]?.emoji || '📄'
}

const stripHtml = (html: string) => {
  if (!html) return ''
  return html.replace(/<[^>]*>?/gm, '').trim()
}

export default function PostsPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Semua')
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'views' | 'title'>('latest')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  
  const [showForm, setShowForm] = useState(false)
  const [editingPost, setEditingPost] = useState<any | null>(null)
  const [deletingPost, setDeletingPost] = useState<{ id: string; title: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(8)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/posts?_t=${Date.now()}`)
      const data = await res.json()
      if (data.success) {
        setPosts(data.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const filteredAndSortedPosts = useMemo(() => {
    let result = [...posts]
    if (selectedCategory !== 'Semua') {
      result = result.filter(p => p.category === selectedCategory)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p => 
        p.title?.toLowerCase().includes(q) ||
        p.slug?.toLowerCase().includes(q) ||
        p.author?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      )
    }
    result.sort((a, b) => {
      if (sortBy === 'latest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sortBy === 'views') return (b.view_count || 0) - (a.view_count || 0)
      if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '')
      return 0
    })
    return result
  }, [posts, selectedCategory, search, sortBy])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, selectedCategory, sortBy, itemsPerPage])

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedPosts.length / itemsPerPage))
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredAndSortedPosts.slice(start, start + itemsPerPage)
  }, [filteredAndSortedPosts, currentPage, itemsPerPage])

  const stats = useMemo(() => {
    const totalPosts = posts.length
    const totalViews = posts.reduce((sum, p) => sum + (p.view_count || 0), 0)
    const featuredCount = posts.filter(p => Array.isArray(p.tags) && p.tags.includes('featured')).length
    const categoryCounts: Record<string, number> = {}
    CATEGORIES.forEach(c => {
      categoryCounts[c] = c === 'Semua' ? totalPosts : posts.filter(p => p.category === c).length
    })
    return { totalPosts, totalViews, featuredCount, categoryCounts }
  }, [posts])

  // Direct Click to Edit Handler
  const handleOpenEdit = (post: any) => {
    setEditingPost(post)
    setShowForm(true)
  }

  const handleToggleFeatured = async (post: any, e: React.MouseEvent) => {
    e.stopPropagation()
    const currentTags: string[] = Array.isArray(post.tags) ? [...post.tags] : []
    const isCurrentlyFeatured = currentTags.includes('featured')
    const updatedTags = isCurrentlyFeatured ? currentTags.filter(t => t !== 'featured') : ['featured', ...currentTags]
    
    // Optimistic UI Update
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, tags: updatedTags } : p))
    
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: updatedTags })
      })
      if (!res.ok) throw new Error()
      showToast(isCurrentlyFeatured ? 'Bintang unggulan dinonaktifkan' : '⭐ Ditandai sebagai Berita Unggulan!')
    } catch {
      fetchPosts()
    }
  }

  const confirmDelete = async () => {
    if (!deletingPost) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/posts/${deletingPost.id}`, { method: 'DELETE' })
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== deletingPost.id))
        showToast('Konten berhasil dihapus.')
        setDeletingPost(null)
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
            
            <span>Pusat Publikasi &amp; Konten Digital</span>
          </div>
          <h1 className="font-sans font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Berita, Artikel &amp; Pengumuman
          </h1>
          <p className="font-sans text-xs sm:text-sm text-slate-500 mt-1.5 max-w-2xl leading-relaxed">
            Kelola publikasi berita madrasah, artikel edukasi guru, dokumentasi prestasi, dan sorotan halaman utama dengan mudah.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto relative z-10 flex-wrap sm:flex-nowrap">
          <Link
            href="/news"
            target="_blank"
            className="btn-tactile flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-2xl hover:bg-slate-100 hover:text-slate-900 transition text-xs font-bold shadow-2xs"
          >
            <ExternalLink size={15} />
            <span>Lihat Website</span>
          </Link>
          <button
            onClick={() => { setEditingPost(null); setShowForm(true); }}
            className="btn-tactile flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl transition text-xs font-bold shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <Plus size={16} className="stroke-[2.5]" />
            <span>Tambah Konten Baru</span>
          </button>
        </div>
      </div>

      {/* Bento Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        
        {/* Card 1: Total Konten */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Total Konten
              </span>
              <p className="font-sans font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                {stats.totalPosts}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <FileText size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[12px] font-medium text-slate-500">
            <span>Semua publikasi aktif</span>
          </div>
        </div>

        {/* Card 2: Total Pembaca */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Total Pembaca
              </span>
              <p className="font-sans font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                {stats.totalViews.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <Eye size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[12px] font-medium text-emerald-600">
            <span>Akumulasi total tayang</span>
          </div>
        </div>

        {/* Card 3: Berita Unggulan */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Berita Unggulan
              </span>
              <p className="font-sans font-extrabold text-2xl sm:text-3xl text-amber-600 tracking-tight">
                {stats.featuredCount}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
              <Star size={20} className="fill-amber-500 text-amber-500" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[12px] font-medium text-amber-700">
            <span>Tayang di sorotan beranda</span>
          </div>
        </div>

        {/* Card 4: Kategori */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Kategori Aktif
              </span>
              <p className="font-sans font-extrabold text-2xl sm:text-3xl text-purple-700 tracking-tight">
                4
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
              <Layers size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[12px] font-medium text-purple-600">
            <span>Sekolah, Edukasi, Prestasi &amp; Info</span>
          </div>
        </div>

      </div>

      {/* Main Content Area */}
      <div className="bg-white p-5 sm:p-7 rounded-3xl shadow-sm border border-slate-200/80 space-y-6">
        
        {/* Controls Toolbar: Search, Filter Tabs, Sort, View Switcher */}
        <div className="flex flex-col gap-4">
          
          {/* Top Row: Search & View Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative w-full sm:w-88">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input
                type="text"
                placeholder="Cari judul, penulis, atau topik..."
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

            {/* Right: Sort Dropdown & Dual View Mode */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              
              {/* Sort selector */}
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
                  <option value="views">Paling Banyak Dibaca</option>
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

          {/* Bottom Row: Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {CATEGORIES.map(cat => {
              const isSelected = selectedCategory === cat
              const count = stats.categoryCounts[cat] || 0
              const cfg = CATEGORY_CONFIG[cat]

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? (cfg ? cfg.activePill : 'bg-slate-900 text-white border-slate-900 shadow-sm')
                      : (cfg ? cfg.pill : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50')
                  }`}
                >
                  <span>{cat === 'Semua' ? '✨' : getCategoryEmoji(cat)}</span>
                  <span>{cat}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

        </div>

        {/* Content View: Table Mode or Grid Mode */}
        {loading ? (
          /* Shimmer Loading State */
          viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse border-b border-slate-100">
                      <td className="py-4 pr-4 pl-4 w-16">
                        <div className="w-16 h-12 bg-slate-100 rounded-2xl" />
                      </td>
                      <td className="py-4 pr-4 space-y-2">
                        <div className="h-4.5 bg-slate-100 rounded-lg w-80" />
                        <div className="h-3.5 bg-slate-100 rounded-lg w-48" />
                      </td>
                      <td className="py-4 pr-4"><div className="h-7 bg-slate-100 rounded-full w-28" /></td>
                      <td className="py-4 pr-4"><div className="h-4 bg-slate-100 rounded w-24" /></td>
                      <td className="py-4 pr-4"><div className="h-4 bg-slate-100 rounded w-20" /></td>
                      <td className="py-4 pr-4 text-right"><div className="h-8 bg-slate-100 rounded-2xl w-24 ml-auto" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-slate-50 rounded-3xl p-4 border border-slate-100 animate-pulse space-y-3">
                  <div className="aspect-[16/10] bg-slate-200 rounded-2xl w-full" />
                  <div className="h-4.5 bg-slate-200 rounded w-3/4" />
                  <div className="h-3.5 bg-slate-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          )
        ) : filteredAndSortedPosts.length === 0 ? (
          /* Empty State */
          <div className="py-16 text-center flex flex-col items-center justify-center bg-slate-50/60 rounded-3xl border border-dashed border-slate-200">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3.5 shadow-2xs">
              <Newspaper size={28} />
            </div>
            <h3 className="font-sans font-bold text-lg text-slate-800">
              {search || selectedCategory !== 'Semua' ? 'Tidak Ada Konten yang Cocok' : 'Belum Ada Berita atau Artikel'}
            </h3>
            <p className="font-sans text-xs sm:text-sm text-slate-500 max-w-sm mt-1 mb-5">
              {search || selectedCategory !== 'Semua' 
                ? `Coba ubah kata kunci "${search}" atau pilih kategori lain.` 
                : 'Mulai publikasikan konten pertama madrasah dengan mudah.'}
            </p>
            <button
              onClick={() => { setEditingPost(null); setShowForm(true); }}
              className="btn-tactile inline-flex items-center gap-2 bg-blue-600 text-white text-xs font-bold px-5 py-2.5 rounded-2xl hover:bg-blue-700 transition shadow-sm"
            >
              <Plus size={15} />
              <span>Tulis Artikel Baru</span>
            </button>
          </div>
        ) : viewMode === 'table' ? (
          /* ======================================================== */
          /* TABLE VIEW MODE (Clear, Normal Font, Easy to Read)       */
          /* ======================================================== */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[780px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 pr-4 pl-4">Sampul &amp; Judul Artikel</th>
                  <th className="py-4 pr-4">Kategori</th>
                  <th className="py-4 pr-4">Penulis</th>
                  <th className="py-4 pr-4">Tanggal</th>
                  <th className="py-4 pr-4">Pembaca</th>
                  <th className="py-4 pr-4 text-center">Unggulan</th>
                  <th className="py-4 pr-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {paginatedPosts.map((post) => {
                  const isFeatured = Array.isArray(post.tags) && post.tags.includes('featured')
                  
                  return (
                    <tr 
                      key={post.id} 
                      className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                      onClick={() => handleOpenEdit(post)}
                      title="Klik untuk melihat / mengedit artikel ini"
                    >
                      
                      {/* Thumbnail & Title (Click to Open Detail/Edit) */}
                      <td className="py-4 pr-4 pl-4 max-w-md">
                        <div className="flex items-center gap-3.5">
                          
                          {/* Thumbnail */}
                          <div className="relative w-16 h-12 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-2xs">
                            {post.thumbnail ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img 
                                src={post.thumbnail} 
                                alt={post.title} 
                                className="object-cover w-full h-full group-hover:scale-108 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-blue-500 bg-blue-50 font-bold text-xs">
                                <span>{getCategoryEmoji(post.category)}</span>
                              </div>
                            )}
                          </div>

                          {/* Title & Metadata */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-sans font-bold text-[14px] sm:text-[15px] text-slate-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-1">
                                {post.title}
                              </span>
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 shrink-0">
                                <Edit3 size={13} />
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-medium">
                              <span className="font-mono text-slate-400 truncate max-w-[200px]">
                                /{post.slug}
                              </span>
                              <span>·</span>
                              <span className="flex items-center gap-1 text-slate-600">
                                <Clock size={11} className="text-slate-400" />
                                {post.reading_time || 3} mnt baca
                              </span>
                            </div>
                          </div>

                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-4 pr-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedCategory(post.category)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition ${getCategoryBadgeClass(post.category)}`}
                          title={`Filter kategori ${post.category}`}
                        >
                          <span>{getCategoryEmoji(post.category)}</span>
                          <span>{post.category}</span>
                        </button>
                      </td>

                      {/* Author */}
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                          <User size={13} className="text-slate-400" />
                          <span className="truncate max-w-[130px]">{post.author || 'Tim Media'}</span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-4 pr-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-400" />
                          <span>
                            {new Date(post.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Views */}
                      <td className="py-4 pr-4 text-xs font-bold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <Eye size={14} className="text-slate-400" />
                          <span>{(post.view_count || 0).toLocaleString('id-ID')}</span>
                        </div>
                      </td>

                      {/* 1-Click Toggle Featured Star */}
                      <td className="py-4 pr-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => handleToggleFeatured(post, e)}
                          className={`p-2 rounded-2xl transition-all ${
                            isFeatured 
                              ? 'text-amber-500 bg-amber-50 hover:bg-amber-100 shadow-2xs ring-2 ring-amber-300/60' 
                              : 'text-slate-300 hover:text-amber-400 hover:bg-slate-100'
                          }`}
                          title={isFeatured ? '⭐ Berita Unggulan Aktif (Klik untuk matikan)' : 'Jadikan Berita Unggulan'}
                        >
                          <Star size={18} className={isFeatured ? 'fill-amber-500' : ''} />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/news/${post.slug}`}
                            target="_blank"
                            className="p-2 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition"
                            title="Buka Halaman Publik (Website)"
                          >
                            <ExternalLink size={16} />
                          </Link>
                          <button
                            onClick={() => handleOpenEdit(post)}
                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition"
                            title="Edit Artikel Ini"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => setDeletingPost({ id: post.id, title: post.title })}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                            title="Hapus Artikel"
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
          /* GRID / EDITORIAL CARD VIEW MODE (Pinterest / Dribbble)   */
          /* ======================================================== */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {paginatedPosts.map((post) => {
              const isFeatured = Array.isArray(post.tags) && post.tags.includes('featured')
              const excerpt = stripHtml(post.content)

              return (
                <div 
                  key={post.id}
                  onClick={() => handleOpenEdit(post)}
                  className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group relative cursor-pointer"
                  title="Klik untuk melihat / mengedit artikel ini"
                >
                  {/* Thumbnail Container */}
                  <div className="relative aspect-[16/10] w-full bg-slate-100 overflow-hidden">
                    {post.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={post.thumbnail} 
                        alt={post.title}
                        className="object-cover w-full h-full group-hover:scale-106 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50/50">
                        <span className="text-3xl mb-1">{getCategoryEmoji(post.category)}</span>
                        <span className="text-xs font-bold text-slate-400">Pratinjau Gambar</span>
                      </div>
                    )}

                    {/* Category floating pill */}
                    <div className="absolute top-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedCategory(post.category)}
                        className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md shadow-2xs border transition ${getCategoryBadgeClass(post.category)}`}
                      >
                        <span className="mr-1">{getCategoryEmoji(post.category)}</span>
                        {post.category}
                      </button>
                    </div>

                    {/* Featured star floating badge */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleFeatured(post, e)}
                      className={`absolute top-3 right-3 z-10 w-9 h-9 rounded-2xl flex items-center justify-center backdrop-blur-md transition shadow-sm ${
                        isFeatured 
                          ? 'bg-amber-500 text-white ring-2 ring-amber-300/80 shadow-amber-500/20' 
                          : 'bg-white/90 hover:bg-white text-slate-400 hover:text-amber-500'
                      }`}
                      title={isFeatured ? '⭐ Berita Unggulan (Klik untuk matikan)' : 'Jadikan Berita Unggulan'}
                    >
                      <Star size={16} className={isFeatured ? 'fill-white' : ''} />
                    </button>

                    {/* Reading time pill */}
                    <div className="absolute bottom-3 right-3 z-10 px-2.5 py-1 rounded-xl bg-slate-900/75 backdrop-blur-xs text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-sm">
                      <Clock size={11} className="text-amber-400" />
                      <span>{post.reading_time || 3} mnt</span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-2 font-medium">
                        <Calendar size={12} className="text-slate-400" />
                        <span>
                          {new Date(post.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </span>
                        <span>·</span>
                        <div className="flex items-center gap-1 text-slate-700 font-bold">
                          <Eye size={12} className="text-slate-400" />
                          <span>{(post.view_count || 0).toLocaleString('id-ID')}</span>
                        </div>
                      </div>

                      <h3 className="font-sans font-bold text-base text-slate-900 leading-snug group-hover:text-blue-600 transition line-clamp-2 mb-2">
                        {post.title}
                      </h3>

                      {excerpt && (
                        <p className="font-sans text-xs sm:text-[13px] text-slate-600 line-clamp-2 leading-relaxed">
                          {excerpt}
                        </p>
                      )}
                    </div>

                    {/* Card Footer: Author & Action Buttons */}
                    <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 truncate max-w-[130px]">
                        <User size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate">{post.author || 'Tim Media'}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Link
                          href={`/news/${post.slug}`}
                          target="_blank"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                          title="Lihat Halaman Publik"
                        >
                          <ExternalLink size={16} />
                        </Link>
                        <button
                          onClick={() => handleOpenEdit(post)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition"
                          title="Edit Artikel"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => setDeletingPost({ id: post.id, title: post.title })}
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
        {!loading && filteredAndSortedPosts.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-slate-100 gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span>Tampilkan</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 font-bold"
              >
                <option value={8}>8</option>
                <option value={16}>16</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
              </select>
              <span>konten per halaman</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
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
                        className={`w-8 h-8 flex items-center justify-center text-xs font-bold rounded-xl transition ${
                          currentPage === page 
                            ? 'bg-blue-600 text-white shadow-sm' 
                            : 'text-slate-700 hover:bg-slate-100'
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
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Editor Studio Modal */}
      {showForm && (
        <PostForm
          initialData={editingPost}
          onSuccess={fetchPosts}
          onClose={() => { setShowForm(false); setEditingPost(null); }}
        />
      )}

      {/* Custom Delete Confirmation Dialog */}
      {deletingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-7 sm:p-8 w-full max-w-md shadow-2xl border border-slate-100 text-center font-sans">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-2xs">
              <AlertTriangle size={28} />
            </div>
            <h3 className="font-sans font-bold text-xl text-slate-900 mb-2">
              Hapus Artikel Ini?
            </h3>
            <p className="font-sans text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
              Anda akan menghapus artikel <strong className="text-slate-900">"{deletingPost.title}"</strong>. Konten yang dihapus tidak dapat dipulihkan kembali.
            </p>
            <div className="flex items-center gap-3 justify-center">
              <button
                type="button"
                onClick={() => setDeletingPost(null)}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="btn-tactile px-6 py-2.5 rounded-2xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition flex items-center gap-2 shadow-md shadow-rose-600/20 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    <span>Ya, Hapus Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
