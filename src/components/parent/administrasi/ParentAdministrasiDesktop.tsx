'use client';

import React from 'react';
import { 
  CreditCard, 
  Receipt, 
  PiggyBank, 
  RefreshCw 
} from 'lucide-react';
import { SppInvoice, GeneralInvoice, SavingsData } from './types';

interface ParentAdministrasiDesktopProps {
  activeTab: 'spp' | 'general' | 'savings';
  setActiveTab: (tab: 'spp' | 'general' | 'savings') => void;
  sppInvoices: SppInvoice[];
  loadingSpp: boolean;
  fetchSpp: () => void;
  generalInvoices: GeneralInvoice[];
  loadingGeneral: boolean;
  fetchGeneral: () => void;
  savingsData: SavingsData | null;
  loadingSavings: boolean;
  fetchSavings: () => void;
  formatCurrency: (n: number) => string;
  getStatusBadge: (status: string) => React.ReactNode;
}

export function ParentAdministrasiDesktop({
  activeTab,
  setActiveTab,
  sppInvoices,
  loadingSpp,
  fetchSpp,
  generalInvoices,
  loadingGeneral,
  fetchGeneral,
  savingsData,
  loadingSavings,
  fetchSavings,
  formatCurrency,
  getStatusBadge,
}: ParentAdministrasiDesktopProps) {
  return (
    <div className="space-y-5 max-w-5xl mx-auto font-sans">
      {/* Header Banner */}
      <div 
        className="rounded-2xl py-6 px-6 text-white shadow-md relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #002957 0%, #002957 50%, #002957 100%)',
          backgroundColor: '#002957',
          color: '#ffffff',
        }}
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-blue-200/90 text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#bfdbfe' }}>
            <span className="px-2.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>
              Administrasi & Keuangan
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight leading-none mb-2" style={{ color: '#ffffff' }}>
            Keuangan & SPP
          </h1>
          <p className="text-sm" style={{ color: '#dbeafe' }}>
            Pantau rincian tagihan SPP, pos keuangan umum madrasah, dan buku tabungan siswa.
          </p>
        </div>
      </div>

      {/* Desktop Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/70 rounded-2xl">
        {[
          { id: 'spp', label: 'Tagihan SPP', icon: CreditCard },
          { id: 'general', label: 'Keuangan Umum', icon: Receipt },
          { id: 'savings', label: 'Buku Tabungan', icon: PiggyBank },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-white' : 'text-slate-400'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Desktop Content: SPP */}
      {activeTab === 'spp' && (
        <div className="space-y-4 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-slate-800">Daftar Tagihan SPP Bulanan</h2>
            <button onClick={fetchSpp} className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer">
              <RefreshCw size={12} className={loadingSpp ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
          {sppInvoices.length === 0 ? (
            <div className="p-8 text-center text-slate-400">Tidak ada tagihan SPP aktif</div>
          ) : (
            <div className="space-y-3">
              {sppInvoices.map((inv) => (
                <div key={inv.id} className="p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">{inv.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">Total: {formatCurrency(inv.amount)}</p>
                  </div>
                  {getStatusBadge(inv.status)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Desktop Content: General */}
      {activeTab === 'general' && (
        <div className="space-y-4 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-slate-800">Tagihan Keuangan Umum</h2>
            <button onClick={fetchGeneral} className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer">
              <RefreshCw size={12} className={loadingGeneral ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
          {generalInvoices.length === 0 ? (
            <div className="p-8 text-center text-slate-400">Tidak ada tagihan umum</div>
          ) : (
            <div className="space-y-3">
              {generalInvoices.map((inv) => (
                <div key={inv.id} className="p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">{inv.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{inv.type} · {formatCurrency(inv.total_amount)}</p>
                  </div>
                  {getStatusBadge(inv.status)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Desktop Content: Savings */}
      {activeTab === 'savings' && (
        <div className="space-y-4 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-slate-800">Buku Tabungan Siswa</h2>
            <button onClick={fetchSavings} className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer">
              <RefreshCw size={12} className={loadingSavings ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
          <div 
            className="p-6 rounded-2xl text-white shadow-sm"
            style={{
              background: 'linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%)',
              backgroundColor: '#1d4ed8',
            }}
          >
            <p className="text-xs text-blue-100">Saldo Tabungan Saat Ini</p>
            <p className="text-3xl font-extrabold mt-1">{formatCurrency(savingsData?.balance ?? 0)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
