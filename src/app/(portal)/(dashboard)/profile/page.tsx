'use client';

import React, { useState, useEffect } from 'react';
import {
  User, Shield, Mail, Key, Loader2, Save, RefreshCw, CheckCircle2, Clock, XCircle,
  AlertCircle, CalendarDays, Phone, MapPin, GraduationCap, BookOpen, IdCard,
  CalendarCheck, CalendarClock, CalendarX, CalendarMinus, Edit3, ChevronDown, ChevronUp
} from 'lucide-react';

// ─── Subject colors (cycled) ───
const SUBJECT_COLORS = [
  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', badge: 'bg-blue-100 text-blue-700' },
  { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-800', badge: 'bg-violet-100 text-violet-700' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-700' },
  { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', badge: 'bg-amber-100 text-amber-700' },
  { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-800', badge: 'bg-rose-100 text-rose-700' },
  { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-800', badge: 'bg-cyan-100 text-cyan-700' },
];

const DAYS_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function formatTime(isoString?: string | null): string {
  if (!isoString) return '-';
  const validIso = (!isoString.endsWith('Z') && !isoString.includes('+')) ? `${isoString}Z` : isoString;
  return new Date(validIso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function getStatusBadge(status: string) {
  const s = (status || '').toUpperCase();
  if (s === 'HADIR') return 'bg-emerald-100 text-emerald-700';
  if (s === 'IZIN') return 'bg-blue-100 text-blue-700';
  if (s === 'SAKIT') return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Email state
  const [newEmail, setNewEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState('');
  const [emailError, setEmailError] = useState('');

  // Show all attendance records
  const [showAllAttendance, setShowAllAttendance] = useState(false);

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
        setNewPassword('');
      } else {
        alert(data.error || 'Gagal mengubah password');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan jaringan');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail) return;
    setEmailError('');
    setEmailSuccess('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setEmailError('Format email tidak valid.');
      return;
    }
    setSavingEmail(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail })
      });
      const data = await res.json();
      if (data.success) {
        setEmailSuccess('Email berhasil diperbarui. Gunakan email baru untuk login berikutnya.');
        setProfile((prev: any) => ({ ...prev, email: newEmail }));
        setNewEmail('');
      } else {
        setEmailError(data.error || 'Gagal mengubah email');
      }
    } catch (err: any) {
      setEmailError(err.message || 'Terjadi kesalahan jaringan');
    } finally {
      setSavingEmail(false);
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

  const staffDetail = profile.staffDetail;
  const attendanceRecords: any[] = profile.attendance_records || [];
  const displayedAttendance = showAllAttendance ? attendanceRecords : attendanceRecords.slice(0, 5);
  const schedules: any[] = profile.schedules || [];

  // Build schedules by day
  const schedulesByDay: Record<string, any[]> = {};
  DAYS_ORDER.forEach(d => { schedulesByDay[d] = []; });
  schedules.forEach(s => {
    const day = (s.day_of_week || '').trim();
    const matched = DAYS_ORDER.find(d => d.toLowerCase() === day.toLowerCase());
    if (matched) schedulesByDay[matched].push(s);
  });

  // Subject color map
  const subjectColorMap: Record<string, number> = {};
  let colorIdx = 0;
  schedules.forEach(s => {
    const key = (s.name || '').toLowerCase();
    if (subjectColorMap[key] === undefined) subjectColorMap[key] = colorIdx++;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* ── HERO: Header Profil ── */}
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
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-800 mb-1">{profile.name}</h1>
            {staffDetail && (
              <p className="text-base font-semibold text-blue-600 mb-2">{staffDetail.position}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-500">
              <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full">
                <Mail size={14} className="text-slate-400" /> {profile.email}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full capitalize">
                <Shield size={14} /> {profile.role}
              </span>
              {staffDetail?.is_active !== undefined && (
                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${staffDetail.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${staffDetail.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  {staffDetail.is_active ? 'Aktif Mengajar' : 'Non Aktif'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── DATA DIRI LENGKAP (for staff/guru) ── */}
      {profile.isStaff && staffDetail && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-5">
            <User size={20} className="text-slate-400" />
            Data Diri Lengkap
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Phone size={16} className="text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">No HP / WhatsApp</p>
                <p className="text-sm font-medium text-slate-700">{staffDetail.phone || '-'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail size={16} className="text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Email</p>
                <p className="text-sm font-medium text-slate-700">{staffDetail.email || profile.email || '-'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin size={16} className="text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Alamat</p>
                <p className="text-sm font-medium text-slate-700 leading-relaxed">{staffDetail.address || '-'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <IdCard size={16} className="text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">ID / RFID Kartu</p>
                <p className="text-sm font-mono font-medium text-slate-700">{staffDetail.rfid || 'Belum terdaftar'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <GraduationCap size={16} className="text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Pendidikan Terakhir</p>
                <p className="text-sm font-medium text-slate-700">{staffDetail.education_level || '-'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <BookOpen size={16} className="text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Jurusan / Fakultas</p>
                <p className="text-sm font-medium text-slate-700">{staffDetail.major || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ATTENDANCE SUMMARY + RECORDS ── */}
      {profile.isStaff && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ringkasan Kehadiran */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-5">
              <CalendarCheck size={20} className="text-slate-400" />
              Ringkasan Kehadiran
            </h3>
            {profile.attendance ? (
              <div className="grid grid-cols-2 gap-3">
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
              <div className="p-8 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-500">Belum ada data absensi tercatat.</p>
              </div>
            )}
          </div>

          {/* Tugas Wali Kelas */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-5">
              <CalendarDays size={20} className="text-slate-400" />
              Tugas Wali Kelas
            </h3>
            {profile.assigned_classrooms && profile.assigned_classrooms.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {profile.assigned_classrooms.map((cls: any) => (
                  <div key={cls.id} className="px-4 py-3 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl flex items-center gap-3">
                    <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 font-bold text-lg">
                      {cls.name.charAt(0)}
                    </span>
                    <div>
                      <p className="text-sm font-bold">Kelas {cls.name}</p>
                      <p className="text-[10px] uppercase font-bold text-indigo-400">Wali Kelas</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                <p className="text-sm font-medium text-slate-500">Tidak ada penugasan wali kelas saat ini.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CATATAN KEHADIRAN ── */}
      {profile.isStaff && attendanceRecords.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <CalendarMinus size={20} className="text-slate-400" />
              Catatan Kehadiran
            </h3>
            <span className="text-xs font-medium text-slate-400">
              {attendanceRecords.length} entri total
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            {displayedAttendance.map((att: any) => (
              <div key={att.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition">
                <div>
                  <p className="font-semibold text-slate-700 text-sm">
                    {new Date(att.date).toLocaleDateString('id-ID', {
                      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </p>
                  {att.notes && <p className="text-xs text-slate-400 mt-0.5 italic">{att.notes}</p>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {(att.check_in_time || att.check_out_time) && (
                    <div className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-lg font-mono flex items-center gap-2">
                      {att.check_in_time && <span>↓ {formatTime(att.check_in_time)}</span>}
                      {att.check_out_time && <span>↑ {formatTime(att.check_out_time)}</span>}
                    </div>
                  )}
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(att.status)}`}>
                    {att.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {attendanceRecords.length > 5 && (
            <div className="px-6 py-4 border-t border-slate-100">
              <button
                onClick={() => setShowAllAttendance(prev => !prev)}
                className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
              >
                {showAllAttendance ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {showAllAttendance ? 'Sembunyikan' : `Lihat Semua (${attendanceRecords.length} entri)`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── JADWAL JAM MENGAJAR ── */}
      {profile.isStaff && schedules.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <BookOpen size={20} className="text-slate-400" />
              Jadwal Jam Mengajar
            </h3>
            <span className="text-xs font-medium text-slate-400">{schedules.length} jadwal</span>
          </div>
          <div className="p-4 space-y-4">
            {DAYS_ORDER.map(day => {
              const daySchedules = schedulesByDay[day];
              if (daySchedules.length === 0) return null;
              return (
                <div key={day}>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">{day}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {daySchedules.map((s: any, idx: number) => {
                      const colorKey = (s.name || '').toLowerCase();
                      const cIdx = subjectColorMap[colorKey] ?? 0;
                      const color = SUBJECT_COLORS[cIdx % SUBJECT_COLORS.length];
                      return (
                        <div key={s.id || idx} className={`${color.bg} border ${color.border} rounded-xl p-3 flex flex-col gap-1`}>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md w-fit ${color.badge}`}>
                            {(s.start_time || '').slice(0, 5)} – {(s.end_time || '').slice(0, 5)}
                          </span>
                          <h4 className={`font-bold text-sm ${color.text}`}>{s.name}</h4>
                          <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                            <GraduationCap size={11} /> Kelas {s.classroom?.name || '-'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── OPSI UPDATE AKSES ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
          <Key size={20} className="text-slate-400" />
          Opsi Update Akses
        </h3>
        <p className="text-sm text-slate-500 mb-6">Perbarui email dan password akun untuk keamanan login.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Update Email */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                <Mail size={14} className="inline mr-1.5 text-slate-400" />
                Email Baru
              </label>
              <p className="text-xs text-slate-400 mb-2">Email saat ini: <span className="font-semibold text-slate-600">{profile.email}</span></p>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Ketik email baru..."
                className="w-full pl-3 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
              />
            </div>
            {emailError && (
              <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100 flex items-center gap-2">
                <AlertCircle size={16} /> {emailError}
              </div>
            )}
            {emailSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-xl border border-emerald-100 flex items-center gap-2">
                <CheckCircle2 size={16} /> {emailSuccess}
              </div>
            )}
            <button
              onClick={handleUpdateEmail}
              disabled={savingEmail || !newEmail}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            >
              {savingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {savingEmail ? 'Menyimpan...' : 'Simpan Email Baru'}
            </button>
          </div>

          {/* Update Password */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                <Key size={14} className="inline mr-1.5 text-slate-400" />
                Password Baru
              </label>
              <p className="text-xs text-slate-400 mb-2">Minimal 6 karakter. Bisa gunakan Generate untuk auto-generate.</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ketik password baru..."
                  className="flex-1 pl-3 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 font-mono"
                />
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition flex items-center gap-2 text-sm font-medium whitespace-nowrap"
                >
                  <RefreshCw size={16} /> Generate
                </button>
              </div>
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
      </div>

    </div>
  );
}
