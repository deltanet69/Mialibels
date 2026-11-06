'use client'

// SPMB Admin Portal T.A 2027/2028 - Modern Bento UI & Mobile-First Redesign
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
  Pencil,
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
  Users,
  Check,
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  ShieldCheck,
  MessageCircle
} from 'lucide-react'
import Link from 'next/link'
import AdminLaunchTimeButton from '@/components/frontend/ppdb/AdminLaunchTimeButton'
import PpdbRegistrationForm from '@/components/frontend/ppdb/PpdbRegistrationForm'
import { registrationToForm, isFulldayRow } from '@/lib/spmb-registration'

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

// Modern Skeleton Loading Components
function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 font-sans animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3.5 ${
            i === 1 ? 'col-span-2 lg:col-span-1' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="h-3.5 bg-slate-200 rounded-md w-24" />
            <div className="w-10 h-10 bg-slate-100 rounded-2xl" />
          </div>
          <div className="space-y-1.5">
            <div className="h-7 bg-slate-200 rounded-xl w-16" />
            <div className="h-3 bg-slate-100 rounded-md w-28" />
          </div>
          <div className="h-2 bg-slate-100 rounded-full w-full" />
        </div>
      ))}
    </div>
  )
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-slate-100">
      <td className="py-4 pr-4 pl-5"><div className="h-6 bg-slate-100 rounded-xl w-24" /></td>
      <td className="py-4 pr-4">
        <div className="h-4.5 bg-slate-100 rounded-lg w-36 mb-1.5" />
        <div className="h-3.5 bg-slate-100 rounded-lg w-28" />
      </td>
      <td className="py-4 pr-4"><div className="h-6 bg-slate-100 rounded-full w-20" /></td>
      <td className="py-4 pr-4">
        <div className="h-4 bg-slate-100 rounded-lg w-28 mb-1" />
        <div className="h-3 bg-slate-100 rounded-lg w-20" />
      </td>
      <td className="py-4 pr-4"><div className="h-7 bg-slate-100 rounded-xl w-24" /></td>
      <td className="py-4 pr-4"><div className="h-6 bg-slate-100 rounded-full w-28" /></td>
      <td className="py-4 pr-5 text-right"><div className="h-8 bg-slate-100 rounded-xl w-20 ml-auto" /></td>
    </tr>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-2xs animate-pulse space-y-4">
      <div className="flex justify-between items-start">
        <div className="h-6 bg-slate-100 rounded-xl w-24" />
        <div className="h-6 bg-slate-100 rounded-full w-24" />
      </div>
      <div className="space-y-2">
        <div className="h-5 bg-slate-100 rounded-lg w-40" />
        <div className="h-3.5 bg-slate-100 rounded-lg w-32" />
      </div>
      <div className="bg-slate-50 rounded-2xl p-3.5 space-y-2">
        <div className="h-3.5 bg-slate-100 rounded w-full" />
        <div className="h-3.5 bg-slate-100 rounded w-3/4" />
      </div>
      <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
        <div className="h-7 bg-slate-100 rounded-xl w-24" />
        <div className="h-8 bg-slate-100 rounded-xl w-32" />
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
  const [formModal, setFormModal] = useState<{ mode: 'admin-create' | 'admin-edit'; applicant?: Applicant } | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  // Action state in detail modal
  const [actionNotes, setActionNotes] = useState('')
  const [processingAction, setProcessingAction] = useState(false)

  // Settings update state
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsForm, setSettingsForm] = useState<any>({})

  useEffect(() => {
    if (typeof window !== 'undefined') {
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
          sessionStorage.setItem(
            CACHE_KEY_DATA,
            JSON.stringify({
              data: dataApps.data || [],
              summary: dataApps.summary || null
            })
          )
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
  const canManage = checkCanManageSpmb(userRole)

  // Toggle Master Switch (Active/Inactive)
  const handleToggleActive = async () => {
    if (!settings || !canManage) return
    const newActive = !settings.is_active

    const confirmMsg = newActive
      ? 'Buka pendaftaran SPMB? Calon murid baru akan dapat mengisi formulir pendaftaran online.'
      : 'Tutup pendaftaran SPMB? Formulir pendaftaran online akan langsung dinonaktifkan untuk publik.'

    if (!window.confirm(confirmMsg)) return

    // Optimistic UI
    setSettings((prev: any) => ({ ...prev, is_active: newActive }))
    setSettingsForm((prev: any) => ({ ...prev, is_active: newActive }))

    try {
      const res = await fetch('/api/spmb/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newActive })
      })

      const json = await res.json()
      if (!json.success) {
        setSettings((prev: any) => ({ ...prev, is_active: !newActive }))
        setSettingsForm((prev: any) => ({ ...prev, is_active: !newActive }))
        alert('Gagal mengubah status SPMB: ' + json.error)
      } else {
        const updated = json.data || { ...settings, is_active: newActive }
        setSettings(updated)
        setSettingsForm(updated)
        sessionStorage.setItem(CACHE_KEY_SETTINGS, JSON.stringify(updated))
      }
    } catch (err) {
      setSettings((prev: any) => ({ ...prev, is_active: !newActive }))
      setSettingsForm((prev: any) => ({ ...prev, is_active: !newActive }))
      console.error('Failed to toggle SPMB status:', err)
    }
  }

  // Count Fullday vs Regular
  const fulldayCount = useMemo(() => {
    return applicants.filter(a => isFulldayRow(a)).length
  }, [applicants])

  const regularCount = useMemo(() => {
    return applicants.filter(a => !isFulldayRow(a)).length
  }, [applicants])

  // Filtered applicants
  const filteredApplicants = useMemo(() => {
    let list = [...applicants]

    if (programFilter === 'fullday') {
      list = list.filter(a => isFulldayRow(a))
    } else if (programFilter === 'regular') {
      list = list.filter(a => !isFulldayRow(a))
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
        if (json.notification) {
          const n = json.notification
          alert(
            'Status berhasil diperbarui.\n\n' +
            'Email ke orang tua: ' + n.email + '\n' +
            'WhatsApp ke orang tua: ' + n.whatsapp +
            (n.detail ? '\nKeterangan: ' + n.detail : '')
          )
        }
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

    let csv = 'No. Registrasi,Nama Lengkap,Program Kelas,JK,Tempat Lahir,Tanggal Lahir,Status,Orang Tua/Wali,NIK,Pekerjaan,No WA,Email,Alamat,Nominal Bayar,Status Bayar,Tgl Daftar,Link Bukti Transfer,Link Akta Kelahiran,Link Kartu Keluarga,Link KTP Orang Tua,Link SK Tamat Belajar\n'

    const linkCell = (url: any) => {
      const u = String(url || '').trim().replace(/"/g, '')
      if (!u) return '""'
      return `"=HYPERLINK(""${u}"",""Lihat Berkas"")"`
    }

    filteredApplicants.forEach(row => {
      const clean = (val: any) => `"${String(val || '').replace(/"/g, '""')}"`
      const isF = isFulldayRow(row)
      const programName = isF ? 'Kelas Fullday' : 'Kelas Regular'

      csv += `${clean(row.registration_number)},${clean(row.student_name)},${clean(programName)},${clean(row.gender)},${clean(row.birth_place)},${clean(row.birth_date)},${clean(row.status)},${clean(row.father_name || row.mother_name)},${clean(row.father_nik || row.mother_nik)},${clean(row.father_occupation || row.mother_occupation)},${clean(row.father_phone || row.mother_phone)},${clean(row.father_email || row.mother_email)},${clean(row.home_address)},${row.payment_amount || 0},${clean(row.payment_status)},${clean(new Date(row.created_at).toLocaleString('id-ID'))},${linkCell(row.payment_proof_url)},${linkCell(row.document_birth_certificate)},${linkCell(row.document_family_card)},${linkCell(row.document_parent_id)},${linkCell(row.document_report_card)}\n`
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
        // open_at diubah lewat tombol "Waktu Pembukaan", bukan form ini
        body: JSON.stringify((({ open_at, ...rest }) => rest)(settingsForm))
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

  // Quota & Target Metrics
  const totalTargetQuota = Number(settings?.batch_1_quota) || 150
  const fulldayTargetQuota = 75
  const regularTargetQuota = 75

  const totalCount = summary?.total || applicants.length
  const totalRemaining = Math.max(0, totalTargetQuota - totalCount)
  const totalPercent = Math.min(100, Math.round((totalCount / totalTargetQuota) * 100))

  const fulldayRemaining = Math.max(0, fulldayTargetQuota - fulldayCount)
  const fulldayPercent = Math.min(100, Math.round((fulldayCount / fulldayTargetQuota) * 100))

  const regularRemaining = Math.max(0, regularTargetQuota - regularCount)
  const regularPercent = Math.min(100, Math.round((regularCount / regularTargetQuota) * 100))

  const pendingCount = summary?.pending || applicants.filter(a => a.status === 'pending_verification').length
  const approvedCount = summary?.approved || applicants.filter(a => a.status === 'approved').length

  const hasActiveFilters = search.trim() !== '' || programFilter !== 'all' || statusFilter !== 'all' || sortOrder !== 'newest'

  return (
    <div className="font-sans space-y-6 max-w-7xl mx-auto pb-16 antialiased">
      
      {/* ════════════════════════════════════════════════════════════════════
          HEADER & MASTER CONTROLS
         ════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs p-5 sm:p-7">
        
        {/* Top Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          
          {/* Left: Badges, Title, Subtitle */}
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/70">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                Sistem Penerimaan Murid Baru
              </span>

              <span className="inline-flex items-center px-2 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                T.A {settings?.academic_year || '2027/2028'}
              </span>

              {isRevalidating && (
                <span className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-medium">
                  <RefreshCw size={12} className="animate-spin text-blue-600" />
                  <span>Sinkronisasi data...</span>
                </span>
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-headline">
                SPMB T.A {settings?.academic_year || '2027/2028'}
              </h1>
              <p className="font-sans text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                Kelola pendaftaran siswa baru, verifikasi bukti transfer, pemantauan alokasi kuota kelas, dan administrasi calon murid.
              </p>
            </div>
          </div>

          {/* Right: Modern Compact Portal Switch */}
          {canManage && (
            <div className="flex items-center lg:self-start">
              <button
                type="button"
                role="switch"
                aria-checked={!!settings?.is_active}
                onClick={handleToggleActive}
                className={`inline-flex items-center gap-3 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.99] ${
                  settings?.is_active
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100/70'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
                title={settings?.is_active ? 'Klik untuk menutup portal pendaftaran publik' : 'Klik untuk membuka portal pendaftaran publik'}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${settings?.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                  <span>Pendaftaran {settings?.is_active ? 'Dibuka' : 'Ditutup'}</span>
                </div>

                <span className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${
                  settings?.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                }`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 mt-0.5 ml-0.5 ${
                    settings?.is_active ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons Toolbar Row */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Primary Action Button */}
          {canManage ? (
            <button
              onClick={() => setFormModal({ mode: 'admin-create' })}
              className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold shadow-sm shadow-blue-600/20 hover:shadow transition-all cursor-pointer w-full sm:w-auto active:scale-[0.98]"
            >
              <UserPlus size={16} className="stroke-[2.5]" />
              <span>Pendaftaran Baru</span>
            </button>
          ) : <div />}

          {/* Secondary Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {canManage && (
              <button
                onClick={() => setShowSettingsModal(true)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs sm:text-sm font-semibold transition cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.98]"
              >
                <Settings2 size={16} className="text-slate-500" />
                <span>Pengaturan</span>
              </button>
            )}

            <button
              onClick={handleExportCsv}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs sm:text-sm font-semibold transition cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.98]"
            >
              <Download size={16} className="text-slate-500" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => fetchData(true)}
              disabled={isRevalidating}
              className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition cursor-pointer shrink-0 shadow-2xs hover:shadow-xs active:scale-[0.98] disabled:opacity-50"
              title="Muat Ulang Data"
              aria-label="Muat ulang data"
            >
              <RefreshCw size={16} className={isRevalidating ? 'animate-spin text-blue-600' : ''} />
            </button>
          </div>

        </div>

      </div>

      {/* ════════════════════════════════════════════════════════════════════
          STATS BENTO CARDS & KUOTA MONITORING
         ════════════════════════════════════════════════════════════════════ */}
      {loading && !summary ? (
        <SkeletonStats />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 font-sans">
          
          {/* Card 1: Total Pendaftar (Hero Kuota - Span 2 on Mobile/Tablet) */}
          <div className="col-span-2 lg:col-span-1 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all duration-200 flex flex-col justify-between gap-3.5 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0 group-hover:scale-105 transition-transform">
                  <Users size={19} />
                </div>
                <div>
                  <span className="block text-xs font-extrabold text-slate-800 leading-tight">Total Pendaftar</span>
                  <span className="block text-[10px] text-slate-400 font-medium">Gabungan Program</span>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                {totalPercent}%
              </span>
            </div>

            <div className="mt-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight tabular-nums">
                  {totalCount}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-slate-400">
                  / {totalTargetQuota} Kuota
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                <span>Sisa Kuota:</span>
                <span className="font-bold text-blue-700">{totalRemaining} Kursi</span>
              </div>
            </div>

            {/* Modern Dual-Layer Progress Bar */}
            <div className="space-y-1.5">
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden" role="progressbar" aria-valuenow={totalCount} aria-valuemin={0} aria-valuemax={totalTargetQuota}>
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-700 ease-out"
                  style={{ width: `${totalPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Kelas Fullday (Quota 75) */}
          <div className="col-span-1 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-purple-300 transition-all duration-200 flex flex-col justify-between gap-3.5 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/25 shrink-0 group-hover:scale-105 transition-transform">
                  <Sparkles size={18} />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-extrabold text-slate-800 leading-tight truncate">Kelas Fullday</span>
                  <span className="block text-[10px] text-purple-600 font-bold">Kuotasi 75</span>
                </div>
              </div>
            </div>

            <div className="mt-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                  {fulldayCount}
                </span>
                <span className="text-xs font-semibold text-slate-400">/ 75</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                <span>Sisa:</span>
                <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100 text-[10px]">
                  {fulldayRemaining} Kursi
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden" role="progressbar" aria-valuenow={fulldayCount} aria-valuemin={0} aria-valuemax={75}>
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-700 ease-out"
                  style={{ width: `${fulldayPercent}%` }}
                />
              </div>
              <div className="text-[10px] text-right font-bold text-purple-600">{fulldayPercent}% Terisi</div>
            </div>
          </div>

          {/* Card 3: Kelas Regular (Quota 75) */}
          <div className="col-span-1 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-teal-300 transition-all duration-200 flex flex-col justify-between gap-3.5 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-teal-500/5 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-md shadow-teal-500/25 shrink-0 group-hover:scale-105 transition-transform">
                  <School size={18} />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-extrabold text-slate-800 leading-tight truncate">Kelas Regular</span>
                  <span className="block text-[10px] text-teal-600 font-bold">Kuotasi 75</span>
                </div>
              </div>
            </div>

            <div className="mt-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight tabular-nums">
                  {regularCount}
                </span>
                <span className="text-xs font-semibold text-slate-400">/ 75</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                <span>Sisa:</span>
                <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100 text-[10px]">
                  {regularRemaining} Kursi
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden" role="progressbar" aria-valuenow={regularCount} aria-valuemin={0} aria-valuemax={75}>
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-600 transition-all duration-700 ease-out"
                  style={{ width: `${regularPercent}%` }}
                />
              </div>
              <div className="text-[10px] text-right font-bold text-teal-600">{regularPercent}% Terisi</div>
            </div>
          </div>

          {/* Card 4: Menunggu Verifikasi (Action-Oriented Card) */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'pending_verification' ? 'all' : 'pending_verification')}
            className={`col-span-1 bg-white p-4 sm:p-5 rounded-3xl border shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-3.5 group cursor-pointer relative overflow-hidden ${
              statusFilter === 'pending_verification'
                ? 'border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/20'
                : 'border-slate-200/90 hover:border-amber-300'
            }`}
            title="Klik untuk filter calon siswa yang menunggu verifikasi"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/25 shrink-0 group-hover:scale-105 transition-transform">
                <Clock size={18} />
              </div>
              {pendingCount > 0 ? (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                  Perlu Dicek
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                  Tuntas
                </span>
              )}
            </div>

            <div className="mt-1">
              <span className="block text-xs font-extrabold text-slate-800 leading-tight">Menunggu Verifikasi</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight tabular-nums">
                  {pendingCount}
                </span>
                <span className="text-xs font-semibold text-slate-400">Pendaftar</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Bukti transfer</span>
              <span className="font-bold text-amber-700 flex items-center gap-0.5 group-hover:underline">
                Filter <ArrowUpRight size={12} />
              </span>
            </div>
          </div>

          {/* Card 5: Diterima / Approved */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'approved' ? 'all' : 'approved')}
            className={`col-span-1 bg-white p-4 sm:p-5 rounded-3xl border shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-3.5 group cursor-pointer relative overflow-hidden ${
              statusFilter === 'approved'
                ? 'border-emerald-400 ring-2 ring-emerald-400/20 bg-emerald-50/20'
                : 'border-slate-200/90 hover:border-emerald-300'
            }`}
            title="Klik untuk filter calon siswa yang sudah disetujui / diterima"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0 group-hover:scale-105 transition-transform">
                <CheckCircle2 size={18} />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                Resmi
              </span>
            </div>

            <div className="mt-1">
              <span className="block text-xs font-extrabold text-slate-800 leading-tight">Diterima / Lulus</span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight tabular-nums">
                  {approvedCount}
                </span>
                <span className="text-xs font-semibold text-slate-400">Siswa</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Status valid</span>
              <span className="font-bold text-emerald-700 flex items-center gap-0.5 group-hover:underline">
                Filter <ArrowUpRight size={12} />
              </span>
            </div>
          </div>

        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          PROGRAM TABS & DATA FILTERS
         ════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-xs border border-slate-200/90 space-y-4 sm:space-y-5">
        
        {/* Top Filter Bar: Program Switcher Pills & View Mode */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          
          {/* Modern Segmented Control Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto max-w-full [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => setProgramFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                programFilter === 'all'
                  ? 'bg-white shadow-xs text-blue-700 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Semua Program</span>
              <span className={`text-[11px] px-2 py-0.2 rounded-full ${
                programFilter === 'all' ? 'bg-blue-50 text-blue-700 font-black' : 'bg-slate-200/70 text-slate-600'
              }`}>
                {applicants.length}
              </span>
            </button>

            <button
              onClick={() => setProgramFilter('fullday')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                programFilter === 'fullday'
                  ? 'bg-white shadow-xs text-purple-700 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles size={13} className={programFilter === 'fullday' ? 'text-purple-600' : 'text-slate-400'} />
              <span>Fullday</span>
              <span className={`text-[11px] px-2 py-0.2 rounded-full ${
                programFilter === 'fullday' ? 'bg-purple-50 text-purple-700 font-black' : 'bg-slate-200/70 text-slate-600'
              }`}>
                {fulldayCount} / 75
              </span>
            </button>

            <button
              onClick={() => setProgramFilter('regular')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                programFilter === 'regular'
                  ? 'bg-white shadow-xs text-teal-700 font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <School size={13} className={programFilter === 'regular' ? 'text-teal-600' : 'text-slate-400'} />
              <span>Regular</span>
              <span className={`text-[11px] px-2 py-0.2 rounded-full ${
                programFilter === 'regular' ? 'bg-teal-50 text-teal-700 font-black' : 'bg-slate-200/70 text-slate-600'
              }`}>
                {regularCount} / 75
              </span>
            </button>
          </div>

          {/* View Mode Toggle (Tablet & Desktop) */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white shadow-xs text-blue-700 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Tabel"
            >
              <List size={15} />
              <span>Tabel</span>
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                viewMode === 'card'
                  ? 'bg-white shadow-xs text-blue-700 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Tampilan Grid Card"
            >
              <LayoutGrid size={15} />
              <span>Grid</span>
            </button>
          </div>
        </div>

        {/* Search & Dropdown Filter Row (Mobile First) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 flex-wrap">
          {/* Search Box */}
          <div className="relative flex-1 sm:min-w-[280px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="text"
              placeholder="Cari nama calon siswa, no registrasi, orang tua..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200"
                title="Hapus pencarian"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status & Sorting Controls */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs sm:text-sm font-bold text-slate-700 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="pending_verification">Menunggu Verifikasi</option>
              <option value="approved">Approved / Lulus</option>
              <option value="documents_submitted">Berkas Terunggah</option>
              <option value="rejected">Revisi / Ditolak</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="w-full sm:w-auto px-3.5 py-2.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs sm:text-sm font-bold text-slate-700 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none cursor-pointer"
            >
              <option value="newest">Pendaftar Terbaru</option>
              <option value="oldest">Pendaftar Terlama</option>
            </select>
          </div>

          {/* Results Count & Reset Filter */}
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:ml-auto w-full sm:w-auto pt-1 sm:pt-0">
            <span className="text-xs font-bold text-blue-800 bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-100 whitespace-nowrap">
              {filteredApplicants.length} Calon Siswa
            </span>

            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSearch('')
                  setProgramFilter('all')
                  setStatusFilter('all')
                  setSortOrder('newest')
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                title="Reset semua filter"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            LIST VIEW TABLE (Tablet & Desktop only)
           ════════════════════════════════════════════════════════════════════ */}
        {viewMode === 'list' && (
          <div className="hidden sm:block overflow-x-auto rounded-2xl border border-slate-200/80 shadow-2xs">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200/80 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
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
                        <SlidersHorizontal size={26} className="text-slate-300" />
                        <span className="font-bold text-slate-700 text-sm">Tidak ada pendaftar yang sesuai filter.</span>
                        {hasActiveFilters && (
                          <button
                            onClick={() => { setSearch(''); setProgramFilter('all'); setStatusFilter('all'); }}
                            className="text-xs text-blue-600 hover:underline mt-1 font-bold inline-flex items-center gap-1"
                          >
                            <RotateCcw size={12} />
                            <span>Reset Filter Pencarian</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedApplicants.map((app) => {
                    const isF = isFulldayRow(app)
                    const phoneClean = (app.father_phone || app.mother_phone || '').replace(/[^0-9]/g, '')
                    const waLink = phoneClean.startsWith('0') ? `https://wa.me/62${phoneClean.slice(1)}` : `https://wa.me/${phoneClean}`

                    return (
                      <tr key={app.id} className="hover:bg-blue-50/35 transition-colors group">
                        
                        {/* Reg Number */}
                        <td className="py-4 pr-4 pl-5">
                          <span className="font-mono text-xs font-black text-blue-700 bg-blue-50/90 px-2.5 py-1 rounded-xl border border-blue-200/80">
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
                            className="font-sans font-extrabold text-[14px] text-slate-900 hover:text-blue-600 transition cursor-pointer flex items-center gap-2"
                          >
                            <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                              {app.student_name.charAt(0).toUpperCase()}
                            </span>
                            <span>{app.student_name}</span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 ml-9">
                            {app.birth_place || '—'}, {app.birth_date ? new Date(app.birth_date).toLocaleDateString('id-ID') : '—'} ({app.gender || '—'})
                          </div>
                        </td>

                        {/* Program Kelas */}
                        <td className="py-4 pr-4">
                          {isF ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              <Sparkles size={11} className="text-purple-600" />
                              <span>Fullday</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                              <School size={11} className="text-teal-600" />
                              <span>Regular</span>
                            </span>
                          )}
                        </td>

                        {/* Parent & Contact */}
                        <td className="py-4 pr-4">
                          <div className="font-sans text-xs font-bold text-slate-800">
                            {app.father_name || app.mother_name || '—'}
                          </div>
                          {(app.father_phone || app.mother_phone) ? (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-sans text-xs text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-1 mt-0.5 hover:underline"
                            >
                              <Phone size={11} />
                              <span>{app.father_phone || app.mother_phone}</span>
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400">Tidak ada nomor</span>
                          )}
                        </td>

                        {/* Payment Proof */}
                        <td className="py-4 pr-4">
                          {app.payment_proof_url ? (
                            <button
                              onClick={() => setPreviewImage(app.payment_proof_url)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200/80 transition cursor-pointer shadow-2xs hover:shadow-xs"
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

                        {/* Actions */}
                        <td className="py-4 pr-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedApplicant(app)
                                actionNotesHandler(app)
                              }}
                              className="p-2 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition cursor-pointer shadow-2xs"
                              title="Detail & Verifikasi"
                            >
                              <Eye size={16} />
                            </button>
                            {canManage && (
                              <button
                                onClick={() => setFormModal({ mode: 'admin-edit', applicant: app })}
                                className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition cursor-pointer"
                                title="Edit Data"
                              >
                                <Pencil size={16} />
                              </button>
                            )}
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
            CARD VIEW (Always on Mobile, Grid Mode on Tablet/Desktop)
           ════════════════════════════════════════════════════════════════════ */}
        <div className={`${viewMode === 'card' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4' : 'sm:hidden space-y-3.5'}`}>
          {loading && applicants.length === 0 ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : paginatedApplicants.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 text-xs bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 p-6">
              <SlidersHorizontal size={26} className="text-slate-300 mx-auto mb-2" />
              <span className="font-bold text-slate-700 block text-sm">Tidak ada calon siswa yang sesuai filter.</span>
            </div>
          ) : (
            paginatedApplicants.map((app) => {
              const isF = isFulldayRow(app)
              const phoneClean = (app.father_phone || app.mother_phone || '').replace(/[^0-9]/g, '')
              const waLink = phoneClean.startsWith('0') ? `https://wa.me/62${phoneClean.slice(1)}` : `https://wa.me/${phoneClean}`

              return (
                <div
                  key={app.id}
                  className="bg-white border border-slate-200/90 p-4 sm:p-5 rounded-3xl shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between gap-3.5 font-sans relative overflow-hidden group"
                >
                  {/* Program Accent Top Border */}
                  <div className={`absolute top-0 left-0 right-0 h-1 ${
                    isF ? 'bg-gradient-to-r from-purple-500 to-indigo-500' : 'bg-gradient-to-r from-teal-500 to-blue-500'
                  }`} />

                  {/* Top Bar: Reg number + Program Badge + Status */}
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-black text-blue-700 bg-blue-50/90 px-2.5 py-1 rounded-xl border border-blue-200/80">
                          {app.registration_number}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isF ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-teal-50 text-teal-700 border border-teal-200'
                        }`}>
                          {isF ? <Sparkles size={11} /> : <School size={11} />}
                          <span>{isF ? 'Fullday' : 'Regular'}</span>
                        </span>
                      </div>
                      <StatusBadge status={app.status} />
                    </div>

                    {/* Student Identity */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-700 font-extrabold text-sm flex items-center justify-center shrink-0 border border-blue-100">
                        {app.student_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4
                          onClick={() => {
                            setSelectedApplicant(app)
                            actionNotesHandler(app)
                          }}
                          className="font-extrabold text-base text-slate-900 hover:text-blue-600 transition cursor-pointer truncate"
                          title={app.student_name}
                        >
                          {app.student_name}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-1">
                          <span>{app.birth_place || '—'}, {app.birth_date ? new Date(app.birth_date).toLocaleDateString('id-ID') : '—'}</span>
                          {app.gender && <span className="text-slate-400 font-bold">({app.gender})</span>}
                        </p>
                      </div>
                    </div>

                    {/* Compact Modern Info Box */}
                    <div className="bg-slate-50/80 border border-slate-100 rounded-2xl p-3.5 text-xs text-slate-600 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400 font-medium shrink-0">Orang Tua / Wali:</span>
                        <span className="font-bold text-slate-800 truncate text-right">
                          {app.father_name || app.mother_name || '—'}
                        </span>
                      </div>

                      {(app.father_phone || app.mother_phone) && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-400 font-medium shrink-0">Kontak WA:</span>
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2 py-0.5 rounded-lg flex items-center gap-1 transition"
                          >
                            <MessageCircle size={12} />
                            <span>{app.father_phone || app.mother_phone}</span>
                          </a>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
                        <span className="text-slate-400 font-medium shrink-0">Biaya Masuk:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-slate-900">
                            Rp {(Number(app.payment_amount) || 300000).toLocaleString('id-ID')}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            app.payment_status === 'verified'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {app.payment_status === 'verified' ? 'Lunas' : 'Menunggu'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
                    {app.payment_proof_url ? (
                      <button
                        onClick={() => setPreviewImage(app.payment_proof_url)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200/80 transition cursor-pointer shadow-2xs hover:shadow-xs"
                      >
                        <ImageIcon size={13} />
                        <span>Lihat Struk</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Belum ada struk</span>
                    )}

                    <div className="flex items-center gap-1.5 ml-auto">
                      <button
                        onClick={() => {
                          setSelectedApplicant(app)
                          actionNotesHandler(app)
                        }}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
                      >
                        <Eye size={13} />
                        <span>Detail</span>
                      </button>

                      {canManage && (
                        <button
                          onClick={() => setFormModal({ mode: 'admin-edit', applicant: app })}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition cursor-pointer"
                          title="Edit Data"
                        >
                          <Pencil size={15} />
                        </button>
                      )}

                      {canManage && (
                        <button
                          onClick={() => handleDeleteApplicant(app.id, app.student_name)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          title="Hapus Data"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
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
                className="ml-2 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer outline-none"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto font-sans">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 my-6 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 bg-slate-50/80 shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200/80">
                    {selectedApplicant.registration_number}
                  </span>
                  <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-lg border ${
                    isFulldayRow(selectedApplicant)
                      ? 'text-purple-700 bg-purple-50 border-purple-200'
                      : 'text-teal-700 bg-teal-50 border-teal-200'
                  }`}>
                    {selectedApplicant.special_needs || (isFulldayRow(selectedApplicant) ? 'Kelas Fullday' : 'Kelas Regular')}
                  </span>
                </div>
                <h3 className="font-black text-xl text-slate-900">
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
            <div className="p-5 sm:p-7 overflow-y-auto space-y-6">
              
              {/* Status & Verification Action Bar */}
              <div className="p-5 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-100 rounded-3xl space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Status Verifikasi:</span>
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
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition"
                    />
                  </div>
                )}

                {/* Action Buttons */}
                {canManage && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                    <button
                      onClick={() => handleUpdateStatus('approved')}
                      disabled={processingAction}
                      className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white py-3 rounded-2xl text-xs font-bold shadow-sm shadow-emerald-500/25 transition cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 size={16} />
                      <span>{processingAction ? 'Memproses & Kirim Notifikasi...' : 'Approve & Kirim Notifikasi Kelulusan'}</span>
                    </button>

                    <button
                      onClick={() => handleUpdateStatus('rejected')}
                      disabled={processingAction}
                      className="sm:w-auto px-5 flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 py-3 rounded-2xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
                    >
                      <XCircle size={16} />
                      <span>{processingAction ? 'Memproses...' : 'Tolak / Perlu Revisi'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Data Calon Siswa */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Data Calon Siswa
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
                  <div>
                    <span className="text-slate-400 block text-xs">Tempat, Tanggal Lahir</span>
                    <span className="font-bold text-slate-800">{selectedApplicant.birth_place || '—'}, {selectedApplicant.birth_date ? new Date(selectedApplicant.birth_date).toLocaleDateString('id-ID') : '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">Jenis Kelamin</span>
                    <span className="font-bold text-slate-800">{selectedApplicant.gender || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">NISN</span>
                    <span className="font-bold text-slate-800">{selectedApplicant.nisn || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">Agama</span>
                    <span className="font-bold text-slate-800">{selectedApplicant.previous_school?.replace('Agama: ', '') || 'Islam'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-xs">Program Pilihan</span>
                    <span className="font-bold text-indigo-700">{selectedApplicant.special_needs || 'Kelas Regular'}</span>
                  </div>
                </div>
              </div>

              {/* Data Orang Tua */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Data Orang Tua / Wali
                </h4>
                <div className="bg-slate-50/80 border border-slate-200/80 p-4 rounded-2xl space-y-2.5 text-xs sm:text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 block text-xs">Nama Lengkap Orang Tua / Wali:</span>
                      <span className="font-bold text-slate-900">{selectedApplicant.father_name || selectedApplicant.mother_name || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-xs">NIK:</span>
                      <span className="font-bold text-slate-900 font-mono">{selectedApplicant.father_nik || selectedApplicant.mother_nik || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-xs">Pekerjaan:</span>
                      <span className="font-bold text-slate-900">{selectedApplicant.father_occupation || selectedApplicant.mother_occupation || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-xs">No. WhatsApp:</span>
                      <span className="font-bold text-slate-900">{selectedApplicant.father_phone || selectedApplicant.mother_phone || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-xs">Email:</span>
                      <span className="font-bold text-slate-900">{selectedApplicant.father_email || selectedApplicant.mother_email || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-xs">Keterangan Tambahan:</span>
                      <span className="font-bold text-slate-900">{selectedApplicant.medical_history || '—'}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-400 block text-xs">Alamat Lengkap:</span>
                    <span className="font-medium text-slate-800 leading-relaxed">{selectedApplicant.home_address || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Pembayaran & Bukti Struk */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                  Pembayaran Biaya Pendaftaran (Bank BTN)
                </h4>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm bg-slate-50/80 border border-slate-200/80 p-4 rounded-2xl">
                  <div>
                    <span className="text-slate-500">Nominal Transfer: </span>
                    <span className="font-black text-slate-900">Rp {(Number(selectedApplicant.payment_amount) || 300000).toLocaleString('id-ID')}</span>
                    <span className="text-slate-400 block mt-0.5">Status Pembayaran: <strong className="text-slate-700">{selectedApplicant.payment_status === 'verified' ? '✓ Terverifikasi' : 'Menunggu Verifikasi'}</strong></span>
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
                  Dokumen Persyaratan Pendaftaran
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
          PENDAFTARAN BARU / EDIT FORM MODAL
         ════════════════════════════════════════════════════════════════════ */}
      {formModal && canManage && settings && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto font-sans">
          <div className="relative bg-slate-50 rounded-3xl shadow-2xl w-full max-w-5xl mx-auto my-4 p-4 sm:p-8 border border-slate-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-extrabold text-lg text-slate-900">
                {formModal.mode === 'admin-edit' ? `Edit Pendaftaran ${formModal.applicant?.registration_number}` : 'Pendaftaran Siswa Baru'}
              </h3>
              <button
                onClick={() => setFormModal(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                title="Tutup"
              >
                <X size={20} />
              </button>
            </div>
            <PpdbRegistrationForm
              settings={settings}
              mode={formModal.mode}
              recordId={formModal.applicant?.id}
              initial={formModal.applicant ? registrationToForm(formModal.applicant) : undefined}
              onDone={() => {
                setFormModal(null)
                setSelectedApplicant(null)
                fetchData(true)
              }}
            />
          </div>
        </div>
      )}

      {canManage && (
        <AdminLaunchTimeButton
          openAt={settings?.open_at}
          onSaved={(d) => { setSettings(d); setSettingsForm(d); sessionStorage.setItem(CACHE_KEY_SETTINGS, JSON.stringify(d)) }}
        />
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
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <div>
                  <span className="block text-xs font-bold text-slate-800">Status Pendaftaran SPMB</span>
                  <span className="text-[11px] text-slate-500">
                    {settingsForm.is_active ? 'Portal pendaftaran dibuka untuk umum' : 'Portal pendaftaran ditutup untuk umum'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSettingsForm({ ...settingsForm, is_active: !settingsForm.is_active })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    settingsForm.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      settingsForm.is_active ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

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
                  value={settingsForm.batch_1_quota || 150}
                  onChange={(e) => setSettingsForm({ ...settingsForm, batch_1_quota: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Biaya Formulir &amp; Pendaftaran (Rp)</label>
                <input
                  type="number"
                  value={settingsForm.registration_fee || 300000}
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
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
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

  function actionNotesHandler(app: Applicant) {
    setActionNotes(app.admin_notes || '')
  }
}

// Subcomponents: StatusBadge & DocLink
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
