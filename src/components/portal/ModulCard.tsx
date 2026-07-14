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
    <div className="group relative bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-3xl p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-blue-200/50 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full overflow-hidden">
      {/* Decorative gradient blob */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-gradient-to-br from-blue-100/40 to-purple-100/40 blur-2xl group-hover:from-blue-200/40 group-hover:to-purple-200/40 transition-colors duration-500"></div>

      {/* Status Badge */}
      <div className="relative flex justify-between items-start mb-5">
        <span className={`px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-full border ${getStatusColor(modul.status)} shadow-sm`}>
          {modul.status}
        </span>
        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Link href={`/modul-pembelajaran/${modul.id}`} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Lihat">
            <Eye size={18} />
          </Link>
          <Link href={`/modul-pembelajaran/edit/${modul.id}`} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Edit">
            <Edit3 size={18} />
          </Link>
          {(currentUserRole === 'admin' || currentUserRole === 'superadmin') && onDelete && (
             <button onClick={() => onDelete(modul.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors" title="Hapus">
               <Trash2 size={18} />
             </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative mb-6 flex-grow">
        <h3 className="text-[1.1rem] font-bold text-slate-800 leading-snug mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
          {modul.title}
        </h3>
        
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="inline-flex items-center px-2.5 py-1 bg-slate-50 border border-slate-100 text-slate-600 text-[11px] font-medium rounded-lg">
            <BookOpen size={12} className="mr-1.5 text-blue-500" />
            {modul.subject}
          </span>
          <span className="inline-flex items-center px-2.5 py-1 bg-slate-50 border border-slate-100 text-slate-600 text-[11px] font-medium rounded-lg">
            Kelas {modul.grade}
          </span>
          <span className="inline-flex items-center px-2.5 py-1 bg-slate-50 border border-slate-100 text-slate-600 text-[11px] font-medium rounded-lg">
            {modul.semester}
          </span>
        </div>
      </div>

      {/* Footer / Meta */}
      <div className="relative pt-4 border-t border-slate-100/80 flex items-center justify-between text-xs font-medium text-slate-500">
        <div className="flex items-center gap-1.5">
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
