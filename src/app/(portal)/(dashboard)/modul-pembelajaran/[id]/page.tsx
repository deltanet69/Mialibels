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
      <div className="mb-12 group print:mb-8">
        <h3 className="text-[1.35rem] font-black text-slate-900 mb-5 flex items-center gap-3 print:text-black">
          <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 print:hidden">
            <CheckCircle2 size={18} strokeWidth={3} />
          </span>
          {title}
        </h3>
        <div className="pl-4 md:pl-11 border-l-[3px] border-slate-100 group-hover:border-blue-300 transition-colors duration-300 print:border-l-0 print:pl-0">
          {isList ? (
            <ul className="list-disc pl-5 space-y-3.5 text-slate-700 leading-loose text-[1.05rem] marker:text-slate-300 print:text-black">
              {children.map((item: string, i: number) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          ) : (
            <div className="text-slate-700 leading-loose text-[1.05rem] whitespace-pre-wrap print:text-black">{children}</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-10 max-w-[1200px] mx-auto space-y-12 animate-in fade-in duration-700 print:p-0 print:m-0 print:w-full print:max-w-full">
      {/* Notion-Style Header */}
      <div className="flex flex-col gap-8 bg-white p-8 md:p-12 rounded-[2.5rem] shadow-[0_2px_40px_rgb(0,0,0,0.03)] border border-slate-100 print:shadow-none print:border-b-2 print:border-black print:rounded-none print:p-0 print:pb-8 print:mb-8">
        
        {/* Breadcrumb & Status */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link 
            href="/modul-pembelajaran"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-400 hover:text-slate-800 transition-colors print:hidden uppercase tracking-wider"
          >
            <ChevronLeft size={16} strokeWidth={3} /> KEMBALI
          </Link>
          
          <div className="flex flex-wrap gap-2 items-center">
            <span className={`px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest rounded-lg ${
              data.status === 'Published' ? 'bg-emerald-100 text-emerald-800' : 
              data.status === 'Draft' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
            }`}>
              {data.status}
            </span>
            <span className="px-3 py-1 bg-slate-900 text-white text-[11px] font-extrabold uppercase tracking-widest rounded-lg">
              Fase {data.phase}
            </span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight print:text-black">
          {data.title}
        </h1>
        
        {/* Metadata Grid */}
        <div className="grid grid-cols-2 md:flex md:flex-wrap gap-x-8 gap-y-6 pt-4 border-t border-slate-100">
          <div>
            <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 mr-16">Mata Pelajaran</p>
            <p className="font-semibold text-slate-800 text-[17px] flex items-center gap-2"><BookOpen size={16} className="text-slate-400" /> {data.subject}</p>
          </div>
          <div> 
            <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 mr-16">Tingkat</p>
            <p className="font-semibold text-slate-800 text-[17px]">Kelas {data.grade}</p>
          </div>
          <div>
            <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 mr-16">Semester</p>
            <p className="font-semibold text-slate-800 text-[17px]">{data.semester}</p>
          </div>
          <div>
            <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 mr-16">Penyusun</p>
            <div className="font-semibold text-slate-800 text-[17px] flex items-center gap-2"><div className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center text-[10px]">{data.admins?.name?.[0] || 'G'}</div> {data.admins?.name || 'Guru'}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-6 print:hidden">
          <Link 
            href={`/modul-pembelajaran/edit/${data.id}`}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all shadow-[0_4px_15px_rgba(0,0,0,0.1)] active:scale-95"
          >
            <Edit3 size={16} /> Edit Modul
          </Link>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl transition-all shadow-sm active:scale-95"
          >
            <Download size={16} /> Cetak PDF
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
          <div className="mb-12 group print:mb-8">
            <h3 className="text-[1.35rem] font-black text-slate-900 mb-5 flex items-center gap-3 print:text-black">
              <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 print:hidden">
                <FileText size={18} strokeWidth={3} />
              </span>
              Asesmen Pembelajaran
            </h3>
            <div className="pl-4 md:pl-11 border-l-[3px] border-slate-100 group-hover:border-emerald-300 transition-colors duration-300 print:border-l-0 print:pl-0 space-y-6">
              {data.assessment_diagnostic && (
                <div>
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-2">Asesmen Diagnostik</h4>
                  <p className="text-slate-700 leading-loose text-[1.05rem]">{data.assessment_diagnostic}</p>
                </div>
              )}
              {data.assessment_formative && (
                <div>
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-2">Asesmen Formatif</h4>
                  <p className="text-slate-700 leading-loose text-[1.05rem]">{data.assessment_formative}</p>
                </div>
              )}
              {data.assessment_summative && (
                <div>
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-2">Asesmen Sumatif</h4>
                  <p className="text-slate-700 leading-loose text-[1.05rem]">{data.assessment_summative}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {(data.teacher_reflection || data.student_reflection) && (
          <div className="mb-12 group print:mb-8">
            <h3 className="text-[1.35rem] font-black text-slate-900 mb-5 flex items-center gap-3 print:text-black">
              <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 print:hidden">
                <CheckCircle2 size={18} strokeWidth={3} />
              </span>
              Refleksi
            </h3>
            <div className="pl-4 md:pl-11 border-l-[3px] border-slate-100 group-hover:border-purple-300 transition-colors duration-300 print:border-l-0 print:pl-0 space-y-6">
              {data.teacher_reflection && (
                <div>
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-2">Refleksi Guru</h4>
                  <p className="text-slate-700 leading-loose text-[1.05rem]">{data.teacher_reflection}</p>
                </div>
              )}
              {data.student_reflection && (
                <div>
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-2">Refleksi Siswa</h4>
                  <p className="text-slate-700 leading-loose text-[1.05rem]">{data.student_reflection}</p>
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
