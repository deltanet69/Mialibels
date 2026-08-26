'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, Heart, Star, Sparkles, Shield, Compass } from 'lucide-react';

const values = [
  {
    title: 'Religius',
    desc: 'Pembiasaan ibadah dan tahfidz Al-Qur\'an setiap hari.',
    icon: Star,
    color: 'from-teal-500 to-emerald-500',
    light: 'bg-teal-50 text-teal-700 border-teal-100',
  },
  {
    title: 'Disiplin',
    desc: 'Membangun komitmen waktu dan tata tertib teruji.',
    icon: Shield,
    color: 'from-blue-600 to-indigo-500',
    light: 'bg-blue-50 text-blue-700 border-blue-100',
  },
  {
    title: 'Berakhlak',
    desc: 'Meneladani akhlak mulia dan adab santun khas pesantren.',
    icon: Heart,
    color: 'from-rose-500 to-pink-500',
    light: 'bg-rose-50 text-rose-700 border-rose-100',
  },
  {
    title: 'Berprestasi',
    desc: 'Aktif berprestasi di bidang akademik, sains, dan seni.',
    icon: Compass,
    color: 'from-amber-500 to-orange-500',
    light: 'bg-orange-50 text-orange-700 border-orange-100',
  },
];

export default function AboutSection() {
  return (
    <section className="py-20 lg:py-28 bg-[#F4F7FC] relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-teal-300/10 rounded-full blur-3xl -translate-y-1/2 -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Image Collage with Floating Stats */}
          <div className="lg:col-span-6 flex flex-col space-y-6 relative">
            
            {/* Main Classroom Image */}
            <div className="relative w-full aspect-[16/10] rounded-[2rem] overflow-hidden shadow-xl border-4 border-white group">
              <Image
                src="/mialibels9.jpg"
                alt="Ruang Kelas MI Attaqwa 15"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-5 right-5 text-white">
                <span className="font-headline font-bold text-lg block">MI Attaqwa 15 Babelan</span>
                <span className="font-body text-xs text-slate-200">Kapasitas ideal & lingkungan belajar ramah anak</span>
              </div>
            </div>

            {/* Overlapping Secondary Image with Floating Stat Badge */}
            <div className="relative w-full max-w-[480px] aspect-[16/10] rounded-[2rem] overflow-hidden shadow-xl border-4 border-white self-center lg:-mt-10 z-10 group">
              <Image
                src="/mialibels8.jpg"
                alt="Gedung MI Attaqwa 15"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent" />
            </div>

            {/* Floating Milestone Badge */}
            <div className="absolute -bottom-4 right-2 sm:right-6 z-20 glass-pill p-4 sm:p-5 rounded-2xl shadow-xl border border-teal-200 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center font-headline font-black text-xl shadow-md">
                50+
              </div>
              <div className="flex flex-col">
                <span className="font-headline font-bold text-secondary text-sm sm:text-base leading-tight">
                  Tahun Pengabdian
                </span>
                <span className="font-body text-teal-700 text-xs font-semibold">
                  Mencetak Generasi Berakhlak
                </span>
              </div>
            </div>

          </div>

          {/* Right Column: Text Content & Playful Value Cards */}
          <div className="lg:col-span-6 flex flex-col items-start space-y-6 lg:pl-6">
            
            {/* Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-primary-dark font-body text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>Tentang Madrasah Kami</span>
            </div>

            {/* Title */}
            <h2 className="font-headline font-black text-3xl sm:text-4xl lg:text-5xl text-secondary leading-tight">
              Mendidik dengan Hati, <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-700 to-emerald-600">
                Membangun Karakter Juara
              </span>
            </h2>

            {/* Paragraph */}
            <p className="font-body text-gray-600 leading-relaxed text-sm sm:text-base">
              MI Attaqwa 15 Babelan merupakan madrasah ibtidaiyah unggulan di bawah naungan Yayasan Attaqwa. Kami memadukan kurikulum nasional dan nilai keagamaan berbasis pesantren perjuangan KH. Noer Alie untuk melahirkan insan kamil yang cerdas dan berakhlakul karimah.
            </p>

            {/* 4 Playful Value Grid */}
            <div className="w-full pt-2">
              <h3 className="font-headline font-bold text-base text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                Landasan Nilai Karakter Siswa:
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {values.map((val) => {
                  const Icon = val.icon;
                  return (
                    <div
                      key={val.title}
                      className="p-3.5 rounded-2xl bg-white border border-gray-100 shadow-xs flex items-start gap-3 transition-all duration-300 hover:shadow-md hover:border-teal-200"
                    >
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${val.color} text-white flex items-center justify-center flex-shrink-0 shadow-xs`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-headline font-bold text-sm text-secondary">
                          {val.title}
                        </h4>
                        <p className="font-body text-gray-500 text-xs leading-snug mt-0.5">
                          {val.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-3 w-full sm:w-auto">
              <Link
                href="/about"
                className="btn-tactile w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-body text-sm sm:text-base font-bold bg-btn-primary text-white shadow-lg shadow-blue-950/15 hover:bg-[#001d3d] hover:shadow-xl transition-all"
              >
                <span>Selengkapnya Tentang Kami</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
