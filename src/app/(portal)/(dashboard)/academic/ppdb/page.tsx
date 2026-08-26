'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { Plus, Search, Trash2, Edit3, Eye, Phone, Mail, UploadCloud, Download, CheckCircle2, Clock, XCircle, AlertCircle, FileText, Filter, LayoutGrid, List, Key, ShieldCheck, UserPlus, Sparkles, ExternalLink, Image as ImageIcon, Check, X, Settings2, Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

// Types
type Applicant = {
  id: string
  registration_number: string
  academic_year: string
  batch: number
  assigned_batch: number
  student_name: string
  student_nickname?: string
  birth_place: string
  birth_date: string
  gender: string
  weight?: number
  height?: number
  blood_type?: string
  nisn?: string
  previous_school?: string
  special_needs?: string
  medical_history?: string
  father_name: string
  father_nik: string
  father_occupation: string
  father_phone: string
  father_email: string
  mother_name: string
  mother_nik: string
  mother_occupation: string
  mother_phone: string
  mother_email?: string
  home_address?: string
  payment_method: string
  payment_amount: number
  payment_proof_url: string
  payment_status: string
  status: string
  admin_notes?: string
  document_birth_certificate?: string
  document_family_card?: string
  document_parent_id?: string
  document_photo?: string
  document_immunization?: string
  document_report_card?: string
  documents_submitted_at?: string
  created_at: string
}

export default function AdminPpdbPage() {
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [settings, setSettings] = useState<any>(null)
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Filters & State
  const [search, setSearch] = useState('')
  const [batchFilter, setBatchFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')

  // Modals
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  // Action state in detail modal
  const [actionNotes, setActionNotes] = useState('')
  const [targetBatch, setTargetBatch] = useState<number>(1)
  const [processingAction, setProcessingAction] = useState(false)

  // Settings update state
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsForm, setSettingsForm] = useState<any>({})

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [resApps, resSettings] = await Promise.all([
        fetch('/api/ppdb/admin?_t=' + Date.now()),
        fetch('/api/ppdb/admin/settings?_t=' + Date.now())
      ])

      const dataApps = await resApps.json()
      const dataSettings = await resSettings.json()

      if (dataApps.success) {
        setApplicants(dataApps.data || [])
        setSummary(dataApps.summary || null)
      }

      if (dataSettings.success && dataSettings.data) {
        setSettings(dataSettings.data)
        setSettingsForm(dataSettings.data)
      }
    } catch (err) {
      console.error('Error fetching PPDB admin data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Toggle Master Switch (Active/Inactive)
  const handleToggleActive = async () => {
    if (!settings) return
    const newActive = !settings.is_active

    try {
      const res = await fetch('/api/ppdb/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newActive })
      })

      const json = await res.json()
      if (json.success) {
        setSettings((prev: any) => ({ ...prev, is_active: newActive }))
      }
    } catch (err) {
      console.error('Failed to toggle PPDB status:', err)
    }
  }

  // Filtered applicants
  const filteredApplicants = useMemo(() => {
    let list = [...applicants]

    if (batchFilter !== 'all') {
      list = list.filter(a => a.batch === Number(batchFilter))
    }

    if (statusFilter !== 'all') {
      list = list.filter(a => a.status === statusFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(a =>
        a.student_name.toLowerCase().includes(q) ||
        a.registration_number.toLowerCase().includes(q) ||
        a.father_name.toLowerCase().includes(q) ||
        a.father_phone.includes(q) ||
        a.mother_name.toLowerCase().includes(q)
      )
    }

    if (sortOrder === 'oldest') {
      list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    } else {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    return list
  }, [applicants, batchFilter, statusFilter, search, sortOrder])

  // Status Action handler (Approve / Reject)
  const handleUpdateStatus = async (status: string) => {
    if (!selectedApplicant) return

    setProcessingAction(true)
    try {
      const res = await fetch('/api/ppdb/admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedApplicant.id,
          status,
          assigned_batch: targetBatch,
          admin_notes: actionNotes.trim() || null,
          payment_status: status === 'approved' ? 'verified' : selectedApplicant.payment_status
        })
      })

      const json = await res.json()
      if (json.success) {
        setApplicants(prev => prev.map(a => a.id === selectedApplicant.id ? json.data : a))
        setSelectedApplicant(json.data)
      } else {
        alert('Gagal update status: ' + json.error)
      }
    } catch (err: any) {
      alert('Terjadi kesalahan: ' + err.message)
    } finally {
      setProcessingAction(false)
    }
  }

  // Delete applicant
  const handleDeleteApplicant = async (id: string, name: string) => {
    if (!confirm(`Hapus permanen data pendaftar ${name}? Tindakan ini tidak dapat dibatalkan.`)) return

    try {
      const res = await fetch(`/api/ppdb/admin?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setApplicants(prev => prev.filter(a => a.id !== id))
        if (selectedApplicant?.id === id) setSelectedApplicant(null)
      } else {
        alert('Gagal menghapus: ' + json.error)
      }
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  // Export CSV
  const handleExportCsv = () => {
    if (filteredApplicants.length === 0) {
      alert('Tidak ada data pendaftar untuk diekspor.')
      return
    }

    let csv = 'No. Registrasi,Nama Lengkap,Panggilan,JK,Tempat Lahir,Tanggal Lahir,Batch,Status,Ayah,No WA Ayah,Ibu,No WA Ibu,Metode Bayar,Status Bayar,Tgl Daftar\n'

    filteredApplicants.forEach(row => {
      const clean = (val: string) => `"${(val || '').replace(/"/g, '""')}"`
      csv += `${clean(row.registration_number)},${clean(row.student_name)},${clean(row.student_nickname || '')},${clean(row.gender)},${clean(row.birth_place)},${clean(row.birth_date)},${row.batch},${clean(row.status)},${clean(row.father_name)},${clean(row.father_phone)},${clean(row.mother_name)},${clean(row.mother_phone)},${clean(row.payment_method)},${clean(row.payment_status)},${clean(new Date(row.created_at).toLocaleString('id-ID'))}\n`
    })

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `PPDB_Pendaftar_${batchFilter === 'all' ? 'Semua_Batch' : 'Batch_' + batchFilter}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingSettings(true)
    try {
      const res = await fetch('/api/ppdb/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm)
      })
      const json = await res.json()
      if (json.success) {
        setSettings(json.data)
        setShowSettingsModal(false)
        fetchData()
      } else {
        alert('Gagal simpan: ' + json.error)
      }
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setSavingSettings(false)
    }
  }

  return (
    <div className="font-sans space-y-6 sm:space-y-7 w-full pb-16">
      
      {/* ════════════════════════════════════════════════════════════════════
          HEADER BAR
         ════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2.5">
            <UserPlus size={13} />
            <span>Manajemen Penerimaan Siswa Baru (PPDB)</span>
          </div>
          <h1 className="font-sans font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            PPDB T.A {settings?.academic_year || '2027/2028'}
          </h1>
          <p className="font-sans text-xs sm:text-sm text-slate-500 mt-1">
            Kelola pendaftaran siswa baru, verifikasi berkas transfer, dan plotting 3 gelombang batch.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full xl:w-auto flex-wrap">
          
          {/* Master Toggle Status Switch */}
          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-2xl">
            <span className="text-xs font-bold text-slate-700">Status PPDB:</span>
            <button
              onClick={handleToggleActive}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings?.is_active ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  settings?.is_active ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-xs font-extrabold ${settings?.is_active ? 'text-emerald-700' : 'text-slate-500'}`}>
              {settings?.is_active ? 'Buka' : 'Tutup'}
            </span>
          </div>

          {/* Settings Modal Button */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="btn-tactile flex items-center justify-center gap-2 bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-2xl hover:bg-slate-100 transition text-xs font-bold shadow-2xs cursor-pointer"
          >
            <Settings2 size={15} />
            <span>Pengaturan</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            className="btn-tactile flex items-center justify-center gap-2 bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-2xl hover:bg-slate-100 transition text-xs font-bold shadow-2xs cursor-pointer"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>

          {/* Public Link */}
          <Link
            href="/ppdb"
            target="_blank"
            className="btn-tactile flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl transition text-xs font-bold shadow-md shadow-blue-600/20"
          >
            <ExternalLink size={15} />
            <span>Halaman Publik</span>
          </Link>

        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          STATS BENTO CARDS
         ════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4 font-sans">
        
        {/* Total Pendaftar */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Pendaftar</span>
            <h3 className="font-extrabold text-2xl sm:text-3xl text-slate-900">{summary?.total || 0}</h3>
          </div>
          <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold">
            <UserPlus size={20} />
          </div>
        </div>

        {/* Menunggu Verifikasi */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Verifikasi</span>
            <h3 className="font-extrabold text-2xl sm:text-3xl text-amber-600">{summary?.pending || 0}</h3>
          </div>
          <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center font-bold">
            <Clock size={20} />
          </div>
        </div>

        {/* Lulus / Approved */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Approved</span>
            <h3 className="font-extrabold text-2xl sm:text-3xl text-emerald-600">{summary?.approved || 0}</h3>
          </div>
          <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-bold">
            <CheckCircle2 size={20} />
          </div>
        </div>

        {/* Dokumen Masuk */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Berkas Masuk</span>
            <h3 className="font-extrabold text-2xl sm:text-3xl text-indigo-600">{summary?.documents_submitted || 0}</h3>
          </div>
          <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-bold">
            <FileText size={20} />
          </div>
        </div>

        {/* Rejected */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between col-span-2 lg:col-span-1">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Ditolak / Revisi</span>
            <h3 className="font-extrabold text-2xl sm:text-3xl text-rose-600">{summary?.rejected || 0}</h3>
          </div>
          <div className="w-11 h-11 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center font-bold">
            <XCircle size={20} />
          </div>
        </div>

      </div>

      {/* ════════════════════════════════════════════════════════════════════
          BATCH TABS & FILTERS
         ════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white p-5 sm:p-7 rounded-3xl shadow-sm border border-slate-200/80 space-y-6">
        
        {/* Batch Selector Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setBatchFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                batchFilter === 'all' ? 'bg-white shadow-2xs text-blue-700' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Batch ({summary?.total || 0})
            </button>
            <button
              onClick={() => setBatchFilter('1')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                batchFilter === '1' ? 'bg-white shadow-2xs text-blue-700' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Batch 1 ({summary?.batch1 || 0}/75)
            </button>
            <button
              onClick={() => setBatchFilter('2')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                batchFilter === '2' ? 'bg-white shadow-2xs text-blue-700' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Batch 2 ({summary?.batch2 || 0}/75)
            </button>
            <button
              onClick={() => setBatchFilter('3')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                batchFilter === '3' ? 'bg-white shadow-2xs text-blue-700' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Batch 3 ({summary?.batch3 || 0}/75)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-xl transition cursor-pointer ${viewMode === 'list' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-400'}`}
              title="Tampilan Tabel"
            >
              <List size={17} />
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`p-2 rounded-xl transition cursor-pointer ${viewMode === 'card' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-400'}`}
              title="Tampilan Kartu"
            >
              <LayoutGrid size={17} />
            </button>
          </div>
        </div>

        {/* Search & Status Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari nama, no reg, atau no WA..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-700 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="pending_verification">Menunggu Verifikasi</option>
            <option value="approved">Approved / Disetujui</option>
            <option value="documents_submitted">Berkas Terunggah</option>
            <option value="rejected">Perlu Perbaikan / Ditolak</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-700 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none cursor-pointer"
          >
            <option value="newest">Pendaftar Terbaru</option>
            <option value="oldest">Pendaftar Terlama</option>
          </select>

          {!loading && (
            <span className="text-xs font-bold text-blue-800 bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-100 whitespace-nowrap shrink-0 ml-auto sm:ml-0">
              {filteredApplicants.length} Calon Siswa
            </span>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            LIST VIEW TABLE
           ════════════════════════════════════════════════════════════════════ */}
        {viewMode === 'list' && (
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[780px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 pr-4 pl-5">No. Registrasi</th>
                  <th className="py-4 pr-4">Nama Calon Siswa</th>
                  <th className="py-4 pr-4">Batch</th>
                  <th className="py-4 pr-4">Orang Tua / Kontak</th>
                  <th className="py-4 pr-4">Bukti Bayar</th>
                  <th className="py-4 pr-4">Status</th>
                  <th className="py-4 pr-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                      Memuat data PPDB...
                    </td>
                  </tr>
                ) : filteredApplicants.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                      Tidak ada pendaftar yang sesuai filter.
                    </td>
                  </tr>
                ) : (
                  filteredApplicants.map((app) => (
                    <tr key={app.id} className="hover:bg-blue-50/30 transition-colors group">
                      
                      {/* Reg Number */}
                      <td className="py-4 pr-4 pl-5">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-100">
                          {app.registration_number}
                        </span>
                      </td>

                      {/* Student Name */}
                      <td className="py-4 pr-4">
                        <div 
                          onClick={() => { setSelectedApplicant(app); setTargetBatch(app.assigned_batch || app.batch); setActionNotes(app.admin_notes || ''); }}
                          className="font-sans font-bold text-[14px] text-slate-900 hover:text-blue-600 transition cursor-pointer"
                        >
                          {app.student_name}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {app.birth_place}, {new Date(app.birth_date).toLocaleDateString('id-ID')} ({app.gender})
                        </div>
                      </td>

                      {/* Batch */}
                      <td className="py-4 pr-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          Batch {app.batch}
                        </span>
                      </td>

                      {/* Parent */}
                      <td className="py-4 pr-4">
                        <div className="font-sans text-xs sm:text-sm font-semibold text-slate-800">
                          {app.father_name}
                        </div>
                        <div className="font-sans text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone size={12} />
                          <span>{app.father_phone}</span>
                        </div>
                      </td>

                      {/* Payment Proof */}
                      <td className="py-4 pr-4">
                        {app.payment_proof_url ? (
                          <button
                            onClick={() => setPreviewImage(app.payment_proof_url)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-100 transition cursor-pointer"
                          >
                            <ImageIcon size={13} />
                            <span>Lihat Struk</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Belum ada</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 pr-4">
                        <StatusBadge status={app.status} />
                      </td>

                      {/* Action */}
                      <td className="py-4 pr-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => { setSelectedApplicant(app); setTargetBatch(app.assigned_batch || app.batch); setActionNotes(app.admin_notes || ''); }}
                            className="p-2 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition cursor-pointer"
                            title="Verifikasi & Detail"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteApplicant(app.id, app.student_name)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            CARD VIEW (Modern Grid)
           ════════════════════════════════════════════════════════════════════ */}
        {(viewMode === 'card' || true) && (
          <div className={`${viewMode === 'card' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4' : 'sm:hidden space-y-3.5'}`}>
            {loading ? (
              <div className="col-span-full py-12 text-center text-slate-400 text-xs">
                Memuat data PPDB...
              </div>
            ) : filteredApplicants.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 text-xs">
                Tidak ada pendaftar yang sesuai filter.
              </div>
            ) : (
              filteredApplicants.map((app) => (
                <div
                  key={app.id}
                  className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-4 font-sans"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-100">
                        {app.registration_number}
                      </span>
                      <StatusBadge status={app.status} />
                    </div>

                    <div>
                      <h4 
                        onClick={() => { setSelectedApplicant(app); setTargetBatch(app.assigned_batch || app.batch); setActionNotes(app.admin_notes || ''); }}
                        className="font-bold text-base text-slate-900 hover:text-blue-600 transition cursor-pointer"
                      >
                        {app.student_name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {app.birth_place}, {new Date(app.birth_date).toLocaleDateString('id-ID')} &bull; Gelombang {app.batch}
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-3 text-xs text-slate-600 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Ayah:</span>
                        <span className="font-bold text-slate-800">{app.father_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">WhatsApp:</span>
                        <span className="font-semibold text-slate-700">{app.father_phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    {app.payment_proof_url ? (
                      <button
                        onClick={() => setPreviewImage(app.payment_proof_url)}
                        className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <ImageIcon size={13} />
                        <span>Struk Bayar</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Belum bayar</span>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setSelectedApplicant(app); setTargetBatch(app.assigned_batch || app.batch); setActionNotes(app.admin_notes || ''); }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
                      >
                        Detail &amp; Verifikasi
                      </button>
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>
        )}

      </div>

      {/* ════════════════════════════════════════════════════════════════════
          DETAIL & VERIFICATION MODAL
         ════════════════════════════════════════════════════════════════════ */}
      {selectedApplicant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto font-sans">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 my-8 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 sm:p-7 border-b border-slate-100 bg-slate-50/50">
              <div>
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100 inline-block mb-1">
                  {selectedApplicant.registration_number}
                </span>
                <h3 className="font-extrabold text-xl text-slate-900">
                  {selectedApplicant.student_name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedApplicant(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-7 max-h-[72vh] overflow-y-auto space-y-6">
              
              {/* Status & Verification Action Bar */}
              <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status Saat Ini:</span>
                    <div className="mt-1">
                      <StatusBadge status={selectedApplicant.status} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600">Assign Gelombang:</span>
                    <select
                      value={targetBatch}
                      onChange={(e) => setTargetBatch(Number(e.target.value))}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-pointer"
                    >
                      <option value={1}>Batch 1</option>
                      <option value={2}>Batch 2</option>
                      <option value={3}>Batch 3</option>
                    </select>
                  </div>
                </div>

                {/* Notes Input */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Catatan untuk Orang Tua (Opsional / Alasan Penolakan):
                  </label>
                  <textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="Contoh: Bukti transfer tidak jelas / Usia belum memenuhi syarat..."
                    rows={2}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    onClick={() => handleUpdateStatus('approved')}
                    disabled={processingAction}
                    className="btn-tactile flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
                  >
                    <CheckCircle2 size={15} />
                    <span>Approve / Terima Siswa</span>
                  </button>

                  <button
                    onClick={() => handleUpdateStatus('rejected')}
                    disabled={processingAction}
                    className="btn-tactile flex-1 flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
                  >
                    <XCircle size={15} />
                    <span>Tolak / Perlu Revisi</span>
                  </button>
                </div>
              </div>

              {/* Data Calon Siswa */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                  👤 Data Calon Siswa
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Tempat, Tanggal Lahir</span>
                    <span className="font-bold text-slate-800">{selectedApplicant.birth_place}, {new Date(selectedApplicant.birth_date).toLocaleDateString('id-ID')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Jenis Kelamin</span>
                    <span className="font-bold text-slate-800">{selectedApplicant.gender}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Fisik (BB / TB)</span>
                    <span className="font-bold text-slate-800">{selectedApplicant.weight || '—'} kg / {selectedApplicant.height || '—'} cm</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Golongan Darah</span>
                    <span className="font-bold text-slate-800">{selectedApplicant.blood_type || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">NISN</span>
                    <span className="font-bold text-slate-800">{selectedApplicant.nisn || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Asal TK/RA</span>
                    <span className="font-bold text-slate-800">{selectedApplicant.previous_school || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Data Orang Tua */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                  👨‍👩‍👧 Data Orang Tua / Wali
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-50 p-3.5 rounded-2xl space-y-1">
                    <span className="font-bold text-blue-900 block">Ayah: {selectedApplicant.father_name}</span>
                    <p className="text-slate-500">NIK: {selectedApplicant.father_nik}</p>
                    <p className="text-slate-500">Pekerjaan: {selectedApplicant.father_occupation}</p>
                    <p className="text-slate-500">No WA: {selectedApplicant.father_phone}</p>
                    <p className="text-slate-500">Email: {selectedApplicant.father_email}</p>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-2xl space-y-1">
                    <span className="font-bold text-teal-900 block">Ibu: {selectedApplicant.mother_name}</span>
                    <p className="text-slate-500">NIK: {selectedApplicant.mother_nik}</p>
                    <p className="text-slate-500">Pekerjaan: {selectedApplicant.mother_occupation}</p>
                    <p className="text-slate-500">No WA: {selectedApplicant.mother_phone}</p>
                  </div>
                </div>
              </div>

              {/* Pembayaran & Bukti Struk */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                  💳 Pembayaran Biaya Pendaftaran
                </h4>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs bg-slate-50 p-4 rounded-2xl">
                  <div>
                    <span className="text-slate-500">Nominal: </span>
                    <span className="font-bold text-slate-900">Rp {(Number(selectedApplicant.payment_amount) || 200000).toLocaleString('id-ID')}</span>
                    <span className="text-slate-400 block mt-0.5">Metode: {selectedApplicant.payment_method} &bull; Status: {selectedApplicant.payment_status}</span>
                  </div>

                  {selectedApplicant.payment_proof_url && (
                    <button
                      onClick={() => setPreviewImage(selectedApplicant.payment_proof_url)}
                      className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <ImageIcon size={14} />
                      <span>Buka Bukti Bayar</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Dokumen Lanjutan (Phase 2) */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                  📁 Berkas Dokumen Lanjutan (Phase 2)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <DocLink title="Akta Kelahiran" url={selectedApplicant.document_birth_certificate} onPreview={setPreviewImage} />
                  <DocLink title="Kartu Keluarga" url={selectedApplicant.document_family_card} onPreview={setPreviewImage} />
                  <DocLink title="KTP Orang Tua" url={selectedApplicant.document_parent_id} onPreview={setPreviewImage} />
                  <DocLink title="Pas Foto 3x4" url={selectedApplicant.document_photo} onPreview={setPreviewImage} />
                  <DocLink title="Kartu Imunisasi" url={selectedApplicant.document_immunization} onPreview={setPreviewImage} />
                  <DocLink title="Raport TK" url={selectedApplicant.document_report_card} onPreview={setPreviewImage} />
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          SETTINGS MODAL
         ════════════════════════════════════════════════════════════════════ */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto font-sans">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                <Settings2 className="text-blue-600" size={20} />
                <span>Pengaturan Sistem PPDB</span>
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Tahun Ajaran</label>
                <input
                  type="text"
                  value={settingsForm.academic_year || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, academic_year: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Kuota Batch 1</label>
                  <input
                    type="number"
                    value={settingsForm.batch_1_quota || 75}
                    onChange={(e) => setSettingsForm({ ...settingsForm, batch_1_quota: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Kuota Batch 2</label>
                  <input
                    type="number"
                    value={settingsForm.batch_2_quota || 75}
                    onChange={(e) => setSettingsForm({ ...settingsForm, batch_2_quota: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Kuota Batch 3</label>
                  <input
                    type="number"
                    value={settingsForm.batch_3_quota || 75}
                    onChange={(e) => setSettingsForm({ ...settingsForm, batch_3_quota: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Biaya Formulir &amp; Tes (Rp)</label>
                <input
                  type="number"
                  value={settingsForm.registration_fee || 200000}
                  onChange={(e) => setSettingsForm({ ...settingsForm, registration_fee: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">No. Rekening Bank</label>
                  <input
                    type="text"
                    value={settingsForm.bank_account_number || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, bank_account_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">No. WA Panitia</label>
                  <input
                    type="text"
                    value={settingsForm.whatsapp_contact || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp_contact: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="btn-tactile px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  {savingSettings ? 'Menyimpan...' : 'Simpan Pengaturan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Image Preview */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 cursor-pointer"
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-white rounded-2xl p-2 overflow-hidden shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewImage} alt="Preview Dokumen" className="w-full h-full max-h-[80vh] object-contain rounded-xl" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 p-2 bg-slate-900/70 text-white rounded-full hover:bg-slate-900"
            >
              <X size={16} />
            </button>
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
        <span>Approved</span>
      </span>
    )
  }
  if (status === 'documents_submitted' || status === 'documents_verified') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
        <FileText size={13} />
        <span>Berkas Masuk</span>
      </span>
    )
  }
  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
        <XCircle size={13} />
        <span>Revisi / Ditolak</span>
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

function DocLink({ title, url, onPreview }: { title: string; url?: string; onPreview: (url: string) => void }) {
  if (!url) {
    return (
      <div className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-slate-400">
        <span className="block font-medium">{title}</span>
        <span className="text-[10px] italic">Belum ada</span>
      </div>
    )
  }

  return (
    <div 
      onClick={() => onPreview(url)}
      className="p-2.5 bg-blue-50/70 border border-blue-200 hover:border-blue-400 rounded-xl text-blue-900 cursor-pointer transition flex justify-between items-center"
    >
      <div>
        <span className="block font-bold">{title}</span>
        <span className="text-[10px] text-blue-600 font-semibold">Buka Dokumen</span>
      </div>
      <ExternalLink size={14} className="text-blue-500" />
    </div>
  )
}
