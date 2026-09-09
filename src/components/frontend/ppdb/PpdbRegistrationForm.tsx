'use client'

import React, { useState, useMemo } from 'react'
import {
  User,
  Users,
  CreditCard,
  Sparkles,
  Check,
  ArrowRight,
  ArrowLeft,
  UploadCloud,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Info,
  Building2,
  FileCheck,
  ShieldCheck,
  Calendar,
  HeartHandshake,
  AlertCircle,
  FileText
} from 'lucide-react'
import PpdbSuccessModal from './PpdbSuccessModal'

type SettingsData = {
  academic_year: string
  is_active: boolean
  active_batch?: number
  batch_1_quota?: number
  registration_fee: number
  bank_name: string
  bank_account_number: string
  bank_account_holder: string
  whatsapp_contact?: string
  qris_image_url?: string
  stats?: {
    total: number
    totalQuota: number
    isTotalFull: boolean
    fullday?: {
      total: number
      approved: number
      quota: number
      isFull: boolean
    }
    regular?: {
      total: number
      approved: number
      quota: number
      isFull: boolean
    }
  }
}

type PpdbRegistrationFormProps = {
  settings: SettingsData
}

export default function PpdbRegistrationForm({ settings }: PpdbRegistrationFormProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedBank, setCopiedBank] = useState(false)

  // Upload States
  const [uploadingField, setUploadingField] = useState<string | null>(null)

  // Success modal state
  const [successData, setSuccessData] = useState<any | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    // 1. Data Siswa
    student_name: '',
    nisn: '',
    birth_place: '',
    birth_date: '',
    gender: 'Laki-laki',
    religion: 'Islam',
    class_program: 'regular', // 'fullday' | 'regular'

    // 2. Data Orang Tua / Wali
    parent_name: '',
    parent_nik: '',
    parent_occupation: '',
    parent_religion: 'Islam',
    parent_relation: 'Ayah Kandung',
    parent_phone: '',
    parent_email: '',
    home_address: '',

    // 3. Dokumen Pendukung
    document_birth_certificate: '',
    document_family_card: '',
    document_parent_id: '',
    document_report_card: '',

    // 4. Declaration Checklist
    declaration_agreed: false,

    // 5. Pembayaran
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
    const isValid = totalMonths >= 72 // Minimum 6 years

    return {
      years,
      months,
      totalMonths,
      isValid
    }
  }, [formData.birth_date])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
    if (error) setError(null)
  }

  // Handle generic file upload for documents & payment proof
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string, folder = 'ppdb/documents') => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingField(fieldName)
    setError(null)

    try {
      const data = new FormData()
      data.append('file', file)
      data.append('folder', folder)

      const res = await fetch('/api/spmb/upload', {
        method: 'POST',
        body: data
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal mengunggah berkas')

      setFormData(prev => ({ ...prev, [fieldName]: json.url }))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploadingField(null)
    }
  }

  const handleCopyBank = () => {
    navigator.clipboard.writeText(settings.bank_account_number || '00129-01-30-00015-9')
    setCopiedBank(true)
    setTimeout(() => setCopiedBank(false), 2000)
  }

  // Step 1 Validation
  const validateStep1 = () => {
    if (!formData.student_name.trim()) return 'Nama lengkap calon siswa wajib diisi.'
    if (!formData.birth_place.trim()) return 'Tempat lahir calon siswa wajib diisi.'
    if (!formData.birth_date) return 'Tanggal lahir calon siswa wajib diisi.'
    if (!formData.gender) return 'Jenis kelamin calon siswa wajib dipilih.'
    if (!formData.religion) return 'Agama calon siswa wajib diisi.'
    if (!formData.class_program) return 'Pilihan program kelas (Fullday / Regular) wajib dipilih.'
    
    if (formData.class_program === 'fullday' && settings.stats?.fullday?.isFull) {
      return 'Kuota Kelas Fullday (Maksimal 30 Siswa) telah terpenuhi. Silakan pilih Kelas Regular.'
    }

    if (calculatedAge && !calculatedAge.isValid) {
      return `Usia calon siswa pada 1 Juli 2027 adalah ${calculatedAge.years} tahun ${calculatedAge.months} bulan. Syarat usia minimum pendaftaran adalah 6 tahun.`
    }
    return null
  }

  // Step 2 Validation
  const validateStep2 = () => {
    if (!formData.parent_name.trim()) return 'Nama lengkap orang tua/wali wajib diisi.'
    if (!formData.parent_nik.trim() || formData.parent_nik.length !== 16 || !/^\d{16}$/.test(formData.parent_nik.trim())) {
      return 'NIK Orang Tua/Wali wajib 16 digit angka.'
    }
    if (!formData.parent_occupation.trim()) return 'Pekerjaan orang tua/wali wajib diisi.'
    if (!formData.parent_religion.trim()) return 'Agama orang tua/wali wajib diisi.'
    if (!formData.parent_relation.trim()) return 'Hubungan keluarga wajib dipilih.'
    if (!formData.parent_phone.trim()) return 'Nomor WhatsApp aktif orang tua/wali wajib diisi.'
    if (!formData.parent_email.trim() || !formData.parent_email.includes('@')) {
      return 'Email aktif orang tua/wali wajib diisi dengan benar untuk pengiriman bukti pendaftaran.'
    }
    if (!formData.home_address.trim()) return 'Alamat lengkap tempat tinggal wajib diisi.'
    return null
  }

  // Step 3 Validation
  const validateStep3 = () => {
    if (!formData.document_birth_certificate) return 'Akta Kelahiran calon siswa wajib diunggah.'
    if (!formData.document_family_card) return 'Kartu Keluarga (KK) wajib diunggah.'
    if (!formData.document_parent_id) return 'KTP Orang Tua/Wali wajib diunggah.'
    if (!formData.declaration_agreed) {
      return 'Anda wajib mencentang persetujuan Surat Pernyataan Calon Siswa & Wali Murid untuk melanjutkan.'
    }
    return null
  }

  // Next Step Action
  const handleNext = () => {
    setError(null)
    if (currentStep === 1) {
      const err = validateStep1()
      if (err) {
        setError(err)
        return
      }
      setCurrentStep(2)
    } else if (currentStep === 2) {
      const err = validateStep2()
      if (err) {
        setError(err)
        return
      }
      setCurrentStep(3)
    } else if (currentStep === 3) {
      const err = validateStep3()
      if (err) {
        setError(err)
        return
      }
      setCurrentStep(4)
    }
  }

  // Prev Step Action
  const handlePrev = () => {
    setError(null)
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as any)
    }
  }

  // Final Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.payment_proof_url) {
      setError('Bukti transfer pembayaran biaya pendaftaran wajib diunggah.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/spmb/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || 'Gagal mengirimkan formulir pendaftaran')
      }

      setSuccessData({
        ...json.data,
        father_name: formData.parent_name,
        father_phone: formData.parent_phone,
        temporaryPassword: json.temporaryPassword
      })
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memproses pendaftaran.')
    } finally {
      setLoading(false)
    }
  }

  const isClosed = !settings.is_active || settings.stats?.isTotalFull
  const fulldayIsFull = Boolean(settings.stats?.fullday?.isFull)

  if (isClosed) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm text-center max-w-2xl mx-auto space-y-4">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-2">
          <AlertTriangle size={32} />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 font-headline">Pendaftaran SPMB Ditutup</h3>
        <p className="text-slate-600 text-sm leading-relaxed">
          Pendaftaran Sistem Penerimaan Murid Baru (SPMB) Tahun Ajaran {settings.academic_year} saat ini sedang ditutup atau kuota penerimaan telah terpenuhi.
        </p>
        <div className="pt-3">
          <a
            href={`https://wa.me/${(settings.whatsapp_contact || '6281234567890').replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold text-sm px-6 py-3 rounded-2xl hover:bg-blue-700 transition shadow-sm"
          >
            <span>Hubungi Panitia SPMB</span>
            <ArrowRight size={16} />
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="font-sans w-full max-w-4xl mx-auto">
      
      {/* ── STEP INDICATOR (4 STEPS) ── */}
      <div className="mb-8">
        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          {[
            { step: 1, title: 'Data Siswa', icon: User },
            { step: 2, title: 'Data Orang Tua', icon: Users },
            { step: 3, title: 'Dokumen & Janji', icon: FileCheck },
            { step: 4, title: 'Pembayaran', icon: CreditCard }
          ].map((item) => {
            const Icon = item.icon
            const isPassed = currentStep > item.step
            const isCurrent = currentStep === item.step
            return (
              <div
                key={item.step}
                className={`flex flex-col items-center p-3 rounded-2xl border transition-all text-center ${
                  isCurrent
                    ? 'bg-blue-50/80 border-blue-500/40 text-blue-700 shadow-xs'
                    : isPassed
                    ? 'bg-emerald-50/70 border-emerald-300/60 text-emerald-700'
                    : 'bg-white border-slate-200/80 text-slate-400'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center mb-1.5 transition-colors ${
                    isCurrent
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : isPassed
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isPassed ? <Check size={16} className="stroke-[2.5]" /> : <Icon size={16} />}
                </div>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider block">
                  Langkah {item.step}
                </span>
                <span className="text-xs font-bold hidden sm:block truncate max-w-full">
                  {item.title}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── ERROR NOTIFICATION BOX ── */}
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 animate-in fade-in duration-200">
          <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">{error}</div>
        </div>
      )}

      {/* ── MAIN FORM CONTAINER ── */}
      <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-xl shadow-slate-900/5 p-6 sm:p-9 md:p-10">
        
        {/* ================================================================ */}
        {/* STEP 1: DATA CALON SISWA                                         */}
        {/* ================================================================ */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-1.5">
                <User size={13} />
                <span>Langkah 1 dari 4</span>
              </span>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight font-headline">
                Data Identitas Calon Siswa
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Lengkapi biodata lengkap calon murid baru sesuai akta kelahiran.
              </p>
            </div>

            {/* Program Kelas Selection Cards */}
            <div className="space-y-2.5 pt-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Pilihan Program Kelas <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                
                {/* Option 1: Kelas Fullday */}
                <label
                  className={`relative p-4.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    formData.class_program === 'fullday'
                      ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                      : fulldayIsFull
                      ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                      : 'border-slate-200/80 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="class_program"
                        value="fullday"
                        disabled={fulldayIsFull}
                        checked={formData.class_program === 'fullday'}
                        onChange={handleChange}
                        className="text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span className="font-extrabold text-sm text-slate-900">Kelas Fullday</span>
                    </div>
                    {fulldayIsFull ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold uppercase">
                        Kuota Penuh
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase tracking-wider">
                        Maks. 30 Siswa
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Pembelajaran terpadu tahfidz intensif, pembiasaan adab islami, makan siang bersama, dan aktivitas sore terbimbing.
                  </p>
                </label>

                {/* Option 2: Kelas Regular */}
                <label
                  className={`relative p-4.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    formData.class_program === 'regular'
                      ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                      : 'border-slate-200/80 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="class_program"
                        value="regular"
                        checked={formData.class_program === 'regular'}
                        onChange={handleChange}
                        className="text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span className="font-extrabold text-sm text-slate-900">Kelas Regular</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider">
                      Tersedia
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Kurikulum terakreditasi A Kemenag &amp; Kemendikbud dengan fokus penguatan materi dasar agama dan pengetahuan umum.
                  </p>
                </label>

              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 pt-2">
              
              {/* Nama Lengkap */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Nama Lengkap Anak <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="student_name"
                  value={formData.student_name}
                  onChange={handleChange}
                  placeholder="Contoh: Muhammad Rayhan Al-Fatih"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-medium transition"
                  required
                />
              </div>

              {/* NISN (Opsional) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  NISN <span className="text-slate-400 font-normal lowercase">(jika sudah ada)</span>
                </label>
                <input
                  type="text"
                  name="nisn"
                  value={formData.nisn}
                  onChange={handleChange}
                  placeholder="10 digit nomor NISN (opsional)"
                  maxLength={10}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-medium transition font-mono"
                />
              </div>

              {/* Jenis Kelamin */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Jenis Kelamin <span className="text-rose-500">*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-medium transition bg-white"
                >
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>

              {/* Tempat Lahir */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Tempat Lahir <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="birth_place"
                  value={formData.birth_place}
                  onChange={handleChange}
                  placeholder="Contoh: Bekasi"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-medium transition"
                  required
                />
              </div>

              {/* Tanggal Lahir */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Tanggal Lahir <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  name="birth_date"
                  value={formData.birth_date}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-medium transition bg-white"
                  required
                />
              </div>

              {/* Agama */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Agama <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="religion"
                  value={formData.religion}
                  onChange={handleChange}
                  placeholder="Islam"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-medium transition"
                  required
                />
              </div>

            </div>

            {/* Live Age Indicator Box */}
            {calculatedAge && (
              <div
                className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-start gap-3 transition ${
                  calculatedAge.isValid
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                {calculatedAge.isValid ? (
                  <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">
                    Usia per 1 Juli 2027: {calculatedAge.years} Tahun {calculatedAge.months} Bulan
                  </p>
                  <p className="text-xs opacity-90 mt-0.5">
                    {calculatedAge.isValid
                      ? '✓ Memenuhi syarat usia minimum masuk madrasah (min. 6 tahun).'
                      : '⚠ Usia calon siswa di bawah 6 tahun per 1 Juli 2027. Diperlukan rekomendasi kesiapan belajar.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* STEP 2: DATA ORANG TUA / WALI                                    */}
        {/* ================================================================ */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-1.5">
                <Users size={13} />
                <span>Langkah 2 dari 4</span>
              </span>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight font-headline">
                Data Orang Tua / Wali Murid
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Informasi orang tua atau wali penanggung jawab ananda.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              
              {/* Nama Lengkap Orang Tua / Wali */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Nama Lengkap Orang Tua / Wali <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="parent_name"
                  value={formData.parent_name}
                  onChange={handleChange}
                  placeholder="Contoh: Ahmad Zulkarnaen, S.T."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-medium transition"
                  required
                />
              </div>

              {/* Hubungan Keluarga */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Hubungan Keluarga <span className="text-rose-500">*</span>
                </label>
                <select
                  name="parent_relation"
                  value={formData.parent_relation}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-medium transition bg-white"
                >
                  <option value="Ayah Kandung">Ayah Kandung</option>
                  <option value="Ibu Kandung">Ibu Kandung</option>
                  <option value="Wali">Wali</option>
                </select>
              </div>

              {/* NIK Orang Tua (16 Digit) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  NIK Orang Tua / Wali (16 Digit) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="parent_nik"
                  value={formData.parent_nik}
                  onChange={handleChange}
                  placeholder="3216xxxxxxxxxxxx"
                  maxLength={16}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-medium transition font-mono"
                  required
                />
              </div>

              {/* Pekerjaan */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Pekerjaan Orang Tua / Wali <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="parent_occupation"
                  value={formData.parent_occupation}
                  onChange={handleChange}
                  placeholder="Contoh: Karyawan Swasta / PNS / Wiraswasta"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-medium transition"
                  required
                />
              </div>

              {/* Agama Orang Tua */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Agama <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="parent_religion"
                  value={formData.parent_religion}
                  onChange={handleChange}
                  placeholder="Islam"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-medium transition"
                  required
                />
              </div>

              {/* No WhatsApp */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  No. WhatsApp Aktif <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  name="parent_phone"
                  value={formData.parent_phone}
                  onChange={handleChange}
                  placeholder="081234567890"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-medium transition font-mono"
                  required
                />
              </div>

              {/* Email Aktif */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Email Aktif <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  name="parent_email"
                  value={formData.parent_email}
                  onChange={handleChange}
                  placeholder="nama.ortu@gmail.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-medium transition"
                  required
                />
              </div>

              {/* Notice Box Email */}
              <div className="sm:col-span-2 p-3.5 bg-blue-50/80 border border-blue-200/70 rounded-2xl flex items-start gap-2.5 text-xs text-blue-900">
                <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Penting:</strong> Segala pemberitahuan tanda terima registrasi, informasi kelulusan berkas, dan email approval penerimaan resmi akan dikirimkan langsung ke alamat email ini.
                </p>
              </div>

              {/* Alamat Lengkap */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Alamat Lengkap Tempat Tinggal <span className="text-rose-500">*</span>
                </label>
                <textarea
                  name="home_address"
                  value={formData.home_address}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Jl. Raya Babelan No. XX, RT 01/RW 02, Kel. Babelan Kota, Kec. Babelan, Kab. Bekasi"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-medium transition resize-none"
                  required
                />
              </div>

            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* STEP 3: DOKUMEN & DECLARATION CHECKLIST (SURAT PERNYATAAN)        */}
        {/* ================================================================ */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-1.5">
                <FileCheck size={13} />
                <span>Langkah 3 dari 4</span>
              </span>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight font-headline">
                Dokumen Pendukung &amp; Surat Pernyataan
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Unggah dokumen persyaratan resmi dan setujui surat pernyataan tata tertib madrasah.
              </p>
            </div>

            {/* Upload Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* 1. Akta Kelahiran */}
              <div className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    1. Akta Kelahiran Anak <span className="text-rose-500">*</span>
                  </span>
                  {formData.document_birth_certificate && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      <Check size={12} /> Terunggah
                    </span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleFileUpload(e, 'document_birth_certificate', 'ppdb/akta')}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                {uploadingField === 'document_birth_certificate' && (
                  <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium">
                    <Loader2 size={13} className="animate-spin" /> Mengunggah Akta...
                  </div>
                )}
              </div>

              {/* 2. Kartu Keluarga */}
              <div className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    2. Kartu Keluarga (KK) <span className="text-rose-500">*</span>
                  </span>
                  {formData.document_family_card && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      <Check size={12} /> Terunggah
                    </span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleFileUpload(e, 'document_family_card', 'ppdb/kk')}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                {uploadingField === 'document_family_card' && (
                  <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium">
                    <Loader2 size={13} className="animate-spin" /> Mengunggah KK...
                  </div>
                )}
              </div>

              {/* 3. KTP Orang Tua / Wali */}
              <div className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    3. KTP Orang Tua / Wali <span className="text-rose-500">*</span>
                  </span>
                  {formData.document_parent_id && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      <Check size={12} /> Terunggah
                    </span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleFileUpload(e, 'document_parent_id', 'ppdb/ktp')}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                {uploadingField === 'document_parent_id' && (
                  <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium">
                    <Loader2 size={13} className="animate-spin" /> Mengunggah KTP...
                  </div>
                )}
              </div>

              {/* 4. SK Tamat Belajar (Opsional) */}
              <div className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    4. SK Tamat Belajar <span className="text-slate-400 font-normal lowercase">(PAUD/TK/RA jika ada)</span>
                  </span>
                  {formData.document_report_card && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      <Check size={12} /> Terunggah
                    </span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleFileUpload(e, 'document_report_card', 'ppdb/sk')}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 cursor-pointer"
                />
                {uploadingField === 'document_report_card' && (
                  <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium">
                    <Loader2 size={13} className="animate-spin" /> Mengunggah SK Tamat Belajar...
                  </div>
                )}
              </div>

            </div>

            {/* ── DECLARATION CHECKLIST (EXACT SCREENSHOT TEXT) ── */}
            <div className="bg-gradient-to-br from-slate-50 to-indigo-50/40 border-2 border-indigo-200/80 rounded-3xl p-5 sm:p-7 space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
                <h4 className="text-sm font-extrabold text-slate-900 tracking-tight uppercase">
                  Surat Pernyataan Calon Siswa &amp; Orang Tua / Wali
                </h4>
              </div>

              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2.5 bg-white/80 p-4 sm:p-5 rounded-2xl border border-slate-200">
                <p className="font-semibold text-slate-800">
                  Dengan ini kami menyatakan dengan sesungguhnya, bahwa selama di Madrasah ini :
                </p>
                <ol className="list-decimal pl-5 space-y-1.5 text-slate-600">
                  <li>Akan belajar dengan tekun, sungguh-sungguh dan penuh semangat;</li>
                  <li>Akan menjaga nama baik diri sendiri, keluarga, masyarakat dan madrasah;</li>
                  <li>Sanggup mentaati seluruh tata tertib dan peraturan yang berlaku, mematuhi pelaksanaan lingkungan pendidikan termasuk berpakaian seragam madrasah, dan lain-lain.</li>
                  <li>Siap menerima sanksi ketentuan madrasah.</li>
                </ol>
                <p className="font-semibold text-slate-800 pt-1">
                  Demikian surat pernyataan ini kami buat dengan sebenarnya dan penuh rasa tanggung jawab.
                </p>
              </div>

              {/* Checkbox Wajib */}
              <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-indigo-300 cursor-pointer hover:bg-indigo-50/30 transition">
                <input
                  type="checkbox"
                  name="declaration_agreed"
                  checked={formData.declaration_agreed}
                  onChange={handleChange}
                  className="w-5 h-5 text-indigo-600 rounded-md border-slate-300 focus:ring-indigo-500 mt-0.5 shrink-0"
                  required
                />
                <span className="text-xs sm:text-sm font-bold text-slate-800 leading-snug select-none">
                  Saya telah membaca, memahami, dan menyetujui seluruh isi butir surat pernyataan di atas dengan sebenarnya dan penuh rasa tanggung jawab. <span className="text-rose-500">*</span>
                </span>
              </label>
            </div>

          </div>
        )}

        {/* ================================================================ */}
        {/* STEP 4: PEMBAYARAN BIAYA PENDAFTARAN & RINGKASAN                  */}
        {/* ================================================================ */}
        {currentStep === 4 && (
          <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-200">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-1.5">
                <CreditCard size={13} />
                <span>Langkah Terakhir</span>
              </span>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight font-headline">
                Pembayaran Biaya Pendaftaran
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Silakan transfer biaya pendaftaran ke rekening resmi madrasah dan unggah bukti transfer.
              </p>
            </div>

            {/* Bank BTN Transfer Details Box */}
            <div className="bg-gradient-to-br from-[#001f3f] to-[#003366] text-white p-6 sm:p-7 rounded-3xl shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-blue-200">
                  <Building2 size={14} />
                  <span>Rekening Resmi Sekolah</span>
                </div>
                <span className="text-xs font-black uppercase text-amber-300 bg-amber-400/20 px-3 py-1 rounded-full border border-amber-400/30">
                  Bank BTN
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div>
                  <span className="text-xs text-blue-200 block mb-1">Nomor Rekening Bank BTN:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xl sm:text-2xl font-black text-white tracking-wider">
                      {settings.bank_account_number || '00129-01-30-00015-9'}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyBank}
                      className="p-1.5 bg-white/15 hover:bg-white/25 rounded-xl transition text-white"
                      title="Salin Nomor Rekening"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                  {copiedBank && (
                    <span className="text-[11px] text-emerald-300 font-bold block mt-1">
                      ✓ Nomor rekening berhasil disalin!
                    </span>
                  )}
                  <p className="text-xs text-blue-200 mt-1">
                    Atas Nama: <strong>{settings.bank_account_holder || 'MI ATTAQWA 15 BABELAN'}</strong>
                  </p>
                </div>

                <div className="bg-white/10 p-4 rounded-2xl border border-white/15 text-left sm:text-right">
                  <span className="text-xs text-blue-200 block">Biaya Formulir &amp; Pendaftaran:</span>
                  <span className="text-2xl font-black text-amber-300">
                    Rp {(Number(settings.registration_fee) || 200000).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            {/* Upload Bukti Pembayaran */}
            <div className="p-5 rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50/70 space-y-3">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-800">
                Unggah Bukti Transfer Bank BTN <span className="text-rose-500">*</span>
              </label>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleFileUpload(e, 'payment_proof_url', 'ppdb/payments')}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                  required
                />
              </div>

              {uploadingField === 'payment_proof_url' && (
                <div className="flex items-center gap-2 text-xs text-blue-600 font-bold">
                  <Loader2 size={15} className="animate-spin" /> Mengunggah bukti pembayaran...
                </div>
              )}

              {formData.payment_proof_url && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>Bukti transfer berhasil diunggah dan siap dikirimkan.</span>
                </div>
              )}
            </div>

            {/* Rangkuman Pendaftaran */}
            <div className="bg-slate-50 rounded-2xl p-4.5 border border-slate-200 space-y-2 text-xs">
              <span className="font-extrabold text-slate-800 uppercase tracking-wider block mb-1">
                Rangkuman Pendaftaran Calon Siswa
              </span>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>Nama Siswa: <strong className="text-slate-900">{formData.student_name}</strong></div>
                <div>Program: <strong className="text-blue-700 uppercase">{formData.class_program === 'fullday' ? 'Kelas Fullday' : 'Kelas Regular'}</strong></div>
                <div>Orang Tua: <strong className="text-slate-900">{formData.parent_name}</strong></div>
                <div>No. WhatsApp: <strong className="text-slate-900">{formData.parent_phone}</strong></div>
                <div className="col-span-2">Email Notifikasi: <strong className="text-slate-900">{formData.parent_email}</strong></div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || uploadingField !== null || !formData.payment_proof_url}
                className="btn-tactile w-full py-4 px-6 rounded-2xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Mengirim Formulir Pendaftaran...</span>
                  </>
                ) : (
                  <>
                    <span>Kirim Pendaftaran SPMB 2027/2028</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ── FOOTER NAVIGATION CONTROLS (Steps 1-3) ── */}
        {currentStep < 4 && (
          <div className="flex items-center justify-between gap-3 pt-8 border-t border-slate-100 mt-8">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 1}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition ${
                currentStep === 1
                  ? 'opacity-0 pointer-events-none'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer'
              }`}
            >
              <ArrowLeft size={14} />
              <span>Kembali</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={uploadingField !== null}
              className="btn-tactile inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-7 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition cursor-pointer"
            >
              <span>Lanjut ke Langkah {currentStep + 1}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        )}

      </div>

      {/* ── SUCCESS MODAL ── */}
      {successData && (
        <PpdbSuccessModal
          data={{
            registration_number: successData.registration_number,
            student_name: successData.student_name,
            academic_year: successData.academic_year,
            batch: 1,
            payment_amount: successData.payment_amount,
            father_name: successData.father_name,
            father_phone: successData.father_phone
          }}
          temporaryPassword={successData.temporaryPassword}
          whatsappContact={settings.whatsapp_contact}
          onClose={() => {
            setSuccessData(null)
            window.location.reload()
          }}
        />
      )}

    </div>
  )
}
