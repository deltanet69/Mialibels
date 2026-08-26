'use client'

import React, { useState } from 'react'
import { Search, CheckCircle2, Clock, XCircle, AlertCircle, FileText, UploadCloud, Loader2, Sparkles, User, Calendar, ShieldCheck, ArrowRight, X, Phone, Building2, ExternalLink } from 'lucide-react'

type PpdbStatusCheckerProps = {
  whatsappContact?: string
}

export default function PpdbStatusChecker({ whatsappContact = '6281234567890' }: PpdbStatusCheckerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedReg, setSelectedReg] = useState<any | null>(null)

  // Document Upload State (Phase 2)
  const [docs, setDocs] = useState({
    document_birth_certificate: '',
    document_family_card: '',
    document_parent_id: '',
    document_photo: '',
    document_immunization: '',
    document_report_card: '',
    special_needs: '',
    medical_history: ''
  })
  const [uploadingDocKey, setUploadingDocKey] = useState<string | null>(null)
  const [savingDocs, setSavingDocs] = useState(false)
  const [docSaveSuccess, setDocSaveSuccess] = useState(false)
  const [docError, setDocError] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setLoading(true)
    setError(null)
    setResults(null)
    setSelectedReg(null)

    try {
      const res = await fetch('/api/ppdb/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.message || json.error || 'Data pendaftaran tidak ditemukan')

      setResults(json.data)
      if (json.data.length === 1) {
        setSelectedReg(json.data[0])
        initDocs(json.data[0])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const initDocs = (reg: any) => {
    setDocs({
      document_birth_certificate: reg.document_birth_certificate || '',
      document_family_card: reg.document_family_card || '',
      document_parent_id: reg.document_parent_id || '',
      document_photo: reg.document_photo || '',
      document_immunization: reg.document_immunization || '',
      document_report_card: reg.document_report_card || '',
      special_needs: reg.special_needs || '',
      medical_history: reg.medical_history || ''
    })
    setDocSaveSuccess(false)
    setDocError(null)
  }

  const handleFileUpload = async (key: string, file: File) => {
    setUploadingDocKey(key)
    setDocError(null)

    try {
      const data = new FormData()
      data.append('file', file)
      data.append('folder', 'ppdb/documents')

      const res = await fetch('/api/ppdb/upload', {
        method: 'POST',
        body: data
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal upload berkas')

      setDocs(prev => ({ ...prev, [key]: json.url }))
    } catch (err: any) {
      setDocError(`Gagal upload berkas: ${err.message}`)
    } finally {
      setUploadingDocKey(null)
    }
  }

  const handleSaveDocs = async () => {
    if (!selectedReg) return

    setSavingDocs(true)
    setDocError(null)
    setDocSaveSuccess(false)

    try {
      const res = await fetch('/api/ppdb/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_id: selectedReg.id,
          ...docs
        })
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan dokumen')

      setDocSaveSuccess(true)
      setSelectedReg(json.data)
    } catch (err: any) {
      setDocError(err.message)
    } finally {
      setSavingDocs(false)
    }
  }

  const waNum = (whatsappContact || '6281234567890').replace(/[^0-9]/g, '')

  return (
    <div className="font-sans w-full max-w-3xl mx-auto space-y-6">
      
      {/* ════════════════════════════════════════════════════════════════════
          SEARCH CARD
         ════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
        <div>
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block mb-1">
            Pelacakan Status PPDB
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            Cek Status &amp; Unggah Berkas Lanjutan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Masukkan <strong>Nomor Registrasi</strong> (contoh: <code>PPDB27-0001</code>) atau <strong>Nomor WhatsApp Ayah</strong> yang didaftarkan.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nomor Registrasi / No. WA..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !searchQuery.trim()}
            className="btn-tactile flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-blue-600/20 transition cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Mencari...</span>
              </>
            ) : (
              <span>Cari Status</span>
            )}
          </button>
        </form>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          SEARCH RESULTS
         ════════════════════════════════════════════════════════════════════ */}
      {results && results.length > 1 && !selectedReg && (
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
          <h3 className="text-sm font-bold text-slate-800">
            Ditemukan {results.length} Data Pendaftaran:
          </h3>
          <div className="space-y-2">
            {results.map((r) => (
              <div
                key={r.id}
                onClick={() => {
                  setSelectedReg(r)
                  initDocs(r)
                }}
                className="p-3.5 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-2xl cursor-pointer transition flex items-center justify-between"
              >
                <div>
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    {r.registration_number}
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 mt-1">{r.student_name}</h4>
                  <p className="text-xs text-slate-500">Ayah: {r.father_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={r.status} />
                  <ArrowRight size={16} className="text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          SELECTED REGISTRATION DETAILS & TIMELINE
         ════════════════════════════════════════════════════════════════════ */}
      {selectedReg && (
        <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200/80 shadow-2xs space-y-6">
          
          {/* Header Card */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                {selectedReg.registration_number}
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                {selectedReg.student_name}
              </h3>
              <p className="text-xs text-slate-500">
                Gelombang {selectedReg.batch} &bull; T.A {selectedReg.academic_year}
              </p>
            </div>

            <StatusBadge status={selectedReg.status} />
          </div>

          {/* 3-Step Progress Timeline */}
          <div className="p-4 bg-slate-50 rounded-2xl space-y-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Progres Tahapan Pendaftaran:
            </span>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <TimelineStep
                step={1}
                title="Formulir Masuk"
                isCompleted={true}
                isActive={selectedReg.status === 'pending_verification'}
              />
              <TimelineStep
                step={2}
                title="Verifikasi Panitia"
                isCompleted={selectedReg.status === 'approved' || selectedReg.status === 'documents_submitted'}
                isActive={selectedReg.status === 'pending_verification'}
              />
              <TimelineStep
                step={3}
                title="Lulus &amp; Berkas"
                isCompleted={selectedReg.status === 'documents_submitted'}
                isActive={selectedReg.status === 'approved'}
              />
            </div>
          </div>

          {/* Admin Notes Alert (if any) */}
          {selectedReg.admin_notes && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-1">
              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                <AlertCircle size={14} />
                <span>Catatan Panitia PPDB:</span>
              </span>
              <p className="text-amber-800 leading-relaxed pl-5">
                {selectedReg.admin_notes}
              </p>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              PHASE 2: UPLOAD DOKUMEN FISIK RESMI
             ════════════════════════════════════════════════════════════════════ */}
          {selectedReg.status === 'approved' || selectedReg.status === 'documents_submitted' ? (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div>
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block mb-0.5">
                  Tahap 2 &bull; Dokumen Resmi
                </span>
                <h4 className="text-base font-bold text-slate-900">
                  Lengkapi Berkas Calon Siswa
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pendaftaran telah <strong>Disetujui</strong>. Silakan unggah dokumen persyaratan dalam format foto/PDF.
                </p>
              </div>

              {docSaveSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>Berkas dokumen berhasil disimpan &amp; diserahkan ke panitia!</span>
                </div>
              )}

              {docError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold">
                  {docError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DocUploadCard
                  title="Akta Kelahiran Siswa"
                  required={true}
                  docKey="document_birth_certificate"
                  url={docs.document_birth_certificate}
                  uploading={uploadingDocKey === 'document_birth_certificate'}
                  onUpload={(file) => handleFileUpload('document_birth_certificate', file)}
                />
                <DocUploadCard
                  title="Kartu Keluarga (KK)"
                  required={true}
                  docKey="document_family_card"
                  url={docs.document_family_card}
                  uploading={uploadingDocKey === 'document_family_card'}
                  onUpload={(file) => handleFileUpload('document_family_card', file)}
                />
                <DocUploadCard
                  title="KTP Orang Tua / Wali"
                  required={true}
                  docKey="document_parent_id"
                  url={docs.document_parent_id}
                  uploading={uploadingDocKey === 'document_parent_id'}
                  onUpload={(file) => handleFileUpload('document_parent_id', file)}
                />
                <DocUploadCard
                  title="Pas Foto 3x4 Calon Siswa"
                  required={true}
                  docKey="document_photo"
                  url={docs.document_photo}
                  uploading={uploadingDocKey === 'document_photo'}
                  onUpload={(file) => handleFileUpload('document_photo', file)}
                />
                <DocUploadCard
                  title="Kartu Imunisasi / KMS"
                  required={false}
                  docKey="document_immunization"
                  url={docs.document_immunization}
                  uploading={uploadingDocKey === 'document_immunization'}
                  onUpload={(file) => handleFileUpload('document_immunization', file)}
                />
                <DocUploadCard
                  title="Raport TK / RA (Opsional)"
                  required={false}
                  docKey="document_report_card"
                  url={docs.document_report_card}
                  uploading={uploadingDocKey === 'document_report_card'}
                  onUpload={(file) => handleFileUpload('document_report_card', file)}
                />
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveDocs}
                  disabled={savingDocs || !docs.document_birth_certificate}
                  className="btn-tactile flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-emerald-600/20 transition cursor-pointer"
                >
                  {savingDocs ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Menyimpan Dokumen...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Simpan &amp; Serahkan Berkas</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          ) : null}

          {/* Contact WA Help Footer */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-500 text-center sm:text-left">
              Ada pertanyaan seputar hasil verifikasi atau kelulusan?
            </span>
            <a
              href={`https://wa.me/${waNum}?text=Halo%20Panitia%20PPDB,%20saya%20ingin%20konfirmasi%20pendaftaran%20${selectedReg.registration_number}%20a.n%20${encodeURIComponent(selectedReg.student_name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-tactile inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-xl text-xs font-bold transition"
            >
              <Phone size={13} />
              <span>Hubungi Panitia via WhatsApp</span>
            </a>
          </div>

        </div>
      )}

    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'approved') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 size={13} />
        <span>Approved / Disetujui</span>
      </span>
    )
  }
  if (status === 'documents_submitted') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
        <FileText size={13} />
        <span>Berkas Terunggah</span>
      </span>
    )
  }
  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
        <XCircle size={13} />
        <span>Perlu Perbaikan</span>
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
      <Clock size={13} />
      <span>Menunggu Verifikasi</span>
    </span>
  )
}

function TimelineStep({ step, title, isCompleted, isActive }: { step: number; title: string; isCompleted: boolean; isActive: boolean }) {
  return (
    <div className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 ${
      isCompleted 
        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
        : isActive 
          ? 'bg-blue-50/70 border-blue-200 text-blue-900 font-bold' 
          : 'bg-white border-slate-200 text-slate-400'
    }`}>
      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
        isCompleted 
          ? 'bg-emerald-600 text-white' 
          : isActive 
            ? 'bg-blue-600 text-white' 
            : 'bg-slate-200 text-slate-500'
      }`}>
        {isCompleted ? '✓' : step}
      </div>
      <span className="text-[11px] font-semibold leading-tight">{title}</span>
    </div>
  )
}

function DocUploadCard({ title, required, docKey, url, uploading, onUpload }: {
  title: string
  required: boolean
  docKey: string
  url?: string
  uploading: boolean
  onUpload: (file: File) => void
}) {
  return (
    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
      <div className="flex justify-between items-start">
        <span className="text-xs font-bold text-slate-800">
          {title} {required && <span className="text-rose-500">*</span>}
        </span>
        {url ? (
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
            Terunggah
          </span>
        ) : (
          <span className="text-[10px] text-slate-400">Belum ada</span>
        )}
      </div>

      {uploading ? (
        <div className="py-2 flex items-center justify-center gap-2 text-blue-600 text-xs font-semibold">
          <Loader2 size={15} className="animate-spin" />
          <span>Mengunggah...</span>
        </div>
      ) : url ? (
        <div className="flex items-center justify-between pt-1">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1"
          >
            <ExternalLink size={12} />
            <span>Buka File</span>
          </a>
          <label className="text-[11px] text-slate-500 hover:text-slate-700 cursor-pointer underline">
            Ganti
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <label className="cursor-pointer block py-2 text-center border border-dashed border-slate-300 hover:border-blue-500 rounded-xl bg-white text-[11px] font-semibold text-slate-600 hover:text-blue-600 transition">
          + Pilih Berkas
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
            className="hidden"
          />
        </label>
      )}
    </div>
  )
}
