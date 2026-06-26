'use client';

import React, { useState } from 'react';
import { X, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';

type TransactionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  studentId: string | null;
  studentName: string | null;
};

export function TransactionModal({ isOpen, onClose, onSuccess, studentId, studentName }: TransactionModalProps) {
  const [type, setType] = useState<'DEPOSIT' | 'WITHDRAWAL'>('DEPOSIT');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) return setError('Pilih siswa terlebih dahulu.');
    
    const numericAmount = parseInt(amount.replace(/[^0-9]/g, ''), 10);
    if (!numericAmount || numericAmount <= 0) return setError('Masukkan nominal yang valid.');

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/savings/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          type,
          amount: numericAmount,
          description
        })
      });

      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Terjadi kesalahan saat memproses transaksi');
      }

      onSuccess(); // Refresh data
      setAmount('');
      setDescription('');
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Format to Rupiah
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value) {
      setAmount(new Intl.NumberFormat('id-ID').format(parseInt(value, 10)));
    } else {
      setAmount('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Transaksi Tabungan</h2>
          <button onClick={onClose} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-lg transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Siswa</label>
            <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-medium">
              {studentName || 'Memuat...'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType('DEPOSIT')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition border ${
                type === 'DEPOSIT' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ArrowDownToLine size={18} />
              Setoran (Masuk)
            </button>
            <button
              type="button"
              onClick={() => setType('WITHDRAWAL')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition border ${
                type === 'WITHDRAWAL' 
                  ? 'bg-rose-50 border-rose-200 text-rose-700' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ArrowUpFromLine size={18} />
              Penarikan (Keluar)
            </button>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nominal (Rp)</label>
            <input
              type="text"
              required
              value={amount}
              onChange={handleAmountChange}
              placeholder="Contoh: 50.000"
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Catatan / Keterangan</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tulis keterangan transaksi..."
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition disabled:opacity-70"
            >
              {isSubmitting ? 'Memproses...' : 'Proses Transaksi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
