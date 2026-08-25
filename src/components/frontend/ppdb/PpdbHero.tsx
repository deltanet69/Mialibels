'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, CalendarDays, GraduationCap, Sparkles } from 'lucide-react';

export default function PpdbHero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden bg-mesh-radial">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/student_activity.png"
          alt="PPDB MI Attaqwa 15"
          fill
          priority
          className="object-cover opacity-15 object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#F4F7FC]/90 via-[#F4F7FC]/80 to-[#F4F7FC] z-0" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 py-2 px-5 rounded-full glass-pill text-primary-dark font-body text-xs sm:text-sm font-bold tracking-wider uppercase mb-6 shadow-2xs">
          <CalendarDays className="w-3.5 h-3.5 text-btn-secondary" />
          <span>Tahun Ajaran 2027/2028 · Gelombang 1</span>
        </div>

        {/* Main Title */}
        <h1 className="font-headline font-black text-4xl sm:text-5xl md:text-6xl text-secondary leading-tight tracking-tight max-w-4xl mb-6">
          Penerimaan Peserta Didik Baru <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-500">
            MI Attaqwa 15 Babelan
          </span>
        </h1>

        {/* Subtitle */}
        <p className="font-body text-gray-600 text-base sm:text-lg md:text-xl leading-relaxed max-w-2xl mb-10">
          Bergabunglah dengan MI Attaqwa 15 — madrasah unggulan terakreditasi A yang memadukan ilmu agama, ilmu umum, dan pembiasaan adab islami sejak dini.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            href="/contact"
            className="btn-tactile inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-body text-base font-bold bg-btn-secondary text-white shadow-xl shadow-orange-950/20 hover:shadow-2xl hover:brightness-110 transition-all"
          >
            <GraduationCap className="w-5 h-5" />
            <span>Daftar Sekarang</span>
          </Link>
          <Link
            href="#alur-pendaftaran"
            className="btn-tactile inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-body text-base font-bold bg-white text-secondary shadow-sm border border-slate-200 hover:border-primary hover:text-primary transition-all"
          >
            <span>Lihat Alur &amp; Jadwal</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </Link>
        </div>
      </div>
    </section>
  );
}
