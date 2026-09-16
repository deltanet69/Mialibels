'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  AlertTriangle,
  UploadCloud,
  Trash2,
  Loader2,
  X,
} from 'lucide-react';
import { SppInvoice, GeneralInvoice, SavingsData } from './types';
import { ParentAdministrasiMobile } from './ParentAdministrasiMobile';
import { ParentAdministrasiDesktop } from './ParentAdministrasiDesktop';

export * from './types';

export interface ParentAdministrasiClientProps {
  initialSpp?: SppInvoice[];
  initialGeneral?: GeneralInvoice[];
  initialSavings?: SavingsData | null;
}

export function ParentAdministrasiClient({
  initialSpp = [],
  initialGeneral = [],
  initialSavings = null,
}: ParentAdministrasiClientProps) {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'spp' | 'general' | 'savings') || 'spp';
  const [activeTab, setActiveTab] = useState<'spp' | 'general' | 'savings'>(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'spp' || tabParam === 'general' || tabParam === 'savings') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // SPP State
  const [sppInvoices, setSppInvoices] = useState<SppInvoice[]>(initialSpp);
  const [loadingSpp, setLoadingSpp] = useState(false);
  const [selectedSpp, setSelectedSpp] = useState<SppInvoice | null>(null);

  // General Invoices State
  const [generalInvoices, setGeneralInvoices] = useState<GeneralInvoice[]>(initialGeneral);
  const [loadingGeneral, setLoadingGeneral] = useState(false);
  const [selectedGeneral, setSelectedGeneral] = useState<GeneralInvoice | null>(null);

  // Savings State
  const [savingsData, setSavingsData] = useState<SavingsData | null>(initialSavings);
  const [loadingSavings, setLoadingSavings] = useState(false);

  // Shared Upload State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const isSetoran = (type: string) => {
    const t = (type || '').toUpperCase();
    return t === 'SETOR' || t === 'IN' || t === 'DEPOSIT' || t === 'CREDIT';
  };

  // Fetch SPP (used only after mutation/payment upload)
  const fetchSpp = async () => {
    setLoadingSpp(true);
    try {
      const res = await fetch('/api/parent/spp');
      const data = await res.json();
      if (data.data) setSppInvoices(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSpp(false);
    }
  };

  // Fetch General (used only after mutation/payment upload)
  const fetchGeneral = async () => {
    setLoadingGeneral(true);
    try {
      const res = await fetch('/api/parent/general');
      const data = await res.json();
      if (data.data) setGeneralInvoices(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGeneral(false);
    }
  };

  // Fetch Savings (used only after mutation)
  const fetchSavings = async () => {
    setLoadingSavings(true);
    try {
      const res = await fetch('/api/parent/savings');
      const data = await res.json();
      if (data.data) setSavingsData(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSavings(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('Ukuran file maksimal 15MB');
      return;
    }
    setUploadFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setErrorMsg('');
  };

  const handleUploadProof = async (type: 'spp' | 'general') => {
    if (!uploadFile) {
      setErrorMsg('Pilih file bukti transfer terlebih dahulu');
      return;
    }

    setUploading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('type', type);
      if (type === 'spp' && selectedSpp) {
        formData.append('invoiceId', selectedSpp.id);
        if (transferAmount) formData.append('amount', transferAmount);
      } else if (type === 'general' && selectedGeneral) {
        formData.append('invoiceId', selectedGeneral.id);
      }

      const res = await fetch('/api/parent/upload-proof', {
        method: 'POST',
        body: formData,
      });

      const resJson = await res.json();
      if (!res.ok || !resJson.success) {
        throw new Error(resJson.error || 'Gagal mengunggah bukti');
      }

      setSuccessMsg('Bukti transfer berhasil dikirim! Menunggu verifikasi admin.');
      setTimeout(() => {
        setSelectedSpp(null);
        setSelectedGeneral(null);
        setUploadFile(null);
        setPreviewUrl(null);
        if (type === 'spp') fetchSpp();
        else fetchGeneral();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat mengunggah');
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const st = (status || '').toUpperCase();
    if (st === 'PAID') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
          <CheckCircle2 size={11} /> Lunas
        </span>
      );
    }
    if (st === 'PENDING_VERIFICATION') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
          <Clock size={11} /> Verifikasi
        </span>
      );
    }
    if (st === 'PARTIAL') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
          <AlertCircle size={11} /> Cicilan
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
        <AlertTriangle size={11} /> Belum Bayar
      </span>
    );
  };

  // Calculations for summary stats
  const totalSppAmount = sppInvoices.length > 0 ? sppInvoices.reduce((acc, i) => acc + i.amount, 0) : 0;
  const paidSppAmount = sppInvoices.reduce((acc, i) => acc + (i.paid_amount || 0), 0);
  const remainingSpp = totalSppAmount - paidSppAmount;
  const paidSppCount = sppInvoices.filter(i => i.status === 'PAID').length;
  const totalSppCount = sppInvoices.length;

  const totalGeneralAmount = generalInvoices.reduce((acc, i) => acc + i.total_amount, 0);
  const paidGeneralAmount = generalInvoices.reduce((acc, i) => acc + (i.paid_amount || 0), 0);
  const remainingGeneral = totalGeneralAmount - paidGeneralAmount;
  const paidGeneralCount = generalInvoices.filter(i => i.status === 'PAID').length;
  const totalGeneralCount = generalInvoices.length;

  const handleOpenPaySpp = (inv: SppInvoice) => {
    const sisa = inv.amount - (inv.paid_amount || 0);
    setSelectedSpp(inv);
    setTransferAmount(String(sisa > 0 ? sisa : inv.amount));
    setUploadFile(null);
    setPreviewUrl(null);
    setErrorMsg('');
    setSuccessMsg('');
  };

  return (
    <div className="w-full max-w-full">
      {/* 📱 MOBILE FIRST EXPERIENCE (md:hidden) */}
      <div className="md:hidden">
        <ParentAdministrasiMobile
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          sppInvoices={sppInvoices}
          remainingSpp={remainingSpp}
          paidSppAmount={paidSppAmount}
          totalSppAmount={totalSppAmount}
          paidSppCount={paidSppCount}
          totalSppCount={totalSppCount}
          generalInvoices={generalInvoices}
          remainingGeneral={remainingGeneral}
          paidGeneralAmount={paidGeneralAmount}
          totalGeneralAmount={totalGeneralAmount}
          paidGeneralCount={paidGeneralCount}
          totalGeneralCount={totalGeneralCount}
          savingsData={savingsData}
          formatCurrency={formatCurrency}
          formatDateTime={formatDateTime}
          isSetoran={isSetoran}
          getStatusBadge={getStatusBadge}
          onOpenPaySpp={handleOpenPaySpp}
        />
      </div>

      {/* 💻 DESKTOP EXPERIENCE (hidden md:block) */}
      <div className="hidden md:block">
        <ParentAdministrasiDesktop
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          sppInvoices={sppInvoices}
          loadingSpp={loadingSpp}
          fetchSpp={fetchSpp}
          generalInvoices={generalInvoices}
          loadingGeneral={loadingGeneral}
          fetchGeneral={fetchGeneral}
          savingsData={savingsData}
          loadingSavings={loadingSavings}
          fetchSavings={fetchSavings}
          formatCurrency={formatCurrency}
          getStatusBadge={getStatusBadge}
        />
      </div>

      {/* SHARED MODAL: UPLOAD BUKTI TRANSFER */}
      {(selectedSpp || selectedGeneral) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                Unggah Bukti Transfer {selectedSpp ? selectedSpp.title : selectedGeneral?.title}
              </h3>
              <button
                onClick={() => {
                  setSelectedSpp(null);
                  setSelectedGeneral(null);
                  setUploadFile(null);
                  setPreviewUrl(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-medium">
                {successMsg}
              </div>
            )}

            {/* Rekening Tujuan Transfer */}
            <div className="bg-blue-50/80 border border-blue-100 rounded-xl p-3 mb-4 text-xs text-slate-700">
              <p className="font-bold text-blue-900 mb-1">Rekening Tujuan Madrasah:</p>
              <p className="font-mono font-bold text-slate-900">Bank BRI: 0123-01-001234-53-0</p>
              <p className="text-[11px] text-slate-500 mt-0.5">a.n. MI Attaqwa 15 Babelan</p>
            </div>

            {/* Input Nominal Transfer (For SPP) */}
            {selectedSpp && (
              <div className="mb-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">Nominal yang Ditransfer (Rp)</label>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Contoh: 150000"
                />
              </div>
            )}

            {/* Upload Area */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Foto / Screenshot Bukti</label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
              />

              {!previewUrl ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-xl p-6 text-center transition cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <UploadCloud size={28} className="text-slate-400" />
                  <span className="text-xs font-bold text-blue-600">Klik untuk Pilih Foto Bukti</span>
                  <span className="text-[10px] text-slate-400">Format: JPG, PNG, WebP (Maks 15MB)</span>
                </button>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-slate-200">
                  <img src={previewUrl} alt="Preview Bukti" className="w-full max-h-48 object-contain bg-slate-50" />
                  <button
                    type="button"
                    onClick={() => {
                      setUploadFile(null);
                      setPreviewUrl(null);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedSpp(null);
                  setSelectedGeneral(null);
                  setUploadFile(null);
                  setPreviewUrl(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={uploading || !uploadFile}
                onClick={() => handleUploadProof(selectedSpp ? 'spp' : 'general')}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                {uploading && <Loader2 size={14} className="animate-spin" />}
                <span>{uploading ? 'Mengunggah...' : 'Kirim Bukti'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
