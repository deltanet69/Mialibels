'use client';

import React, { useState } from 'react';
import { Download, AlertCircle, Loader2 } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  nisn: string;
  student_number?: string;
  class: string;
  address?: string;
  image?: string;
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
  
  const fetchFullData = async () => {
    if (initialStudent && initialSpp && initialSpp.length > 3) {
      return { studentData: initialStudent, sppData: initialSpp };
    }
    
    const targetId = studentId || initialStudent?.id;
    if (!targetId) throw new Error("No student ID provided");
    
    const res = await fetch(`/api/students/${targetId}`);
    const result = await res.json();
    if (!result.success) throw new Error("Failed to fetch student data");
    
    return {
      studentData: result.data,
      sppData: result.data.spp_invoices || []
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

  const drawCard = async (type: 'siswa' | 'ujian') => {
    if (type === 'siswa') setGeneratingSiswa(true);
    else setGeneratingUjian(true);

    try {
      const { studentData, sppData } = await fetchFullData();
      
      if (type === 'ujian' && !isSppSeptemberLunas(sppData)) {
        alert('Kartu Ujian tidak dapat diunduh. Pastikan tagihan Infaq/SPP sampai dengan bulan September sudah dilunasi.');
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Canvas context not supported");

      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = '/kartu/kartutemplate.png';
      });

      // Original template dimensions
      canvas.width = 3150;
      canvas.height = 1800;

      // Draw background template
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Define fonts
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#000000'; // Black text

      // Draw Title
      ctx.font = 'bold 70px "Inter", "Segoe UI", sans-serif';
      const title = type === 'siswa' ? 'KARTU PELAJAR SISWA' : 'KARTU PESERTA UJIAN';
      ctx.fillText(title, 794, 650);

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
      
      // Simple word wrap for address
      const words = address.split(' ');
      let line = '';
      let currentY = addressY;
      const maxWidth = 1500; // max width for text

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        
        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line, 1493, currentY);
          line = words[n] + ' ';
          currentY += 60; // line height
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

      if (studentData.image) {
        const photo = new window.Image();
        photo.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          photo.onload = resolve;
          photo.onerror = reject;
          // Use a proxy or direct URL if it's external, we assume it's accessible or base64
          photo.src = studentData.image!;
        });
        ctx.drawImage(photo, photoX, photoY, photoW, photoH);
      } else {
        // Draw Grey Box Placeholder
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(photoX, photoY, photoW, photoH);
        
        // Draw placeholder text
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'normal 40px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('FOTO', photoX + photoW / 2, photoY + photoH / 2);
        ctx.fillText('3x4', photoX + photoW / 2, (photoY + photoH / 2) + 50);
        
        // Reset text alignment for other elements if any were added after
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
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

  const handleUjianClick = async () => {
    // If we only have studentId but no sppInvoices, we let drawCard handle the fetching and alerting.
    if (initialSpp && initialSpp.length > 0 && !isSppSeptemberLunas(initialSpp)) {
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
        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 px-5 py-2.5 rounded-xl hover:bg-indigo-100 transition font-medium w-full sm:w-auto whitespace-nowrap"
      >
        {generatingSiswa ? <Loader2 size={18} className="animate-spin shrink-0" /> : <Download size={18} className="shrink-0" />}
        Kartu Siswa
      </button>
      
      <button
        onClick={handleUjianClick}
        disabled={generatingUjian}
        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl transition font-medium w-full sm:w-auto whitespace-nowrap ${
          (initialSpp && initialSpp.length > 0 && !isSppSeptemberLunas(initialSpp)) 
            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' 
        }`}
        title={(initialSpp && initialSpp.length > 0 && !isSppSeptemberLunas(initialSpp)) ? "SPP sampai September belum lunas" : ""}
      >
        {generatingUjian ? <Loader2 size={18} className="animate-spin shrink-0" /> : ((initialSpp && initialSpp.length > 0 && !isSppSeptemberLunas(initialSpp)) ? <AlertCircle size={18} className="shrink-0" /> : <Download size={18} className="shrink-0" />)}
        Kartu Ujian
      </button>
    </div>
  );
};
