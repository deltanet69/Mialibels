'use client';

import React, { useState, useEffect } from 'react';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { getWIBGreeting, formatWIBDateIndo } from '@/lib/dateUtils';
import { StudentInfo, DashboardData } from './dashboard/types';
import { ParentDashboardMobile } from './dashboard/ParentDashboardMobile';
import { ParentDashboardDesktop } from './dashboard/ParentDashboardDesktop';
import { ExamRequirementsModal } from './dashboard/ExamRequirementsModal';

export * from './dashboard/types';

export function ParentDashboardClient({
  student,
  data
}: {
  student: StudentInfo;
  data: DashboardData;
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [showExamReqModal, setShowExamReqModal] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const updateWibTime = () => {
      const now = new Date();
      setCurrentTime(now);
      setGreeting(getWIBGreeting(now));
    };

    updateWibTime();

    // Update time every 30 seconds for real-time reactivity
    const timer = setInterval(updateWibTime, 30000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const initTour = (force = false) => {
      if (typeof window === 'undefined') return;

      const hasSeenTour = localStorage.getItem('parentTourCompleted');
      if (!force && hasSeenTour === 'true') return;

      const driverObj = driver({
        showProgress: true,
        allowClose: false,
        disableActiveInteraction: true,
        smoothScroll: true,
        animate: true,
        overlayColor: '#030712',
        overlayOpacity: 0.75,
        stagePadding: 8,
        stageRadius: 12,
        popoverClass: 'driverjs-theme',
        nextBtnText: 'Selanjutnya \u2192',
        prevBtnText: '\u2190 Sebelumnya',
        doneBtnText: 'Selesai \u2713',
        progressText: '{{current}} / {{total}}',
        steps: [
          {
            element: '#tour-attendance',
            popover: {
              title: 'Kehadiran Bulan Ini',
              description: 'Pantau presensi harian siswa bulan ini secara langsung di sini.',
              side: 'bottom',
              align: 'start'
            }
          },
          {
            element: '#tour-cards',
            popover: {
              title: 'Kartu Identitas Siswa',
              description: 'Anda dapat mengunduh Kartu Siswa dan Kartu Ujian di sini. Pastikan seluruh persyaratan administrasi terpenuhi agar kartu ujian dapat diunduh.',
              side: 'left',
              align: 'start'
            }
          },
          {
            element: '#tour-savings',
            popover: {
              title: 'Tabungan Siswa',
              description: 'Informasi terkait saldo tabungan terkini (Debit/Kredit) anak Anda di kas sekolah.',
              side: 'bottom',
              align: 'start'
            }
          },
          {
            element: '#tour-spp',
            popover: {
              title: 'Infaq & SPP Bulanan',
              description: 'Lihat rincian tagihan Infaq/SPP sekolah bulanan yang harus dibayarkan serta status pelunasannya.',
              side: 'bottom',
              align: 'start'
            }
          },
          {
            element: '#tour-general',
            popover: {
              title: 'Keuangan Umum',
              description: 'Informasi rinci terkait tagihan umum lainnya seperti administrasi sekolah, buku paket, dan kegiatan akhir tahun.',
              side: 'bottom',
              align: 'start'
            }
          }
        ],
        onDestroyStarted: () => {
          if (!driverObj.hasNextStep() || force) {
            localStorage.setItem('parentTourCompleted', 'true');
            driverObj.destroy();
          }
        }
      });

      driverObj.drive();
    };

    // Auto start if not seen with a slight delay
    const timer = setTimeout(() => {
      initTour(false);
    }, 800);

    const handleManualStart = () => {
      initTour(true);
    };

    const handleOpenExamModal = () => {
      setShowExamReqModal(true);
    };

    window.addEventListener('start-parent-tour', handleManualStart);
    window.addEventListener('open-exam-rules-modal', handleOpenExamModal);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('start-parent-tour', handleManualStart);
      window.removeEventListener('open-exam-rules-modal', handleOpenExamModal);
    };
  }, []);

  const todayDateStr = currentTime ? formatWIBDateIndo(currentTime) : '';

  if (!isMounted || !currentTime) {
    return (
      <div className="w-full min-h-screen bg-[#f4f7fb] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full">
      {/* 📱 MOBILE FIRST EXPERIENCE (md:hidden) */}
      <div className="md:hidden">
        <ParentDashboardMobile
          student={student}
          data={data}
          currentTime={currentTime}
        />
      </div>

      {/* 💻 DESKTOP FULL BENTO EXPERIENCE (hidden md:block) */}
      <div className="hidden md:block">
        <ParentDashboardDesktop
          student={student}
          data={data}
          greeting={greeting}
          todayDateStr={todayDateStr}
          onOpenExamModal={() => setShowExamReqModal(true)}
        />
      </div>

      {/* ── MODAL: PERSYARATAN & CEK KEKURANGAN KARTU UJIAN ── */}
      <ExamRequirementsModal
        isOpen={showExamReqModal}
        onClose={() => setShowExamReqModal(false)}
        student={student}
        data={data}
      />
    </div>
  );
}
