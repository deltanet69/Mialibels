'use client';

import React, { useState, useEffect } from 'react';
import { User, Shield, Mail, Key, Loader2, Save, RefreshCw, CheckCircle2, Clock, XCircle, AlertCircle, CalendarDays } from 'lucide-react';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile');
        const data = await res.json();
        if (data.success) {
          setProfile(data.data);
        } else {
          setError(data.error || 'Gagal memuat profil');
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan jaringan');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleGeneratePassword = () => {
    // Generate a secure random password (8 chars, letters, numbers, symbol)
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      alert('Password minimal 6 karakter.');
      return;
    }
    
    setSavingPassword(true);
    setPasswordSuccess('');
    
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      });
      
      const data = await res.json();
      if (data.success) {
        setPasswordSuccess('Password berhasil diperbarui.');
        setNewPassword(''); // clear field after success
      } else {
        alert(data.error || 'Gagal mengubah password');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan jaringan');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 font-medium text-center">
        {error || 'Profil tidak ditemukan'}
      </div>
    );
  }

  const initials = profile.name
    ? profile.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Profil */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-3xl -mt-20 -mr-20 opacity-60" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
          {profile.image ? (
            <img src={profile.image} alt={profile.name} className="w-24 h-24 rounded-2xl object-cover shadow-lg shadow-blue-500/30 shrink-0 border-4 border-white" />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-4xl shadow-lg shadow-blue-500/30 shrink-0">
              {initials}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">{profile.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-500">
              <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full">
                <Mail size={14} className="text-slate-400" /> {profile.email}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full capitalize">
                <Shield size={14} /> {profile.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kolom Kiri: Keamanan (Password) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6 self-start">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
              <Key size={20} className="text-slate-400" />
              Keamanan Akun
            </h3>
            <p className="text-sm text-slate-500">Ubah password akun Anda untuk menjaga keamanan.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password Baru</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ketik password baru..."
                  className="flex-1 pl-3 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 font-mono"
                />
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition flex items-center gap-2 text-sm font-medium whitespace-nowrap"
                >
                  <RefreshCw size={16} /> Generate
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">Password harus memiliki minimal 6 karakter.</p>
            </div>

            {passwordSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-xl border border-emerald-100 flex items-center gap-2">
                <CheckCircle2 size={16} /> {passwordSuccess}
              </div>
            )}

            <button
              onClick={handleUpdatePassword}
              disabled={savingPassword || !newPassword}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            >
              {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {savingPassword ? 'Menyimpan...' : 'Simpan Password Baru'}
            </button>
          </div>
        </div>

        {/* Kolom Kanan: Info Pegawai / Guru */}
        {profile.isStaff && (
          <div className="space-y-6">
            
            {/* Riwayat Absensi Pribadi */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
                  <User size={20} className="text-slate-400" />
                  Riwayat Absensi Anda
                </h3>
                <p className="text-sm text-slate-500">Rekapitulasi kehadiran Anda secara keseluruhan.</p>
              </div>

              {profile.attendance ? (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex flex-col items-center justify-center text-center">
                    <CheckCircle2 size={24} className="text-emerald-500 mb-2" />
                    <span className="text-2xl font-black text-emerald-700">{profile.attendance.hadir}</span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mt-1">Hadir</span>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex flex-col items-center justify-center text-center">
                    <AlertCircle size={24} className="text-blue-500 mb-2" />
                    <span className="text-2xl font-black text-blue-700">{profile.attendance.sakit}</span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 mt-1">Sakit</span>
                  </div>
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex flex-col items-center justify-center text-center">
                    <Clock size={24} className="text-amber-500 mb-2" />
                    <span className="text-2xl font-black text-amber-700">{profile.attendance.izin}</span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 mt-1">Izin</span>
                  </div>
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex flex-col items-center justify-center text-center">
                    <XCircle size={24} className="text-rose-500 mb-2" />
                    <span className="text-2xl font-black text-rose-700">{profile.attendance.alpha}</span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 mt-1">Alpha</span>
                  </div>
                </div>
              ) : (
                <div className="mt-4 p-8 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                  <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-500">Belum ada data absensi tercatat.</p>
                </div>
              )}
            </div>

            {/* Tugas Kelas */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
                  <CalendarDays size={20} className="text-slate-400" />
                  Tugas Wali Kelas
                </h3>
                <p className="text-sm text-slate-500">Kelas yang saat ini diampu sebagai wali kelas.</p>
              </div>

              <div className="mt-4">
                {profile.assigned_classrooms && profile.assigned_classrooms.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {profile.assigned_classrooms.map((cls: any) => (
                      <div key={cls.id} className="px-4 py-3 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold">
                          {cls.name.charAt(0)}
                        </span>
                        <div>
                          <p className="text-sm font-bold">Kelas {cls.name}</p>
                          <p className="text-[10px] uppercase font-bold text-indigo-500">Wali Kelas</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                    <p className="text-sm font-medium text-slate-500">Tidak ada penugasan kelas untuk saat ini.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
