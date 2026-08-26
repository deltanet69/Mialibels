'use client'

import React, { useState, useMemo } from 'react'
import { User, Users, CreditCard, Sparkles, Check, ArrowRight, ArrowLeft, UploadCloud, Copy, CheckCircle2, AlertTriangle, Loader2, Info, Building2, QrCode } from 'lucide-react'
import PpdbSuccessModal from './PpdbSuccessModal'

type SettingsData = {
  academic_year: string
  is_active: boolean
  active_batch: number
  batch_1_quota: number
  batch_2_quota: number
  batch_3_quota: number
  registration_fee: number
  bank_name: string
  bank_account_number: string
  bank_account_holder: string
  whatsapp_contact?: string
  qris_image_url?: string
}

type PpdbRegistrationFormProps = {
  settings: SettingsData
}

export default function PpdbRegistrationForm({ settings }: PpdbRegistrationFormProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedBank, setCopiedBank] = useState(false)
  const [uploadingProof, setUploadingProof] = useState(false)

  // Success modal state
  const [successData, setSuccessData] = useState<any | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    // Calon Siswa
    student_name: '',
    student_nickname: '',
    birth_place: '',
    birth_date: '',
    gender: 'Laki-laki',
    weight: '',
    height: '',
    blood_type: 'A',
    nisn: '',
    previous_school: '',
    special_needs: '',
    medical_history: '',

    // Data Orang Tua
    father_name: '',
    father_nik: '',
    father_occupation: '',
    father_phone: '',
    father_email: '',
    mother_name: '',
    mother_nik: '',
    mother_occupation: '',
    mother_phone: '',
    mother_email: '',
    home_address: '',

    // Pembayaran
    payment_method: 'transfer_btn',
    payment_proof_url: ''
  })

  // Live Age Calculation (Cutoff: 1 Juli 2027)
  const calculatedAge = useMemo(() => {
    if (!formData.birth_date) return null
    const birthDate = new Date(formData.birth_date)
    if (isNaN(birthDate.getTime())) return null

    const cutoffDate = new Date(2027, 6, 1) // 1 Juli 2027
    let years = cutoffDate.getFullYear() - birthDate.getFullYear()
    let months = cutoffDate.getMonth() - birthDate.getMonth()
    let days = cutoffDate.getDate() - birthDate.getDate()

    if (days < 0) months -= 1
    if (months < 0) {
      years -= 1
      months += 12
    }

    const totalMonths = years * 12 + months
    const isValid = totalMonths >= 78 // Minimum 6 years 6 months

    return {
      years,
      months,
      totalMonths,
      isValid
    }
  }, [formData.birth_date])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (error) setError(null)
  }

  // Handle Payment Proof Upload
  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingProof(true)
    setError(null)

    try {
      const data = new FormData()
      data.append('file', file)
      data.append('folder', 'ppdb/payments')

      const res = await fetch('/api/ppdb/upload', {
        method: 'POST',
        body: data
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal mengunggah bukti pembayaran')

      setFormData(prev => ({ ...prev, payment_proof_url: json.url }))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploadingProof(false)
    }
  }

  const handleCopyBank = () => {
    navigator.clipboard.writeText(settings.bank_account_number || '00129-01-30-00015-9')
    setCopiedBank(true)
    setTimeout(() => setCopiedBank(false), 2000)
  }

  // Validate Step 1
  const validateStep1 = () => {
    if (!formData.student_name.trim()) return 'Nama lengkap calon siswa wajib diisi.'
    if (!formData.birth_place.trim()) return 'Tempat lahir wajib diisi.'
    if (!formData.birth_date) return 'Tanggal lahir wajib diisi.'
    if (!formData.weight || Number(formData.weight) <= 0) return 'Berat badan wajib diisi.'
    if (!formData.height || Number(formData.height) <= 0) return 'Tinggi badan wajib diisi.'
    if (calculatedAge && !calculatedAge.isValid) {
      return `Usia calon siswa pada 1 Juli 2027 adalah ${calculatedAge.years} tahun ${calculatedAge.months} bulan. Syarat usia minimum pendaftaran adalah 6 tahun 6 bulan.`
    }
    return null
  }

  // Validate Step 2
  const validateStep2 = () => {
    if (!formData.father_name.trim()) return 'Nama ayah wajib diisi.'
    if (!formData.father_nik.trim() || formData.father_nik.length < 16) return 'NIK Ayah wajib 16 digit angka.'
    if (!formData.father_occupation.trim()) return 'Pekerjaan ayah wajib diisi.'
    if (!formData.father_phone.trim()) return 'Nomor WhatsApp ayah wajib diisi.'
    if (!formData.father_email.trim() || !formData.father_email.includes('@')) return 'Email aktif ayah wajib diisi dengan benar.'
    if (!formData.mother_name.trim()) return 'Nama ibu wajib diisi.'
    if (!formData.mother_nik.trim() || formData.mother_nik.length < 16) return 'NIK Ibu wajib 16 digit angka.'
    if (!formData.mother_occupation.trim()) return 'Pekerjaan ibu wajib diisi.'
    if (!formData.mother_phone.trim()) return 'Nomor WhatsApp ibu wajib diisi.'
    return null
  }

  // Step Navigation
  const handleNext = () => {
    if (currentStep === 1) {
      const err = validateStep1()
      if (err) {
        setError(err)
        return
      }
      setCurrentStep(2)
      window.scrollTo({ top: 300, behavior: 'smooth' })
    } else if (currentStep === 2) {
      const err = validateStep2()
      if (err) {
        setError(err)
        return
      }
      setCurrentStep(3)
      window.scrollTo({ top: 300, behavior: 'smooth' })
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as any)
      setError(null)
      window.scrollTo({ top: 300, behavior: 'smooth' })
    }
  }

  // Final Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (currentStep !== 3) return

    if (!formData.payment_proof_url) {
      setError('Harap upload bukti transfer/pembayaran pendaftaran terlebih dahulu.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/ppdb/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal mengirimkan formulir pendaftaran')

      setSuccessData(data.data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="font-sans w-full max-w-6xl mx-auto space-y-6">
      
      {/* ════════════════════════════════════════════════════════════════════
          STEPPER PROGRESS BAR (Mobile-First & Clear)
         ════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between relative">
          
          {/* Progress Connecting Line */}
          <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-1 bg-slate-100 -z-0">
            <div 
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%' }}
            />
          </div>

          {/* Step 1 Pill */}
          <div className="relative z-10 flex flex-col items-center gap-1.5">
            <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm transition-all ${
              currentStep > 1 
                ? 'bg-blue-600 text-white shadow-sm' 
                : currentStep === 1 
                  ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-sm' 
                  : 'bg-white border-2 border-slate-200 text-slate-400'
            }`}>
              {currentStep > 1 ? <Check size={16} className="stroke-[3]" /> : <User size={16} />}
            </div>
            <span className={`text-[11px] sm:text-xs font-bold ${currentStep >= 1 ? 'text-slate-900' : 'text-slate-400'}`}>
              1. Calon Siswa
            </span>
          </div>

          {/* Step 2 Pill */}
          <div className="relative z-10 flex flex-col items-center gap-1.5">
            <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm transition-all ${
              currentStep > 2 
                ? 'bg-blue-600 text-white shadow-sm' 
                : currentStep === 2 
                  ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-sm' 
                  : 'bg-white border-2 border-slate-200 text-slate-400'
            }`}>
              {currentStep > 2 ? <Check size={16} className="stroke-[3]" /> : <Users size={16} />}
            </div>
            <span className={`text-[11px] sm:text-xs font-bold ${currentStep >= 2 ? 'text-slate-900' : 'text-slate-400'}`}>
              2. Orang Tua
            </span>
          </div>

          {/* Step 3 Pill */}
          <div className="relative z-10 flex flex-col items-center gap-1.5">
            <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm transition-all ${
              currentStep === 3 
                ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-sm' 
                : 'bg-white border-2 border-slate-200 text-slate-400'
            }`}>
              <CreditCard size={16} />
            </div>
            <span className={`text-[11px] sm:text-xs font-bold ${currentStep === 3 ? 'text-slate-900' : 'text-slate-400'}`}>
              3. Pembayaran
            </span>
          </div>

        </div>
      </div>

      {/* Error Alert Box */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs sm:text-sm text-rose-800 animate-in fade-in duration-200">
          <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-semibold">{error}</div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          MAIN FORM CONTAINER
         ════════════════════════════════════════════════════════════════════ */}
      <form onSubmit={handleSubmit} className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-200/80 shadow-2xs space-y-6">
        
        {/* ════════════════════════════════════════════════════════════════════
            STEP 1: DATA CALON SISWA
           ════════════════════════════════════════════════════════════════════ */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block mb-1">
                Langkah 1 Dari 3
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Informasi Calon Siswa
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pastikan data nama dan tanggal lahir sesuai dengan Akta Kelahiran resmi.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Nama Lengkap */}
              <div className="sm:col-span-2 space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Nama Lengkap Calon Siswa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="student_name"
                  value={formData.student_name}
                  onChange={handleChange}
                  placeholder="Contoh: Muhammad Rayhan Pratama"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition outline-none"
                />
              </div>

              {/* Nama Panggilan */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Nama Panggilan
                </label>
                <input
                  type="text"
                  name="student_nickname"
                  value={formData.student_nickname}
                  onChange={handleChange}
                  placeholder="Contoh: Rayhan"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition outline-none"
                />
              </div>

              {/* Jenis Kelamin */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Jenis Kelamin <span className="text-rose-500">*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition outline-none cursor-pointer"
                >
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>

              {/* Tempat Lahir */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Tempat Lahir <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="birth_place"
                  value={formData.birth_place}
                  onChange={handleChange}
                  placeholder="Contoh: Bekasi"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition outline-none"
                />
              </div>

              {/* Tanggal Lahir */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Tanggal Lahir <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  name="birth_date"
                  value={formData.birth_date}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition outline-none"
                />
              </div>

              {/* Age Feedback Notification Box */}
              {calculatedAge && (
                <div className={`sm:col-span-2 p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                  calculatedAge.isValid 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  <div className="flex items-center gap-2">
                    {calculatedAge.isValid ? (
                      <CheckCircle2 size={17} className="text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle size={17} className="text-rose-600 shrink-0" />
                    )}
                    <div>
                      <span className="font-bold">
                        Usia per 1 Juli 2027: {calculatedAge.years} Thn {calculatedAge.months} Bln
                      </span>
                      <p className="text-[11px] opacity-80">
                        {calculatedAge.isValid 
                          ? '✅ Memenuhi syarat usia minimum (6 thn 6 bln).' 
                          : '⚠️ Belum memenuhi syarat minimum (6 thn 6 bln).'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase shrink-0 ${
                    calculatedAge.isValid ? 'bg-emerald-200/60 text-emerald-800' : 'bg-rose-200/60 text-rose-800'
                  }`}>
                    {calculatedAge.isValid ? 'Valid' : 'Kurang Usia'}
                  </span>
                </div>
              )}

              {/* Berat Badan */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Berat Badan (kg) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="Contoh: 20"
                  required
                  min={10}
                  max={100}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition outline-none"
                />
              </div>

              {/* Tinggi Badan */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Tinggi Badan (cm) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  placeholder="Contoh: 115"
                  required
                  min={50}
                  max={200}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition outline-none"
                />
              </div>

              {/* Golongan Darah */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Golongan Darah
                </label>
                <select
                  name="blood_type"
                  value={formData.blood_type}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition outline-none cursor-pointer"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="AB">AB</option>
                  <option value="O">O</option>
                  <option value="-">Belum Tahu</option>
                </select>
              </div>

              {/* Asal TK / RA */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  Asal TK / RA / PAUD
                </label>
                <input
                  type="text"
                  name="previous_school"
                  value={formData.previous_school}
                  onChange={handleChange}
                  placeholder="Contoh: RA Attaqwa 15"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition outline-none"
                />
              </div>

            </div>

            {/* Step 1 Actions */}
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleNext}
                className="btn-tactile w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-blue-600/25 transition cursor-pointer"
              >
                <span>Lanjut ke Langkah 2: Data Orang Tua</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            STEP 2: DATA ORANG TUA / WALI
           ════════════════════════════════════════════════════════════════════ */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block mb-1">
                Langkah 2 Dari 3
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Informasi Orang Tua / Wali
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pastikan nomor WhatsApp dan Email aktif untuk menerima notifikasi status kelulusan.
              </p>
            </div>

            {/* Data Ayah */}
            <div className="space-y-3 pt-1">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block pb-1 border-b border-slate-100">
                👨 Data Identitas Ayah
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Nama Lengkap Ayah <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="father_name"
                    value={formData.father_name}
                    onChange={handleChange}
                    placeholder="Contoh: Rahmat Hidayat"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    NIK Ayah (16 Digit) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="father_nik"
                    value={formData.father_nik}
                    onChange={handleChange}
                    placeholder="327501..."
                    maxLength={16}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Pekerjaan Ayah <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="father_occupation"
                    value={formData.father_occupation}
                    onChange={handleChange}
                    placeholder="Contoh: Karyawan Swasta / Wiraswasta"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    No. WhatsApp Ayah <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="father_phone"
                    value={formData.father_phone}
                    onChange={handleChange}
                    placeholder="Contoh: 081234567890"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition outline-none"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Email Aktif Ayah / Keluarga <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="father_email"
                    value={formData.father_email}
                    onChange={handleChange}
                    placeholder="Contoh: rahmat@gmail.com"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Data Ibu */}
            <div className="space-y-3 pt-3">
              <span className="text-xs font-bold text-teal-900 uppercase tracking-wider block pb-1 border-b border-slate-100">
                👩 Data Identitas Ibu
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Nama Lengkap Ibu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="mother_name"
                    value={formData.mother_name}
                    onChange={handleChange}
                    placeholder="Contoh: Siti Aminah"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    NIK Ibu (16 Digit) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="mother_nik"
                    value={formData.mother_nik}
                    onChange={handleChange}
                    placeholder="327501..."
                    maxLength={16}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Pekerjaan Ibu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="mother_occupation"
                    value={formData.mother_occupation}
                    onChange={handleChange}
                    placeholder="Contoh: Ibu Rumah Tangga / Guru"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    No. WhatsApp Ibu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="mother_phone"
                    value={formData.mother_phone}
                    onChange={handleChange}
                    placeholder="Contoh: 081298765432"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Alamat Domisili */}
            <div className="space-y-1 pt-2">
              <label className="block text-xs font-bold text-slate-700">
                Alamat Tempat Tinggal Sekarang
              </label>
              <textarea
                name="home_address"
                value={formData.home_address}
                onChange={handleChange}
                placeholder="Contoh: Jl. Raya Babelan No. 15, RT 02/RW 03, Babelan Kota"
                rows={2}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition outline-none"
              />
            </div>

            {/* Step 2 Actions */}
            <div className="flex flex-col-reverse sm:flex-row justify-between gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handlePrev}
                className="btn-tactile flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer"
              >
                <ArrowLeft size={16} />
                <span>Kembali</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="btn-tactile flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-blue-600/25 transition cursor-pointer"
              >
                <span>Lanjut ke Langkah 3: Pembayaran</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            STEP 3: PEMBAYARAN & UPLOAD STRUK
           ════════════════════════════════════════════════════════════════════ */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block mb-1">
                Langkah 3 Dari 3
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Biaya Formulir &amp; Bukti Pembayaran
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Transfer biaya pendaftaran sebesar <strong>Rp {(Number(settings.registration_fee) || 200000).toLocaleString('id-ID')}</strong> ke rekening resmi madrasah.
              </p>
            </div>

            {/* Bank Card Info */}
            <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white p-5 sm:p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider">Rekening Resmi PPDB</span>
                  <h3 className="text-lg font-black text-white">{settings.bank_name || 'Bank BTN'}</h3>
                </div>
                <Building2 size={24} className="text-blue-300" />
              </div>

              <div className="bg-white/10 backdrop-blur-sm p-3.5 rounded-xl border border-white/15 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-blue-200 uppercase tracking-wider block">Nomor Rekening</span>
                  <span className="font-mono text-base sm:text-lg font-bold text-amber-300">
                    {settings.bank_account_number || '00129-01-30-00015-9'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyBank}
                  className="btn-tactile px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5"
                >
                  <Copy size={13} />
                  <span>{copiedBank ? 'Tersalin!' : 'Salin'}</span>
                </button>
              </div>

              <div className="flex justify-between text-xs text-blue-200 border-t border-white/10 pt-2">
                <span>Atas Nama: <strong>{settings.bank_account_holder || 'MI ATTAQWA 15 BABELAN'}</strong></span>
                <span>Nominal: <strong>Rp {(Number(settings.registration_fee) || 200000).toLocaleString('id-ID')}</strong></span>
              </div>
            </div>

            {/* Upload Struk Area */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Upload Foto Struk / Bukti Transfer <span className="text-rose-500">*</span>
              </label>

              <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-5 text-center transition bg-slate-50/60 relative">
                {uploadingProof ? (
                  <div className="py-6 flex flex-col items-center gap-2 text-blue-600">
                    <Loader2 size={28} className="animate-spin" />
                    <span className="text-xs font-bold">Mengunggah &amp; mengompresi gambar...</span>
                  </div>
                ) : formData.payment_proof_url ? (
                  <div className="py-2 flex flex-col items-center gap-2">
                    <CheckCircle2 size={32} className="text-emerald-500" />
                    <span className="text-xs font-bold text-emerald-800">Bukti Pembayaran Berhasil Diunggah!</span>
                    <a
                      href={formData.payment_proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline font-semibold"
                    >
                      Lihat Foto Struk
                    </a>
                    <label className="mt-1 text-[11px] text-slate-500 hover:text-slate-700 cursor-pointer underline">
                      Ganti Foto Struk
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProofUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-2 py-4">
                    <UploadCloud size={32} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-700">
                      Ketuk untuk Memilih Foto Struk / Bukti Bayar
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Format JPG, PNG, atau WEBP (Maks 10MB)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProofUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Step 3 Actions */}
            <div className="flex flex-col-reverse sm:flex-row justify-between gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handlePrev}
                disabled={loading}
                className="btn-tactile flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer"
              >
                <ArrowLeft size={16} />
                <span>Kembali</span>
              </button>

              <button
                type="submit"
                disabled={loading || uploadingProof}
                className="btn-tactile flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/25 transition cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Memproses Pendaftaran...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Kirim Formulir Pendaftaran</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </form>

      {/* Success Modal Slip */}
      {successData && (
        <PpdbSuccessModal
          data={successData}
          whatsappContact={settings.whatsapp_contact}
          onClose={() => setSuccessData(null)}
        />
      )}

    </div>
  )
}
