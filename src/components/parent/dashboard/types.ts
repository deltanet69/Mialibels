export interface StudentInfo {
  id: string;
  name: string;
  className: string;
  nisn: string;
  studentNumber?: string;
  parentName: string;
  parentPhone?: string;
  image?: string;
  address?: string;
  feeWaiverType?: string;
  homeroomTeacher?: {
    name?: string;
    position?: string;
    phone?: string;
    image?: string;
  } | null;
}

export interface AttendanceSummary {
  hadir: number;
  sakit: number;
  izin: number;
  alpha: number;
  total: number;
}

export interface WeekDayAttendance {
  dayName: string;
  dateStr: string;
  dayNumber: number;
  isToday: boolean;
  isPast?: boolean;
  status: string | null;
  reason?: string;
  entry_time?: string | null;
  exit_time?: string | null;
}

export interface TabunganTransaksiItem {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  amount: number;
  balance_after: number;
  description?: string;
  created_at: string;
}

export interface GeneralInvoiceItem {
  name: string;
  amount: number;
  paid?: number;
  is_paid?: boolean;
}

export interface ScheduleItem {
  id?: string;
  day: string;
  time?: string;
  time_start?: string;
  time_end?: string;
  name: string;
  type?: string;
  teacher?: {
    id?: string;
    name?: string;
    image?: string;
    position?: string;
  } | null;
}

export interface DashboardData {
  attendance: AttendanceSummary;
  persentaseHadir: number;
  recentAttendance: any[];
  weekDays: WeekDayAttendance[];
  todayAttendance: any | null;
  balance: number;
  recentSavingsTransactions: TabunganTransaksiItem[];
  sppInvoices: any[];
  allSppInvoices: any[];
  pendingSPP: any | null;
  totalUnpaidSPP: number;
  unpaidSppCount: number;
  paidSppCount: number;
  lastPaidSppTitle: string | null;
  generalInvoices: any[];
  totalGeneralAmount: number;
  totalGeneralPaid: number;
  totalUnpaidGeneral: number;
  isExamCardReady: boolean;
  examCardRequirements: {
    sppSeptemberPaid: boolean;
    ulumFiftyPercent: boolean;
    lksMinimumPaid: boolean;
  };
  schedules?: ScheduleItem[];
}

export interface TargetScheduleInfo {
  dayName: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat';
  labelBadge: string;
  targetDateStr: string;
  reasonBadge: string;
  isTomorrow: boolean;
  isToday: boolean;
  isWeekend: boolean;
}
