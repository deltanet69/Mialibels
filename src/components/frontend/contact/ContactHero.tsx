'use client';

import React from 'react';
import Image from 'next/image';
import { Mail, Clock, Sparkles } from 'lucide-react';

export default function ContactHero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden bg-mesh-radial">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/student_activity.png"
          alt="Kontak MI Attaqwa 15"
          fill
          priority
          className="object-cover opacity-15 object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#F4F7FC]/90 via-[#F4F7FC]/80 to-[#F4F7FC] z-0" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 py-2 px-5 rounded-full glass-pill text-primary-dark font-body text-xs sm:text-sm font-bold tracking-wider uppercase mb-6 shadow-2xs">
          <Mail className="w-3.5 h-3.5 text-btn-secondary" />
          <span>Layanan Informasi &amp; Konsultasi</span>
        </div>

        {/* Main Title */}
        <h1 className="font-headline font-black text-4xl sm:text-5xl md:text-6xl text-secondary leading-tight tracking-tight max-w-4xl mb-4">
          Hubungi Kami <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-500">
            MI Attaqwa 15 Babelan
          </span>
        </h1>

        {/* Subtitle */}
        <p className="font-body text-gray-600 text-base sm:text-lg md:text-xl leading-relaxed max-w-2xl">
          Kami siap membantu memberikan penjelasan terkait pendaftaran, kurikulum, maupun informasi madrasah lainnya.
        </p>

        {/* Jam Kerja TU */}
        <div className="mt-8 inline-flex items-center gap-3.5 bg-white/90 backdrop-blur-md px-6 py-3.5 rounded-full border border-gray-100 shadow-2xs">
          <div className="w-9 h-9 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-teal-700" />
          </div>
          <div className="text-left">
            <p className="font-headline font-bold text-xs text-secondary">Jam Pelayanan Tata Usaha (TU)</p>
            <p className="font-body text-xs text-gray-500 font-medium mt-0.5">Senin – Jumat : 08.00 – 14.00 WIB</p>
          </div>
        </div>
      </div>
    </section>
  );
}
