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
    `Assalamu'alaikum Panitia PPDB MI Attaqwa 15 Babelan. Saya orang tua dari ${data.student_name}, telah melakukan pendaftaran PPDB online dengan Nomor Registrasi: ${data.registration_number} (Batch ${data.batch}). Mohon konfirmasi verifikasinya. Terima kasih.`
  )
  const waUrl = `https://wa.me/${cleanPhone}?text=${waText}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto font-sans">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-7 text-center text-white relative">
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
          
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3.5 shadow-inner">
            <CheckCircle2 size={36} className="text-white" />
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-emerald-50 text-[11px] font-bold uppercase tracking-wider mb-1">
            <Sparkles size={12} />
            <span>Pendaftaran Berhasil Terkirim</span>
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight mt-1 text-white">
            Alhamdulillah!
          </h2>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1">
            Data calon siswa telah masuk ke sistem PPDB MI Attaqwa 15 Babelan.
          </p>
        </div>

        {/* Printable Slip Container */}
        <div id="ppdb-printable-slip" className="p-6 sm:p-7 space-y-5 bg-white">
          
          {/* Registration Number Card */}
          <div className="bg-emerald-50/80 border-2 border-dashed border-emerald-300 rounded-2xl p-5 text-center relative group">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
              Nomor Registrasi PPDB
            </span>
            <div className="flex items-center justify-center gap-2">
              <span className="font-mono text-2xl sm:text-3xl font-black text-emerald-900 tracking-wider">
                {data.registration_number}
              </span>
              <button 
                onClick={handleCopyRegNumber}
                className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded-xl transition cursor-pointer"
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
            <p className="text-[11px] text-emerald-700 font-medium mt-1">
              Simpan nomor ini untuk pengecekan status dan melengkapi berkas.
            </p>
          </div>

          {/* Applicant Summary */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4.5 space-y-2.5 text-xs sm:text-sm">
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Nama Calon Siswa</span>
              <span className="font-bold text-slate-900">{data.student_name}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Tahun Ajaran</span>
              <span className="font-semibold text-slate-800">{data.academic_year}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="text-slate-500 font-medium">Gelombang Pendaftaran</span>
              <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100">
                Batch {data.batch}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 font-medium">Biaya Formulir &amp; Tes</span>
              <span className="font-bold text-emerald-700">
                Rp {(Number(data.payment_amount) || 200000).toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Verification Notice */}
          <div className="flex items-start gap-3 p-3.5 bg-blue-50/80 border border-blue-100 rounded-2xl text-xs text-blue-900">
            <ShieldCheck size={20} className="text-blue-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Panitia PPDB akan memverifikasi bukti pembayaran dalam <strong>1x24 jam</strong>. Email konfirmasi telah kami kirimkan ke email orang tua.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <a 
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-tactile flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-2xl text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              <MessageSquare size={16} />
              <span>Konfirmasi via WhatsApp</span>
            </a>
            <button 
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 px-5 rounded-2xl text-xs font-bold transition cursor-pointer"
            >
              <Printer size={16} />
              <span>Cetak Slip</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  )
}
