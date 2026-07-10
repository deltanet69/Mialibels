'use client';

import React from 'react';
import Link from 'next/link';
import { Send, Phone } from 'lucide-react';
import Image from 'next/image';

export default function PpdbCTA() {
  return (
    <section className="relative py-20 lg:py-24 overflow-hidden">
      {/* Background with overlay */}
      <div className="absolute inset-0 z-0 bg-[#002957]">
        <Image
          src="/bgheader.png"
          alt="CTA Background"
          fill
          className="object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#002957] via-[#002957]/80 to-transparent" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
        
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8 animate-bounce">
          <Send className="w-8 h-8 text-btn-secondary" />
        </div>

        <h2 className="font-headline font-black text-3xl md:text-5xl leading-tight mb-6">
          Daftarkan Putra-Putri Anda <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-teal-300">
            Sekarang Juga!
          </span>
        </h2>

        <p className="font-body text-gray-200 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Bergabunglah dengan MI Attaqwa 15 — madrasah unggulan terakreditasi A yang memadukan ilmu agama, ilmu umum, dan keterampilan digital untuk generasi masa depan.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="#daftar-sekarang"
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-full font-body text-base font-bold bg-btn-primary text-white shadow-lg shadow-blue-900/30 transition-all duration-300 hover:bg-white hover:text-primary hover:shadow-xl hover:-translate-y-1"
          >
            Form Pendaftaran Online
          </Link>
          
          <Link
            href="https://wa.me/6281234567890" // Placeholder WhatsApp number
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-full font-body text-base font-bold bg-white/10 text-white border border-white/30 backdrop-blur-sm transition-all duration-300 hover:bg-white/20 hover:border-white/50 hover:-translate-y-1"
          >
            <Phone className="w-5 h-5 mr-2" />
            Hubungi Panitia
          </Link>
        </div>

      </div>

      {/* Decorative circles */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-teal-500/20 blur-3xl" />
    </section>
  );
}
