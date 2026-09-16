'use client';

import React from 'react';
import Link from 'next/link';
import { Award, XCircle, FileCheck2, Sparkles } from 'lucide-react';
import { StudentInfo, DashboardData } from './types';

interface ExamRequirementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentInfo;
  data: DashboardData;
}

export function ExamRequirementsModal({
  isOpen,
  onClose,
  student,
  data,
}: ExamRequirementsModalProps) {
  if (!isOpen) return null;

  const isFullday = (student.className || '').match(/A$/i);
  const isClass6 = (student.className || '').startsWith('6');

  const isExempt = (w?: string | null) => {
    if (!w) return false;
    const val = String(w).toLowerCase().trim();
    return val === 'anak_yatim' || val === 'keluarga guru' || val.includes('yatim') || val.includes('guru') || val.includes('yayasan');
  };
  const exemptInfaqAndBuku = isExempt(student.feeWaiverType);

  const targetMonths = ['Juli', 'Agustus', 'September', '7', '8', '9', 7, 8, 9];
  const unpaidSeptemberSpp = (data.allSppInvoices || []).find(inv => {
    const isTarget = targetMonths.includes(String(inv.month));
    const isPaid = inv.status === 'PAID';
    return isTarget && !isPaid;
  });
  const sppOk = exemptInfaqAndBuku || !unpaidSeptemberSpp;

  const getGeneralPaid = (key: string) => {
    return (data.generalInvoices || [])
      .flatMap((inv: any) => inv.items || [])
      .filter((item: any) => (item.name || '').toLowerCase().includes(key.toLowerCase()))
      .reduce((sum: number, item: any) => sum + (Number(item.paid_amount) || 0), 0);
  };

  const paidBuku = getGeneralPaid('buku');
  const paidUlum = getGeneralPaid('ulangan');
  const paidAkhirTahun = getGeneralPaid('akhir tahun');

  const minBuku = isFullday ? 700000 : 300000;
  const minUlum = 110000;
  const minAkhirTahun = 600000;

  const bukuOk = exemptInfaqAndBuku || paidBuku >= minBuku;
  const ulumOk = paidUlum >= minUlum;
  const akhirTahunOk = !isClass6 || paidAkhirTahun >= minAkhirTahun;

  const isEligible = sppOk && bukuOk && ulumOk && akhirTahunOk;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
              <Award size={18} />
            </div>
            <div>
              <h3 className="font-headline font-black text-base text-slate-800">
                Syarat Unduh Kartu Ujian
              </h3>
              <p className="text-[13px] text-slate-500 font-medium">
                Ananda <strong className="text-slate-700">{student.name}</strong> · Kelas <strong className="text-blue-700">{student.className} ({isFullday ? 'Full Day' : 'Reguler'})</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 transition cursor-pointer"
            aria-label="Tutup Modal"
          >
            <XCircle size={22} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto text-xs leading-relaxed text-slate-600">
          {/* 1. Status Kelayakan Terkini Banner */}
          <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
            isEligible 
              ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900' 
              : 'bg-rose-50/90 border-rose-200 text-rose-900'
          }`}>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-black text-sm uppercase tracking-wide">
                  {isEligible ? 'Syarat Terpenuhi' : 'Belum Memenuhi Syarat'}
                </span>
                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                  isEligible ? 'bg-emerald-200/80 text-emerald-800' : 'bg-rose-200/80 text-rose-800'
                }`}>
                  {isEligible ? 'Siap Unduh' : 'Terkunci'}
                </span>
              </div>
              <p className="text-xs mt-1 leading-snug">
                {isEligible 
                  ? 'Alhamdulillah, seluruh syarat administrasi untuk mengunduh Kartu Ujian telah terpenuhi.' 
                  : 'Mohon lengkapi kekurangan administrasi berikut agar akses unduh Kartu Ujian terbuka.'}
              </p>
            </div>
          </div>

          {/* 2. Checklist Rincian Status Siswa */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="font-headline font-black text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck2 size={14} className="text-blue-600" />
                <span>Checklist Administrasi Siswa</span>
              </h4>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                {isFullday ? 'Kelas Full Day' : 'Kelas Reguler'}
              </span>
            </div>

            <div className="space-y-2.5">
              {/* 1. PPDB / SPMB */}
              <div className="p-3 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-white text-[10px] font-bold bg-emerald-500">
                    ✓
                  </span>
                  <div>
                    <p className="font-bold text-slate-800">1. Keuangan PPDB/SPMB & Tunggakan Lalu</p>
                    <p className="text-[11px] text-emerald-600 font-medium">Telah Lunas / Bebas Tunggakan</p>
                  </div>
                </div>
              </div>

              {/* 2. SPP September */}
              <div className="p-3 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-white text-[10px] font-bold ${sppOk ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                    {sppOk ? '✓' : '✗'}
                  </span>
                  <div>
                    <p className="font-bold text-slate-800">2. Infaq / SPP s/d September 2026</p>
                    <p className="text-[11px] text-slate-500">
                      {exemptInfaqAndBuku ? (
                        <span className="text-emerald-600 font-semibold">Telah Lunas / Kompensasi ({student.feeWaiverType})</span>
                      ) : sppOk ? (
                        <span className="text-emerald-600 font-semibold">Telah Lunas s/d September 2026</span>
                      ) : (
                        'Ada tagihan Infaq belum lunas'
                      )}
                    </p>
                  </div>
                </div>
                {!sppOk && (
                  <Link 
                    href="/parent/dashboard/spp" 
                    onClick={onClose}
                    className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-[11px] rounded-lg transition shrink-0"
                  >
                    Bayar SPP &rarr;
                  </Link>
                )}
              </div>

              {/* 3. Buku/LKS */}
              <div className="p-3 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-white text-[10px] font-bold ${bukuOk ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                    {bukuOk ? '✓' : '✗'}
                  </span>
                  <div>
                    <p className="font-bold text-slate-800">3. Uang Buku Paket / LKS</p>
                    <p className="text-[11px] text-slate-500">
                      {exemptInfaqAndBuku ? (
                        <span className="text-emerald-600 font-semibold">Bebas Biaya / Kompensasi ({student.feeWaiverType})</span>
                      ) : (
                        <>
                          Min: <strong>Rp {minBuku.toLocaleString('id-ID')}</strong> · Terbayar: <strong className={bukuOk ? 'text-emerald-600' : 'text-slate-700'}>Rp {paidBuku.toLocaleString('id-ID')}</strong>
                          {!bukuOk && <span className="text-rose-600 font-bold"> (Kurang Rp {(minBuku - paidBuku).toLocaleString('id-ID')})</span>}
                        </>
                      )}
                    </p>
                  </div>
                </div>
                {!bukuOk && (
                  <Link 
                    href="/parent/dashboard/general" 
                    onClick={onClose}
                    className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-[11px] rounded-lg transition shrink-0"
                  >
                    Rincian &rarr;
                  </Link>
                )}
              </div>

              {/* 4. ULUM */}
              <div className="p-3 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-white text-[10px] font-bold ${ulumOk ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                    {ulumOk ? '✓' : '✗'}
                  </span>
                  <div>
                    <p className="font-bold text-slate-800">4. Uang Ulangan Umum (ULUM)</p>
                    <p className="text-[11px] text-slate-500">
                      Min: <strong>Rp {minUlum.toLocaleString('id-ID')}</strong> · Terbayar: <strong className={ulumOk ? 'text-emerald-600' : 'text-slate-700'}>Rp {paidUlum.toLocaleString('id-ID')}</strong>
                      {!ulumOk && <span className="text-rose-600 font-bold"> (Kurang Rp {(minUlum - paidUlum).toLocaleString('id-ID')})</span>}
                    </p>
                  </div>
                </div>
                {!ulumOk && (
                  <Link 
                    href="/parent/dashboard/general" 
                    onClick={onClose}
                    className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-[11px] rounded-lg transition shrink-0"
                  >
                    Rincian &rarr;
                  </Link>
                )}
              </div>

              {/* 5. Khusus Kelas 6 */}
              {isClass6 && (
                <div className="p-3 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-white text-[10px] font-bold ${akhirTahunOk ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                      {akhirTahunOk ? '✓' : '✗'}
                    </span>
                    <div>
                      <p className="font-bold text-slate-800">5. Uang Kegiatan Akhir Tahun (Khusus Kelas 6)</p>
                      <p className="text-[11px] text-slate-500">
                        Min: <strong>Rp {minAkhirTahun.toLocaleString('id-ID')}</strong> · Terbayar: <strong className={akhirTahunOk ? 'text-emerald-600' : 'text-slate-700'}>Rp {paidAkhirTahun.toLocaleString('id-ID')}</strong>
                        {!akhirTahunOk && <span className="text-rose-600 font-bold"> (Kurang Rp {(minAkhirTahun - paidAkhirTahun).toLocaleString('id-ID')})</span>}
                      </p>
                    </div>
                  </div>
                  {!akhirTahunOk && (
                    <Link 
                      href="/parent/dashboard/general" 
                      onClick={onClose}
                      className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-[11px] rounded-lg transition shrink-0"
                    >
                      Rincian &rarr;
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <button
            onClick={() => {
              onClose();
              setTimeout(() => window.dispatchEvent(new Event('start-parent-tour')), 300);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition cursor-pointer"
          >
            <Sparkles size={14} />
            <span>Ulangi Tour Panduan</span>
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 transition cursor-pointer shadow-sm text-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
