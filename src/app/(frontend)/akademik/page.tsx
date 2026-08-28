import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  BookOpen, 
  Lightbulb, 
  Award, 
  Target, 
  GraduationCap, 
  BookType,
  Star,
  Zap,
  ArrowRight,
  Phone,
  CheckCircle2,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import AnimatedSection from '@/components/frontend/AnimatedSection';
import { getSpmbUrl } from '@/lib/urls';

export const metadata = {
  title: 'Akademik | MI Attaqwa 15 Babelan',
  description: 'Kurikulum Terpadu Berbasis KMA 1503/2025, Program Tahfidz, dan Keunggulan Pembelajaran MI Attaqwa 15 Babelan.',
};

export default function AkademikPage() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      
      {/* Hero Section */}
      <AnimatedSection direction="none" delay={0.1}>
        <section className="relative pt-10 pb-20 lg:pt-10 lg:pb-10 overflow-hidden flex flex-col justify-center bg-mesh-radial">
          {/* Background Image */}
          <div className="absolute inset-0 z-0 opacity-40">
            <Image
              src="/bgheader.png"
              alt="Header Background Akademik"
              fill
              priority
              className="object-cover object-top"
            />
          </div>

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#F4F7FC]/95 via-[#F4F7FC]/80 to-transparent z-0" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#F4F7FC]/30 to-[#F4F7FC] z-0" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 py-2 px-5 rounded-full glass-pill text-primary-dark font-body text-xs sm:text-sm font-bold tracking-wider uppercase mb-5">
              <GraduationCap className="w-3.5 h-3.5 text-accent" />
              <span>Pendidikan & Kurikulum</span>
            </div>
            <h1 className="font-headline font-black text-4xl sm:text-5xl lg:text-6xl mb-4 leading-tight text-secondary">
              Akademik MI Attaqwa 15 <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-500">
                Kurikulum Terpadu & Modern
              </span>
            </h1>
            <p className="font-body text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
              Berbasis Standar KMA 1503/2025 · Integrasi Sains, Agama, dan Karakter Islami Sejak Dini
            </p>
          </div>
        </section>
      </AnimatedSection>

      {/* Sekilas Kurikulum Section */}
      <AnimatedSection direction="up">
        <section className="py-20 lg:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              {/* Left Content */}
              <div className="space-y-6 max-w-2xl lg:max-w-none mx-auto w-full">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-primary-dark font-body text-xs font-bold uppercase tracking-wider">
                  <span>Sekilas Kurikulum</span>
                </div>
                <h2 className="font-headline font-black text-3xl sm:text-4xl text-secondary leading-tight">
                  Standar Kurikulum Terbaru <br className="hidden lg:block"/>
                  Madrasah Ibtidaiyah
                </h2>
                <div className="font-body text-gray-600 space-y-4 text-base leading-relaxed">
                  <p>
                    MI Attaqwa 15 menerapkan <strong>Kurikulum Madrasah berbasis KMA Nomor 1503 Tahun 2025</strong> — standar kurikulum mutakhir untuk madrasah ibtidaiyah yang memadukan keunggulan kompetensi nasional dengan kedalaman ilmu agama Islam.
                  </p>
                  <p>
                    Pendekatan ini memastikan anak didik tidak hanya cakap secara akademik dan teknologi, namun juga memiliki fondasi akhlakul karimah dan kecintaan pada Al-Qur'an.
                  </p>
                </div>
              </div>
              
              {/* Right Cards List */}
              <div className="space-y-4 max-w-2xl lg:max-w-none mx-auto w-full">
                {[
                  {
                    title: 'Kurikulum Nasional',
                    desc: 'Standar kompetensi pendidikan nasional yang menjamin penguasaan literasi, numerasi, dan sains.',
                    icon: <Award className="w-6 h-6 text-teal-600" />,
                    bgIcon: 'bg-teal-50 border-teal-100'
                  },
                  {
                    title: 'Kurikulum Kemenag & Kepesantrenan',
                    desc: 'Pendalaman Al-Qur\'an Hadits, Aqidah Akhlak, Fikih, SKI, dan Bahasa Arab khas Yayasan Attaqwa.',
                    icon: <Star className="w-6 h-6 text-amber-600" />,
                    bgIcon: 'bg-amber-50 border-amber-100'
                  },
                  {
                    title: 'Pengembangan Diri & IT Club',
                    desc: 'Kegiatan ekstrakurikuler berbasis minat, tahfidz intensif, seni Islam, dan pengenalan digital sejak dini.',
                    icon: <Lightbulb className="w-6 h-6 text-emerald-600" />,
                    bgIcon: 'bg-emerald-50 border-emerald-100'
                  }
                ].map((item, idx) => (
                  <div key={idx} className="bg-[#F4F7FC] p-6 rounded-3xl flex gap-5 items-start transition-all duration-300 hover:-translate-y-1 hover:shadow-md border border-white">
                    <div className={`p-3.5 rounded-2xl ${item.bgIcon} border shadow-2xs flex-shrink-0`}>
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-headline font-bold text-xl text-secondary mb-1.5">{item.title}</h3>
                      <p className="font-body text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Keunggulan Akademik Section */}
      <AnimatedSection direction="up">
        <section className="py-20 lg:py-28 bg-[#F4F7FC]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-primary-dark font-body text-xs font-bold uppercase tracking-wider mb-4">
                <span>Keunggulan Pembelajaran</span>
              </div>
              <h2 className="font-headline font-black text-3xl sm:text-4xl text-secondary">
                MENGAPA MEMILIH MI ATTAQWA 15?
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {[
                {
                  title: 'Pembelajaran Aktif & Ceria',
                  desc: 'Metode pembelajaran variatif yang mengkombinasikan diskusi, praktik langsung, dan proyek kreatif agar anak antusias belajar.',
                  icon: <Zap className="w-6 h-6 text-amber-500" />,
                  bgIcon: 'bg-amber-50 border-amber-100'
                },
                {
                  title: 'Pendekatan Personal Guru',
                  desc: 'Rasio guru dan murid yang ideal memastikan setiap anak mendapatkan bimbingan perhatian sesuai gaya belajarnya masing-masing.',
                  icon: <Target className="w-6 h-6 text-teal-600" />,
                  bgIcon: 'bg-teal-50 border-teal-100'
                },
                {
                  title: 'Penguatan Calistung Dasar',
                  desc: 'Program intensif membaca, menulis, dan berhitung di kelas awal sebagai pondasi kokoh sebelum melangkah ke jenjang berikutnya.',
                  icon: <BookType className="w-6 h-6 text-orange-500" />,
                  bgIcon: 'bg-orange-50 border-orange-100'
                },
                {
                  title: 'Hafalan Al-Qur\'an (Tahfidz)',
                  desc: 'Pembiasaan harian membaca dan menghafal Juz 30 serta surat-surat pilihan seperti Yasin, Al-Mulk, dan Ar-Rahman.',
                  icon: <Star className="w-6 h-6 text-emerald-600" />,
                  bgIcon: 'bg-emerald-50 border-emerald-100'
                },
                {
                  title: 'Praktik Ibadah & Adab',
                  desc: 'Praktik langsung wudhu, shalat dhuha/dzuhur berjamaah, doa sehari-hari, dan pembiasaan senyum salam sapa.',
                  icon: <CheckCircle2 className="w-6 h-6 text-indigo-600" />,
                  bgIcon: 'bg-indigo-50 border-indigo-100'
                },
                {
                  title: 'Literasi Digital Sejak Dini',
                  desc: 'Pengenalan komputer, logika dasar pemrograman, dan pemanfaatan teknologi secara positif dan aman bagi anak.',
                  icon: <ShieldCheck className="w-6 h-6 text-blue-600" />,
                  bgIcon: 'bg-blue-50 border-blue-100'
                }
              ].map((item, idx) => (
                <div key={idx} className="bg-white p-7 rounded-3xl shadow-sm border border-gray-100/90 hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1">
                  <div>
                    <div className={`w-13 h-13 ${item.bgIcon} border rounded-2xl flex items-center justify-center mb-5 shadow-2xs`}>
                      {item.icon}
                    </div>
                    <h3 className="font-headline font-bold text-xl text-secondary mb-2.5">{item.title}</h3>
                    <p className="font-body text-gray-500 leading-relaxed text-sm">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* CTA Section */}
      <AnimatedSection direction="up">
        <section className="py-20 lg:py-28 bg-white text-center">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-headline font-black text-3xl sm:text-4xl text-secondary mb-5 leading-tight">
              Ingin Putra-Putri Anda Meraih Pendidikan yang <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-700 to-emerald-600">
                Seimbang Dunia dan Akhirat?
              </span>
            </h2>
            <p className="font-body text-gray-600 text-base sm:text-lg leading-relaxed mb-10 max-w-3xl mx-auto">
              MI Attaqwa 15 siap mencetak generasi shalih yang unggul dalam ilmu umum, teguh dalam iman, dan terampil menghadapi era modern.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={getSpmbUrl()} 
                className="btn-tactile inline-flex items-center justify-center gap-2 bg-gradient-to-r from-btn-secondary via-orange-500 to-amber-500 text-white px-8 py-3.5 sm:py-4 rounded-full font-body text-sm font-bold shadow-xl shadow-orange-950/20 hover:shadow-2xl hover:brightness-110 transition-all w-full sm:w-auto"
              >
                <span>Informasi SPMB &amp; Biaya</span>
                <ArrowRight className="w-5 h-5 ml-1" />
              </Link>
              
              <Link 
                href="/contact" 
                className="btn-tactile w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-body text-base font-bold bg-white text-secondary border-2 border-slate-200 shadow-sm hover:border-primary hover:text-primary transition-all"
              >
                <Phone className="w-4 h-4" />
                <span>Konsultasi Akademik</span>
              </Link>
            </div>
          </div>
        </section>
      </AnimatedSection>

    </div>
  );
}
