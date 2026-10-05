'use client';

import React from 'react';
import {
  UserCircle,
  Phone,
  Mail,
  Wallet,
  CheckCircle2,
  XCircle,
  School,
  Hash,
  User,
  BookOpen,
  Edit2,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { StudentProfileData } from './types';
import { EditProfileSheet, EditMode, normalizeGender, formatBirthInfo } from './EditProfileSheet';
import { ChangePasswordForm } from '@/components/parent/ChangePasswordForm';

interface ParentProfileDesktopProps {
  student: StudentProfileData;
  formatCurrency: (n: number) => string;
}

export function ParentProfileDesktop({
  student,
  formatCurrency,
}: ParentProfileDesktopProps) {
  const [editMode, setEditMode] = React.useState<EditMode | null>(null);

  const InfoRow = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: React.ElementType;
    label: string;
    value?: string | null;
  }) => (
    <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={16} className="text-blue-500" />
      </div>
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="font-semibold text-slate-800 text-sm mt-0.5">{value || '-'}</p>
      </div>
    </div>
  );

  const EditButton = ({ mode, label }: { mode: EditMode; label: string }) => (
    <button
      type="button"
      onClick={() => setEditMode(mode)}
      className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs transition-colors"
    >
      <Edit2 size={13} /> {label}
    </button>
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center">
          <UserCircle className="text-blue-600" size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Profil Anak & Wali</h1>
          <p className="text-sm text-slate-400">Data lengkap siswa dan akun wali murid</p>
        </div>
      </div>

      {/* Banner Desktop */}
      <div 
        className="rounded-2xl p-6 flex items-center gap-6 text-white shadow-md relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #002957 0%, #0b3366 50%, #1e40af 100%)',
          backgroundColor: '#002957',
          color: '#ffffff',
        }}
      >
        <div className="w-24 h-24 rounded-2xl bg-white border-2 border-white flex items-center justify-center overflow-hidden shrink-0 text-slate-800 font-black text-3xl shadow-xl relative z-10">
          {student.image ? (
            <Image src={student.image} alt={student.name} width={96} height={96} className="object-cover w-full h-full" />
          ) : (
            student.name.charAt(0).toUpperCase()
          )}
        </div>

        <div className="flex-1 relative z-10">
          <h2 className="text-3xl font-black mb-2 text-white">{student.name}</h2>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/20 border border-white/30 px-3 py-1 rounded-full backdrop-blur-sm">
              <School size={11} /> Kelas {student.class || '-'}
            </span>
            {student.nisn && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/20 border border-white/30 px-3 py-1 rounded-full backdrop-blur-sm">
                <Hash size={11} /> NISN: {student.nisn}
              </span>
            )}
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm border ${student.is_active ? 'bg-emerald-500/30 border-emerald-400/40' : 'bg-red-500/30 border-red-400/40'}`}>
              {student.is_active ? <><CheckCircle2 size={11} /> Aktif</> : <><XCircle size={11} /> Tidak Aktif</>}
            </span>
          </div>
        </div>

        <div className="flex gap-3 w-auto shrink-0 relative z-10">
          <Link href="/parent/dashboard/administrasi?tab=savings" className="group flex flex-col items-start gap-3 bg-white/10 border border-white/20 rounded-xl p-4 hover:bg-white/20 transition-all backdrop-blur-sm min-w-[170px]">
            <Wallet size={20} className="text-blue-200 group-hover:scale-110 transition-transform shrink-0" />
            <div>
              <p className="text-[12px] font-bold text-blue-200 uppercase tracking-wider">Tabungan</p>
              <p className="font-bold text-md text-white truncate">{formatCurrency(student.tabunganBalance)}</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Data Siswa & Wali Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <BookOpen size={20} className="text-blue-600" />
            <h3 className="font-bold text-slate-800 text-lg">Data Siswa</h3>
            <EditButton mode="biodata" label="Ubah Biodata" />
          </div>
          <div>
            <InfoRow icon={User} label="Nama Lengkap" value={student.name} />
            <InfoRow icon={Hash} label="NISN (Nasional)" value={student.nisn} />
            <InfoRow icon={Hash} label="NIS (Internal)" value={student.student_number} />
            <InfoRow icon={School} label="Kelas" value={student.class} />
            <InfoRow icon={User} label="Wali Kelas" value={student.homeroomTeacherName} />
            <InfoRow icon={User} label="Jenis Kelamin" value={normalizeGender(student.gender)} />
            <InfoRow icon={School} label="Tempat, Tanggal Lahir" value={formatBirthInfo(student.birth_place, student.birth_date)} />
            <InfoRow icon={School} label="Alamat Siswa" value={student.address} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 self-start">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <User size={20} className="text-purple-600" />
            <h3 className="font-bold text-slate-800 text-lg">Data Wali Murid</h3>
            <EditButton mode="contact" label="Ubah Kontak" />
          </div>
          <div>
            <InfoRow icon={User} label="Nama Wali" value={student.parent_name} />
            <InfoRow icon={Phone} label="No. WhatsApp / Telepon" value={student.parent_phone} />
            <InfoRow icon={Mail} label="Email" value={student.parent_email} />
          </div>
        </div>
      </div>

      {editMode && (
        <EditProfileSheet mode={editMode} student={student} onClose={() => setEditMode(null)} />
      )}

      {/* Change Password Desktop */}
      <div>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
