'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Lock, User, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { ParentLoginProps } from './types';

export function ParentLoginMobile({
  nis,
  setNis,
  password,
  setPassword,
  loading,
  error,
  handleLogin,
}: ParentLoginProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex lg:hidden min-h-screen flex-col bg-white select-none">
      
      {/* 1. TOP HEADER WITH BRANDING BLUE GRADIENT & CIRCULAR LOGO */}
      <div 
        className="relative w-full overflow-hidden text-white flex flex-col justify-between bg-gradient-to-b from-[#0d3880] via-[#1557bf] to-[#1d6bf0]"
        style={{ minHeight: '300px' }}
      >
        {/* Subtle Ambient Background Light */}
        <div 
          className="absolute -top-10 -right-10 w-52 h-52 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)' }}
        />

        {/* Center Content: Circular Badge + App Name */}
        <div className="relative z-10 flex flex-col items-center pt-12 pb-8 px-6 text-center">
          {/* Circular Logo Badge (Matching Reference) */}
          <div className="w-20 h-20 bg-white rounded-full shadow-lg p-3 flex items-center justify-center mb-4">
            <Image 
              src="/logosmart/smartlogo.png" 
              alt="Logo SMART MI Attaqwa 15" 
              width={56} 
              height={56}
              className="object-contain"
              priority
            />
          </div>

          <h1 className="text-2xl font-bold text-white tracking-tight">
            MI Attaqwa 15
          </h1>
          <p className="text-sm text-blue-100 font-medium mt-1">
            Pantau Akademik & Administrasi Ananda
          </p>
        </div>

        {/* Multi-layered Cloud Wave Cut (Matching Reference Exactly) */}
        <div className="relative w-full leading-none z-10 -mb-[1px]">
          <svg 
            viewBox="0 0 1440 180" 
            className="w-full h-46 block" 
            preserveAspectRatio="none"
          >
            {/* Back Cloud Layer */}
            <path 
              d="M0,70 C180,120 320,40 520,75 C720,110 880,45 1080,75 C1240,100 1360,55 1440,70 L1440,180 L0,180 Z" 
              fill="#ffffff" 
              fillOpacity="0.28" 
            />
            {/* Mid Cloud Layer */}
            <path 
              d="M0,95 C150,55 350,125 580,85 C810,45 990,120 1200,85 C1320,65 1390,95 1440,90 L1440,180 L0,180 Z" 
              fill="#ffffff" 
              fillOpacity="0.45" 
            />
            {/* Front Solid White Cloud Layer */}
            <path 
              d="M0,120 C160,85 320,135 520,105 C720,75 920,140 1140,105 C1260,85 1360,115 1440,110 L1440,180 L0,180 Z" 
              fill="#ffffff" 
            />
          </svg>
        </div>
      </div>

      {/* 2. WHITE FORM SECTION (Matching Reference "Create your account" style) */}
      <div className="flex-1 bg-white px-8 pt-10 pb-10 w-full max-w-md mx-auto flex flex-col justify-between">
        
        <div>
          {/* Title */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Masuk ke Akun Anda
            </h2>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 animate-in fade-in duration-200">
              <AlertCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-rose-800">Login Gagal</h4>
                <p className="text-sm text-rose-600 font-medium mt-1 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            {/* Input 1: ID Siswa / NIS */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                ID Siswa (NIS/NISN)
              </label>
              <div className="flex items-center h-14 px-5 bg-slate-100 rounded-2xl border border-transparent focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-200">
                <User size={20} className="text-slate-400 mr-3 shrink-0" />
                <input 
                  type="text" 
                  required
                  value={nis}
                  onChange={(e) => setNis(e.target.value)}
                  className="w-full h-full bg-transparent outline-none text-base text-slate-800 font-medium placeholder:text-slate-400"
                  placeholder="Masukkan ID Siswa / NIS"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Input 2: Kata Sandi */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Kata Sandi
              </label>
              <div className="flex items-center h-14 px-5 bg-slate-100 rounded-2xl border border-transparent focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-200">
                <Lock size={20} className="text-slate-400 mr-3 shrink-0" />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-full bg-transparent outline-none text-base text-slate-800 font-medium placeholder:text-slate-400"
                  placeholder="Masukkan kata sandi"
                  disabled={loading}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 p-2 shrink-0 ml-1 rounded-full focus:outline-none focus:bg-slate-200 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Checkbox & Forgot Password Row */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  defaultChecked
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 accent-blue-600 cursor-pointer" 
                />
                <span className="text-sm text-slate-600 font-medium">Ingat saya</span>
              </label>
              <Link 
                href="/contact" 
                className="text-sm text-blue-600 font-semibold hover:underline"
              >
                Lupa Sandi?
              </Link>
            </div>

            {/* Primary Action Button */}
            <div className="pt-4">
              <button 
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer bg-gradient-to-b from-blue-500 to-blue-700 shadow-[0_8px_20px_-4px_rgba(37,99,235,0.4)]"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <span>Masuk</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer Link */}
        <div className="mt-8 text-center pb-4">
          <p className="text-sm text-slate-500 font-medium">
            Belum memiliki akun?{' '}
            <Link href="/contact" className="text-blue-600 font-bold hover:underline">
              Hubungi Madrasah
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
