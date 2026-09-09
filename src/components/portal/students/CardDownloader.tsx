'use client';

import React, { useState, useRef } from 'react';
import { Download, AlertCircle, Loader2, Printer, X, CheckCircle2, Eye } from 'lucide-react';
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
  generalInvoices?: any[];
}

export const CardDownloader: React.FC<CardDownloaderProps> = ({ 
  studentId, 
  student: initialStudent, 
  sppInvoices: initialSpp, 
  generalInvoices: initialGeneral 
}) => {
  const [generatingSiswa, setGeneratingSiswa] = useState(false);
  const [generatingUjian, setGeneratingUjian] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    type: 'siswa' | 'ujian';
    dataUrl: string;
    studentName: string;
  } | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isFeeExempt = (waiverType?: string | null) => {
    if (!waiverType) return false;
    const val = String(waiverType).toLowerCase().trim();
    return val === 'anak_yatim' || val === 'keluarga guru' || val.includes('yatim') || val.includes('guru') || val.includes('yayasan');
  };
  
  const fetchFullData = async () => {
    const targetId = studentId || initialStudent?.id;
    
    let studentData: any = initialStudent;
    let sppData: any[] = initialSpp || [];
    let generalData: any[] = initialGeneral || [];

    if (targetId) {
      try {
        const res = await fetch(`/api/students/${targetId}`);
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data) {
            studentData = result.data;
            sppData = result.data.spp_invoices || sppData;
            generalData = result.data.general_invoices || generalData;
          }
        }
      } catch (err) {
        console.warn('Could not fetch /api/students, using props fallback:', err);
      }
    }

    if (!studentData && !initialStudent) {
      throw new Error("Data siswa tidak tersedia.");
    }

    return {
      studentData: studentData || initialStudent,
      sppData,
      generalData
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

  const printCardDirectly = (dataUrl: string, studentName: string, type: 'siswa' | 'ujian') => {
    const isUjian = type === 'ujian';
    const title = isUjian ? `Kartu Ujian - ${studentName}` : `Kartu Pelajar - ${studentName}`;
    const widthCm = isUjian ? '12cm' : '8.56cm';
    const heightCm = isUjian ? '10cm' : '5.4cm';
    const cutNote = isUjian 
      ? 'Garis potong kartu ujian: 12 cm × 10 cm (Kertas HVS/A4)' 
      : 'Garis potong kartu pelajar: Standar ID Card (Kertas HVS/A4)';

    // Use hidden iframe to trigger seamless print without opening extra tabs
    let iframe = document.getElementById('card-print-iframe') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'card-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100%;
            height: 100%;
            background: #ffffff;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          .page-container {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding-top: 8mm;
          }
          .card-wrapper {
            width: ${widthCm};
            height: ${heightCm};
            max-width: ${widthCm};
            max-height: ${heightCm};
            position: relative;
            box-sizing: border-box;
            border: 1px dashed #64748b;
            border-radius: 2px;
            overflow: hidden;
            margin: 0 auto;
            page-break-inside: avoid;
            background: #ffffff;
          }
          .card-wrapper img {
            width: 100%;
            height: 100%;
            display: block;
            object-fit: fill;
          }
          .cut-guide {
            margin-top: 6px;
            font-size: 11px;
            color: #475569;
            font-weight: 600;
            text-align: center;
            font-family: sans-serif;
            letter-spacing: 0.2px;
          }
          .school-footer {
            margin-top: 3px;
            font-size: 9px;
            color: #94a3b8;
            text-align: center;
            font-family: sans-serif;
          }
        </style>
      </head>
      <body>
        <div class="page-container">
          <div class="card-wrapper">
            <img src="${dataUrl}" alt="${title}" />
          </div>
          <div class="cut-guide">
            ✂️ ${cutNote}
          </div>
          <div class="school-footer">
            MI Attaqwa 15 Babelan • Dokumen Resmi Siswa
          </div>
        </div>
      </body>
      </html>
    `;

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      }, 350);
    }
  };

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
          `${studentData.student_number || studentData.studentNumber || studentData.nis || '-'} / ${studentData.nisn || '-'}`,
          studentData.class || studentData.className || '-',
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
        // Kartu Peserta Ujian / Asesmen Kokurikuler (2834 x 2362 px - Exact 12cm x 10cm @ 600 DPI)
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

        const rawClass = studentData.class || studentData.className || '-';
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

      // Generate Data URL
      const dataUrl = canvas.toDataURL('image/png');
      
      // Open Preview & Print Modal
      setPreviewModal({
        isOpen: true,
        type,
        dataUrl,
        studentName: studentData.name || 'Siswa'
      });

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

  const handleDownloadFile = () => {
    if (!previewModal) return;
    const link = document.createElement('a');
    link.download = `Kartu_${previewModal.type === 'siswa' ? 'Siswa' : 'Ujian'}_${previewModal.studentName.replace(/\s+/g, '_')}.png`;
    link.href = previewModal.dataUrl;
    link.click();
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row flex-wrap items-center gap-3 w-full sm:w-auto">
        <button
          onClick={() => drawCard('siswa')}
          disabled={generatingSiswa}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 px-5 py-2.5 rounded-xl hover:bg-indigo-100 transition font-medium w-full sm:w-auto whitespace-nowrap cursor-pointer shadow-2xs"
        >
          {generatingSiswa ? <Loader2 size={18} className="animate-spin shrink-0" /> : <Eye size={18} className="shrink-0" />}
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
          {generatingUjian ? <Loader2 size={18} className="animate-spin shrink-0" /> : (isSppBlocked ? <AlertCircle size={18} className="shrink-0" /> : <Printer size={18} className="shrink-0" />)}
          Cetak Kartu Ujian
        </button>
      </div>

      {/* ── PREVIEW & PRINT MODAL ── */}
      {previewModal?.isOpen && (
        <div className="fixed inset-0 z-[99999] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 flex flex-col gap-5 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold uppercase tracking-wider mb-1">
                  <span>{previewModal.type === 'ujian' ? 'Kartu Peserta Ujian' : 'Kartu Pelajar Siswa'}</span>
                </div>
                <h3 className="font-headline font-bold text-lg sm:text-xl text-slate-800">
                  {previewModal.studentName}
                </h3>
              </div>
              <button
                onClick={() => setPreviewModal(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                aria-label="Tutup"
              >
                <X size={20} />
              </button>
            </div>

            {/* Preview Image Card with Exact Ratio */}
            <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
              <div 
                className="w-full max-w-[380px] rounded-xl overflow-hidden shadow-md border border-slate-200"
                style={{ aspectRatio: previewModal.type === 'ujian' ? '12 / 10' : '3150 / 1800' }}
              >
                <img 
                  src={previewModal.dataUrl} 
                  alt="Pratinjau Kartu" 
                  className="w-full h-full object-contain block"
                />
              </div>

              {/* Dimensions Badge */}
              <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200/90 px-3 py-1 rounded-full shadow-2xs">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                <span>
                  {previewModal.type === 'ujian'
                    ? 'Ukuran Cetak Pas: 12 cm × 10 cm (Kertas HVS/A4)'
                    : 'Ukuran Cetak: Standar ID Card (Kertas HVS/A4)'}
                </span>
              </div>
            </div>

            {/* Info Notice */}
            <p className="text-xs text-slate-500 leading-relaxed bg-blue-50/60 border border-blue-100/80 rounded-xl p-3 text-center">
              💡 <strong>Tips Cetak:</strong> Klik <strong>&quot;Cetak Sekarang&quot;</strong> untuk mencetak langsung dengan ukuran pas 12×10 cm di atas kertas HVS/A4 tanpa terpotong atau melebar ke seluruh kertas.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
              <button
                onClick={() => printCardDirectly(previewModal.dataUrl, previewModal.studentName, previewModal.type)}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Printer size={18} />
                <span>Cetak Sekarang (12x10 CM)</span>
              </button>

              <button
                onClick={handleDownloadFile}
                className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all cursor-pointer"
              >
                <Download size={18} />
                <span>Unduh Gambar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
