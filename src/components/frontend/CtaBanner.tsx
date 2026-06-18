'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AppWindow, Send } from 'lucide-react';

export default function CtaBanner() {
  return (
    <section className="relative w-full py-24 md:py-28 overflow-hidden bg-[#002957]">
      {/* Background Image with Dark Blue Overlay */}
      <div className="absolute inset-0 z-0 opacity-20">
        <Image
          src="/images/classroom_view.png"
          alt="Latar Belakang Digitalisasi Madrasah"
          fill
          className="object-cover"
        />
      </div>

      {/* Radial Premium Glow */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent to-[#002957]/95 z-0" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center space-y-6">
        
        {/* Badge/Tag */}
        <span className="font-body text-xs sm:text-sm font-bold text-[#F26430] bg-[#F26430]/10 px-4 py-2 rounded-full border border-[#F26430]/20 tracking-widest uppercase">
          Digitalisasi Madrasah
        </span>

        {/* Heading */}
        <h2 className="font-headline font-black text-3xl sm:text-4xl md:text-5xl text-white max-w-3xl leading-tight">
          System Pengelolaan Madrasah Berbasis Digital
        </h2>

        {/* Description (Optional but adds premium spacing) */}
        <p className="font-body text-gray-300 text-base max-w-xl leading-relaxed">
          Mempermudah administrasi, monitoring akademik, dan transparansi keuangan tabungan siswa secara waktu nyata.
        </p>

        {/* CTA Button */}
        <div className="pt-4">
          <Link
            href="/ppdb"
            className="inline-flex items-center justify-center px-10 py-4 rounded-full font-body text-base font-extrabold bg-[#F26430] text-white shadow-xl shadow-orange-950/20 transition-all duration-300 hover:bg-[#e05320] hover:shadow-orange-950/40 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Send className="w-5 h-5 mr-2" />
            PPDB Online Klik Di Sini
          </Link>
        </div>

      </div>
    </section>
  );
}
