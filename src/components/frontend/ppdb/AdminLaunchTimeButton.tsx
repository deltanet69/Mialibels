'use client'

import React, { useState } from 'react'
import { AlarmClock, X } from 'lucide-react'
import { getSpmbUrl } from '@/lib/urls'

// ISO -> "YYYY-MM-DDTHH:mm" dalam WIB, untuk <input type="datetime-local">
const toWibInput = (iso?: string) => (iso ? new Date(Date.parse(iso) + 7 * 3600e3).toISOString().slice(0, 16) : '')

export default function AdminLaunchTimeButton({ openAt, onSaved }: { openAt?: string; onSaved: (data: any) => void }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const show = () => { setValue(toWibInput(openAt)); setError(''); setOpen(true) }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value) return setError('Pilih tanggal dan jam pembukaan.')
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/spmb/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ open_at: `${value}:00+07:00` })
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Gagal menyimpan.')
      onSaved(json.data)
      setOpen(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const spmb = getSpmbUrl()

  return (
    <>
      <button
        type="button"
        onClick={show}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 h-11 sm:h-12 px-5 rounded-2xl bg-[#002957] hover:bg-[#003a7a] active:scale-[0.97] text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-950/25 transition-all cursor-pointer border border-blue-900/40"
      >
        <AlarmClock size={18} />
        <span>Waktu Pembukaan</span>
      </button>

      {open && (
        <div role="dialog" aria-modal="true" aria-label="Waktu pembukaan SPMB" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 font-sans">
          <form onSubmit={save} className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 space-y-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <AlarmClock size={17} />
                </span>
                <h3 className="font-black text-lg text-slate-900">Waktu Pembukaan SPMB</h3>
              </div>
              <button type="button" aria-label="Tutup" onClick={() => setOpen(false)} className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Sebelum waktu ini, pengunjung melihat popup hitung mundur dan formulir tidak bisa dikirim. Setelah lewat, pendaftaran akan otomatis terbuka.
            </p>

            <label className="block space-y-1.5">
              <span className="block text-xs font-bold text-slate-700">Jadwal Dibuka (WIB):</span>
              <input type="datetime-local" required value={value} onChange={(e) => setValue(e.target.value)} className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition" />
            </label>

            {error && <p role="alert" className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl">{error}</p>}

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5 text-xs">
              <span className="font-bold text-slate-500 block">Preview Tampilan Popup:</span>
              <div className="flex items-center gap-2">
                <a className="inline-flex items-center gap-1 font-bold text-blue-700 bg-white border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-blue-50 transition shadow-2xs" href={`${spmb}/?preview=countdown`} target="_blank" rel="noreferrer">
                  ⏳ Hitung Mundur
                </a>
                <a className="inline-flex items-center gap-1 font-bold text-amber-700 bg-white border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-amber-50 transition shadow-2xs" href={`${spmb}/?preview=closed`} target="_blank" rel="noreferrer">
                  🛑 Kuota Penuh
                </a>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setOpen(false)} className="h-10 px-4 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer">
                Batal
              </button>
              <button type="submit" disabled={saving} className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs sm:text-sm font-bold transition shadow-sm shadow-blue-600/20 disabled:opacity-60 cursor-pointer">
                {saving ? 'Menyimpan…' : 'Simpan Jadwal'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
