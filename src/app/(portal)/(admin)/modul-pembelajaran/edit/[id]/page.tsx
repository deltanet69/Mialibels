'use client'

import React, { useEffect, useState } from 'react'
import ModulForm from '@/components/portal/ModulForm'
import { BookOpen, ChevronLeft, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function EditModulPage() {
  const params = useParams()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/modul-pembelajaran/${params.id}`)
        const json = await res.json()
        if (json.success) {
          setData(json.data)
        } else {
          setError(json.error || 'Gagal memuat modul.')
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan.')
      } finally {
        setLoading(false)
      }
    }
    if (params.id) fetchData()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
        <p className="text-slate-500 font-medium">Memuat modul untuk diedit...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[50vh]">
        <AlertCircle className="text-rose-500 mb-4" size={48} />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Gagal Memuat Modul</h2>
        <p className="text-slate-500 mb-6">{error || 'Modul tidak ditemukan.'}</p>
        <Link href="/modul-pembelajaran" className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-medium">
          Kembali ke List
        </Link>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link 
          href="/modul-pembelajaran"
          className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors shadow-sm"
        >
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="text-blue-500" size={24} />
            Edit Modul Ajar
          </h1>
          <p className="text-slate-500 text-sm mt-1">Perbarui informasi modul ajar: <span className="font-semibold text-slate-700">{data.title}</span></p>
        </div>
      </div>

      <ModulForm initialData={data} isEdit={true} />
    </div>
  )
}
