'use client'

import React, { useState } from 'react'
import { UploadCloud, X, CheckCircle, AlertTriangle, Image as ImageIcon } from 'lucide-react'

export function BulkPhotoUpload({ onSuccess, onClose }: { onSuccess: () => void, onClose: () => void }) {
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{name: string, status: 'success' | 'error', message?: string}[]>([])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      setFiles(selectedFiles)
      setResults([])
    }
  }

  async function handleUpload() {
    if (files.length === 0) return
    setLoading(true)
    setResults([])

    const newResults: typeof results = []

    for (const file of files) {
      try {
        const formData = new FormData()
        formData.append('photo', file)
        // File name without extension will be used as the student name
        const studentName = file.name.replace(/\.[^/.]+$/, "") 
        formData.append('studentName', studentName)

        const resp = await fetch('/api/students/bulk-photo', {
          method: 'POST',
          body: formData,
        })

        const data = await resp.json()

        if (resp.ok) {
          newResults.push({ name: studentName, status: 'success' })
        } else {
          newResults.push({ name: studentName, status: 'error', message: data.error || 'Gagal mengupload' })
        }
      } catch (err: any) {
        newResults.push({ name: file.name, status: 'error', message: err.message })
      }
    }

    setResults(newResults)
    setLoading(false)
    onSuccess() // Refresh the student list or trigger parent refresh
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ImageIcon className="text-blue-600" size={22} />
            Bulk Upload Foto Siswa
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
          
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
            <p className="font-semibold mb-1">Panduan Upload Foto:</p>
            <ul className="list-disc pl-5 text-xs space-y-1">
              <li>Pilih banyak foto sekaligus (format .jpg / .png)</li>
              <li>Pastikan nama file foto <strong>sama persis</strong> dengan nama siswa (contoh: <code>ADZKA WARADANA FITRIANSYAH.jpg</code>)</li>
            </ul>
          </div>

          {/* Drop zone */}
          <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-colors bg-slate-50 cursor-pointer">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              disabled={loading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className="flex flex-col items-center gap-2 text-slate-500 pointer-events-none">
              <UploadCloud className="w-12 h-12 text-slate-400 mb-1" />
              <span className="font-semibold text-slate-700">Klik atau blok file foto kesini</span>
              <span className="text-xs text-slate-400">{files.length > 0 ? `${files.length} file terpilih` : 'Pilih banyak file'}</span>
            </div>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-600">Hasil Upload:</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {results.map((r, i) => (
                  <div key={i} className={`text-xs p-2 rounded-lg flex items-start gap-2 ${r.status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {r.status === 'success' ? <CheckCircle size={14} className="mt-0.5 shrink-0" /> : <AlertTriangle size={14} className="mt-0.5 shrink-0" />}
                    <div>
                      <span className="font-semibold">{r.name}</span>
                      {r.message && <span className="block opacity-80">{r.message}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-200 transition"
          >
            Tutup
          </button>
          
          <button
            type="button"
            onClick={handleUpload}
            disabled={files.length === 0 || loading}
            className="px-5 py-2.5 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            {loading ? 'Mengupload...' : `Upload ${files.length} Foto`}
          </button>
        </div>
        
      </div>
    </div>
  )
}
