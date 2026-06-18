import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, Award, BookOpen, HeartHandshake, History, ArrowRight, Phone } from 'lucide-react';
import AnimatedSection from '@/components/frontend/AnimatedSection';

export const metadata = {
  title: 'About Us - MI Attaqwa 15 Babelan',
  description: 'Tentang Madrasah Ibtidaiyah Unggulan MI Attaqwa 15',
};

export default function AboutPage() {
  return (
    <div className="flex flex-col w-full min-h-screen">
      {/* Hero Section */}
      <AnimatedSection direction="none" delay={0.1}>
        <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden flex flex-col justify-center min-h-[500px]">
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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="inline-block py-1.5 px-4 rounded-full bg-white/80 backdrop-blur-sm shadow-sm border border-white/60 text-primary font-body text-sm font-bold tracking-wider uppercase mb-6">
            Tentang MI Attaqwa 15
          </span>
          <h1 className="font-headline font-black text-4xl sm:text-5xl lg:text-6xl leading-tight text-secondary">
            Madrasah Ibtidaiyah Unggulan<br className="hidden md:block" />
            <span className="text-primary text-3xl">Terakreditasi A</span> <span className="text-gray-600 text-3xl">· Berbasis Nilai Perjuangan</span>
          </h1>
        </div>
      </section>
      </AnimatedSection>

      {/* Tentang Sekolah Section */}
      <AnimatedSection direction="up">
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <span className="font-body text-sm font-bold text-accent tracking-wider uppercase flex items-center gap-2">
                <HeartHandshake className="w-5 h-5" />
                Tentang Sekolah
              </span>
              <h2 className="font-headline font-black text-3xl sm:text-4xl text-secondary">
                Pendidikan Islam Berkualitas untuk Generasi Unggul
              </h2>
              <div className="font-body text-gray-600 space-y-4 text-base leading-relaxed">
                <p>
                  MI Attaqwa 15 adalah madrasah swasta di bawah naungan Yayasan Attaqwa — yayasan pendidikan Islam terbesar di Bekasi yang didirikan oleh Pahlawan Nasional KH. Noer Alie. Berlokasi di Jl. Raya Pasar Babelan, Kecamatan Babelan, Kabupaten Bekasi, madrasah ini telah melayani pendidikan sejak 1 Januari 1970.
                </p>
                <p>
                  Dengan NPSN 60709253 dan predikat Akreditasi A (Unggul) berdasarkan SK No. 763/BAN-SM/SK/2019, MI Attaqwa 15 menjadi pilihan utama masyarakat Babelan dan sekitarnya yang menginginkan pendidikan Islam berkualitas tanpa meninggalkan penguasaan ilmu umum dan teknologi.
                </p>
                <p>
                  Sebagai bagian dari ekosistem Yayasan Attaqwa yang mengelola puluhan lembaga pendidikan — mulai dari TK/RA, MI/SDIT, MTs/SMP, hingga MA/SMA dan pesantren — MI Attaqwa 15 mewarisi semangat "pesantren perjuangan" yang mengedepankan ketekunan, keikhlasan, kemandirian, dan cinta tanah air.
                </p>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src="/images/classroom_view.png"
                alt="Siswa MI Attaqwa 15"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>
      </AnimatedSection>

      {/* Sejarah Singkat */}
      <AnimatedSection direction="up">
      <section className="py-20 lg:py-28 bg-[#EFF3FB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="font-body text-sm font-bold text-accent tracking-wider uppercase flex items-center justify-center gap-2 mb-4">
              <History className="w-5 h-5" />
              Jejak Langkah
            </span>
            <h2 className="font-headline font-black text-3xl sm:text-4xl text-secondary">
              Sejarah Singkat Kami
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <span className="font-headline font-bold text-2xl text-primary">1950</span>
              </div>
              <p className="font-body text-gray-600 leading-relaxed text-sm">
                Perjalanan MI Attaqwa 15 tidak bisa dilepaskan dari sejarah panjang Yayasan Attaqwa yang lahir dari sebuah masjid sederhana di Kampung Ujungharapan, pada tahun 1950-an oleh KH. Noer Alie sebagai wadah perjuangan mencerdaskan anak bangsa.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mb-6">
                <span className="font-headline font-bold text-2xl text-accent">1970</span>
              </div>
              <p className="font-body text-gray-600 leading-relaxed text-sm">
                Seiring perkembangan zaman dan meningkatnya kebutuhan masyarakat akan pendidikan dasar Islam yang berkualitas, Yayasan Attaqwa kemudian mendirikan MI Attaqwa 15 pada tahun 1970 yang berlokasi strategis di pusat Kecamatan Babelan.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center mb-6">
                <span className="font-headline font-bold text-2xl text-green-600">Kini</span>
              </div>
              <p className="font-body text-gray-600 leading-relaxed text-sm">
                Hingga saat ini, MI Attaqwa 15 terus berkomitmen mencetak generasi yang beriman, berilmu, berakhlak mulia, dan siap menghadapi era digital — tanpa meninggalkan akar budaya dan nilai-nilai perjuangan para pendahulu.
              </p>
            </div>
          </div>
        </div>
      </section>
      </AnimatedSection>

      {/* Visi Misi */}
      <AnimatedSection direction="up">
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Visi */}
            <div className="bg-[#002957] p-10 lg:p-14 rounded-[2rem] text-white relative overflow-hidden shadow-2xl h-full flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>

              <div className="relative z-10 flex flex-col justify-center">
                <h3 className="font-headline font-black text-3xl mb-8 flex items-center gap-4">
                  <span className="p-3 bg-white/10 rounded-xl">🌟</span>
                  Visi
                </h3>
                <blockquote className="font-body text-2xl lg:text-3xl leading-snug font-medium text-white/90">
                  "Terwujudnya generasi yang shalih, cerdas, berdaya saing, dan berkarakter pejuang berdasarkan nilai-nilai Islam Ahlussunnah Wal Jamaah"
                </blockquote>
              </div>
            </div>

            {/* Misi */}
            <div className="flex flex-col justify-center h-full">
              <h3 className="font-headline font-black text-3xl text-secondary mb-8 flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-primary" />
                Misi
              </h3>
              <ul className="space-y-6">
                {[
                  'Menyelenggarakan pendidikan Islam yang berkualitas dengan kurikulum terpadu antara ilmu agama dan ilmu umum.',
                  'Membentuk peserta didik yang berakhlak mulia melalui pembiasaan ibadah, adab sehari-hari, dan keteladanan guru.',
                  'Mengembangkan potensi akademik dan non-akademik siswa melalui pembelajaran aktif, kreatif, dan menyenangkan.',
                  'Membekali keterampilan abad 21 berupa kemampuan berpikir logis, literasi digital, dan pengenalan coding & AI sejak dini.',
                  'Menanamkan nilai-nilai perjuangan dan cinta tanah air sebagaimana warisan KH. Noer Alie.',
                  'Mewujudkan lingkungan madrasah yang ramah anak, religius, dan berwawasan lingkungan.'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <div className="mt-1 bg-primary/10 p-1.5 rounded-full flex-shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-body text-gray-700 leading-relaxed">{item}</span>
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
      <section className="py-20 lg:py-28 bg-[#EFF3FB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">

            {/* Prestasi */}
            <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm flex flex-col">
              <h3 className="font-headline font-black text-2xl text-secondary mb-8 flex items-center gap-3">
                <Award className="w-8 h-8 text-accent" />
                Prestasi & Penghargaan
              </h3>
              <ul className="space-y-5 flex-1">
                {[
                  'Akreditasi A (Unggul) dari BAN-SM (2019)',
                  'Madrasah unggulan tingkat Kabupaten Bekasi (multiple years)',
                  'Juara lomba MAPSI (Mata Pelajaran Pendidikan Agama Islam dan Seni) tingkat kecamatan',
                  'Madrasah dengan partisipasi PPDB tertinggi di Kecamatan Babelan'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-accent flex-shrink-0"></div>
                    <span className="font-body text-gray-700 font-medium leading-tight">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Fasilitas */}
            <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-sm flex flex-col">
              <h3 className="font-headline font-black text-2xl text-secondary mb-8 flex items-center gap-3">
                <span className="text-3xl">🏢</span>
                Fasilitas Pendukung
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-5 flex-1">
                {[
                  'Ruang kelas nyaman (20-25 siswa)',
                  'Perpustakaan mini',
                  'Laboratorium komputer (Coding & AI)',
                  'Mushola sekolah',
                  'Lapangan upacara & olahraga',
                  'Kantin sehat',
                  'Area bermain yang aman'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-100 h-full">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="font-body text-sm font-semibold text-gray-700 leading-tight">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </section>
      </AnimatedSection>

      {/* CTA Section */}
      <AnimatedSection direction="up">
      <section className="py-20 lg:py-28 bg-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-headline font-black text-3xl sm:text-4xl text-secondary mb-6">
            Jadikan putra-putri Anda bagian dari <br className="hidden md:block" />
            <span className="text-primary">generasi unggul MI Attaqwa 15</span>
          </h2>
          <p className="font-body text-gray-600 text-lg leading-relaxed mb-10 max-w-3xl mx-auto">
            Dengan biaya terjangkau, pendidikan berkualitas, dan lingkungan yang mendukung tumbuh kembang anak secara holistik — kami siap mencetak generasi yang tidak hanya pintar secara akademik, tetapi juga kuat secara spiritual dan siap menghadapi masa depan digital.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/ppdb"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-full font-body text-base font-bold bg-primary text-white shadow-lg transition-all duration-300 hover:bg-[#E67A00] hover:-translate-y-1 hover:shadow-xl"
            >
              Daftar Sekarang
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>

            <Link
              href="/contact"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-full font-body text-base font-bold bg-white text-secondary border-2 border-secondary/20 shadow-sm transition-all duration-300 hover:border-secondary hover:bg-gray-50"
            >
              <Phone className="w-5 h-5 mr-2" />
              Hubungi Kami
            </Link>
          </div>
        </div>
      </section>
      </AnimatedSection>

    </div>
  );
}
