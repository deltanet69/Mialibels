'use client';

import React, { useState } from 'react';
import { Download, AlertCircle, Loader2 } from 'lucide-react';
import { getDirectImageUrl } from '@/lib/imageUtils';

interface Student {
  id: string;
  name: string;
  nisn: string;
  student_number?: string;
  class: string;
  address?: string;
  image?: string;
  photo_url?: string;
  fee_waiver_type?: string | null;
  feeWaiverType?: string | null;
}

interface SPPInvoice {
  id: string;
  month: string | number;
  year: number;
  status: string; // 'PAID', 'UNPAID', 'LATE', 'PARTIAL'
}

interface CardDownloaderProps {
  studentId?: string;
  student?: Student;
  sppInvoices?: SPPInvoice[];
}

export const CardDownloader: React.FC<CardDownloaderProps> = ({ studentId, student: initialStudent, sppInvoices: initialSpp }) => {
  const [generatingSiswa, setGeneratingSiswa] = useState(false);
  const [generatingUjian, setGeneratingUjian] = useState(false);

  const isFeeExempt = (waiverType?: string | null) => {
    if (!waiverType) return false;
    const val = String(waiverType).toLowerCase().trim();
    return val === 'anak_yatim' || val.includes('yatim') || val.includes('guru');
  };
  
  const fetchFullData = async () => {
    const targetId = studentId || initialStudent?.id;
    if (!targetId) throw new Error("No student ID provided");
    
    // Always fetch fresh data to get general_invoices as well
    const res = await fetch(`/api/students/${targetId}`);
    const result = await res.json();
    if (!result.success) throw new Error("Failed to fetch student data");
    
    return {
      studentData: result.data,
      sppData: result.data.spp_invoices || [],
      generalData: result.data.general_invoices || []
    };
  };

  const isSppSeptemberLunas = (sppList: SPPInvoice[]) => {
    const targetMonths = ['Juli', 'Agustus', 'September', '7', '8', '9', 7, 8, 9];
    const unpaidTargetMonth = sppList.find(inv => {
      const isTarget = targetMonths.includes(String(inv.month));
      const isPaid = inv.status === 'PAID';
      return isTarget && !isPaid;
    });
    return !unpaidTargetMonth;
  };
  
  const getGeneralPaidAmount = (generalList: any[], key: string) => 
    generalList.flatMap(inv => inv.items || []).filter((item: any) => item.name?.toLowerCase().includes(key.toLowerCase())).reduce((sum, item) => sum + (Number(item.paid_amount) || 0), 0);

  const drawCard = async (type: 'siswa' | 'ujian') => {
    if (type === 'siswa') setGeneratingSiswa(true);
    else setGeneratingUjian(true);

    try {
      if (type === 'ujian' && process.env.NODE_ENV === 'production') {
        const releaseDate = new Date('2026-09-08T00:00:00+07:00');
        if (new Date() < releaseDate) {
          alert('Kartu Ujian baru dapat diunduh mulai tanggal 8 September 2026.');
          setGeneratingUjian(false);
          return;
        }
      }

      const { studentData, sppData, generalData } = await fetchFullData();
      
      if (type === 'ujian') {
        const className = studentData.class || '';
        const isFullday = className.match(/A$/i);
        const isClass6 = className.startsWith('6');
        const waiverType = studentData.fee_waiver_type || initialStudent?.fee_waiver_type || (initialStudent as any)?.feeWaiverType;
        const exemptInfaqAndBuku = isFeeExempt(waiverType);
        
        let errorMsg = '';
        
        if (!exemptInfaqAndBuku && !isSppSeptemberLunas(sppData)) {
          errorMsg = 'Kartu Ujian tidak dapat diunduh. Pastikan tagihan Infaq/SPP s/d bulan September sudah dilunasi.';
        } else {
          const paidBuku = getGeneralPaidAmount(generalData, 'buku');
          const paidUlangan = getGeneralPaidAmount(generalData, 'ulangan');
          const paidAkhirTahun = getGeneralPaidAmount(generalData, 'akhir tahun');
          
          const minBuku = isFullday ? 700000 : 300000;
          const minUlangan = 110000;
          const minAkhirTahun = 600000;
          
          if (!exemptInfaqAndBuku && paidBuku < minBuku) {
            errorMsg = `Uang Buku/LKS minimal Rp.${minBuku.toLocaleString('id-ID')} belum terpenuhi (Terbayar: Rp.${paidBuku.toLocaleString('id-ID')}).`;
          } else if (paidUlangan < minUlangan) {
            errorMsg = `Uang Ulangan Umum minimal Rp.${minUlangan.toLocaleString('id-ID')} belum terpenuhi (Terbayar: Rp.${paidUlangan.toLocaleString('id-ID')}).`;
          } else if (isClass6 && paidAkhirTahun < minAkhirTahun) {
            errorMsg = `Uang Kegiatan Akhir Tahun minimal Rp.${minAkhirTahun.toLocaleString('id-ID')} belum terpenuhi (Terbayar: Rp.${paidAkhirTahun.toLocaleString('id-ID')}).`;
          }
        }

        if (errorMsg) {
          alert(errorMsg);
          setGeneratingUjian(false);
          return;
        }
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Canvas context not supported");

      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      
      const templateSrc = type === 'siswa' ? '/kartu/kartutemplate.png' : '/kartuujian.png';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = templateSrc;
      });

      const photoUrl = getDirectImageUrl(studentData.photo_url || studentData.image, 600);

      if (type === 'siswa') {
        // Original Kartu Siswa dimensions (3150 x 1800 px)
        canvas.width = 3150;
        canvas.height = 1800;

        // Draw background template
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Define fonts
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#000000'; // Black text

        // Draw Title
        ctx.font = 'bold 70px "Inter", "Segoe UI", sans-serif';
        ctx.fillText('KARTU PELAJAR SISWA', 794, 650);

        // Draw Labels
        ctx.font = 'bold 50px "Inter", "Segoe UI", sans-serif';
        const labels = ['Nama Lengkap', 'NIS / NISN', 'Kelas', 'Alamat'];
        const startY = 794;
        const spacing = 110;

        labels.forEach((label, i) => {
          const y = startY + (i * spacing);
          ctx.fillText(label, 794, y);
          ctx.fillText(':', 1386, y);
        });

        // Draw Values
        ctx.font = 'normal 50px "Inter", "Segoe UI", sans-serif';
        const values = [
          studentData.name || '-',
          `${studentData.student_number || '-'} / ${studentData.nisn || '-'}`,
          studentData.class || '-',
        ];

        values.forEach((value, i) => {
          const y = startY + (i * spacing);
          ctx.fillText(value, 1493, y);
        });

        // Handle Address (might need wrapping)
        const addressY = startY + (3 * spacing);
        const address = studentData.address || '-';
        
        const words = address.split(' ');
        let line = '';
        let currentY = addressY;
        const maxWidth = 1500;

        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;
          
          if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, 1493, currentY);
            line = words[n] + ' ';
            currentY += 60;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, 1493, currentY);

        // Draw Photo Placeholder or Photo
        const photoX = 208;
        const photoY = 648;
        const photoW = 441;
        const photoH = 629;

        let photoLoaded = false;
        if (photoUrl) {
          try {
            const photo = new window.Image();
            photo.crossOrigin = 'anonymous';
            await new Promise((resolve, reject) => {
              photo.onload = () => { photoLoaded = true; resolve(true); };
              photo.onerror = () => resolve(false);
              photo.src = photoUrl;
            });
            if (photoLoaded) {
              ctx.drawImage(photo, photoX, photoY, photoW, photoH);
            }
          } catch (e) {
            photoLoaded = false;
          }
        }

        if (!photoLoaded) {
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(photoX, photoY, photoW, photoH);
          
          ctx.fillStyle = '#94a3b8';
          ctx.font = 'normal 40px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('FOTO', photoX + photoW / 2, photoY + photoH / 2);
          ctx.fillText('3x4', photoX + photoW / 2, (photoY + photoH / 2) + 50);
          
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
        }
      } else {
        // Kartu Peserta Ujian / Asesmen Kokurikuler (2834 x 2362 px)
        canvas.width = 2834;
        canvas.height = 2362;

        // Draw background template
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        ctx.textBaseline = 'top';
        ctx.fillStyle = '#FFFFFF';

        // Coordinates aligned with the blue box labels in public/kartuujian.png
        // 1. Nama Siswa :
        // 2. Kelas       :
        // 3. Ruang       :
        const startX = 580;
        const startY = 442;
        const spacing = 74;

        const rawClass = studentData.class || '-';
        const cleanClass = rawClass.replace(/^kelas\s+/i, '');
        const ruangVal = studentData.exam_room || (rawClass !== '-' 
          ? (rawClass.toLowerCase().includes('ruang') ? rawClass : `Ruang ${cleanClass}`)
          : '-');

        const values = [
          (studentData.name || '-').toUpperCase(),
          rawClass,
          ruangVal,
        ];

        // Draw values in crisp bold white text with automatic font scaling for long names
        values.forEach((value, i) => {
          const y = startY + (i * spacing);
          let fontSize = 48;
          ctx.font = `bold ${fontSize}px "Inter", "Segoe UI", Arial, sans-serif`;
          const maxValWidth = 880;
          while (ctx.measureText(value).width > maxValWidth && fontSize > 24) {
            fontSize -= 2;
            ctx.font = `bold ${fontSize}px "Inter", "Segoe UI", Arial, sans-serif`;
          }
          ctx.fillText(value, startX, y + (48 - fontSize) / 2);
        });
      }

      // Generate Download
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Kartu_${type === 'siswa' ? 'Siswa' : 'Ujian'}_${studentData.name.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();

    } catch (error) {
      console.error('Error generating card:', error);
      alert('Terjadi kesalahan saat membuat kartu. Pastikan koneksi lancar.');
    } finally {
      if (type === 'siswa') setGeneratingSiswa(false);
      else setGeneratingUjian(false);
    }
  };

  const initialWaiver = initialStudent?.fee_waiver_type || (initialStudent as any)?.feeWaiverType;
  const initialExempt = isFeeExempt(initialWaiver);
  const isSppBlocked = !initialExempt && initialSpp && initialSpp.length > 0 && !isSppSeptemberLunas(initialSpp);

  const handleUjianClick = async () => {
    // If we only have studentId but no sppInvoices, we let drawCard handle the fetching and alerting.
    if (isSppBlocked) {
      alert('Kartu Ujian tidak dapat diunduh. Pastikan tagihan Infaq/SPP sampai dengan bulan September sudah dilunasi.');
      return;
    }
    drawCard('ujian');
  };

  return (
    <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full sm:w-auto">
      <button
        onClick={() => drawCard('siswa')}
        disabled={generatingSiswa}
        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 px-5 py-2.5 rounded-xl hover:bg-indigo-100 transition font-medium w-full sm:w-auto whitespace-nowrap cursor-pointer"
      >
        {generatingSiswa ? <Loader2 size={18} className="animate-spin shrink-0" /> : <Download size={18} className="shrink-0" />}
        Kartu Siswa
      </button>
      
      <button
        onClick={handleUjianClick}
        disabled={generatingUjian}
        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl transition font-medium w-full sm:w-auto whitespace-nowrap cursor-pointer ${
          isSppBlocked 
            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' 
        }`}
        title={isSppBlocked ? "SPP sampai September belum lunas" : ""}
      >
        {generatingUjian ? <Loader2 size={18} className="animate-spin shrink-0" /> : (isSppBlocked ? <AlertCircle size={18} className="shrink-0" /> : <Download size={18} className="shrink-0" />)}
        Kartu Ujian
      </button>
    </div>
  );
};
