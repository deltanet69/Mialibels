'use client';

import React, { useState } from 'react';
import { Search, Filter, Receipt, FileText, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

// Helper to format currency
const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export function TransactionsTable({ transactions }: { transactions: any[] }) {
  const [search, setSearch] = useState('');

  // Client-side quick filter
  const filtered = transactions.filter(t => 
    t.invoice_id?.toLowerCase().includes(search.toLowerCase()) ||
    t.admins?.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.students?.name?.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 5); // Show only top 5 recent

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200/80 overflow-hidden flex flex-col h-full">
      <div className="p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <h3 className="font-headline font-bold text-lg text-secondary">Infaq Sekolah &amp; Pembayaran Terkini</h3>
          </div>
          <p className="font-body text-xs sm:text-sm text-slate-500 mt-0.5">Daftar rekonsiliasi transaksi pembayaran terbaru</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari nama / invoice..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-4 py-2 text-xs font-medium bg-slate-50/80 border border-slate-200/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-700 transition"
            />
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto flex-grow">
        <table className="w-full text-left border-collapse min-w-[550px]">
          <thead>
            <tr className="bg-slate-50/70 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
              <th className="p-4 pl-6">Invoice ID</th>
              <th className="p-4">Nama Siswa</th>
              <th className="p-4">Kelas</th>
              <th className="p-4">Keterangan</th>
              <th className="p-4 pr-6 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-slate-400 text-xs">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Receipt size={36} className="text-slate-300 mb-1" />
                    <p className="font-bold text-slate-600">Belum ada transaksi pembayaran.</p>
                    <p className="text-slate-400 text-[11px]">Data transaksi akan otomatis tampil setelah ada pembayaran.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-teal-50 text-teal-700 rounded-lg border border-teal-100 shrink-0 shadow-2xs">
                        <FileText size={13} />
                      </div>
                      <span className="font-headline font-bold text-xs text-slate-800 tracking-wide">
                        {t.invoice_id?.split('-')[0]?.toUpperCase() || '-'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 font-body text-slate-800 text-xs font-semibold">
                    {t.students?.name || '-'}
                  </td>
                  <td className="p-4 text-xs">
                    <span className="bg-teal-50 text-teal-800 border border-teal-100 px-2.5 py-0.5 rounded-full font-bold text-[11px]">
                      {t.students?.class || '-'}
                    </span>
                  </td>
                  <td className="p-4 font-body text-slate-500 text-xs">
                    {t.spp_invoices?.title || (t.spp_invoices?.month ? `Bulan ${t.spp_invoices.month} ${t.spp_invoices.year || ''}` : '-')}
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <Link 
                      href={`/students/${t.student_id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50/80 hover:bg-teal-100 px-3 py-1.5 rounded-xl border border-teal-100 transition-all"
                    >
                      <span>Detail</span>
                      <ArrowRight size={12} />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {filtered.length > 0 && (
        <div className="p-4 border-t border-slate-100 text-center bg-slate-50/50">
          <Link href="/finance/spp" className="btn-tactile text-xs font-bold text-teal-700 hover:text-teal-900 inline-flex items-center justify-center gap-1.5 py-1 px-4 rounded-full transition-all">
            <span>Buka Seluruh Pembukuan Infaq</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      )}
    </div>
  );
}
