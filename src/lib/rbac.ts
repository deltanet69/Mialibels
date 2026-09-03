export type UserRole = 
  | 'superadmin' 
  | 'administrasi' 
  | 'bendahara' 
  | 'kepsek' 
  | 'staff_operator' 
  | 'staff' 
  | 'guru';

export const ALL_ROLES: UserRole[] = [
  'superadmin',
  'administrasi',
  'bendahara',
  'kepsek',
  'staff_operator',
  'staff',
  'guru',
];

/** Periksa apakah role adalah read-only secara global */
export function isReadOnlyRole(role?: string | null): boolean {
  if (!role) return true;
  const r = role.toLowerCase().trim();
  return r === 'kepsek' || r === 'bendahara' || r === 'staff';
}

/** Hak kelola Data Siswa (CRUD, Import, Bulk Upload, Generate Akses) */
export function canManageStudents(role?: string | null): boolean {
  if (!role) return false;
  const r = role.toLowerCase().trim();
  return r === 'superadmin' || r === 'administrasi' || r === 'staff_operator';
}

/** Hak kelola Data Guru & Jadwal (CRUD data guru, koreksi absensi) */
export function canManageTeachers(role?: string | null): boolean {
  if (!role) return false;
  const r = role.toLowerCase().trim();
  return r === 'superadmin' || r === 'administrasi' || r === 'staff_operator';
}

/** Hak eksekusi & mutasi Keuangan (Buat tagihan, transaksi tabungan, pembayaran SPP) */
export function canManageFinance(role?: string | null): boolean {
  if (!role) return false;
  const r = role.toLowerCase().trim();
  return r === 'superadmin' || r === 'administrasi';
}

/** Hak melihat menu Keuangan (Superadmin, Administrasi, Bendahara, Kepsek) */
export function canViewFinance(role?: string | null): boolean {
  if (!role) return false;
  const r = role.toLowerCase().trim();
  return r === 'superadmin' || r === 'administrasi' || r === 'bendahara' || r === 'kepsek';
}

/** Hak kelola Konten Website (Berita, Galeri, Banner, Testimoni, Pesan Masuk) */
export function canManageContent(role?: string | null): boolean {
  if (!role) return false;
  const r = role.toLowerCase().trim();
  return r === 'superadmin' || r === 'staff_operator';
}

/** Hak melihat Konten Website */
export function canViewContent(role?: string | null): boolean {
  if (!role) return false;
  const r = role.toLowerCase().trim();
  return r === 'superadmin' || r === 'staff_operator' || r === 'kepsek';
}

/** Hak melihat Laporan Eksekutif (/reports) — Khusus Superadmin, Kepsek, dan Bendahara */
export function canViewExecutiveReports(role?: string | null): boolean {
  if (!role) return false;
  const r = role.toLowerCase().trim();
  return r === 'superadmin' || r === 'kepsek' || r === 'bendahara';
}

/** Hak melihat Log Aktivitas (/reports/logs) */
export function canViewActivityLogs(role?: string | null): boolean {
  if (!role) return false;
  const r = role.toLowerCase().trim();
  return r === 'superadmin' || r === 'staff_operator' || r === 'kepsek';
}

/** Hak akses Manajemen User (/users) */
export function canManageUsers(role?: string | null): boolean {
  if (!role) return false;
  const r = role.toLowerCase().trim();
  return r === 'superadmin' || r === 'staff_operator';
}
