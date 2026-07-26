'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X, Plus, Trash2, Save, AlertCircle, Search, User } from 'lucide-react'

type CreateBillModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  onOpenInvoice?: (invoice: any) => void
}

const PREDEFINED_ITEMS = [
  'Mutu', 'Buku Paket/LKS', 'Seragam Sekolah', 'Ulangan Umum (ULUM)', 'Raport',
  'Kartu Siswa', 'Foto Siswa', 'Qurban', "Yanbu'a", 'Kegiatan Fullday', 'Kegiatan Akhir tahun'
]

export function CreateBillModal({ isOpen, onClose, onSuccess, onOpenInvoice }: CreateBillModalProps) {
  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([])
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    type: 'Administrasi Sekolah',
    due_date: '',
    class_id: '',
    student_id: '',
    target_type: 'class' as 'class' | 'student',
    note: ''
  })

  // Student search states
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedStudentName, setSelectedStudentName] = useState('')
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [items, setItems] = useState<{ name: string; amount: number; isCustom: boolean }[]>([
    { name: '', amount: 0, isCustom: false }
  ])

  useEffect(() => {
    if (isOpen) {
      fetchClasses()
      setError(null)
      setFormData({ title: '', type: 'Administrasi Sekolah', due_date: '', class_id: '', student_id: '', target_type: 'class', note: '' })
      setItems([{ name: '', amount: 0, isCustom: false }])
      setSearchQuery('')
      setSearchResults([])
      setSelectedStudentName('')
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

  const handleSearchStudent = (query: string) => {
    setSearchQuery(query)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)

    if (query.trim().length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/students?search=${encodeURIComponent(query)}`)
        const data = await res.json()
        if (data.success) {
          setSearchResults(data.data)
        }
      } catch (err) {
        console.error('Failed to search students', err)
      } finally {
        setIsSearching(false)
      }
    }, 500)
  }

  const [activeInvoice, setActiveInvoice] = useState<any>(null)

  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  const handleSelectStudent = async (student: any) => {
    setFormData({ ...formData, student_id: student.id })
    setSelectedStudentName(`${student.name} (${student.student_number}) - ${student.class}`)
    setSearchQuery('')
    setSearchResults([])
    setActiveInvoice(null)
    setError(null)
    setInfoMessage(null)

    // Cek apakah siswa sudah punya tagihan aktif
    try {
      const res = await fetch(`/api/finance/general?studentId=${student.id}`)
      const data = await res.json()
      if (data.success && data.data && data.data.length > 0) {
        // Cari tagihan yang belum lunas
        const active = data.data.find((inv: any) => inv.status !== 'PAID')
        if (active) {
          setActiveInvoice(active)
          setInfoMessage(`Siswa ini sudah memiliki Tagihan Aktif. Item baru akan ditambahkan secara otomatis ke tagihan tersebut.`)
        } else {
          // If they only have PAID invoices, we will still append to the latest one based on the new backend logic
          const latest = data.data[0]
          setActiveInvoice(latest)
          setInfoMessage(`Siswa ini sudah lunas. Penambahan tagihan baru akan memperbarui statusnya menjadi Belum Bayar/Cicilan.`)
        }
      }
    } catch (err) {
      console.error('Failed to check active invoice', err)
    }
  }

  // Effect to reset activeInvoice and messages when target_type changes
  useEffect(() => {
    setActiveInvoice(null)
    setError(null)
    setInfoMessage(null)
  }, [formData.target_type])

  const handleAddItem = () => {
    setItems([...items, { name: '', amount: 0, isCustom: false }])
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

    if (formData.target_type === 'class' && !formData.class_id) {
      setError('Kelas wajib dipilih.')
      return
    }

    if (formData.target_type === 'student' && !formData.student_id) {
      setError('Siswa wajib dipilih.')
      return
    }

    const validItems = items.filter(i => i.name.trim() !== '' && Number(i.amount) > 0)
    if (validItems.length === 0) {
      setError('Minimal masukkan 1 item tagihan dengan nama dan nominal lebih dari 0.')
      return
    }

    const finalItems = validItems.map(item => {
      return {
        name: item.name,
        amount: Number(item.amount),
        paid_amount: 0
      };
    });

    const total = finalItems.reduce((acc, curr) => acc + curr.amount, 0)

    setLoading(true)
    try {
      const payload = {
        title: formData.type.trim() || 'Administrasi Sekolah',
        type: formData.type.trim() || 'Administrasi Sekolah',
        due_date: formData.due_date || null,
        target_type: formData.target_type,
        class_id: formData.target_type === 'class' ? formData.class_id : null,
        student_id: formData.target_type === 'student' ? formData.student_id : null,
        total_amount: total,
        note: formData.note.trim(),
        items: finalItems
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
            <p className="text-sm text-slate-500 mt-1">Buat tagihan untuk satu kelas atau per siswa secara individu.</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">


            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Jenis Tagihan</label>
              <input
                type="text"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition text-sm"
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Target Tagihan <span className="text-red-500">*</span></label>
              <div className="flex items-center gap-4 mt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="target_type" 
                    checked={formData.target_type === 'class'}
                    onChange={() => setFormData({ ...formData, target_type: 'class' })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-slate-700 font-medium">Seluruh Kelas</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="target_type" 
                    checked={formData.target_type === 'student'}
                    onChange={() => setFormData({ ...formData, target_type: 'student' })}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-slate-700 font-medium">Per Siswa (Individu)</span>
                </label>
              </div>
            </div>

            {formData.target_type === 'class' ? (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Pilih Kelas <span className="text-red-500">*</span></label>
                <select
                  value={formData.class_id}
                  onChange={e => setFormData({ ...formData, class_id: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition bg-white text-sm"
                >
                  <option value="">-- Pilih Kelas --</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Cari Siswa <span className="text-red-500">*</span></label>
                {formData.student_id ? (
                  <div className="flex items-center justify-between p-3 border border-blue-200 bg-blue-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-blue-500" />
                      <span className="text-sm font-semibold text-blue-800">{selectedStudentName}</span>
                    </div>
                    <button 
                      onClick={() => {
                        setFormData({ ...formData, student_id: '' })
                        setSelectedStudentName('')
                      }}
                      className="text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      Ganti
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={16} className="text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearchStudent(e.target.value)}
                      placeholder="Ketik Nama atau NISN..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition text-sm"
                    />
                    
                    {/* Search Results Dropdown */}
                    {searchQuery.length >= 2 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {isSearching ? (
                          <div className="p-3 text-center text-sm text-slate-500">Mencari...</div>
                        ) : searchResults.length > 0 ? (
                          <ul className="py-1">
                            {searchResults.map(student => (
                              <li 
                                key={student.id}
                                onClick={() => handleSelectStudent(student)}
                                className="px-4 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                              >
                                <div className="font-semibold text-slate-800 text-sm">{student.name}</div>
                                <div className="text-xs text-slate-500">{student.student_number} • {student.class}</div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="p-3 text-center text-sm text-slate-500">Siswa tidak ditemukan</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Tenggat Waktu (Due Date)</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition text-sm"
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
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition resize-none text-sm"
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
                  <div className="flex-1 w-full flex items-center gap-2">
                    <span className="font-bold text-slate-500 text-sm w-4">{index + 1}.</span>
                    {item.isCustom ? (
                      <div className="flex gap-2">
                        <input
                          autoFocus
                          type="text"
                          value={item.name}
                          onChange={e => handleItemFieldChange(index, 'name', e.target.value)}
                          placeholder="Tulis keterangan tagihan..."
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
                        <option value="OTHER">+ Lainnya</option>
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
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    disabled={items.length === 1}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
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
          {/* Error & Info */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {infoMessage && (
            <div className="flex flex-col gap-2 p-3 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium border border-blue-100">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{infoMessage}</span>
              </div>
              {activeInvoice && onOpenInvoice && (
                <div className="pl-6">
                  <button
                    type="button"
                    onClick={() => onOpenInvoice(activeInvoice)}
                    className="text-blue-600 underline hover:text-blue-800 font-bold"
                  >
                    Lihat Tagihan Terakhir
                  </button>
                </div>
              )}
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
