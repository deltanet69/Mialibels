'use client'

import React, { useEffect, useState, useCallback } from 'react'
import {
  Activity, Search, Filter, ChevronLeft, ChevronRight,
  Plus, Edit3, Trash2, RefreshCw, Clock, User, Layers, FileText
} from 'lucide-react'

type Log = {
  id: string
  admin_id: string | null
  admin_name: string
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  resource: string
  description: string | null
  created_at: string
}

const ACTION_CONFIG = {
  CREATE: { label: 'Buat', color: 'bg-green-100 text-green-800 border-green-200', icon: Plus },
  UPDATE: { label: 'Ubah', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Edit3 },
  DELETE: { label: 'Hapus', color: 'bg-red-100 text-red-800 border-red-200', icon: Trash2 },
}

const RESOURCE_LABELS: Record<string, string> = {
  user: 'User',
  siswa: 'Siswa',
  guru: 'Guru/Staff',
  classroom: 'Kelas',
  spp: 'SPP',
  tabungan: 'Tabungan',
  post: 'Konten',
}

function ActionBadge({ action }: { action: string }) {
  const cfg = ACTION_CONFIG[action as keyof typeof ACTION_CONFIG]
  if (!cfg) return <span className="text-xs text-slate-500">{action}</span>
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
      <td className="py-4 px-4"><div className="h-6 bg-slate-100 rounded-full w-16" /></td>
      <td className="py-4 px-4"><div className="h-3.5 bg-slate-100 rounded w-24" /></td>
      <td className="py-4 px-4"><div className="h-3.5 bg-slate-100 rounded w-32" /></td>
      <td className="py-4 px-4"><div className="h-3.5 bg-slate-100 rounded w-56" /></td>
      <td className="py-4 px-4"><div className="h-3 bg-slate-100 rounded w-28" /></td>
    </tr>
  )
}

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const limit = 20

  const [search, setSearch] = useState('')
  const [resourceFilter, setResourceFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const totalPages = Math.ceil(total / limit)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (resourceFilter) params.set('resource', resourceFilter)
      if (fromDate) params.set('from', fromDate)
      if (toDate) params.set('to', toDate)

      const res = await fetch(`/api/logs?${params}`)
      const data = await res.json()
      if (data.success) {
        setLogs(data.data || [])
        setTotal(data.count || 0)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [page, resourceFilter, fromDate, toDate])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  // Client-side search on fetched data
  const filtered = search.trim()
    ? logs.filter(l =>
        l.admin_name.toLowerCase().includes(search.toLowerCase()) ||
        l.description?.toLowerCase().includes(search.toLowerCase()) ||
        l.resource.toLowerCase().includes(search.toLowerCase())
      )
    : logs

  const formatDateTime = (dateStr: string) =>
    new Intl.DateTimeFormat('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(new Date(dateStr))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Activity size={24} className="text-blue-600" />
            Activity Log
          </h1>
          <p className="text-slate-500 mt-0.5">Riwayat semua perubahan dan aktivitas yang terjadi di sistem.</p>
        </div>
        <button onClick={() => { setPage(1); fetchLogs() }} className="flex items-center gap-2 px-3 py-2.5 text-slate-600 hover:text-blue-600 bg-white hover:bg-blue-50 border border-slate-200 rounded-xl transition text-sm font-medium">
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Log', value: total, icon: FileText, color: 'text-slate-700' },
          { label: 'Halaman', value: `${page} / ${totalPages || 1}`, icon: Layers, color: 'text-blue-600' },
          { label: 'Per Halaman', value: limit, icon: Filter, color: 'text-violet-600' },
          { label: 'Ditampilkan', value: filtered.length, icon: Activity, color: 'text-green-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
            <div className={`flex items-center gap-2 mb-1 ${color}`}>
              <Icon size={15} />
              <span className="text-xs font-medium text-slate-500">{label}</span>
            </div>
            <p className="text-xl font-bold text-slate-800">{loading ? '—' : value}</p>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        {/* Filters */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cari user, keterangan..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition text-sm"
            />
          </div>
          <select
            value={resourceFilter}
            onChange={e => { setResourceFilter(e.target.value); setPage(1) }}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition text-sm text-slate-700"
          >
            <option value="">Semua Item</option>
            {Object.entries(RESOURCE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={e => { setFromDate(e.target.value); setPage(1) }}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition text-sm text-slate-700"
            />
            <span className="text-slate-400 text-sm">–</span>
            <input
              type="date"
              value={toDate}
              onChange={e => { setToDate(e.target.value); setPage(1) }}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition text-sm text-slate-700"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="pb-3 px-4 pt-4">Aksi</th>
                <th className="pb-3 px-4 pt-4">Item</th>
                <th className="pb-3 px-4 pt-4 flex items-center gap-1"><User size={12} /> User</th>
                <th className="pb-3 px-4 pt-4">Keterangan</th>
                <th className="pb-3 px-4 pt-4 flex items-center gap-1"><Clock size={12} /> Waktu</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <Activity size={36} className="mx-auto mb-3 text-slate-200" />
                    <p className="font-medium text-slate-500">Belum ada aktivitas</p>
                    <p className="text-sm text-slate-400">Log akan muncul saat ada perubahan di sistem</p>
                  </td>
                </tr>
              ) : filtered.map(log => (
                <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                  <td className="py-3.5 px-4">
                    <ActionBadge action={log.action} />
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                      {RESOURCE_LABELS[log.resource] || log.resource}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                        {log.admin_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-slate-700">{log.admin_name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 max-w-xs">
                    <p className="text-sm text-slate-600 truncate" title={log.description || ''}>
                      {log.description || <span className="text-slate-400 italic">—</span>}
                    </p>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-400 whitespace-nowrap">
                    {formatDateTime(log.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-4 py-4 border-t border-slate-50 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Halaman {page} dari {totalPages} ({total} total log)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let p = i + 1
                  if (totalPages > 5) {
                    if (page <= 3) p = i + 1
                    else if (page >= totalPages - 2) p = totalPages - 4 + i
                    else p = page - 2 + i
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 text-sm rounded-lg transition ${page === p ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      {p}
                    </button>
                  )
                })}
              </div>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
