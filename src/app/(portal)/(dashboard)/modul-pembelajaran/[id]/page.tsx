'use client'

import React, { useEffect, useState } from 'react'
import { BookOpen, ChevronLeft, Loader2, AlertCircle, Edit3, Download, FileText, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function DetailModulPage() {
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
        <p className="text-slate-500 font-medium">Memuat pratinjau modul...</p>
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

  const Section = ({ title, children, isList = false }: any) => {
    if (!children || (Array.isArray(children) && children.length === 0) || (Array.isArray(children) && children[0] === '')) return null;
    return (
      <div className="mb-8 bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
          <CheckCircle2 size={20} className="text-blue-500" /> {title}
        </h3>
        {isList ? (
          <ul className="list-disc pl-5 space-y-2 text-slate-700 leading-relaxed">
            {children.map((item: string, i: number) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        ) : (
          <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">{children}</div>
        )}
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200/60 shadow-sm relative overflow-hidden">
        {/* Decorative BG */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 blur-3xl"></div>

        <div className="relative z-10 space-y-4 flex-1">
          <Link 
            href="/modul-pembelajaran"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-2"
          >
            <ChevronLeft size={16} /> Kembali ke List Modul
          </Link>
          
          <div className="flex flex-wrap gap-2 items-center">
            <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border shadow-sm ${
              data.status === 'Published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
              data.status === 'Draft' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-700 border-slate-200'
            }`}>
              {data.status}
            </span>
            <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold rounded-full">
              Fase {data.phase}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight">
            {data.title}
          </h1>
          
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600 font-medium">
            <div className="flex items-center gap-1.5">
              <BookOpen size={16} className="text-blue-500" />
              <span>{data.subject}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
              <span>Kelas {data.grade}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
              <span>Semester {data.semester}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
              <span>Oleh: {data.admins?.name || 'Guru'}</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-row md:flex-col gap-3 min-w-[140px]">
          <Link 
            href={`/modul-pembelajaran/edit/${data.id}`}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg hover:shadow-blue-500/20"
          >
            <Edit3 size={18} /> Edit Modul
          </Link>
          <button 
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-semibold transition-all shadow-sm"
          >
            <Download size={18} /> Cetak PDF
          </button>
        </div>
      </div>

      {/* Content Preview (A4 style look) */}
      <div className="print:m-0 print:shadow-none print:border-none">
        <Section title="Capaian Pembelajaran (CP)">
          {data.learning_outcomes}
        </Section>

        <Section title="Tujuan Pembelajaran (TP)" isList={true}>
          {data.learning_objectives}
        </Section>

        <Section title="Alur Tujuan Pembelajaran (ATP)">
          {data.learning_flow}
        </Section>

        <Section title="Materi Pokok" isList={true}>
          {data.core_materials}
        </Section>

        <Section title="Metode Pembelajaran">
          {data.teaching_method}
        </Section>

        {(data.assessment_diagnostic || data.assessment_formative || data.assessment_summative) && (
          <div className="mb-8 bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
              <FileText size={20} className="text-blue-500" /> Asesmen Pembelajaran
            </h3>
            <div className="space-y-4">
              {data.assessment_diagnostic && (
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">Asesmen Diagnostik</h4>
                  <p className="text-slate-700">{data.assessment_diagnostic}</p>
                </div>
              )}
              {data.assessment_formative && (
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">Asesmen Formatif</h4>
                  <p className="text-slate-700">{data.assessment_formative}</p>
                </div>
              )}
              {data.assessment_summative && (
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">Asesmen Sumatif</h4>
                  <p className="text-slate-700">{data.assessment_summative}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {(data.teacher_reflection || data.student_reflection) && (
          <div className="mb-8 bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-blue-500" /> Refleksi
            </h3>
            <div className="space-y-4">
              {data.teacher_reflection && (
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">Refleksi Guru</h4>
                  <p className="text-slate-700">{data.teacher_reflection}</p>
                </div>
              )}
              {data.student_reflection && (
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">Refleksi Siswa</h4>
                  <p className="text-slate-700">{data.student_reflection}</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {data.attachment_url && (
          <Section title="Lampiran / Media">
            <a href={data.attachment_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              {data.attachment_url}
            </a>
          </Section>
        )}
      </div>
    </div>
  )
}
