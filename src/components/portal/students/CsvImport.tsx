'use client'

import React, { useState } from 'react'
import Papa from 'papaparse'
import { UploadCloud, FileSpreadsheet, X, CheckCircle, AlertTriangle, Download } from 'lucide-react'

export function CsvImport({ onSuccess, onClose }: { onSuccess: () => void, onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<any[]>([])

  // ─── Download Template ──────────────────────────────────────────────────────
  function handleDownloadTemplate() {
    const headers = [
      'nisn',
      'name',
      'student_number',
      'class',
      'parent_name',
      'parent_phone',
      'parent_email',
      'is_active',
      'tempat_lahir',
      'tanggal_lahir',
      'alamat',
      'foto_url'
    ]
    const rows = [
      ['0123456789', 'Budi Santoso', '2023001', '1A', 'Joko Santoso', '081234567890', 'joko@email.com', 'true', 'Jakarta', '2015-08-17', 'Jl. Merdeka No. 10 Jakarta', 'https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9/view?usp=sharing'],
      ['0234567891', 'Siti Aminah', '2023002', '1B', 'Ahmad Syarif', '082298765432', 'ahmad@email.com', 'true', 'Bandung', '2015-09-10', 'Jl. Mawar No. 5 Bekasi', 'https://drive.google.com/file/d/2B3C4D5E6F7G8H9I0/view?usp=sharing'],
      ['0345678912', 'Dani Pratama', '2023003', '2A', 'Bapak Dani', '083312345678', '', 'true', 'Surabaya', '2014-01-05', 'Jl. Kebon Jeruk Babelan', ''],
    ]

    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')
    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template_data_siswa.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // ─── File select ────────────────────────────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setError(null)
    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => setPreview(res.data.slice(0, 3)),
      error: (err) => setError('Gagal membaca file: ' + err.message),
    })
  }

  // ─── Upload ─────────────────────────────────────────────────────────────────
  async function handleUpload() {
    if (!file) return
    setLoading(true)
    setError(null)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (res) => {
        try {
          const students = (res.data as any[])
            .map((row) => ({
              nisn: (row.nisn || row.NISN || '').toString().trim() || null,
              name: (row.name || row.Nama || row['Nama Lengkap'] || '').toString().trim(),
              student_number: (row.student_number || row.NIS || '').toString().trim() || null,
              class: (row.class || row.Kelas || '').toString().trim(),
              parent_name: (row.parent_name || row['Nama Orang Tua'] || row['Orang Tua'] || '').toString().trim(),
              parent_phone: (row.parent_phone || row['No HP'] || row['No HP Orang Tua'] || '').toString().trim(),
              parent_email: (row.parent_email || row.Email || '').toString().trim() || null,
              is_active: row.is_active !== 'false',
              place_of_birth: (row.tempat_lahir || row['Tempat Lahir'] || row.place_of_birth || '').toString().trim() || null,
              date_of_birth: (row.tanggal_lahir || row['Tanggal Lahir'] || row.date_of_birth || '').toString().trim() || null,
              address: (row.alamat || row.Alamat || row.address || '').toString().trim() || null,
              photo_url: (row.foto_url || row['Foto Siswa'] || row['Foto URL'] || row.foto || row.photo_url || '').toString().trim() || null,
            }))
            .filter((s) => s.name && s.class)

          if (students.length === 0) {
            throw new Error(
              'Tidak ada data valid. Pastikan minimal kolom "name" dan "class" telah terisi.'
            )
          }

          const resp = await fetch('/api/students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isBulk: true, students }),
          })
          const data = await resp.json()
          if (!resp.ok) throw new Error(data.error || 'Gagal mengimpor data.')

          onSuccess()
          onClose()
        } catch (err: any) {
          setError(err.message)
          setLoading(false)
        }
      },
      error: (err) => {
        setError('Gagal mem-parsing CSV: ' + err.message)
        setLoading(false)
      },
    })
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="text-blue-600" size={22} />
            Import Data Siswa
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">

          {/* Info banner */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
            <p className="font-semibold mb-1">Kolom yang tersedia:</p>
            <p className="font-mono text-xs leading-relaxed">
              nisn, name, student_number, class, parent_name, parent_phone, parent_email, is_active, tempat_lahir, tanggal_lahir, alamat, foto_url
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-start gap-3">
              <AlertTriangle className="shrink-0 mt-0.5" size={18} />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Drop zone */}
          <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-colors bg-slate-50 cursor-pointer">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center gap-2 text-slate-500 pointer-events-none">
              {file ? (
                <>
                  <CheckCircle className="text-green-500 w-12 h-12 mb-1" />
                  <span className="font-semibold text-slate-700">{file.name}</span>
                  <span className="text-xs">{(file.size / 1024).toFixed(2)} KB</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-12 h-12 text-slate-400 mb-1" />
                  <span className="font-semibold text-slate-700">Klik atau drag file CSV kesini</span>
                  <span className="text-xs text-slate-400">Format: .csv</span>
                </>
              )}
            </div>
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-slate-600 mb-2">
                Preview (3 baris pertama):
              </p>
              <div className="bg-slate-50 rounded-xl overflow-x-auto text-xs border border-slate-100">
                <table className="w-full text-left whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-500">
                      <th className="px-3 py-2 font-medium">NIS</th>
                      <th className="px-3 py-2 font-medium">Nama</th>
                      <th className="px-3 py-2 font-medium">Kelas</th>
                      <th className="px-3 py-2 font-medium">Orang Tua</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0">
                        <td className="px-3 py-2 text-slate-700">{row.student_number || '-'}</td>
                        <td className="px-3 py-2 text-slate-700">{row.name || '-'}</td>
                        <td className="px-3 py-2 text-slate-700">{row.class || '-'}</td>
                        <td className="px-3 py-2 text-slate-700">{row.parent_name || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center gap-3">
          {/* Download template — kiri */}
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 transition"
          >
            <Download size={16} />
            Download Template
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Batal */}
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-200 transition"
          >
            Batal
          </button>

          {/* Upload */}
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || loading}
            className="px-5 py-2.5 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            {loading ? 'Mengimpor...' : 'Upload Data'}
          </button>
        </div>

      </div>
    </div>
  )
}
