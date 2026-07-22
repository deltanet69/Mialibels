'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import {
  Users, UserPlus, Edit3, Trash2, Search, Shield, ShieldCheck,
  GraduationCap, CheckCircle, XCircle, Eye, EyeOff, X, Loader2, RefreshCw,
  AlertTriangle, Download
} from 'lucide-react'

type Admin = {
  id: string
  name: string
  email: string
  role: 'superadmin' | 'kepsek' | 'guru' | 'staff'
  is_active: boolean
  created_at: string
}

type FormData = {
  name: string
  email: string
  password: string
  role: string
  is_active: boolean
}

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  superadmin: { label: 'Super Admin', color: 'bg-violet-100 text-violet-800 border-violet-200', icon: Shield },
  kepsek: { label: 'Kepala Sekolah', color: 'bg-teal-100 text-teal-800 border-teal-200', icon: ShieldCheck },
  guru: { label: 'Guru', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: GraduationCap },
  staff: { label: 'Staff', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: Users },
}

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CONFIG[role] || { label: role, color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Users }
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
      <Icon size={11} />
      {cfg.label}
    </span>
  )
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-slate-50">
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-100" />
          <div className="space-y-1.5">
            <div className="h-3.5 bg-slate-100 rounded w-28" />
            <div className="h-3 bg-slate-100 rounded w-40" />
          </div>
        </div>
      </td>
      <td className="py-4 px-4"><div className="h-6 bg-slate-100 rounded-full w-28" /></td>
      <td className="py-4 px-4"><div className="h-5 bg-slate-100 rounded-full w-14" /></td>
      <td className="py-4 px-4"><div className="h-3.5 bg-slate-100 rounded w-24" /></td>
      <td className="py-4 px-4 text-right"><div className="h-7 bg-slate-100 rounded w-16 ml-auto" /></td>
    </tr>
  )
}

interface UserFormProps {
  initialData: Admin | null
  isSelf: boolean
  onSuccess: (user: Admin) => void
  onClose: () => void
}

function UserForm({ initialData, isSelf, onSuccess, onClose }: UserFormProps) {
  const isEdit = !!initialData
  const [form, setForm] = useState<FormData>({
    name: initialData?.name || '',
    email: initialData?.email || '',
    password: '',
    role: initialData?.role || 'guru',
    is_active: initialData?.is_active ?? true,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Nama wajib diisi.'); return }
    if (!form.email.trim()) { setError('Email wajib diisi.'); return }
    if (!isEdit && !form.password) { setError('Password wajib diisi saat membuat user baru.'); return }
    if (!isEdit && form.password.length < 8) { setError('Password minimal 8 karakter.'); return }

    setSaving(true)
    setError('')

    try {
      const url = isEdit ? `/api/users/${initialData!.id}` : '/api/users'
      const method = isEdit ? 'PATCH' : 'POST'
      const body: any = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        is_active: form.is_active,
      }
      if (form.password) body.password = form.password

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan')

      onSuccess(data.data)
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-90" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMzAiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40" />
          <div className="relative p-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">
                {isEdit ? 'Edit Akun User' : ' Tambah User Baru'}
              </h2>
              <p className="text-sm text-blue-100 mt-0.5">
                {isEdit ? `Mengubah data akun ${initialData?.name}` : 'Buat akun admin baru untuk portal MI'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
              <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-500" />
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Masukkan nama lengkap"
              autoFocus
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition text-sm"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="nama@email.com"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition text-sm"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
              Password{' '}
              {isEdit
                ? <span className="text-slate-400 font-normal text-xs">(kosongkan jika tidak ingin mengubah)</span>
                : <span className="text-red-500">*</span>
              }
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder={isEdit ? '••••••••' : 'Minimal 8 karakter'}
                className="w-full px-4 py-2.5 pr-11 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-1"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
              Role / Hak Akses <span className="text-red-500">*</span>
            </label>
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              disabled={isSelf}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="guru">Guru — Absensi, Classroom, Data Siswa (read)</option>
              <option value="staff">Staff — Sama seperti Guru + Kelola Berita &amp; Artikel</option>
              <option value="kepsek">Kepala Sekolah — Full akses (kecuali eksekusi transaksi)</option>
              <option value="superadmin">Super Admin — Full akses + Manage User</option>
            </select>
            {isSelf && (
              <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                <AlertTriangle size={12} /> Tidak bisa mengubah role akun sendiri
              </p>
            )}
          </div>

          {/* Status Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <p className="text-sm font-semibold text-slate-700">Status Akun</p>
              <p className="text-xs text-slate-500 mt-0.5">User nonaktif tidak bisa login ke portal</p>
            </div>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
              className={`relative w-12 h-6 rounded-full transition-all duration-300 ${form.is_active ? 'bg-green-500 shadow-green-200 shadow-lg' : 'bg-slate-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${form.is_active ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Role preview info */}
          <div className={`p-3 rounded-xl text-xs border ${form.role === 'superadmin' ? 'bg-violet-50 border-violet-200 text-violet-800' :
              form.role === 'kepsek' ? 'bg-teal-50 border-teal-200 text-teal-800' :
                'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
            {form.role === 'superadmin' && 'Super Admin: Akses penuh ke semua fitur, termasuk manajemen user dan semua transaksi keuangan.'}
            {form.role === 'kepsek' && 'Kepala Sekolah: Akses penuh seperti Super Admin, kecuali tidak bisa eksekusi transaksi tabungan & SPP.'}
            {form.role === 'guru' && 'Guru: Hanya bisa absensi guru, kelola classroom, dan melihat data siswa. Tidak bisa create/delete siswa.'}
            {form.role === 'staff' && 'Staff: Sama seperti Guru, ditambah bisa membuat dan mengelola konten Berita & Artikel di website sekolah.'}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-blue-200"
            >
              {saving
                ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</>
                : isEdit
                  ? <><Edit3 size={16} /> Simpan Perubahan</>
                  : <><UserPlus size={16} /> Buat Akun</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ImportGuruModal({ onSuccess, onClose }: { onSuccess: (count: number) => void, onClose: () => void }) {
  const [gurus, setGurus] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchGurus = async () => {
      try {
        const res = await fetch('/api/guru')
        const data = await res.json()
        if (data.success) {
          setGurus(data.data)
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchGurus()
  }, [])

  const filteredGurus = useMemo(() => {
    if (!search.trim()) return gurus
    const q = search.toLowerCase()
    return gurus.filter(g => g.name.toLowerCase().includes(q) || (g.email && g.email.toLowerCase().includes(q)))
  }, [gurus, search])

  const toggleAll = () => {
    if (selectedIds.length === filteredGurus.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredGurus.map(g => g.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const handleImport = async () => {
    if (selectedIds.length === 0) {
      setError('Pilih minimal satu guru untuk di-import.')
      return
    }

    setImporting(true)
    setError('')
    try {
      const res = await fetch('/api/users/import-guru', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guruIds: selectedIds })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal import guru')
      
      let msg = data.message
      if (data.data?.skipped?.length > 0) {
        msg += `\nBeberapa guru dilewati karena email sudah terdaftar.`
      }
      alert(msg)
      onSuccess(data.data?.inserted || 0)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 flex flex-col max-h-[90vh]">
        <div className="relative overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 opacity-90" />
          <div className="relative p-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Import User dari Data Guru</h2>
              <p className="text-sm text-emerald-100 mt-0.5">Pilih guru yang ingin dibuatkan akun admin (Role: Guru)</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition text-white">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-5 border-b border-slate-100 shrink-0">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2 mb-4">
              <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-500" />
              {error}
            </div>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cari nama guru..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 size={32} className="animate-spin mb-4" />
              <p>Memuat data guru...</p>
            </div>
          ) : filteredGurus.length === 0 ? (
            <div className="text-center py-12 text-slate-500">Tidak ada data guru ditemukan.</div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 mb-4">
                <input 
                  type="checkbox" 
                  checked={selectedIds.length === filteredGurus.length && filteredGurus.length > 0} 
                  onChange={toggleAll}
                  className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600"
                />
                <span className="text-sm font-semibold text-slate-700">Pilih Semua ({filteredGurus.length})</span>
              </div>
              
              {filteredGurus.map(guru => (
                <label key={guru.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(guru.id)} 
                    onChange={() => toggleSelect(guru.id)}
                    className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600"
                  />
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{guru.name}</p>
                    <p className="text-xs text-slate-500">{guru.email || 'Email tidak tersedia'}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-100 shrink-0 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition">
            Batal
          </button>
          <button 
            type="button"
            onClick={handleImport}
            disabled={importing || selectedIds.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 active:scale-95 rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-teal-200"
          >
            {importing ? <><Loader2 size={16} className="animate-spin" /> Meng-import...</> : <><Download size={16} /> Import {selectedIds.length} Guru</>}
          </button>
        </div>
      </div>
    </div>
  )
}

interface UsersClientProps {
  currentUserId: string
  currentUserRole: string
  isSuperAdmin: boolean
}

export function UsersClient({ currentUserId, currentUserRole, isSuperAdmin }: UsersClientProps) {
  const [users, setUsers] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const [showForm, setShowForm] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [editingUser, setEditingUser] = useState<Admin | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      if (data.success) setUsers(data.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const filtered = useMemo(() => {
    let list = users
    if (roleFilter !== 'all') list = list.filter(u => u.role === roleFilter)
    if (statusFilter !== 'all') list = list.filter(u => u.is_active === (statusFilter === 'active'))
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    }
    return list
  }, [users, roleFilter, statusFilter, search])

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.is_active).length,
    superadmin: users.filter(u => u.role === 'superadmin').length,
    kepsek: users.filter(u => u.role === 'kepsek').length,
    guru: users.filter(u => u.role === 'guru').length,
    staff: users.filter(u => u.role === 'staff').length,
  }), [users])

  const handleFormSuccess = (savedUser: Admin) => {
    setUsers(prev => {
      const idx = prev.findIndex(u => u.id === savedUser.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = savedUser
        return next
      }
      return [savedUser, ...prev]
    })
  }

  const handleDelete = async (user: Admin) => {
    if (!confirm(`Yakin ingin menghapus akun "${user.name}"?\n\nAksi ini tidak bisa dibatalkan.`)) return
    setDeletingId(user.id)
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setUsers(prev => prev.filter(u => u.id !== user.id))
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus user')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateStr: string) =>
    new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(dateStr))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen User</h1>
          <p className="text-slate-500 mt-0.5">
            Kelola akun admin dan hak akses sistem.
            {!isSuperAdmin && <span className="ml-1 text-amber-600 font-medium">(Mode Read-Only)</span>}
          </p>
        </div>
        {isSuperAdmin && (
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 active:scale-95 transition-all shadow-sm font-semibold text-sm"
            >
              <Download size={18} />
              Import Guru
            </button>
            <button
              onClick={() => { setEditingUser(null); setShowForm(true) }}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-sm shadow-blue-200 font-semibold text-sm"
            >
              <UserPlus size={18} />
              Tambah User
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total User', value: stats.total, bg: 'bg-slate-800 text-white', icon: Users },
          { label: 'Aktif', value: stats.active, bg: 'bg-green-50 border border-green-100 text-green-800', icon: CheckCircle },
          { label: 'Super Admin', value: stats.superadmin, bg: 'bg-violet-50 border border-violet-100 text-violet-800', icon: Shield },
          { label: 'Kepala Sekolah', value: stats.kepsek, bg: 'bg-teal-50 border border-teal-100 text-teal-800', icon: ShieldCheck },
          { label: 'Guru', value: stats.guru, bg: 'bg-blue-50 border border-blue-100 text-blue-800', icon: GraduationCap },
          { label: 'Staff', value: stats.staff, bg: 'bg-orange-50 border border-orange-100 text-orange-800', icon: Users },
        ].map(({ label, value, bg, icon: Icon }) => (
          <div key={label} className={`${bg} rounded-2xl p-4`}>
            <div className="flex items-center justify-between mb-2 opacity-75">
              <p className="text-xs font-medium">{label}</p>
              <Icon size={15} />
            </div>
            <p className="text-2xl font-bold">{loading ? '—' : value}</p>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        {/* Filter Bar */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition text-sm"
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition text-sm text-slate-700"
          >
            <option value="all">Semua Role</option>
            <option value="superadmin">Super Admin</option>
            <option value="kepsek">Kepala Sekolah</option>
            <option value="guru">Guru</option>
            <option value="staff">Staff</option>
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition text-sm text-slate-700"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
          <button
            onClick={fetchUsers}
            title="Refresh"
            className="flex items-center gap-2 px-3 py-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-xl transition"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="pb-3 px-4 pt-4">User</th>
                <th className="pb-3 px-4 pt-4">Role</th>
                <th className="pb-3 px-4 pt-4">Status</th>
                <th className="pb-3 px-4 pt-4">Bergabung</th>
                {isSuperAdmin && <th className="pb-3 px-4 pt-4 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 5 : 4} className="py-16 text-center">
                    <Users size={40} className="mx-auto mb-3 text-slate-200" />
                    <p className="font-semibold text-slate-500">Tidak ada user ditemukan</p>
                    <p className="text-sm text-slate-400 mt-1">Coba ubah filter atau tambah user baru</p>
                    {isSuperAdmin && (
                      <button
                        onClick={() => { setEditingUser(null); setShowForm(true) }}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition"
                      >
                        <UserPlus size={16} /> Tambah User Pertama
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map(user => {
                  const isSelf = currentUserId === user.id
                  const isDeleting = deletingId === user.id
                  return (
                    <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition group">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${user.role === 'superadmin' ? 'bg-violet-100 text-violet-700' :
                              user.role === 'kepsek' ? 'bg-teal-100 text-teal-700' :
                                user.role === 'staff' ? 'bg-orange-100 text-orange-700' :
                                  'bg-blue-100 text-blue-700'
                            }`}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                              {user.name}
                              {isSelf && (
                                <span className="text-[10px] bg-blue-50 text-blue-500 border border-blue-100 px-1.5 py-0.5 rounded-md font-medium">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${user.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                          }`}>
                          {user.is_active ? <CheckCircle size={11} /> : <XCircle size={11} />}
                          {user.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-sm text-slate-500">
                        {formatDate(user.created_at)}
                      </td>
                      {isSuperAdmin && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition">
                            <button
                              onClick={() => { setEditingUser(user); setShowForm(true) }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Edit user"
                            >
                              <Edit3 size={16} />
                            </button>
                            {!isSelf && (
                              <button
                                onClick={() => handleDelete(user)}
                                disabled={isDeleting}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                                title="Hapus user"
                              >
                                {isDeleting
                                  ? <Loader2 size={16} className="animate-spin" />
                                  : <Trash2 size={16} />
                                }
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Layout */}
        <div className="block sm:hidden space-y-4 p-4 pt-0">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm animate-pulse mt-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-full shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-100 rounded w-32" />
                    <div className="h-3 bg-slate-100 rounded w-24" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-100 rounded w-full" />
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-slate-500 mt-4 bg-slate-50 rounded-xl border border-slate-100">
              <Users size={40} className="mx-auto mb-3 text-slate-200" />
              <p className="font-semibold text-slate-500">Tidak ada user ditemukan</p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {filtered.map(user => {
                const isSelf = currentUserId === user.id
                const isDeleting = deletingId === user.id
                return (
                  <div key={user.id} className="bg-white border border-slate-100 p-4 rounded-xl shadow-sm flex flex-col gap-3 relative">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${user.role === 'superadmin' ? 'bg-violet-100 text-violet-700' :
                            user.role === 'kepsek' ? 'bg-teal-100 text-teal-700' :
                              user.role === 'staff' ? 'bg-orange-100 text-orange-700' :
                                'bg-blue-100 text-blue-700'
                          }`}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 text-base flex items-center gap-1.5">
                            {user.name}
                            {isSelf && (
                              <span className="text-[10px] bg-blue-50 text-blue-500 border border-blue-100 px-1.5 py-0.5 rounded-md font-medium">
                                Anda
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400">{user.email}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                      <RoleBadge role={user.role} />
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${user.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                        }`}>
                        {user.is_active ? <CheckCircle size={10} /> : <XCircle size={10} />}
                        {user.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>

                    {isSuperAdmin && (
                      <div className="flex items-center justify-end gap-2 pt-3 mt-1 border-t border-slate-50">
                        <button
                          onClick={() => { setEditingUser(user); setShowForm(true) }}
                          className="flex-1 flex justify-center items-center gap-1.5 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                        >
                          <Edit3 size={14} /> Edit
                        </button>
                        {!isSelf && (
                          <button
                            onClick={() => handleDelete(user)}
                            disabled={isDeleting}
                            className="flex items-center justify-center p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition disabled:opacity-50"
                          >
                            {isDeleting
                              ? <Loader2 size={16} className="animate-spin" />
                              : <Trash2 size={16} />
                            }
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-50 text-xs text-slate-400 flex items-center justify-between">
            <span>Menampilkan <strong className="text-slate-600">{filtered.length}</strong> dari <strong className="text-slate-600">{users.length}</strong> user</span>
            {isSuperAdmin && (
              <button
                onClick={() => { setEditingUser(null); setShowForm(true) }}
                className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium transition"
              >
                <UserPlus size={13} /> Tambah User
              </button>
            )}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <UserForm
          initialData={editingUser}
          isSelf={editingUser?.id === currentUserId}
          onSuccess={handleFormSuccess}
          onClose={() => { setShowForm(false); setEditingUser(null) }}
        />
      )}

      {showImportModal && (
        <ImportGuruModal
          onSuccess={(count) => {
            setShowImportModal(false)
            if (count > 0) fetchUsers()
          }}
          onClose={() => setShowImportModal(false)}
        />
      )}
    </div>
  )
}
