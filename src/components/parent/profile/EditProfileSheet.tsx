'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { X, Info, Loader2, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import { StudentProfileData } from './types';

export type EditMode = 'biodata' | 'contact';

interface EditProfileSheetProps {
  mode: EditMode;
  student: StudentProfileData;
  onClose: () => void;
}

export function normalizeGender(g?: string | null): 'Laki-laki' | 'Perempuan' | '' {
  if (!g) return '';
  const v = g.trim().toLowerCase();
  if (v === 'l' || v.startsWith('laki')) return 'Laki-laki';
  if (v === 'p' || v.startsWith('perempuan')) return 'Perempuan';
  return '';
}

export function formatBirthInfo(place?: string | null, date?: string | null): string {
  let d = '';
  if (date) {
    const parsed = new Date(date);
    d = isNaN(parsed.getTime())
      ? date
      : parsed.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  if (place && d) return `${place}, ${d}`;
  return place || d || '-';
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-semibold text-slate-800 placeholder:text-slate-300 placeholder:font-normal focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition';
const labelClass = 'block text-xs font-bold text-slate-500 mb-1.5';
const lockedClass =
  'w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm font-semibold text-slate-400 cursor-not-allowed select-none';

export function EditProfileSheet({ mode, student, onClose }: EditProfileSheetProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [gender, setGender] = useState<string>(normalizeGender(student.gender));
  const [birthPlace, setBirthPlace] = useState(student.birth_place || '');
  const [birthDate, setBirthDate] = useState((student.birth_date || '').slice(0, 10));
  const [address, setAddress] = useState(student.address || '');
  const [phone, setPhone] = useState(student.parent_phone || '');
  const [email, setEmail] = useState(student.parent_email || '');

  useEffect(() => {
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !saving && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, saving]);

  const title = mode === 'biodata' ? 'Ubah Biodata Siswa' : 'Ubah Kontak Wali Murid';
  const subtitle =
    mode === 'biodata'
      ? 'Lengkapi data berikut sesuai dokumen resmi (Akta/KK).'
      : 'Dipakai sekolah untuk informasi & pemberitahuan.';

  const handleSave = async () => {
    setError('');
    let body: Record<string, string> = {};

    if (mode === 'biodata') {
      if (!gender) return setError('Pilih jenis kelamin terlebih dahulu.');
      if (!birthPlace.trim()) return setError('Tempat lahir wajib diisi.');
      if (!birthDate) return setError('Tanggal lahir wajib diisi.');
      if (new Date(birthDate) > new Date()) return setError('Tanggal lahir tidak boleh di masa depan.');
      if (!address.trim()) return setError('Alamat siswa wajib diisi.');
      body = {
        gender,
        birth_place: birthPlace.trim(),
        birth_date: birthDate,
        address: address.trim(),
      };
    } else {
      const digits = phone.replace(/[^0-9]/g, '');
      if (!digits || digits.length < 9 || digits.length > 15) {
        return setError('Nomor WhatsApp tidak valid (9-15 digit).');
      }
      if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return setError('Format email tidak valid.');
      }
      body = { parent_phone: phone.trim(), parent_email: email.trim() };
    }

    setSaving(true);
    try {
      const res = await fetch('/api/parent/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan data.');
      setSaved(true);
      router.refresh();
      setTimeout(onClose, 900);
    } catch (e: any) {
      setError(e.message || 'Gagal menyimpan data.');
      setSaving(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className="flex items-end md:items-center justify-center font-sans"
      style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        onClick={() => !saving && onClose()}
      />

      <div className="relative w-full md:max-w-md bg-white rounded-t-[28px] md:rounded-3xl shadow-2xl max-h-[92dvh] flex flex-col animate-in slide-in-from-bottom-8 md:zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-100 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 m-0">{title}</h3>
            <p className="text-xs text-slate-400 mt-0.5 m-0">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Tutup"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center shrink-0 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 overflow-y-auto space-y-4">
          {mode === 'biodata' ? (
            <>
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5 space-y-3">
                <p className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider m-0">
                  <Lock size={11} /> Data dikunci oleh sekolah
                </p>
                <div>
                  <label htmlFor="lock-name" className={labelClass}>Nama Lengkap</label>
                  <input id="lock-name" type="text" value={student.name || ''} disabled readOnly className={lockedClass} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="lock-nis" className={labelClass}>NIS</label>
                    <input id="lock-nis" type="text" value={student.student_number || '-'} disabled readOnly className={lockedClass} />
                  </div>
                  <div>
                    <label htmlFor="lock-nisn" className={labelClass}>NISN</label>
                    <input id="lock-nisn" type="text" value={student.nisn || '-'} disabled readOnly className={lockedClass} />
                  </div>
                </div>
                <div>
                  <label htmlFor="lock-class" className={labelClass}>Kelas</label>
                  <input id="lock-class" type="text" value={student.class ? `Kelas ${student.class}` : '-'} disabled readOnly className={lockedClass} />
                </div>
              </div>

              <div>
                <span className={labelClass}>Jenis Kelamin</span>
                <div className="grid grid-cols-2 gap-2">
                  {['Laki-laki', 'Perempuan'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      aria-pressed={gender === g}
                      className={`py-3 rounded-xl text-sm font-bold border transition ${
                        gender === g
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="edit-birth-place" className={labelClass}>Tempat Lahir</label>
                <input
                  id="edit-birth-place"
                  type="text"
                  value={birthPlace}
                  onChange={(e) => setBirthPlace(e.target.value)}
                  placeholder="Contoh: Bekasi"
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="edit-birth-date" className={labelClass}>Tanggal Lahir</label>
                <input
                  id="edit-birth-date"
                  type="date"
                  value={birthDate}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="edit-address" className={labelClass}>Alamat Siswa</label>
                <textarea
                  id="edit-address"
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Jalan, RT/RW, Desa/Kelurahan, Kecamatan"
                  className={`${inputClass} resize-none`}
                />
              </div>

              <div className="flex gap-2 rounded-xl bg-blue-50 border border-blue-100 px-3 py-2.5 text-[11px] text-blue-700 leading-relaxed">
                <Info size={14} className="shrink-0 mt-0.5" />
                <span>Perubahan nama, kelas, NIS, atau NISN hubungi pihak sekolah.</span>
              </div>
            </>
          ) : (
            <>
              <div>
                <label htmlFor="edit-phone" className={labelClass}>No. WhatsApp</label>
                <input
                  id="edit-phone"
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="edit-email" className={labelClass}>Email</label>
                <input
                  id="edit-email"
                  type="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className={inputClass}
                />
              </div>
            </>
          )}

          {error && (
            <div className="flex gap-2 items-start rounded-xl bg-rose-50 border border-rose-200 px-3 py-2.5 text-xs font-semibold text-rose-600" role="alert">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 grid grid-cols-[1fr_2fr] gap-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold transition disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || saved}
            className={`py-3 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition disabled:opacity-90 ${
              saved ? 'bg-emerald-500' : 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20'
            }`}
          >
            {saved ? (
              <>
                <CheckCircle2 size={16} /> Tersimpan
              </>
            ) : saving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Menyimpan...
              </>
            ) : (
              'Simpan Perubahan'
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
