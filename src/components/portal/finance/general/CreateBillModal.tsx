'use client'

import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2, Save, AlertCircle } from 'lucide-react'

type CreateBillModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const PREDEFINED_ITEMS = [
  'Mutu', 'Infaq', 'Buku Paket/LKS', 'Seragam', 'Ulum', 'Raport',
  'Kartu Siswa', 'Foto', 'Qurban', "Yanbu'a", 'Kegiatan Fullday'
]

export function CreateBillModal({ isOpen, onClose, onSuccess }: CreateBillModalProps) {
  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([])
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    type: 'Administrasi Sekolah',
    due_date: '',
    class_id: '',
    note: ''
  })

  const [items, setItems] = useState<{ name: string; amount: number; isCustom: boolean }[]>([
    { name: '', amount: 0, isCustom: false }
  ])

  useEffect(() => {
    if (isOpen) {
      fetchClasses()
      setError(null)
      setFormData({ title: '', type: 'Administrasi Sekolah', due_date: '', class_id: '', note: '' })
      setItems([{ name: '', amount: 0, isCustom: false }])
    }
  }, [isOpen])

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/classrooms')
      const data = await res.json()
      if (data.success) setClasses(data.data)
    } catch (err) {
      console.error('Failed to fetch classes', err)
    }
  }

  const handleAddItem = () => {
    setItems(prev => [...prev, { name: '', amount: 0, isCustom: false }])
  }

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleSelectChange = (value: string, index: number) => {
    setItems(prev => {
      const next = [...prev]
      if (value === 'OTHER') {
        next[index] = { ...next[index], name: '', isCustom: true }
      } else {
        next[index] = { ...next[index], name: value, isCustom: false }
      }
      return next
    })
  }

  const handleItemFieldChange = (index: number, field: 'name' | 'amount', value: string | number) => {
    setItems(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const handleRevertCustom = (index: number) => {
    setItems(prev => {
      const next = [...prev]
      next[index] = { ...next[index], name: '', isCustom: false }
      return next
    })
  }

  const handleSubmit = async () => {
    setError(null)

    if (!formData.title.trim()) {
      setError('Nama Tagihan wajib diisi.')
      return
    }
    if (!formData.class_id) {
      setError('Kelas wajib dipilih.')
      return
    }

    const validItems = items.filter(i => i.name.trim() !== '' && Number(i.amount) > 0)
    if (validItems.length === 0) {
      setError('Minimal masukkan 1 item tagihan dengan nama dan nominal lebih dari 0.')
      return
    }

    setLoading(true)
    try {
      const payload = {
        title: formData.title.trim(),
        type: formData.type.trim() || 'Administrasi Sekolah',
        due_date: formData.due_date || null,
        class_id: formData.class_id,
        note: formData.note.trim(),
        items: validItems.map(i => ({ name: i.name, amount: Number(i.amount) }))
      }

      const res = await fetch('/api/finance/general', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Terjadi kesalahan pada server.')
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const totalPreview = items.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Buat Tagihan Baru</h2>
            <p className="text-sm text-slate-500 mt-1">Tagihan akan digenerate untuk seluruh siswa di kelas yang dipilih.</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Nama Tagihan <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Contoh: Tagihan Semester Ganjil 2026"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Jenis Tagihan</label>
              <input
                type="text"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Pilih Kelas <span className="text-red-500">*</span></label>
              <select
                value={formData.class_id}
                onChange={e => setFormData({ ...formData, class_id: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition bg-white"
              >
                <option value="">-- Pilih Kelas --</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Tenggat Waktu (Due Date)</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Keterangan / Catatan Tambahan</label>
            <textarea
              rows={2}
              value={formData.note}
              onChange={e => setFormData({ ...formData, note: e.target.value })}
              placeholder="Opsional..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition resize-none"
            />
          </div>

          {/* Items Section */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Rincian Items Tagihan</h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 font-medium rounded-lg hover:bg-blue-100 transition flex items-center gap-1"
              >
                <Plus size={16} /> Tambah Item
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  {/* Name */}
                  <div className="flex-1 w-full">
                    {item.isCustom ? (
                      <div className="flex gap-2">
                        <input
                          autoFocus
                          type="text"
                          value={item.name}
                          onChange={e => handleItemFieldChange(index, 'name', e.target.value)}
                          placeholder="Tulis nama item custom..."
                          className="flex-1 px-3 py-2 rounded-lg border border-blue-300 focus:border-blue-500 outline-none text-sm bg-blue-50/30"
                        />
                        <button
                          type="button"
                          onClick={() => handleRevertCustom(index)}
                          title="Kembali ke daftar"
                          className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                        >
                          ↩ Pilih
                        </button>
                      </div>
                    ) : (
                      <select
                        value={item.name}
                        onChange={e => handleSelectChange(e.target.value, index)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-sm bg-white"
                      >
                        <option value="">Pilih Item</option>
                        {PREDEFINED_ITEMS.map(i => (
                          <option key={i} value={i}>{i}</option>
                        ))}
                        <option value="OTHER">+ Add Other (Custom)</option>
                      </select>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="w-full sm:w-48 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-slate-500 text-sm font-medium">Rp</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={item.amount || ''}
                      onChange={e => handleItemFieldChange(index, 'amount', Number(e.target.value))}
                      placeholder="Nominal"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-sm"
                    />
                  </div>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    disabled={items.length === 1}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="mt-4 flex justify-end">
              <div className="bg-blue-50 px-4 py-3 rounded-xl border border-blue-100 flex items-center gap-4">
                <span className="text-sm font-medium text-blue-800">Total Tagihan per Siswa:</span>
                <span className="text-xl font-bold text-blue-700">Rp {totalPreview.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer — termasuk error dan tombol submit */}
        <div className="p-6 border-t border-slate-100 bg-white space-y-3">
          {/* Error ditampilkan tepat di atas tombol agar selalu terlihat */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-blue-500/20 flex items-center gap-2"
            >
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Memproses...</>
                : <><Save size={18} /> Buat Tagihan</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
