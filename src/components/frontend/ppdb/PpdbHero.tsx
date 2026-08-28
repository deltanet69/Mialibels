'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, CalendarDays, GraduationCap, Sparkles, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

export default function PpdbHero() {
  const ppdbUrl = process.env.NODE_ENV === 'development' ? 'http://ppdb.localhost:3000' : 'https://ppdb.miattaqwa15.sch.id';

  return (
    <section className="relative pt-10 pb-20 sm:pt-36 sm:pb-20 lg:pt-20 lg:pb-20 overflow-hidden bg-mesh-radial">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/student_activity.png"
          alt="SPMB MI Attaqwa 15"
          fill
          priority
          className="object-cover opacity-15 object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#F4F7FC]/90 via-[#F4F7FC]/80 to-[#F4F7FC] z-0" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 sm:gap-2 py-1.5 sm:py-2 px-3.5 sm:px-5 rounded-full glass-pill text-primary-dark font-body text-[11px] sm:text-xs md:text-sm font-bold tracking-wider uppercase mb-5 sm:mb-6 shadow-2xs max-w-full text-center">
          <CalendarDays className="w-3.5 h-3.5 text-btn-secondary shrink-0" />
          <span className="truncate">Tahun Ajaran 2027/2028 · Dibuka Mulai Bulan Oktober</span>
        </div>

        {/* Main Title */}
        <h1 className="font-headline font-black text-4xl xs:text-4xl sm:text-4xl md:text-5xl lg:text-6xl text-secondary leading-tight tracking-tight max-w-6xl mb-4 sm:mb-6 break-words">
          Sistem Penerimaan Murid Baru <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-500">
            MI Attaqwa 15 Babelan
          </span>
        </h1>

        {/* Subtitle */}
        <p className="font-body text-gray-600 text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed max-w-4xl mb-6 sm:mb-8 px-2">
          Bergabunglah dengan MI Attaqwa 15 — madrasah unggulan terakreditasi A yang memadukan ilmu agama, ilmu umum, dan pembiasaan adab islami sejak dini.
        </p>

        {/* Key Metric Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-8 sm:mb-10 max-w-4xl">
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/80 backdrop-blur-md border border-white/80 shadow-2xs text-sm font-semibold text-gray-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Usia Min. 6 Thn 5 Bln</span>
          </div>
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/80 backdrop-blur-md border border-white/80 shadow-2xs text-sm font-semibold text-gray-700">
            <GraduationCap className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Biaya Formulir Rp 300.000</span>
          </div>
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/80 backdrop-blur-md border border-white/80 shadow-2xs text-sm font-semibold text-gray-700">
            <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
            <span>Kuota Terbatas 120 Siswa</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto px-2 sm:px-0">
          <a
            href={ppdbUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-tactile inline-flex items-center justify-center gap-2 px-8 sm:px-10 py-3.5 sm:py-4 rounded-full font-body text-sm sm:text-base font-bold bg-btn-secondary text-white shadow-xl shadow-orange-950/20 hover:shadow-2xl hover:brightness-110 transition-all text-center w-full sm:w-auto"
          >
            <GraduationCap className="w-5 h-5 shrink-0" />
            <span>Daftar SPMB Online</span>
            <ArrowRight className="w-4 h-4 ml-1 shrink-0" />
          </a>
          <Link
            href="#petunjuk-pendaftaran"
            className="btn-tactile inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-body text-sm sm:text-base font-bold bg-white text-secondary shadow-sm border border-slate-200 hover:border-primary hover:text-primary transition-all text-center w-full sm:w-auto"
          >
            <span>Petunjuk Pendaftaran</span>
            <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
          </Link>
        </div>
      </div>
    </section>
  );
}
