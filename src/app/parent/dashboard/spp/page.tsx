"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  CreditCard, CheckCircle2, AlertCircle, UploadCloud, 
  FileImage, Trash2, Loader2, RefreshCw, Clock, AlertTriangle, X
} from "lucide-react";

type Invoice = {
  id: string;
  title: string;
  month: number;
  year: number;
  amount: number;
  paid_amount: number;
  discount_amount?: number;
  late_fee?: number;
  status: string;
  due_date?: string;
  bukti_transfer?: string;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  PAID:                  { label: 'Lunas',                 color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200',  icon: CheckCircle2 },
  UNPAID:               { label: 'Belum Bayar',           color: 'text-red-700',     bg: 'bg-red-50 border-red-200',          icon: AlertTriangle },
  PARTIAL:              { label: 'Cicilan',               color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',      icon: AlertCircle },
  PENDING_VERIFICATION: { label: 'Menunggu Verifikasi',   color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',        icon: Clock },
  LATE:                 { label: 'Terlambat',             color: 'text-red-800',     bg: 'bg-red-100 border-red-300',         icon: AlertTriangle },
};

const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];

export default function ParentFinancePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [transferAmount, setTransferAmount] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchInvoices(); }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/parent/spp");
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
    if (!file.type.startsWith("image/")) { alert("Hanya format gambar"); return; }
    if (file.size > 5 * 1024 * 1024) { alert("Maks 5MB"); return; }
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
    setErrorMsg(""); setSuccessMsg("");
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Gagal upload");

      const submitRes = await fetch("/api/parent/spp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_id: selectedInvoice.id,
          bukti_transfer: uploadData.url,
          note: transferAmount ? `Telah transfer sejumlah Rp ${Number(transferAmount).toLocaleString('id-ID')}` : undefined
        }),
      });
      const submitData = await submitRes.json();
      if (!submitRes.ok) throw new Error(submitData.error || "Gagal mengirim");

      setSuccessMsg("Bukti transfer berhasil diunggah. Menunggu verifikasi admin.");
      setSelectedInvoice(null);
      setTransferAmount("");
      handleCancelUpload();
      fetchInvoices();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setUploading(false);
    }
  };

  const totalTagihan = invoices.reduce((s, i) => s + i.amount, 0);
  const totalLunas = invoices.reduce((s, i) => s + (i.paid_amount || 0), 0);
  const totalSisa = totalTagihan - totalLunas;
  const lunasSemua = invoices.every(i => i.status === 'PAID');

  const formatRp = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6 w-full pb-16">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center">
          <CreditCard className="text-amber-600" size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-800">Tagihan SPP</h1>
          <p className="text-sm text-slate-400">Pantau status dan riwayat pembayaran SPP</p>
        </div>
        <button
          onClick={fetchInvoices}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition text-sm font-medium"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
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
        <div className="bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg border border-blue-400/30">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-2">Sisa Tagihan</p>
              <p className="text-2xl font-black">{formatRp(totalSisa)}</p>
              {lunasSemua && <p className="text-emerald-300 text-xs font-bold mt-2">✓ Semua tagihan lunas!</p>}
            </div>
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Telah Dibayar</p>
              <p className="text-2xl font-black text-emerald-600">{formatRp(totalLunas)}</p>
              <p className="text-xs text-slate-400 mt-2">{invoices.filter(i => i.status === 'PAID').length} tagihan lunas</p>
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
              <h2 className="font-bold text-slate-800">Daftar Tagihan SPP</h2>
            </div>
            {invoices.length === 0 ? (
              <div className="py-16 text-center">
                <CreditCard size={40} className="mx-auto mb-3 text-slate-200" />
                <p className="font-semibold text-slate-500">Belum ada tagihan SPP</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {invoices.map(inv => {
                  const sisa = inv.amount - (inv.paid_amount || 0);
                  const cfg = STATUS_CONFIG[inv.status] || STATUS_CONFIG.UNPAID;
                  const StatusIcon = cfg.icon;
                  return (
                    <div key={inv.id} className="p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center hover:bg-slate-50/60 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h4 className="font-bold text-slate-800">{inv.title}</h4>
                          <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            {MONTHS[inv.month - 1]} {inv.year}
                          </span>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.color}`}>
                            <StatusIcon size={11} /> {cfg.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm">
                          <span className="text-slate-500">Total: <strong className="text-slate-700">{formatRp(inv.amount)}</strong></span>
                          {inv.paid_amount > 0 && (
                            <span className="text-emerald-600">Dibayar: <strong>{formatRp(inv.paid_amount)}</strong></span>
                          )}
                          {sisa > 0 && (
                            <span className="text-red-500">Sisa: <strong>{formatRp(sisa)}</strong></span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        {inv.status === 'PAID' && (
                          <span className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                            <CheckCircle2 size={15} /> Lunas
                          </span>
                        )}
                        {inv.status === 'PENDING_VERIFICATION' && (
                          <span className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
                            <Clock size={15} /> Dalam Verifikasi
                          </span>
                        )}
                        {['UNPAID','PARTIAL','LATE'].includes(inv.status) && (
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
                          >
                            <UploadCloud size={15} /> Bayar Sekarang
                          </button>
                        )}
                      </div>
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
            {/* Modal Header */}
            <div className="relative bg-gradient-to-r from-blue-500 to-cyan-400 p-6 text-white">
              <button
                onClick={() => { setSelectedInvoice(null); handleCancelUpload(); }}
                className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
              >
                <X size={16} />
              </button>
              <h3 className="text-lg font-bold">Pembayaran Tagihan</h3>
              <p className="text-blue-200 text-sm mt-1">{selectedInvoice.title} — {MONTHS[selectedInvoice.month - 1]} {selectedInvoice.year}</p>
            </div>

            <div className="p-6 space-y-5">
              {/* Transfer Info */}
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Transfer ke Rekening</p>
                <div className="flex items-center gap-3 mb-1">
                  <p className="font-mono font-black text-xl text-blue-900">BTN 28201500103158</p>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText("28201500103158");
                      alert("Nomor rekening disalin!");
                    }}
                    className="text-xs font-bold bg-blue-200 text-blue-800 px-2 py-1 rounded hover:bg-blue-300 transition"
                  >
                    Salin
                  </button>
                </div>
                <p className="text-sm text-slate-600">a.n MI Attaqwa 15</p>
                <div className="mt-4 pt-3 border-t border-blue-100 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 font-medium">Total Tagihan SPP</span>
                    <span className="text-sm font-bold text-slate-700">
                      {formatRp(selectedInvoice.amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 font-medium">Sudah Dibayar</span>
                    <span className="text-sm font-bold text-emerald-600">
                      {formatRp(selectedInvoice.paid_amount || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1.5 border-t border-blue-100/50 mt-1.5">
                    <span className="text-sm font-bold text-slate-800">Sisa yang Harus Dibayar</span>
                    <span className="font-black text-slate-900 text-base">
                      {formatRp(selectedInvoice.amount - (selectedInvoice.paid_amount || 0))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Input Nominal */}
              <div>
                <label className="text-sm font-bold text-slate-700 mb-2 block">Nominal yang Ditransfer <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-slate-500 font-medium text-sm">Rp</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="Contoh: 150000"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition text-sm font-medium"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1.5">Masukkan nominal asli yang telah Anda transfer.</p>
              </div>

              {/* Upload Area */}
              <div>
                <label className="text-sm font-bold text-slate-700 mb-2 block">Bukti Transfer</label>
                {!previewUrl ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
                  >
                    <UploadCloud className="w-10 h-10 text-slate-300 group-hover:text-blue-400 mx-auto mb-3 transition-colors" />
                    <p className="text-sm font-semibold text-slate-600">Klik untuk upload gambar struk</p>
                    <p className="text-xs text-slate-400 mt-1">JPG, PNG — Maks 5MB</p>
                  </div>
                ) : (
                  <div className="relative border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
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

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => { setSelectedInvoice(null); handleCancelUpload(); }}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmitProof}
                  disabled={!uploadFile || uploading || !transferAmount}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading ? <><Loader2 size={15} className="animate-spin" /> Mengirim...</> : 'Kirim Bukti'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
