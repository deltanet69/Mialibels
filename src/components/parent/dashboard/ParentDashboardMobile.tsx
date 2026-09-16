'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  UserCircle,
  Bell,
  Calendar,
  Check,
  ChevronRight,
  Wallet,
  Receipt,
  BookOpen,
  CalendarDays,
  Info,
  CheckCircle2,
  ScanLine
} from 'lucide-react';
import { formatWIBDateIndo, getWIBTargetScheduleInfo, getWIBWeekDays, getWIBParts } from '@/lib/dateUtils';
import { ParentNotificationBell } from '@/components/parent/notifications/ParentNotificationBell';
import { useParentNotifications } from '@/components/parent/ParentNotificationProvider';
import { StudentInfo, DashboardData } from './types';

interface ParentDashboardMobileProps {
  student: StudentInfo;
  data: DashboardData;
  currentTime: Date | null;
}

export function ParentDashboardMobile({
  student,
  data,
  currentTime,
}: ParentDashboardMobileProps) {
  const { latestScan } = useParentNotifications();
  const [scanDismissed, setScanDismissed] = useState(false);

  // Auto-dismiss scan banner after 12s
  useEffect(() => {
    if (!latestScan) return;
    setScanDismissed(false);
    const t = setTimeout(() => setScanDismissed(true), 12000);
    return () => clearTimeout(t);
  }, [latestScan?.scannedAt]);

  const showScanBanner = latestScan && !scanDismissed;

  const todayDateStr = formatWIBDateIndo(currentTime || new Date());
  const targetSchedule = getWIBTargetScheduleInfo(currentTime || new Date());

  const formatCompactCurrency = (n: number) => {
    if (!n || n === 0) return 'Rp 0';
    if (n >= 1000000) {
      const val = n / 1000000;
      return `Rp ${val % 1 === 0 ? val : val.toFixed(1)}jt`;
    }
    if (n >= 1000) {
      const val = n / 1000;
      return `Rp ${val % 1 === 0 ? val : val.toFixed(0)}rb`;
    }
    return `Rp ${n}`;
  };

  // Filter schedules from database for target day
  const dbDaySchedules = (data.schedules || [])
    .filter((s) => (s.day || '').toLowerCase() === targetSchedule.dayName.toLowerCase())
    .sort((a, b) => {
      const tA = a.time_start || a.time?.split('-')[0]?.trim() || '';
      const tB = b.time_start || b.time?.split('-')[0]?.trim() || '';
      return tA.localeCompare(tB);
    });

  const colorPalette = [
    'bg-purple-50 text-purple-700 border-purple-200',
    'bg-blue-50 text-blue-700 border-blue-200',
    'bg-emerald-50 text-emerald-700 border-emerald-200',
    'bg-cyan-50 text-cyan-700 border-cyan-200',
    'bg-rose-50 text-rose-700 border-rose-200',
  ];

  const hasActiveBill = Boolean(
    data.pendingSPP || 
    (data.unpaidSppCount && data.unpaidSppCount > 0) || 
    (data.totalUnpaidSPP && data.totalUnpaidSPP > 0) || 
    (data.totalUnpaidGeneral && data.totalUnpaidGeneral > 0)
  );

  return (
    <div className="font-sans pb-28 min-h-screen bg-[#f4f7fb]" style={{ backgroundColor: '#f4f7fb' }}>
      
      {/* Realtime Scan Notification Popup (Fixed Top Overlay) */}
      {showScanBanner && latestScan && (
        <div className="fixed top-4 left-4 right-4 z-[999] animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-[#ecfdf5] border-2 border-emerald-400/50 rounded-2xl p-4 shadow-xl shadow-emerald-500/10 flex items-start gap-3">
             <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
               <ScanLine size={20} className="text-emerald-600" strokeWidth={2.5} />
             </div>
             <div className="flex-1">
               <h4 className="text-sm font-bold text-emerald-900">Scan RFID Terkonfirmasi!</h4>
               <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                 {student.name || 'Siswa'} absen masuk {latestScan.status.toLowerCase() === 'terlambat' ? 'Terlambat' : 'Tepat Waktu'} pkl {latestScan.entry_time.substring(0, 5)} WIB
               </p>
             </div>
             <button onClick={() => setScanDismissed(true)} className="p-1 text-emerald-600/60 hover:text-emerald-800 rounded-full bg-emerald-100/50 transition-colors">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
             </button>
          </div>
        </div>
      )}

      {/* 1. Header with Royal to Electric Blue Gradient */}
      <div 
        className="bg-gradient-to-b from-[#0d3880] via-[#1557bf] to-[#1d6bf0] pt-10 pb-20 px-5 text-white relative"
        style={{
          background: 'linear-gradient(180deg, #163364ff 0%, #1e4480ff 55%, #1557bf 100%)',
          paddingTop: '32px',
          paddingBottom: '82px',
          paddingLeft: '20px',
          paddingRight: '20px',
          color: '#ffffff',
        }}
      >
        {/* Top Row: Title + Notification Bell */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-[22px] font-extrabold text-white tracking-tight leading-snug m-0" style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff' }} suppressHydrationWarning>
              Halo, {student.parentName || 'Wali Murid'}!
            </h1>
            <p className="text-xs text-white/80 mt-1 mb-0" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }} suppressHydrationWarning>
              {todayDateStr}
            </p>
          </div>

          {/* Notification Bell Component */}
          <ParentNotificationBell />
        </div>

        {/* School Badge */}
        <div className="flex items-center gap-2 mt-3.5" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px' }}>
          <span className="text-[13px] font-semibold text-white/95" style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.95)' }}>
            MI Attaqwa 15 — Bekasi
          </span>
        </div>
      </div>

      {/* 2. Floating Student Card (Midnight Blue) */}
      <div className="-mt-14 px-4 relative z-10" style={{ marginTop: '-56px', paddingLeft: '16px', paddingRight: '16px', position: 'relative', zIndex: 10 }}>
        <div 
          className="bg-[#11285a] rounded-3xl p-5 shadow-xl border border-white/10 text-white"
          style={{
            backgroundColor: '#11285a',
            borderRadius: '24px',
            padding: '20px',
            boxShadow: '0 12px 32px -4px rgba(13, 38, 87, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#ffffff',
          }}
        >
          {/* Student Profile Row */}
          <div className="flex gap-3.5 items-start" style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            {student.image ? (
              <img 
                src={student.image} 
                alt={student.name} 
                className="w-12 h-12 rounded-2xl object-cover shrink-0 border border-white/15"
                style={{ width: '48px', height: '48px', minWidth: '48px', minHeight: '48px', borderRadius: '16px', objectFit: 'cover' }}
                width={48}
                height={48}
              />
            ) : (
              <div 
                className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-extrabold text-xl flex items-center justify-center shrink-0"
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '16px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {student.name ? student.name.charAt(0).toUpperCase() : 'M'}
              </div>
            )}

            <div className="flex-1 min-w-0" style={{ flex: 1, minWidth: 0 }}>
              <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 className="text-lg font-extrabold text-white m-0 tracking-tight truncate" style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  {student.name || 'Mikhayla'}
                </h2>
                <span 
                  className="text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full px-2.5 py-0.5 capitalize leading-tight"
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    borderRadius: '9999px',
                    padding: '2px 9px',
                  }}
                >
                  Aktif
                </span>
              </div>

              <p className="text-xs text-blue-200/85 mt-1 font-medium m-0" style={{ fontSize: '12px', color: 'rgba(191, 219, 254, 0.85)', margin: '4px 0 0 0', fontWeight: 500 }}>
                Kelas {student.className || '1A'} · NIS: {student.studentNumber || '-'}
              </p>
              <p className="text-xs text-blue-200/75 mt-0.5 m-0" style={{ fontSize: '12px', color: 'rgba(191, 219, 254, 0.75)', margin: '2px 0 0 0' }}>
                NISN: {student.nisn || '-'}
              </p>
            </div>
          </div>

          {/* Monthly Attendance Progress */}
          <div className="mt-4" style={{ marginTop: '16px' }}>
            <div className="flex justify-between items-center mb-1.5" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span className="text-xs font-medium text-blue-200/90" style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(191, 219, 254, 0.9)' }}>
                Kehadiran Bulan Ini
              </span>
              <span className="text-xs font-extrabold text-[#00e5a3]" style={{ fontSize: '12px', fontWeight: 800, color: '#00e5a3' }}>
                {data.persentaseHadir ?? 100}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#1b366e] overflow-hidden" style={{ width: '100%', height: '6px', borderRadius: '9999px', backgroundColor: '#1b366e', overflow: 'hidden' }}>
              <div 
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-[#00e5a3] transition-all duration-1000" 
                style={{
                  width: `${data.persentaseHadir ?? 100}%`,
                  height: '100%',
                  borderRadius: '9999px',
                  background: 'linear-gradient(90deg, #10b981 0%, #00e5a3 100%)',
                }}
              />
            </div>
          </div>

          {/* Homeroom Teacher Row */}
          <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center gap-3" style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            {student.homeroomTeacher?.image ? (
              <img 
                src={student.homeroomTeacher.image} 
                alt={student.homeroomTeacher.name || 'Wali Kelas'} 
                className="w-[42px] h-[42px] rounded-full object-cover border border-white/20 shrink-0" 
                style={{ width: '42px', height: '42px', minWidth: '42px', minHeight: '42px', maxWidth: '42px', maxHeight: '42px', borderRadius: '50%', objectFit: 'cover' }}
                width={42}
                height={42}
              />
            ) : (
              <div 
                className="w-[42px] h-[42px] rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0"
                style={{
                  width: '42px',
                  height: '42px',
                  minWidth: '42px',
                  minHeight: '42px',
                  borderRadius: '50%',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {student.homeroomTeacher?.name ? student.homeroomTeacher.name.charAt(0).toUpperCase() : 'W'}
              </div>
            )}
            <div className="min-w-0 flex-1" style={{ minWidth: 0, flex: 1 }}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200/75 m-0" style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(191, 219, 254, 0.75)', margin: 0 }}>
                WALI KELAS {student.className || '-'}
              </p>
              <p className="text-sm font-semibold text-white mt-0.5 m-0 truncate" style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', margin: '2px 0 0 0' }}>
                {student.homeroomTeacher?.name || 'Wali Kelas MI Attaqwa 15'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Today Attendance Badge (below student card) */}
      {(data.todayAttendance || showScanBanner) && (
        <div style={{ padding: '0 16px', marginTop: '12px' }}>
          <div
            style={{
              backgroundColor: showScanBanner ? '#ecfdf5' : '#f0fdf4',
              border: showScanBanner ? '1.5px solid #6ee7b7' : '1px solid #d1fae5',
              borderRadius: '16px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: showScanBanner ? '0 0 0 3px rgba(16,185,129,0.12)' : 'none',
              transition: 'all 0.3s ease',
              animation: showScanBanner ? 'scan-pulse 0.4s ease-out' : 'none',
            }}
          >
            <style>{`
              @keyframes scan-pulse {
                0% { transform: scale(0.97); opacity: 0; }
                100% { transform: scale(1); opacity: 1; }
              }
            `}</style>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              backgroundColor: showScanBanner ? '#6ee7b7' : '#a7f3d0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#065f46', flexShrink: 0,
            }}>
              {showScanBanner ? <ScanLine size={18} strokeWidth={2.5} /> : <CheckCircle2 size={18} strokeWidth={2.5} />}
            </div>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#064e3b', margin: 0 }}>
                {showScanBanner ? '✓ Scan RFID Terkonfirmasi' : 'Kehadiran Hari Ini'}
              </p>
              <p style={{ fontSize: '13px', fontWeight: 800, color: '#065f46', margin: '2px 0 0 0' }}>
                {showScanBanner
                  ? `${latestScan!.status} · Jam ${latestScan!.entry_time.substring(0, 5)} WIB`
                  : `${data.todayAttendance?.status || 'Hadir'} · Jam ${(data.todayAttendance?.entry_time || '').substring(0, 5)} WIB`
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Presensi Kehadiran (Modern, Playful & Informatif) */}
      <div className="px-4 mt-5" style={{ padding: '0 16px', marginTop: '20px' }}>
        <div 
          className="bg-white rounded-[24px] p-4 border border-slate-100 shadow-[0_4px_24px_rgba(15,23,42,0.05)]"
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            padding: '16px',
            border: '1px solid #f1f5f9',
            boxShadow: '0 4px 24px rgba(15, 23, 42, 0.05)',
          }}
        >
          {/* Header */}
          <div 
            className="flex justify-between items-center mb-3.5"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}
          >
            <div className="flex items-center gap-2.5">
              <div 
                className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs"
                style={{ width: '32px', height: '32px', borderRadius: '12px', backgroundColor: '#eff6ff', border: '1px solid #dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                <Calendar size={16} strokeWidth={2.5} />
              </div>
              <div>
                <h3 
                  className="text-[15px] font-extrabold text-slate-900 m-0 tracking-tight leading-none"
                  style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.2 }}
                >
                  Presensi Kehadiran
                </h3>
                <p 
                  className="text-[11px] text-slate-400 font-medium m-0 mt-0.5"
                  style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500, margin: '2px 0 0 0' }}
                >
                  Pekan aktif belajar & ketepatan waktu
                </p>
              </div>
            </div>
            <Link 
              href="/parent/dashboard/classroom?tab=rekap" 
              className="text-xs font-bold text-blue-600 flex items-center gap-0.5 hover:underline py-1 px-2.5 rounded-xl bg-blue-50/80 border border-blue-100 transition-all active:scale-95"
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#2563eb',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                backgroundColor: 'rgba(239, 246, 255, 0.85)',
                border: '1px solid #dbeafe',
                padding: '4px 10px',
                borderRadius: '12px',
              }}
            >
              <span>Detail</span> <ChevronRight size={13} />
            </Link>
          </div>

          {/* 5-Day Squircle Grid (Guaranteed 1-row horizontal layout) */}
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
              gap: '6px',
              width: '100%',
              alignItems: 'center',
              padding: '2px 0',
            }}
          >
            {data.weekDays && data.weekDays.length > 0 ? (
              data.weekDays.map((wd) => {
                const isToday = wd.isToday;
                const rawStatus = (wd.status || '').toLowerCase().trim();
                const isHadir = rawStatus === 'hadir' || rawStatus === 'present' || rawStatus === 'tepat waktu' || rawStatus === 'terlambat';
                const isSakit = rawStatus === 'sakit' || rawStatus === 'sick';
                const isIzin = rawStatus === 'izin' || rawStatus === 'permitted';
                const isAlpha = rawStatus === 'alpha' || rawStatus === 'alfa';

                let statusText = '—';
                let statusColor = '#94a3b8';
                let statusFontWeight = 600;
                let bgStyle = '#f8fafc';
                let textColor = '#64748b';
                let borderStyle = '1px solid #e2e8f0';
                let shadowStyle = 'none';

                if (isToday) {
                  bgStyle = 'linear-gradient(135deg, #1d6bf0 0%, #1557bf 100%)';
                  textColor = '#ffffff';
                  borderStyle = '2px solid rgba(255, 255, 255, 0.85)';
                  shadowStyle = '0 6px 16px rgba(29, 107, 240, 0.35)';
                  if (isHadir) {
                    statusText = wd.entry_time ? wd.entry_time.substring(0, 5) : 'Hadir';
                  } else if (isSakit) {
                    statusText = 'Sakit';
                  } else if (isIzin) {
                    statusText = 'Izin';
                  } else if (isAlpha) {
                    statusText = 'Alpha';
                  } else {
                    statusText = 'Hari Ini';
                  }
                  statusColor = '#2563eb';
                  statusFontWeight = 800;
                } else if (isHadir) {
                  statusText = wd.entry_time ? (wd.entry_time.length > 5 ? wd.entry_time.substring(0, 5) : wd.entry_time) : 'Hadir';
                  statusColor = '#10b981';
                  bgStyle = '#f0fdf4';
                  textColor = '#047857';
                  borderStyle = '1px solid #d1fae5';
                  shadowStyle = '0 2px 6px rgba(5, 150, 105, 0.08)';
                  statusFontWeight = 700;
                } else if (isSakit) {
                  statusText = 'Sakit';
                  statusColor = '#eab308';
                  bgStyle = '#fefce8';
                  textColor = '#a16207';
                  borderStyle = '1px solid #fef08a';
                  shadowStyle = '0 2px 6px rgba(217, 119, 6, 0.08)';
                  statusFontWeight = 700;
                } else if (isIzin) {
                  bgStyle = '#f0f9ff';
                  textColor = '#0284c7';
                  borderStyle = '1.5px solid #bae6fd';
                  shadowStyle = '0 2px 6px rgba(2, 132, 199, 0.08)';
                  statusText = 'Izin';
                  statusColor = '#0284c7';
                  statusFontWeight = 700;
                } else if (isAlpha) {
                  bgStyle = '#fff1f2';
                  textColor = '#e11d48';
                  borderStyle = '1.5px solid #fecdd3';
                  shadowStyle = '0 2px 6px rgba(225, 29, 72, 0.08)';
                  statusText = 'Alpha';
                  statusColor = '#e11d48';
                  statusFontWeight = 700;
                }

                return (
                  <div 
                    key={wd.dayName} 
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      minWidth: 0,
                    }}
                  >
                    {/* Day Name */}
                    <span 
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        color: isToday ? '#2563eb' : '#94a3b8',
                        letterSpacing: '0.05em',
                        marginBottom: '5px',
                      }}
                    >
                      {wd.dayName.substring(0, 3)}
                    </span>

                    {/* Squircle Number Box */}
                    <div 
                      style={{
                        width: '100%',
                        maxWidth: '52px',
                        height: '50px',
                        borderRadius: '15px',
                        background: bgStyle,
                        color: textColor,
                        border: borderStyle,
                        boxShadow: shadowStyle,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '14px',
                        position: 'relative',
                        margin: '0 auto',
                      }}
                    >
                      <span style={{ fontSize: '14px', fontWeight: 800, lineHeight: 1 }}>
                        {wd.dayNumber}
                      </span>
                      {isHadir && !isToday && (
                        <Check size={11} strokeWidth={3.5} style={{ color: '#059669', marginTop: '1px' }} />
                      )}
                      {isToday && (
                        <span 
                          style={{
                            width: '4px',
                            height: '4px',
                            borderRadius: '50%',
                            backgroundColor: '#ffffff',
                            marginTop: '3px',
                          }}
                        />
                      )}
                    </div>

                    {/* Status Bottom Text */}
                    <span 
                      style={{
                        fontSize: '10px',
                        marginTop: '5px',
                        color: statusColor,
                        fontWeight: statusFontWeight,
                        textAlign: 'center',
                        lineHeight: '1.2',
                        width: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {statusText}
                    </span>
                  </div>
                );
              })
            ) : (
              getWIBWeekDays(currentTime || undefined).weekDays.map((wd) => {
                const isToday = wd.isToday;
                const bgStyle = isToday ? 'linear-gradient(135deg, #1d6bf0 0%, #1557bf 100%)' : '#f8fafc';
                const textColor = isToday ? '#ffffff' : '#64748b';
                const borderStyle = isToday ? '2px solid rgba(255, 255, 255, 0.85)' : '1px solid #e2e8f0';
                const statusColor = isToday ? '#2563eb' : '#94a3b8';

                return (
                  <div 
                    key={wd.dayName} 
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      minWidth: 0,
                    }}
                  >
                    <span 
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        color: isToday ? '#2563eb' : '#94a3b8',
                        letterSpacing: '0.05em',
                        marginBottom: '5px',
                      }}
                    >
                      {wd.dayName.substring(0, 3)}
                    </span>
                    <div 
                      style={{
                        width: '100%',
                        maxWidth: '52px',
                        height: '50px',
                        borderRadius: '15px',
                        background: bgStyle,
                        color: textColor,
                        border: borderStyle,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '14px',
                        margin: '0 auto',
                      }}
                    >
                      <span style={{ fontSize: '14px', fontWeight: 800, lineHeight: 1 }}>{wd.dayNumber}</span>
                      {isToday && <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#ffffff', marginTop: '3px' }} />}
                    </div>
                    <span 
                      style={{
                        fontSize: '10px',
                        marginTop: '5px',
                        color: statusColor,
                        fontWeight: isToday ? 800 : 600,
                        textAlign: 'center',
                        width: '100%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isToday ? 'Hari Ini' : '—'}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Playful & Informative Footer Strip */}
          <div 
            style={{
              marginTop: '14px',
              paddingTop: '10px',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#f8fafc',
              borderRadius: '14px',
              padding: '8px 12px',
            }}
          >
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 700, color: '#475569' }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
                <span>{data.attendance?.hadir ?? 0} Hadir</span>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#f59e0b', display: 'inline-block' }} />
                <span>{data.attendance?.sakit ?? 0} Sakit</span>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#0ea5e9', display: 'inline-block' }} />
                <span>{data.attendance?.izin ?? 0} Izin</span>
              </span>
            </div>
            <span 
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: (data.attendance?.total ?? 0) > 0 ? '#047857' : '#64748b',
                backgroundColor: (data.attendance?.total ?? 0) > 0 ? '#d1fae5' : '#f1f5f9',
                border: (data.attendance?.total ?? 0) > 0 ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
                padding: '2px 8px',
                borderRadius: '9999px',
              }}
            >
              {(data.attendance?.total ?? 0) > 0 ? `${data.persentaseHadir ?? 0}% Hadir` : '0 Record'}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Jadwal Pelajaran Yang Akan Datang (Pengganti Akses Cepat) */}
      <div className="px-4 mt-6">
        {/* Title Row */}
        <div className="flex justify-between items-center mb-2.5">
          <div>
            <h3 className="text-[15px] font-extrabold text-slate-900 m-0 tracking-tight flex items-center gap-1.5">
              
              <span>Jadwal Pelajaran {targetSchedule.labelBadge}</span>
            </h3>
          </div>
          <Link 
            href="/parent/dashboard/classroom?tab=jadwal" 
            className="text-xs font-bold text-blue-600 flex items-center gap-0.5 hover:underline"
          >
            Lihat Semua <ChevronRight size={14} />
          </Link>
        </div>

        {/* Day & Date Banner */}
        <div className="flex items-center justify-between mb-3 bg-gradient-to-r from-blue-50 via-indigo-50/70 to-blue-50 px-3.5 py-2.5 rounded-xl shadow-2xs">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-blue-600 shrink-0" />
            <span className="text-xs font-bold text-slate-800" suppressHydrationWarning>
              {targetSchedule.targetDateStr}
            </span>
          </div>
          <span className="text-[10px] font-extrabold text-blue-700 bg-white border border-blue-200/80 px-2.5 py-0.5 rounded-full shadow-2xs">
            {targetSchedule.reasonBadge}
          </span>
        </div>

        {/* Schedule List or Pure Database Empty State */}
        {dbDaySchedules.length > 0 ? (
          <div className="space-y-2.5">
            {dbDaySchedules.slice(0, 6).map((item, idx) => {
              const isRest = (item.name || '').toLowerCase().includes('istirahat');
              const isKegiatan = (item.type || '').toLowerCase() === 'kegiatan' || 
                (item.name || '').toLowerCase().includes('upacara') || 
                (item.name || '').toLowerCase().includes('dhuha');

              const badgeClass = isRest
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : isKegiatan
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : colorPalette[idx % colorPalette.length];

              const timeStart = item.time_start || item.time?.split('-')[0]?.trim() || '07.00';
              const timeEnd = item.time_end || item.time?.split('-')[1]?.trim() || '07.45';
              const teacherName = item.teacher?.name || '';

              // Helper to parse time string (e.g. "07:15", "07.15") to minutes from midnight
              const parseTimeToMin = (tStr?: string | null) => {
                if (!tStr) return null;
                const cleaned = tStr.replace('.', ':').trim();
                const parts = cleaned.split(':');
                if (parts.length < 2) return null;
                const h = parseInt(parts[0], 10);
                const m = parseInt(parts[1], 10);
                if (isNaN(h) || isNaN(m)) return null;
                return h * 60 + m;
              };

              const wibPartsNow = getWIBParts(currentTime || undefined);
              const currentWibMin = wibPartsNow.hours * 60 + wibPartsNow.minutes;
              const startMin = parseTimeToMin(timeStart);
              const endMin = parseTimeToMin(timeEnd);

              // STRICT REALTIME ACTIVE CHECK:
              // Only active if target schedule is TODAY and current WIB time is between start and end
              const isOngoing = Boolean(
                targetSchedule.isToday &&
                startMin !== null &&
                endMin !== null &&
                currentWibMin >= startMin &&
                currentWibMin < endMin
              );

              return (
                <div 
                  key={item.id || `db-sch-${idx}`}
                  className={`rounded-2xl border transition-all ${
                    isOngoing
                      ? 'bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-blue-50/90 border-blue-400 shadow-md ring-2 ring-blue-500/20'
                      : isRest
                      ? 'bg-amber-50/40 border-amber-100'
                      : 'bg-white border-slate-100/90 shadow-[0_2px_8px_rgba(15,23,42,0.03)]'
                  }`}
                >
                  {/* Ongoing Live Status Badge — inside card, top row */}
                  {isOngoing && (
                    <div className="flex items-center px-3 pt-2.5 pb-0">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-ping" />
                        <span>Sedang Berlangsung</span>
                      </span>
                    </div>
                  )}

                  {/* Time + Content Row */}
                  <div className="flex items-center gap-3.5 p-3.5 pt-2">
                    {/* Time Column */}
                    <div className={`flex flex-col items-center justify-center w-12 text-[11px] font-bold rounded-xl py-1.5 shrink-0 border ${
                      isOngoing
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'text-slate-500 bg-slate-50 border-slate-100'
                    }`}>
                      <span>{timeStart}</span>
                      <div className={`w-1.5 h-0.5 my-0.5 rounded-full ${isOngoing ? 'bg-blue-300' : 'bg-slate-300'}`} />
                      <span>{timeEnd}</span>
                    </div>

                    {/* Content Column */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badgeClass}`}>
                          {item.name}
                        </span>
                      </div>
                      {teacherName && !isRest && (
                        <p className="text-xs text-slate-500 mt-1 font-medium truncate flex items-center gap-1 m-0">
                          <UserCircle size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate">{teacherName}</span>
                        </p>
                      )}
                      {isRest && (
                        <p className="text-[11px] text-amber-700 mt-0.5 font-medium m-0">
                          Istirahat & pengisian energi
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Clean & Informative Empty State (No Hardcoded Mock Fallback) */
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(15,23,42,0.04)] text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-500 flex items-center justify-center mx-auto mb-3">
              <CalendarDays size={24} />
            </div>
            <h4 className="text-sm font-extrabold text-slate-800 m-0">
              Belum Ada Jadwal Pelajaran
            </h4>
            <p className="text-xs text-slate-500 mt-1.5 max-w-xs mx-auto leading-relaxed">
              Jadwal pelajaran untuk hari <strong className="text-slate-700">{targetSchedule.dayName}</strong> di kelas <strong className="text-blue-700">{student.className || '-'}</strong> belum diinput ke sistem madrasah.
            </p>
            <div className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] font-semibold text-slate-600">
              <Info size={13} className="text-blue-500 shrink-0" />
              <span>Data otomatis tampil setelah admin/wali kelas mengisi jadwal</span>
            </div>
          </div>
        )}

        {/* Quick Action Button */}
        <Link
          href="/parent/dashboard/classroom?tab=jadwal"
          className="w-full mt-3 py-3.5 px-4 rounded-2xl bg-white border border-blue-200 text-blue-600 hover:bg-blue-50/80 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.98]"
        >
          <span>Buka Menu Jadwal Kelas {student.className}</span>
          <ChevronRight size={14} />
        </Link>
      </div>

      {/* Ample White Space Spacer ensuring the bottom section is completely clear of the floating bottom nav */}
      <div className="h-12 w-full shrink-0" aria-hidden="true" />
    </div>
  );
}
