import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, Award, BookOpen, HeartHandshake, History, ArrowRight, Phone, Sparkles, Shield, Building2 } from 'lucide-react';
import AnimatedSection from '@/components/frontend/AnimatedSection';

export const metadata = {
  title: 'Tentang Kami | MI Attaqwa 15 Babelan',
  description: 'Profil, Visi, Misi, dan Fasilitas Madrasah Ibtidaiyah Unggulan MI Attaqwa 15 Babelan Kota.',
};

export default function AboutPage() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      {/* Hero Section */}
      <AnimatedSection direction="none" delay={0.1}>
        <section className="relative pt-32 pb-20 lg:pt-30 lg:pb-28 overflow-hidden flex flex-col justify-center min-h-[460px] bg-mesh-radial">
          {/* Background Image */}
          <div className="absolute inset-0 z-0 opacity-40">
            <Image
              src="/bgheader.png"
              alt="Header Background MI Attaqwa 15"
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
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>Profil MI Attaqwa 15</span>
            </div>
            <h1 className="font-headline font-black text-4xl sm:text-5xl lg:text-6xl leading-tight text-secondary">
              Madrasah Ibtidaiyah Unggulan <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-500">
                Berbasis Nilai Perjuangan
              </span>
            </h1>
            <p className="font-body text-gray-600 text-base sm:text-lg max-w-2xl mx-auto mt-4">
              Mendidik generasi shalih, cerdas, berdaya saing, dan berakhlakul karimah sejak tahun 1970 di Babelan, Bekasi.
            </p>
          </div>
        </section>
      </AnimatedSection>

      {/* Tentang Sekolah Section */}
      <AnimatedSection direction="up">
        <section className="py-20 lg:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left Content */}
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-primary-dark font-body text-xs font-bold uppercase tracking-wider">
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  <span>Mengenal Sekolah Kami</span>
                </div>
                <h2 className="font-headline font-black text-3xl sm:text-4xl text-secondary leading-tight">
                  Pendidikan Islam Berkualitas untuk Generasi Unggul
                </h2>
                <div className="font-body text-gray-600 space-y-4 text-base leading-relaxed">
                  <p>
                    MI Attaqwa 15 adalah madrasah swasta di bawah naungan Yayasan Attaqwa — yayasan pendidikan Islam terbesar di Bekasi yang didirikan oleh Pahlawan Nasional <strong>KH. Noer Alie</strong>. Berlokasi di Jl. Raya Pasar Babelan, Kecamatan Babelan, Kabupaten Bekasi, madrasah ini telah melayani pendidikan sejak 1 Januari 1970.
                  </p>
                  <p>
                    Dengan NPSN <strong>60709253</strong> dan predikat <strong>Akreditasi A (Unggul)</strong> berdasarkan SK No. 763/BAN-SM/SK/2019, MI Attaqwa 15 menjadi pilihan utama masyarakat yang menginginkan pendidikan Islam berkualitas tanpa meninggalkan penguasaan ilmu umum dan literasi digital.
                  </p>
                  <p>
                    Kami mewarisi semangat "pesantren perjuangan" yang mengedepankan ketekunan, keikhlasan, kemandirian, dan cinta tanah air untuk mencetak lulusan yang siap menyongsong masa depan.
                  </p>
                </div>
              </div>

              {/* Right Image */}
              <div className="relative w-full aspect-[4/3] rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white group">
                <Image
                  src="/mialibels6.jpg"
                  alt="Siswa MI Attaqwa 15"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <span className="font-headline font-bold text-lg block drop-shadow-sm">MI Attaqwa 15 Babelan</span>
                  <span className="font-body text-xs text-slate-200">Interaktif, Islami, dan Menyenangkan</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Sejarah Singkat */}
      <AnimatedSection direction="up">
        <section className="py-20 lg:py-28 bg-[#F4F7FC]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-primary-dark font-body text-xs font-bold uppercase tracking-wider mb-4">
                <History className="w-3.5 h-3.5 text-accent" />
                <span>Jejak Langkah & Sejarah</span>
              </div>
              <h2 className="font-headline font-black text-3xl sm:text-4xl text-secondary">
                SEJARAH SINGKAT KAMI
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100/90 hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1">
                <div>
                  <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center mb-6 border border-teal-100">
                    <span className="font-headline font-black text-2xl text-teal-700">1950</span>
                  </div>
                  <h3 className="font-headline font-bold text-xl text-secondary mb-3">Fondasi Yayasan</h3>
                  <p className="font-body text-gray-600 leading-relaxed text-sm">
                    Perjalanan bermula dari perjuangan KH. Noer Alie di Kampung Ujungharapan pada era 1950-an, mendirikan wadah pendidikan untuk mencerdaskan anak bangsa.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-50 text-xs font-semibold text-teal-600">
                  Awal Perjuangan Attaqwa
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100/90 hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1">
                <div>
                  <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mb-6 border border-orange-100">
                    <span className="font-headline font-black text-2xl text-btn-secondary">1970</span>
                  </div>
                  <h3 className="font-headline font-bold text-xl text-secondary mb-3">Pendirian MI Attaqwa 15</h3>
                  <p className="font-body text-gray-600 leading-relaxed text-sm">
                    Menjawab kebutuhan masyarakat Babelan akan pendidikan dasar Islam berkualitas, didirikanlah MI Attaqwa 15 di lokasi strategis pusat Pasar Babelan.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-50 text-xs font-semibold text-btn-secondary">
                  50+ Tahun Mengabdi
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100/90 hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1">
                <div>
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 border border-blue-100">
                    <span className="font-headline font-black text-2xl text-blue-700">Kini</span>
                  </div>
                  <h3 className="font-headline font-bold text-xl text-secondary mb-3">Era Madrasah Digital</h3>
                  <p className="font-body text-gray-600 leading-relaxed text-sm">
                    MI Attaqwa 15 konsisten berinovasi dengan mengintegrasikan kurikulum KMA 1503/2025, sistem informasi digital terpadu, dan pembinaan karakter berkelanjutan.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-50 text-xs font-semibold text-blue-600">
                  Unggul & Berdaya Saing
                </div>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Visi Misi */}
      <AnimatedSection direction="up">
        <section className="py-20 lg:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
              
              {/* Visi Card */}
              <div className="lg:col-span-5 bg-gradient-to-br from-[#002957] via-[#0f2744] to-[#004d40] p-8 lg:p-12 rounded-[2.5rem] text-white relative overflow-hidden shadow-xl flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-accent font-body text-xs font-bold uppercase tracking-wider mb-6">
                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                    <span>Visi Utama</span>
                  </div>
                  <h3 className="font-headline font-black text-3xl mb-6">
                    Visi Madrasah
                  </h3>
                  <blockquote className="font-body text-xl lg:text-2xl leading-relaxed font-normal text-white/95 italic">
                    "Terwujudnya generasi yang shalih, cerdas, berdaya saing, dan berkarakter pejuang berdasarkan nilai-nilai Islam Ahlussunnah Wal Jamaah."
                  </blockquote>
                </div>

                <div className="relative z-10 pt-8 border-t border-white/10 text-xs text-slate-300 font-semibold">
                  MI Attaqwa 15 Babelan
                </div>
              </div>

              {/* Misi Card */}
              <div className="lg:col-span-7 bg-[#F4F7FC] p-8 lg:p-12 rounded-[2.5rem] border border-gray-100 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-primary-dark font-body text-xs font-bold uppercase tracking-wider w-fit mb-4">
                  <BookOpen className="w-3.5 h-3.5 text-primary" />
                  <span>Misi Strategis</span>
                </div>
                <h3 className="font-headline font-black text-3xl text-secondary mb-6">
                  Misi Madrasah
                </h3>
                <ul className="space-y-4">
                  {[
                    'Menyelenggarakan pendidikan Islam berkualitas dengan kurikulum terpadu antara ilmu agama dan ilmu umum.',
                    'Membentuk peserta didik berakhlak mulia melalui pembiasaan ibadah, tahfidz, dan keteladanan guru.',
                    'Mengembangkan potensi akademik dan non-akademik siswa melalui pembelajaran aktif dan kreatif.',
                    'Membekali literasi digital dan keterampilan abad 21 sejak dini.',
                    'Menanamkan nilai-nilai perjuangan dan cinta tanah air warisan KH. Noer Alie.',
                    'Mewujudkan lingkungan madrasah ramah anak, religius, dan berwawasan lingkungan.'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3.5">
                      <div className="mt-1 bg-teal-100/80 p-1.5 rounded-xl flex-shrink-0 text-teal-700">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span className="font-body text-gray-700 text-sm sm:text-base leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* Prestasi & Fasilitas */}
      <AnimatedSection direction="up">
        <section className="py-20 lg:py-28 bg-[#F4F7FC]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">

              {/* Prestasi */}
              <div className="bg-white rounded-[2rem] p-8 lg:p-10 shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-headline font-black text-2xl text-secondary">
                        Prestasi & Akreditasi
                      </h3>
                      <span className="font-body text-xs text-gray-400">Mutu terbukti & terakreditasi</span>
                    </div>
                  </div>

                  <ul className="space-y-4">
                    {[
                      'Akreditasi Unggul dari BAN-SM No. 763/BAN-SM/SK/2019',
                      'Madrasah Ibtidaiyah Unggulan tingkat Kabupaten Bekasi',
                      'Juara Umum Festival Anak Sholeh & Lomba MAPSI ',
                      'Partisipasi dan peminat PPDB tertinggi di Kecamatan Babelan'
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50/70 border border-gray-100">
                        <div className="w-2.5 h-2.5 rounded-full bg-accent flex-shrink-0 mt-1.5" />
                        <span className="font-body text-gray-700 text-sm font-semibold leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Fasilitas */}
              <div className="bg-white rounded-[2rem] p-8 lg:p-10 shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-headline font-black text-2xl text-secondary">
                        Fasilitas Pendukung
                      </h3>
                      <span className="font-body text-xs text-gray-400">Sarana prasarana modern & aman</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      'Ruang Kelas Representatif',
                      'Perpustakaan Mini Sekolah',
                      'Lab Komputer & Digital',
                      'Mushola Sekolah',
                      'Lap Olahraga & Upacara',
                      'Kantin Sehat & Higienis',
                      'Area Bermain Ramah Anak'
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2.5 bg-slate-50/70 p-3 rounded-2xl border border-gray-100">
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="font-body text-xs sm:text-sm font-semibold text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* CTA Section */}
      <AnimatedSection direction="up">
        <section className="py-20 lg:py-28 bg-white text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-headline font-black text-3xl sm:text-4xl text-secondary mb-5">
              Jadikan Putra-Putri Anda Bagian dari <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-700 to-emerald-600">
                Generasi Unggul MI Attaqwa 15
              </span>
            </h2>
            <p className="font-body text-gray-600 text-base sm:text-lg leading-relaxed mb-10 max-w-3xl mx-auto">
              Dengan biaya terjangkau, fasilitas memadai, dan pendidik berdedikasi tinggi — kami siap membina potensi anak secara holistik.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/ppdb"
                className="btn-tactile w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-body text-base font-bold bg-btn-secondary text-white shadow-lg shadow-orange-950/20 hover:shadow-xl hover:brightness-110 transition-all"
              >
                <span>Daftar PPDB Online</span>
                <ArrowRight className="w-5 h-5 ml-1" />
              </Link>

              <Link
                href="/contact"
                className="btn-tactile w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-body text-base font-bold bg-white text-secondary border-2 border-slate-200 shadow-sm hover:border-primary hover:text-primary transition-all"
              >
                <Phone className="w-4 h-4" />
                <span>Hubungi Panitia</span>
              </Link>
            </div>
          </div>
        </section>
      </AnimatedSection>

    </div>
  );
}
