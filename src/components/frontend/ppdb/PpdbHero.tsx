'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, CalendarDays, GraduationCap } from 'lucide-react';

export default function PpdbHero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden bg-[#EFF3FB]">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/student_activity.png"
          alt="PPDB MI Attaqwa 15"
          fill
          priority
          className="object-cover opacity-20 object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#EFF3FB]/95 via-[#EFF3FB]/90 to-[#EFF3FB] z-0" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white shadow-sm border border-blue-100 mb-8 animate-fade-in-up">
          <CalendarDays className="w-5 h-5 text-btn-secondary" />
          <span className="font-body text-sm font-bold text-secondary tracking-wide uppercase">
            Tahun Ajaran 2027/2028
          </span>
        </div>

        {/* Main Title */}
        <h1 className="font-headline font-black text-4xl sm:text-5xl md:text-6xl text-secondary leading-tight tracking-tight max-w-4xl mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          Penerimaan Peserta Didik Baru <br className="hidden md:block" />
          <span className="text-primary">MI Attaqwa 15 Babelan</span>
        </h1>

        {/* Subtitle */}
        <p className="font-body text-gray-600 text-lg md:text-xl leading-relaxed max-w-2xl mb-10 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          Bergabunglah dengan MI Attaqwa 15 — madrasah unggulan terakreditasi A yang memadukan ilmu agama, ilmu umum, dan keterampilan digital.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <Link
            href="#daftar-sekarang"
            className="inline-flex items-center justify-center px-8 py-4 rounded-full font-body text-base font-bold bg-btn-primary text-white shadow-lg shadow-blue-900/20 transition-all duration-300 hover:bg-[#001d3d] hover:shadow-xl hover:-translate-y-0.5"
          >
            <GraduationCap className="w-5 h-5 mr-2" />
            Daftar Sekarang
          </Link>
          <Link
            href="#alur-pendaftaran"
            className="inline-flex items-center justify-center px-8 py-4 rounded-full font-body text-base font-bold bg-white text-secondary shadow-md border border-gray-100 transition-all duration-300 hover:bg-gray-50 hover:shadow-lg hover:-translate-y-0.5"
          >
            Lihat Alur Pendaftaran
            <ChevronRight className="w-5 h-5 ml-1 text-gray-400" />
          </Link>
        </div>
      </div>
    </section>
  );
}
