import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  CheckCircle2, 
  Award, 
  BookOpen, 
  HeartHandshake, 
  History, 
  ArrowRight, 
  Phone, 
  Sparkles, 
  Shield, 
  Building2,
  Trophy,
  Users,
  Target,
  Compass,
  Monitor,
  Smile,
  ShieldCheck,
  Star,
  Quote,
  GraduationCap
} from 'lucide-react';
import { getSpmbUrl } from '@/lib/urls';
import AnimatedSection from '@/components/frontend/AnimatedSection';

export const metadata = {
  title: 'Tentang Kami | MI Attaqwa 15 Babelan',
  description: 'Profil, Visi, Misi, Prestasi, dan Fasilitas Madrasah Ibtidaiyah Unggulan MI Attaqwa 15 Babelan Kota.',
};

const SEJARAH_STEPS = [
  {
    year: '1950',
    title: 'Fondasi Nilai Perjuangan',
    desc: 'Perjalanan bermula dari perjuangan Pahlawan Nasional KH. Noer Alie mendirikan wadah pendidikan Islam berasaskan keikhlasan dan kemandirian.',
    tag: 'Awal Perjuangan',
    border: 'hover:border-teal-300',
    badgeBg: 'bg-teal-50 text-teal-800 border-teal-100',
    yearColor: 'text-teal-700'
  },
  {
    year: '1970',
    title: 'Pendirian MI Attaqwa 15',
    desc: 'Didirikan untuk menjawab kebutuhan masyarakat Babelan akan pendidikan dasar Islam bermutu di lokasi strategis pusat Pasar Babelan.',
    tag: '50+ Tahun Mengabdi',
    border: 'hover:border-amber-300',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-100',
    yearColor: 'text-amber-600'
  },
  {
    year: 'Kini',
    title: 'Era Madrasah Digital',
    desc: 'MI Attaqwa 15 terus bertransformasi dengan mengintegrasikan kurikulum KMA 1503/2025, teknologi pembelajaran, dan sistem digital terpadu.',
    tag: 'Akreditasi A Unggul',
    border: 'hover:border-blue-300',
    badgeBg: 'bg-blue-50 text-blue-800 border-blue-100',
    yearColor: 'text-blue-700'
  }
];

const MISI_ITEMS = [
  {
    number: '01',
    title: 'Kurikulum Integratif',
    desc: 'Menyelenggarakan pendidikan berkualitas memadukan ilmu agama, sains, dan kurikulum nasional KMA 1503/2025.',
    icon: BookOpen,
    bg: 'bg-teal-50/80 border-teal-100',
    color: 'text-teal-700'
  },
  {
    number: '02',
    title: 'Pembiasaan Karakter Islami',
    desc: 'Membina akhlak mulia melalui shalat dhuha/dzuhur berjamaah, hafalan Juz 30, dan keteladanan harian.',
    icon: HeartHandshake,
    bg: 'bg-emerald-50/80 border-emerald-100',
    color: 'text-emerald-700'
  },
  {
    number: '03',
    title: 'Pembelajaran Aktif & Kreatif',
    desc: 'Mengembangkan potensi akademik dan non-akademik siswa melalui metode belajar interaktif yang ramah anak.',
    icon: Star,
    bg: 'bg-amber-50/80 border-amber-100',
    color: 'text-amber-700'
  },
  {
    number: '04',
    title: 'Literasi Digital Sejak Dini',
    desc: 'Membekali keterampilan teknologi, komputer modern, dan kecakapan era abad 21 secara bijak dan bertanggung jawab.',
    icon: Monitor,
    bg: 'bg-blue-50/80 border-blue-100',
    color: 'text-blue-700'
  },
  {
    number: '05',
    title: 'Jiwa Pejuang & Cinta Tanah Air',
    desc: 'Menanamkan nilai kegigihan, keikhlasan, dan patriotisme warisan pendiri Yayasan Attaqwa KH. Noer Alie.',
    icon: ShieldCheck,
    bg: 'bg-indigo-50/80 border-indigo-100',
    color: 'text-indigo-700'
  },
  {
    number: '06',
    title: 'Lingkungan Asri & Ramah Anak',
    desc: 'Mewujudkan ekosistem madrasah yang hijau, aman, nyaman, toleran, dan bebas dari tindakan perundungan.',
    icon: Smile,
    bg: 'bg-purple-50/80 border-purple-100',
    color: 'text-purple-700'
  }
];

const PRESTASI_LIST = [
  {
    title: 'Akreditasi (Unggul)',
    desc: 'Raihan nilai unggul resmi berdasarkan SK No. 763/BAN-SM/SK/2019 sebagai bukti standar mutu pendidikan prima.',
    tag: 'BAN-SM Resmi'
  },
  {
    title: 'Madrasah Unggulan Kecamatan Babelan',
    desc: 'Menjadi rujukan utama masyarakat dengan tingkat peminat dan kepercayaan tertinggi di wilayah Babelan.',
    tag: 'Peringkat Terbaik'
  },
  {
    title: 'Juara Festival Anak Sholeh & MAPSI',
    desc: 'Prestasi gemilang santri pada ajang lomba tahfidz Al-Qur\'an, pidato islami, dan cerdas cermat keagamaan.',
    tag: 'Juara Lomba'
  },
  {
    title: 'Program Tahfidz Santri Bersanad',
    desc: '100% lulusan dibekali hafalan Juz 30, doa harian, dan pembiasaan adab ibadah praktis.',
    tag: 'Target Lulusan'
  }
];

const FASILITAS_ABOUT = [
  { nama: 'Ruang Kelas Ber-AC & Interaktif', desc: 'Dilengkapi proyektor digital dan meja kursi ergonomis.' },
  { nama: 'Laboratorium Komputer & IT', desc: 'Akses PC modern untuk literasi digital dan ANBK.' },
  { nama: 'Mushola Ibadah Santri', desc: 'Pusat shalat dhuha/dzuhur dan bimbingan tahsin.' },
  { nama: 'Perpustakaan Literasi Islami', desc: 'Koleksi buku cerita, ensiklopedia, dan pojok baca.' },
  { nama: 'Lapangan Olahraga & Area Bermain', desc: 'Area outdoor serbaguna yang aman dan ramah anak.' },
  { nama: 'CCTV 24 Jam & Sistem One-Gate', desc: 'Keamanan lingkungan madrasah terpantau non-stop.' }
];

export default function AboutPage() {
  const spmbUrl = process.env.NODE_ENV === 'development' ? 'http://spmb.localhost:3000' : 'https://spmb.miattaqwa15.sch.id';

  return (
    <div className="flex flex-col w-full min-h-screen">
      
      {/* ════════════════════════════════════════════════════════════════════
          1. HERO SECTION
         ════════════════════════════════════════════════════════════════════ */}
      <AnimatedSection direction="none" delay={0.1}>
        <section className="relative pt-12 pb-16 lg:pt-16 lg:pb-20 overflow-hidden flex flex-col justify-center bg-mesh-radial">
          {/* Background Image */}
          <div className="absolute inset-0 z-0 opacity-20">
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
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#F4F7FC]/40 to-[#F4F7FC] z-0" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center flex flex-col items-center">
            <div className="inline-flex items-center gap-2 py-1.5 sm:py-2 px-4 sm:px-5 rounded-full glass-pill text-primary-dark font-body text-xs sm:text-sm font-bold tracking-wider uppercase mb-4 sm:mb-6 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-btn-secondary shrink-0" />
              <span>Profil Madrasah · MI Attaqwa 15 Babelan</span>
            </div>

            <h1 className="font-headline font-black text-3xl xs:text-4xl sm:text-5xl lg:text-6xl text-secondary leading-tight tracking-tight max-w-5xl mb-4 break-words">
              Mendidik Generasi islami, <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-500">
                dan Berkarakter Pejuang Sejati
              </span>
            </h1>

            <p className="font-body text-gray-600 text-sm sm:text-base md:text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed mb-8 px-2">
              Lembaga pendidikan dasar Islam unggulan terakreditasi A BAN-SM di Babelan Kota yang memadukan kurikulum Kemenag KMA 1503/2025, nilai kepesantrenan Attaqwa, dan kesiapan literasi digital.
            </p>

            {/* Pill Metric Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 max-w-4xl">
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/85 backdrop-blur-md border border-white shadow-2xs text-xs sm:text-sm font-semibold text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>NPSN: 60709253</span>
              </div>
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/85 backdrop-blur-md border border-white shadow-2xs text-xs sm:text-sm font-semibold text-gray-700">
                <Award className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Akreditasi (Unggul)</span>
              </div>
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/85 backdrop-blur-md border border-white shadow-2xs text-xs sm:text-sm font-semibold text-gray-700">
                <History className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Berdiri Sejak 1970</span>
              </div>
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/85 backdrop-blur-md border border-white shadow-2xs text-xs sm:text-sm font-semibold text-gray-700">
                <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Kurikulum KMA 1503/2025</span>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* ════════════════════════════════════════════════════════════════════
          2. TENTANG SEKOLAH & SEJARAH SINGKAT
         ════════════════════════════════════════════════════════════════════ */}
      <AnimatedSection direction="up">
        <section className="py-14 sm:py-20 lg:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* About Split Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center mb-16 sm:mb-20">
              
              {/* Left Content */}
              <div className="lg:col-span-6 flex flex-col space-y-5 max-w-2xl lg:max-w-none mx-auto w-full">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-primary-dark font-body text-xs font-bold uppercase tracking-wider w-fit">
                  <span>Mengenal MI Attaqwa 15</span>
                </div>

                <h2 className="font-headline font-black text-2xl xs:text-3xl sm:text-4xl text-secondary leading-tight break-words">
                  MADRASAH DENGAN TRADISI <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-700 to-emerald-600">
                    PRESTASI, IMAN &amp; AKHLAQ
                  </span>
                </h2>

                <div className="font-body text-gray-600 leading-relaxed space-y-3 text-xs sm:text-sm md:text-base">
                  <p>
                    <strong>MI Attaqwa 15 Babelan</strong> lahir dari cita-cita luhur Pahlawan Nasional <strong>KH. Noer Alie</strong> untuk menghadirkan institusi pendidikan yang mencerdaskan akal sekaligus mengokohkan ketakwaan generasi penerus bangsa.
                  </p>
                  <p>
                    Dengan predikat <strong>Akreditasi A (Unggul)</strong> dari BAN-SM, madrasah kami memadukan kurikulum Kementerian Agama, nilai-nilai kepesantrenan Attaqwa, serta kurikulum modern abad 21 untuk menjawab tantangan zaman tanpa kehilangan jati diri keislaman.
                  </p>
                </div>

                {/* Micro Stats Bar */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-[#F4F7FC] border border-gray-100 text-center">
                    <span className="font-headline font-black text-xl sm:text-2xl text-teal-700 block">50+</span>
                    <span className="font-body text-[11px] sm:text-xs text-gray-500 font-medium">Tahun Mengabdi</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#F4F7FC] border border-gray-100 text-center">
                    <span className="font-headline font-black text-xl sm:text-2xl text-btn-secondary block">100%</span>
                    <span className="font-body text-[11px] sm:text-xs text-gray-500 font-medium">Lulusan Berkualitas</span>
                  </div>
                </div>
              </div>

              {/* Right Image Showcase */}
              <div className="lg:col-span-6 relative w-full max-w-2xl lg:max-w-none mx-auto aspect-[4/3] rounded-3xl sm:rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white group">
                <Image
                  src="/mialibels6.jpg"
                  alt="Siswa MI Attaqwa 15 Babelan"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <span className="font-headline font-bold text-lg sm:text-xl block drop-shadow-sm">
                    MI Attaqwa 15 Babelan Kota
                  </span>
                  <span className="font-body text-xs sm:text-sm text-slate-200">
                    Lingkungan Belajar Interaktif, Asri, dan Menyenangkan
                  </span>
                </div>
              </div>

            </div>

            {/* Sejarah Singkat Cards */}
            <div className="pt-6 border-t border-slate-100">
              <div className="max-w-3xl mx-auto text-center mb-8 sm:mb-12">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-primary-dark font-body text-xs font-bold uppercase tracking-wider mb-3">
                  <span>Jejak Langkah</span>
                </div>
                <h3 className="font-headline font-black text-2xl sm:text-3xl text-secondary">
                  SEJARAH SINGKAT PERJALANAN KAMI
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {SEJARAH_STEPS.map((item, idx) => (
                  <div 
                    key={idx}
                    className={`bg-[#F4F7FC] p-6 sm:p-7 rounded-3xl border border-gray-100/90 shadow-sm hover:shadow-xl hover:bg-white hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group ${item.border}`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center border border-gray-200 shadow-2xs group-hover:scale-110 transition-transform">
                          <span className={`font-headline font-black text-lg ${item.yearColor}`}>
                            {item.year}
                          </span>
                        </div>
                        <span className={`text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${item.badgeBg}`}>
                          {item.tag}
                        </span>
                      </div>

                      <h4 className="font-headline font-bold text-lg text-secondary mb-2 group-hover:text-primary transition-colors">
                        {item.title}
                      </h4>
                      <p className="font-body text-gray-500 text-xs sm:text-sm leading-relaxed">
                        {item.desc}
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-gray-400">
                      <span>Fase {idx + 1}</span>
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 text-primary" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>
      </AnimatedSection>

      {/* ════════════════════════════════════════════════════════════════════
          3. VISI & MISI MADRASAH (PLAYFUL, MODERN & INFORMATIF)
         ════════════════════════════════════════════════════════════════════ */}
      <AnimatedSection direction="up">
        <section className="py-14 sm:py-20 lg:py-24 bg-[#F4F7FC]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Header */}
            <div className="text-center max-w-4xl mx-auto mb-10 sm:mb-16">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-primary-dark font-body text-xs font-bold uppercase tracking-wider mb-3.5 sm:mb-4">
                <span>Arah &amp; Tujuan Kami</span>
              </div>
              <h2 className="font-headline font-black text-2xl xs:text-3xl md:text-4xl text-secondary mb-3 sm:mb-4 break-words">
                VISI &amp; MISI STRATEGIS MADRASAH
              </h2>
              <p className="font-body text-gray-500 text-sm sm:text-base md:text-lg px-2 leading-relaxed">
                Pondasi nilai dan komitmen jangka panjang dalam mencetak generasi pejuang yang cerdas, shalih, dan berdaya saing global.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
              
              {/* Left: Visi Card (Heroic Deep Tech Style) */}
              <div className="lg:col-span-5 bg-gradient-to-br from-[#002957] via-[#0f2744] to-[#004d40] p-7 sm:p-10 rounded-3xl sm:rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl flex flex-col justify-between">
                {/* Glow effects */}
                <div className="absolute top-0 right-0 w-72 h-72 bg-teal-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-400/15 blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

                <div className="relative z-10 space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-accent font-body text-xs font-bold uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-accent" />
                      <span>Visi Utama</span>
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-teal-200">
                      <Quote className="w-5 h-5" />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-headline font-black text-2xl sm:text-3xl text-white tracking-tight leading-tight mb-4">
                      Visi MI Attaqwa 15
                    </h3>
                    <blockquote className="font-body text-base sm:text-lg lg:text-xl leading-relaxed text-slate-100 font-medium italic border-l-4 border-amber-400 pl-4">
                      "Terwujudnya generasi yang shalih, cerdas, berdaya saing, dan berkarakter pejuang berdasarkan nilai-nilai Islam Ahlussunnah Wal Jamaah."
                    </blockquote>
                  </div>

                  {/* 3 Vision Pillars */}
                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>Spiritual &amp; Adab:</strong> Nilai Ahlussunnah Wal Jamaah</span>
                    </div>
                    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                      <span><strong>Intelektual:</strong> Literasi Sains, Umum &amp; Digital</span>
                    </div>
                    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                      <span><strong>Karakter Pejuang:</strong> Warisan KH. Noer Alie</span>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 mt-8 pt-4 border-t border-white/15 text-xs text-teal-200 flex items-center justify-between">
                  <span>Yayasan Attaqwa Babelan</span>
                  <span>Akreditasi Unggul</span>
                </div>
              </div>

              {/* Right: 6 Misi Cards Grid */}
              <div className="lg:col-span-7 flex flex-col justify-between">
                <div className="mb-4">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-primary-dark font-body text-xs font-bold uppercase tracking-wider mb-2">
                    <Compass className="w-3.5 h-3.5 text-primary" />
                    <span>Langkah Kami</span>
                  </div>
                  <h3 className="font-headline font-black text-xl sm:text-2xl text-secondary">
                    6 Misi Strategis Madrasah
                  </h3>
                </div>

                {/* 6 Bento Mission Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  {MISI_ITEMS.map((misi, idx) => {
                    const Icon = misi.icon;
                    return (
                      <div 
                        key={idx}
                        className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-gray-100 shadow-2xs hover:shadow-md hover:border-teal-200 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="font-headline font-black text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-gray-600 group-hover:bg-btn-secondary group-hover:text-white transition-colors">
                              MISI {misi.number}
                            </span>
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shadow-2xs ${misi.bg}`}>
                              <Icon className={`w-4 h-4 ${misi.color}`} />
                            </div>
                          </div>

                          <h4 className="font-headline font-bold text-md sm:text-lg text-secondary mb-1.5 group-hover:text-primary transition-colors">
                            {misi.title}
                          </h4>
                          <p className="font-body text-gray-500 text-sm sm:text-sm leading-relaxed">
                            {misi.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        </section>
      </AnimatedSection>

      {/* ════════════════════════════════════════════════════════════════════
          4. PRESTASI & FASILITAS UNGGULAN
         ════════════════════════════════════════════════════════════════════ */}
      <AnimatedSection direction="up">
        <section className="py-14 sm:py-20 lg:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Header */}
            <div className="text-center max-w-4xl mx-auto mb-10 sm:mb-16">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-primary-dark font-body text-xs font-bold uppercase tracking-wider mb-3.5 sm:mb-4">
                <span>Kualitas &amp; Sarana</span>
              </div>
              <h2 className="font-headline font-black text-2xl xs:text-3xl md:text-4xl text-secondary mb-3 sm:mb-4 break-words">
                PRESTASI UNGGUL &amp; SARANA PRASARANA
              </h2>
              <p className="font-body text-gray-500 text-sm sm:text-base md:text-lg px-2 leading-relaxed">
                Bukti nyata komitmen mutu pendidikan dan fasilitas penunjang tumbuh kembang siswa MI Attaqwa 15.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
              
              {/* Prestasi Column */}
              <div className="lg:col-span-6 flex flex-col justify-between p-6 sm:p-8 md:p-10 rounded-3xl sm:rounded-[2.5rem] bg-gradient-to-b from-[#F4F7FC] to-white border border-teal-100/80 shadow-md shadow-slate-900/5">
                <div>
                  <div className="flex items-center gap-3.5 mb-6 sm:mb-7">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-600/20 shrink-0">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-headline font-black text-xl sm:text-2xl text-secondary">
                        Prestasi &amp; Rekam Jejak
                      </h3>
                      <p className="font-body text-sm text-gray-400 font-medium">Pengakuan mutu tingkat regional dan nasional</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {PRESTASI_LIST.map((item, idx) => (
                      <div 
                        key={idx}
                        className="p-4 rounded-2xl bg-white border border-gray-100 shadow-2xs hover:shadow-md hover:border-amber-200 transition-all duration-300 group"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="font-headline font-bold text-md sm:text-md text-secondary group-hover:text-primary transition-colors">
                            {item.title}
                          </h4>
                          <span className="text-[11px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full shrink-0">
                            {item.tag}
                          </span>
                        </div>
                        <p className="font-body text-gray-500 text-xs sm:text-sm leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-teal-700">
                  <span>Komitmen mempertahankan predikat Akreditasi A secara berkelanjutan</span>
                </div>
              </div>

              {/* Fasilitas Column */}
              <div className="lg:col-span-6 flex flex-col justify-between p-6 sm:p-8 md:p-10 rounded-3xl sm:rounded-[2.5rem] bg-white border border-gray-100 shadow-xl shadow-slate-900/5">
                <div>
                  <div className="flex items-center gap-3.5 mb-6 sm:mb-7">
                    <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-700/20 shrink-0">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-headline font-black text-xl sm:text-2xl text-secondary">
                        Sarana &amp; Fasilitas Belajar
                      </h3>
                      <p className="font-body text-sm text-gray-400 font-medium">Infrastruktur pendukung kenyamanan belajar</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {FASILITAS_ABOUT.map((item, idx) => (
                      <div 
                        key={idx}
                        className="p-3.5 rounded-2xl border border-gray-100 bg-[#F4F7FC]/70 hover:bg-white hover:border-teal-200 hover:shadow-sm transition-all duration-300 flex flex-col justify-between group"
                      >
                        <div className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                          <div>
                            <h4 className="font-headline font-bold text-gray-800 text-sm sm:text-md group-hover:text-primary transition-colors">
                              {item.nama}
                            </h4>
                            <p className="font-body text-sm text-gray-400 mt-0.5 leading-snug">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 p-3.5 rounded-2xl bg-teal-50/70 border border-teal-100 flex items-center justify-between text-xs text-teal-900 font-semibold">
                  <span>Seluruh fasilitas terawat &amp; berstandar Kemenag</span>
                  <Link href={getSpmbUrl()} className="text-primary hover:underline flex items-center gap-1 text-xs">
                    <span>Lihat Detail</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

            </div>

          </div>
        </section>
      </AnimatedSection>

      {/* ════════════════════════════════════════════════════════════════════
          5. CALL TO ACTION (CTA) SECTION
         ════════════════════════════════════════════════════════════════════ */}
      <AnimatedSection direction="up">
        <section className="relative py-14 sm:py-20 lg:py-24 overflow-hidden bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="relative rounded-3xl sm:rounded-[2.5rem] bg-gradient-to-br from-[#002957] via-[#0f2744] to-[#004d40] p-7 sm:p-12 md:p-16 text-center text-white overflow-hidden shadow-2xl">
              {/* Background Overlay */}
              <div className="absolute inset-0 z-0">
                <Image
                  src="/bgheader.png"
                  alt="CTA Background"
                  fill
                  className="object-cover opacity-15 object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#002957]/90 via-transparent to-transparent" />
              </div>

              {/* Ambient Glows */}
              <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-teal-400/20 blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-amber-400/15 blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

              <div className="relative z-10 max-w-6xl mx-auto">
                <div className="inline-flex items-center gap-2 py-1.5 sm:py-2 px-4 sm:px-5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-accent font-body text-xs sm:text-sm font-bold uppercase tracking-wider mb-4 sm:mb-6 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  <span>Penerimaan Murid Baru 2027/2028</span>
                </div>

                <h2 className="font-headline font-black text-2xl xs:text-3xl sm:text-4xl md:text-5xl leading-tight mb-4 sm:mb-6 break-words">
                  Jadikan Putra-Putri Anda Bagian dari <br className="hidden sm:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-emerald-300 to-amber-200">
                    Generasi Unggul MI Attaqwa 15
                  </span>
                </h2>

                <p className="font-body text-slate-200 text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed mb-8 sm:mb-10 max-w-4xl mx-auto px-2">
                  Mari bertumbuh bersama madrasah yang mengutamakan akhlakul karimah, ketajaman intelektual, dan kesiapan menghadapi masa depan digital. Kuota terbatas 120 siswa!
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                  <a
                    href={spmbUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-tactile w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 sm:px-10 py-3.5 sm:py-4 rounded-full font-body text-sm sm:text-base font-bold bg-btn-secondary text-white shadow-xl shadow-orange-950/30 hover:shadow-2xl hover:brightness-110 transition-all text-center"
                  >
                    <span>Daftar SPMB Online</span>
                    <ArrowRight className="w-5 h-5 ml-1 shrink-0" />
                  </a>

                  <Link
                    href="/contact"
                    className="btn-tactile w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-body text-sm sm:text-base font-bold bg-white/10 text-white border border-white/25 backdrop-blur-md hover:bg-white/20 transition-all text-center"
                  >
                    <Phone className="w-4 h-4 shrink-0" />
                    <span>Konsultasi Panitia SPMB</span>
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </section>
      </AnimatedSection>

    </div>
  );
}
