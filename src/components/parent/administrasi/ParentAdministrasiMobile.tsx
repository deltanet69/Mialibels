'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Bell, 
  CreditCard, 
  Receipt, 
  PiggyBank, 
  ArrowDownLeft, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertCircle, 
  FileText,
  AlertTriangle,
  Sparkles,
  Wallet
} from 'lucide-react';
import { SppInvoice, GeneralInvoice, SavingsData } from './types';
import { 
  AnimatedCardTabIcon, 
  AnimatedReceiptTabIcon, 
  AnimatedPiggyTabIcon 
} from '@/components/parent/AnimatedNavIcons';

interface ParentAdministrasiMobileProps {
  activeTab: 'spp' | 'general' | 'savings';
  setActiveTab: (tab: 'spp' | 'general' | 'savings') => void;
  sppInvoices: SppInvoice[];
  remainingSpp: number;
  paidSppAmount: number;
  totalSppAmount: number;
  paidSppCount: number;
  totalSppCount: number;
  generalInvoices: GeneralInvoice[];
  remainingGeneral: number;
  paidGeneralAmount: number;
  totalGeneralAmount: number;
  paidGeneralCount: number;
  totalGeneralCount: number;
  savingsData: SavingsData | null;
  formatCurrency: (n: number) => string;
  formatDateTime: (dateStr: string) => string;
  isSetoran: (type: string) => boolean;
  getStatusBadge: (status: string) => React.ReactNode;
  onOpenPaySpp: (inv: SppInvoice) => void;
}

export function ParentAdministrasiMobile({
  activeTab,
  setActiveTab,
  sppInvoices,
  remainingSpp,
  paidSppAmount,
  totalSppAmount,
  paidSppCount,
  totalSppCount,
  generalInvoices,
  remainingGeneral,
  paidGeneralAmount,
  totalGeneralAmount,
  paidGeneralCount,
  totalGeneralCount,
  savingsData,
  formatCurrency,
  formatDateTime,
  isSetoran,
  getStatusBadge,
  onOpenPaySpp,
}: ParentAdministrasiMobileProps) {
  const TAB_ITEMS = [
    { id: 'spp', label: 'SPP', Icon: AnimatedCardTabIcon },
    { id: 'general', label: 'Umum', Icon: AnimatedReceiptTabIcon },
    { id: 'savings', label: 'Tabungan', Icon: AnimatedPiggyTabIcon },
  ];

  return (
    <div className="w-full pb-28 font-sans bg-[#f4f7fb] min-h-screen" style={{ backgroundColor: '#f4f7fb' }}>
      {/* 1. Header Banner (Consistent Dashboard/Profile Deep Navy Gradient + Glow + School Badge) */}
      <div 
        className="bg-gradient-to-b from-[#0d3880] via-[#1557bf] to-[#1d6bf0] pt-10 pb-20 px-5 text-white relative overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #163364ff 0%, #1e4480ff 55%, #1557bf 100%)',
          backgroundColor: '#163364',
          paddingTop: '32px',
          paddingBottom: '82px',
          paddingLeft: '20px',
          paddingRight: '20px',
          color: '#ffffff',
        }}
      >
        {/* Ambient Glow */}
        <div 
          className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none -mr-12 -mt-12 opacity-20" 
          style={{ background: 'radial-gradient(circle, #38bdf8 0%, rgba(255,255,255,0) 70%)' }} 
        />

        {/* Top Row: Title + Notification Bell */}
        <div className="flex justify-between items-start relative z-10">
          <div>
            <h1 className="text-[22px] font-extrabold text-white tracking-tight leading-snug m-0" style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff' }}>
              Administrasi
            </h1>
            <p className="text-xs text-white/80 mt-1 mb-0" style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)' }}>
              Tagihan SPP, pos keuangan umum & tabungan siswa
            </p>
          </div>

          {/* Notification Bell Button */}
          <Link 
            href="/parent/dashboard/informasi"
            className="w-11 h-11 rounded-full bg-white/20 border border-white/30 backdrop-blur-md flex items-center justify-center relative shrink-0 active:scale-95 transition-transform"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.09)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <Bell size={20} className="text-white" />
            <span 
              className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] bg-red-500 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center border-2 border-white"
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '18px',
                height: '18px',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                borderRadius: '50%',
                fontSize: '10px',
                fontWeight: 800,
                border: '2px solid #ffffff15',
              }}
            >
              2
            </span>
          </Link>
        </div>

        {/* School Badge */}
        <div className="flex items-center gap-2 mt-3.5 relative z-10" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px' }}>
          <span className="text-[13px] font-semibold text-white/95" style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.95)' }}>
            MI Attaqwa 15 — Bekasi
          </span>
        </div>
      </div>

      {/* 2. Floating Sub-Tab Segmented Card (-mt-14) */}
      <div 
        className="-mt-14 px-4 relative z-20"
        style={{ marginTop: '-35px', paddingLeft: '16px', paddingRight: '16px', position: 'relative', zIndex: 20 }}
      >
        <div className="bg-white rounded-2xl p-1.5 shadow-[0_12px_32px_-6px_rgba(22,51,100,0.12)] border border-slate-100 flex items-center justify-between gap-1 relative overflow-hidden">
          {TAB_ITEMS.map((tab) => {
            const isActive = activeTab === tab.id;
            const TabIcon = tab.Icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-2 px-1 rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                  isActive
                    ? 'bg-blue-50/90 text-blue-700 border border-blue-200/70 shadow-2xs font-extrabold'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50/80 border border-transparent font-semibold'
                }`}
              >
                <div className="h-6 w-6 flex items-center justify-center">
                  <TabIcon isActive={isActive} />
                </div>
                <span className={`text-[11px] tracking-tight transition-colors ${isActive ? 'text-blue-700 font-black' : 'text-slate-500'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TAB 1: SPP ── */}
      {activeTab === 'spp' && (
        <div className="px-4 mt-5 space-y-4">
          {/* Hero Gradient Card */}
          <div 
            className="rounded-2xl p-5 text-white shadow-md relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #1e40af 0%, #0284c7 100%)',
            }}
          >
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-[10px] font-bold text-blue-100 uppercase tracking-wider m-0">
                  SISA TAGIHAN SPP
                </p>
                <p className="text-3xl font-black text-white mt-1 mb-0">
                  {formatCurrency(remainingSpp > 0 ? remainingSpp : 0)}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-white/95 mt-2 font-medium">
                  {remainingSpp > 0 ? (
                    <span className="inline-flex items-center gap-1 bg-amber-400/25 border border-amber-300/40 text-amber-100 px-2 py-0.5 rounded-full text-[11px] font-bold">
                      <AlertTriangle size={12} className="text-amber-300 shrink-0" />
                      <span>Terdapat tagihan belum lunas</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-emerald-400/25 border border-emerald-300/40 text-emerald-100 px-2 py-0.5 rounded-full text-[11px] font-bold">
                      <CheckCircle2 size={12} className="text-emerald-300 shrink-0" />
                      <span>Seluruh tagihan SPP lunas</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shrink-0 shadow-sm">
                <CreditCard size={24} className="text-white" />
              </div>
            </div>
          </div>

          {/* 2 Sub-stats Cards */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider m-0">
                TELAH DIBAYAR
              </p>
              <p className="text-lg font-black text-emerald-600 mt-1 m-0">
                {formatCurrency(paidSppAmount)}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 m-0 font-medium">
                {paidSppCount} periode lunas
              </p>
            </div>

            <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider m-0">
                TOTAL TAGIHAN
              </p>
              <p className="text-lg font-black text-slate-800 mt-1 m-0">
                {formatCurrency(totalSppAmount)}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 m-0 font-medium">
                {totalSppCount} periode total
              </p>
            </div>
          </div>

          {/* Section Header */}
          <div className="flex items-center justify-between px-1 pt-1">
            <div className="flex items-center gap-1.5">
              <CreditCard size={14} className="text-blue-600" />
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 m-0">
                DAFTAR TAGIHAN SPP
              </h2>
            </div>
            <span className="text-[10px] font-bold text-slate-400">
              {sppInvoices.length} Periode
            </span>
          </div>

          {/* Daftar Tagihan SPP */}
          <div className="space-y-3">
            {sppInvoices.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-xs flex flex-col items-center text-center">
                <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" strokeWidth={1.5} />
                <p className="font-bold text-slate-800 text-sm mt-2">Tidak Ada Tagihan SPP</p>
                <p className="text-xs text-slate-400 mt-1">Belum ada tagihan SPP yang tercatat untuk siswa ini.</p>
              </div>
            ) : (
              sppInvoices.map((inv) => {
                const sisa = inv.amount - (inv.paid_amount || 0);
                const isPaid = inv.status === 'PAID';
                const isPending = inv.status === 'PENDING_VERIFICATION';

                return (
                  <div
                    key={inv.id}
                    className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-start gap-3.5"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                      <CreditCard size={18} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-xs text-slate-800 leading-tight m-0">
                            {inv.title}
                          </h4>
                          <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-md inline-block mt-1">
                            Bulan ke-{inv.month} {inv.year}
                          </span>
                        </div>
                        <div>{getStatusBadge(inv.status)}</div>
                      </div>

                      <p className="text-[11px] text-slate-500 mt-2 m-0">
                        Total: <span className="font-bold text-slate-700">{formatCurrency(inv.amount)}</span>
                        {sisa > 0 && (
                          <> · Sisa: <span className="font-bold text-rose-600">{formatCurrency(sisa)}</span></>
                        )}
                      </p>

                      {!isPaid && !isPending && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-end">
                          <button
                            onClick={() => onOpenPaySpp(inv)}
                            className="px-3.5 py-1.5 bg-blue-600 text-white rounded-xl text-[11px] font-bold hover:bg-blue-700 transition cursor-pointer active:scale-95 shadow-xs"
                          >
                            Konfirmasi Bayar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: UMUM ── */}
      {activeTab === 'general' && (
        <div className="px-4 mt-5 space-y-4">
          {/* Hero Gradient Card (Purple) */}
          <div 
            className="rounded-2xl p-5 text-white shadow-md relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #5b21b6 0%, #4f46e5 100%)',
            }}
          >
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-[10px] font-bold text-purple-100 uppercase tracking-wider m-0">
                  SISA TAGIHAN UMUM
                </p>
                <p className="text-3xl font-black text-white mt-1 mb-0">
                  {formatCurrency(remainingGeneral > 0 ? remainingGeneral : 0)}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-white/95 mt-2 font-medium">
                  {remainingGeneral > 0 ? (
                    <span className="inline-flex items-center gap-1 bg-amber-400/25 border border-amber-300/40 text-amber-100 px-2 py-0.5 rounded-full text-[11px] font-bold">
                      <AlertTriangle size={12} className="text-amber-300 shrink-0" />
                      <span>Terdapat tagihan umum belum lunas</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-emerald-400/25 border border-emerald-300/40 text-emerald-100 px-2 py-0.5 rounded-full text-[11px] font-bold">
                      <CheckCircle2 size={12} className="text-emerald-300 shrink-0" />
                      <span>Semua administrasi umum lunas</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shrink-0 shadow-sm">
                <Receipt size={24} className="text-white" />
              </div>
            </div>
          </div>

          {/* 2 Sub-stats Cards */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider m-0">
                TELAH DIBAYAR
              </p>
              <p className="text-lg font-black text-emerald-600 mt-1 m-0">
                {formatCurrency(paidGeneralAmount)}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 m-0 font-medium">
                {paidGeneralCount} tagihan lunas
              </p>
            </div>

            <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider m-0">
                TOTAL TAGIHAN
              </p>
              <p className="text-lg font-black text-slate-800 mt-1 m-0">
                {formatCurrency(totalGeneralAmount)}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5 m-0 font-medium">
                {totalGeneralCount} tagihan total
              </p>
            </div>
          </div>

          {/* Section Header */}
          <div className="flex items-center justify-between px-1 pt-1">
            <div className="flex items-center gap-1.5">
              <Receipt size={14} className="text-purple-600" />
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 m-0">
                TAGIHAN KEUANGAN UMUM
              </h2>
            </div>
            <span className="text-[10px] font-bold text-slate-400">
              {generalInvoices.length} Item
            </span>
          </div>

          {/* Daftar Tagihan Umum */}
          <div className="space-y-3">
            {generalInvoices.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-xs flex flex-col items-center text-center">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" strokeWidth={1.5} />
                <p className="font-bold text-slate-800 text-sm mt-2">Belum Ada Tagihan Umum</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Tagihan seragam, buku paket & kegiatan madrasah akan muncul di sini.
                </p>
              </div>
            ) : (
              generalInvoices.map((inv) => (
                <div key={inv.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                    <Receipt size={18} className="text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <h4 className="font-bold text-xs text-slate-800 leading-tight m-0">{inv.title}</h4>
                        <span className="text-[10px] text-slate-400 font-medium">{inv.type}</span>
                      </div>
                      {getStatusBadge(inv.status)}
                    </div>
                    <p className="text-xs font-black text-slate-800 mt-1 m-0">{formatCurrency(inv.total_amount)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: TABUNGAN ── */}
      {activeTab === 'savings' && (
        <div className="px-4 mt-5 space-y-4">
          {/* Hero Gradient Card (Teal/Emerald) */}
          <div 
            className="rounded-2xl p-5 text-white shadow-md relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #065f46 0%, #0d9488 100%)',
            }}
          >
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider m-0">
                  SALDO TABUNGAN SAAT INI
                </p>
                <p className="text-3xl font-black text-white mt-1 mb-0">
                  {formatCurrency(savingsData?.balance ?? 0)}
                </p>
                <div className="flex items-center gap-1 text-xs text-emerald-100 mt-2 font-medium">
                  <CheckCircle2 size={12} className="text-emerald-300" />
                  <span>Saldo aktif di kas MI Attaqwa 15</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shrink-0 shadow-sm">
                <PiggyBank size={24} className="text-white" />
              </div>
            </div>
          </div>

          {/* 2 Sub-stats Cards */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-1 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <ArrowDownLeft size={13} className="text-emerald-600 shrink-0" />
                <span>Total Setoran</span>
              </div>
              <p className="text-lg font-black text-emerald-600 mt-1 m-0">
                {formatCurrency(savingsData?.totalSetoran ?? 0)}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-1 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <ArrowUpRight size={13} className="text-rose-600 shrink-0" />
                <span>Total Penarikan</span>
              </div>
              <p className="text-lg font-black text-rose-600 mt-1 m-0">
                {formatCurrency(savingsData?.totalPenarikan ?? 0)}
              </p>
            </div>
          </div>

          {/* Section Header */}
          <div className="flex items-center justify-between px-1 pt-1">
            <div className="flex items-center gap-1.5">
              <PiggyBank size={14} className="text-emerald-600" />
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 m-0">
                RIWAYAT TRANSAKSI TABUNGAN
              </h2>
            </div>
            <span className="text-[10px] font-bold text-slate-400">
              {savingsData?.transactions?.length || 0} Mutasi
            </span>
          </div>

          {/* Riwayat Transaksi */}
          <div className="space-y-3">
            {(!savingsData || savingsData.transactions.length === 0) ? (
              <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-xs flex flex-col items-center text-center">
                <PiggyBank className="w-10 h-10 text-slate-300 mx-auto mb-2" strokeWidth={1.5} />
                <p className="font-bold text-slate-800 text-sm mt-2">Belum Ada Transaksi</p>
                <p className="text-xs text-slate-400 mt-1">Riwayat mutasi setoran & penarikan tabungan akan muncul di sini.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100 overflow-hidden">
                {savingsData.transactions.map((trx) => {
                  const isDeposit = isSetoran(trx.type);
                  return (
                    <div key={trx.id} className="p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isDeposit ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                          {isDeposit ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-800 m-0">
                            {trx.description || (isDeposit ? 'Setoran Tabungan' : 'Penarikan Tabungan')}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5 m-0 font-medium">{formatDateTime(trx.created_at)}</p>
                        </div>
                      </div>
                      <span className={`font-black text-xs ${isDeposit ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isDeposit ? `+${formatCurrency(trx.amount)}` : `-${formatCurrency(trx.amount)}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Whitespace spacer for Floating Bottom Nav */}
      <div className="h-12 w-full shrink-0" aria-hidden="true" />
    </div>
  );
}
