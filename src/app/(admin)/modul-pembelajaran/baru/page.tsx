import React from 'react'
import ModulForm from '@/components/portal/ModulForm'
import { BookOpen } from 'lucide-react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export const metadata = {
  title: 'Buat Modul Baru | MI Attaqwa 15'
}

export default function BaruModulPage() {
  return (
    <div className="p-4 md:p-8 max-w-full mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link 
          href="/modul-pembelajaran"
          className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
        >
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            
            Buat Modul Ajar Baru
          </h1>
          <p className="text-slate-500 text-sm mt-1">Lengkapi informasi di bawah untuk menyusun modul ajar interaktif.</p>
        </div>
      </div>

      <ModulForm />
    </div>
  )
}
