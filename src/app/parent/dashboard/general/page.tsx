"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Receipt,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  FileImage,
  Trash2,
  Loader2,
  RefreshCw,
  Clock,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type GeneralInvoice = {
  id: string;
  title: string;
  type: string;
  due_date?: string;
  items: { name: string; amount: number; paid_amount?: number }[];
  total_amount: number;
  paid_amount: number;
  status: string;
  payment_method?: string;
  bukti_transfer?: string;
  note?: string;
  created_at: string;
  updated_at?: string;
};

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  PAID: { label: "Lunas", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
  UNPAID: { label: "Belum Bayar", color: "text-red-700", bg: "bg-red-50 border-red-200", icon: AlertTriangle },
  PARTIAL: { label: "Cicilan", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: AlertCircle },
  PENDING_VERIFICATION: { label: "Menunggu Verifikasi", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: Clock },
};

export default function ParentGeneralFinancePage() {
  const [invoices, setInvoices] = useState<GeneralInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<GeneralInvoice | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'TRANSFER' | 'QRIS'>('TRANSFER');
  const [selectedPaymentItems, setSelectedPaymentItems] = useState<number[]>([]);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/parent/general");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memuat tagihan");
      setInvoices(data.data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(""); // Clear past error
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Hanya format gambar yang diizinkan");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Ukuran file maksimal 5MB");
      return;
    }
    setUploadFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleCancelUpload = () => {
    setUploadFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmitProof = async () => {
    if (!uploadFile || !selectedInvoice) return;
    setUploading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Gagal upload bukti");

      const submitRes = await fetch("/api/parent/general", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_id: selectedInvoice.id,
          bukti_transfer: uploadData.url,
          payment_method: paymentMethod,
          note: selectedPaymentItems.length > 0 
            ? `Pembayaran untuk: ${selectedPaymentItems.map(idx => selectedInvoice.items[idx].name).join(', ')}. Total transfer: Rp ${Number(selectedPaymentItems.reduce((acc, idx) => acc + ((Number(selectedInvoice.items[idx].amount) || 0) - (Number((selectedInvoice.items[idx] as any).paid_amount) || 0)), 0)).toLocaleString('id-ID')}`
            : undefined,
        }),
      });
      const submitData = await submitRes.json();
      if (!submitRes.ok) throw new Error(submitData.error || "Gagal mengirim bukti");

      setSuccessMsg("Bukti transfer berhasil dikirim. Menunggu verifikasi admin.");
      setSelectedInvoice(null);
      setSelectedPaymentItems([]);
      handleCancelUpload();
      fetchInvoices();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setUploading(false);
    }
  };

  const toggleItems = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const totalTagihan = invoices.reduce((s, i) => s + (Number(i.total_amount) || 0), 0);
  const totalLunas = invoices.reduce((s, i) => s + (Number(i.paid_amount) || 0), 0);
  const totalSisa = totalTagihan - totalLunas;

  const formatRp = (n: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(n);

  const calculatedTransferAmount = selectedInvoice ? selectedPaymentItems.reduce((acc, idx) => {
    const item = selectedInvoice.items[idx];
    return acc + ((Number(item.amount) || 0) - (Number((item as any).paid_amount) || 0));
  }, 0) : 0;

  return (
    <div className="space-y-6 w-full pb-16">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-50 rounded-2xl flex items-center justify-center">
          <Receipt className="text-purple-600" size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800">Tagihan Umum</h1>
          <p className="text-sm text-slate-400">Kelola tagihan administrasi, seragam, buku, dll.</p>
        </div>
        <button
          onClick={fetchInvoices}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition text-sm font-medium"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Alert Messages */}
      {errorMsg && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-medium">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" /> {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-sm font-medium">
          <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> {successMsg}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={36} className="animate-spin text-slate-300" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-purple-500 to-violet-500 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <p className="text-purple-200 text-xs font-bold uppercase tracking-wider mb-2">Sisa Tagihan</p>
              <p className="text-2xl font-black">{formatRp(totalSisa)}</p>
              {totalSisa === 0 && invoices.length > 0 && (
                <p className="text-emerald-300 text-xs font-bold mt-2">✓ Semua tagihan lunas!</p>
              )}
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Telah Dibayar</p>
              <p className="text-2xl font-black text-emerald-600">{formatRp(totalLunas)}</p>
              <p className="text-xs text-slate-400 mt-2">
                {invoices.filter((i) => i.status === "PAID").length} tagihan lunas
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Total Tagihan</p>
              <p className="text-2xl font-black text-slate-800">{formatRp(totalTagihan)}</p>
              <p className="text-xs text-slate-400 mt-2">{invoices.length} tagihan total</p>
            </div>
          </div>

          {/* Invoice List */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h2 className="font-bold text-slate-800">Daftar Tagihan Umum</h2>
            </div>
            {invoices.length === 0 ? (
              <div className="py-16 text-center">
                <Receipt size={40} className="mx-auto mb-3 text-slate-200" />
                <p className="font-semibold text-slate-500">Belum ada tagihan umum</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {invoices.map((inv) => {
                  const sisa = (Number(inv.total_amount) || 0) - (Number(inv.paid_amount) || 0);
                  const cfg = STATUS_CONFIG[inv.status] || STATUS_CONFIG.UNPAID;
                  const StatusIcon = cfg.icon;
                  const isExpanded = expandedItems[inv.id];
                  const itemsArray = Array.isArray(inv.items) ? inv.items : [];

                  return (
                    <div key={inv.id} className="p-5 hover:bg-slate-50/60 transition-colors">
                      {/* Top Row: Title + Metrics (Left) and Action Buttons (Right) */}
                      <div className="flex flex-col md:flex-row gap-5 md:items-center justify-between">
                        <div className="flex-1 w-full">
                          <div className="flex items-center gap-2.5 mb-2.5 flex-wrap">
                            <h4 className="font-extrabold text-slate-800 text-base">{inv.title}</h4>
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wide">
                              {inv.type}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${cfg.bg} ${cfg.color}`}>
                              <StatusIcon size={12} /> {cfg.label}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                            <div className="flex flex-col mr-10">
                              <span className="text-xs text-slate-400 font-medium mb-0.5">Total Tagihan</span>
                              <span className="font-bold text-slate-800">{formatRp(inv.total_amount)}</span>
                            </div>
                            <div className="flex flex-col mr-10">
                              <span className="text-xs text-slate-400 font-medium mb-0.5">Telah Dibayar</span>
                              <span className="font-bold text-emerald-600">{formatRp(inv.paid_amount)}</span>
                            </div>
                            <div className="flex flex-col mr-10">
                              <span className="text-xs text-slate-400 font-medium mb-0.5">Sisa Tagihan</span>
                              <span className={`font-bold ${sisa > 0 ? 'text-red-500' : 'text-slate-400'}`}>{formatRp(sisa)}</span>
                            </div>
                            {inv.due_date && (
                              <div className="flex flex-col mr-10">
                                <span className="text-xs text-slate-400 font-medium mb-0.5">Jatuh Tempo</span>
                                <span className="font-semibold text-slate-600">{new Date(inv.due_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons / Status Badges */}
                        <div className="shrink-0 w-full md:w-auto flex justify-end md:justify-center border-t border-slate-100 md:border-0 pt-4 md:pt-0">
                          {inv.status === "PAID" && (
                            <span className="inline-flex items-center justify-center gap-2 text-sm font-bold text-emerald-600 bg-emerald-50 px-6 py-3 rounded-xl border border-emerald-100 w-full md:w-auto">
                              <CheckCircle2 size={18} /> Lunas
                            </span>
                          )}
                          {inv.status === "PENDING_VERIFICATION" && (
                            <span className="inline-flex items-center justify-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 px-6 py-3 rounded-xl border border-blue-100 w-full md:w-auto">
                              <Clock size={24} /> Menunggu Verifikasi
                            </span>
                          )}
                          {["UNPAID", "PARTIAL"].includes(inv.status) && (
                            <button
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setSelectedPaymentItems([]);
                                setPaymentMethod('TRANSFER');
                                setErrorMsg("");
                              }}
                              className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-sm shadow-purple-600/20 hover:shadow-purple-600/40 hover:-translate-y-0.5 active:translate-y-0 w-full md:w-auto"
                            >
                              <UploadCloud size={18} /> Bayar Sekarang
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Info Box: Pembayaran Menunggu Verifikasi */}
                      {inv.status === "PENDING_VERIFICATION" && (
                        <div className="mt-3.5 bg-blue-50/50 border border-blue-100 rounded-xl p-3.5 text-sm text-blue-800 flex items-start gap-3">
                          <Clock className="text-blue-500 shrink-0 mt-0.5" size={16} />
                          <div className="space-y-1">
                            <p className="font-bold text-blue-600">Pembayaran Menunggu Verifikasi</p>
                            {inv.note && (
                              <p className="text-gray-800 font-semibold bg-white/70 px-2.5 py-1.5 rounded-lg border border-blue-100 inline-block mt-1 text-xs">
                                {inv.note.split(' | ').pop()}
                              </p>
                            )}
                            {inv.updated_at && (
                              <p className="text-[11px] text-gray-400 mt-1">
                                Diajukan pada: {new Date(inv.updated_at).toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} pukul {new Date(inv.updated_at).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })} WIB
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Bottom Row: Expandable items detail (Now independent of the top row alignment) */}
                      {itemsArray.length > 0 && (
                        <div className="w-full mt-3">
                          <button
                            onClick={() => toggleItems(inv.id)}
                            className="text-xs text-blue-600 font-bold flex items-center gap-1 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors -ml-2"
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            {isExpanded ? "Sembunyikan" : "Lihat"} rincian ({itemsArray.length} item)
                          </button>
                          
                          {isExpanded && (
                            <div className="mt-3 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden">
                              <table className="w-full text-left text-sm">
                                <thead className="bg-slate-100 text-slate-500 text-xs uppercase font-semibold">
                                  <tr>
                                    <th className="px-4 py-2.5 rounded-tl-xl">Deskripsi Item</th>
                                    <th className="px-4 py-2.5 text-right rounded-tr-xl">Nominal</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {itemsArray.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-white transition-colors">
                                      <td className="px-4 py-3 text-slate-700 font-medium">{item.name}</td>
                                      <td className="px-4 py-3 text-slate-800 font-semibold text-right">{formatRp(Number(item.amount))}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Payment Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <div className="relative bg-gradient-to-r from-purple-500 to-violet-500 p-6 text-white">
              <button
                onClick={() => { setSelectedInvoice(null); handleCancelUpload(); }}
                className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
              >
                <X size={16} />
              </button>
              <h3 className="text-lg font-bold">Pembayaran Tagihan</h3>
              <p className="text-purple-200 text-sm mt-1">{selectedInvoice.title}</p>
            </div>

            <div className="p-6 space-y-5 max-h-[85vh] overflow-y-auto">
              {/* Marketplace-style Items Selection */}
              <div>
                <p className="text-sm font-bold text-slate-700 mb-2">Pilih Item yang Akan Dibayar <span className="text-red-500">*</span></p>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {Array.isArray(selectedInvoice.items) && selectedInvoice.items.map((item, idx) => {
                    const sisaItem = (Number(item.amount) || 0) - (Number(item.paid_amount) || 0);
                    if (sisaItem <= 0) return null; // Already paid
                    return (
                      <label key={idx} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${selectedPaymentItems.includes(idx) ? 'bg-purple-50 border-purple-300' : 'bg-white border-slate-200 hover:border-purple-200'}`}>
                        <div className="pt-0.5">
                          <input 
                            type="checkbox" 
                            checked={selectedPaymentItems.includes(idx)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedPaymentItems(prev => [...prev, idx]);
                              else setSelectedPaymentItems(prev => prev.filter(i => i !== idx));
                            }}
                            className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">Nominal: <span className="font-bold text-slate-700">{formatRp(sisaItem)}</span></p>
                        </div>
                      </label>
                    );
                  })}
                  {selectedInvoice.items.filter(i => (Number(i.amount) - Number(i.paid_amount)) > 0).length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4 bg-slate-50 rounded-xl">Semua rincian item sudah lunas.</p>
                  )}
                </div>
              </div>

              {/* Payment Method Toggle */}
              <div>
                <p className="text-sm font-bold text-slate-700 mb-2">Metode Pembayaran <span className="text-red-500">*</span></p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setPaymentMethod('TRANSFER')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition ${paymentMethod === 'TRANSFER' ? 'bg-purple-600 border-purple-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    Transfer Bank
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('QRIS')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition ${paymentMethod === 'QRIS' ? 'bg-purple-600 border-purple-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    QRIS
                  </button>
                </div>
              </div>

              {/* Payment Info Details */}
              {paymentMethod === 'TRANSFER' ? (
                <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                  <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">Transfer ke Rekening</p>
                  <div className="flex items-center gap-3 mb-1">
                    <p className="font-mono font-black text-xl text-purple-900">BTN 28201500103158</p>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText("28201500103158");
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="text-xs font-bold bg-purple-200 text-purple-800 px-2.5 py-1 rounded-xl hover:bg-purple-300 transition"
                    >
                      {copied ? "Tersalin! ✓" : "Salin"}
                    </button>
                  </div>
                  <p className="text-sm text-slate-600">a.n MI Attaqwa 15</p>
                </div>
              ) : (
                <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 text-center">
                  <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">Scan QRIS</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/qr.jpeg" alt="QRIS" className="w-50 h-72 mx-auto rounded-xl shadow-sm border border-slate-200 mb-2 object-cover bg-white" />
                  <p className="text-sm text-slate-600">a.n MI Attaqwa 15</p>
                </div>
              )}

              {/* Calculated Amount */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
                <span className="text-sm font-bold text-slate-700">Total Harus Dibayar</span>
                <span className="text-lg font-black text-purple-700">{formatRp(calculatedTransferAmount)}</span>
              </div>

              {/* Upload Area */}
              <div>
                <label className="text-sm font-bold text-slate-700 mb-2 block">Bukti Pembayaran <span className="text-red-500">*</span></label>
                {!previewUrl ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center cursor-pointer hover:border-purple-300 hover:bg-purple-50/50 transition-all group"
                  >
                    <UploadCloud className="w-10 h-10 text-slate-300 group-hover:text-purple-400 mx-auto mb-3 transition-colors" />
                    <p className="text-sm font-semibold text-slate-600">Klik untuk upload foto struk</p>
                    <p className="text-xs text-slate-400 mt-1">JPG, PNG — Maks 5MB</p>
                  </div>
                ) : (
                  <div className="relative border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewUrl} alt="Preview" className="w-full h-44 object-contain" />
                    <button
                      onClick={handleCancelUpload}
                      className="absolute top-2 right-2 bg-white text-red-500 p-1.5 rounded-lg shadow hover:bg-red-50 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                    <div className="px-4 py-2 flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-white border-t border-slate-100">
                      <FileImage size={13} /> Gambar siap dikirim
                    </div>
                  </div>
                )}
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
              </div>

              {errorMsg && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{errorMsg}</p>
              )}

              <div className="flex gap-3 pt-1 sticky bottom-0 bg-white pb-2">
                <button
                  onClick={() => { setSelectedInvoice(null); handleCancelUpload(); }}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmitProof}
                  disabled={!uploadFile || uploading || selectedPaymentItems.length === 0}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-purple-600 hover:bg-purple-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading ? <><Loader2 size={15} className="animate-spin" /> Mengirim...</> : "Kirim Bukti"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
