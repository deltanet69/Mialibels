'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Award, ArrowRight, Sparkles, ShieldCheck, Users, BookOpen } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative min-h-[92vh] lg:min-h-screen flex items-center justify-center pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden bg-mesh-radial">
      {/* Background Image with soft opacity */}
      <div className="absolute inset-0 z-0 opacity-40">
        <Image
          src="/bgheader.png"
          alt="Header Background MI Attaqwa 15"
          fill
          priority
          className="object-cover object-top"
        />
      </div>

      {/* Modern gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#F4F7FC]/95 via-[#F4F7FC]/80 to-transparent z-0" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#F4F7FC]/30 to-[#F4F7FC] z-0" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* Left Column: Text & CTA */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-6 lg:pr-6">

            {/* Playful Pill Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full glass-pill text-secondary">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
              </span>
              <span className="font-body text-xs font-bold tracking-wide uppercase text-primary-dark">
                MI Attaqwa 15 Babelan
              </span>
              <span className="hidden sm:inline-block text-gray-300">|</span>
              <span className="hidden sm:inline-flex items-center gap-1 font-body text-xs font-semibold text-gray-600">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                Akreditasi A Unggul
              </span>
            </div>

            {/* Main Title */}
            <h1 className="font-headline font-black text-4xl sm:text-5xl md:text-6xl text-secondary leading-[1.15] tracking-tight">
              Membangun Generasi Islami yang{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-500 underline decoration-teal-300/40 underline-offset-8">
                Cerdas, Berakhlak,
              </span>{' '}
              dan{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
                Berprestasi
              </span>
            </h1>

            {/* Subtitle */}
            <p className="font-body text-gray-600 text-base sm:text-lg leading-relaxed max-w-2xl font-normal">
              Menanamkan nilai-nilai keislaman Ahlussunnah Wal Jamaah, keilmuan mutakhir, dan karakter pejuang sejak dini untuk membentuk generasi masa depan yang berdaya saing global.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto pt-2">
              <Link
                href="/about"
                className="btn-tactile inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-body text-base font-bold bg-btn-primary text-white shadow-xl shadow-blue-950/20 hover:bg-[#001d3d] hover:shadow-2xl transition-all"
              >
                <span>Profil Madrasah</span>
                <ArrowRight className="w-5 h-5 ml-1" />
              </Link>
              <Link
                href="/ppdb"
                className="btn-tactile inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-body text-base font-bold text-btn-secondary bg-white/90 backdrop-blur-md border-2 border-btn-secondary/30 shadow-md shadow-orange-950/5 hover:bg-orange-50 hover:border-btn-secondary transition-all"
              >
                <Sparkles className="w-4 h-4 text-btn-secondary" />
                <span>PPDB 2027/2028</span>
              </Link>
            </div>

            {/* Quick Feature Chips */}
            <div className="pt-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/60 border border-white/80 shadow-xs text-xs font-semibold text-gray-600">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>Kurikulum Terpadu</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/60 border border-white/80 shadow-xs text-xs font-semibold text-gray-600">
                <BookOpen className="w-4 h-4 text-accent" />
                <span>Tahfidz & Karakter</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/60 border border-white/80 shadow-xs text-xs font-semibold text-gray-600">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Madrasah Digital</span>
              </div>
            </div>

          </div>

          {/* Right Column: Dynamic Image Collage with playful floating badges */}
          <div className="lg:col-span-5 relative flex justify-center items-center w-full min-h-[420px] sm:min-h-[500px]">

            {/* Main Floating Image 1 (Students) */}
            <div className="absolute left-3 top-4 w-[210px] sm:w-[290px] aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border-4 border-white z-10 rotate-[-3deg] transition-all duration-500 hover:scale-105 hover:rotate-0 hover:z-20">
              <Image
                src="/images/student_activity.png"
                alt="Siswa MI Attaqwa 15"
                fill
                priority
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="font-headline font-bold text-sm block drop-shadow-sm">
                  Aktif & Ceria
                </span>
                <span className="font-body text-gray-200 text-xs block">
                  Pembelajaran Interaktif
                </span>
              </div>
            </div>

            {/* Main Floating Image 2 (Graduation) */}
            <div className="absolute right-2 bottom-3 w-[200px] sm:w-[280px] aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border-4 border-white z-0 rotate-[4deg] transition-all duration-500 hover:scale-105 hover:rotate-0 hover:z-20">
              <Image
                src="/images/graduation_day.png"
                alt="Kelulusan MI Attaqwa 15"
                fill
                priority
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="font-headline font-bold text-sm block drop-shadow-sm">
                  Lulusan Terbaik
                </span>
                <span className="font-body text-gray-200 text-xs block">
                  Berakhlak & Berprestasi
                </span>
              </div>
            </div>

            {/* Floating Playful Badge 1 (Award) */}
            <div className="absolute top-[18%] right-[-10px] sm:right-[-20px] z-20 glass-pill px-4 py-2.5 rounded-2xl shadow-xl border border-yellow-200/80 flex items-center gap-3 transition-transform duration-300 hover:scale-105">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-headline font-bold text-secondary text-sm leading-tight">
                  Juara Umum MAPSI
                </span>
                <span className="font-body text-gray-500 text-[11px] font-semibold">
                  Tingkat Kecamatan
                </span>
              </div>
            </div>

            {/* Floating Playful Badge 2 (Digital Madrasah) */}
            <div className="absolute bottom-[8%] left-[-10px] sm:left-[-15px] z-20 glass-pill px-4 py-2.5 rounded-2xl shadow-xl border border-teal-200/80 flex items-center gap-3 transition-transform duration-300 hover:scale-105">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center flex-shrink-0 shadow-sm text-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-headline font-bold text-secondary text-sm leading-tight">
                  Portal Digital
                </span>
                <span className="font-body text-teal-700 text-[11px] font-semibold">
                  Monitoring Real-time
                </span>
              </div>
            </div>

            {/* Decorative Ambient Glows */}
            <div className="absolute w-[320px] h-[320px] rounded-full bg-teal-400/15 blur-3xl -z-10" />
            <div className="absolute w-[240px] h-[240px] rounded-full bg-orange-400/15 blur-3xl -z-10 bottom-0 right-0" />

          </div>

        </div>
      </div>
    </section>
  );
}
