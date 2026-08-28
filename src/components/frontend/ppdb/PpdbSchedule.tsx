'use client';

import React from 'react';
import { Users, Calendar, ArrowRight, Flame, Clock, CheckCircle2, AlertCircle, ShieldAlert, Sparkles, GraduationCap, School } from 'lucide-react';

export default function PpdbSchedule() {
  const spmbUrl = process.env.NODE_ENV === 'development' ? 'http://spmb.localhost:3000' : 'https://spmb.miattaqwa15.sch.id';

  return (
    <section className="py-14 sm:py-20 lg:py-24 bg-[#F4F7FC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-4xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-primary-dark font-body text-xs font-bold uppercase tracking-wider mb-3.5 sm:mb-4">
            <Users className="w-3.5 h-3.5 text-accent" />
            <span>Skema Gelombang &amp; Kuota Siswa</span>
          </div>
          <h2 className="font-headline font-black text-2xl xs:text-3xl md:text-4xl text-secondary mb-3 sm:mb-4 break-words">
            JADWAL PENERIMAAN &amp; KUOTA SISWA
          </h2>
          <p className="font-body text-gray-500 text-sm sm:text-base md:text-lg px-2 leading-relaxed">
            Pendaftaran SPMB MI Attaqwa 15 dibuka dalam <strong>satu gelombang resmi</strong> mulai <strong>Bulan Oktober</strong> dan akan langsung ditutup otomatis begitu kuota <strong>120 siswa</strong> terpenuhi.
          </p>
        </div>

        {/* Main Highlight Hero Card for Single Wave */}
        <div className="bg-white rounded-3xl sm:rounded-[2.5rem] border border-gray-100 shadow-xl shadow-slate-900/5 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            
            {/* Left: Wave Banner & Live Quota Info */}
            <div className="lg:col-span-5 bg-gradient-to-br from-[#002957] via-[#0f2744] to-[#004d40] text-white p-7 sm:p-10 flex flex-col justify-between relative overflow-hidden">
              {/* Background ambient glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-teal-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-400/15 blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full bg-btn-secondary text-white shadow-md">
                    Gelombang Tunggal
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-200 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Mulai Oktober</span>
                  </span>
                </div>

                <div>
                  <h3 className="font-headline font-black text-3xl sm:text-4xl text-white tracking-tight leading-tight mb-2">
                    Penerimaan Murid Baru 2027/2028
                  </h3>
                  <p className="font-body text-slate-200 text-xs sm:text-sm leading-relaxed">
                    Sistem pendaftaran satu pintu terpadu untuk memastikan seleksi yang adil, transparan, dan terukur.
                  </p>
                </div>

                {/* Quota Highlights Box */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-200">
                    <span className="font-semibold">Target Daya Tampung</span>
                    <span className="font-black text-amber-300 text-sm">120 Siswa Baru</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full w-full animate-pulse" />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-teal-100 font-medium">
                    <span>4 Rombongan Belajar (Rombel)</span>
                    <span>@ 30 Siswa / Kelas</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="relative z-10 pt-6">
                <a
                  href={spmbUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-tactile w-full inline-flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-body text-sm font-bold bg-btn-secondary text-white shadow-xl shadow-orange-950/30 hover:brightness-110 transition-all text-center"
                >
                  <GraduationCap className="w-5 h-5" />
                  <span>Daftar SPMB Online Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Right: Milestone Timeline & Key Information */}
            <div className="lg:col-span-7 p-7 sm:p-10 flex flex-col justify-between space-y-6">
              <div>
                <h4 className="font-headline font-bold text-lg sm:text-xl text-secondary mb-5 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <span>Tahapan Pelaksanaan SPMB</span>
                </h4>

                <div className="space-y-4">
                  {/* Step 1 */}
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#F4F7FC] border border-gray-100 transition-all hover:bg-white hover:shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-teal-100/80 text-teal-800 font-black font-headline flex items-center justify-center shrink-0 text-sm shadow-2xs">
                      01
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                        <h5 className="font-headline font-bold text-sm sm:text-base text-secondary">
                          Pembukaan Pendaftaran Online
                        </h5>
                        <span className="text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-100 px-2.5 py-0.5 rounded-full">
                          Mulai Oktober
                        </span>
                      </div>
                      <p className="font-body text-gray-500 text-xs sm:text-sm leading-relaxed">
                        Pengisian formulir online melalui portal resmi madrasah dan pembayaran biaya formulir Rp 300.000 via Bank BTN / QRIS.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#F4F7FC] border border-gray-100 transition-all hover:bg-white hover:shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-amber-100/80 text-amber-800 font-black font-headline flex items-center justify-center shrink-0 text-sm shadow-2xs">
                      02
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                        <h5 className="font-headline font-bold text-sm sm:text-base text-secondary">
                          Verifikasi &amp; Observasi Berkala
                        </h5>
                        <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full">
                          Jadwal Fleksibel
                        </span>
                      </div>
                      <p className="font-body text-gray-500 text-xs sm:text-sm leading-relaxed">
                        Wawancara orang tua serta pemetaan karakter dan gaya belajar calon siswa yang dilaksanakan secara berkala.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#F4F7FC] border border-gray-100 transition-all hover:bg-white hover:shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-rose-100/80 text-rose-800 font-black font-headline flex items-center justify-center shrink-0 text-sm shadow-2xs">
                      03
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                        <h5 className="font-headline font-bold text-sm sm:text-base text-secondary">
                          Penutupan Pendaftaran Otomatis
                        </h5>
                        <span className="text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded-full">
                          Maks. 120 Siswa
                        </span>
                      </div>
                      <p className="font-body text-gray-500 text-xs sm:text-sm leading-relaxed">
                        Pendaftaran langsung ditutup saat total 120 kursi terisi penuh. Daftar ulang &amp; penyerahan berkas fisik dilakukan segera.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Notice */}
              <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/80 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
                <p className="font-body text-xs text-amber-900 leading-snug">
                  <strong>Penting:</strong> Tidak ada gelombang susulan. Pastikan segera menyelesaikan pengisian data dan pembayaran begitu pendaftaran dibuka di bulan Oktober.
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
