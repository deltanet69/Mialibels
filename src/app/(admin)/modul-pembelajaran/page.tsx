'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, BookOpen, Loader2 } from 'lucide-react'
import Link from 'next/link'
import ModulCard from '@/components/portal/ModulCard'

interface Modul {
  id: string
  title: string
  subject: string
  grade: string
  semester: string
  status: string
  created_at: string
  admins: { name: string } | null
}

export default function ModulPembelajaranPage() {
  const [modules, setModules] = useState<Modul[]>([])
  const [allModules, setAllModules] = useState<Modul[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  
  // Filters
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [gradeFilter, setGradeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  
  const fetchModules = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (subjectFilter) params.append('subject', subjectFilter)
      if (gradeFilter) params.append('grade', gradeFilter)
      if (statusFilter) params.append('status', statusFilter)
      
      const res = await fetch(`/api/modul-pembelajaran?${params.toString()}`)
      const json = await res.json()
      if (json.success) {
        setModules(json.data)
        // If no filters are applied, save all modules to compute filter options
        if (!search && !subjectFilter && !gradeFilter && !statusFilter) {
          setAllModules(json.data)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setInitialLoad(false)
    }
  }

  // Derive filter options from allModules
  const availableSubjects = Array.from(new Set(allModules.map(m => m.subject))).filter(Boolean).sort()
  const availableGrades = Array.from(new Set(allModules.map(m => m.grade))).filter(Boolean).sort((a,b) => Number(a) - Number(b))

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchModules()
    }, 300)
    return () => clearTimeout(timer)
  }, [search, subjectFilter, gradeFilter, statusFilter])

  // Dummy delete handler for now
  const handleDelete = async (id: string) => {
    if(confirm('Apakah Anda yakin ingin menghapus modul ini?')) {
      // In a real app, call DELETE API here
      console.log('Delete', id)
      // fetchModules()
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-100">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
            
            Modul Pembelajaran
          </h1>
          <p className="text-slate-500 mt-3 text-[15px] max-w-2xl leading-relaxed">
            Kelola dan kembangkan modul ajar interaktif. Sesuaikan dengan standar kurikulum madrasah secara efisien dengan bantuan AI.
          </p>
        </div>
        <Link 
          href="/modul-pembelajaran/baru"
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-blue-600 text-white px-5 py-2.5 rounded-2xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 whitespace-nowrap"
        >
          <Plus size={20} strokeWidth={2.5} />
          Buat Modul Baru
        </Link>
      </div>

      {/* Filter & Search Section */}
      <div className="bg-white/60 backdrop-blur-md p-4 rounded-3xl border border-slate-200/60 shadow-[0_2px_20px_rgb(0,0,0,0.02)] flex flex-col lg:flex-row gap-4">
        <div className="relative flex-grow group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500">
            {loading && !initialLoad ? (
              <Loader2 className="text-blue-500 animate-spin" size={18} />
            ) : (
              <Search className="text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
            )}
          </div>
          <input
            type="text"
            placeholder="Cari modul berdasarkan judul..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 rounded-2xl outline-none transition-all text-[15px]  placeholder:text-slate-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar items-center">
          <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-2xl border border-slate-200 transition-all hover:border-slate-300 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10">
            <Filter size={16} className="text-slate-400" />
            <select 
              className="bg-transparent border-none text-[14px] font-semibold text-slate-600 focus:ring-0 cursor-pointer outline-none w-full min-w-[120px]"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
            >
              <option value="">Semua Mapel</option>
              {availableSubjects.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
          
          <select 
            className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-[14px] font-semibold text-slate-600 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 outline-none cursor-pointer transition-all hover:border-slate-300 min-w-[130px]"
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
          >
            <option value="">Semua Kelas</option>
            {availableGrades.map(g => (
              <option key={g} value={g}>Kelas {g}</option>
            ))}
          </select>
          
          <select 
            className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-[14px] font-semibold text-slate-600 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 outline-none cursor-pointer transition-all hover:border-slate-300 min-w-[140px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Semua Status</option>
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
            <option value="Revisi">Revisi</option>
            <option value="Arsip">Arsip</option>
          </select>
        </div>
      </div>

      {/* Modules Grid */}
      {initialLoad ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl animate-pulse"></div>
            <Loader2 className="relative animate-spin text-blue-600 mb-6" size={44} />
          </div>
          <p className="text-slate-500 font-medium tracking-wide">Memuat modul interaktif...</p>
        </div>
      ) : modules.length === 0 ? (
        <div className="bg-white/50 backdrop-blur-sm rounded-[2rem] border border-dashed border-slate-300 p-16 text-center flex flex-col items-center justify-center">
          <div className="w-24 h-24 bg-gradient-to-tr from-blue-50 to-indigo-50 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-white rotate-3 hover:rotate-6 transition-transform">
            <BookOpen className="text-blue-500 drop-shadow-sm" size={40} strokeWidth={1.5} />
          </div>
          <h3 className="text-2xl font-extrabold text-slate-800 mb-3 tracking-tight">Belum Ada Modul</h3>
          <p className="text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
            Belum ada modul pembelajaran yang sesuai dengan kriteria pencarian Anda. 
            Mulai buat modul pertama Anda dengan mudah!
          </p>
          <Link 
            href="/modul-pembelajaran/baru"
            className="bg-slate-900 hover:bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-bold transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-blue-500/20 active:scale-95"
          >
            Mulai Buat Modul
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {modules.map((modul) => (
            <ModulCard 
              key={modul.id} 
              modul={modul} 
              onDelete={handleDelete}
              currentUserRole="admin" // In a real app, pass actual session role
            />
          ))}
        </div>
      )}
    </div>
  )
}
