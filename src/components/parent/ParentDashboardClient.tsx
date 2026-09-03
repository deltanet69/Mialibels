'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  UserCircle,
  Wallet,
  CalendarCheck,
  CreditCard,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Clock as ClockIcon,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Award,
  Layers,
  Phone,
  HelpCircle,
  ChevronRight,
  FileText,
  FileCheck2,
  Receipt,
  PiggyBank,
  HeartHandshake,
  Calendar,
  XCircle,
  Check,
  ExternalLink,
  ArrowDownLeft,
  ArrowUpRight,
  BookOpen
} from 'lucide-react';
import { CardDownloader } from '@/components/portal/students/CardDownloader';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

interface StudentInfo {
  id: string;
  name: string;
  className: string;
  nisn: string;
  studentNumber?: string;
  parentName: string;
  parentPhone?: string;
  image?: string;
  address?: string;
  feeWaiverType?: string;
  homeroomTeacher?: {
    name?: string;
    position?: string;
    phone?: string;
    image?: string;
  } | null;
}

interface AttendanceSummary {
  hadir: number;
  sakit: number;
  izin: number;
  alpha: number;
  total: number;
}

interface WeekDayAttendance {
  dayName: string;
  dateStr: string;
  dayNumber: number;
  isToday: boolean;
  status: string | null;
  reason?: string;
}

interface TabunganTransaksiItem {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  amount: number;
  balance_after: number;
  description?: string;
  created_at: string;
}

interface GeneralInvoiceItem {
  name: string;
  amount: number;
  paid?: number;
  is_paid?: boolean;
}

interface DashboardData {
  attendance: AttendanceSummary;
  persentaseHadir: number;
  recentAttendance: any[];
  weekDays: WeekDayAttendance[];
  todayAttendance: any | null;
  balance: number;
  recentSavingsTransactions: TabunganTransaksiItem[];
  sppInvoices: any[];
  allSppInvoices: any[];
  pendingSPP: any | null;
  totalUnpaidSPP: number;
  unpaidSppCount: number;
  paidSppCount: number;
  lastPaidSppTitle: string | null;
  generalInvoices: any[];
  totalGeneralAmount: number;
  totalGeneralPaid: number;
  totalUnpaidGeneral: number;
  isExamCardReady: boolean;
  examCardRequirements: {
    sppSeptemberPaid: boolean;
    ulumFiftyPercent: boolean;
    lksMinimumPaid: boolean;
  };
}

export function ParentDashboardClient({
  student,
  data
}: {
  student: StudentInfo;
  data: DashboardData;
}) {
  const [greeting, setGreeting] = useState('Selamat Datang');
  const [showExamReqModal, setShowExamReqModal] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) setGreeting('Selamat Pagi');
    else if (hour >= 11 && hour < 15) setGreeting('Selamat Siang');
    else if (hour >= 15 && hour < 18) setGreeting('Selamat Sore');
    else setGreeting('Selamat Malam');
  }, []);

  useEffect(() => {
    const initTour = (force = false) => {
      if (typeof window === 'undefined') return;
      
      const hasSeenTour = localStorage.getItem('parentTourCompleted');
      if (!force && hasSeenTour === 'true') return;

      const driverObj = driver({
        showProgress: true,
        allowClose: false,
        disableActiveInteraction: true,
        smoothScroll: true,
        animate: true,
        overlayColor: '#030712',
        overlayOpacity: 0.75,
        stagePadding: 8,
        stageRadius: 12,
        popoverClass: 'driverjs-theme',
        nextBtnText: 'Selanjutnya \u2192',
        prevBtnText: '\u2190 Sebelumnya',
        doneBtnText: 'Selesai \u2713',
        progressText: '{{current}} / {{total}}',
        steps: [ 
          {
            element: '#tour-attendance',
            popover: {
              title: 'Kehadiran Bulan Ini',
              description: 'Pantau presensi harian siswa bulan ini secara langsung di sini.',
              side: 'bottom',
              align: 'start'
            }
          },
          {
            element: '#tour-cards',
            popover: {
              title: 'Kartu Identitas Siswa',
              description: 'Anda dapat mengunduh Kartu Siswa dan Kartu Ujian di sini. Pastikan seluruh persyaratan administrasi terpenuhi agar kartu ujian dapat diunduh.',
              side: 'left',
              align: 'start'
            }
          },
          {
            element: '#tour-savings',
            popover: {
              title: 'Tabungan Siswa',
              description: 'Informasi terkait saldo tabungan terkini (Debit/Kredit) anak Anda di kas sekolah.',
              side: 'bottom',
              align: 'start'
            }
          },
          {
            element: '#tour-spp',
            popover: {
              title: 'Infaq & SPP Bulanan',
              description: 'Lihat rincian tagihan Infaq/SPP sekolah bulanan yang harus dibayarkan serta status pelunasannya.',
              side: 'bottom',
              align: 'start'
            }
          },
          {
            element: '#tour-general',
            popover: {
              title: 'Keuangan Umum',
              description: 'Informasi rinci terkait tagihan umum lainnya seperti administrasi sekolah, buku paket, dan kegiatan akhir tahun.',
              side: 'bottom',
              align: 'start'
            }
          }
        ],
        onDestroyStarted: () => {
          if (!driverObj.hasNextStep() || force) {
            localStorage.setItem('parentTourCompleted', 'true');
            driverObj.destroy();
          }
        }
      });

      driverObj.drive();
    };

    // Auto start if not seen with a slight delay
    const timer = setTimeout(() => {
      initTour(false);
    }, 800);

    const handleManualStart = () => {
      initTour(true);
    };

    const handleOpenExamModal = () => {
      setShowExamReqModal(true);
    };

    window.addEventListener('start-parent-tour', handleManualStart);
    window.addEventListener('open-exam-rules-modal', handleOpenExamModal);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('start-parent-tour', handleManualStart);
      window.removeEventListener('open-exam-rules-modal', handleOpenExamModal);
    };
  }, []);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

  const getStatusInfo = (status?: string | null) => {
    const s = (status || '').toLowerCase();
    if (s === 'hadir' || s === 'present') {
      return { label: 'Hadir', bg: 'bg-emerald-500', text: 'text-emerald-700', lightBg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 };
    }
    if (s === 'sakit' || s === 'sick') {
      return { label: 'Sakit', bg: 'bg-amber-400', text: 'text-amber-700', lightBg: 'bg-amber-50', border: 'border-amber-200', icon: ClockIcon };
    }
    if (s === 'izin' || s === 'permitted') {
      return { label: 'Izin', bg: 'bg-blue-400', text: 'text-blue-700', lightBg: 'bg-blue-50', border: 'border-blue-200', icon: FileText };
    }
    if (s === 'alpha' || s === 'alfa') {
      return { label: 'Alpha', bg: 'bg-rose-500', text: 'text-rose-700', lightBg: 'bg-rose-50', border: 'border-rose-200', icon: XCircle };
    }
    return { label: 'Belum Ada Data', bg: 'bg-slate-300', text: 'text-slate-500', lightBg: 'bg-slate-50', border: 'border-slate-200', icon: ClockIcon };
  };

  const getSPPStatusInfo = (status: string) => {
    if (status === 'PAID') return { label: 'Lunas', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: CheckCircle2 };
    if (status === 'UNPAID') return { label: 'Belum Bayar', color: 'text-rose-700 bg-rose-50 border-rose-200', icon: AlertTriangle };
    if (status === 'LATE') return { label: 'Terlambat', color: 'text-rose-800 bg-rose-100 border-rose-300', icon: AlertCircle };
    if (status === 'PENDING_VERIFICATION') return { label: 'Verifikasi', color: 'text-blue-700 bg-blue-50 border-blue-200', icon: ClockIcon };
    if (status === 'PARTIAL') return { label: 'Cicilan', color: 'text-amber-700 bg-amber-50 border-amber-200', icon: AlertTriangle };
    return { label: status, color: 'text-slate-700 bg-slate-50 border-slate-200', icon: AlertCircle };
  };

  const todayDateStr = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  return (
    <div className="space-y-6 w-full pb-14 max-w-full mx-auto">
      {/* ── 1. HEADER GREETING ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-[2rem] border border-slate-200/80 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Portal Wali Murid MI Attaqwa 15</span>
          </div>
          <h1 className="font-headline font-black text-2xl sm:text-3xl text-secondary tracking-tight">
            {greeting}, {student.parentName} 👋
          </h1>
          <p className="font-body text-slate-500 text-xs sm:text-sm mt-1">
            Pantau presensi harian, tabungan, tagihan SPP, dan administrasi Ananda <strong>{student.name}</strong> secara berkala.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200/80">
          <Calendar size={16} className="text-blue-600 shrink-0" />
          <span className="text-xs font-bold text-slate-700">{todayDateStr}</span>
        </div>
      </div>

      {/* ── 2. HERO STUDENT SPOTLIGHT (Card Siswa + Unduh Kartu) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Main Student Bento */}
        <div className="lg:col-span-8 bg-gradient-to-br from-[#002957] via-[#0b3366] to-[#1e40af] p-6 sm:p-8 rounded-[2rem] shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[220px] text-white border border-white/15">
          {/* Ambient Glows */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-400/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          <div className="absolute bottom-0 left-1/4 w-60 h-60 bg-amber-400/15 rounded-full blur-2xl -mb-20 pointer-events-none"></div>

          <div className="relative z-10 flex flex-col gap-6">
            {/* Top Identity Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {student.image ? (
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-white/40 shadow-lg shrink-0">
                    <img src={student.image} alt={student.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center text-white font-black text-2xl sm:text-3xl border-2 border-white/40 shadow-lg shrink-0">
                    {student.name ? student.name.charAt(0) : 'S'}
                  </div>
                )}

                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 border border-white/20 text-cyan-200 text-[11px] font-bold uppercase tracking-wider mb-1">
                    <span>Kelas {student.className}</span>
                  </div>
                  <h2 className="font-headline font-black text-xl sm:text-2xl text-white tracking-tight leading-snug">
                    {student.name}
                  </h2>
                  <p className="text-xs text-blue-200 mt-0.5 font-mono">
                    ID Siswa / NIS: <span className="font-bold text-white">{student.studentNumber || '-'}</span>
                    {student.nisn && <span> · NISN: <span className="font-bold text-white">{student.nisn}</span></span>}
                  </p>
                </div>
              </div>

              {/* Today's Live Attendance Tag */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-2xl flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-start">
                <span className={`w-3 h-3 rounded-full shrink-0 ${data.todayAttendance ? 'bg-emerald-400 animate-pulse ring-4 ring-emerald-400/30' : 'bg-amber-400'}`}></span>
                <div>
                  <p className="text-[10px] uppercase font-bold text-blue-200">Presensi Hari Ini</p>
                  <p className="text-xs font-black text-white">
                    {data.todayAttendance ? (data.todayAttendance.status?.toUpperCase() || 'HADIR') : 'Belum Presensi'}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Row: Attendance Progress & Homeroom Teacher */}
            <div id="tour-attendance" className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/15">
              <div>
                <div className="flex justify-between items-center text-xs font-semibold mb-1.5 text-blue-100">
                  <span>Kehadiran Bulan Ini</span>
                  <span className="font-black text-cyan-300">
                    {data.attendance.total > 0 ? `${data.persentaseHadir}% (${data.attendance.hadir} Hari Hadir)` : '100% (Semester Berjalan)'}
                  </span>
                </div>
                <div className="w-full bg-black/30 rounded-full h-2.5 overflow-hidden p-0.5">
                  <div
                    className="bg-gradient-to-r from-cyan-400 to-emerald-300 h-full rounded-full transition-all duration-700 shadow-sm"
                    style={{ width: `${data.persentaseHadir}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:justify-end">
                {student.homeroomTeacher?.image ? (
                  <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/30 shrink-0">
                    <img src={student.homeroomTeacher.image} alt={student.homeroomTeacher.name || 'Wali Kelas'} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-cyan-300 shrink-0">
                    <UserCircle size={20} />
                  </div>
                )}
                <div className="text-left">
                  <p className="text-[10px] uppercase font-bold text-blue-200">Wali Kelas {student.className}</p>
                  <p className="text-xs font-black text-white truncate max-w-[190px]">
                    {student.homeroomTeacher?.name || 'Ibu Wali Kelas'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Identity Cards Download Box */}
        <div id="tour-cards" className="lg:col-span-4 bg-white p-6 sm:p-7 rounded-[2rem] border border-slate-200/80 shadow-2xs flex flex-col justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Award size={13} />
              <span>Kartu Identitas Siswa</span>
            </div>
            <h3 className="font-headline font-black text-lg text-slate-800 tracking-tight">
              Unduh Kartu Pelajar & Ujian
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Dapatkan dokumen kartu resmi langsung berformat cetak untuk Ananda.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <CardDownloader
              studentId={student.id}
              student={{
                id: student.id,
                name: student.name,
                nisn: student.nisn || student.studentNumber || '-',
                student_number: student.studentNumber,
                class: student.className,
                address: student.address,
                image: student.image,
                fee_waiver_type: student.feeWaiverType
              }}
              sppInvoices={data.allSppInvoices}
            />

            <button
              onClick={() => setShowExamReqModal(true)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 transition pt-1 cursor-pointer"
            >
              <HelpCircle size={12} />
              <span>Cek Ketentuan & Syarat Kartu Ujian</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. FINANSIAL BENTO (Tabungan, SPP/Infaq, & Keuangan Umum) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Tabungan Siswa */}
        <Link
          id="tour-savings"
          href="/parent/dashboard/savings"
          className="bg-white p-6 sm:p-7 rounded-[2rem] border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between gap-5 group cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                <span>Tabungan Siswa</span>
              </div>
              <p className="font-headline font-black text-2xl sm:text-3xl text-slate-800 tracking-tight mt-1">
                {formatCurrency(data.balance)}
              </p>
              {data.recentSavingsTransactions.length > 0 ? (
                <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                  <ArrowDownLeft size={13} />
                  <span>Terakhir: +{formatCurrency(data.recentSavingsTransactions[0].amount)} ({new Date(data.recentSavingsTransactions[0].created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })})</span>
                </p>
              ) : (
                <p className="text-xs text-slate-400 mt-1">Saldo aktif di kas madrasah</p>
              )}
            </div>

            <div className="w-13 h-13 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <PiggyBank size={24} />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs font-bold text-blue-600 group-hover:text-blue-700">
            <span>Buka Buku Tabungan &rarr;</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* 2. Status SPP / Infaq Bulanan */}
        <Link
          id="tour-spp"
          href="/parent/dashboard/spp"
          className={`p-6 sm:p-7 rounded-[2rem] border shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-5 group cursor-pointer ${
            data.pendingSPP 
              ? 'bg-gradient-to-br from-rose-50/70 to-amber-50/50 border-rose-200 hover:border-rose-300' 
              : 'bg-white border-slate-200/80 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                <span>Infaq / SPP Bulanan</span>
              </div>

              {data.pendingSPP ? (
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-200 mt-1">
                    <AlertTriangle size={12} />
                    <span>{data.unpaidSppCount} Bulan Belum Lunas</span>
                  </div>
                  <p className="text-xs font-bold text-slate-700 mt-2">
                    Terdekat: {data.pendingSPP.title}
                  </p>
                  <p className="font-headline font-black text-xl text-rose-700 mt-0.5">
                    {formatCurrency(data.totalUnpaidSPP)}
                  </p>
                </div>
              ) : (
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200 mt-1">
                    <CheckCircle2 size={12} />
                    <span>Semua SPP Lunas</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Tidak ada tunggakan infaq</p>
                </div>
              )}
            </div>

            <div className={`w-13 h-13 rounded-2xl flex items-center justify-center shadow-2xs transition-all ${
              data.pendingSPP 
                ? 'bg-rose-100 text-rose-700 border border-rose-200 group-hover:scale-105' 
                : 'bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:scale-105'
            }`}>
              <CreditCard size={24} />
            </div>
          </div>

          <div className={`flex items-center justify-between pt-4 border-t text-xs font-bold ${
            data.pendingSPP ? 'border-rose-100 text-rose-700' : 'border-slate-100 text-emerald-700'
          }`}>
            <span>{data.pendingSPP ? 'Bayar Tagihan SPP' : 'Lihat Riwayat SPP'}</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* 3. Tagihan Umum / Non-SPP (Administrasi, Buku, Ulum) */}
        <Link
          id="tour-general"
          href="/parent/dashboard/general"
          className={`p-6 sm:p-7 rounded-[2rem] border shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-5 group cursor-pointer ${
            data.totalUnpaidGeneral > 0
              ? 'bg-gradient-to-br from-purple-50/70 to-indigo-50/50 border-purple-200 hover:border-purple-300'
              : 'bg-white border-slate-200/80 hover:border-blue-300'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                <span>Keuangan Umum (Non-SPP)</span>
              </div>

              {data.totalUnpaidGeneral > 0 ? (
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-purple-100 text-purple-800 border border-purple-200 mt-1">
                    <Receipt size={12} />
                    <span>Sisa Administrasi</span>
                  </div>
                  <p className="text-xs font-bold text-slate-700 mt-2 truncate max-w-[180px]">
                    {data.generalInvoices[0]?.title || 'Administrasi Sekolah'}
                  </p>
                  <p className="font-headline font-black text-xl text-purple-700 mt-0.5">
                    {formatCurrency(data.totalUnpaidGeneral)}
                  </p>
                </div>
              ) : (
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200 mt-1">
                    <CheckCircle2 size={12} />
                    <span>Administrasi Tuntas</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Buku, Ulum & kegiatan lunas</p>
                </div>
              )}
            </div>

            <div className={`w-13 h-13 rounded-2xl flex items-center justify-center shadow-2xs transition-all ${
              data.totalUnpaidGeneral > 0
                ? 'bg-purple-100 text-purple-700 border border-purple-200 group-hover:scale-105'
                : 'bg-indigo-50 text-indigo-600 border border-indigo-100 group-hover:scale-105'
            }`}>
              <BookOpen size={24} />
            </div>
          </div>

          <div className={`flex items-center justify-between pt-4 border-t text-xs font-bold ${
            data.totalUnpaidGeneral > 0 ? 'border-purple-100 text-purple-700' : 'border-slate-100 text-indigo-700'
          }`}>
            <span>{data.totalUnpaidGeneral > 0 ? 'Rincian & Pembayaran' : 'Lihat Arsip Tagihan'}</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* ── 4. WEEKLY PRESENCE TRACKER (Kalender Mingguan) ── */}
      <div className="bg-white p-6 sm:p-7 rounded-[2rem] border border-slate-200/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <CalendarCheck size={18} className="text-blue-600" />
              <h3 className="font-headline font-black text-lg text-slate-800">
                Kalender Presensi Minggu Ini
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pantau catatan kehadiran Ananda setiap hari sekolah (Senin s/d Jumat).
            </p>
          </div>

          <Link
            href="/parent/dashboard/attendance"
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Lihat Rekap Seluruh Bulan</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* 5-Day Week Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {data.weekDays.map((wd, i) => {
            const st = getStatusInfo(wd.status);
            const StatusIcon = st.icon;

            return (
              <div
                key={i}
                className={`p-4 rounded-2xl border transition-all flex flex-col items-center text-center gap-2.5 ${
                  wd.isToday 
                    ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20 shadow-2xs' 
                    : wd.status 
                    ? 'bg-slate-50/80 border-slate-200/80' 
                    : 'bg-slate-50/40 border-slate-100 opacity-60'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-black uppercase ${wd.isToday ? 'text-blue-700' : 'text-slate-700'}`}>
                    {wd.dayName}
                  </span>
                  {wd.isToday && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping"></span>
                  )}
                </div>

                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-2xs ${
                  wd.status ? `${st.lightBg} ${st.text} border ${st.border}` : 'bg-slate-100 text-slate-400'
                }`}>
                  <StatusIcon size={20} />
                </div>

                <div>
                  <p className="text-[11px] font-bold text-slate-800 font-mono">{wd.dayNumber}</p>
                  <p className={`text-[10px] font-black uppercase tracking-wide mt-0.5 ${wd.status ? st.text : 'text-slate-400'}`}>
                    {st.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 5. DUA KOLOM AKTIVITAS & RINCIAN TAGIHAN ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Riwayat Presensi Terkini */}
        <div className="bg-white rounded-[2rem] shadow-2xs border border-slate-200/80 p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <ClockIcon size={18} className="text-blue-600" />
                <h3 className="font-headline font-black text-base text-slate-800">Catatan Kehadiran Terakhir</h3>
              </div>
              <Link href="/parent/dashboard/attendance" className="text-xs font-bold text-blue-600 hover:text-blue-700">
                Detail &rarr;
              </Link>
            </div>

            <div className="space-y-3">
              {data.recentAttendance.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <CalendarCheck size={36} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-bold text-slate-600">Belum ada catatan presensi</p>
                  <p className="text-[11px] text-slate-400">Data akan otomatis terisi saat siswa scan kartu RFID.</p>
                </div>
              ) : (
                data.recentAttendance.map((record: any) => {
                  const statusInfo = getStatusInfo(record.status);
                  const Icon = statusInfo.icon;
                  return (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${statusInfo.lightBg} ${statusInfo.text} border ${statusInfo.border}`}>
                          <Icon size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            {new Date(record.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                          </p>
                          {record.reason && (
                            <p className="text-[11px] text-slate-500 mt-0.5 italic">Ket: {record.reason}</p>
                          )}
                        </div>
                      </div>

                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${statusInfo.lightBg} ${statusInfo.text} ${statusInfo.border}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* 2. Tagihan SPP & Rincian Pembayaran */}
        <div className="bg-white rounded-[2rem] shadow-2xs border border-slate-200/80 p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Receipt size={18} className="text-amber-600" />
                <h3 className="font-headline font-black text-base text-slate-800">Daftar Tagihan SPP</h3>
              </div>
              <Link href="/parent/dashboard/spp" className="text-xs font-bold text-blue-600 hover:text-blue-700">
                Selengkapnya &rarr;
              </Link>
            </div>

            <div className="space-y-3">
              {data.sppInvoices.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <CreditCard size={36} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-bold text-slate-600">Belum ada tagihan SPP tercatat</p>
                </div>
              ) : (
                data.sppInvoices.slice(0, 4).map((inv: any) => {
                  const sppInfo = getSPPStatusInfo(inv.status);
                  const SppIcon = sppInfo.icon;
                  return (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors gap-3"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-800">{inv.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Bulan {String(inv.month).padStart(2, '0')}/{inv.year} · <strong className="text-slate-800">{formatCurrency(inv.amount)}</strong>
                        </p>
                      </div>

                      <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${sppInfo.color}`}>
                        <SppIcon size={11} />
                        <span>{sppInfo.label}</span>
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Pembayaran Tunai / Transfer</span>
            <Link href="/parent/dashboard/spp" className="font-bold text-blue-600 hover:underline">
              Buka Tata Cara Pembayaran &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* ── MODAL: PERSYARATAN & CEK KEKURANGAN KARTU UJIAN ── */}
      {showExamReqModal && (() => {
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
                  onClick={() => setShowExamReqModal(false)}
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

                {/* 2. Checklist Rincian Status Siswa (Sesuai Rules Kelas) */}
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
                    {/* 1. PPDB / SPMB & Tunggakan Lalu */}
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
                          onClick={() => setShowExamReqModal(false)}
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
                          onClick={() => setShowExamReqModal(false)}
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
                          onClick={() => setShowExamReqModal(false)}
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
                            onClick={() => setShowExamReqModal(false)}
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
                    setShowExamReqModal(false);
                    setTimeout(() => window.dispatchEvent(new Event('start-parent-tour')), 300);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition cursor-pointer"
                >
                  <Sparkles size={14} />
                  <span>Ulangi Tour Panduan</span>
                </button>

                <button
                  onClick={() => setShowExamReqModal(false)}
                  className="px-6 py-2 rounded-full bg-blue-600 text-white font-bold hover:bg-blue-700 transition cursor-pointer shadow-sm text-xs"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
