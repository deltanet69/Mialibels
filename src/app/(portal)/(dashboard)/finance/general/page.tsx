'use client'

import React, { useState, useEffect } from 'react'
import { Download, ExternalLink, MoreVertical, Plus, Search, Eye, Filter, Banknote, CreditCard, Clock, CheckCircle, FileText, AlertTriangle, Printer, Trash2, Edit3, X, Wallet, Receipt, Send } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { CreateBillModal } from '@/components/portal/finance/general/CreateBillModal'
import { GeneralInvoiceDetailModal } from '@/components/portal/finance/general/GeneralInvoiceDetailModal'

type Invoice = {
  id: string
  title: string
  type: string
  due_date: string
  total_amount: number
  paid_amount: number
  status: string
  payment_method: string
  student_id: string
  student_name: string
  student_number: string
  student_class: string
  student_class_id: string
  items: any[]
}

export default function GeneralFinancePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterClass, setFilterClass] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Reset page on filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filterStatus, filterClass, searchTerm, pageSize])

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false)
  const [showIncomeSplit, setShowIncomeSplit] = useState(false)
  const [breakdownFilter, setBreakdownFilter] = useState<'ALL' | 'FULLDAY' | 'REGULER'>('ALL')

  // Detail Modal
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)

  // WA Notify State
  const [isSendingWA, setIsSendingWA] = useState(false)
  const [sendingProgress, setSendingProgress] = useState({ current: 0, total: 0 })

  const handleSendWA = async (invoiceId: string) => {
    try {
      setIsSendingWA(true)
      const res = await fetch('/api/finance/general/wa-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id: invoiceId })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal mengirim WA')
      alert('Berhasil mengirim notifikasi WA!')
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsSendingWA(false)
    }
  }

  const handleBulkSendWA = async () => {
    const unpaidInvoices = filteredInvoices.filter(i => i.status !== 'PAID')
    if (unpaidInvoices.length === 0) {
      alert('Tidak ada tagihan yang belum lunas pada filter saat ini.')
      return
    }

    if (!confirm(`Anda akan mengirim notifikasi ke ${unpaidInvoices.length} orang tua. Lanjutkan?`)) return

    setIsSendingWA(true)
    setSendingProgress({ current: 0, total: unpaidInvoices.length })

    let successCount = 0
    for (let i = 0; i < unpaidInvoices.length; i++) {
      try {
        setSendingProgress(p => ({ ...p, current: i + 1 }))
        const res = await fetch('/api/finance/general/wa-notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invoice_id: unpaidInvoices[i].id })
        })
        if (res.ok) {
            successCount++
        }
        // Delay 3 seconds between messages
        if (i < unpaidInvoices.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000))
        }
      } catch (err) {
        console.error('Error sending WA to', unpaidInvoices[i].student_name, err)
      }
    }
    
    setIsSendingWA(false)
    alert(`Berhasil mengirim ${successCount} dari ${unpaidInvoices.length} notifikasi.`)
  }

  useEffect(() => {
    fetchData()

    // Realtime Listener for auto-refresh
    const channel = supabase
      .channel('general_invoices_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'general_invoices' },
        (payload) => {
          // You could optionally check if the updated row matches current filters,
          // but calling fetchData() ensures data integrity.
          fetchData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [filterStatus, filterClass])

  const fetchData = async () => {
    setLoading(true)
    try {
      let url = '/api/finance/general?'
      if (filterStatus !== 'ALL') url += `status=${filterStatus}&`
      if (filterClass !== 'ALL') url += `classId=${filterClass}`

      const res = await fetch(url)
      const data = await res.json()
      if (data.success) setInvoices(data.data)

      if (classes.length === 0) {
        const classRes = await fetch('/api/classrooms')
        const classData = await classRes.json()
        if (classData.success) setClasses(classData.data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Summary calculations
  const totalIncome = invoices.reduce((acc, curr) => acc + (Number(curr.paid_amount) || 0), 0)
  const totalUnpaid = invoices.reduce((acc, curr) => {
    const sisa = (Number(curr.total_amount) || 0) - (Number(curr.paid_amount) || 0)
    return acc + (sisa > 0 ? sisa : 0)
  }, 0)
  const transferIncome = invoices
    .filter(i => i.payment_method === 'TRANSFER')
    .reduce((acc, curr) => acc + (Number(curr.paid_amount) || 0), 0)
  const cashIncome = totalIncome - transferIncome

  // Client-side search filter & sort
  const filteredInvoices = invoices
    .filter(i =>
      i.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.student_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.title?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => (a.student_name || '').localeCompare(b.student_name || ''))

  const totalPages = Math.ceil(filteredInvoices.length / pageSize)
  const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Keuangan Umum</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola tagihan administrasi sekolah, buku, seragam, dll.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* <button
            onClick={handleBulkSendWA}
            disabled={isSendingWA}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-emerald-500/20 transition flex items-center gap-2 text-sm sm:text-base"
          >
            <Send size={20} /> {isSendingWA ? `Mengirim... (${sendingProgress.current}/${sendingProgress.total})` : 'Kirim Notifikasi'}
          </button> */}
          <button
            onClick={() => setIsCreateOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-500/20 transition flex items-center gap-2 text-sm sm:text-base"
          >
            <Plus size={20} /> Buat Tagihan
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Flip Card — Total Pemasukan */}
        <div className="relative h-32 rounded-2xl overflow-hidden [perspective:1000px]">
          <div
            className={`w-full h-full transition-all duration-500 [transform-style:preserve-3d] cursor-pointer ${showIncomeSplit ? '[transform:rotateY(180deg)]' : ''}`}
            onClick={() => setShowIncomeSplit(!showIncomeSplit)}
          >
            <div className="absolute inset-0 [backface-visibility:hidden] bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-2xl text-white flex flex-col justify-center">
              <div className="flex items-center justify-between mb-2">
                <p className="text-green-50 font-medium">Total Pemasukan</p>
                <Wallet className="text-green-200" size={24} />
              </div>
              <h3 className="text-3xl font-bold">Rp {totalIncome.toLocaleString('id-ID')}</h3>
              <p className="text-xs text-green-100 mt-2 flex items-center gap-1 opacity-80">
                <span className="inline-block animate-pulse w-2 h-2 rounded-full bg-white" /> Klik untuk detail
              </p>
            </div>
            <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-white border border-green-200 p-4 rounded-2xl flex flex-col justify-center gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><CreditCard size={16} className="text-blue-500" /><span className="text-sm text-slate-600">Transfer</span></div>
                <span className="font-bold text-slate-800">Rp {transferIncome.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Banknote size={16} className="text-green-500" /><span className="text-sm text-slate-600">Tunai (TU)</span></div>
                <span className="font-bold text-slate-800">Rp {cashIncome.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Belum Terbayarkan */}
        <div className="bg-gradient-to-br from-orange-500 to-red-500 p-6 rounded-2xl text-white flex flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <p className="text-orange-100 font-medium">Belum Terbayarkan</p>
            <Receipt className="text-orange-200" size={24} />
          </div>
          <h3 className="text-3xl font-bold">Rp {totalUnpaid.toLocaleString('id-ID')}</h3>
        </div>

        {/* Breakdown Tagihan */}
        <div
          onClick={() => setIsBreakdownOpen(true)}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center cursor-pointer hover:border-blue-300 hover:shadow-md transition group"
        >
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform mb-3">
            <FileText size={24} />
          </div>
          <p className="font-semibold text-slate-800">Breakdown Uang Masuk</p>
          <p className="text-xs text-slate-500 mt-1">Lihat detail pemasukan per item</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cari NISN, Nama Siswa, atau Tagihan..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={filterClass}
                onChange={e => setFilterClass(e.target.value)}
                className="pl-4 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-blue-500 outline-none appearance-none font-medium text-slate-700 text-sm"
              >
                <option value="ALL">Semua Kelas</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="pl-4 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white focus:border-blue-500 outline-none appearance-none font-medium text-slate-700 text-sm"
            >
              <option value="ALL">Semua Status</option>
              <option value="UNPAID">Belum Bayar</option>
              <option value="PARTIAL">Cicilan</option>
              <option value="PENDING_VERIFICATION">Menunggu Verifikasi</option>
              <option value="PAID">Lunas</option>
            </select>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-medium">
              <tr>
                <th className="px-5 py-4 w-12 text-center">No</th>
                <th className="px-5 py-4">Siswa</th>
                <th className="px-5 py-4">Kelas</th>
                <th className="px-5 py-4">Tagihan</th>
                <th className="px-5 py-4">Total</th>
                <th className="px-5 py-4">Sisa</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-5 py-4"><div className="h-4 bg-slate-100 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-slate-500">Belum ada data tagihan.</td>
                </tr>
              ) : (
                paginatedInvoices.map((inv, index) => {
                  const sisa = Number(inv.total_amount) - Number(inv.paid_amount)

                  let statusBadge = <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-semibold text-xs">Belum Bayar</span>
                  if (inv.status === 'PAID') statusBadge = <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold text-xs flex items-center gap-1 w-max"><CheckCircle size={11} /> Lunas</span>
                  if (inv.status === 'PARTIAL') statusBadge = <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-semibold text-xs flex items-center gap-1 w-max"><Clock size={11} /> Cicilan</span>
                  if (inv.status === 'PENDING_VERIFICATION') statusBadge = <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs">Menunggu Verifikasi</span>

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50 transition">
                      <td className="px-5 py-4 text-center text-slate-400 font-medium">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>
                      <td className="px-5 py-4">
                        <div 
                          className="font-semibold text-blue-600 hover:underline cursor-pointer"
                          onClick={() => setSelectedInvoiceId(inv.id)}
                        >
                          {inv.student_name}
                        </div>
                        <div className="text-xs text-slate-400">NISN: {inv.student_number}</div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{inv.student_class}</td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-800 max-w-[160px] truncate" title={inv.title}>{inv.title}</div>
                        <div className="text-xs text-slate-400">{inv.type}</div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        Rp {Number(inv.total_amount).toLocaleString('id-ID')}
                      </td>
                      <td className="px-5 py-4 font-semibold text-red-500">
                        {sisa > 0 ? `Rp ${sisa.toLocaleString('id-ID')}` : <span className="text-emerald-500">-</span>}
                      </td>
                      <td className="px-5 py-4">{statusBadge}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {inv.status !== 'PAID' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleSendWA(inv.id); }}
                              disabled={isSendingWA}
                              className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:opacity-50 rounded-lg text-sm font-medium transition inline-flex items-center gap-1.5"
                              title="Kirim Notifikasi WA"
                            >
                              <Send size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedInvoiceId(inv.id)}
                            className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition inline-flex items-center gap-1.5"
                          >
                            <Eye size={14} /> Detail
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-100">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 space-y-3 animate-pulse">
                <div className="h-4 bg-slate-100 rounded w-1/2" />
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-4 bg-slate-100 rounded w-1/4" />
              </div>
            ))
          ) : paginatedInvoices.length === 0 ? (
            <div className="px-6 py-10 text-center text-slate-500 text-sm">Belum ada data tagihan.</div>
          ) : (
            paginatedInvoices.map((inv) => {
              const sisa = Number(inv.total_amount) - Number(inv.paid_amount)
              
              let statusBadge = <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold text-[10px]">Belum Bayar</span>
              if (inv.status === 'PAID') statusBadge = <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 font-semibold text-[10px] flex items-center gap-1 w-max"><CheckCircle size={10} /> Lunas</span>
              if (inv.status === 'PARTIAL') statusBadge = <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 font-semibold text-[10px] flex items-center gap-1 w-max"><Clock size={10} /> Cicilan</span>
              if (inv.status === 'PENDING_VERIFICATION') statusBadge = <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 font-semibold text-[10px]">Menunggu Verifikasi</span>

              return (
                <div key={inv.id} className="p-4 hover:bg-slate-50 transition cursor-pointer" onClick={() => setSelectedInvoiceId(inv.id)}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold text-blue-600 text-sm">{inv.student_name}</div>
                      <div className="text-[11px] text-slate-400">Kls: {inv.student_class} • NISN: {inv.student_number}</div>
                    </div>
                    {statusBadge}
                  </div>
                  <div className="text-sm font-medium text-slate-700 mb-2 truncate" title={inv.title}>{inv.title}</div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Total Tagihan</div>
                      <div className="font-semibold text-slate-800 text-sm">Rp {Number(inv.total_amount).toLocaleString('id-ID')}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      {inv.status !== 'PAID' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSendWA(inv.id); }}
                          disabled={isSendingWA}
                          className="px-2 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:opacity-50 rounded-md transition"
                        >
                          <Send size={14} />
                        </button>
                      )}
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 uppercase">Sisa Tagihan</div>
                        <div className="font-semibold text-red-500 text-sm">
                          {sisa > 0 ? `Rp ${sisa.toLocaleString('id-ID')}` : <span className="text-emerald-500">Lunas</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Pagination UI */}
        {!loading && filteredInvoices.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>Tampilkan</span>
              <select
                value={pageSize}
                onChange={e => setPageSize(Number(e.target.value))}
                className="border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-500 bg-white"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>dari {filteredInvoices.length} data</span>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-4 py-2 text-sm border border-slate-200 bg-white rounded-xl hover:bg-slate-50 disabled:opacity-50 transition font-medium text-slate-600"
              >
                Sebelumnya
              </button>
              <span className="text-sm font-semibold text-slate-700">
                {currentPage} <span className="text-slate-400 font-normal">/ {totalPages || 1}</span>
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-4 py-2 text-sm border border-slate-200 bg-white rounded-xl hover:bg-slate-50 disabled:opacity-50 transition font-medium text-slate-600"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateBillModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchData}
      />

      <GeneralInvoiceDetailModal
        invoiceId={selectedInvoiceId}
        onClose={() => setSelectedInvoiceId(null)}
        onUpdated={fetchData}
      />

      {/* Breakdown Modal */}
      {isBreakdownOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Breakdown Uang Masuk & Tunggakan</h2>
              <button onClick={() => setIsBreakdownOpen(false)} className="text-slate-400 hover:text-slate-600 transition">✕</button>
            </div>
            
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="breakdownFilter" 
                  checked={breakdownFilter === 'ALL'} 
                  onChange={() => setBreakdownFilter('ALL')} 
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500" 
                />
                <span className="text-sm font-medium text-slate-700">Semua Kelas</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="breakdownFilter" 
                  checked={breakdownFilter === 'FULLDAY'} 
                  onChange={() => setBreakdownFilter('FULLDAY')} 
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500" 
                />
                <span className="text-sm font-medium text-slate-700">Fullday (A)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="breakdownFilter" 
                  checked={breakdownFilter === 'REGULER'} 
                  onChange={() => setBreakdownFilter('REGULER')} 
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500" 
                />
                <span className="text-sm font-medium text-slate-700">Reguler (B-D)</span>
              </label>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {(() => {
                const filteredInvoices = invoices.filter(inv => {
                  if (breakdownFilter === 'ALL') return true;
                  const isFullday = inv.student_class?.endsWith('A');
                  if (breakdownFilter === 'FULLDAY') return isFullday;
                  if (breakdownFilter === 'REGULER') return !isFullday;
                  return true;
                });

                const data: Record<string, { masuk: number; tunggakan: number }> = {};
                filteredInvoices.forEach(inv => {
                  (inv.items || []).forEach(item => {
                    if (!data[item.name]) {
                      data[item.name] = { masuk: 0, tunggakan: 0 };
                    }
                    const itemPaid = Number(item.paid_amount) || 0;
                    const itemAmount = Number(item.amount) || 0;
                    data[item.name].masuk += itemPaid;
                    data[item.name].tunggakan += Math.max(0, itemAmount - itemPaid);
                  });
                });
                
                const bData = Object.entries(data).sort((a, b) => b[1].masuk - a[1].masuk);

                if (bData.length === 0) {
                  return <p className="text-center text-slate-500 py-8">Tidak ada data tercatat.</p>;
                }
                const totalMasuk = bData.reduce((acc, curr) => acc + curr[1].masuk, 0);
                const totalTunggakan = bData.reduce((acc, curr) => acc + curr[1].tunggakan, 0);
                
                return (
                  <div className="space-y-4 max-w-3xl">
                    <div className="flex items-center justify-between text-[14px] font-bold space-x-8 text-slate-500 uppercase tracking-wider px-2">
                      <span className="flex-1">Item</span>
                      <span className="w-32 text-right text-emerald-600">Uang Masuk</span>
                      <span className="w-32 text-right text-red-500">Tunggakan</span>
                    </div>
                    <div className="space-y-2">
                      {bData.map(([itemName, amounts]) => (
                        <div key={itemName} className="flex items-center justify-between p-3 space-x-8 bg-white border border-slate-100 rounded-xl shadow-sm">
                          <span className="flex-1 font-semibold text-slate-700 text-sm truncate">{itemName}</span>
                          <span className="w-32 text-right font-bold text-emerald-600 text-sm">{amounts.masuk > 0 ? amounts.masuk.toLocaleString('id-ID') : '-'}</span>
                          <span className="w-32 text-right font-bold text-red-500 text-sm">{amounts.tunggakan > 0 ? amounts.tunggakan.toLocaleString('id-ID') : '-'}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center py-4 border-t border-slate-200 mt-4 bg-white sticky bottom-0">
                      <span className="font-bold text-slate-800">Total</span>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-[14px] uppercase text-emerald-600 font-bold">Total Masuk</div>
                          <span className="font-bold text-emerald-600 text-base">Rp {totalMasuk.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="w-px h-8 bg-slate-200"></div>
                        <div className="text-right">
                          <div className="text-[14px] uppercase text-red-500 font-bold">Total Tunggakan</div>
                          <span className="font-bold text-red-500 text-base">Rp {totalTunggakan.toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
