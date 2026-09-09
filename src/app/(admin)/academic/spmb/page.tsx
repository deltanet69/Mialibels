'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import {
  Search,
  Trash2,
  Eye,
  Phone,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  LayoutGrid,
  List,
  UserPlus,
  ExternalLink,
  Image as ImageIcon,
  X,
  Settings2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  School,
  FileCheck
} from 'lucide-react'
import Link from 'next/link'

// Resilient RBAC check functions
function checkCanAccessSpmb(role?: string | null): boolean {
  if (!role) return false
  const r = role.toLowerCase().trim()
  return r === 'superadmin' || r === 'administrasi' || r === 'staff_operator' || r === 'kepsek'
}

function checkCanManageSpmb(role?: string | null): boolean {
  if (!role) return false
  const r = role.toLowerCase().trim()
  return r === 'superadmin' || r === 'administrasi' || r === 'staff_operator'
}

// Types
type Applicant = {
  id: string
  registration_number: string
  academic_year: string
  batch: number
  assigned_batch: number
  student_name: string
  student_nickname?: string // 'fullday' | 'regular'
  birth_place: string
  birth_date: string
  gender: string
  weight?: number
  height?: number
  blood_type?: string
  nisn?: string
  previous_school?: string // 'Agama: Islam'
  special_needs?: string // 'Program Kelas Fullday' | 'Program Kelas Regular'
  medical_history?: string // 'Hubungan: Ayah Kandung | Agama Ortu: Islam'
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

// Skeleton Components
function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4 font-sans animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-3 bg-slate-200 rounded-md w-20" />
            <div className="h-7 bg-slate-200 rounded-lg w-12" />
          </div>
          <div className="w-11 h-11 bg-slate-100 rounded-2xl" />
        </div>
      ))}
    </div>
  )
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-slate-100">
      <td className="py-4 pr-4 pl-5"><div className="h-5 bg-slate-100 rounded-xl w-24" /></td>
      <td className="py-4 pr-4">
        <div className="h-4.5 bg-slate-100 rounded-lg w-36 mb-1.5" />
        <div className="h-3.5 bg-slate-100 rounded-lg w-28" />
      </td>
      <td className="py-4 pr-4"><div className="h-6 bg-slate-100 rounded-full w-20" /></td>
      <td className="py-4 pr-4">
        <div className="h-4 bg-slate-100 rounded-lg w-28 mb-1" />
        <div className="h-3 bg-slate-100 rounded-lg w-20" />
      </td>
      <td className="py-4 pr-4"><div className="h-6 bg-slate-100 rounded-xl w-24" /></td>
      <td className="py-4 pr-4"><div className="h-6 bg-slate-100 rounded-full w-28" /></td>
      <td className="py-4 pr-5 text-right"><div className="h-8 bg-slate-100 rounded-xl w-16 ml-auto" /></td>
    </tr>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-2xs animate-pulse space-y-4">
      <div className="flex justify-between items-start">
        <div className="h-5 bg-slate-100 rounded-xl w-24" />
        <div className="h-5 bg-slate-100 rounded-full w-20" />
      </div>
      <div className="space-y-2">
        <div className="h-5 bg-slate-100 rounded-lg w-40" />
        <div className="h-3.5 bg-slate-100 rounded-lg w-32" />
      </div>
      <div className="bg-slate-50 rounded-2xl p-3 space-y-2">
        <div className="h-3.5 bg-slate-100 rounded w-full" />
        <div className="h-3.5 bg-slate-100 rounded w-3/4" />
      </div>
      <div className="pt-3 border-t border-slate-100 flex justify-between">
        <div className="h-4 bg-slate-100 rounded w-20" />
        <div className="h-7 bg-slate-100 rounded-xl w-28" />
      </div>
    </div>
  )
}

const CACHE_KEY_DATA = 'spmb_admin_cache_data_v2'
const CACHE_KEY_SETTINGS = 'spmb_admin_cache_settings_v2'

export default function AdminSpmbPage() {
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [settings, setSettings] = useState<any>(null)
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isRevalidating, setIsRevalidating] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  // Filters & Search
  const [search, setSearch] = useState('')
  const [programFilter, setProgramFilter] = useState<'all' | 'fullday' | 'regular'>('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(15)

  // Modals
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  // Action state in detail modal
  const [actionNotes, setActionNotes] = useState('')
  const [processingAction, setProcessingAction] = useState(false)

  // Settings update state
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsForm, setSettingsForm] = useState<any>({})

  // Dynamic SPMB Subdomain URL
  const [spmbUrl, setSpmbUrl] = useState('https://spmb.miattaqwa15.sch.id')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.location.hostname.includes('localhost')) {
        const port = window.location.port ? `:${window.location.port}` : ':3000'
        setSpmbUrl(`http://spmb.localhost${port}`)
      } else {
        setSpmbUrl('https://spmb.miattaqwa15.sch.id')
      }

      // Instant Cache Hydration
      try {
        const cachedData = sessionStorage.getItem(CACHE_KEY_DATA)
        const cachedSettings = sessionStorage.getItem(CACHE_KEY_SETTINGS)
        if (cachedData) {
          const parsed = JSON.parse(cachedData)
          if (parsed?.data) setApplicants(parsed.data)
          if (parsed?.summary) setSummary(parsed.summary)
          setLoading(false)
        }
        if (cachedSettings) {
          const parsedSet = JSON.parse(cachedSettings)
          if (parsedSet) {
            setSettings(parsedSet)
            setSettingsForm(parsedSet)
          }
        }
      } catch (err) {
        console.warn('SPMB cache read failed:', err)
      }
    }
  }, [])

  // Fetch / Revalidate Data
  const fetchData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRevalidating(true)
    try {
      const [resApps, resSettings, resMe] = await Promise.all([
        fetch('/api/spmb/admin?_t=' + Date.now(), { cache: 'no-store' }),
        fetch('/api/spmb/admin/settings?_t=' + Date.now(), { cache: 'no-store' }),
        fetch('/api/auth/me', { cache: 'no-store' })
      ])

      const dataApps = await resApps.json()
      const dataSettings = await resSettings.json()
      const dataMe = await resMe.json()

      if (dataApps.success) {
        setApplicants(dataApps.data || [])
        setSummary(dataApps.summary || null)
        try {
          sessionStorage.setItem(CACHE_KEY_DATA, JSON.stringify({
            data: dataApps.data || [],
            summary: dataApps.summary || null
          }))
        } catch {
          // ignore
        }
      }

      if (dataSettings.success && dataSettings.data) {
        setSettings(dataSettings.data)
        setSettingsForm(dataSettings.data)
        try {
          sessionStorage.setItem(CACHE_KEY_SETTINGS, JSON.stringify(dataSettings.data))
        } catch {
          // ignore
        }
      }

      if (dataMe.success) {
        setCurrentUser(dataMe.user)
      }
    } catch (err) {
      console.error('Error fetching SPMB admin data:', err)
    } finally {
      setLoading(false)
      setIsRevalidating(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // RBAC checks
  const userRole = currentUser?.role || null
  const hasAccess = checkCanAccessSpmb(userRole)
  const canManage = checkCanManageSpmb(userRole)

  // Toggle Master Switch (Active/Inactive)
  const handleToggleActive = async () => {
    if (!settings || !canManage) return
    const newActive = !settings.is_active

    // Optimistic UI
    setSettings((prev: any) => ({ ...prev, is_active: newActive }))

    try {
      const res = await fetch('/api/spmb/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newActive })
      })

      const json = await res.json()
      if (!json.success) {
        setSettings((prev: any) => ({ ...prev, is_active: !newActive }))
        alert('Gagal mengubah status SPMB: ' + json.error)
      } else {
        sessionStorage.setItem(CACHE_KEY_SETTINGS, JSON.stringify({ ...settings, is_active: newActive }))
      }
    } catch (err) {
      setSettings((prev: any) => ({ ...prev, is_active: !newActive }))
      console.error('Failed to toggle SPMB status:', err)
    }
  }

  // Count Fullday vs Regular
  const fulldayCount = useMemo(() => {
    return applicants.filter(a => 
      (a.student_nickname && a.student_nickname.toLowerCase().includes('fullday')) ||
      (a.special_needs && a.special_needs.toLowerCase().includes('fullday'))
    ).length
  }, [applicants])

  const regularCount = useMemo(() => {
    return applicants.filter(a => 
      !((a.student_nickname && a.student_nickname.toLowerCase().includes('fullday')) ||
        (a.special_needs && a.special_needs.toLowerCase().includes('fullday')))
    ).length
  }, [applicants])

  // Filtered applicants
  const filteredApplicants = useMemo(() => {
    let list = [...applicants]

    if (programFilter === 'fullday') {
      list = list.filter(a => 
        (a.student_nickname && a.student_nickname.toLowerCase().includes('fullday')) ||
        (a.special_needs && a.special_needs.toLowerCase().includes('fullday'))
      )
    } else if (programFilter === 'regular') {
      list = list.filter(a => 
        !((a.student_nickname && a.student_nickname.toLowerCase().includes('fullday')) ||
          (a.special_needs && a.special_needs.toLowerCase().includes('fullday')))
      )
    }

    if (statusFilter !== 'all') {
      list = list.filter(a => a.status === statusFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(a =>
        a.student_name?.toLowerCase().includes(q) ||
        a.registration_number?.toLowerCase().includes(q) ||
        a.father_name?.toLowerCase().includes(q) ||
        a.father_phone?.includes(q) ||
        a.father_email?.toLowerCase().includes(q) ||
        a.mother_name?.toLowerCase().includes(q) ||
        a.mother_phone?.includes(q)
      )
    }

    if (sortOrder === 'oldest') {
      list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    } else {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    return list
  }, [applicants, programFilter, statusFilter, search, sortOrder])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, programFilter, statusFilter, sortOrder])

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredApplicants.length / itemsPerPage))
  const paginatedApplicants = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredApplicants.slice(start, start + itemsPerPage)
  }, [filteredApplicants, currentPage, itemsPerPage])

  // Status Action handler (Approve / Reject)
  const handleUpdateStatus = async (status: string) => {
    if (!selectedApplicant || !canManage) return

    setProcessingAction(true)
    const prevApplicant = { ...selectedApplicant }
    const updatedPaymentStatus = status === 'approved' ? 'verified' : selectedApplicant.payment_status

    // Optimistic update
    const updatedRecord = {
      ...selectedApplicant,
      status,
      admin_notes: actionNotes.trim() || undefined,
      payment_status: updatedPaymentStatus
    }
    setApplicants(prev => prev.map(a => a.id === selectedApplicant.id ? updatedRecord : a))
    setSelectedApplicant(updatedRecord)

    try {
      const res = await fetch('/api/spmb/admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedApplicant.id,
          status,
          admin_notes: actionNotes.trim() || null,
          payment_status: updatedPaymentStatus
        })
      })

      const json = await res.json()
      if (json.success && json.data) {
        setApplicants(prev => prev.map(a => a.id === selectedApplicant.id ? json.data : a))
        setSelectedApplicant(json.data)
        fetchData(false)
      } else {
        setApplicants(prev => prev.map(a => a.id === selectedApplicant.id ? prevApplicant : a))
        setSelectedApplicant(prevApplicant)
        alert('Gagal update status: ' + (json.error || 'Terjadi kesalahan'))
      }
    } catch (err: any) {
      setApplicants(prev => prev.map(a => a.id === selectedApplicant.id ? prevApplicant : a))
      setSelectedApplicant(prevApplicant)
      alert('Terjadi kesalahan: ' + err.message)
    } finally {
      setProcessingAction(false)
    }
  }

  // Delete applicant
  const handleDeleteApplicant = async (id: string, name: string) => {
    if (!canManage) return
    if (!confirm(`Hapus permanen data pendaftar ${name}? Tindakan ini tidak dapat dibatalkan.`)) return

    setApplicants(prev => prev.filter(a => a.id !== id))
    if (selectedApplicant?.id === id) setSelectedApplicant(null)

    try {
      const res = await fetch(`/api/spmb/admin?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json.success) {
        alert('Gagal menghapus: ' + json.error)
        fetchData(false)
      } else {
        fetchData(false)
      }
    } catch (err: any) {
      alert('Error: ' + err.message)
      fetchData(false)
    }
  }

  // Export CSV
  const handleExportCsv = () => {
    if (filteredApplicants.length === 0) {
      alert('Tidak ada data pendaftar untuk diekspor.')
      return
    }

    let csv = 'No. Registrasi,Nama Lengkap,Program Kelas,JK,Tempat Lahir,Tanggal Lahir,Status,Orang Tua/Wali,NIK,Pekerjaan,No WA,Email,Alamat,Nominal Bayar,Status Bayar,Tgl Daftar\n'

    filteredApplicants.forEach(row => {
      const clean = (val: any) => `"${String(val || '').replace(/"/g, '""')}"`
      const isF = (row.student_nickname && row.student_nickname.toLowerCase().includes('fullday')) || (row.special_needs && row.special_needs.toLowerCase().includes('fullday'))
      const programName = isF ? 'Kelas Fullday' : 'Kelas Regular'

      csv += `${clean(row.registration_number)},${clean(row.student_name)},${clean(programName)},${clean(row.gender)},${clean(row.birth_place)},${clean(row.birth_date)},${clean(row.status)},${clean(row.father_name || row.mother_name)},${clean(row.father_nik || row.mother_nik)},${clean(row.father_occupation || row.mother_occupation)},${clean(row.father_phone || row.mother_phone)},${clean(row.father_email || row.mother_email)},${clean(row.home_address)},${row.payment_amount || 0},${clean(row.payment_status)},${clean(new Date(row.created_at).toLocaleString('id-ID'))}\n`
    })

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `SPMB_Pendaftar_${programFilter === 'all' ? 'Semua_Program' : programFilter}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canManage) return
    setSavingSettings(true)
    try {
      const res = await fetch('/api/spmb/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm)
      })
      const json = await res.json()
      if (json.success) {
        setSettings(json.data)
        sessionStorage.setItem(CACHE_KEY_SETTINGS, JSON.stringify(json.data))
        setShowSettingsModal(false)
        alert('Pengaturan SPMB berhasil disimpan.')
        fetchData(false)
      } else {
        alert('Gagal menyimpan: ' + json.error)
      }
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setSavingSettings(false)
    }
  }

  return (
    <div className="font-sans space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* ════════════════════════════════════════════════════════════════════
          HEADER & MASTER CONTROLS
         ════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-6 sm:p-7 rounded-3xl shadow-xs border border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              Sistem Penerimaan Murid Baru
            </span>
            {isRevalidating && (
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                <RefreshCw size={12} className="animate-spin text-blue-600" />
                <span>Menyelaraskan data...</span>
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-headline mt-2">
            SPMB T.A {settings?.academic_year || '2027/2028'}
          </h1>
          <p className="font-sans text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola data pendaftaran siswa baru, verifikasi berkas transfer, dan seleksi program kelas.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full xl:w-auto flex-wrap">
          
          {/* Master Toggle Status Switch */}
          {canManage && (
            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-2xl">
              <span className="text-xs font-bold text-slate-700">Status Portal:</span>
              <button
                onClick={handleToggleActive}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings?.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
                title={settings?.is_active ? 'Klik untuk menutup pendaftaran' : 'Klik untuk membuka pendaftaran'}
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
          )}

          {/* Refresh Button */}
          <button
            onClick={() => fetchData(true)}
            disabled={isRevalidating}
            className="btn-tactile flex items-center justify-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-700 px-3.5 py-2.5 rounded-2xl hover:bg-slate-100 transition text-xs font-bold shadow-2xs cursor-pointer"
            title="Muat Ulang Data"
          >
            <RefreshCw size={14} className={isRevalidating ? 'animate-spin text-blue-600' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Settings Modal Button */}
          {canManage && (
            <button
              onClick={() => setShowSettingsModal(true)}
              className="btn-tactile flex items-center justify-center gap-2 bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-2xl hover:bg-slate-100 transition text-xs font-bold shadow-2xs cursor-pointer"
            >
              <Settings2 size={15} />
              <span>Pengaturan</span>
            </button>
          )}

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            className="btn-tactile flex items-center justify-center gap-2 bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-2xl hover:bg-slate-100 transition text-xs font-bold shadow-2xs cursor-pointer"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>

          {/* Public Link */}
          <a
            href={spmbUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-tactile flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl transition text-xs font-bold shadow-md shadow-blue-600/20"
          >
            <ExternalLink size={15} />
            <span>Halaman Publik</span>
          </a>

        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          STATS BENTO CARDS
         ════════════════════════════════════════════════════════════════════ */}
      {loading && !summary ? (
        <SkeletonStats />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4 font-sans">
          
          {/* Total Pendaftar */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between hover:border-blue-200 transition">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Pendaftar</span>
              <h3 className="font-extrabold text-2xl sm:text-3xl text-slate-900">{summary?.total || applicants.length}</h3>
            </div>
            <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold">
              <UserPlus size={20} />
            </div>
          </div>

          {/* Kelas Fullday */}
          <div className="bg-white p-5 rounded-3xl border border-indigo-200/80 shadow-2xs flex items-center justify-between hover:border-indigo-300 transition">
            <div>
              <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider block mb-1">Kelas Fullday</span>
              <div className="flex items-baseline gap-1">
                <h3 className="font-extrabold text-2xl sm:text-3xl text-indigo-700">{fulldayCount}</h3>
                <span className="text-xs font-bold text-slate-400">/ 30 Siswa</span>
              </div>
            </div>
            <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-bold">
              <Sparkles size={20} />
            </div>
          </div>

          {/* Kelas Regular */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between hover:border-teal-200 transition">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Kelas Regular</span>
              <h3 className="font-extrabold text-2xl sm:text-3xl text-slate-800">{regularCount}</h3>
            </div>
            <div className="w-11 h-11 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center font-bold">
              <School size={20} />
            </div>
          </div>

          {/* Menunggu Verifikasi */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between hover:border-amber-200 transition">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Verifikasi</span>
              <h3 className="font-extrabold text-2xl sm:text-3xl text-amber-600">{summary?.pending || 0}</h3>
            </div>
            <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center font-bold">
              <Clock size={20} />
            </div>
          </div>

          {/* Lulus / Approved */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex items-center justify-between hover:border-emerald-200 transition col-span-2 lg:col-span-1">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Approved / Diterima</span>
              <h3 className="font-extrabold text-2xl sm:text-3xl text-emerald-600">{summary?.approved || 0}</h3>
            </div>
            <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-bold">
              <CheckCircle2 size={20} />
            </div>
          </div>

        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          PROGRAM TABS & FILTERS
         ════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white p-5 sm:p-7 rounded-3xl shadow-xs border border-slate-200/80 space-y-6">
        
        {/* Program Selector Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl overflow-x-auto max-w-full">
            <button
              onClick={() => setProgramFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                programFilter === 'all' ? 'bg-white shadow-2xs text-blue-700 font-extrabold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Program ({applicants.length})
            </button>
            <button
              onClick={() => setProgramFilter('fullday')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                programFilter === 'fullday' ? 'bg-white shadow-2xs text-indigo-700 font-extrabold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kelas Fullday ({fulldayCount} / 30)
            </button>
            <button
              onClick={() => setProgramFilter('regular')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                programFilter === 'regular' ? 'bg-white shadow-2xs text-blue-700 font-extrabold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kelas Regular ({regularCount})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-xl transition cursor-pointer ${viewMode === 'list' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-400 hover:text-slate-700'}`}
              title="Tampilan Tabel"
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`p-2 rounded-xl transition cursor-pointer ${viewMode === 'card' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-400 hover:text-slate-700'}`}
              title="Tampilan Kartu"
            >
              <LayoutGrid size={18} />
            </button>
          </div>
        </div>

        {/* Search & Status Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3 flex-wrap">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari nama, no registrasi, atau kontak..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X size={14} />
              </button>
            )}
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

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs font-bold text-blue-800 bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-100 whitespace-nowrap">
              {filteredApplicants.length} Calon Siswa
            </span>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            LIST VIEW TABLE
           ════════════════════════════════════════════════════════════════════ */}
        {viewMode === 'list' && (
          <div className="hidden sm:block overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 pr-4 pl-5">No. Registrasi</th>
                  <th className="py-4 pr-4">Nama Calon Siswa</th>
                  <th className="py-4 pr-4">Program Kelas</th>
                  <th className="py-4 pr-4">Orang Tua / Kontak</th>
                  <th className="py-4 pr-4">Bukti Bayar</th>
                  <th className="py-4 pr-4">Status</th>
                  <th className="py-4 pr-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {loading && applicants.length === 0 ? (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </>
                ) : paginatedApplicants.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-14 text-center text-slate-400 text-xs">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <SlidersHorizontal size={24} className="text-slate-300" />
                        <span className="font-semibold text-slate-600">Tidak ada pendaftar yang sesuai filter.</span>
                        {(search || programFilter !== 'all' || statusFilter !== 'all') && (
                          <button
                            onClick={() => { setSearch(''); setProgramFilter('all'); setStatusFilter('all'); }}
                            className="text-xs text-blue-600 hover:underline mt-1 font-bold inline-flex items-center gap-1"
                          >
                            <RotateCcw size={12} />
                            <span>Reset Filter</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedApplicants.map((app) => {
                    const isF = (app.student_nickname && app.student_nickname.toLowerCase().includes('fullday')) || (app.special_needs && app.special_needs.toLowerCase().includes('fullday'))
                    return (
                      <tr key={app.id} className="hover:bg-blue-50/30 transition-colors group">
                        
                        {/* Reg Number */}
                        <td className="py-4 pr-4 pl-5">
                          <span className="font-mono text-xs font-black text-blue-800 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-100">
                            {app.registration_number}
                          </span>
                        </td>

                        {/* Student Name */}
                        <td className="py-4 pr-4">
                          <div 
                            onClick={() => {
                              setSelectedApplicant(app)
                              setActionNotes(app.admin_notes || '')
                            }}
                            className="font-sans font-bold text-[14px] text-slate-900 hover:text-blue-600 transition cursor-pointer"
                          >
                            {app.student_name}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {app.birth_place}, {app.birth_date ? new Date(app.birth_date).toLocaleDateString('id-ID') : '—'} ({app.gender})
                          </div>
                        </td>

                        {/* Program Kelas */}
                        <td className="py-4 pr-4">
                          {isF ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <Sparkles size={11} />
                              <span>Fullday</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <School size={11} />
                              <span>Regular</span>
                            </span>
                          )}
                        </td>

                        {/* Parent */}
                        <td className="py-4 pr-4">
                          <div className="font-sans text-xs sm:text-sm font-semibold text-slate-800">
                            {app.father_name || app.mother_name || '—'}
                          </div>
                          <div className="font-sans text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone size={12} />
                            <span>{app.father_phone || app.mother_phone || '—'}</span>
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
                              onClick={() => {
                                setSelectedApplicant(app)
                                setActionNotes(app.admin_notes || '')
                              }}
                              className="p-2 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition cursor-pointer"
                              title="Detail & Verifikasi"
                            >
                              <Eye size={16} />
                            </button>
                            {canManage && (
                              <button
                                onClick={() => handleDeleteApplicant(app.id, app.student_name)}
                                className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                                title="Hapus Data"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>

                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            CARD VIEW (Grid mode)
           ════════════════════════════════════════════════════════════════════ */}
        <div className={`${viewMode === 'card' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4' : 'sm:hidden space-y-3.5'}`}>
          {loading && applicants.length === 0 ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : paginatedApplicants.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 text-xs">
              Tidak ada pendaftar yang sesuai filter.
            </div>
          ) : (
            paginatedApplicants.map((app) => {
              const isF = (app.student_nickname && app.student_nickname.toLowerCase().includes('fullday')) || (app.special_needs && app.special_needs.toLowerCase().includes('fullday'))
              return (
                <div
                  key={app.id}
                  className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-4 font-sans"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-xs font-black text-blue-800 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-100">
                        {app.registration_number}
                      </span>
                      <StatusBadge status={app.status} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                          isF ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {isF ? 'Kelas Fullday' : 'Kelas Regular'}
                        </span>
                      </div>
                      <h4 
                        onClick={() => {
                          setSelectedApplicant(app)
                          setActionNotes(app.admin_notes || '')
                        }}
                        className="font-bold text-base text-slate-900 hover:text-blue-600 transition cursor-pointer"
                      >
                        {app.student_name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {app.birth_place}, {app.birth_date ? new Date(app.birth_date).toLocaleDateString('id-ID') : '—'}
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-3 text-xs text-slate-600 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Orang Tua:</span>
                        <span className="font-bold text-slate-800">{app.father_name || app.mother_name || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">WhatsApp:</span>
                        <span className="font-semibold text-slate-700">{app.father_phone || app.mother_phone || '—'}</span>
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
                        onClick={() => {
                          setSelectedApplicant(app)
                          setActionNotes(app.admin_notes || '')
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                      >
                        Detail &amp; Verifikasi
                      </button>
                    </div>
                  </div>

                </div>
              )
            })
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            PAGINATION CONTROLS
           ════════════════════════════════════════════════════════════════════ */}
        {filteredApplicants.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>Menampilkan</span>
              <span className="font-bold text-slate-800">
                {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredApplicants.length)}
              </span>
              <span>dari</span>
              <span className="font-bold text-slate-800">{filteredApplicants.length}</span>
              <span>calon siswa</span>

              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="ml-2 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer outline-none"
              >
                <option value={10}>10 / hal</option>
                <option value={15}>15 / hal</option>
                <option value={25}>25 / hal</option>
                <option value={50}>50 / hal</option>
              </select>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = i + 1
                    if (totalPages > 5) {
                      if (currentPage > 3) {
                        pageNum = currentPage - 2 + i
                      }
                      if (pageNum > totalPages) {
                        pageNum = totalPages - (4 - i)
                      }
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition cursor-pointer ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  title="Halaman Selanjutnya"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
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
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-black text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100">
                    {selectedApplicant.registration_number}
                  </span>
                  <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                    {selectedApplicant.special_needs || ((selectedApplicant.student_nickname === 'fullday') ? 'Kelas Fullday' : 'Kelas Regular')}
                  </span>
                </div>
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
                </div>

                {/* Notes Input */}
                {canManage && (
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Catatan Administrasi / Alasan Penolakan:
                    </label>
                    <textarea
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      placeholder="Contoh: Berkas lengkap dan pembayaran tervalidasi / Siap daftar ulang..."
                      rows={2}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                )}

                {/* Action Buttons */}
                {canManage && (
                  <div className="flex items-center gap-2.5 pt-1">
                    <button
                      onClick={() => handleUpdateStatus('approved')}
                      disabled={processingAction}
                      className="btn-tactile flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                    >
                      <CheckCircle2 size={15} />
                      <span>{processingAction ? 'Memproses & Kirim Email...' : 'Approve & Kirim Email Kelulusan'}</span>
                    </button>

                    <button
                      onClick={() => handleUpdateStatus('rejected')}
                      disabled={processingAction}
                      className="btn-tactile flex-1 flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                    >
                      <XCircle size={15} />
                      <span>{processingAction ? 'Memproses...' : 'Tolak / Perlu Revisi'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Data Calon Siswa */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                  👤 Data Calon Siswa
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Tempat, Tanggal Lahir</span>
                    <span className="font-bold text-slate-800">{selectedApplicant.birth_place || '—'}, {selectedApplicant.birth_date ? new Date(selectedApplicant.birth_date).toLocaleDateString('id-ID') : '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Jenis Kelamin</span>
                    <span className="font-bold text-slate-800">{selectedApplicant.gender || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">NISN</span>
                    <span className="font-bold text-slate-800">{selectedApplicant.nisn || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Agama</span>
                    <span className="font-bold text-slate-800">{selectedApplicant.previous_school?.replace('Agama: ', '') || 'Islam'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block">Program Pilihan</span>
                    <span className="font-bold text-indigo-700">{selectedApplicant.special_needs || 'Kelas Regular'}</span>
                  </div>
                </div>
              </div>

              {/* Data Orang Tua */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                  👨‍👩‍👧 Data Orang Tua / Wali
                </h4>
                <div className="bg-slate-50 p-4 rounded-2xl space-y-2 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 block">Nama Lengkap Orang Tua / Wali:</span>
                      <span className="font-bold text-slate-900 text-sm">{selectedApplicant.father_name || selectedApplicant.mother_name || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">NIK:</span>
                      <span className="font-bold text-slate-900 font-mono">{selectedApplicant.father_nik || selectedApplicant.mother_nik || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Pekerjaan:</span>
                      <span className="font-bold text-slate-900">{selectedApplicant.father_occupation || selectedApplicant.mother_occupation || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">No. WhatsApp:</span>
                      <span className="font-bold text-slate-900">{selectedApplicant.father_phone || selectedApplicant.mother_phone || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Email:</span>
                      <span className="font-bold text-slate-900">{selectedApplicant.father_email || selectedApplicant.mother_email || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Keterangan Tambahan:</span>
                      <span className="font-bold text-slate-900">{selectedApplicant.medical_history || '—'}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-400 block">Alamat Lengkap:</span>
                    <span className="font-medium text-slate-800 leading-relaxed">{selectedApplicant.home_address || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Pembayaran & Bukti Struk */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                  💳 Pembayaran Biaya Pendaftaran (Bank BTN)
                </h4>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs bg-slate-50 p-4 rounded-2xl">
                  <div>
                    <span className="text-slate-500">Nominal Transfer: </span>
                    <span className="font-bold text-slate-900">Rp {(Number(selectedApplicant.payment_amount) || 200000).toLocaleString('id-ID')}</span>
                    <span className="text-slate-400 block mt-0.5">Status Pembayaran: <strong>{selectedApplicant.payment_status === 'verified' ? '✓ Terverifikasi' : 'Menunggu Verifikasi'}</strong></span>
                  </div>

                  {selectedApplicant.payment_proof_url && (
                    <button
                      onClick={() => setPreviewImage(selectedApplicant.payment_proof_url)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                    >
                      <ImageIcon size={14} />
                      <span>Buka Bukti Bayar</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Dokumen Terunggah */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                  📁 Dokumen Persyaratan Pendaftaran
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <DocLink title="Akta Kelahiran" url={selectedApplicant.document_birth_certificate} onPreview={setPreviewImage} />
                  <DocLink title="Kartu Keluarga" url={selectedApplicant.document_family_card} onPreview={setPreviewImage} />
                  <DocLink title="KTP Orang Tua" url={selectedApplicant.document_parent_id} onPreview={setPreviewImage} />
                  <DocLink title="SK Tamat Belajar" url={selectedApplicant.document_report_card} onPreview={setPreviewImage} />
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
                <span>Pengaturan Sistem SPMB</span>
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

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Target Kuota Total Penerimaan</label>
                <input
                  type="number"
                  value={settingsForm.batch_1_quota || 120}
                  onChange={(e) => setSettingsForm({ ...settingsForm, batch_1_quota: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Biaya Formulir &amp; Pendaftaran (Rp)</label>
                <input
                  type="number"
                  value={settingsForm.registration_fee || 200000}
                  onChange={(e) => setSettingsForm({ ...settingsForm, registration_fee: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">No. Rekening Bank BTN</label>
                  <input
                    type="text"
                    value={settingsForm.bank_account_number || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, bank_account_number: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">No. WA Panitia SPMB</label>
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
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="btn-tactile px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
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
              className="absolute top-4 right-4 p-2 bg-slate-900/70 text-white rounded-full hover:bg-slate-900 transition"
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
