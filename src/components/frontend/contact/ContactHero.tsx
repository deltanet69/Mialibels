'use client';

import React from 'react';
import Image from 'next/image';
import { Mail } from 'lucide-react';

export default function ContactHero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden bg-[#EFF3FB]">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/student_activity.png"
          alt="Kontak MI Attaqwa 15"
          fill
          priority
          className="object-cover opacity-20 object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#EFF3FB]/95 via-[#EFF3FB]/90 to-[#EFF3FB] z-0" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white shadow-sm border border-blue-100 mb-8 animate-fade-in-up">
          <Mail className="w-5 h-5 text-btn-secondary" />
          <span className="font-body text-sm font-bold text-secondary tracking-wide uppercase">
            Pusat Informasi
          </span>
        </div>

        {/* Main Title */}
        <h1 className="font-headline font-black text-4xl sm:text-5xl md:text-6xl text-secondary leading-tight tracking-tight max-w-4xl mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          Hubungi Kami <br className="hidden md:block" />
          <span className="text-primary">MI Attaqwa 15 Babelan</span>
        </h1>

        {/* Subtitle */}
        <p className="font-body text-gray-600 text-lg md:text-xl leading-relaxed max-w-2xl animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          Kami siap membantu! Silakan hubungi kami melalui informasi di bawah atau kirimkan pesan langsung melalui formulir kontak.
        </p>
      </div>
    </section>
  );
}
