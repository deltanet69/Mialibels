'use client'

import React from 'react'
import { BookOpen, Clock, User, Eye, Edit3, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface ModulCardProps {
  modul: {
    id: string
    title: string
    subject: string
    grade: string
    semester: string
    status: string
    created_at: string
    admins: { name: string } | null
  }
  onDelete?: (id: string) => void
  currentUserRole?: string
}

export default function ModulCard({ modul, onDelete, currentUserRole }: ModulCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Published': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'Draft': return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'Revisi': return 'bg-rose-100 text-rose-700 border-rose-200'
      case 'Arsip': return 'bg-slate-100 text-slate-700 border-slate-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const date = new Date(modul.created_at).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric'
  })

  return (
    <div className="group relative bg-white rounded-3xl p-7 shadow-[0_2px_15px_rgb(0,0,0,0.03)] border border-slate-100 hover:shadow-[0_20px_50px_rgba(18,112,255,0.08)] hover:border-blue-100 hover:ring-2 hover:ring-blue-500/10 hover:-translate-y-2 transition-all duration-400 ease-out flex flex-col justify-between h-full overflow-hidden">

      {/* Status Badge */}
      <div className="relative flex justify-between items-start mb-5">
        <span className={`px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-full border ${getStatusColor(modul.status)} shadow-sm`}>
          {modul.status}
        </span>
        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Link href={`/modul-pembelajaran/${modul.id}`} className="p-2 text-slate-400 hover:text-white hover:bg-blue-600 rounded-xl transition-all shadow-sm hover:shadow-md" title="Lihat">
            <Eye size={16} strokeWidth={2.5} />
          </Link>
          <Link href={`/modul-pembelajaran/edit/${modul.id}`} className="p-2 text-slate-400 hover:text-white hover:bg-emerald-600 rounded-xl transition-all shadow-sm hover:shadow-md" title="Edit">
            <Edit3 size={16} strokeWidth={2.5} />
          </Link>
          {(currentUserRole === 'admin' || currentUserRole === 'superadmin') && onDelete && (
             <button onClick={() => onDelete(modul.id)} className="p-2 text-slate-400 hover:text-white hover:bg-rose-600 rounded-xl transition-all shadow-sm hover:shadow-md" title="Hapus">
               <Trash2 size={16} strokeWidth={2.5} />
             </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative mb-6 flex-grow">
        <Link href={`/modul-pembelajaran/${modul.id}`}>
          <h3 className="text-[1.15rem] font-extrabold text-slate-800 leading-snug mb-4 hover:text-blue-600 transition-colors line-clamp-2 cursor-pointer decoration-blue-500 decoration-2 hover:underline underline-offset-4">
            {modul.title}
          </h3>
        </Link>
        
        <div className="flex flex-wrap gap-2.5 mt-5">
          <span className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 text-[11px] font-bold uppercase tracking-wider rounded-lg">
            <BookOpen size={12} className="mr-1.5" strokeWidth={2.5} />
            {modul.subject}
          </span>
          <span className="inline-flex items-center px-3 py-1.5 bg-slate-100 text-slate-700 text-[11px] font-bold uppercase tracking-wider rounded-lg">
            Kelas {modul.grade}
          </span>
          <span className="inline-flex items-center px-3 py-1.5 bg-slate-100 text-slate-700 text-[11px] font-bold uppercase tracking-wider rounded-lg">
            {modul.semester}
          </span>
        </div>
      </div>

      {/* Footer / Meta */}
      <div className="relative pt-5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-slate-500 transition-colors">
        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
          <User size={14} className="text-gray-400" />
          <span className="truncate max-w-[100px]">{modul.admins?.name || 'Unknown'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={14} className="text-gray-400" />
          <span>{date}</span>
        </div>
      </div>
    </div>
  )
}
