'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Search, Wallet, ArrowDownToLine, ArrowUpFromLine, RefreshCw, ChevronRight, Filter } from 'lucide-react';
import { TransactionModal } from '@/components/finance/TransactionModal';

function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-slate-50">
      <td className="p-4">
        <div className="h-4 bg-slate-100 rounded w-36 mb-1.5" />
        <div className="h-3 bg-slate-100 rounded w-20" />
      </td>
      <td className="p-4"><div className="h-6 bg-slate-100 rounded-lg w-14" /></td>
      <td className="p-4 text-right"><div className="h-4 bg-slate-100 rounded w-24 ml-auto" /></td>
      <td className="p-4 text-right"><div className="h-5 bg-slate-100 rounded w-28 ml-auto" /></td>
      <td className="p-4"><div className="h-8 bg-slate-100 rounded-lg w-24 mx-auto" /></td>
    </tr>
  );
}

export default function SavingsPage() {
  // Raw data from server — fetched once
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [summary, setSummary] = useState({ totalBalance: 0, totalDeposit: 0, totalWithdrawal: 0 });
  
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  
  // Client-side filters (instant, 0ms)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'balance_desc' | 'balance_asc' | 'today'>('name');
  
  // Summary period filters (these DO require API call)
  const [depositPeriod, setDepositPeriod] = useState('month');
  const [withdrawalPeriod, setWithdrawalPeriod] = useState('month');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<{id: string, name: string} | null>(null);

  // Fetch ALL savings data once (no search/class params)
  const fetchSavings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/savings');
      const data = await res.json();
      if (data.success) {
        setAllStudents(data.data);
      }
    } catch (err) {
      console.error('Error fetching savings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async (depPeriod: string, witPeriod: string) => {
    setSummaryLoading(true);
    try {
      const res = await fetch(`/api/savings/summary?depositPeriod=${depPeriod}&withdrawalPeriod=${witPeriod}`);
      const data = await res.json();
      if (data.success) {
        setSummary({
          totalBalance: data.data.totalBalance,
          totalDeposit: data.data.totalDeposit,
          totalWithdrawal: data.data.totalWithdrawal
        });
      }
    } catch (err) {
      console.error('Error fetching summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSavings();
    fetchSummary(depositPeriod, withdrawalPeriod);
  }, [fetchSavings]);

  // Re-fetch summary only when period changes
  useEffect(() => {
    fetchSummary(depositPeriod, withdrawalPeriod);
  }, [depositPeriod, withdrawalPeriod]);

  // Get unique class list from data (no extra API needed)
  const classList = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    allStudents.forEach(s => {
      if (s.className && !seen.has(s.className)) {
        seen.add(s.className);
        result.push(s.className);
      }
    });
    return result.sort();
  }, [allStudents]);

  // Instant client-side filter + sort — no API call
  const students = useMemo(() => {
    let result = allStudents;

    if (selectedClass) {
      result = result.filter(s => s.className === selectedClass);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.studentNumber?.toLowerCase().includes(q)
      );
    }

    // Sorting
    return [...result].sort((a, b) => {
      if (sortBy === 'balance_desc') return (b.balance || 0) - (a.balance || 0);
      if (sortBy === 'balance_asc') return (a.balance || 0) - (b.balance || 0);
      if (sortBy === 'today') return (b.todayDeposit || 0) - (a.todayDeposit || 0);
      // Default: sort by class then name
      if (a.className === b.className) return a.name.localeCompare(b.name);
      return a.className.localeCompare(b.className);
    });
  }, [allStudents, searchQuery, selectedClass, sortBy]);

  const openTransactionModal = (id: string, name: string) => {
    setSelectedStudent({ id, name });
    setIsModalOpen(true);
  };

  const handleTransactionSuccess = () => {
    fetchSavings();
    fetchSummary(depositPeriod, withdrawalPeriod);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tabungan Siswa</h1>
          <p className="text-sm text-slate-500">Kelola setoran dan penarikan tabungan siswa.</p>
        </div>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Balance */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-full">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-slate-800 font-semibold mb-1">Total Tabungan Seluruhnya</h3>
              <p className="text-slate-400 text-xs">Akumulasi seluruh siswa aktif</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
              <Wallet size={20} />
            </div>
          </div>
          <div>
            {summaryLoading ? (
              <div className="h-8 w-32 bg-slate-100 rounded animate-pulse"></div>
            ) : (
              <p className="text-2xl font-bold text-blue-600">
                Rp {summary.totalBalance.toLocaleString('id-ID')}
              </p>
            )}
          </div>
        </div>

        {/* Deposit Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-full">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-slate-800 font-semibold mb-1">Total Tabungan Masuk</h3>
              <select 
                value={depositPeriod}
                onChange={(e) => setDepositPeriod(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-600 text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium mt-1"
              >
                <option value="today">Hari Ini</option>
                <option value="week">Minggu Ini</option>
                <option value="month">Bulan Ini</option>
                <option value="all">Semua Waktu</option>
              </select>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <ArrowDownToLine size={20} />
            </div>
          </div>
          <div>
            {summaryLoading ? (
              <div className="h-8 w-32 bg-slate-100 rounded animate-pulse"></div>
            ) : (
              <p className="text-2xl font-bold text-emerald-600">
                Rp {summary.totalDeposit.toLocaleString('id-ID')}
              </p>
            )}
          </div>
        </div>

        {/* Withdrawal Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-full">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-slate-800 font-semibold mb-1">Total Tabungan Keluar</h3>
              <select 
                value={withdrawalPeriod}
                onChange={(e) => setWithdrawalPeriod(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-600 text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium mt-1"
              >
                <option value="today">Hari Ini</option>
                <option value="week">Minggu Ini</option>
                <option value="month">Bulan Ini</option>
                <option value="all">Semua Waktu</option>
              </select>
            </div>
            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 flex-shrink-0">
              <ArrowUpFromLine size={20} />
            </div>
          </div>
          <div>
            {summaryLoading ? (
              <div className="h-8 w-32 bg-slate-100 rounded animate-pulse"></div>
            ) : (
              <p className="text-2xl font-bold text-rose-600">
                Rp {summary.totalWithdrawal.toLocaleString('id-ID')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-800">Buku Tabungan Siswa</h2>
            {!loading && (
              <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                {students.length} siswa
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button 
              onClick={() => { fetchSavings(); fetchSummary(depositPeriod, withdrawalPeriod); }} 
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" 
              title="Refresh data"
            >
              <RefreshCw size={18} className={loading || summaryLoading ? "animate-spin" : ""} />
            </button>

            {/* Filter by class — from data, no extra API call */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2 py-1.5">
              <Filter size={14} className="text-slate-400 shrink-0" />
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="text-sm text-slate-700 bg-transparent outline-none cursor-pointer pr-2"
              >
                <option value="">Semua Kelas</option>
                {classList.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            {/* Sort options */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="pl-3 pr-8 py-1.5 text-sm border border-slate-200 rounded-xl outline-none bg-white text-slate-700 cursor-pointer"
            >
              <option value="name">Urut: Kelas & Nama</option>
              <option value="balance_desc">Urut: Saldo Terbanyak</option>
              <option value="balance_asc">Urut: Saldo Terendah</option>
              <option value="today">Urut: Menabung Hari Ini</option>
            </select>

            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama atau NIS..." 
                className="pl-9 pr-4 py-1.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 w-44"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                <th className="font-semibold p-4">Nama Siswa</th>
                <th className="font-semibold p-4">Kelas</th>
                <th className="font-semibold p-4 text-right">Menabung Hari Ini</th>
                <th className="font-semibold p-4 text-right">Saldo Saat Ini</th>
                <th className="font-semibold p-4 text-center">Aksi Transaksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    {searchQuery ? `Tidak ada siswa dengan kata kunci "${searchQuery}".` : 'Tidak ada data ditemukan.'}
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition group">
                    <td className="p-4">
                      <Link href={`/finance/savings/${student.id}`} className="hover:text-blue-600 font-medium text-slate-800 flex items-center gap-2">
                        {student.name}
                      </Link>
                      <div className="text-xs text-slate-500 mt-0.5">NIS: {student.studentNumber}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold">
                        {student.className || '-'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className={`font-semibold ${student.todayDeposit > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {student.todayDeposit > 0 ? `+ Rp ${Number(student.todayDeposit).toLocaleString('id-ID')}` : '-'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className={`font-bold ${student.balance > 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                        Rp {Number(student.balance).toLocaleString('id-ID')}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => openTransactionModal(student.id, student.name)}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-semibold transition"
                        >
                          Transaksi
                        </button>
                        <Link 
                          href={`/finance/savings/${student.id}`}
                          className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-200 rounded-lg transition"
                          title="Buku Tabungan Lengkap"
                        >
                          <ChevronRight size={16} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TransactionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleTransactionSuccess}
        studentId={selectedStudent?.id || null}
        studentName={selectedStudent?.name || null}
      />
    </div>
  );
}
