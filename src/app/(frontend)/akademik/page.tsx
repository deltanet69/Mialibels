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
  CheckCircle2
} from 'lucide-react';
import AnimatedSection from '@/components/frontend/AnimatedSection';

export const metadata = {
  title: 'Akademik - MI Attaqwa 15 Babelan',
  description: 'Kurikulum Terpadu Berbasis KMA 1503/2025 di MI Attaqwa 15',
};

export default function AkademikPage() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      
      {/* Hero Section */}
      <AnimatedSection direction="none" delay={0.1}>
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden flex flex-col justify-center min-h-[500px]">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/bgheader.png"
            alt="Header Background Akademik"
            fill
            priority
            className="object-cover"
          />
        </div>

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#EFF3FB]/90 via-[#EFF3FB]/70 to-[#EFF3FB]/30 z-0" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#EFF3FB]/60 z-0" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="inline-block py-1.5 px-4 rounded-full bg-white/80 backdrop-blur-sm shadow-sm border border-white/60 text-primary font-body text-sm font-bold tracking-wider uppercase mb-6">
            Akademik
          </span>
          <h1 className="font-headline font-black text-4xl sm:text-5xl lg:text-6xl mb-6 leading-tight text-secondary">
            Akademik MI Attaqwa 15<br className="hidden md:block" />
            <span className="text-primary">Kurikulum Terpadu</span>
          </h1>
          <p className="font-body text-gray-600 text-lg sm:text-xl max-w-2xl mx-auto font-medium">
            Berbasis KMA 1503/2025 · Siap Menghadapi Era Digital
          </p>
        </div>
      </section>
      </AnimatedSection>

      {/* Sekilas Kurikulum Section */}
      <AnimatedSection direction="up">
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <span className="font-body text-sm font-bold text-accent tracking-wider uppercase flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Sekilas Kurikulum
              </span>
              <h2 className="font-headline font-black text-3xl sm:text-4xl text-secondary leading-tight">
                Standar Kurikulum Terbaru <br className="hidden lg:block"/>
                Madrasah Ibtidaiyah
              </h2>
              <div className="font-body text-gray-600 space-y-4 text-base leading-relaxed">
                <p>
                  MI Attaqwa 15 menerapkan <strong>Kurikulum Madrasah berbasis KMA Nomor 1503 Tahun 2025</strong> — standar kurikulum terbaru untuk madrasah ibtidaiyah yang memadukan tiga komponen utama.
                </p>
                <p>
                  Pendekatan ini memastikan siswa tidak hanya unggul dalam ilmu umum, tetapi juga kuat dalam pemahaman agama, serta memiliki keterampilan abad 21 yang relevan.
                </p>
              </div>
            </div>
            
            {/* Right List */}
            <div className="space-y-4">
              {[
                {
                  title: 'Kurikulum Nasional',
                  desc: 'Berbasis standar nasional pendidikan yang menjamin kesetaraan kompetensi.',
                  icon: <Award className="w-6 h-6 text-primary" />
                },
                {
                  title: 'Kurikulum Khas Madrasah',
                  desc: 'Pendalaman ilmu agama Islam sebagai pondasi karakter dan spiritual siswa.',
                  icon: <Star className="w-6 h-6 text-accent" />
                },
                {
                  title: 'Kokurikuler',
                  desc: 'Pembelajaran mendalam berbasis proyek untuk melatih problem solving.',
                  icon: <Lightbulb className="w-6 h-6 text-green-500" />
                }
              ].map((item, idx) => (
                <div key={idx} className="bg-[#EFF3FB] p-6 rounded-3xl flex gap-5 items-start transition-all duration-300 hover:-translate-y-1 hover:shadow-md border border-white">
                  <div className="p-3 bg-white rounded-2xl shadow-sm flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-xl text-secondary mb-2">{item.title}</h3>
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
      <section className="py-20 lg:py-28 bg-[#EFF3FB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="font-body text-sm font-bold text-accent tracking-wider uppercase flex items-center justify-center gap-2 mb-4">
              <GraduationCap className="w-5 h-5" />
              Keunggulan Akademik
            </span>
            <h2 className="font-headline font-black text-3xl sm:text-4xl text-secondary">
              Mengapa Memilih MI Attaqwa 15?
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Pembelajaran Aktif & Menyenangkan',
                desc: 'Kami menggunakan metode pembelajaran yang bervariasi: ceramah interaktif, diskusi kelompok, praktik langsung, bermain sambil belajar, dan proyek kolaboratif. Setiap siswa didorong untuk aktif bertanya, berpikir kritis, dan menemukan sendiri pemahamannya.',
                icon: <Zap className="w-7 h-7 text-yellow-500" />,
                bgIcon: 'bg-yellow-50'
              },
              {
                title: 'Pendekatan Individual',
                desc: 'Dengan rasio guru-siswa yang ideal (maksimal 25 siswa per kelas), setiap anak mendapat perhatian yang cukup. Guru mengenali gaya belajar, kelebihan, dan kelemahan masing-masing siswa — sehingga pembelajaran bisa disesuaikan.',
                icon: <Target className="w-7 h-7 text-primary" />,
                bgIcon: 'bg-blue-50'
              },
              {
                title: 'Penguatan Literasi & Numerasi',
                desc: 'Program khusus membaca, menulis, dan berhitung (Calistung) intensif di kelas 1-2 memastikan fondasi akademik yang kuat sebelum memasuki jenjang lebih tinggi.',
                icon: <BookType className="w-7 h-7 text-accent" />,
                bgIcon: 'bg-orange-50'
              },
              {
                title: 'Hafalan Al-Qur\'an (Tahfidz)',
                desc: 'Setiap hari siswa dibiasakan membaca dan menghafal juz \'amma serta surat-surat pilihan. Target minimal hafalan saat lulus: Juz 30 (surat An-Naba s/d An-Nas) ditambah surat-surat pilihan seperti Yasin, Al-Mulk, dan Ar-Rahman.',
                icon: <Star className="w-7 h-7 text-green-500" />,
                bgIcon: 'bg-green-50'
              },
              {
                title: 'Praktik Ibadah Langsung',
                desc: 'Pembelajaran Fikih tidak hanya teori. Siswa praktik langsung wudhu, shalat, puasa sunnah, dan doa sehari-hari di bawah bimbingan guru.',
                icon: <CheckCircle2 className="w-7 h-7 text-purple-500" />,
                bgIcon: 'bg-purple-50'
              }
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 flex flex-col">
                <div className={`w-14 h-14 ${item.bgIcon} rounded-2xl flex items-center justify-center mb-6`}>
                  {item.icon}
                </div>
                <h3 className="font-headline font-bold text-xl text-secondary mb-4">{item.title}</h3>
                <p className="font-body text-gray-600 leading-relaxed text-sm flex-1">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      </AnimatedSection>

      {/* CTA Section */}
      <AnimatedSection direction="up">
      <section className="py-20 lg:py-28 bg-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-headline font-black text-3xl sm:text-4xl text-secondary mb-6 leading-tight">
            Ingin putra-putri Anda mendapatkan pendidikan yang <br className="hidden md:block" />
            <span className="text-primary">seimbang antara dunia dan akhirat?</span>
          </h2>
          <p className="font-body text-gray-600 text-lg leading-relaxed mb-10 max-w-3xl mx-auto">
            MI Attaqwa 15 adalah jawabannya. Dengan kurikulum terpadu, akreditasi A, keunggulan coding & AI, serta lingkungan yang religius dan ramah anak — kami siap mencetak generasi yang cerdas, berakhlak mulia, dan siap menghadapi masa depan.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/ppdb" 
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-full font-body text-base font-bold bg-primary text-white shadow-lg transition-all duration-300 hover:bg-[#E67A00] hover:-translate-y-1 hover:shadow-xl"
            >
              Lihat Biaya & Pendaftaran
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            
            <Link 
              href="/contact" 
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-full font-body text-base font-bold bg-white text-secondary border-2 border-secondary/20 shadow-sm transition-all duration-300 hover:border-secondary hover:bg-gray-50"
            >
              <Phone className="w-5 h-5 mr-2" />
              Konsultasi Akademik
            </Link>
          </div>
        </div>
      </section>
      </AnimatedSection>

    </div>
  );
}
