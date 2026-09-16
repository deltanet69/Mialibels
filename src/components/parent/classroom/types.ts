export interface ScheduleItem {
  id: string;
  day: string;
  time?: string;
  time_start?: string;
  time_end?: string;
  name: string;
  type?: string;
  teacher?: {
    id: string;
    name: string;
    image?: string;
    position?: string;
  } | null;
}

export interface StudentInfo {
  id: string;
  name: string;
  className: string;
  classId?: string;
  homeroomTeacher?: {
    name?: string;
    position?: string;
    phone?: string;
    image?: string;
  } | null;
}

export interface ClassroomProps {
  student: StudentInfo;
  initialSchedules: ScheduleItem[];
  initialAttendance?: AttendanceRecord[];
  initialSummary?: AttendanceSummary | null;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha';
  reason?: string | null;
}

export interface AttendanceSummary {
  hadir: number;
  sakit: number;
  izin: number;
  alpha: number;
}

export const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

export const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];
