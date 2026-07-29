'use client'

import React, { useState, useEffect } from 'react'
import {
  X, Info, CheckCircle2, AlertTriangle, Clock, Banknote,
  CreditCard, Download, ExternalLink, Loader2, Edit3, Save, Printer, FileText
} from 'lucide-react'

type Props = {
  invoiceId: string | null
  onClose: () => void
  onUpdated: () => void
}

const STATUS_COLORS: Record<string, string> = {
  PAID: 'bg-emerald-100 text-emerald-700',
  UNPAID: 'bg-red-100 text-red-700',
  PARTIAL: 'bg-amber-100 text-amber-700',
  PENDING_VERIFICATION: 'bg-blue-100 text-blue-700',
}

const STATUS_LABELS: Record<string, string> = {
  PAID: 'Lunas',
  UNPAID: 'Belum Bayar',
  PARTIAL: 'Mencicil',
  PENDING_VERIFICATION: 'Menunggu Verifikasi',
}

const MONTHS = [
  { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' }, { value: 3, label: 'Maret' },
  { value: 4, label: 'April' }, { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' }, { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' }, { value: 11, label: 'November' }, { value: 12, label: 'Desember' },
]

export function SppInvoiceDetailModal({ invoiceId, onClose, onUpdated }: Props) {
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Edit Mode States  
  const [isEditMode, setIsEditMode] = useState(false)
  const [editItems, setEditItems] = useState<{id: string, amount: number | string}[]>([])
  
  // New invoice rows (inline add, like GeneralInvoiceDetailModal)
  const [newInvoiceRows, setNewInvoiceRows] = useState<{month: number, year: number, amount: string}[]>([])

  // Cash payment form (per invoice)
  const [cashNote, setCashNote] = useState('')
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, number | ''>>({})
  
  // Verify transfer (single nominal, for PENDING_VERIFICATION)
  const [verifyAmounts, setVerifyAmounts] = useState<Record<string, number | ''>>({})

  // Show Print Option after payment
  const [showPrintOption, setShowPrintOption] = useState(false)

  const d = new Date()

  useEffect(() => {
    if (invoiceId) {
      fetchDetail(invoiceId)
      setError(null)
      setSuccessMsg(null)
      setCashNote('')
      setIsEditMode(false)
      setNewInvoiceRows([])
      setShowPrintOption(false)
    }
  }, [invoiceId])

  const fetchDetail = async (id: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/spp/manage/${id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setInvoice(data.data)
      setPaymentAmounts({})
      setVerifyAmounts({})
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // All invoices (current + other unpaid), sorted by due date
  const getAllInvoices = (inv: any) => {
    if (!inv) return []
    return [inv, ...(inv.other_unpaid_invoices || [])].sort(
      (a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    )
  }

  const handleCashPayment = async () => {
    const invoicesToPay = Object.entries(paymentAmounts).filter(
      ([, amount]) => typeof amount === 'number' && amount > 0
    )
    if (invoicesToPay.length === 0) {
      setError('Masukkan setidaknya satu nominal pembayaran yang lebih dari 0.')
      return
    }

    setActionLoading(true)
    setError(null)
    try {
      await Promise.all(
        invoicesToPay.map(async ([id, amount]) => {
          const finalNote = cashNote ? cashNote : undefined;

          const res = await fetch(`/api/spp/manage/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'CASH_PAYMENT', paid_amount: Number(amount), note: finalNote }),
          })
          if (!res.ok) {
            const errData = await res.json()
            throw new Error(`Tagihan ${id} gagal dibayar: ${errData.error}`)
          }
        })
      )

      setSuccessMsg('Pembayaran tunai berhasil dicatat.')
      setCashNote('')
      setPaymentAmounts({})
      setShowPrintOption(true)
      if (invoiceId) fetchDetail(invoiceId)
      onUpdated()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleVerifyTransfer = async () => {
    const invoicesToVerify = Object.entries(verifyAmounts).filter(
      ([, amount]) => typeof amount === 'number' && amount > 0
    )
    if (invoicesToVerify.length === 0) {
      setError('Masukkan setidaknya satu nominal verifikasi yang lebih dari 0.')
      return
    }
    if (!confirm('Apakah nominal verifikasi yang Anda masukkan sudah sesuai dengan dana transfer yang masuk?')) return

    setActionLoading(true)
    setError(null)
    try {
      await Promise.all(
        invoicesToVerify.map(async ([id, amount]) => {
          const res = await fetch(`/api/spp/manage/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'VERIFY_TRANSFER',
              paid_amount: Number(amount),
              note: undefined,
            }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error)
        })
      )

      setSuccessMsg('Transfer berhasil diverifikasi dan dicatat.')
      setVerifyAmounts({})
      if (invoiceId) fetchDetail(invoiceId)
      onUpdated()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRejectTransfer = async () => {
    const reason = prompt('Masukkan alasan penolakan (misal: Bukti transfer buram, Nominal kurang, dll):')
    if (reason === null) return
    if (!reason.trim()) {
      alert('Alasan penolakan wajib diisi agar orang tua tahu kesalahannya.')
      return
    }

    setActionLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/spp/manage/${invoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECT_TRANSFER', rejectReason: reason.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccessMsg('Bukti transfer ditolak.')
      setInvoice(data.data)
      onUpdated()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleEditItemsSave = async () => {
    setActionLoading(true)
    setError(null)
    try {
      const allInvs = getAllInvoices(invoice)

      // 1. Save edits to existing invoices
      await Promise.all(
        editItems.map(async (item) => {
          const amountToSave = Number(item.amount)
          if (isNaN(amountToSave) || amountToSave < 0) return
          const original = allInvs.find((inv: any) => inv.id === item.id)
          if (original && Number(original.amount) === amountToSave) return // skip unchanged

          const res = await fetch(`/api/spp/manage/${item.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'EDIT_AMOUNT', amount: amountToSave }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error)
        })
      )

      // 2. Save new invoice rows
      await Promise.all(
        newInvoiceRows.map(async (row) => {
          if (!row.month || !row.year || !row.amount) return
          const monthName = MONTHS.find((m) => m.value === Number(row.month))?.label || ''
          const title = `Infaq Sekolah - ${monthName} ${row.year}`

          const res = await fetch(`/api/spp/manage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              student_id: invoice.student_id,
              title,
              month: row.month,
              year: row.year,
              amount: Number(row.amount),
            }),
          })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error)
        })
      )

      setSuccessMsg('Tagihan berhasil disimpan.')
      setIsEditMode(false)
      setNewInvoiceRows([])
      if (invoiceId) fetchDetail(invoiceId)
      onUpdated()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const toggleEditMode = () => {
    if (!isEditMode) {
      const allInvs = getAllInvoices(invoice)
      setEditItems(allInvs.map((inv: any) => ({ id: inv.id, amount: inv.amount })))
      setNewInvoiceRows([])
    } else {
      setNewInvoiceRows([])
    }
    setIsEditMode(!isEditMode)
  }



  const openPrintReceipt = () => {
    if (invoiceId) {
      window.open(`/print/spp/${invoiceId}`, '_blank')
    }
  }

  if (!invoiceId) return null

  const formatRp = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

  const allInvoices = getAllInvoices(invoice)
  const totalAmount = allInvoices.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0)
  const totalPaid = allInvoices.reduce((acc: number, curr: any) => acc + Number(curr.paid_amount || 0), 0)
  const totalSisa = totalAmount - totalPaid
  const totalVerifyPreview = Object.values(verifyAmounts).reduce(
    (acc: number, curr) => acc + (typeof curr === 'number' ? curr : 0),
    0 as number
  ) as number

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto">

        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Detail Tagihan Infaq</h3>
            {invoice && <p className="text-md text-slate-500 mt-0.5">{invoice.title}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6 flex-1">

          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 size={32} className="animate-spin text-slate-300" />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-medium">
              <AlertTriangle size={16} className="shrink-0" /> {error}
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-sm font-medium justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0" /> {successMsg}
              </div>
              {showPrintOption && (
                <button
                  onClick={openPrintReceipt}
                  className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1 hover:bg-emerald-700 transition shrink-0"
                >
                  <Printer size={14} /> Cetak Struk
                </button>
              )}
            </div>
          )}

          {invoice && (
            <>
              {/* Banner Peringatan Tagihan Aktif */}
              {invoice.status === 'PAID' && invoice.has_active_invoices && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                    <div>
                      <h4 className="font-bold text-amber-800 text-sm">Siswa memiliki Tagihan Aktif / Tunggakan</h4>
                      <p className="text-xs text-amber-700 mt-0.5">
                        Tagihan ini sudah lunas, namun siswa memiliki tagihan Infaq lain yang belum dibayar.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Top Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Biodata Siswa */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Info size={14} /> Biodata Siswa
                  </h4>
                  <div className="space-y-2.5 text-sm">
                    {[
                      ['Nama', invoice.student_name],
                      ['NISN', invoice.student_nisn || '-'],
                      ['Kelas', invoice.student_class],
                      ['Nama Orang Tua', invoice.parent_name || '-'],
                      ['No. Telepon', invoice.parent_phone || '-'],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between border-b border-slate-200 pb-2 last:border-0 last:pb-0">
                        <span className="text-slate-500">{label}</span>
                        <span className="font-semibold text-slate-800 text-right">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ringkasan Tagihan - aggregate all invoices */}
                <div className="bg-blue-50/60 rounded-xl p-5 border border-blue-100">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Info size={14} /> Ringkasan Tagihan
                  </h4>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between border-b border-blue-100 pb-2">
                      <span className="text-slate-500">Status</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_COLORS[invoice.status] || 'bg-slate-100 text-slate-600'}`}>
                        {STATUS_LABELS[invoice.status] || invoice.status}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-blue-100 pb-2">
                      <span className="text-slate-500">Jenis</span>
                      <span className="font-semibold text-slate-800">Infaq / SPP</span>
                    </div>
                    <div className="flex justify-between border-b border-blue-100 pb-2">
                      <span className="text-slate-500">Jatuh Tempo</span>
                      <span className="font-semibold text-slate-800">
                        {invoice.due_date
                          ? new Date(invoice.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                          : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-blue-100 pb-2">
                      <span className="text-slate-500">Total Tagihan</span>
                      <span className="font-bold text-slate-800">{formatRp(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between border-b border-blue-100 pb-2">
                      <span className="text-slate-500">Sudah Dibayar</span>
                      <span className="font-bold text-emerald-600">{formatRp(totalPaid)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Kekurangan</span>
                      <span className={`font-bold ${totalSisa > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {totalSisa > 0 ? formatRp(totalSisa) : 'Lunas'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rincian Tagihan Infaq */}
              {allInvoices.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-slate-800 text-sm">Rincian Item Tagihan</h4>
                    {invoice.status !== 'PAID' && (
                      <button
                        onClick={toggleEditMode}
                        className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
                      >
                        {isEditMode ? <><X size={14} /> Batal Edit</> : <><Edit3 size={14} /> Edit Rincian Manual</>}
                      </button>
                    )}
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    {isEditMode ? (
                      /* Edit mode: inline rows exactly like GeneralInvoiceDetailModal */
                      <div className="p-4 space-y-4 bg-slate-50 min-w-[600px]">
                        <div className="space-y-3">
                          {/* Existing invoice rows */}
                          {editItems.map((item, idx) => {
                            const inv = allInvoices.find((i: any) => i.id === item.id)
                            return (
                              <div key={item.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-white p-3 rounded-lg border border-slate-200">
                                <div className="flex-1 w-full flex items-center gap-2">
                                  <span className="font-bold text-slate-500 text-xs w-4">{idx + 1}.</span>
                                  <div className="flex-1">
                                    <label className="text-[10px] font-semibold text-slate-500 uppercase">Bulan Tagihan</label>
                                    <p className="text-sm font-semibold text-slate-700">{inv?.title || '-'}</p>
                                  </div>
                                </div>
                                <div className="w-full sm:w-1/3">
                                  <label className="text-[10px] font-semibold text-slate-500 uppercase">Nominal</label>
                                  <input
                                    type="number"
                                    value={item.amount}
                                    onWheel={(e) => (e.target as HTMLElement).blur()}
                                    onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault() }}
                                    onChange={(e) => {
                                      const newItems = [...editItems]
                                      newItems[idx] = { ...newItems[idx], amount: e.target.value }
                                      setEditItems(newItems)
                                    }}
                                    className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md outline-none focus:border-blue-500"
                                  />
                                </div>
                              </div>
                            )
                          })}

                          {/* NEW invoice rows (unsaved) — inline, same style */}
                          {newInvoiceRows.map((row, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-blue-50/60 p-3 rounded-lg border border-blue-200">
                              <div className="flex-1 w-full flex items-center gap-2">
                                <span className="font-bold text-blue-400 text-xs w-4">{editItems.length + idx + 1}.</span>
                                <div className="flex-1 w-full">
                                  <label className="text-[10px] font-semibold text-blue-500 uppercase">Bulan Tagihan (Baru)</label>
                                  <div className="flex gap-2">
                                    <select
                                      value={row.month}
                                      onChange={(e) => {
                                        const updated = [...newInvoiceRows]
                                        updated[idx] = { ...updated[idx], month: Number(e.target.value) }
                                        setNewInvoiceRows(updated)
                                      }}
                                      className="flex-1 px-3 py-1.5 text-sm border border-blue-300 rounded-md outline-none focus:border-blue-500 bg-white"
                                    >
                                      {MONTHS.map((m) => (
                                        <option key={m.value} value={m.value}>{m.label}</option>
                                      ))}
                                    </select>
                                    <select
                                      value={row.year}
                                      onChange={(e) => {
                                        const updated = [...newInvoiceRows]
                                        updated[idx] = { ...updated[idx], year: Number(e.target.value) }
                                        setNewInvoiceRows(updated)
                                      }}
                                      className="w-24 px-3 py-1.5 text-sm border border-blue-300 rounded-md outline-none focus:border-blue-500 bg-white"
                                    >
                                      {[0, 1, 2, 3].map((y) => {
                                        const year = new Date().getFullYear() + y - 1
                                        return <option key={year} value={year}>{year}</option>
                                      })}
                                    </select>
                                  </div>
                                </div>
                              </div>
                              <div className="w-full sm:w-1/3 flex items-end gap-2">
                                <div className="flex-1">
                                  <label className="text-[10px] font-semibold text-blue-500 uppercase">Nominal</label>
                                  <input
                                    type="number"
                                    value={row.amount}
                                    onWheel={(e) => (e.target as HTMLElement).blur()}
                                    onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault() }}
                                    onChange={(e) => {
                                      const updated = [...newInvoiceRows]
                                      updated[idx] = { ...updated[idx], amount: e.target.value }
                                      setNewInvoiceRows(updated)
                                    }}
                                    placeholder="0"
                                    className="w-full px-3 py-1.5 text-sm border border-blue-300 rounded-md outline-none focus:border-blue-500 bg-white"
                                  />
                                </div>
                                <button
                                  onClick={() => setNewInvoiceRows(prev => prev.filter((_, i) => i !== idx))}
                                  className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded mb-0.5"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-slate-200 pt-3 gap-3">
                          <button
                            onClick={() => setNewInvoiceRows(prev => [...prev, { month: d.getMonth() + 1, year: d.getFullYear(), amount: '' }])}
                            className="text-sm text-blue-600 font-medium hover:text-blue-800"
                          >
                            + Tambah Tagihan Infaq
                          </button>
                          <button
                            onClick={handleEditItemsSave}
                            disabled={actionLoading}
                            className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Simpan Perubahan
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* View mode: table */
                      <>
                        {/* View mode: table (Desktop) */}
                        <div className="hidden sm:block overflow-x-auto w-full">
                          <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                              <tr>
                                <th className="px-4 py-3 text-left font-medium w-12 text-center">No</th>
                                <th className="px-4 py-3 text-left font-medium">Item</th>
                                <th className="px-4 py-3 text-right font-medium">Nominal</th>
                                <th className="px-4 py-3 text-right font-medium">Telah Dibayar</th>
                                <th className="px-4 py-3 text-right font-medium">Tunggakan</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {allInvoices.map((inv: any, i: number) => {
                                const itemPaid = Number(inv.paid_amount) || 0
                                const itemSisa = Number(inv.amount) - itemPaid
                                return (
                                  <tr key={inv.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 text-center text-slate-400 font-medium">{i + 1}</td>
                                    <td className="px-4 py-3 text-slate-700 font-medium">{inv.title}</td>
                                    <td className="px-4 py-3 text-right text-slate-800">{formatRp(Number(inv.amount))}</td>
                                    <td className="px-4 py-3 text-right text-emerald-600">{formatRp(itemPaid)}</td>
                                    <td className="px-4 py-3 text-right text-red-600 font-medium">
                                      {itemSisa > 0 ? formatRp(itemSisa) : <span className="text-emerald-500 font-bold">Lunas</span>}
                                    </td>
                                  </tr>
                                )
                              })}
                              <tr className="bg-blue-50/50">
                                <td colSpan={2} className="px-4 py-3 font-bold text-slate-700 text-right">Total</td>
                                <td className="px-4 py-3 text-right font-bold text-slate-800">{formatRp(totalAmount)}</td>
                                <td className="px-4 py-3 text-right font-bold text-emerald-700">{formatRp(totalPaid)}</td>
                                <td className="px-4 py-3 text-right font-bold text-red-700">{formatRp(totalSisa)}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile Card View for Items */}
                        <div className="sm:hidden flex flex-col divide-y divide-slate-100">
                          {allInvoices.map((inv: any, i: number) => {
                            const itemPaid = Number(inv.paid_amount) || 0
                            const itemSisa = Number(inv.amount) - itemPaid
                            return (
                              <div key={inv.id} className="p-4 bg-white hover:bg-slate-50 transition space-y-2.5">
                                <div className="flex justify-between items-start gap-2">
                                  <div className="font-bold text-sm text-slate-800">{inv.title}</div>
                                  <div className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${itemSisa > 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                    {itemSisa > 0 ? 'Belum Lunas' : 'Lunas'}
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">Nominal</span>
                                    <span className="font-medium text-slate-700">{formatRp(Number(inv.amount))}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">Telah Dibayar</span>
                                    <span className="font-medium text-emerald-600">{formatRp(itemPaid)}</span>
                                  </div>
                                  {itemSisa > 0 && (
                                    <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-50 mt-1">
                                      <span className="text-slate-500">Tunggakan</span>
                                      <span className="font-bold text-red-600">{formatRp(itemSisa)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                          <div className="p-4 bg-slate-50 space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-600 font-semibold">Total Tagihan</span>
                              <span className="font-bold text-slate-800">{formatRp(totalAmount)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-600 font-semibold">Total Dibayar</span>
                              <span className="font-bold text-emerald-600">{formatRp(totalPaid)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm pt-1.5 border-t border-slate-200 mt-1">
                              <span className="text-slate-700 font-bold">Total Sisa</span>
                              <span className="font-bold text-red-600">{formatRp(totalSisa)}</span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Action Area */}
              <div className="space-y-5">

                {/* Info Pembayaran */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-800 text-sm">Info Pembayaran Saat Ini</h4>
                  <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4">

                    <div className="flex-1 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-100 pb-3 md:pb-0 md:pr-4">
                      <span className="text-slate-500 text-xs mb-1">Jenis Pembayaran Terakhir</span>
                      <span className="flex items-center gap-1.5 font-bold text-slate-700">
                        {(() => {
                          const pm = allInvoices.find((inv: any) => inv.payment_method)?.payment_method
                          if (pm === 'TRANSFER') return <><CreditCard size={15} className="text-blue-500" /> Transfer Bank</>
                          if (pm === 'CASH') return <><Banknote size={15} className="text-green-500" /> Tunai (TU)</>
                          return <><Banknote size={15} className="text-slate-400" /> -</>
                        })()}
                      </span>
                    </div>

                    <div className="flex-1 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-100 pb-3 md:pb-0 md:pr-4">
                      <span className="text-slate-500 text-xs mb-1">Total Nominal Terbayar</span>
                      <span className="font-bold text-emerald-600 text-lg">{formatRp(totalPaid)}</span>
                    </div>

                    <div className="flex-1 flex flex-col justify-center space-y-2">
                      {invoice.bukti_transfer && (
                        <a
                          href={invoice.bukti_transfer}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-2 w-full bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-100 py-2 rounded-lg text-sm font-semibold transition"
                        >
                          <ExternalLink size={14} /> Lihat Bukti Transfer
                        </a>
                      )}

                      {totalPaid > 0 && (
                        <button
                          onClick={openPrintReceipt}
                          className="w-full bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2"
                        >
                          <Printer size={15} /> Cetak Bukti Pembayaran
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Riwayat Catatan Pembayaran */}
                  {invoice.note && (
                    <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-700 border border-slate-200 mt-3 shadow-sm">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5 mb-2.5">
                        <FileText size={14} className="text-slate-500" /> Riwayat Catatan Pembayaran:
                      </span>
                      <ul className="space-y-2">
                        {invoice.note.split(' | ').map((n: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 border-b border-slate-200/60 pb-2 last:border-0 last:pb-0">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-1.5 shrink-0" />
                            <span className="leading-relaxed">{n}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Form Aksi Pembayaran */}
                <div className="space-y-4 pt-2 border-t border-slate-100">

                  {/* PENDING VERIFICATION — Verifikasi transfer per item */}
                  {invoice.status === 'PENDING_VERIFICATION' && (
                    <div className="bg-blue-50 border border-blue-200 p-4 sm:p-5 rounded-xl space-y-4">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-blue-500" />
                        <h4 className="font-bold text-blue-800 text-sm">Menunggu Verifikasi Transfer</h4>
                      </div>

                      <div className="text-xs text-blue-800 bg-white/70 p-3.5 rounded-lg border border-blue-100">
                        <p className="font-bold mb-1.5 text-blue-900">Catatan dari Orang Tua:</p>
                        <p className="font-medium bg-blue-50/50 p-2 rounded border border-blue-100/50">
                          {invoice.note ? invoice.note.split(' | ').pop() : 'Tidak ada catatan'}
                        </p>
                        {invoice.updated_at && (
                          <p className="mt-2 text-[11px] text-blue-500 font-medium">
                            Dikirim pada: {new Date(invoice.updated_at).toLocaleString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB
                          </p>
                        )}
                      </div>

                      {invoice.bukti_transfer && (
                        <a
                          href={invoice.bukti_transfer}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-2 w-full bg-white border border-blue-200 text-blue-700 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-100 transition shadow-sm shadow-blue-100"
                        >
                          <Download size={15} /> Lihat Bukti Transfer
                        </a>
                      )}

                      <div className="w-full h-px bg-blue-200/60 my-2"></div>

                      <h4 className="font-bold text-blue-900 text-sm flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-blue-600" /> Verifikasi Nominal Pembayaran
                      </h4>
                      <p className="text-xs text-blue-700 -mt-2 mb-2">Sesuaikan nominal tagihan dengan dana transfer yang masuk ke rekening sekolah.</p>

                      <div className="space-y-3">
                        {allInvoices.filter((inv: any) => (Number(inv.amount) - (Number(inv.paid_amount) || 0)) > 0).map((inv: any, idx: number) => {
                          const itemSisa = Number(inv.amount) - (Number(inv.paid_amount) || 0)
                          const verifyInput = verifyAmounts[inv.id] ?? ''
                          return (
                            <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
                              <div className="w-8 flex items-center justify-center h-8 bg-blue-50 rounded-full text-blue-600 font-bold text-xs shrink-0">{idx + 1}</div>
                              <div className="flex-1">
                                <p className="text-sm font-bold text-slate-800 truncate">{inv.title}</p>
                                <p className="text-[11px] text-slate-500 font-semibold mt-1">Sisa: {formatRp(itemSisa)}</p>
                              </div>
                              <div className="w-full sm:w-48 relative flex items-center mt-2 sm:mt-0">
                                <input
                                  type="number"
                                  min="0"
                                  max={itemSisa}
                                  value={verifyInput}
                                  onWheel={(e) => (e.target as HTMLElement).blur()}
                                  onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault() }}
                                  onChange={(e) => setVerifyAmounts({ ...verifyAmounts, [inv.id]: e.target.value ? Number(e.target.value) : '' })}
                                  className="w-full pl-3 pr-3 py-2 text-sm border border-slate-300 rounded-lg text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                  placeholder="Nominal"
                                />
                                <button
                                  title="Validasi Penuh"
                                  onClick={() => setVerifyAmounts({ ...verifyAmounts, [inv.id]: itemSisa })}
                                  className="absolute -top-2 -right-2 bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-sm hover:bg-blue-200 border border-blue-200 transition"
                                >
                                  LUNASI
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      <div className="flex items-center justify-between border-t border-blue-200 pt-3">
                        <span className="text-xs font-semibold text-blue-800 uppercase">Total Diverifikasi</span>
                        <span className="text-lg font-bold text-emerald-600">{formatRp(totalVerifyPreview)}</span>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={handleRejectTransfer}
                          disabled={actionLoading}
                          className="flex-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-50"
                        >
                          Tolak Bukti Transfer
                        </button>
                        <button
                          onClick={handleVerifyTransfer}
                          disabled={actionLoading || (totalVerifyPreview as number) <= 0}
                          className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 py-2.5 rounded-lg text-sm font-bold transition shadow-sm disabled:opacity-50 flex items-center justify-center"
                        >
                          {actionLoading ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Setujui & Simpan ✓'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* CASH PAYMENT — untuk status UNPAID / PARTIAL */}
                  {['UNPAID', 'PARTIAL'].includes(invoice.status) && (
                    <div className="bg-slate-50 border border-slate-200 p-4 sm:p-5 rounded-xl space-y-4">
                      <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <Banknote size={16} className="text-green-600" /> Input Bayar Tunai (TU) per Item
                      </h4>

                      <div className="space-y-3">
                        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-1 hidden sm:flex">
                          <div className="flex-1">Item Tunggakan</div>
                          <div className="w-32 text-right">Bayar (Rp)</div>
                        </div>
                        {allInvoices.filter((inv: any) => (Number(inv.amount) - (Number(inv.paid_amount) || 0)) > 0).map((inv: any, idx: number) => {
                          const itemSisa = Number(inv.amount) - (Number(inv.paid_amount) || 0)
                          const paymentInput = paymentAmounts[inv.id] ?? ''
                          return (
                            <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                              <div className="w-8 flex items-center justify-center h-8 bg-slate-100 rounded-full text-slate-500 font-bold text-xs shrink-0">{idx + 1}</div>
                              <div className="flex-1">
                                <p className="text-sm font-bold text-slate-700 truncate">{inv.title}</p>
                                <p className="text-[11px] text-red-500 font-semibold bg-red-50 px-2 py-0.5 rounded-full inline-block mt-1">Kekurangan: {formatRp(itemSisa)}</p>
                              </div>
                              <div className="w-full sm:w-48 relative flex items-center mt-2 sm:mt-0">
                                <input
                                  type="number"
                                  min="0"
                                  max={itemSisa}
                                  value={paymentInput}
                                  onWheel={(e) => (e.target as HTMLElement).blur()}
                                  onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault() }}
                                  onChange={(e) => setPaymentAmounts({ ...paymentAmounts, [inv.id]: e.target.value ? Number(e.target.value) : '' })}
                                  className="w-full pl-3 pr-3 py-2 text-sm border border-slate-300 rounded-lg text-right focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
                                  placeholder="Nominal Pembayaran"
                                />
                                <button
                                  title="Bayar Penuh"
                                  onClick={() => setPaymentAmounts({ ...paymentAmounts, [inv.id]: itemSisa })}
                                  className="absolute -top-2 -right-2 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-sm hover:bg-emerald-200 border border-emerald-200 transition"
                                >
                                  LUNAS
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      <div className="pt-2">
                        <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Catatan Tambahan (Opsional)</label>
                        <input
                          type="text"
                          value={cashNote}
                          onChange={(e) => setCashNote(e.target.value)}
                          placeholder="Misal: Dititipkan melalui wali kelas..."
                          className="w-full px-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                        />
                      </div>

                      {/* Total Preview */}
                      {Object.values(paymentAmounts).some(v => typeof v === 'number' && v > 0) && (
                        <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                          <span className="text-xs font-semibold text-slate-600 uppercase">Total Bayar Sekarang</span>
                          <span className="text-lg font-bold text-emerald-600">
                            {formatRp(Object.values(paymentAmounts).reduce((acc: number, curr) => acc + (typeof curr === 'number' ? curr : 0), 0 as number) as number)}
                          </span>
                        </div>
                      )}

                      <button
                        onClick={handleCashPayment}
                        disabled={actionLoading}
                        className="w-full bg-emerald-600 text-white hover:bg-emerald-700 py-2.5 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 shadow-sm shadow-emerald-200 disabled:opacity-50 mt-4"
                      >
                        {actionLoading && <Loader2 size={16} className="animate-spin" />}
                        Simpan Pembayaran Tunai
                      </button>
                    </div>
                  )}

                  {invoice.status === 'PAID' && (
                    <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 p-4 rounded-xl flex items-center justify-center gap-2 font-bold shadow-sm">
                      <CheckCircle2 size={18} /> Tagihan Infaq Ini Sudah Lunas
                    </div>
                  )}

                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
