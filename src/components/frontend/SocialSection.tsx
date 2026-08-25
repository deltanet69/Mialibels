'use client';

import React from 'react';
import Script from 'next/script';
import { Sparkles } from 'lucide-react';

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export default function SocialSection() {
  return (
    <section className="py-20 lg:py-28 bg-white overflow-hidden relative">
      {/* Background glow decoration */}
      <div className="absolute top-1/3 right-0 w-80 h-80 bg-pink-300/10 rounded-full blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center flex flex-col items-center space-y-3 mb-12 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-50 border border-pink-100 text-pink-700 font-body text-xs font-bold uppercase tracking-wider">
            <InstagramIcon className="w-3.5 h-3.5 text-pink-600" />
            <span>Galeri & Update Sosial Media</span>
          </div>
          <h2 className="font-headline font-black text-3xl sm:text-4xl text-secondary">
            KONTEN & KEGIATAN SISWA DI INSTAGRAM
          </h2>
          <p className="font-body text-gray-500 text-sm sm:text-base max-w-xl">
            Ikuti dokumentasi keseruan belajar, hafalan Al-Qur'an, dan prestasi siswa MI Attaqwa 15 setiap hari.
          </p>
        </div>

        {/* Juicer.io Feed Embed Container */}
        <div className="w-full min-h-[480px] mb-10 p-2 sm:p-4 rounded-3xl bg-slate-50/60 border border-gray-100 shadow-xs">
          <ul className="juicer-feed" data-feed-id="miattaqwa15"></ul>
          
          <Script 
            src="https://www.juicer.io/embed/miattaqwa15/embed-code.js" 
            strategy="lazyOnload" 
          />
        </div>

        {/* Visit Instagram Button */}
        <div className="flex justify-center">
          <a
            href="https://instagram.com/miattaqwa15.babelan"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-tactile inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full font-body text-base font-bold text-white bg-gradient-to-r from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] shadow-xl shadow-pink-500/20 hover:shadow-2xl hover:shadow-pink-500/30 hover:brightness-105 transition-all"
          >
            <InstagramIcon className="w-5 h-5" />
            <span>Kunjungi Instagram @miattaqwa15.babelan</span>
          </a>
        </div>

      </div>
    </section>
  );
}
