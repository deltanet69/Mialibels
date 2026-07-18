'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, Wallet, Receipt, CreditCard, Banknote, CheckCircle, Clock, FileText, Eye } from 'lucide-react'
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

  // Detail Modal
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
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
        <button
          onClick={() => setIsCreateOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-500/20 transition flex items-center gap-2"
        >
          <Plus size={20} /> Buat Tagihan
        </button>
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

        {/* Breakdown per Kelas */}
        <div
          onClick={() => setIsBreakdownOpen(true)}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center cursor-pointer hover:border-blue-300 hover:shadow-md transition group"
        >
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform mb-3">
            <FileText size={24} />
          </div>
          <p className="font-semibold text-slate-800">Breakdown Tagihan per Kelas</p>
          <p className="text-xs text-slate-500 mt-1">Lihat detail piutang per kelas</p>
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

        <div className="overflow-x-auto">
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
                        <div className="font-semibold text-slate-800">{inv.student_name}</div>
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
                        <button
                          onClick={() => setSelectedInvoiceId(inv.id)}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition inline-flex items-center gap-1.5"
                        >
                          <Eye size={14} /> Detail
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Breakdown Piutang per Kelas</h2>
              <button onClick={() => setIsBreakdownOpen(false)} className="text-slate-400 hover:text-slate-600 transition">✕</button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {classes.map(cls => {
                const classInvoices = invoices.filter(i => i.student_class_id === cls.id)
                const unpaid = classInvoices.reduce((a, c) => {
                  const s = (Number(c.total_amount) || 0) - (Number(c.paid_amount) || 0)
                  return a + (s > 0 ? s : 0)
                }, 0)
                if (unpaid === 0) return null
                return (
                  <div key={cls.id} className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0">
                    <span className="font-medium text-slate-700">{cls.name}</span>
                    <span className="font-bold text-red-500">Rp {unpaid.toLocaleString('id-ID')}</span>
                  </div>
                )
              })}
              {classes.every(cls => {
                const classInvoices = invoices.filter(i => i.student_class_id === cls.id)
                return classInvoices.reduce((a, c) => a + Math.max(0, Number(c.total_amount) - Number(c.paid_amount)), 0) === 0
              }) && (
                <p className="text-center text-slate-500 py-4">Tidak ada piutang.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
