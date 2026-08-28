'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Send, Smartphone, CheckCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { getSpmbUrl } from '@/lib/urls';

export default function CtaBanner() {
  return (
    <section className="relative w-full py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-[#002957] via-[#0f2744] to-[#004d40] py-16 sm:py-20 px-6 sm:px-12 lg:px-16 shadow-2xl border border-white/10 text-center flex flex-col items-center">
          
          {/* Subtle Background Classroom Texture */}
          <div className="absolute inset-0 z-0 opacity-15 mix-blend-overlay pointer-events-none">
            <Image
              src="/blue.jpg"
              alt="Digitalisasi Madrasah"
              fill
              className="object-cover"
            />
          </div>

          {/* Decorative Radial Ambient Glows */}
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-teal-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Content Wrapper */}
          <div className="relative z-10 max-w-5xl flex flex-col items-center space-y-6">
            
            {/* Playful Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-accent font-body text-xs sm:text-sm font-bold tracking-widest uppercase shadow-sm">
              <Smartphone className="w-4 h-4 text-accent" />
              <span>Digitalisasi Madrasah Terpadu</span>
            </div>

            {/* Heading */}
            <h2 className="font-headline font-black text-4xl sm:text-4xl md:text-5xl text-white leading-tight">
              Sistem Informasi & Manajemen <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-emerald-200 to-amber-300">
                Madrasah Berbasis Digital Modern
              </span>
            </h2>

            {/* Description */}
            <p className="font-body text-slate-200 text-base sm:text-lg max-w-4xl leading-relaxed font-normal">
              Mempermudah orang tua dalam monitoring kehadiran siswa secara realtime, pencatatan tabungan transparan, dan laporan capaian akademik siswa.
            </p>

            {/* Micro Feature Highlights */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-white text-xs font-semibold">
                <CheckCircle className="w-3.5 h-3.5 text-teal-300" />
                <span>Presensi Digital Real-time</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-white text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                <span>Transparansi Keuangan Siswa</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-white text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                <span>Portal Wali Murid</span>
              </div>
            </div>

            {/* High-Impact CTA Button */}
            <div className="pt-4">
              <Link
                href={getSpmbUrl()}
                className="btn-tactile inline-flex items-center justify-center gap-3 px-12 py-4 rounded-full font-body text-base font-extrabold bg-gradient-to-r from-btn-secondary via-orange-500 to-amber-500 text-white shadow-xl shadow-orange-950/30 hover:shadow-2xl hover:brightness-110 transition-all"
              >
                <Send className="w-5 h-5" />
                <span>Daftar SPMB Online</span>
              </Link>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
