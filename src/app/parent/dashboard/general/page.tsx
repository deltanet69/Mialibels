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
  items: { name: string; amount: number }[];
  total_amount: number;
  paid_amount: number;
  status: string;
  payment_method?: string;
  bukti_transfer?: string;
  note?: string;
  created_at: string;
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
  const [transferAmount, setTransferAmount] = useState("");
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
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
    if (!file.type.startsWith("image/")) {
      alert("Hanya format gambar yang diizinkan");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran file maksimal 5MB");
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
          note: transferAmount ? `Telah transfer sejumlah Rp ${Number(transferAmount).toLocaleString('id-ID')}` : undefined,
        }),
      });
      const submitData = await submitRes.json();
      if (!submitRes.ok) throw new Error(submitData.error || "Gagal mengirim bukti");

      setSuccessMsg("Bukti transfer berhasil dikirim. Menunggu verifikasi admin.");
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
                      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h4 className="font-bold text-slate-800">{inv.title}</h4>
                            <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                              {inv.type}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.color}`}>
                              <StatusIcon size={11} /> {cfg.label}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm mb-3">
                            <span className="text-slate-500">
                              Total: <strong className="text-slate-700">{formatRp(inv.total_amount)}</strong>
                            </span>
                            {Number(inv.paid_amount) > 0 && (
                              <span className="text-emerald-600">
                                Dibayar: <strong>{formatRp(inv.paid_amount)}</strong>
                              </span>
                            )}
                            {sisa > 0 && (
                              <span className="text-red-500">
                                Sisa: <strong>{formatRp(sisa)}</strong>
                              </span>
                            )}
                            {inv.due_date && (
                              <span className="text-slate-400">
                                Jatuh Tempo: {new Date(inv.due_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                              </span>
                            )}
                          </div>

                          {/* Expandable items detail */}
                          {itemsArray.length > 0 && (
                            <div>
                              <button
                                onClick={() => toggleItems(inv.id)}
                                className="text-xs text-blue-600 font-medium flex items-center gap-1 hover:underline"
                              >
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                {isExpanded ? "Sembunyikan" : "Lihat"} rincian ({itemsArray.length} item)
                              </button>
                              {isExpanded && (
                                <div className="mt-2 pl-2 border-l-2 border-slate-100 space-y-1">
                                  {itemsArray.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm text-slate-600">
                                      <span>{item.name}</span>
                                      <span className="font-medium">{formatRp(Number(item.amount))}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="shrink-0">
                          {inv.status === "PAID" && (
                            <span className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                              <CheckCircle2 size={15} /> Lunas
                            </span>
                          )}
                          {inv.status === "PENDING_VERIFICATION" && (
                            <span className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
                              <Clock size={15} /> Dalam Verifikasi
                            </span>
                          )}
                          {["UNPAID", "PARTIAL"].includes(inv.status) && (
                            <button
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setErrorMsg("");
                              }}
                              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
                            >
                              <UploadCloud size={15} /> Bayar Sekarang
                            </button>
                          )}
                        </div>
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

            <div className="p-6 space-y-5">
              {/* Items Summary */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Rincian Tagihan</p>
                {Array.isArray(selectedInvoice.items) && selectedInvoice.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm text-slate-600 py-1 border-b border-slate-100 last:border-0">
                    <span>{item.name}</span>
                    <span className="font-medium">{formatRp(Number(item.amount))}</span>
                  </div>
                ))}
                <div className="mt-3 pt-3 border-t border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 font-medium">Total Tagihan</span>
                    <span className="text-sm font-bold text-slate-700">
                      {formatRp(Number(selectedInvoice.total_amount) || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500 font-medium">Sudah Dibayar</span>
                    <span className="text-sm font-bold text-emerald-600">
                      {formatRp(Number(selectedInvoice.paid_amount) || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 mt-1.5">
                    <span className="text-sm font-bold text-slate-800">Sisa yang Harus Dibayar</span>
                    <span className="font-black text-slate-900 text-base">
                      {formatRp(
                        (Number(selectedInvoice.total_amount) || 0) -
                        (Number(selectedInvoice.paid_amount) || 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Transfer Info */}
              <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">Transfer ke Rekening</p>
                <div className="flex items-center gap-3 mb-1">
                  <p className="font-mono font-black text-xl text-purple-900">BSI 7123456789</p>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText("7123456789");
                      alert("Nomor rekening disalin!");
                    }}
                    className="text-xs font-bold bg-purple-200 text-purple-800 px-2 py-1 rounded hover:bg-purple-300 transition"
                  >
                    Salin
                  </button>
                </div>
                <p className="text-sm text-slate-600">a.n MI Attaqwa 15</p>
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
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition text-sm font-medium"
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
