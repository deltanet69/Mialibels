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

const PREDEFINED_ITEMS = [
  'Mutu', 'Infaq / SPP Sekolah', 'Buku Paket/LKS', 'Seragam Sekolah', 'Ulangan Umum (ULUM)', 'Raport',
  'Kartu Pelajar', 'Foto Siswa', 'Qurban', "Yanbu'a", 'Kegiatan Fullday', 'Tagihan Akhir tahun'
]

export function GeneralInvoiceDetailModal({ invoiceId, onClose, onUpdated }: Props) {
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Edit Mode States
  const [isEditMode, setIsEditMode] = useState(false)
  const [editItems, setEditItems] = useState<{name: string, amount: number, paid_amount: number, _isCustom?: boolean}[]>([])

  // Cash payment form (Itemized)
  const [cashNote, setCashNote] = useState('')
  const [paymentItems, setPaymentItems] = useState<{name: string, paid_amount: number}[]>([])
  
  // Show Print Option
  const [showPrintOption, setShowPrintOption] = useState(false)

  useEffect(() => {
    if (invoiceId) {
      fetchDetail(invoiceId)
      setError(null)
      setSuccessMsg(null)
      setCashNote('')
      setIsEditMode(false)
      setShowPrintOption(false)
    }
  }, [invoiceId])

  const fetchDetail = async (id: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/finance/general/${id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setInvoice(data.data)
      
      // Initialize payment inputs to empty (0)
      if (data.data.items) {
        setPaymentItems(data.data.items.map((i: any) => ({ name: i.name, paid_amount: 0 })))
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCashPayment = async () => {
    // Filter items that have > 0 payment input
    const validPayments = paymentItems.filter(p => p.paid_amount > 0)
    
    if (validPayments.length === 0) {
      setError('Masukkan setidaknya satu nominal pembayaran yang lebih dari 0.')
      return
    }

    const totalCashAmount = validPayments.reduce((acc, curr) => acc + curr.paid_amount, 0)
    
    setActionLoading(true)
    setError(null)
    try {
      const finalNote = cashNote 
        ? `${cashNote} (Rp ${Number(totalCashAmount).toLocaleString('id-ID')})` 
        : `Pembayaran Tunai (Rp ${Number(totalCashAmount).toLocaleString('id-ID')})`

      const res = await fetch(`/api/finance/general/${invoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CASH_PAYMENT',
          items_paid: validPayments,
          note: finalNote,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      setSuccessMsg('Pembayaran tunai berhasil dicatat.')
      setCashNote('')
      setInvoice(data.data)
      if (data.data.items) {
        setPaymentItems(data.data.items.map((i: any) => ({ name: i.name, paid_amount: 0 })))
      }
      setShowPrintOption(true) // Show print button after successful payment
      onUpdated()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleVerify = async (action: 'APPROVE_TRANSFER' | 'REJECT_TRANSFER') => {
    let rejectReason = '';
    if (action === 'REJECT_TRANSFER') {
      const reason = prompt('Masukkan alasan penolakan (misal: Bukti transfer buram, Nominal kurang, dll):');
      if (reason === null) return; // Cancelled by user
      if (!reason.trim()) {
        alert('Alasan penolakan wajib diisi agar orang tua tahu kesalahannya.');
        return;
      }
      rejectReason = reason.trim();
    } else {
      if (!confirm('Setujui pembayaran transfer ini secara penuh?')) return;
    }
    
    setActionLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/finance/general/${invoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, rejectReason }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccessMsg(action === 'APPROVE_TRANSFER' ? 'Transfer berhasil disetujui. Tagihan lunas!' : 'Bukti transfer ditolak.')
      setInvoice(data.data)
      onUpdated()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleVerifyTransfer = async () => {
    const validPayments = paymentItems.filter(p => p.paid_amount > 0)
    
    if (validPayments.length === 0) {
      setError('Masukkan setidaknya satu nominal verifikasi yang lebih dari 0.')
      return
    }

    if (!confirm('Apakah nominal verifikasi yang Anda masukkan sudah sesuai dengan dana transfer yang masuk?')) return

    const totalVerifiedAmount = validPayments.reduce((acc, curr) => acc + curr.paid_amount, 0)
    
    setActionLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/finance/general/${invoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'VERIFY_TRANSFER',
          items_paid: validPayments,
          note: `Transfer Diverifikasi (Rp ${Number(totalVerifiedAmount).toLocaleString('id-ID')})`,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      setSuccessMsg('Transfer berhasil diverifikasi dan dicatat.')
      setInvoice(data.data)
      if (data.data.items) {
        setPaymentItems(data.data.items.map((i: any) => ({ name: i.name, paid_amount: 0 })))
      }
      onUpdated()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleEditItemsSave = async () => {
    if (editItems.length === 0) {
      setError("Rincian tagihan tidak boleh kosong")
      return
    }

    if (editItems.some(i => i.name.trim() === '')) {
      setError("Nama item tagihan tidak boleh kosong")
      return
    }

    setActionLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/finance/general/${invoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'EDIT_ITEMS',
          items: editItems
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      setSuccessMsg('Rincian tagihan berhasil diperbarui.')
      setInvoice(data.data)
      setIsEditMode(false)
      if (data.data.items) {
        setPaymentItems(data.data.items.map((i: any) => ({ name: i.name, paid_amount: 0 })))
      }
      onUpdated()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleEditItemChange = (index: number, field: string, value: string | number | boolean) => {
    const newItems = [...editItems]
    newItems[index] = { ...newItems[index], [field]: value }
    setEditItems(newItems)
  }

  const handleAddEditItem = () => {
    setEditItems([...editItems, { name: '', amount: 0, paid_amount: 0 }])
  }

  const handleRemoveEditItem = (index: number) => {
    const newItems = editItems.filter((_, i) => i !== index)
    setEditItems(newItems)
  }

  const toggleEditMode = () => {
    if (!isEditMode) {
      setEditItems(
        JSON.parse(JSON.stringify(invoice.items || [])).map((item: any) => ({
          ...item,
          _isCustom: item.name && !PREDEFINED_ITEMS.includes(item.name)
        }))
      )
    }
    setIsEditMode(!isEditMode)
  }

  const openPrintReceipt = () => {
    if (invoiceId) {
      window.open(`/print/invoice/${invoiceId}`, '_blank')
    }
  }

  if (!invoiceId) return null

  const formatRp = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

  const sisa = invoice ? Number(invoice.total_amount) - Number(invoice.paid_amount) : 0
  const items: { name: string; amount: number; paid_amount?: number }[] = invoice?.items || []
  const totalPaymentPreview = paymentItems.reduce((acc, curr) => acc + (Number(curr.paid_amount) || 0), 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto">

        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Detail Tagihan Umum</h3>
            {invoice && <p className="text-sm text-slate-500 mt-0.5">{invoice.title}</p>}
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
                  className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1 hover:bg-emerald-700 transition"
                >
                  <Printer size={14} /> Cetak Struk
                </button>
              )}
            </div>
          )}

          {invoice && (
            <>
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
                      ['ID Siswa', invoice.student_number],
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

                {/* Detail Tagihan */}
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
                      <span className="font-semibold text-slate-800">{invoice.type || '-'}</span>
                    </div>
                    <div className="flex justify-between border-b border-blue-100 pb-2">
                      <span className="text-slate-500">Jatuh Tempo</span>
                      <span className="font-semibold text-slate-800">
                        {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-blue-100 pb-2">
                      <span className="text-slate-500">Total Tagihan</span>
                      <span className="font-bold text-slate-800">{formatRp(invoice.total_amount)}</span>
                    </div>
                    <div className="flex justify-between border-b border-blue-100 pb-2">
                      <span className="text-slate-500">Sudah Dibayar</span>
                      <span className="font-bold text-emerald-600">{formatRp(invoice.paid_amount || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Kekurangan</span>
                      <span className={`font-bold ${sisa > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {sisa > 0 ? formatRp(sisa) : 'Lunas'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rincian Items */}
              {items.length > 0 && (
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

                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden overflow-x-auto">
                    {isEditMode ? (
                      <div className="p-4 space-y-4 bg-slate-50 min-w-[600px]">
                        <div className="space-y-3">
                          {editItems.map((item, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-white p-3 rounded-lg border border-slate-200">
                              <div className="flex-1 w-full flex items-center gap-2">
                                <span className="font-bold text-slate-500 text-xs w-4">{idx + 1}.</span>
                                <div className="flex-1 w-full">
                                  <label className="text-[10px] font-semibold text-slate-500 uppercase">Nama Item</label>
                                  {item._isCustom ? (
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        value={item.name}
                                        onChange={e => handleEditItemChange(idx, 'name', e.target.value)}
                                        className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md outline-none focus:border-blue-500"
                                        placeholder="Ketik nama item..."
                                        autoFocus
                                      />
                                      <button 
                                        onClick={() => { handleEditItemChange(idx, '_isCustom', false); handleEditItemChange(idx, 'name', ''); }}
                                        className="px-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-md"
                                        title="Kembali ke pilihan"
                                      >
                                        <X size={14} />
                                      </button>
                                    </div>
                                  ) : (
                                    <select
                                      value={PREDEFINED_ITEMS.includes(item.name) ? item.name : (item.name ? 'OTHER' : '')}
                                      onChange={(e) => {
                                        if (e.target.value === 'OTHER') {
                                          handleEditItemChange(idx, 'name', '')
                                          handleEditItemChange(idx, '_isCustom', true)
                                        } else {
                                          handleEditItemChange(idx, 'name', e.target.value)
                                          handleEditItemChange(idx, '_isCustom', false)
                                        }
                                      }}
                                      className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md outline-none focus:border-blue-500 bg-white"
                                    >
                                      <option value="" disabled>Pilih Item...</option>
                                      {PREDEFINED_ITEMS.map((o: string) => <option key={o} value={o}>{o}</option>)}
                                      <option value="OTHER">Tulis Manual (Lainnya)...</option>
                                    </select>
                                  )}
                                </div>
                              </div>
                              <div className="w-full sm:w-1/3">
                                <label className="text-[10px] font-semibold text-slate-500 uppercase">Nominal</label>
                                <input
                                  type="number"
                                  value={item.amount}
                                  onChange={e => {
                                    const newAmt = Number(e.target.value);
                                    handleEditItemChange(idx, 'amount', newAmt);
                                    if (Number(item.paid_amount) > newAmt) {
                                      handleEditItemChange(idx, 'paid_amount', newAmt);
                                    }
                                  }}
                                  className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md outline-none focus:border-blue-500"
                                />
                              </div>
                              <div className="w-full sm:w-1/3">
                                <label className="text-[10px] font-semibold text-emerald-600 uppercase">Sdh Dibayar</label>
                                <input
                                  type="number"
                                  value={item.paid_amount || 0}
                                  onChange={e => handleEditItemChange(idx, 'paid_amount', Number(e.target.value))}
                                  className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md outline-none focus:border-emerald-500 text-emerald-700 font-semibold bg-emerald-50"
                                />
                              </div>
                              <div className="pt-4">
                                <button
                                  onClick={() => handleRemoveEditItem(idx)}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                          <button
                            onClick={handleAddEditItem}
                            className="text-sm text-blue-600 font-medium hover:text-blue-800"
                          >
                            + Tambah Item
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
                      <table className="w-full text-sm min-w-[500px]">
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
                          {items.map((item, i) => {
                            const itemPaid = Number(item.paid_amount) || 0;
                            const itemSisa = Number(item.amount) - itemPaid;
                            return (
                              <tr key={i} className="hover:bg-slate-50">
                                <td className="px-4 py-3 text-center text-slate-400 font-medium">{i + 1}</td>
                                <td className="px-4 py-3 text-slate-700 font-medium">{item.name}</td>
                                <td className="px-4 py-3 text-right text-slate-800">{formatRp(Number(item.amount))}</td>
                                <td className="px-4 py-3 text-right text-emerald-600">{formatRp(itemPaid)}</td>
                                <td className="px-4 py-3 text-right text-red-600 font-medium">
                                  {itemSisa > 0 ? formatRp(itemSisa) : <span className="text-emerald-500 font-bold">Lunas</span>}
                                </td>
                              </tr>
                            )
                          })}
                          <tr className="bg-blue-50/50">
                            <td colSpan={2} className="px-4 py-3 font-bold text-slate-700 text-right">Total</td>
                            <td className="px-4 py-3 text-right font-bold text-slate-800">{formatRp(invoice.total_amount)}</td>
                            <td className="px-4 py-3 text-right font-bold text-emerald-700">{formatRp(invoice.paid_amount)}</td>
                            <td className="px-4 py-3 text-right font-bold text-red-700">{formatRp(sisa)}</td>
                          </tr>
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {/* Action Area — Informasi dan Form digabung menjadi 1 section vertikal */}
              <div className="space-y-5">

                {/* Info Pembayaran */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-800 text-sm">Info Pembayaran Saat Ini</h4>
                  <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4">
                    
                    <div className="flex-1 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-100 pb-3 md:pb-0 md:pr-4">
                      <span className="text-slate-500 text-xs mb-1">Jenis Pembayaran Terakhir</span>
                      <span className="flex items-center gap-1.5 font-bold text-slate-700">
                        {invoice.payment_method === 'TRANSFER' ? <CreditCard size={15} className="text-blue-500" /> : <Banknote size={15} className="text-green-500" />}
                        {invoice.payment_method === 'TRANSFER' ? 'Transfer Bank' : invoice.payment_method === 'CASH' ? 'Tunai (TU)' : '-'}
                      </span>
                    </div>

                    <div className="flex-1 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-100 pb-3 md:pb-0 md:pr-4">
                      <span className="text-slate-500 text-xs mb-1">Total Nominal Terbayar</span>
                      <span className="font-bold text-emerald-600 text-lg">
                        {formatRp(Number(invoice.paid_amount) || 0)}
                      </span>
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
                      
                      {invoice.status !== 'UNPAID' && (
                        <button
                          onClick={openPrintReceipt}
                          className="w-full bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2"
                        >
                          <Printer size={15} /> Cetak Bukti Pembayaran
                        </button>
                      )}
                    </div>
                  </div>
                  {invoice.note && (
                    <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-700 border border-slate-200 mt-3 shadow-sm">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5 mb-2.5">
                        <FileText size={14} className="text-slate-500" /> Riwayat Catatan Pembayaran:
                      </span>
                      <ul className="space-y-2">
                        {invoice.note.split(' | ').map((n: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 border-b border-slate-200/60 pb-2 last:border-0 last:pb-0">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-1.5 shrink-0" />
                            <span className="leading-relaxed ">{n}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Form Aksi Pembayaran */}
                <div className="space-y-4 pt-2 border-t border-slate-100">

                  {/* PENDING VERIFICATION — Approve with Items or Reject */}
                  {invoice.status === 'PENDING_VERIFICATION' && (
                    <div className="bg-blue-50 border border-blue-200 p-4 sm:p-5 rounded-xl space-y-4">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-blue-500" />
                        <h4 className="font-bold text-blue-800 text-sm">Menunggu Verifikasi Transfer</h4>
                      </div>
                      
                      <div className="text-xs text-blue-800 bg-white/70 p-3.5 rounded-lg border border-blue-100">
                        <p className="font-bold mb-1.5 text-blue-900">Catatan dari Orang Tua:</p>
                        <p className="font-medium bg-blue-50/50 p-2 rounded border border-blue-100/50">{invoice.note ? invoice.note.split(' | ').pop() : 'Tidak ada catatan'}</p>
                        {invoice.updated_at && (
                          <p className="mt-2 text-[11px] text-blue-500 font-medium">Dikirim pada: {new Date(invoice.updated_at).toLocaleString("id-ID", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB</p>
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
                        <div className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide px-1 flex hidden sm:flex">
                          <div className="flex-1">Item Tunggakan</div>
                          <div className="w-32 text-right">Verifikasi (Rp)</div>
                        </div>
                        {items.filter(item => (Number(item.amount) - (Number(item.paid_amount) || 0)) > 0).map((item, idx) => {
                          const itemSisa = Number(item.amount) - (Number(item.paid_amount) || 0);
                          const paymentInput = paymentItems.find(p => p.name === item.name)?.paid_amount || '';
                          
                          return (
                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
                              <div className="w-8 flex items-center justify-center h-8 bg-blue-50 rounded-full text-blue-600 font-bold text-xs shrink-0">
                                {idx + 1}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-bold text-slate-800 truncate">{item.name}</p>
                                <p className="text-[11px] text-slate-500 font-semibold mt-1">Sisa: {formatRp(itemSisa)}</p>
                              </div>
                              <div className="w-full sm:w-48 relative flex items-center mt-2 sm:mt-0">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none sm:hidden">
                                  <span className="text-slate-400 text-sm font-medium">Rp</span>
                                </div>
                                <input
                                  type="number"
                                  min="0"
                                  max={itemSisa}
                                  value={paymentInput}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setPaymentItems(prev => prev.map(p => p.name === item.name ? { ...p, paid_amount: val } : p));
                                  }}
                                  className="w-full pl-9 sm:pl-3 pr-3 py-2 text-sm border border-slate-300 rounded-lg sm:text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                  placeholder="Nominal"
                                />
                                <button
                                  title="Validasi Penuh"
                                  onClick={() => setPaymentItems(prev => prev.map(p => p.name === item.name ? { ...p, paid_amount: itemSisa } : p))}
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
                        <span className="text-lg font-bold text-emerald-600">{formatRp(totalPaymentPreview)}</span>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleVerify('REJECT_TRANSFER')}
                          disabled={actionLoading}
                          className="flex-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-50"
                        >
                          Tolak Bukti Transfer
                        </button>
                        <button
                          onClick={handleVerifyTransfer}
                          disabled={actionLoading || totalPaymentPreview <= 0}
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
                        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-1 flex hidden sm:flex">
                          <div className="flex-1">Item Tunggakan</div>
                          <div className="w-32 text-right">Bayar (Rp)</div>
                        </div>
                        {items.filter(item => (Number(item.amount) - (Number(item.paid_amount) || 0)) > 0).map((item, idx) => {
                          const itemSisa = Number(item.amount) - (Number(item.paid_amount) || 0);
                          const paymentInput = paymentItems.find(p => p.name === item.name)?.paid_amount || '';
                          
                          return (
                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                              <div className="w-8 flex items-center justify-center h-8 bg-slate-100 rounded-full text-slate-500 font-bold text-xs shrink-0">
                                {idx + 1}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-bold text-slate-700 truncate">{item.name}</p>
                                <p className="text-[11px] text-red-500 font-semibold bg-red-50 px-2 py-0.5 rounded-full inline-block mt-1">Kekurangan: {formatRp(itemSisa)}</p>
                              </div>
                              <div className="w-full sm:w-48 relative flex items-center mt-2 sm:mt-0">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none sm:hidden">
                                  <span className="text-slate-400 text-sm font-medium">Rp</span>
                                </div>
                                <input
                                  type="number"
                                  min="0"
                                  max={itemSisa}
                                  value={paymentInput}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    setPaymentItems(prev => prev.map(p => p.name === item.name ? { ...p, paid_amount: val } : p));
                                  }}
                                  className="w-full pl-9 sm:pl-3 pr-3 py-2 text-sm border border-slate-300 rounded-lg sm:text-right focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                                  placeholder="Nominal Pembayaran"
                                />
                                <button
                                  title="Bayar Penuh"
                                  onClick={() => setPaymentItems(prev => prev.map(p => p.name === item.name ? { ...p, paid_amount: itemSisa } : p))}
                                  className="absolute -top-2 -right-2 bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-sm hover:bg-blue-200 border border-blue-200 transition"
                                >
                                  LUNASI
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                        <span className="text-xs font-semibold text-slate-500 uppercase">Total Dibayar</span>
                        <span className="text-lg font-bold text-emerald-600">{formatRp(totalPaymentPreview)}</span>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Catatan</label>
                        <textarea
                          rows={2}
                          value={cashNote}
                          onChange={e => setCashNote(e.target.value)}
                          placeholder="Misal: Pembayaran tunai sebagian ke TU"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-sm resize-none"
                        />
                      </div>

                      <button
                        onClick={handleCashPayment}
                        disabled={actionLoading || totalPaymentPreview <= 0}
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2.5 rounded-lg transition text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {actionLoading
                          ? <><Loader2 size={14} className="animate-spin" /> Menyimpan...</>
                          : <><Banknote size={15} /> Simpan Pembayaran Tunai</>
                        }
                      </button>
                    </div>
                  )}

                  {/* PAID — sudah lunas */}
                  {invoice.status === 'PAID' && (
                    <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-xl text-center">
                      <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-2 opacity-70" />
                      <h4 className="font-bold text-emerald-800">Tagihan Lunas</h4>
                      <p className="text-xs text-emerald-600 mt-1">Semua rincian tagihan sudah diselesaikan.</p>
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
