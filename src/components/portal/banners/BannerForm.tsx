'use client'

import React, { useState } from 'react'
import {
  X, Megaphone, Save, Image as ImageIcon, Calendar, Link as LinkIcon,
  AlertCircle, Loader2, CheckCircle2, Globe, Home, Eye, Sparkles,
  Layers, Clock, ToggleLeft, ToggleRight, ArrowUpRight
} from 'lucide-react'

type BannerFormProps = {
  initialData?: any
  onSuccess: () => void
  onClose: () => void
}

const AVAILABLE_PAGES = [
  { path: '/', label: 'Beranda (Home)', icon: Home, desc: 'Halaman utama website' },
  { path: '/news', label: 'Berita & Artikel', icon: Layers, desc: 'Pusat publikasi madrasah' },
  { path: '/ppdb', label: 'PPDB Online', icon: Sparkles, desc: 'Penerimaan santri baru' },
  { path: '/about', label: 'Profil Madrasah', icon: Globe, desc: 'Visi misi & sejarah' },
  { path: '/akademik', label: 'Akademik & Kurikulum', icon: Layers, desc: 'Program & keunggulan' },
  { path: '/contact', label: 'Hubungi Kami', icon: Globe, desc: 'Kontak & pesan saran' },
]

export function BannerForm({ initialData, onSuccess, onClose }: BannerFormProps) {
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewTab, setPreviewTab] = useState<'form' | 'preview'>('form')

  const isEditing = !!initialData

  // Parse target_pages from initialData
  const getInitialTargetType = () => {
    if (!initialData?.target_pages || initialData.target_pages === 'all') return 'all'
    if (initialData.target_pages === 'home') return 'home'
    return 'custom'
  }

  const getInitialCustomPages = (): string[] => {
    if (!initialData?.target_pages) return []
    const val = initialData.target_pages
    if (val === 'all' || val === 'home') return []
    try {
      if (val.startsWith('[') && val.endsWith(']')) {
        return JSON.parse(val)
      }
    } catch (e) {
      // fallback
    }
    return val.split(',').map((s: string) => s.trim()).filter(Boolean)
  }

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    image: initialData?.image || '',
    link: initialData?.link || '',
    is_active: typeof initialData?.is_active === 'boolean' ? initialData.is_active : true,
    start_date: initialData?.start_date ? new Date(initialData.start_date).toISOString().slice(0, 10) : '',
    end_date: initialData?.end_date ? new Date(initialData.end_date).toISOString().slice(0, 10) : '',
  })

  const [isAlwaysActiveDates, setIsAlwaysActiveDates] = useState(!initialData?.start_date && !initialData?.end_date)
  const [targetType, setTargetType] = useState<'all' | 'home' | 'custom'>(getInitialTargetType())
  const [selectedPages, setSelectedPages] = useState<string[]>(getInitialCustomPages())

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    e.target.value = ''
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

      if (!res.ok) throw new Error(data.error || 'Gagal mengunggah gambar banner')

      setFormData(prev => ({ ...prev, image: data.url }))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploadingImage(false)
    }
  }

  const togglePageSelection = (path: string) => {
    setSelectedPages(prev => 
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      setError('Nama/Judul pengumuman wajib diisi')
      return
    }
    if (!formData.image.trim()) {
      setError('Banner gambar wajib diunggah')
      return
    }
    if (targetType === 'custom' && selectedPages.length === 0) {
      setError('Pilih minimal satu halaman target atau ganti ke Semua Halaman')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const url = isEditing ? `/api/banners/${initialData.id}` : '/api/banners'
      const method = isEditing ? 'PUT' : 'POST'

      let finalTargetPages = 'all'
      if (targetType === 'home') finalTargetPages = 'home'
      else if (targetType === 'custom') finalTargetPages = JSON.stringify(selectedPages)

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        image: formData.image.trim(),
        link: formData.link.trim() || null,
        is_active: formData.is_active,
        start_date: isAlwaysActiveDates || !formData.start_date ? null : new Date(formData.start_date).toISOString(),
        end_date: isAlwaysActiveDates || !formData.end_date ? null : new Date(`${formData.end_date}T23:59:59.999Z`).toISOString(),
        target_pages: finalTargetPages
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan saat menyimpan banner')

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200 font-sans">
      <div className="bg-white rounded-3xl sm:rounded-[2rem] shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200/80 my-auto flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-slate-100 bg-white sticky top-0 z-20 font-sans">
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-2xs ${
              isEditing ? 'bg-amber-50 border border-amber-200 text-amber-600' : 'bg-blue-50 border border-blue-200 text-blue-600'
            }`}>
              <Megaphone size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                  {isEditing ? 'Mode Edit' : 'Banner Baru'}
                </span>
                <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  formData.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {formData.is_active ? 'Status: Aktif' : 'Status: Nonaktif'}
                </span>
              </div>
              <h2 className="font-sans font-bold text-lg sm:text-xl text-slate-900 tracking-tight mt-0.5">
                {isEditing ? 'Edit Banner Pengumuman' : 'Tambah Banner Pengumuman Baru'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle (Form vs Live Preview Simulator) */}
            <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setPreviewTab('form')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  previewTab === 'form' ? 'bg-white text-blue-700 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Form Input
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('preview')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  previewTab === 'preview' ? 'bg-white text-blue-700 shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Eye size={13} />
                <span>Simulator Popup</span>
              </button>
            </div>

            <button 
              onClick={onClose} 
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
              title="Tutup"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Form Body or Live Preview Simulator */}
        {previewTab === 'preview' ? (
          /* ======================================================== */
          /* SIMULATOR POPUP PREVIEW (Live Look in Front-end)         */
          /* ======================================================== */
          <div className="p-6 sm:p-10 flex-1 overflow-y-auto bg-slate-900/90 flex flex-col items-center justify-center relative min-h-[400px]">
            <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200 relative">
              
              {/* Mock Close Button */}
              <div className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-xs">
                <X size={15} />
              </div>

              {/* Banner Image */}
              <div className="relative w-full aspect-[4/3] bg-slate-100 flex items-center justify-center overflow-hidden">
                {formData.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={formData.image}
                    alt={formData.title || 'Preview Banner'}
                    className="w-full h-full object-contain bg-slate-950"
                  />
                ) : (
                  <div className="text-center p-6 text-slate-400">
                    <ImageIcon size={36} className="mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-semibold">Belum ada gambar yang diunggah</p>
                  </div>
                )}
              </div>

              {/* Banner Content Details */}
              <div className="p-5 space-y-3 bg-white">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                    Pengumuman Resmi
                  </span>
                  <span className="text-[10px] text-slate-400">Muncul di detik ke-3</span>
                </div>
                <h4 className="font-bold text-slate-900 text-base leading-snug">
                  {formData.title || 'Judul Pengumuman Madrasah'}
                </h4>
                {formData.description && (
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {formData.description}
                  </p>
                )}

                {/* Optional Action Button */}
                {formData.link && (
                  <div className="pt-2">
                    <span className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm">
                      <span>Buka Informasi Terkait</span>
                      <ArrowUpRight size={14} />
                    </span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs font-medium text-slate-400 mt-4 text-center">
              Simulasi tampilan popup responsif saat audiens membuka website.
            </p>
          </div>
        ) : (
          /* ======================================================== */
          /* FORM INPUT TAB                                           */
          /* ======================================================== */
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar flex flex-col font-sans">
            <div className="p-6 sm:p-8 space-y-6">
              {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              {/* Grid 2 Columns: Information & Visual Upload */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column: Core Fields (7 cols) */}
                <div className="lg:col-span-7 space-y-5">
                  
                  {/* Title */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                      <span>Nama / Judul Pengumuman <span className="text-rose-500">*</span></span>
                      <span className="text-xs text-slate-400 font-normal">{formData.title.length} karakter</span>
                    </label>
                    <input
                      required
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Contoh: Pengumuman Libur Hari Raya & Jadwal Masuk..."
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none"
                    />
                  </div>

                  {/* Description / Note */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Deskripsi / Pesan Singkat (Opsional)
                    </label>
                    <textarea
                      name="description"
                      rows={2}
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Keterangan ringkas yang tampil di bawah gambar banner..."
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none resize-none"
                    />
                  </div>

                  {/* Optional Action URL */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <LinkIcon size={13} className="text-slate-400" />
                      <span>Tautan / Link Aksi Pengumuman (Opsional)</span>
                    </label>
                    <input
                      type="text"
                      name="link"
                      value={formData.link}
                      onChange={handleChange}
                      placeholder="Contoh: /ppdb atau https://..."
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition text-xs sm:text-sm font-mono text-slate-800 placeholder:text-slate-400 outline-none"
                    />
                    <span className="text-[11px] text-slate-400">
                      Jika diisi, popup akan menampilkan tombol tindakan menuju URL ini saat diklik.
                    </span>
                  </div>

                  {/* Active Date Range */}
                  <div className="p-4 sm:p-5 rounded-3xl border border-slate-200/80 bg-slate-50/70 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar size={14} className="text-slate-400" />
                        <span>Masa Berlaku / Tanggal Tayang</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600">
                        <input
                          type="checkbox"
                          checked={isAlwaysActiveDates}
                          onChange={(e) => setIsAlwaysActiveDates(e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                        />
                        <span>Selalu Aktif</span>
                      </label>
                    </div>

                    {!isAlwaysActiveDates && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-slate-500 uppercase">Tanggal Mulai</span>
                          <input
                            type="date"
                            name="start_date"
                            value={formData.start_date}
                            onChange={handleChange}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-slate-500 uppercase">Tanggal Berakhir</span>
                          <input
                            type="date"
                            name="end_date"
                            value={formData.end_date}
                            onChange={handleChange}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                </div>

                {/* Right Column: Visual Upload & Targeting (5 cols) */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  
                  {/* Upload Banner Image Card */}
                  <div className="bg-slate-50/90 border border-slate-200 rounded-3xl p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <ImageIcon size={14} className="text-slate-400" />
                          <span>File Banner <span className="text-rose-500">*</span></span>
                        </label>
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          Auto WebP
                        </span>
                      </div>

                      {formData.image ? (
                        <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 shadow-sm group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={formData.image}
                            alt="Banner Preview"
                            className="object-contain w-full h-full"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3.5">
                            <span className="text-xs font-medium text-white">Pratinjau Gambar</span>
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                              className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                            >
                              <X size={13} />
                              <span>Ganti</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="relative aspect-[4/3] w-full rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white hover:bg-blue-50/40 transition cursor-pointer flex flex-col items-center justify-center p-4 text-center group">
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
                            {uploadingImage ? 'Mengompres & Mengunggah...' : 'Klik untuk Unggah Banner'}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">PNG, JPG, JPEG (Maks. 10MB)</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Mendukung potret, lanskap, dan persegi</p>
                        </label>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-400 font-medium">
                      <span>Resolusi fleksibel</span>
                      <span>Responsif popup</span>
                    </div>
                  </div>

                  {/* Status Toggle Card */}
                  <label className={`p-4 rounded-3xl border transition cursor-pointer flex items-center justify-between ${
                    formData.is_active ? 'bg-emerald-50/80 border-emerald-300 shadow-2xs' : 'bg-slate-50/80 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
                        formData.is_active ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {formData.is_active ? <CheckCircle2 size={18} /> : <X size={18} />}
                      </div>
                      <div>
                        <span className="font-bold text-xs sm:text-sm text-slate-900 block">
                          {formData.is_active ? 'Banner Aktif (Siap Tayang)' : 'Banner Nonaktif'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {formData.is_active ? 'Akan muncul otomatis di web' : 'Disimpan sebagai draf'}
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="w-5 h-5 rounded-lg text-emerald-600 accent-emerald-600 cursor-pointer"
                    />
                  </label>

                </div>

              </div>

              {/* Target Display Pages (Where to show) */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Globe size={14} className="text-slate-400" />
                  <span>Target Lokasi Penayangan Halaman <span className="text-rose-500">*</span></span>
                </label>

                {/* Target Strategy Pill Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setTargetType('all')}
                    className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 cursor-pointer ${
                      targetType === 'all'
                        ? 'bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Globe size={18} className={targetType === 'all' ? 'text-blue-600' : 'text-slate-400'} />
                    <div>
                      <span className="text-xs font-bold block">Seluruh Halaman (Global)</span>
                      <span className="text-[11px] text-slate-500">Muncul di halaman apa saja</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType('home')}
                    className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 cursor-pointer ${
                      targetType === 'home'
                        ? 'bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Home size={18} className={targetType === 'home' ? 'text-blue-600' : 'text-slate-400'} />
                    <div>
                      <span className="text-xs font-bold block">Hanya Beranda (Home)</span>
                      <span className="text-[11px] text-slate-500">Hanya saat buka halaman utama</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetType('custom')}
                    className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 cursor-pointer ${
                      targetType === 'custom'
                        ? 'bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Layers size={18} className={targetType === 'custom' ? 'text-blue-600' : 'text-slate-400'} />
                    <div>
                      <span className="text-xs font-bold block">Pilih Halaman Tertentu</span>
                      <span className="text-[11px] text-slate-500">Pilih rute yang diinginkan</span>
                    </div>
                  </button>
                </div>

                {/* Custom Page Checkboxes */}
                {targetType === 'custom' && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 animate-in fade-in duration-150">
                    {AVAILABLE_PAGES.map((page) => {
                      const isChecked = selectedPages.includes(page.path)
                      const Icon = page.icon
                      return (
                        <label
                          key={page.path}
                          className={`p-3 rounded-xl border flex items-center gap-2.5 transition cursor-pointer ${
                            isChecked
                              ? 'bg-white border-blue-500 shadow-2xs text-blue-950 font-bold'
                              : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePageSelection(page.path)}
                            className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <span className="text-xs block truncate">{page.label}</span>
                            <span className="text-[10px] text-slate-400 font-mono block">{page.path}</span>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                )}
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
                      <span>Menyimpan Banner...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>{isEditing ? 'Simpan Perubahan' : 'Terbitkan Banner'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

      </div>
    </div>
  )
}
