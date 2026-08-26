'use client'

import React, { useState } from 'react'
import { 
  X, FileText, Save, Sparkles, Image as ImageIcon, Star, Clock, 
  User, Link as LinkIcon, AlertCircle, Loader2, ArrowUpRight,
  School, BookOpen, Trophy, Megaphone
} from 'lucide-react'
import dynamic from 'next/dynamic'

const TiptapEditor = dynamic(() => import('./TiptapEditor'), { 
  ssr: false, 
  loading: () => (
    <div className="h-[360px] border border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 gap-2 bg-slate-50/50">
      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      <span className="text-xs font-semibold">Memuat rich editor...</span>
    </div>
  ) 
})

type PostFormProps = {
  initialData?: any
  onSuccess: () => void
  onClose: () => void
}

const CATEGORIES = [
  { label: 'Berita Sekolah', emoji: '🏫', desc: 'Kegiatan madrasah, dinamika & agenda sekolah', color: 'text-blue-600', activeBg: 'bg-blue-50 border-blue-500 text-blue-700' },
  { label: 'Artikel Pendidikan', emoji: '📚', desc: 'Edukasi, wawasan parenting & tulisan guru', color: 'text-emerald-600', activeBg: 'bg-emerald-50 border-emerald-500 text-emerald-700' },
  { label: 'Prestasi', emoji: '🏆', desc: 'Juara lomba, piagam, & capaian siswa/guru', color: 'text-amber-600', activeBg: 'bg-amber-50 border-amber-500 text-amber-800' },
  { label: 'Pengumuman', emoji: '📢', desc: 'Surat edaran, info libur & pemberitahuan resmi', color: 'text-purple-600', activeBg: 'bg-purple-50 border-purple-500 text-purple-700' }
]

export function PostForm({ initialData, onSuccess, onClose }: PostFormProps) {
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const isEditing = !!initialData

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    category: initialData?.category || 'Berita Sekolah',
    author: initialData?.author || 'Tim Media MI 15',
    thumbnail: initialData?.thumbnail || '',
    link: initialData?.link || '',
    reading_time: initialData?.reading_time || 3,
    content: initialData?.content || '',
  })
  
  // Featured flag — stored as 'featured' in the tags array
  const [isFeatured, setIsFeatured] = useState<boolean>(
    Array.isArray(initialData?.tags) ? initialData.tags.includes('featured') : false
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Auto generate slug from title if slug is empty or user is typing title in creation mode
    if (name === 'title' && !isEditing && (!formData.slug || formData.slug === slugify(formData.title))) {
      setFormData(prev => ({ ...prev, title: value, slug: slugify(value) }))
    }
  }

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset input value so choosing the same file again triggers onChange
    const inputElement = e.target
    inputElement.value = ''

    setUploadingImage(true)
    setError(null)

    const fd = new FormData()
    fd.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd
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
    if (!formData.title.trim()) {
      setError('Judul konten wajib diisi')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const url = isEditing ? `/api/posts/${initialData.id}` : '/api/posts'
      const method = isEditing ? 'PUT' : 'POST'

      const existingTags: string[] = Array.isArray(initialData?.tags) ? [...initialData.tags] : []
      const tagsWithoutFeatured = existingTags.filter((t: string) => t !== 'featured')
      const tags = isFeatured ? ['featured', ...tagsWithoutFeatured] : tagsWithoutFeatured

      const payload = {
        ...formData,
        reading_time: Number(formData.reading_time) || 3,
        tags,
        slug: formData.slug.trim() || slugify(formData.title)
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan saat menyimpan konten.')

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200 font-sans">
      <div className="bg-white rounded-3xl sm:rounded-[2rem] shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-200/80 my-auto flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-slate-100 bg-white sticky top-0 z-20 font-sans">
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-2xs ${
              isEditing ? 'bg-amber-50 border border-amber-200 text-amber-600' : 'bg-blue-50 border border-blue-200 text-blue-600'
            }`}>
              {isEditing ? <Save size={20} /> : <FileText size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                  {isEditing ? 'Mode Edit' : 'Konten Baru'}
                </span>
                {isFeatured && (
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                    <Star size={11} className="fill-amber-500 text-amber-500" />
                    <span>Featured</span>
                  </span>
                )}
              </div>
              <h2 className="font-sans font-bold text-lg sm:text-xl text-slate-900 tracking-tight mt-0.5">
                {isEditing ? 'Perbarui Konten Publikasi' : 'Tulis Berita & Artikel Baru'}
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
            title="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar flex flex-col font-sans">
          <div className="p-6 sm:p-8 space-y-7">
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Top Grid: Main Metadata & Visual Thumbnail */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Essential Article Information (7 cols) */}
              <div className="lg:col-span-7 space-y-5">
                
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                    <span>Judul Artikel / Berita <span className="text-rose-500">*</span></span>
                    <span className="text-xs text-slate-400 font-normal">{formData.title.length} karakter</span>
                  </label>
                  <input 
                    required
                    type="text" 
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Contoh: Semarak Milad MI Attaqwa 15 Babelan..."
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition text-sm sm:text-base font-semibold text-slate-900 placeholder:text-slate-400 outline-none"
                  />
                </div>

                {/* Slug */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <LinkIcon size={13} className="text-slate-400" />
                    <span>Slug / URL Permalink</span>
                  </label>
                  <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10 transition">
                    <span className="pl-4 text-xs font-medium text-slate-400 select-none">/news/</span>
                    <input 
                      type="text" 
                      name="slug"
                      value={formData.slug}
                      onChange={handleChange}
                      placeholder="otomatis-dari-judul"
                      className="w-full px-2 py-3 bg-transparent text-xs sm:text-sm font-mono font-medium text-slate-800 outline-none"
                    />
                  </div>
                </div>

                {/* Category Picker (Playful Grid Selection) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Pilih Kategori <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {CATEGORIES.map(cat => {
                      const isSelected = formData.category === cat.label
                      return (
                        <button
                          key={cat.label}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, category: cat.label }))}
                          className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between cursor-pointer ${
                            isSelected 
                              ? 'bg-blue-50 border-blue-500 text-blue-950 shadow-xs ring-2 ring-blue-500/20' 
                              : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center  mb-1">
                            <span className="text-base">{cat.emoji}</span>
                            <span className={`text-sm font-bold ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>
                              {cat.label}
                            </span>
                          </div>
                          <p className="text-[12px] text-slate-500 line-clamp-1 leading-snug">
                            {cat.desc}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 2-col Author & Read Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                      <User size={13} className="text-slate-400" />
                      <span>Penulis / Sumber</span>
                    </label>
                    <input 
                      required
                      type="text" 
                      name="author"
                      value={formData.author}
                      onChange={handleChange}
                      placeholder="Misal: Tim Media MI 15"
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition text-xs sm:text-sm font-semibold text-slate-800 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                      <Clock size={13} className="text-slate-400" />
                      <span>Waktu Baca (Menit)</span>
                    </label>
                    <input 
                      type="number" 
                      min="1"
                      name="reading_time"
                      value={formData.reading_time}
                      onChange={handleChange}
                      placeholder="3"
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition text-xs sm:text-sm font-semibold text-slate-800 outline-none"
                    />
                  </div>
                </div>

              </div>

              {/* Right Column: Thumbnail Uploader & Featured Card (5 cols) */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                
                {/* Thumbnail Card */}
                <div className="bg-slate-50/90 border border-slate-200 rounded-3xl p-5 flex flex-col flex-1 justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between mb-3">
                      <span className="flex items-center gap-1.5">
                        <span>Foto Sampul (Thumbnail)</span>
                      </span>
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">Auto WebP</span>
                    </label>

                    {formData.thumbnail ? (
                      <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-sm group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={formData.thumbnail} 
                          alt="Thumbnail Preview" 
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3.5">
                          <span className="text-xs font-medium text-white">Pratinjau Sampul</span>
                          <button 
                            type="button" 
                            onClick={() => setFormData(prev => ({ ...prev, thumbnail: '' }))}
                            className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                          >
                            <X size={13} />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="relative aspect-[16/10] w-full rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white hover:bg-blue-50/40 transition cursor-pointer flex flex-col items-center justify-center p-4 text-center group">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                          className="hidden"
                        />
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-2xs">
                          {uploadingImage ? <Loader2 className="w-6 h-6 animate-spin" /> : <ImageIcon size={22} />}
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-blue-600 transition">
                          {uploadingImage ? 'Mengompres & Mengunggah...' : 'Klik untuk Unggah Gambar'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">PNG, JPG, JPEG (Maks. 5MB)</p>
                      </label>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-400 font-medium">
                    <span>Rasio ideal: 16:9</span>
                    <span>1280 × 720 px</span>
                  </div>
                </div>

                {/* Featured Switch Card */}
                <label className={`p-4 sm:p-5 rounded-3xl border transition cursor-pointer flex items-start gap-4 ${
                  isFeatured 
                    ? 'bg-amber-50/90 border-amber-300 shadow-sm' 
                    : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100'
                }`}>
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="w-5 h-5 rounded-lg text-amber-600 accent-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs sm:text-sm">
                      <Star size={15} className={isFeatured ? 'fill-amber-500 text-amber-500' : 'text-slate-400'} />
                      <span>Jadikan Berita Unggulan (Featured)</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Artikel unggulan akan ditampilkan di <span className="font-semibold text-slate-800">slideshow hero utama</span> halaman publik berita.
                    </p>
                  </div>
                </label>

              </div>
            </div>

            {/* TipTap Rich Content Section */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Konten Lengkap Artikel <span className="text-rose-500">*</span></span>
                </label>
                <span className="text-xs text-slate-400">Format teks, gambar, video &amp; tabel</span>
              </div>
              <TiptapEditor
                content={formData.content}
                onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                onImageUpload={async (file) => {
                  const fd = new FormData()
                  fd.append('file', file)
                  const res = await fetch('/api/upload', { method: 'POST', body: fd })
                  const data = await res.json()
                  return data.url || ''
                }}
              />
            </div>

          </div>

          {/* Sticky Footer */}
          <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50/95 backdrop-blur-md flex items-center justify-between gap-4 sticky bottom-0 z-20 font-sans">
            <button 
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
            >
              Batal
            </button>
            <div className="flex items-center gap-3">
              <button 
                type="submit"
                disabled={loading || uploadingImage}
                className="btn-tactile px-7 py-3 rounded-2xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-2 shadow-md shadow-blue-600/20 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Menyimpan Publikasi...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>{isEditing ? 'Simpan Perubahan' : 'Terbitkan Artikel'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  )
}
