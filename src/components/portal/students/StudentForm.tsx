'use client'

import React, { useState } from 'react'
import { X, UserPlus, Save } from 'lucide-react'

type StudentFormProps = {
  initialData?: any
  onSuccess: () => void
  onClose: () => void
}

export function StudentForm({ initialData, onSuccess, onClose }: StudentFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const isEditing = !!initialData

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    student_number: initialData?.student_number || '',
    class: initialData?.class || '',
    parent_name: initialData?.parent_name || '',
    parent_phone: initialData?.parent_phone || '',
    parent_email: initialData?.parent_email || '',
    is_active: initialData?.is_active ?? true,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const url = isEditing ? `/api/students/${initialData.id}` : '/api/students'
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            {isEditing ? <Save className="text-blue-600" /> : <UserPlus className="text-blue-600" />}
            {isEditing ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
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
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Nomor Induk Siswa (NIS) *</label>
                <input 
                  required
                  type="text" 
                  name="student_number"
                  value={formData.student_number}
                  onChange={handleChange}
                  placeholder="Misal: 2023001"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Nama Lengkap Siswa *</label>
                <input 
                  required
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nama Siswa"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Kelas *</label>
                <select 
                  required
                  name="class"
                  value={formData.class}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none"
                >
                  <option value="" disabled>Pilih Kelas</option>
                  <option value="Kelas 1A">Kelas 1A</option>
                  <option value="Kelas 1B">Kelas 1B</option>
                  <option value="Kelas 2A">Kelas 2A</option>
                  <option value="Kelas 2B">Kelas 2B</option>
                  <option value="Kelas 3A">Kelas 3A</option>
                  <option value="Kelas 3B">Kelas 3B</option>
                  <option value="Kelas 4A">Kelas 4A</option>
                  <option value="Kelas 4B">Kelas 4B</option>
                  <option value="Kelas 5A">Kelas 5A</option>
                  <option value="Kelas 5B">Kelas 5B</option>
                  <option value="Kelas 6A">Kelas 6A</option>
                  <option value="Kelas 6B">Kelas 6B</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Nama Orang Tua/Wali *</label>
                <input 
                  required
                  type="text" 
                  name="parent_name"
                  value={formData.parent_name}
                  onChange={handleChange}
                  placeholder="Nama Orang Tua"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">No HP Orang Tua *</label>
                <input 
                  required
                  type="text" 
                  name="parent_phone"
                  value={formData.parent_phone}
                  onChange={handleChange}
                  placeholder="0812xxxxxx"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Email Orang Tua (Opsional)</label>
                <input 
                  type="email" 
                  name="parent_email"
                  value={formData.parent_email}
                  onChange={handleChange}
                  placeholder="email@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition outline-none"
                />
              </div>

              <div className="col-span-full pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
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
                    Status Aktif (Siswa Aktif Belajar)
                  </span>
                </label>
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
              disabled={loading}
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
