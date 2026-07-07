'use client';

import React, { useState, useEffect } from 'react';
import {
  PiggyBank, TrendingUp, TrendingDown, Loader2,
  ArrowUpRight, ArrowDownLeft, RefreshCw
} from 'lucide-react';

type Transaction = {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  description: string | null;
  created_at: string;
};

type SavingsData = {
  balance: number;
  lastUpdated: string | null;
  transactions: Transaction[];
  totalSetoran: number;
  totalPenarikan: number;
};

export default function ParentSavingsPage() {
  const [data, setData] = useState<SavingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSavings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/parent/savings');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal memuat data tabungan');
      setData(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavings();
  }, []);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const isSetoran = (type: string) => {
    const t = (type || '').toUpperCase();
    return t === 'SETOR' || t === 'IN' || t === 'DEPOSIT' || t === 'CREDIT';
  };

  return (
    <div className="space-y-6 w-full pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 rounded-2xl flex items-center justify-center">
            <PiggyBank className="text-purple-600" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">Tabungan Siswa</h1>
            <p className="text-sm text-slate-500">Saldo dan riwayat transaksi tabungan</p>
          </div>
        </div>
        <button
          onClick={fetchSavings}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition text-sm font-medium"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={36} className="animate-spin text-slate-300" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-600 text-sm font-medium">
          {error}
        </div>
      ) : data ? (
        <>
          {/* Balance Card */}
          <div className="bg-gradient-to-r from-blue-500 to-cyan-400 rounded-2xl p-7 text-white relative overflow-hidden shadow-lg border border-blue-400/30">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-12 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl" />
            <div className="relative z-10">
              <p className="text-blue-200 text-sm font-semibold uppercase tracking-wider mb-2">Saldo Tabungan Saat Ini</p>
              <p className="text-4xl md:text-5xl font-black mb-4 tracking-tight">{formatCurrency(data.balance)}</p>
              {data.lastUpdated && (
                <p className="text-blue-300 text-xs">
                  Terakhir diperbarui: {formatDateTime(data.lastUpdated)}
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <ArrowUpRight size={16} className="text-emerald-600" />
                </div>
                <p className="text-sm font-bold text-slate-500">Total Setoran</p>
              </div>
              <p className="text-xl font-black text-emerald-600">{formatCurrency(data.totalSetoran)}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center">
                  <ArrowDownLeft size={16} className="text-red-500" />
                </div>
                <p className="text-sm font-bold text-slate-500">Total Penarikan</p>
              </div>
              <p className="text-xl font-black text-red-500">{formatCurrency(data.totalPenarikan)}</p>
            </div>
          </div>

          {/* Transactions */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Riwayat Transaksi</h3>
              <span className="text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                {data.transactions.length} transaksi
              </span>
            </div>
            {data.transactions.length === 0 ? (
              <div className="py-16 text-center">
                <PiggyBank size={40} className="mx-auto mb-3 text-slate-200" />
                <p className="font-semibold text-slate-500">Belum ada transaksi</p>
                <p className="text-sm text-slate-400 mt-1">Riwayat tabungan akan muncul di sini</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {data.transactions.map(trx => {
                  const setoran = isSetoran(trx.type);
                  return (
                    <div key={trx.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${setoran ? 'bg-emerald-50' : 'bg-red-50'}`}>
                        {setoran
                          ? <TrendingUp size={18} className="text-emerald-600" />
                          : <TrendingDown size={18} className="text-red-500" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate">
                          {trx.description || (setoran ? 'Setoran Tabungan' : 'Penarikan Tabungan')}
                        </p>
                        <p className="text-xs text-slate-400">{formatDateTime(trx.created_at)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-black text-sm ${setoran ? 'text-emerald-600' : 'text-red-500'}`}>
                          {setoran ? '+' : '-'}{formatCurrency(trx.amount)}
                        </p>
                        <p className="text-xs text-slate-400">Saldo: {formatCurrency(trx.balance_after)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
