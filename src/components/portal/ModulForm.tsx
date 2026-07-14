'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bot, ChevronRight, ChevronLeft, Save, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface ModulFormProps {
  initialData?: any
  isEdit?: boolean
}

const STEPS = [
  'Informasi Dasar',
  'Capaian & Tujuan',
  'Materi & Metode',
  'Asesmen & Refleksi',
  'Lampiran & Status'
]

export default function ModulForm({ initialData, isEdit }: ModulFormProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState('')
  const [classrooms, setClassrooms] = useState<any[]>([])

  // Fetch classrooms on mount
  React.useEffect(() => {
    fetch('/api/classrooms')
      .then(res => res.json())
      .then(json => {
        if (json.success) setClassrooms(json.data)
      })
      .catch(err => console.error('Failed to fetch classrooms', err))
  }, [])

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    subject: initialData?.subject || '',
    grade: initialData?.grade || '',
    semester: initialData?.semester || '',
    phase: initialData?.phase || '',
    
    learning_outcomes: initialData?.learning_outcomes || '',
    learning_objectives: initialData?.learning_objectives || [''],
    learning_flow: initialData?.learning_flow || '',
    
    core_materials: initialData?.core_materials || [''],
    teaching_method: initialData?.teaching_method || '',
    
    assessment_diagnostic: initialData?.assessment_diagnostic || '',
    assessment_formative: initialData?.assessment_formative || '',
    assessment_summative: initialData?.assessment_summative || '',
    teacher_reflection: initialData?.teacher_reflection || '',
    student_reflection: initialData?.student_reflection || '',
    
    attachment_url: initialData?.attachment_url || '',
    status: initialData?.status || 'Draft'
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    const updates: any = { [name]: value }
    
    // Auto calculate Fase based on grade (extract first digit from class name like "1A" -> 1)
    if (name === 'grade') {
      const match = value.match(/\d+/)
      if (match) {
        const gradeNum = parseInt(match[0], 10)
        if (gradeNum === 1 || gradeNum === 2) updates.phase = 'A'
        else if (gradeNum === 3 || gradeNum === 4) updates.phase = 'B'
        else if (gradeNum === 5 || gradeNum === 6) updates.phase = 'C'
      }
    }
    
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const handleArrayChange = (field: 'learning_objectives' | 'core_materials', index: number, value: string) => {
    const newArray = [...formData[field]]
    newArray[index] = value
    setFormData({ ...formData, [field]: newArray })
  }

  const addArrayItem = (field: 'learning_objectives' | 'core_materials') => {
    setFormData({ ...formData, [field]: [...formData[field], ''] })
  }

  const removeArrayItem = (field: 'learning_objectives' | 'core_materials', index: number) => {
    const newArray = formData[field].filter((_, i) => i !== index)
    setFormData({ ...formData, [field]: newArray })
  }

  const handleGenerateAI = async () => {
    if (!formData.title || !formData.subject || !formData.grade || !formData.phase) {
      setError('Mohon lengkapi Informasi Dasar (Judul, Mapel, Kelas, Fase) sebelum menggunakan AI.')
      return
    }
    
    setError('')
    setAiLoading(true)
    try {
      const res = await fetch('/api/modul-pembelajaran/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          subject: formData.subject,
          grade: formData.grade,
          phase: formData.phase
        })
      })
      
      const json = await res.json()
      if (json.success) {
        setFormData(prev => ({
          ...prev,
          ...json.data
        }))
        // Move to next step automatically
        if (currentStep === 0) setCurrentStep(1)
      } else {
        setError(json.error || 'Gagal generate konten dengan AI.')
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan jaringan.')
    } finally {
      setAiLoading(false)
    }
  }

  const handleSubmit = async (targetStatus?: string) => {
    setLoading(true)
    setError('')
    try {
      const payload = { ...formData }
      if (targetStatus) payload.status = targetStatus

      const url = isEdit ? `/api/modul-pembelajaran/${initialData.id}` : '/api/modul-pembelajaran'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const json = await res.json()
      if (json.success) {
        router.push('/modul-pembelajaran')
        router.refresh()
      } else {
        setError(json.error || 'Gagal menyimpan modul.')
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan jaringan saat menyimpan.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/60 shadow-[0_2px_30px_rgb(0,0,0,0.03)] overflow-hidden flex flex-col md:flex-row">
      
      {/* Sidebar Steps */}
      <div className="md:w-64 bg-slate-50 border-r border-slate-100 p-6 flex flex-col">
        <h3 className="font-bold text-slate-800 mb-6 uppercase tracking-wider text-xs">Tahapan</h3>
        <div className="flex flex-col gap-2">
          {STEPS.map((step, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`text-left px-4 py-3 rounded-xl transition-all text-sm font-semibold flex items-center gap-3 ${
                currentStep === idx 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : currentStep > idx 
                    ? 'text-blue-600 hover:bg-blue-50' 
                    : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                currentStep === idx ? 'bg-white/20' : currentStep > idx ? 'bg-blue-100' : 'bg-slate-200'
              }`}>
                {currentStep > idx ? <CheckCircle2 size={14} /> : idx + 1}
              </div>
              {step}
            </button>
          ))}
        </div>

        <div className="mt-auto pt-8">
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
            <h4 className="text-sm font-bold text-indigo-800 mb-2 flex items-center gap-2">
              <Bot size={16} /> AI Assistant
            </h4>
            <p className="text-xs text-indigo-600/80 mb-3 leading-relaxed">
              Isi Informasi Dasar, lalu gunakan AI untuk membantu merumuskan kurikulum otomatis.
            </p>
            <button
              onClick={handleGenerateAI}
              disabled={aiLoading}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-70"
            >
              {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Bot size={14} />}
              Generate dengan AI
            </button>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 p-6 md:p-8 flex flex-col max-h-[80vh] overflow-y-auto hide-scrollbar">
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-sm flex items-start gap-3">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="flex-1">
          {/* STEP 1 */}
          {currentStep === 0 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Informasi Dasar</h2>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Judul Modul <span className="text-rose-500">*</span></label>
                <input required type="text" name="title" value={formData.title} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl outline-none transition-all" placeholder="Misal: Fikih Ibadah Puasa" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mata Pelajaran <span className="text-rose-500">*</span></label>
                  <select required name="subject" value={formData.subject} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl outline-none transition-all cursor-pointer">
                    <option value="">Pilih Mapel</option>
                    <option value="Al-Quran Hadis">Al-Quran Hadis</option>
                    <option value="Akidah Akhlak">Akidah Akhlak</option>
                    <option value="Fikih">Fikih</option>
                    <option value="SKI">Sejarah Kebudayaan Islam (SKI)</option>
                    <option value="Bahasa Arab">Bahasa Arab</option>
                    <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                    <option value="Pendidikan Pancasila">Pendidikan Pancasila</option>
                    <option value="Matematika">Matematika</option>
                    <option value="IPAS">IPAS (Ilmu Pengetahuan Alam dan Sosial)</option>
                    <option value="PJOK">PJOK</option>
                    <option value="Seni dan Budaya">Seni dan Budaya</option>
                    <option value="Bahasa Inggris">Bahasa Inggris</option>
                    <option value="Muatan Lokal">Muatan Lokal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kelas <span className="text-rose-500">*</span></label>
                  <select required name="grade" value={formData.grade} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl outline-none transition-all cursor-pointer">
                    <option value="">Pilih Kelas</option>
                    {classrooms.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Fase <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-medium">Otomatis dari Kelas</span>
                  </label>
                  <input readOnly type="text" name="phase" value={formData.phase ? `Fase ${formData.phase}` : ''} className="w-full p-3 bg-slate-100 text-slate-500 border border-slate-200 rounded-xl outline-none cursor-not-allowed" placeholder="Otomatis" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Semester <span className="text-rose-500">*</span></label>
                  <select required name="semester" value={formData.semester} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl outline-none transition-all cursor-pointer">
                    <option value="">Pilih Semester</option>
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Capaian & Tujuan Pembelajaran</h2>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Capaian Pembelajaran (CP)</label>
                <textarea name="learning_outcomes" value={formData.learning_outcomes} onChange={handleChange} rows={4} className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl outline-none transition-all" placeholder="Tuliskan capaian pembelajaran akhir fase..." />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex justify-between items-center">
                  Tujuan Pembelajaran (TP)
                  <button onClick={() => addArrayItem('learning_objectives')} className="text-xs text-blue-600 hover:text-blue-700">+ Tambah TP</button>
                </label>
                <div className="space-y-3">
                  {formData.learning_objectives.map((tp, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-8 h-12 flex items-center justify-center bg-slate-100 rounded-xl text-slate-500 font-semibold">{i+1}</div>
                      <input type="text" value={tp} onChange={(e) => handleArrayChange('learning_objectives', i, e.target.value)} className="flex-1 p-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl outline-none transition-all" placeholder={`Tujuan Pembelajaran ${i+1}`} />
                      {formData.learning_objectives.length > 1 && (
                        <button onClick={() => removeArrayItem('learning_objectives', i)} className="p-3 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors"><Trash2 size={18} /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Alur Tujuan Pembelajaran (ATP)</label>
                <textarea name="learning_flow" value={formData.learning_flow} onChange={handleChange} rows={4} className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl outline-none transition-all" placeholder="Jelaskan alur atau urutan pencapaian materi..." />
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Materi & Metode</h2>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex justify-between items-center">
                  Materi Pokok
                  <button onClick={() => addArrayItem('core_materials')} className="text-xs text-blue-600 hover:text-blue-700">+ Tambah Materi</button>
                </label>
                <div className="space-y-3">
                  {formData.core_materials.map((mat, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-8 h-12 flex items-center justify-center bg-slate-100 rounded-xl text-slate-500 font-semibold">{i+1}</div>
                      <input type="text" value={mat} onChange={(e) => handleArrayChange('core_materials', i, e.target.value)} className="flex-1 p-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl outline-none transition-all" placeholder={`Materi Pokok ${i+1}`} />
                      {formData.core_materials.length > 1 && (
                        <button onClick={() => removeArrayItem('core_materials', i)} className="p-3 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors"><Trash2 size={18} /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Metode Pembelajaran</label>
                <textarea name="teaching_method" value={formData.teaching_method} onChange={handleChange} rows={4} className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl outline-none transition-all" placeholder="Misal: Problem Based Learning, Diskusi, Ceramah interaktif..." />
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Asesmen & Refleksi</h2>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Asesmen Diagnostik (Awal)</label>
                <textarea name="assessment_diagnostic" value={formData.assessment_diagnostic} onChange={handleChange} rows={3} className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl outline-none transition-all" placeholder="Pertanyaan pemantik atau tes awal..." />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Asesmen Formatif (Proses)</label>
                <textarea name="assessment_formative" value={formData.assessment_formative} onChange={handleChange} rows={3} className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl outline-none transition-all" placeholder="Penilaian selama proses pembelajaran berlangsung..." />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Asesmen Sumatif (Akhir)</label>
                <textarea name="assessment_summative" value={formData.assessment_summative} onChange={handleChange} rows={3} className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl outline-none transition-all" placeholder="Penilaian akhir kompetensi..." />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Refleksi Guru</label>
                  <textarea name="teacher_reflection" value={formData.teacher_reflection} onChange={handleChange} rows={3} className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl outline-none transition-all" placeholder="Pertanyaan panduan refleksi guru..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Refleksi Siswa</label>
                  <textarea name="student_reflection" value={formData.student_reflection} onChange={handleChange} rows={3} className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl outline-none transition-all" placeholder="Pertanyaan panduan refleksi siswa..." />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5 */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Lampiran & Status Publikasi</h2>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">URL Lampiran (Opsional)</label>
                <input type="url" name="attachment_url" value={formData.attachment_url} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl outline-none transition-all" placeholder="https://drive.google.com/..." />
                <p className="text-xs text-slate-500 mt-2">Masukkan tautan Google Drive / dokumen lain terkait materi pendukung.</p>
              </div>
              
              <div className="pt-6 border-t border-slate-100">
                <label className="block text-sm font-semibold text-slate-700 mb-3">Tindakan Penyimpanan</label>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => handleSubmit('Draft')}
                    disabled={loading}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
                  >
                    {loading && formData.status === 'Draft' ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Simpan sebagai Draft
                  </button>
                  <button 
                    onClick={() => handleSubmit('Published')}
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-70"
                  >
                    {loading && formData.status === 'Published' ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    Publikasikan Modul
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Bottom */}
        <div className="flex justify-between items-center mt-10 pt-6 border-t border-slate-100">
          <button 
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} /> Kembali
          </button>
          
          {currentStep < 4 && (
            <button 
              onClick={() => setCurrentStep(prev => Math.min(4, prev + 1))}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              Lanjut <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
