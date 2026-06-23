'use client'

import React, { useState } from 'react'
import { X, UserPlus, Save } from 'lucide-react'

type GuruFormProps = {
  initialData?: any
  onSuccess: () => void
  onClose: () => void
}

export function GuruForm({ initialData, onSuccess, onClose }: GuruFormProps) {
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const isEditing = !!initialData

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    position: initialData?.position || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    rfid: initialData?.rfid || '',
    education_level: initialData?.education_level || '',
    major: initialData?.major || '',
    description: initialData?.description || '',
    image: initialData?.image || '',
    is_active: initialData?.is_active ?? true,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
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
      
      if (!res.ok) throw new Error(data.error || 'Gagal mengunggah foto profil')
      
      setFormData(prev => ({ ...prev, image: data.url }))
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
      const url = isEditing ? `/api/guru/${initialData.id}` : '/api/guru'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            {isEditing ? <Save className="text-blue-600" /> : <UserPlus className="text-blue-600" />}
            {isEditing ? 'Edit Data Guru/Staff' : 'Tambah Guru/Staff Baru'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 max-h-[75vh] overflow-y-auto">
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-8">
              {/* Photo Upload Section */}
              <div className="flex-shrink-0 flex flex-col items-center gap-4 w-full md:w-48">
                <label className="text-sm font-medium text-slate-700 w-full text-center">Foto Profil</label>
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-slate-100 bg-slate-50 flex items-center justify-center group">
                  {formData.image ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={formData.image} alt="Profile" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      >
                        <span className="text-white text-xs font-medium bg-red-500 px-2 py-1 rounded">Hapus</span>
                      </button>
                    </>
                  ) : (
                    <UserPlus size={40} className="text-slate-300" />
                  )}
                </div>
                <div className="w-full relative">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div className="w-full text-center py-2 bg-blue-50 text-blue-600 text-sm font-semibold rounded-xl border border-blue-100 group-hover:bg-blue-100 transition">
                    {uploadingImage ? 'Mengunggah...' : 'Pilih Foto'}
                  </div>
                </div>
              </div>

              {/* Form Fields Section */}
              <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Nama Lengkap beserta Gelar *</label>
                  <input 
                    required
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Misal: Ahmad S.Pd"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Posisi / Jabatan *</label>
                  <input 
                    required
                    type="text" 
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    placeholder="Misal: Guru Wali Kelas 1A"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Pendidikan Terakhir</label>
                  <input 
                    type="text" 
                    name="education_level"
                    value={formData.education_level}
                    onChange={handleChange}
                    placeholder="Misal: S1"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Jurusan / Fakultas</label>
                  <input 
                    type="text" 
                    name="major"
                    value={formData.major}
                    onChange={handleChange}
                    placeholder="Misal: Pendidikan Guru Madrasah Ibtidaiyah"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">No HP / WhatsApp</label>
                  <input 
                    type="text" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0812xxxxxx"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Email Utama</label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="email@example.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">ID / RFID Kartu</label>
                  <input 
                    type="text" 
                    name="rfid"
                    value={formData.rfid}
                    onChange={handleChange}
                    placeholder="Scan kartu atau masukkan ID secara manual"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none font-mono"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Alamat</label>
                  <textarea 
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Alamat tempat tinggal saat ini"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none resize-none"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Keterangan / Catatan Tambahan</label>
                  <textarea 
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Catatan tambahan mengenai guru/staff"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none resize-none"
                  />
                </div>

                <div className="col-span-full pt-2">
                  <label className="flex items-center gap-3 cursor-pointer w-max">
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      Status Aktif (Masih Mengajar/Bekerja)
                    </span>
                  </label>
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
              {loading ? 'Menyimpan...' : 'Simpan Data'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
