'use client'

import React, { useState } from 'react'
import Papa from 'papaparse'
import { UploadCloud, FileSpreadsheet, X, CheckCircle, AlertTriangle, Download } from 'lucide-react'

interface CsvImportGuruProps {
  onSuccess: () => void
  onClose: () => void
}

export function CsvImportGuru({ onSuccess, onClose }: CsvImportGuruProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  
  // ─── Download Template ──────────────────────────────────────────────────────
  function handleDownloadTemplate() {
    const headers = [
      'name',
      'position',
      'email',
      'phone',
      'education_level',
      'major',
      'address',
      'is_active',
    ]
    const rows = [
      ['Ahmad Zainuddin', 'Guru Matematika', 'ahmad.z@email.com', '081234567890', 'S1', 'Pendidikan Matematika', 'Jl. Merdeka No 1', 'true'],
      ['Siti Aminah', 'Guru Bahasa Inggris', 'siti.a@email.com', '082198765432', 'S1', 'Sastra Inggris', 'Jl. Kenangan No 2', 'true'],
    ]

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template_guru_staff.csv'
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

  // ─── Upload File ────────────────────────────────────────────────────────────
  async function handleUpload() {
    if (!file) return
    setLoading(true)
    setError(null)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (res) => {
        try {
          const staffs = (res.data as any[])
            .map((row) => ({
              name: row.name || row.Nama || '',
              position: row.position || row.Jabatan || '',
              email: row.email || row.Email || null,
              phone: row.phone || row['No HP'] || null,
              education_level: row.education_level || row.Pendidikan || null,
              major: row.major || row.Jurusan || null,
              address: row.address || row.Alamat || null,
              is_active: row.is_active !== 'false' && row.is_active !== '0',
            }))
            .filter((s) => s.name && s.position)

          if (staffs.length === 0) {
            throw new Error('Data kosong atau tidak ada baris yang valid (wajib isi nama & jabatan)')
          }

          const apiRes = await fetch('/api/guru', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isBulk: true, staffs }),
          })

          const data = await apiRes.json()

          if (!data.success) {
            throw new Error(data.error || 'Gagal menyimpan data guru/staff')
          }

          onSuccess()
          onClose()
        } catch (err: any) {
          setError(err.message)
          setLoading(false)
        }
      },
      error: (err) => {
        setError('Gagal mem-parsing file: ' + err.message)
        setLoading(false)
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white shrink-0">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="text-blue-600" size={22} />
            Import Data Guru/Staff
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition p-1 hover:bg-slate-50 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto">
          {/* Info banner */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
            <p className="font-semibold mb-1">Kolom yang diperlukan:</p>
            <p className="font-mono text-xs leading-relaxed">
              name, position, email, phone, education_level, major, address, is_active
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
              accept=".csv,.txt"
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
                  <span className="font-semibold text-slate-700">Klik atau drag file CSV / TXT kesini</span>
                  <span className="text-xs text-slate-400">Format: .csv atau .txt</span>
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
                      <th className="px-3 py-2 font-medium">Nama</th>
                      <th className="px-3 py-2 font-medium">Jabatan</th>
                      <th className="px-3 py-2 font-medium">Email</th>
                      <th className="px-3 py-2 font-medium">No HP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0">
                        <td className="px-3 py-2 text-slate-700">{row.name || '-'}</td>
                        <td className="px-3 py-2 text-slate-700">{row.position || '-'}</td>
                        <td className="px-3 py-2 text-slate-700">{row.email || '-'}</td>
                        <td className="px-3 py-2 text-slate-700">{row.phone || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 transition"
          >
            <Download size={16} />
            Download Template
          </button>

          <div className="flex-1" />

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-medium text-sm text-slate-600 hover:bg-slate-200 transition"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || loading}
            className="px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            {loading ? 'Mengimpor...' : 'Upload Data'}
          </button>
        </div>

      </div>
    </div>
  )
}
