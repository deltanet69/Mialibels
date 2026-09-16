'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  Mail,
  Phone,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  LogOut,
  KeyRound,
  User,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { StudentProfileData } from './types';
import { ChangePasswordForm } from '@/components/parent/ChangePasswordForm';
import { CardDownloader } from '@/components/portal/students/CardDownloader';

interface ParentProfileMobileProps {
  student: StudentProfileData;
  formatCurrency: (n: number) => string;
}

export function ParentProfileMobile({
  student,
  formatCurrency,
}: ParentProfileMobileProps) {
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const studentInitial = student.name ? student.name.charAt(0).toUpperCase() : 'S';
  const parentInitial = student.parent_name ? student.parent_name.charAt(0).toUpperCase() : 'W';

  return (
    <div className="w-full pb-28 font-sans bg-[#f4f7fb] min-h-screen" style={{ backgroundColor: '#f4f7fb' }}>
      {/* 1. Header Banner (Dashboard Gradient, Spacing, Bell, & School Badge) */}
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
            {/* <div className="flex items-center gap-1.5 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-ping" />
              <p className="text-[10px] font-extrabold tracking-widest uppercase text-blue-200/90 m-0" style={{ color: '#bfdbfe' }}>
                BIODATA SISWA • KELAS {student.class || '1A'}
              </p>
            </div> */}
            <h1 className="text-[22px] font-extrabold text-white tracking-tight leading-snug m-0" style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff' }}>
              Profil Siswa
            </h1>
            <p className="text-xs text-white/80 mt-1 mb-0" style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)' }}>
              Data akademik & biodata resmi {student.name.split(' ')[0]}
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

      {/* 2. THE HERO: KARTU UTAMA SISWA (Floating Card: -mt-14) */}
      <div
        className="-mt-14 px-4 relative z-20"
        style={{ marginTop: '-56px', paddingLeft: '16px', paddingRight: '16px', position: 'relative', zIndex: 20 }}
      >
        <div className="bg-white rounded-2xl p-5 shadow-[0_12px_32px_-6px_rgba(22,51,100,0.12)] border border-slate-100 relative overflow-hidden">
          {/* Subtle Top-right playful accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100/50 via-cyan-50/20 to-transparent rounded-bl-full pointer-events-none" />

          {/* Top Row: Avatar Siswa + Info Utama */}
          <div className="flex items-start gap-4 relative z-10">
            {/* Student Avatar */}
            <div className="relative shrink-0">
              <div
                className="w-16 h-16 rounded-2xl text-white font-black text-2xl flex items-center justify-center shadow-md border-2 border-white"
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #4f46e5 100%)',
                }}
              >
                {studentInitial}
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white shadow-xs">
                <CheckCircle2 size={12} strokeWidth={3} />
              </span>
            </div>

            {/* Student Name & Badges */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                  <GraduationCap size={11} className="text-blue-600" />
                  Kelas {student.class || '1A'}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Siswa Aktif
                </span>
              </div>
              <h2 className="font-black text-slate-900 text-lg leading-tight tracking-tight truncate m-0">
                {student.name}
              </h2>
            </div>
          </div>

          {/* NIS & NISN Identifiers */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-3.5 border-t border-slate-100">
            <div className="bg-slate-50 rounded-2xl p-2.5 border border-slate-100">
              <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider m-0">
                NIS (NOMOR INDUK)
              </p>
              <p className="text-xs font-black text-slate-800 font-mono mt-0.5 m-0 tracking-wide">
                {student.student_number || '01A2026029'}
              </p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-2.5 border border-slate-100">
              <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider m-0">
                NISN (NASIONAL)
              </p>
              <p className="text-xs font-black text-slate-800 font-mono mt-0.5 m-0 tracking-wide">
                {student.nisn || '1923618923'}
              </p>
            </div>
          </div>

          {/* Tombol Download Kartu Siswa & Kartu Ujian */}
          <div className="mt-3.5 pt-3.5 border-t border-slate-100">
            <CardDownloader
              student={student as any}
              sppInvoices={student.sppInvoices}
              variant="rounded-grid"
            />
          </div>
        </div>
      </div>

      {/* 3. BIODATA LENGKAP SISWA (Informatif & Rounded) */}
      <div className="mt-5 px-4">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <div className="flex items-center gap-1.5">
            <User size={14} className="text-blue-600" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 m-0">
              BIODATA LENGKAP SISWA
            </h2>
          </div>
          <span className="text-[10px] font-bold text-slate-400">
            T.A. 2026/2027
          </span>
        </div>

        <div className="bg-white rounded-[26px] p-4.5 border border-slate-100 shadow-[0_4px_20px_-4px_rgba(22,51,100,0.06)] divide-y divide-slate-100">
          <div className="py-2.5 first:pt-0 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Nama Lengkap</span>
            <span className="text-xs font-bold text-slate-800 text-right">{student.name}</span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Tingkat / Kelas</span>
            <span className="text-xs font-bold text-slate-800">Kelas {student.class || '1A'}</span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Jenis Kelamin</span>
            <span className="text-xs font-bold text-slate-800">
              {student.gender === 'L' || student.gender === 'Laki-laki' ? 'Laki-laki' : 'Perempuan'}
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Tempat, Tgl Lahir</span>
            <span className="text-xs font-bold text-slate-800 text-right">
              {student.birth_place ? `${student.birth_place}, ${student.birth_date || ''}` : 'Bekasi, 15 Mei 2019'}
            </span>
          </div>

          <div className="py-2.5 last:pb-0 flex items-start justify-between gap-4">
            <span className="text-xs text-slate-400 font-medium shrink-0">Alamat Siswa</span>
            <span className="text-xs font-bold text-slate-800 text-right">
              {student.address || 'Babelan, Kab. Bekasi'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. DATA WALI MURID (ORANG TUA) - DATA SINGKAT BUKAN DOMINAN */}
      <div className="mt-5 px-4">
        <div className="flex items-center gap-1.5 mb-2.5 px-1">
          <ShieldCheck size={14} className="text-slate-400" />
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 m-0">
            DATA WALI MURID (ORANG TUA)
          </h2>
        </div>

        {/* Compact Parent Card */}
        <div className="bg-white rounded-[26px] p-4.5 border border-slate-100 shadow-[0_4px_20px_-4px_rgba(22,51,100,0.06)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 font-black text-sm flex items-center justify-center shrink-0 border border-blue-100">
              {parentInitial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-xs text-slate-800 m-0 truncate">
                  {student.parent_name || 'Wali Murid'}
                </h4>
                <span className="text-[9px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-full border border-blue-100">
                  Wali Utama
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 m-0 truncate">
                Orang tua dari {student.name}
              </p>
            </div>
          </div>

          <div className="mt-3.5 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
            <a
              href={`https://wa.me/${(student.parent_phone || '').replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold truncate border border-slate-100 transition-colors"
            >
              <Phone size={12} className="text-slate-400 shrink-0" />
              <span className="truncate">{student.parent_phone || '0878-6254-1101'}</span>
            </a>
            <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-slate-50 text-slate-600 font-semibold truncate border border-slate-100">
              <Mail size={12} className="text-slate-400 shrink-0" />
              <span className="truncate">{student.parent_email || 'betadev94@gmail.com'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. KEAMANAN AKUN SECTION (Collapsible Ganti Password) */}
      <div className="mt-5 px-4">
        <div className="bg-white rounded-[26px] border border-slate-100 shadow-[0_4px_20px_-4px_rgba(22,51,100,0.06)] overflow-hidden">
          <button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="w-full p-4.5 flex items-center justify-between text-left hover:bg-slate-50/80 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <KeyRound size={18} />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-800 m-0">Keamanan Akun (Ganti Password)</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 m-0">Kelola kata sandi login portal Anda</p>
              </div>
            </div>
            <span className="text-slate-400 p-1">
              {showPasswordForm ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </span>
          </button>

          {showPasswordForm && (
            <div className="p-4.5 pt-1 border-t border-slate-100 bg-slate-50/50">
              <ChangePasswordForm />
            </div>
          )}
        </div>
      </div>

      {/* 6. TOMBOL KELUAR / LOGOUT */}
      <div className="mt-8 px-4 space-y-4">
        <a
          href="/api/auth/parent-logout"
          className="w-full h-14 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/70 text-[15px] font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
        >
          <LogOut size={18} />
          <span>Keluar dari Akun</span>
        </a>

        <p className="text-center text-[11px] text-slate-400 font-medium m-0 pb-6">
          MI Attaqwa 15 Mobile • Profil Siswa Terpadu
        </p>
      </div>

      {/* Whitespace spacer for Bottom Nav */}
      <div className="h-4 w-full shrink-0" aria-hidden="true" />
    </div>
  );
}
