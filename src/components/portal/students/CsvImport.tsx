'use client'

import React, { useState } from 'react'
import Papa from 'papaparse'
import { UploadCloud, FileSpreadsheet, X, CheckCircle, AlertTriangle } from 'lucide-react'

export function CsvImport({ onSuccess, onClose }: { onSuccess: () => void, onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<any[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      setError(null)
      
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setPreview(results.data.slice(0, 3)) // show first 3 rows
        },
        error: (error) => {
          setError('Gagal membaca file CSV: ' + error.message)
        }
      })
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setLoading(true)
    setError(null)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const students = results.data.map((row: any) => ({
            name: row.name || row.Nama || '',
            student_number: row.student_number || row.NIS || '',
            class: row.class || row.Kelas || '',
            parent_name: row.parent_name || row['Nama Orang Tua'] || row.OrangTua || '',
            parent_phone: row.parent_phone || row['No HP'] || row.NoHP || '',
            parent_email: row.parent_email || row.Email || null,
            is_active: true
          })).filter(s => s.name && s.student_number && s.class)

          if (students.length === 0) {
            throw new Error('Tidak ada data valid yang ditemukan. Pastikan format kolom benar (name, student_number, class, parent_name, parent_phone).')
          }

          const res = await fetch('/api/students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isBulk: true, students })
          })

          const data = await res.json()

          if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan saat upload.')

          onSuccess()
          onClose()
        } catch (err: any) {
          setError(err.message)
          setLoading(false)
        }
      },
      error: (error) => {
        setError('Gagal mem-parsing CSV: ' + error.message)
        setLoading(false)
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="text-blue-600" />
            Import Data Siswa (CSV)
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-start gap-3">
              <AlertTriangle className="shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-blue-500 transition-colors bg-slate-50 cursor-pointer relative">
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center gap-2 text-slate-500">
              {file ? (
                <>
                  <CheckCircle className="text-green-500 w-12 h-12 mb-2" />
                  <span className="font-semibold text-slate-700">{file.name}</span>
                  <span className="text-xs">{(file.size / 1024).toFixed(2)} KB</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-12 h-12 text-slate-400 mb-2" />
                  <span className="font-semibold text-slate-700">Klik atau drag file CSV kesini</span>
                  <span className="text-sm">Gunakan header: name, student_number, class, parent_name, parent_phone</span>
                </>
              )}
            </div>
          </div>

          {preview.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-slate-600 mb-2">Preview Data (3 baris pertama):</h4>
              <div className="bg-slate-50 rounded-xl overflow-x-auto text-xs border border-slate-100">
                <table className="w-full text-left whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-500">
                      <th className="px-3 py-2 font-medium">NIS</th>
                      <th className="px-3 py-2 font-medium">Nama</th>
                      <th className="px-3 py-2 font-medium">Kelas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0">
                        <td className="px-3 py-2 text-slate-700">{row.student_number || row.NIS || '-'}</td>
                        <td className="px-3 py-2 text-slate-700">{row.name || row.Nama || '-'}</td>
                        <td className="px-3 py-2 text-slate-700">{row.class || row.Kelas || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-200 transition"
          >
            Batal
          </button>
          <button 
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
