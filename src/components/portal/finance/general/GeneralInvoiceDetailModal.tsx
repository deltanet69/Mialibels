'use client'

import React, { useState, useEffect } from 'react'
import {
  X, Info, CheckCircle2, AlertTriangle, Clock, Banknote,
  CreditCard, Download, ExternalLink, Loader2
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

export function GeneralInvoiceDetailModal({ invoiceId, onClose, onUpdated }: Props) {
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Cash payment form
  const [cashAmount, setCashAmount] = useState('')
  const [cashNote, setCashNote] = useState('')

  useEffect(() => {
    if (invoiceId) {
      fetchDetail(invoiceId)
      setError(null)
      setSuccessMsg(null)
      setCashAmount('')
    }
  }, [invoiceId])

  const fetchDetail = async (id: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/finance/general/${id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setInvoice(data.data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCashPayment = async () => {
    if (!invoice || !cashAmount || Number(cashAmount) <= 0) {
      setError('Masukkan nominal yang valid.')
      return
    }
    setActionLoading(true)
    setError(null)
    try {
      const finalNote = cashNote 
        ? `${cashNote} (Rp ${Number(cashAmount).toLocaleString('id-ID')})` 
        : `Pembayaran Tunai (Rp ${Number(cashAmount).toLocaleString('id-ID')})`

      const res = await fetch(`/api/finance/general/${invoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CASH_PAYMENT',
          amount: Number(cashAmount),
          note: finalNote,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccessMsg('Pembayaran tunai berhasil dicatat.')
      setCashAmount('')
      setInvoice(data.data)
      onUpdated()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleVerify = async (action: 'APPROVE_TRANSFER' | 'REJECT_TRANSFER') => {
    if (!confirm(action === 'APPROVE_TRANSFER' ? 'Setujui pembayaran transfer ini?' : 'Tolak bukti transfer ini?')) return
    setActionLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/finance/general/${invoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
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

  if (!invoiceId) return null

  const formatRp = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

  const sisa = invoice ? Number(invoice.total_amount) - Number(invoice.paid_amount) : 0
  const items: { name: string; amount: number }[] = invoice?.items || []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto">

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

          {/* Loading state */}
          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 size={32} className="animate-spin text-slate-300" />
            </div>
          )}

          {/* Alert messages */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-medium">
              <AlertTriangle size={16} className="shrink-0" /> {error}
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-sm font-medium">
              <CheckCircle2 size={16} className="shrink-0" /> {successMsg}
            </div>
          )}

          {invoice && (
            <>
              {/* Top Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Biodata Siswa */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
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
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Info size={14} /> Detail Tagihan
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
                  <h4 className="font-bold text-slate-800 text-sm mb-3">Rincian Item Tagihan</h4>
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium">Item</th>
                          <th className="px-4 py-3 text-right font-medium">Nominal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {items.map((item, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-slate-700">{item.name}</td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatRp(Number(item.amount))}</td>
                          </tr>
                        ))}
                        <tr className="bg-blue-50">
                          <td className="px-4 py-3 font-bold text-slate-700">Total</td>
                          <td className="px-4 py-3 text-right font-bold text-blue-700">{formatRp(invoice.total_amount)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action Area — dua kolom: kiri kosong, kanan form aksi */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

                {/* Kiri: Info metode bayar terakhir jika ada */}
                <div className="lg:col-span-3 space-y-3">
                  <h4 className="font-bold text-slate-800 text-sm">Info Pembayaran</h4>
                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
                    
                    <div className="flex items-center justify-between text-sm pb-3 border-b border-slate-100">
                      <span className="text-slate-500">Jenis Pembayaran</span>
                      <span className="flex items-center gap-1.5 font-medium text-slate-700">
                        {invoice.payment_method === 'TRANSFER' ? <CreditCard size={15} className="text-blue-500" /> : <Banknote size={15} className="text-green-500" />}
                        {invoice.payment_method === 'TRANSFER' ? 'Transfer Bank' : invoice.payment_method === 'CASH' ? 'Tunai (TU)' : '-'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm pb-3 border-b border-slate-100">
                      <span className="text-slate-500">Nominal Pembayaran</span>
                      <span className="font-bold text-emerald-600">
                        {formatRp(Number(invoice.paid_amount) || 0)}
                      </span>
                    </div>

                    {invoice.note && (
                      <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-600 border border-slate-100">
                        <span className="font-medium text-slate-700 block mb-1">Catatan:</span>
                        {invoice.note}
                      </div>
                    )}

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
                  </div>
                </div>

                {/* Kanan: Action forms */}
                <div className="lg:col-span-2 space-y-4">

                  {/* PENDING VERIFICATION — Approve or Reject */}
                  {invoice.status === 'PENDING_VERIFICATION' && (
                    <div className="bg-blue-50 border border-blue-200 p-5 rounded-xl space-y-3">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-blue-500" />
                        <h4 className="font-bold text-blue-800 text-sm">Menunggu Verifikasi Transfer</h4>
                      </div>
                      <p className="text-xs text-blue-600">
                        Orang tua telah mengunggah bukti transfer.<br />
                        Total: <strong>{formatRp(invoice.total_amount)}</strong>
                      </p>
                      {invoice.bukti_transfer && (
                        <a
                          href={invoice.bukti_transfer}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-2 w-full bg-white border border-blue-200 text-blue-700 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition"
                        >
                          <Download size={14} /> Lihat Bukti Transfer
                        </a>
                      )}
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleVerify('REJECT_TRANSFER')}
                          disabled={actionLoading}
                          className="flex-1 bg-red-100 text-red-600 hover:bg-red-200 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
                        >
                          Tolak
                        </button>
                        <button
                          onClick={() => handleVerify('APPROVE_TRANSFER')}
                          disabled={actionLoading}
                          className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 py-2 rounded-lg text-sm font-semibold transition shadow-sm disabled:opacity-50"
                        >
                          {actionLoading ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Setujui ✓'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* CASH PAYMENT — untuk status UNPAID / PARTIAL */}
                  {['UNPAID', 'PARTIAL'].includes(invoice.status) && (
                    <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-3">
                      <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <Banknote size={16} className="text-green-600" /> Input Bayar Tunai (TU)
                      </h4>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">
                          Nominal (Rp) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={sisa}
                          value={cashAmount}
                          onChange={e => setCashAmount(e.target.value)}
                          placeholder={`Maks: ${formatRp(sisa)}`}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-sm"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Dapat mengisi sebagian (cicilan) dari sisa tagihan.</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Catatan</label>
                        <textarea
                          rows={2}
                          value={cashNote}
                          onChange={e => setCashNote(e.target.value)}
                          placeholder="Misal: Pembayaran tunai ke TU"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-sm resize-none"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Nominal pembayaran akan otomatis ditambahkan ke catatan.</p>
                      </div>
                      <button
                        onClick={handleCashPayment}
                        disabled={actionLoading || !cashAmount}
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
                      <p className="text-xs text-emerald-600 mt-1">Semua tagihan sudah diselesaikan.</p>
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
