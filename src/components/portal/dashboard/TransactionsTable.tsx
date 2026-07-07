'use client';

import React, { useState } from 'react';
import { Search, Filter, Receipt, FileText, ArrowRight } from 'lucide-react';
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
    t.admins?.name?.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 5); // Show only top 5 recent

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
      <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-50">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Transaksi SPP Terbaru</h3>
          <p className="text-sm text-slate-500">Daftar pembayaran terakhir</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari invoice..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-600 transition"
            />
          </div>
          <button className="p-2 text-slate-400 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition" title="Filter">
            <Filter size={18} />
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto flex-grow">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead>
            <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
              <th className="font-semibold p-4">Invoice ID</th>
              <th className="font-semibold p-4">Tanggal</th>
              <th className="font-semibold p-4">Nominal</th>
              <th className="font-semibold p-4">Admin</th>
              <th className="font-semibold p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-slate-500 text-sm">
                  <div className="flex flex-col items-center justify-center">
                    <Receipt size={32} className="text-slate-300 mb-2" />
                    Belum ada transaksi pembayaran.
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition group">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                        <FileText size={14} />
                      </div>
                      <span className="text-sm font-semibold text-slate-700">{t.invoice_id}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-500 text-sm">
                    {new Date(t.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </td>
                  <td className="p-4">
                    <span className="text-sm font-bold text-slate-800 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                      {formatRupiah(t.amount || 0)}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600 text-sm">
                    {t.admins?.name || '-'}
                  </td>
                  <td className="p-4 text-right">
                    <Link 
                      href={`/finance/spp/transactions?id=${t.id}`}
                      className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition opacity-0 group-hover:opacity-100"
                    >
                      Detail <ArrowRight size={14} className="ml-1" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {filtered.length > 0 && (
        <div className="p-4 border-t border-slate-50 text-center">
          <Link href="/finance/spp" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition flex items-center justify-center gap-1">
            Lihat Semua Transaksi
          </Link>
        </div>
      )}
    </div>
  );
}
