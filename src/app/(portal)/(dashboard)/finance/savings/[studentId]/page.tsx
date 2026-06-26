'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Wallet, ArrowDownToLine, ArrowUpFromLine, Calendar, Download } from 'lucide-react';
import Link from 'next/link';
import { TransactionModal } from '@/components/finance/TransactionModal';

export default function StudentSavingsDetail() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.studentId as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/savings/${studentId}`);
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      } else {
        alert(result.error);
        router.push('/finance/savings');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      fetchDetails();
    }
  }, [studentId]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Memuat data buku tabungan...</div>;
  }

  if (!data) return null;

  const { student, transactions } = data;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/finance/savings" className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-blue-600 rounded-xl transition shadow-sm">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Buku Tabungan</h2>
          <p className="text-sm text-slate-500">Detail mutasi saldo siswa</p>
        </div>
      </div>

      {/* Student Identity Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-slate-800">{student.name}</h1>
          <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
            <span className="px-2.5 py-1 bg-slate-100 rounded-lg">{student.className}</span>
            <span>NIS: {student.studentNumber}</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-500 mb-1">Saldo Saat Ini</p>
            <p className={`text-3xl font-bold ${student.balance > 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
              Rp {Number(student.balance).toLocaleString('id-ID')}
            </p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm transition flex items-center gap-2"
          >
            <Wallet size={18} />
            Transaksi
          </button>
        </div>
      </div>

      {/* Transactions History */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">Riwayat Mutasi</h3>
          <button className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 transition px-3 py-1.5 bg-white border border-slate-200 rounded-lg">
            <Download size={16} />
            Cetak Rekening Koran
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                <th className="font-semibold p-4">Tanggal & Waktu</th>
                <th className="font-semibold p-4">Keterangan</th>
                <th className="font-semibold p-4 text-right">Debit (Masuk)</th>
                <th className="font-semibold p-4 text-right">Kredit (Keluar)</th>
                <th className="font-semibold p-4 text-right">Saldo Akhir</th>
                <th className="font-semibold p-4 text-center">Admin</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">Belum ada transaksi</td>
                </tr>
              ) : (
                transactions.map((t: any) => (
                  <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                    <td className="p-4 text-sm text-slate-600 flex items-center gap-2">
                      <Calendar size={14} className="text-slate-400" />
                      {new Date(t.date).toLocaleString('id-ID', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="p-4 text-sm text-slate-600 max-w-[200px] truncate" title={t.description}>
                      {t.description || (t.type === 'DEPOSIT' ? 'Setoran Tabungan' : 'Penarikan Tabungan')}
                    </td>
                    <td className="p-4 text-right text-sm">
                      {t.type === 'DEPOSIT' ? (
                        <span className="font-bold text-emerald-600">Rp {Number(t.amount).toLocaleString('id-ID')}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-4 text-right text-sm">
                      {t.type === 'WITHDRAWAL' ? (
                        <span className="font-bold text-rose-600">Rp {Number(t.amount).toLocaleString('id-ID')}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-4 text-right font-bold text-slate-800 text-sm">
                      Rp {Number(t.balanceAfter).toLocaleString('id-ID')}
                    </td>
                    <td className="p-4 text-xs text-slate-500 font-medium text-center">
                      {t.adminName}
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
        onSuccess={fetchDetails}
        studentId={student.id}
        studentName={student.name}
      />
    </div>
  );
}
