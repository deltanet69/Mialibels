"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Trash2, Search, Filter, Eye, Download, Info, CheckCircle2 } from "lucide-react";

// Constants outside component = never re-created
const STATUS_COLORS: Record<string, string> = {
  "PAID": "bg-emerald-100 text-emerald-700",
  "UNPAID": "bg-red-100 text-red-700",
  "PARTIAL": "bg-amber-100 text-amber-700",
  "PENDING_VERIFICATION": "bg-blue-100 text-blue-700",
  "LATE": "bg-red-100 text-red-700 font-bold"
};
const STATUS_LABELS: Record<string, string> = {
  "PAID": "Lunas",
  "UNPAID": "Belum Bayar",
  "PARTIAL": "Mencicil",
  "PENDING_VERIFICATION": "Menunggu Verifikasi",
  "LATE": "Terlambat"
};

export default function ManageTab() {
  // Raw data from server (only changes when month/year changes)
  const [allInvoices, setAllInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  
  // Server-side filters (trigger API call)
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  // Client-side filters (instant, no API call)
  const [filterClass, setFilterClass] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPayment, setFilterPayment] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Detail Modal
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [manualAmount, setManualAmount] = useState("");
  const [manualDesc, setManualDesc] = useState("Pembayaran Tunai ke TU");

  // Generate Modal
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [genTitle, setGenTitle] = useState("SPP Bulanan");
  const [genAmount, setGenAmount] = useState(150000);
  const [genMonth, setGenMonth] = useState(new Date().getMonth() + 1);
  const [genYear, setGenYear] = useState(new Date().getFullYear());
  const [genDueDate, setGenDueDate] = useState(() => {
    const d = new Date();
    d.setDate(10);
    return d.toISOString().split("T")[0];
  });

  // Fetch from server ONLY when month or year changes
  const fetchInvoices = useCallback(async (month: number, year: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ month: month.toString(), year: year.toString() });
      const res = await fetch(`/api/spp/manage?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setAllInvoices(data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices(filterMonth, filterYear);
  }, [filterMonth, filterYear, fetchInvoices]);

  // Client-side filtering (instant, zero latency)
  const invoices = useMemo(() => {
    let result = allInvoices;
    if (filterClass) result = result.filter(inv => inv.student_class === filterClass);
    if (filterStatus) result = result.filter(inv => inv.status === filterStatus);
    if (filterPayment) result = result.filter(inv => inv.payment_method === filterPayment);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(inv =>
        inv.student_name?.toLowerCase().includes(q) ||
        inv.student_number?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [allInvoices, filterClass, filterStatus, filterPayment, searchQuery]);

  const fetchTransactions = async (invoiceId: string) => {
    setLoadingTx(true);
    try {
      const res = await fetch(`/api/spp/transactions?invoice_id=${invoiceId}`);
      const data = await res.json();
      if (data.success) setTransactions(data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingTx(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage({ text: "", type: "" });
    try {
      const res = await fetch("/api/spp/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: genTitle, amount: genAmount, month: genMonth, year: genYear, due_date: genDueDate })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat tagihan");
      setMessage({ text: data.message || "Berhasil membuat tagihan", type: "success" });
      setShowGenerateModal(false);
      setFilterMonth(genMonth);
      setFilterYear(genYear);
      fetchInvoices(genMonth, genYear);
    } catch (error: any) {
      setMessage({ text: error.message, type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus tagihan ini?")) return;
    try {
      const res = await fetch(`/api/spp/manage?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAllInvoices(prev => prev.filter(inv => inv.id !== id));
      setMessage({ text: "Tagihan dihapus", type: "success" });
    } catch (error: any) {
      setMessage({ text: error.message, type: "error" });
    }
  };

  const handleManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !manualAmount) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/spp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice_id: selectedInvoice.id, action: "CASH_PAYMENT", amount: parseInt(manualAmount, 10), description: manualDesc }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal memproses pembayaran");
      const newPaid = (selectedInvoice.paid_amount || 0) + parseInt(manualAmount, 10);
      const newStatus = newPaid >= selectedInvoice.amount ? 'PAID' : 'PARTIAL';
      setManualAmount("");
      fetchTransactions(selectedInvoice.id);
      // Update local state instantly (no re-fetch needed)
      setAllInvoices(prev => prev.map(inv => inv.id === selectedInvoice.id ? { ...inv, paid_amount: newPaid, status: newStatus } : inv));
      setSelectedInvoice((prev: any) => ({ ...prev, paid_amount: newPaid, status: newStatus }));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyAction = async (invoiceId: string, action: "APPROVE" | "REJECT") => {
    if (!confirm(`Yakin ingin melakukan ${action} pada tagihan ini?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/spp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice_id: invoiceId, action }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal memproses verifikasi");
      setMessage({ text: `Berhasil melakukan ${action}`, type: "success" });
      fetchTransactions(invoiceId);
      const newStatus = action === 'APPROVE' ? 'PAID' : 'UNPAID';
      const newPaid = action === 'APPROVE' ? selectedInvoice?.amount : 0;
      setAllInvoices(prev => prev.map(inv => inv.id === invoiceId ? { ...inv, status: newStatus, paid_amount: newPaid } : inv));
      setSelectedInvoice((prev: any) => ({ ...prev, status: newStatus, paid_amount: newPaid }));
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Filter & Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" placeholder="Cari Nama / NISN..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-500"
            />
          </div>
          <button 
            onClick={() => setShowGenerateModal(true)}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Generate Massal
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500">Filter:</span>
          </div>
          {/* Month & Year = Server filter */}
          <select value={filterMonth} onChange={(e) => setFilterMonth(Number(e.target.value))} className="border border-slate-200 bg-white rounded-lg text-sm px-3 py-1.5 outline-none focus:border-blue-500">
            {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>Bulan {m}</option>)}
          </select>
          <select value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))} className="border border-slate-200 bg-white rounded-lg text-sm px-3 py-1.5 outline-none focus:border-blue-500">
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {/* Class/Status/Method = Instant client filter */}
          <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="border border-slate-200 bg-white rounded-lg text-sm px-3 py-1.5 outline-none focus:border-blue-500">
            <option value="">Semua Kelas</option>
            <option value="1A">Kelas 1A</option><option value="1B">Kelas 1B</option><option value="2A">Kelas 2A</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border border-slate-200 bg-white rounded-lg text-sm px-3 py-1.5 outline-none focus:border-blue-500">
            <option value="">Semua Status</option>
            <option value="PAID">Lunas</option><option value="PARTIAL">Mencicil</option>
            <option value="UNPAID">Belum Bayar</option><option value="PENDING_VERIFICATION">Menunggu Verifikasi</option>
          </select>
          <select value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)} className="border border-slate-200 bg-white rounded-lg text-sm px-3 py-1.5 outline-none focus:border-blue-500">
            <option value="">Metode (Semua)</option>
            <option value="TRANSFER">Transfer</option><option value="CASH">Tunai (TU)</option>
          </select>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
          {message.text}
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-5 py-4 font-medium text-center w-12">No</th>
                <th className="px-5 py-4 font-medium">NISN</th>
                <th className="px-5 py-4 font-medium">Nama Siswa</th>
                <th className="px-5 py-4 font-medium">Kelas</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium">Tagihan</th>
                <th className="px-5 py-4 font-medium">Sisa Tagihan</th>
                <th className="px-5 py-4 font-medium">Metode</th>
                <th className="px-5 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                // Skeleton rows
                Array.from({length: 5}).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-4 bg-slate-100 rounded w-6 mx-auto" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-100 rounded w-24" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-100 rounded w-36" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-100 rounded w-12" /></td>
                    <td className="px-5 py-4"><div className="h-6 bg-slate-100 rounded-full w-20" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-100 rounded w-24" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-100 rounded w-24" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-100 rounded w-16" /></td>
                    <td className="px-5 py-4"><div className="h-8 bg-slate-100 rounded w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : invoices.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-10 text-slate-400">Tidak ada tagihan ditemukan.</td></tr>
              ) : (
                invoices.map((inv, idx) => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 text-center text-slate-400">{idx + 1}</td>
                    <td className="px-5 py-4 font-medium text-slate-600">{inv.student_number}</td>
                    <td className="px-5 py-4 font-semibold text-slate-800">{inv.student_name}</td>
                    <td className="px-5 py-4 text-slate-600">{inv.student_class}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[inv.status] || "bg-slate-100 text-slate-600"}`}>
                        {STATUS_LABELS[inv.status] || inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-800">Rp {inv.amount.toLocaleString("id-ID")}</td>
                    <td className="px-5 py-4 font-semibold text-red-500">
                      {inv.amount - (inv.paid_amount || 0) > 0 ? `Rp ${(inv.amount - (inv.paid_amount || 0)).toLocaleString("id-ID")}` : '-'}
                    </td>
                    <td className="px-5 py-4">
                      {inv.payment_method ? (
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{inv.payment_method}</span>
                      ) : <span className="text-slate-300">-</span>}
                    </td>
                    <td className="px-5 py-4 text-right space-x-2">
                      <button 
                        onClick={() => { setSelectedInvoice(inv); fetchTransactions(inv.id); }}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors font-medium text-xs inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> Detail
                      </button>
                      <button 
                        onClick={() => handleDelete(inv.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex"
                        title="Hapus Tagihan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Data Siswa Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-slate-800">Detail Pembayaran Siswa</h3>
              <button onClick={() => setSelectedInvoice(null)} className="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100">✕</button>
            </div>
            <div className="overflow-y-auto p-5 sm:p-6 space-y-8 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Info className="w-4 h-4" /> Biodata Siswa</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-slate-200 pb-2"><span className="text-slate-500">Nama</span><span className="font-semibold text-slate-800">{selectedInvoice.student_name}</span></div>
                    <div className="flex justify-between border-b border-slate-200 pb-2"><span className="text-slate-500">NISN</span><span className="font-semibold text-slate-800">{selectedInvoice.student_number}</span></div>
                    <div className="flex justify-between border-b border-slate-200 pb-2"><span className="text-slate-500">Kelas</span><span className="font-semibold text-slate-800">{selectedInvoice.student_class}</span></div>
                    <div className="flex justify-between border-b border-slate-200 pb-2"><span className="text-slate-500">Nama Orang Tua</span><span className="font-semibold text-slate-800">{selectedInvoice.parent_name || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">No. Telepon</span><span className="font-semibold text-slate-800">{selectedInvoice.parent_phone || '-'}</span></div>
                  </div>
                </div>
                <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100">
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Info className="w-4 h-4" /> Detail Tagihan</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-blue-100 pb-2"><span className="text-slate-500">Bulan / Tahun</span><span className="font-semibold text-slate-800">{selectedInvoice.month} / {selectedInvoice.year}</span></div>
                    <div className="flex justify-between border-b border-blue-100 pb-2"><span className="text-slate-500">Status</span><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_COLORS[selectedInvoice.status]}`}>{STATUS_LABELS[selectedInvoice.status] || selectedInvoice.status}</span></div>
                    <div className="flex justify-between border-b border-blue-100 pb-2"><span className="text-slate-500">Total Tagihan</span><span className="font-bold text-slate-800">Rp {selectedInvoice.amount.toLocaleString("id-ID")}</span></div>
                    <div className="flex justify-between border-b border-blue-100 pb-2"><span className="text-slate-500">Sudah Dibayar</span><span className="font-bold text-emerald-600">Rp {(selectedInvoice.paid_amount || 0).toLocaleString("id-ID")}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Kekurangan</span><span className="font-bold text-red-600">Rp {(selectedInvoice.amount - (selectedInvoice.paid_amount || 0)).toLocaleString("id-ID")}</span></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 space-y-4">
                  <h4 className="font-bold text-slate-800 text-base">Riwayat Transaksi Tagihan Ini</h4>
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto max-h-64">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 font-medium">Tanggal</th>
                            <th className="px-4 py-3 font-medium">Metode</th>
                            <th className="px-4 py-3 font-medium">Nominal</th>
                            <th className="px-4 py-3 font-medium">Bukti</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {loadingTx ? (
                            <tr><td colSpan={4} className="text-center py-6 text-slate-400 text-xs">Memuat riwayat...</td></tr>
                          ) : transactions.length === 0 ? (
                            <tr><td colSpan={4} className="text-center py-6 text-slate-400 text-xs">Belum ada transaksi pembayaran.</td></tr>
                          ) : (
                            transactions.map(tx => (
                              <tr key={tx.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 text-slate-600">{new Date(tx.created_at).toLocaleDateString("id-ID")}</td>
                                <td className="px-4 py-3"><span className="bg-slate-100 px-2 py-1 rounded text-xs font-semibold text-slate-600">{tx.payment_method}</span></td>
                                <td className="px-4 py-3 font-semibold text-emerald-600">Rp {tx.amount.toLocaleString("id-ID")}</td>
                                <td className="px-4 py-3">
                                  {tx.proof_url ? (
                                    <a href={tx.proof_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline text-xs font-medium">
                                      <Download className="w-3 h-3" /> Unduh
                                    </a>
                                  ) : <span className="text-slate-400 text-xs">-</span>}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                  {selectedInvoice.status === 'PENDING_VERIFICATION' && (
                    <div className="bg-blue-50 border border-blue-200 p-5 rounded-xl">
                      <h4 className="font-bold text-blue-800 mb-2">Menunggu Verifikasi</h4>
                      <p className="text-xs text-blue-600 mb-4">Orang tua telah mengunggah bukti transfer sebesar <b>Rp {(selectedInvoice.amount).toLocaleString('id-ID')}</b>.</p>
                      <a href={selectedInvoice.bukti_transfer} target="_blank" rel="noreferrer" className="block w-full text-center bg-white border border-blue-200 text-blue-700 py-2 rounded-lg text-sm font-semibold mb-3 hover:bg-blue-100 transition-colors">Lihat Bukti Transfer</a>
                      <div className="flex gap-2">
                        <button onClick={() => handleVerifyAction(selectedInvoice.id, 'REJECT')} disabled={actionLoading} className="flex-1 bg-red-100 text-red-600 hover:bg-red-200 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">Tolak</button>
                        <button onClick={() => handleVerifyAction(selectedInvoice.id, 'APPROVE')} disabled={actionLoading} className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm disabled:opacity-50">Setujui</button>
                      </div>
                    </div>
                  )}
                  {selectedInvoice.status !== 'PAID' && selectedInvoice.status !== 'PENDING_VERIFICATION' && (
                    <form onSubmit={handleManualPayment} className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-4">
                      <h4 className="font-bold text-slate-800 text-sm">Input Pembayaran Manual (TU)</h4>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Nominal Tunai (Rp) <span className="text-red-500">*</span></label>
                        <input
                          type="number" required min="1" max={selectedInvoice.amount - (selectedInvoice.paid_amount || 0)}
                          placeholder={`Maks: Rp ${(selectedInvoice.amount - (selectedInvoice.paid_amount || 0)).toLocaleString('id-ID')}`}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-sm"
                          value={manualAmount}
                          onChange={(e) => setManualAmount(e.target.value)}
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Dapat mengisi sebagian (cicilan) dari sisa tagihan.</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Catatan</label>
                        <textarea rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-sm" value={manualDesc} onChange={(e) => setManualDesc(e.target.value)}></textarea>
                      </div>
                      <button type="submit" disabled={actionLoading} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2 rounded-lg transition-all text-sm disabled:opacity-50">
                        {actionLoading ? "Memproses..." : "Simpan Pembayaran"}
                      </button>
                    </form>
                  )}
                  {selectedInvoice.status === 'PAID' && (
                    <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-xl text-center">
                      <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-50" />
                      <h4 className="font-bold text-emerald-800">Lunas</h4>
                      <p className="text-xs text-emerald-600 mt-1">Tagihan ini sudah diselesaikan.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Generate Tagihan SPP</h3>
              <button onClick={() => setShowGenerateModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleGenerate} className="p-6 space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-700 border border-blue-100">
                Sistem akan membuat tagihan untuk <b>seluruh siswa aktif</b>.
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Judul Tagihan</label>
                <input type="text" required value={genTitle} onChange={e => setGenTitle(e.target.value)} className="w-full border border-slate-200 rounded-xl text-sm px-4 py-2 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nominal (Rp)</label>
                <input type="number" required value={genAmount} onChange={e => setGenAmount(Number(e.target.value))} className="w-full border border-slate-200 rounded-xl text-sm px-4 py-2 outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bulan</label>
                  <select value={genMonth} onChange={e => setGenMonth(Number(e.target.value))} className="w-full border border-slate-200 rounded-xl text-sm px-4 py-2 outline-none focus:border-blue-500">
                    {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tahun</label>
                  <select value={genYear} onChange={e => setGenYear(Number(e.target.value))} className="w-full border border-slate-200 rounded-xl text-sm px-4 py-2 outline-none focus:border-blue-500">
                    {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jatuh Tempo</label>
                <input type="date" required value={genDueDate} onChange={e => setGenDueDate(e.target.value)} className="w-full border border-slate-200 rounded-xl text-sm px-4 py-2 outline-none focus:border-blue-500" />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowGenerateModal(false)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors">Batal</button>
                <button type="submit" disabled={actionLoading} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
                  {actionLoading ? "Memproses..." : "Buat Tagihan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
