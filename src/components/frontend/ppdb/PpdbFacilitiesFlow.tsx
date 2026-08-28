'use client';

import React from 'react';
import { 
  Building2, 
  Monitor, 
  BookOpen, 
  Sparkles, 
  HeartHandshake, 
  ShieldCheck, 
  Smile, 
  Coffee, 
  Award,
  Video,
  Activity,
  Flame
} from 'lucide-react';

const FASILITAS_LIST = [
  {
    title: 'Ruang Kelas Interaktif',
    desc: 'Ruang kelas ber-AC, proyektor multimedia, pencahayaan sehat, dan tata ruang ergonomis yang nyaman untuk belajar.',
    icon: Building2,
    tag: 'Sejuk & Nyaman',
    color: 'text-teal-600',
    bg: 'bg-teal-50 border-teal-100',
    hoverBorder: 'hover:border-teal-300'
  },
  {
    title: 'Lab Komputer & IT',
    desc: 'Unit PC modern untuk pembelajaran literasi digital, pengenalan komputer, dan Asesmen Nasional Berbasis Komputer (ANBK).',
    icon: Monitor,
    tag: 'Literasi Digital',
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-100',
    hoverBorder: 'hover:border-blue-300'
  },
  {
    title: 'Mushola Ibadah Santri',
    desc: 'Pusat pembiasaan ibadah harian: Shalat Dhuha & Dzuhur berjamaah, bimbingan tahsin, serta hafalan Al-Qur\'an Juz 30.',
    icon: HeartHandshake,
    tag: 'Pusat Ibadah',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 border-emerald-100',
    hoverBorder: 'hover:border-emerald-300'
  },
  {
    title: 'Perpustakaan Literasi',
    desc: 'Ratusan koleksi buku cerita islami, sains anak, ensiklopedia, dan ruang membaca interaktif yang menyenangkan.',
    icon: BookOpen,
    tag: 'Gemar Membaca',
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-100',
    hoverBorder: 'hover:border-amber-300'
  },
  {
    title: 'Lapangan Olahraga & Upacara',
    desc: 'Area serbaguna untuk olahraga futsal, bulutangkis, senam santri, latihan pramuka, dan apel bendera mingguan.',
    icon: Activity,
    tag: 'Aktivitas Fisik',
    color: 'text-rose-600',
    bg: 'bg-rose-50 border-rose-100',
    hoverBorder: 'hover:border-rose-300'
  },
  {
    title: 'Area Bermain & Ramah Anak',
    desc: 'Halaman bermain luar ruangan yang aman, ramah anak, dan dirancang khusus untuk melatih motorik kasar siswa.',
    icon: Smile,
    tag: 'Playful Space',
    color: 'text-purple-600',
    bg: 'bg-purple-50 border-purple-100',
    hoverBorder: 'hover:border-purple-300'
  },
  {
    title: 'CCTV & Keamanan 24 Jam',
    desc: 'Sistem pengawasan kamera CCTV di seluruh sudut madrasah serta petugas keamanan siaga dengan gerbang satu pintu (One-Gate).',
    icon: ShieldCheck,
    tag: 'Aman Terpantau',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50 border-indigo-100',
    hoverBorder: 'hover:border-indigo-300'
  },
  {
    title: 'Kantin Bersih & UKS Siaga',
    desc: 'Penyediaan jajanan sehat higienis terkurasi serta ruang Usaha Kesehatan Sekolah (UKS) untuk pertolongan medis pertama.',
    icon: Coffee,
    tag: 'Higienis & Sehat',
    color: 'text-cyan-600',
    bg: 'bg-cyan-50 border-cyan-100',
    hoverBorder: 'hover:border-cyan-300'
  }
];

export default function PpdbFacilitiesFlow() {
  return (
    <section className="py-14 sm:py-20 lg:py-24 bg-[#F4F7FC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-6xl mx-auto mb-10 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-primary-dark font-body text-xs font-bold uppercase tracking-wider mb-3.5 sm:mb-4">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Sarana &amp; Prasarana</span>
          </div>
          <h2 className="font-headline font-black text-2xl xs:text-3xl md:text-4xl text-secondary mb-3 sm:mb-4 break-words">
            FASILITAS BELAJAR &amp; LINGKUNGAN MADRASAH
          </h2>
          <p className="font-body text-gray-500 text-sm sm:text-base md:text-lg px-2 leading-relaxed">
            Sarana prasarana modern, aman, dan edukatif dirancang khusus untuk memberikan pengalaman belajar terbaik bagi putra-putri Anda.
          </p>
        </div>

        {/* 8 Bento Facilities Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {FASILITAS_LIST.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx}
                className={`p-6 sm:p-7 rounded-2xl sm:rounded-[2rem] bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group ${item.hoverBorder}`}
              >
                <div>
                  {/* Top Icon & Tag */}
                  <div className="flex items-center justify-between gap-2 mb-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-2xs group-hover:scale-110 transition-transform duration-300 ${item.bg}`}>
                      <Icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    
                  </div>

                  {/* Title & Desc */}
                  <h3 className="font-headline font-bold text-lg sm:text-xl text-secondary mb-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="font-body text-gray-500 text-xs sm:text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                {/* Bottom decorative bar */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[12px] font-semibold text-gray-400">
                  <span>Fasilitas Madarasah</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 group-hover:bg-primary transition-colors" />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
