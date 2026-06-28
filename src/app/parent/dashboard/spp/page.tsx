"use client";

import React, { useState, useEffect, useRef } from "react";
import { Wallet, CheckCircle2, AlertCircle, UploadCloud, FileImage, Trash2 } from "lucide-react";

export default function ParentFinancePage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
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

    if (!file.type.startsWith("image/")) {
      alert("Hanya format gambar yang diperbolehkan");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran gambar maksimal 5MB");
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
      // 1. Upload file to /api/upload
      const formData = new FormData();
      formData.append("file", uploadFile);
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      
      if (!uploadRes.ok) throw new Error(uploadData.error || "Gagal mengunggah gambar");
      const fileUrl = uploadData.url;

      // 2. Submit URL to /api/parent/spp
      const submitRes = await fetch("/api/parent/spp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_id: selectedInvoice.id,
          bukti_transfer: fileUrl
        }),
      });
      const submitData = await submitRes.json();
      
      if (!submitRes.ok) throw new Error(submitData.error || "Gagal mengirim bukti transfer");

      setSuccessMsg("Bukti transfer berhasil dikirim. Menunggu verifikasi admin.");
      setSelectedInvoice(null);
      handleCancelUpload();
      fetchInvoices();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-slate-500">Memuat data keuangan...</div>;
  }

  let totalTagihan = 0;
  let totalLunas = 0;
  
  invoices.forEach(inv => {
    totalTagihan += inv.amount;
    totalLunas += (inv.paid_amount || 0);
  });
  
  const totalSisa = totalTagihan - totalLunas;

  const statusColors: any = {
    "PAID": "bg-emerald-100 text-emerald-700",
    "UNPAID": "bg-red-100 text-red-700",
    "PARTIAL": "bg-amber-100 text-amber-700",
    "PENDING_VERIFICATION": "bg-blue-100 text-blue-700",
    "LATE": "bg-red-100 text-red-700 font-bold"
  };

  const statusLabels: any = {
    "PAID": "Lunas",
    "UNPAID": "Belum Bayar",
    "PARTIAL": "Mencicil",
    "PENDING_VERIFICATION": "Menunggu Verifikasi",
    "LATE": "Terlambat"
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Keuangan & SPP</h2>
        <p className="text-slate-500 text-sm">Pantau tagihan dan riwayat pembayaran administrasi sekolah.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-[#002957] to-blue-900 rounded-3xl p-6 text-white shadow-sm flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-sm font-medium mb-1">Total Sisa Tagihan</p>
            <h3 className="text-3xl font-bold">Rp {totalSisa.toLocaleString("id-ID")}</h3>
          </div>
          <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
            <AlertCircle className="text-white" />
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">Total Telah Dibayar (Lunas & Cicilan)</p>
            <h3 className="text-3xl font-bold text-emerald-600">Rp {totalLunas.toLocaleString("id-ID")}</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center">
            <CheckCircle2 className="text-emerald-500" />
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-sm font-medium">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl border border-emerald-200 text-sm font-medium">
          {successMsg}
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">Daftar Tagihan SPP</h3>
        </div>
        
        <div className="divide-y divide-slate-100">
          {invoices.length === 0 ? (
            <div className="p-8 text-center text-slate-400">Belum ada data tagihan.</div>
          ) : (
            invoices.map(inv => {
              const sisa = inv.amount - (inv.paid_amount || 0);
              return (
                <div key={inv.id} className="p-6 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center hover:bg-slate-50 transition-colors">
                  <div>
                    <h4 className="font-bold text-slate-800 text-lg mb-1">{inv.title} - Bulan {inv.month}/{inv.year}</h4>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <span className={`px-2.5 py-1 rounded-md font-semibold text-xs ${statusColors[inv.status]}`}>
                        {statusLabels[inv.status] || inv.status}
                      </span>
                      <span className="text-slate-500 font-medium">Total: Rp {inv.amount.toLocaleString("id-ID")}</span>
                      {inv.paid_amount > 0 && <span className="text-emerald-600 font-medium">Dibayar: Rp {inv.paid_amount.toLocaleString("id-ID")}</span>}
                      {sisa > 0 && <span className="text-red-500 font-bold">Kekurangan: Rp {sisa.toLocaleString("id-ID")}</span>}
                    </div>
                  </div>
                  
                  <div className="w-full md:w-auto flex flex-col gap-2 shrink-0">
                    {inv.status === 'PENDING_VERIFICATION' && (
                      <span className="text-sm font-medium text-blue-600 bg-blue-50 px-4 py-2 rounded-xl text-center border border-blue-100">
                        Dalam Proses Verifikasi
                      </span>
                    )}
                    {(inv.status === 'UNPAID' || inv.status === 'PARTIAL' || inv.status === 'LATE') && (
                      <button 
                        onClick={() => setSelectedInvoice(inv)}
                        className="bg-[#002957] hover:bg-blue-900 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm w-full md:w-auto"
                      >
                        Bayar Sekarang
                      </button>
                    )}
                    {inv.status === 'PAID' && (
                      <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl flex items-center justify-center gap-2 border border-emerald-100">
                        <CheckCircle2 className="w-4 h-4" /> Lunas
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Upload Bukti Transfer Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Pembayaran Tagihan</h3>
              <button onClick={() => { setSelectedInvoice(null); handleCancelUpload(); }} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm">
                <p className="text-blue-800 mb-1">Silakan transfer sebesar <b>Rp {(selectedInvoice.amount - (selectedInvoice.paid_amount || 0)).toLocaleString("id-ID")}</b> ke rekening berikut:</p>
                <div className="font-mono font-bold text-lg text-[#002957] my-2">BSI 7123456789</div>
                <p className="text-blue-600">a.n MI AL IBROHIMY</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-3">Upload Bukti Transfer</h4>
                
                {!previewUrl ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center cursor-pointer hover:bg-slate-50 transition-colors group"
                  >
                    <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-3 group-hover:text-blue-500 transition-colors" />
                    <p className="text-sm font-medium text-slate-700">Klik untuk memilih gambar struk/screenshot</p>
                    <p className="text-xs text-slate-400 mt-1">Maks. 5MB (JPG/PNG)</p>
                  </div>
                ) : (
                  <div className="relative border border-slate-200 rounded-2xl p-2 bg-slate-50">
                    <img src={previewUrl} alt="Preview Bukti Transfer" className="w-full h-48 object-contain rounded-xl" />
                    <button 
                      onClick={handleCancelUpload}
                      className="absolute top-4 right-4 bg-white text-red-500 p-2 rounded-full shadow-md hover:bg-red-50 transition-colors"
                      title="Hapus foto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="mt-3 px-2 pb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                      <FileImage className="w-4 h-4 text-emerald-500" /> Gambar siap dikirim
                    </div>
                  </div>
                )}
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileSelect}
                  accept="image/jpeg, image/png, image/webp" 
                  className="hidden" 
                />
              </div>
              
              <div className="pt-2 flex gap-3">
                <button 
                  onClick={() => { setSelectedInvoice(null); handleCancelUpload(); }} 
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={handleSubmitProof}
                  disabled={!uploadFile || uploading}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {uploading ? "Mengirim..." : "Kirim Bukti Pembayaran"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
