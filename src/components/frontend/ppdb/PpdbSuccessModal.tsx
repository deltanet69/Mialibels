'use client'

import React from 'react'
import { CheckCircle2, Printer, X, MessageSquare, Sparkles, Copy, Calendar, User, ShieldCheck, Download } from 'lucide-react'

type PpdbSuccessModalProps = {
  data: {
    registration_number: string
    student_name: string
    academic_year: string
    batch: number
    payment_amount: number
    father_name?: string
    father_phone?: string
  }
  temporaryPassword?: string
  whatsappContact?: string
  onClose: () => void
}

export default function PpdbSuccessModal({ data, temporaryPassword, whatsappContact = '6281234567890', onClose }: PpdbSuccessModalProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopyRegNumber = () => {
    navigator.clipboard.writeText(data.registration_number)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = () => {
    window.print()
  }

  const cleanPhone = whatsappContact.replace(/[^0-9]/g, '')
  const waText = encodeURIComponent(
    `Assalamu'alaikum Panitia SPMB MI Attaqwa 15 Babelan. Saya orang tua dari ${data.student_name}, telah melakukan pendaftaran SPMB online dengan Nomor Registrasi: ${data.registration_number} (Batch ${data.batch}). Mohon konfirmasi verifikasinya. Terima kasih.`
  )
  const waUrl = `https://wa.me/${cleanPhone}?text=${waText}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2.5 sm:p-4 md:p-6 overflow-y-auto font-sans">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200/80 my-auto max-h-[min(94dvh,94vh)] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-5 sm:p-7 text-center text-white relative shrink-0">
          <button 
            onClick={onClose}
            className="absolute right-3 top-3 sm:right-4 sm:top-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
          
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-2.5 sm:mb-3.5 shadow-inner">
            <CheckCircle2 className="w-7 h-7 sm:w-9 sm:h-9 text-white" />
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 sm:py-1 rounded-full bg-white/20 text-emerald-50 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-1">
            <Sparkles size={11} />
            <span>Pendaftaran Berhasil Terkirim</span>
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1 text-white">
            Alhamdulillah!
          </h2>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-sm mx-auto">
            Data calon siswa telah masuk ke sistem SPMB MI Attaqwa 15 Babelan.
          </p>
        </div>

        {/* Printable Slip Container (Scrollable) */}
        <div id="ppdb-printable-slip" className="p-4 sm:p-6 space-y-4 sm:space-y-5 bg-white overflow-y-auto custom-scrollbar flex-1">
          
          {/* Registration Number Card */}
          <div className="bg-emerald-50/80 border-2 border-dashed border-emerald-300 rounded-2xl p-4 sm:p-5 text-center relative group">
            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
              Nomor Registrasi SPMB
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="font-mono text-xl sm:text-2xl md:text-3xl font-black text-emerald-900 tracking-wider break-all">
                {data.registration_number}
              </span>
              <button 
                onClick={handleCopyRegNumber}
                className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded-xl transition cursor-pointer shrink-0"
                title="Salin Nomor Registrasi"
              >
                <Copy size={16} />
              </button>
            </div>
            {copied && (
              <span className="text-[10px] text-emerald-700 font-bold block mt-1">
                Tersalin ke clipboard!
              </span>
            )}
            <p className="text-[10px] sm:text-[11px] text-emerald-700 font-medium mt-1">
              Simpan nomor ini untuk pengecekan status dan melengkapi berkas.
            </p>
          </div>

          {/* Applicant Summary */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 sm:p-4.5 space-y-2.5 text-xs sm:text-sm">
            <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1 py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Nama Calon Siswa</span>
              <span className="font-bold text-slate-900 break-words text-right xs:max-w-[65%]">{data.student_name}</span>
            </div>
            <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1 py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Tahun Ajaran</span>
              <span className="font-semibold text-slate-800">{data.academic_year}</span>
            </div>
            <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1 py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Gelombang Pendaftaran</span>
              <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100 w-fit">
                Batch {data.batch}
              </span>
            </div>
            <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1 py-1">
              <span className="text-slate-500 font-medium">Biaya Formulir &amp; Tes</span>
              <span className="font-bold text-emerald-700">
                Rp {(Number(data.payment_amount) || 300000).toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Verification Notice */}
          <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-3.5 bg-blue-50/80 border border-blue-100 rounded-2xl text-xs text-blue-900">
            <ShieldCheck size={18} className="text-blue-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px] sm:text-xs">
              Panitia SPMB akan memverifikasi bukti pembayaran dalam <strong>1x24 jam</strong>. Email konfirmasi telah kami kirimkan ke email orang tua.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <a 
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-tactile flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 sm:py-3 px-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer text-center"
            >
              <MessageSquare size={15} />
              <span>Konfirmasi via WhatsApp</span>
            </a>
            <button 
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 sm:py-3 px-4 sm:px-5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition cursor-pointer text-center"
            >
              <Printer size={15} />
              <span>Cetak Slip</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  )
}
