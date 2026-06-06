'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Award, MapPin, ArrowRight } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 pb-20 lg:pt-32 lg:pb-28 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/bgheader.png"
          alt="Header Background MI Attaqwa 15"
          fill
          priority
          className="object-cover"
        />
      </div>

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#EFF3FB]/90 via-[#EFF3FB]/70 to-[#EFF3FB]/30 z-0" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#EFF3FB]/60 z-0" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* Left Column: Text & CTA */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-6 lg:pr-8">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm border border-white/60">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <span className="font-body text-xs font-bold text-primary tracking-wider uppercase">
                MI Attaqwa 15 Babelan
              </span>
            </div>

            {/* Main Title */}
            <h1 className="font-headline font-black text-4xl sm:text-5xl md:text-6xl text-secondary leading-tight tracking-tight">
              Membangun Generasi Islami yang{' '}
              <span className="text-primary">
                Cerdas, Berakhlak,
              </span>{' '}
              dan{' '}
              <span className="text-btn-secondary">
                Berprestasi
              </span>
            </h1>

            {/* Subtitle */}
            <p className="font-body text-gray-600 text-lg leading-relaxed max-w-xl">
              Menanamkan nilai-nilai islami, pengetahuan, dan akhlakul karimah sejak dini untuk membentuk generasi masa depan yang unggul.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-2">
              <Link
                href="/about"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-full font-body text-base font-bold bg-btn-primary text-white shadow-lg shadow-blue-900/20 transition-all duration-300 hover:bg-[#001d3d] hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
              >
                Profil Sekolah
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                href="/ppdb"
                className="inline-flex items-center justify-center px-8 py-3.5  font-body text-base font-bold  transition-all duration-300"
              >
                PPDB Tahun Ajaran 2027
              </Link>
            </div>

            {/* Address Info */}
            <div className="flex items-center gap-2.5 pt-2 text-gray-600 font-body text-sm bg-white/60 backdrop-blur-sm px-4 py-2.5 rounded-xl border border-white/50">
              <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="font-medium">
                Jl. Raya Pasar Babelan RT.05/RW.01, Kec. Babelan, Bekasi, Jawa Barat
              </span>
            </div>

          </div>

          {/* Right Column: Image Collage */}
          <div className="lg:col-span-5 relative flex justify-center items-center w-full min-h-[400px] sm:min-h-[500px]">

            {/* Main Floating Image 1 (Students) */}
            <div className="absolute left-4 top-4 w-[200px] sm:w-[240px] aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border-4 border-white z-10 rotate-[-2deg] transition-transform duration-500 hover:scale-105 hover:z-20">
              <Image
                src="/images/student_activity.png"
                alt="Siswa MI Attaqwa 15"
                fill
                priority
                className="object-cover"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-10">
                <span className="font-headline font-bold text-white text-sm block">
                  MI ATTAQWA 15
                </span>
                <span className="font-body text-gray-300 text-xs block">
                  Babelan, Bekasi
                </span>
              </div>
            </div>

            {/* Main Floating Image 2 (Graduation) */}
            <div className="absolute right-4 bottom-4 w-[200px] sm:w-[240px] aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border-4 border-white z-0 rotate-[3deg] transition-transform duration-500 hover:scale-105 hover:z-20">
              <Image
                src="/images/graduation_day.png"
                alt="Kelulusan MI Attaqwa 15"
                fill
                priority
                className="object-cover"
              />
            </div>

            {/* Floating Badge */}
            <div className="absolute bottom-[20%] left-[28%] sm:left-[33%] z-20 bg-white/95 backdrop-blur-sm px-5 py-3.5 rounded-2xl shadow-xl border border-yellow-100 flex items-center gap-3 transition-transform duration-300 hover:scale-105">
              <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center flex-shrink-0">
                <Award className="w-6 h-6 text-yellow-600 animate-bounce" />
              </div>
              <div className="flex flex-col">
                <span className="font-headline font-bold text-secondary text-sm">
                  MIA 15 Juara Umum
                </span>
                <span className="font-body text-gray-500 text-xs font-semibold">
                  Tahun Ajaran 2026
                </span>
              </div>
            </div>

            {/* Decorative Glow */}
            <div className="absolute w-[300px] h-[300px] rounded-full bg-primary/10 blur-3xl -z-10" />
            <div className="absolute w-[200px] h-[200px] rounded-full bg-btn-secondary/15 blur-3xl -z-10 bottom-0 right-0" />

          </div>

        </div>
      </div>
    </section>
  );
}
