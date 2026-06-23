export interface Classroom {
  id: string;
  name: string;
  enrolledStudents: number;
  homeroomTeacher: string;
}

export interface StudentAttendance {
  id: string;
  name: string;
  nis: string;
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpha' | '';
}

export interface Schedule {
  id: string;
  name: string;
  time: string;
  type: 'Akademik' | 'Ekstrakurikuler' | 'Lainnya' | 'Blank';
}

export interface ClassInfo {
  id: string;
  title: string;
  date: string;
  description: string;
}

export const dummyClassrooms: Classroom[] = [
  { id: '1', name: '1A - Mawar', enrolledStudents: 30, homeroomTeacher: 'Siti Aminah, S.Pd' },
  { id: '2', name: '1B - Melati', enrolledStudents: 28, homeroomTeacher: 'Budi Santoso, S.Pd' },
  { id: '3', name: '2A - Anggrek', enrolledStudents: 32, homeroomTeacher: 'Rina Herawati, S.Pd' },
  { id: '4', name: '2B - Tulip', enrolledStudents: 31, homeroomTeacher: 'Ahmad Fauzi, S.Pd' },
  { id: '5', name: '3A - Kenanga', enrolledStudents: 29, homeroomTeacher: 'Dewi Lestari, S.Pd' },
  { id: '6', name: '3B - Flamboyan', enrolledStudents: 30, homeroomTeacher: 'Eko Prasetyo, S.Pd' },
];

export const dummyStudents: StudentAttendance[] = [
  { id: 's1', name: 'Aditya Pratama', nis: '1001', status: '' },
  { id: 's2', name: 'Bunga Citra', nis: '1002', status: '' },
  { id: 's3', name: 'Candra Wijaya', nis: '1003', status: '' },
  { id: 's4', name: 'Dina Mariana', nis: '1004', status: '' },
  { id: 's5', name: 'Eka Saputra', nis: '1005', status: '' },
  { id: 's6', name: 'Fira Nabila', nis: '1006', status: '' },
  { id: 's7', name: 'Gilang Ramadhan', nis: '1007', status: '' },
  { id: 's8', name: 'Hana Safitri', nis: '1008', status: '' },
  { id: 's9', name: 'Irfan Hakim', nis: '1009', status: '' },
  { id: 's10', name: 'Jihan Ayu', nis: '1010', status: '' },
];

export const dummySchedules: Schedule[] = [
  { id: 'sch1', name: 'Upacara Bendera', time: '07:00 - 07:45', type: 'Lainnya' },
  { id: 'sch2', name: 'Matematika', time: '07:45 - 09:15', type: 'Akademik' },
  { id: 'sch3', name: 'Istirahat', time: '09:15 - 09:45', type: 'Blank' },
  { id: 'sch4', name: 'Bahasa Indonesia', time: '09:45 - 11:15', type: 'Akademik' },
  { id: 'sch5', name: 'Pendidikan Agama Islam', time: '11:15 - 12:45', type: 'Akademik' },
  { id: 'sch6', name: 'Istirahat / Sholat', time: '12:45 - 13:15', type: 'Blank' },
  { id: 'sch7', name: 'Pramuka', time: '13:15 - 14:45', type: 'Ekstrakurikuler' },
];

export const dummyInfos: ClassInfo[] = [
  { id: 'i1', title: 'Persiapan Ujian Tengah Semester', date: '25 Juni 2026', description: 'Mohon persiapkan diri untuk UTS yang akan dimulai minggu depan. Jadwal lengkap telah dibagikan ke grup wali murid.' },
  { id: 'i2', title: 'Pembayaran SPP Bulan Juli', date: '20 Juni 2026', description: 'Batas akhir pembayaran SPP bulan Juli adalah tanggal 10 Juli. Pembayaran dapat dilakukan melalui transfer bank atau langsung ke tata usaha.' },
  { id: 'i3', title: 'Kegiatan Jumat Bersih', date: '18 Juni 2026', description: 'Jumat ini kita akan mengadakan kegiatan kerja bakti membersihkan kelas. Harap membawa alat kebersihan dari rumah.' },
];
