'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Wallet, ArrowDownToLine, ArrowUpFromLine, RefreshCw, ChevronRight } from 'lucide-react';
import { TransactionModal } from '@/components/finance/TransactionModal';

export default function SavingsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalBalance: 0,
    totalDeposit: 0,
    totalWithdrawal: 0
  });
  
  const [depositPeriod, setDepositPeriod] = useState('month'); // today, week, month, all
  const [withdrawalPeriod, setWithdrawalPeriod] = useState('month'); // today, week, month, all
  
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Class Filter
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<{id: string, name: string} | null>(null);

  const fetchSavings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/savings?search=${searchQuery}&classId=${selectedClass}`);
      const data = await res.json();
      if (data.success) {
        setStudents(data.data);
      }
    } catch (err) {
      console.error('Error fetching savings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await fetch(`/api/savings/summary?depositPeriod=${depositPeriod}&withdrawalPeriod=${withdrawalPeriod}`);
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
  };

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/classrooms');
      const data = await res.json();
      if (data.success) {
        setClasses(data.data);
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchSavings();
    }, 300); // debounce
    return () => clearTimeout(delay);
  }, [searchQuery, selectedClass]);

  useEffect(() => {
    fetchSummary();
  }, [depositPeriod, withdrawalPeriod]);

  const openTransactionModal = (id: string, name: string) => {
    setSelectedStudent({ id, name });
    setIsModalOpen(true);
  };

  const handleTransactionSuccess = () => {
    fetchSavings();
    fetchSummary();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tabungan Siswa</h1>
          <p className="text-sm text-slate-500">Kelola setoran dan penarikan tabungan</p>
        </div>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Balance Card */}
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
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        <div className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">Buku Tabungan Siswa</h2>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button onClick={() => { fetchSavings(); fetchSummary(); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition self-end sm:self-auto" title="Refresh">
              <RefreshCw size={18} className={loading || summaryLoading ? "animate-spin" : ""} />
            </button>
            <div className="flex gap-2 w-full sm:w-auto">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="pl-3 pr-8 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Semua Kelas</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama atau NIS..." 
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
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
              {loading && students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">Memuat data...</td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">Tidak ada data ditemukan</td>
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
                        {student.className}
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
