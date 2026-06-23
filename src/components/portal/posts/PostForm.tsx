'use client'

import React, { useState } from 'react'
import { X, FileText, Save } from 'lucide-react'
import dynamic from 'next/dynamic'
import 'react-quill-new/dist/quill.snow.css'

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false })

type PostFormProps = {
  initialData?: any
  onSuccess: () => void
  onClose: () => void
}

export function PostForm({ initialData, onSuccess, onClose }: PostFormProps) {
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const isEditing = !!initialData

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    category: initialData?.category || 'Berita Sekolah',
    author: initialData?.author || '',
    thumbnail: initialData?.thumbnail || '',
    link: initialData?.link || '',
    reading_time: initialData?.reading_time || 0,
    content: initialData?.content || '',
    // tags: initialData?.tags || [],
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || 'Gagal mengunggah gambar')
      
      setFormData(prev => ({ ...prev, thumbnail: data.url }))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const url = isEditing ? `/api/posts/${initialData.id}` : '/api/posts'
      const method = isEditing ? 'PUT' : 'POST'

      const payload = { ...formData, reading_time: Number(formData.reading_time) }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan.')

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            {isEditing ? <Save className="text-blue-600" /> : <FileText className="text-blue-600" />}
            {isEditing ? 'Edit Berita/Artikel' : 'Tambah Berita/Artikel'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5 col-span-1 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Judul *</label>
                <input 
                  required
                  type="text" 
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Masukkan judul..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Slug (Opsional)</label>
                <input 
                  type="text" 
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="Terisi otomatis jika kosong"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Kategori *</label>
                <select 
                  required
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none"
                >
                  <option value="Berita Sekolah">Berita Sekolah</option>
                  <option value="Artikel Pendidikan">Artikel Pendidikan</option>
                  <option value="Pengumuman">Pengumuman</option>
                  <option value="Prestasi">Prestasi</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Penulis *</label>
                <input 
                  required
                  type="text" 
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  placeholder="Nama Penulis/Tim"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Waktu Baca (Menit)</label>
                <input 
                  type="number" 
                  name="reading_time"
                  value={formData.reading_time}
                  onChange={handleChange}
                  placeholder="Misal: 3"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none"
                />
              </div>

              <div className="space-y-1.5 col-span-1 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Thumbnail Gambar (Otomatis WebP)</label>
                <div className="flex flex-col gap-3">
                  {formData.thumbnail && (
                    <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={formData.thumbnail} alt="Thumbnail" className="object-cover w-full h-full" />
                      <button 
                        type="button" 
                        onClick={() => setFormData(prev => ({ ...prev, thumbnail: '' }))}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-md hover:bg-red-600 transition"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {uploadingImage && <span className="text-sm text-blue-600 font-medium animate-pulse">Mengunggah gambar...</span>}
                </div>
              </div>

              <div className="space-y-1.5 col-span-1 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">URL Eksternal / Tautan Tambahan (Opsional)</label>
                <input 
                  type="url" 
                  name="link"
                  value={formData.link}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none"
                />
              </div>

              <div className="space-y-1.5 col-span-1 md:col-span-2 pb-12">
                <label className="text-sm font-medium text-slate-700">Konten Artikel *</label>
                <div className="bg-white rounded-xl overflow-hidden border border-slate-200">
                  <ReactQuill 
                    theme="snow"
                    value={formData.content}
                    onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                    className="h-64 mb-10"
                  />
                </div>
              </div>

            </div>
          </div>

          <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-200 transition"
            >
              Batal
            </button>
            <button 
              type="submit"
              disabled={loading || uploadingImage}
              className="px-5 py-2.5 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-2"
            >
              {loading ? 'Menyimpan...' : 'Simpan Postingan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
