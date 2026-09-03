/**
 * ============================================================================
 * PENGATURAN JAM & RULES ABSENSI SISWA & GURU / STAFF MI ATTAQWA 15 BABELAN
 * ============================================================================
 * 
 * Anda dapat dengan mudah mengubah jam batasan absensi siswa & guru di file ini.
 * Semua waktu mengacu pada Waktu Indonesia Barat (WIB / UTC+7).
 * 
 * ============================================================================
 * 1. ATURAN PRESENSI SISWA:
 * ============================================================================
 * - 00:01 - 06:45 WIB : Hadir [Tepat Waktu]
 * - 06:46 - 07:15 WIB : Hadir [Terlambat Datang]
 * - Setelah 07:15 WIB : Absen Terkunci -> Ditolak & Status otomatis [Alpha]
 * - Minimal 10:30 WIB : Absen Pulang
 * 
 * ============================================================================
 * 2. ATURAN PRESENSI GURU & STAFF:
 * ============================================================================
 * - SHIFT PAGI (Kelas 1-6 Fullday, Kelas 1, 4, 6 Reguler, Staff TU & Guru Yanbu'a):
 *   * <= 06:45 WIB : Hadir [Tepat Waktu]
 *   * > 06:45 WIB  : Hadir [Datang Terlambat]
 *   * Minimal 12:30 WIB : Absen Pulang
 * 
 * - SHIFT SIANG (Guru Kelas 2, 3, dan 5 Reguler):
 *   * <= 12:30 WIB : Hadir [Tepat Waktu]
 *   * > 12:30 WIB  : Hadir [Datang Terlambat]
 *   * Minimal 15:30 WIB : Absen Pulang
 */

// ============================================================================
// KONFIGURASI SISWA
// ============================================================================
export const ATTENDANCE_CONFIG = {
  // Waktu mulai scan masuk (00:01 WIB)
  CHECKIN_START: {
    hours: 0,
    minutes: 1,
    timeString: '00:01',
  },

  // Batas akhir Hadir Tepat Waktu (06:45 WIB)
  ON_TIME_LIMIT: {
    hours: 6,
    minutes: 45,
    timeString: '06:45',
  },

  // Batas akhir Hadir Terlambat / Kunci Absen Masuk (07:15 WIB)
  LATE_LIMIT: {
    hours: 7,
    minutes: 15,
    timeString: '07:15',
  },

  // Jam minimal diperbolehkan scan pulang siswa (10:30 WIB)
  CHECKOUT_MIN_TIME: {
    hours: 10,
    minutes: 30,
    timeString: '10:30',
  },
} as const

// ============================================================================
// KONFIGURASI GURU & STAFF
// ============================================================================
export const TEACHER_ATTENDANCE_CONFIG = {
  // 1. Shift Pagi: Kelas 1-6 Fullday, Kelas 1, 4, 6 Reguler, Staff TU, & Guru Yanbu'a
  MORNING_SHIFT: {
    name: 'Shift Pagi',
    description: 'Guru Kelas 1-6 Fullday, Kelas 1/4/6 Reguler, Staff & Guru Yanbu\'a',
    ON_TIME_LIMIT: {
      hours: 6,
      minutes: 45,
      timeString: '06:45',
    },
    CHECKOUT_MIN_TIME: {
      hours: 12,
      minutes: 30,
      timeString: '12:30',
    },
  },

  // 2. Shift Siang: Guru Kelas 2, 3, dan 5 Reguler
  AFTERNOON_SHIFT: {
    name: 'Shift Siang',
    description: 'Guru Kelas 2, 3, dan 5 Reguler',
    ON_TIME_LIMIT: {
      hours: 12,
      minutes: 30,
      timeString: '12:30',
    },
    CHECKOUT_MIN_TIME: {
      hours: 15,
      minutes: 30,
      timeString: '15:30',
    },
  },
} as const

// ============================================================================
// HELPER EVALUASI SISWA
// ============================================================================
export function evaluateStudentCheckIn(hours: number, minutes: number) {
  const currentMinutes = hours * 60 + minutes
  const startMinutes = ATTENDANCE_CONFIG.CHECKIN_START.hours * 60 + ATTENDANCE_CONFIG.CHECKIN_START.minutes
  const onTimeMinutes = ATTENDANCE_CONFIG.ON_TIME_LIMIT.hours * 60 + ATTENDANCE_CONFIG.ON_TIME_LIMIT.minutes
  const lateLimitMinutes = ATTENDANCE_CONFIG.LATE_LIMIT.hours * 60 + ATTENDANCE_CONFIG.LATE_LIMIT.minutes

  if (currentMinutes < startMinutes) {
    return {
      allowed: false,
      status: 'Belum Dibuka' as const,
      isLate: false,
      message: `Absensi belum dibuka (Buka mulai pukul ${ATTENDANCE_CONFIG.CHECKIN_START.timeString} WIB)`,
    }
  }

  // 00:01 - 06:45 -> Hadir (Tepat Waktu)
  if (currentMinutes <= onTimeMinutes) {
    return {
      allowed: true,
      status: 'Hadir' as const,
      isLate: false,
      message: 'Tepat Waktu',
    }
  }

  // 06:46 - 07:15 -> Hadir (Terlambat)
  if (currentMinutes <= lateLimitMinutes) {
    return {
      allowed: true,
      status: 'Terlambat' as const,
      isLate: true,
      message: 'Terlambat Datang',
    }
  }

  // Setelah 07:15 WIB -> Absen Terkunci & Status Alpha
  return {
    allowed: false,
    status: 'Alpha' as const,
    isLate: true,
    message: `Absensi masuk sudah ditutup (Batas maksimal pukul ${ATTENDANCE_CONFIG.LATE_LIMIT.timeString} WIB). Status kehadiran Anda tercatat Alpha.`,
  }
}

// ============================================================================
// HELPER EVALUASI GURU & STAFF
// ============================================================================

/**
 * Mendeteksi apakah suatu rombel/kelas masuk ke Shift Siang (Kelas 2, 3, 5 Reguler)
 */
export function isAfternoonClass(rawName?: string): boolean {
  if (!rawName) return false
  const name = rawName.toLowerCase().replace(/\s+/g, '')
  
  // Fullday / FD selalu Shift Pagi
  if (name.includes('fullday') || name.includes('fd')) return false

  // Kelas 2, 3, 5 Reguler
  const isGrade2 = name.includes('kelas2') || name.includes('2a') || name.includes('2b') || name.includes('2c') || name.includes('2d') || name === '2'
  const isGrade3 = name.includes('kelas3') || name.includes('3a') || name.includes('3b') || name.includes('3c') || name.includes('3d') || name === '3'
  const isGrade5 = name.includes('kelas5') || name.includes('5a') || name.includes('5b') || name.includes('5c') || name.includes('5d') || name === '5'

  return isGrade2 || isGrade3 || isGrade5
}

/**
 * Mendeteksi apakah suatu rombel/kelas masuk ke Shift Pagi (Kelas 1-6 Fullday, Kelas 1, 4, 6 Reguler)
 */
export function isMorningClass(rawName?: string): boolean {
  if (!rawName) return false
  const name = rawName.toLowerCase().replace(/\s+/g, '')

  // Semua kelas Fullday (1-6) adalah shift pagi
  if (name.includes('fullday') || name.includes('fd')) return true

  // Kelas 1, 4, 6 Reguler
  const isGrade1 = name.includes('kelas1') || name.includes('1a') || name.includes('1b') || name.includes('1c') || name.includes('1d') || name === '1'
  const isGrade4 = name.includes('kelas4') || name.includes('4a') || name.includes('4b') || name.includes('4c') || name.includes('4d') || name === '4'
  const isGrade6 = name.includes('kelas6') || name.includes('6a') || name.includes('6b') || name.includes('6c') || name.includes('6d') || name === '6'

  return isGrade1 || isGrade4 || isGrade6
}

export type TeacherScheduleItem = {
  day?: string
  time?: string
  classroom?: { name?: string } | null
  classroom_name?: string
  name?: string
}

/**
 * Menentukan shift guru/staff (Pagi atau Siang)
 * @param staff Objek staff / guru
 * @param schedules Daftar jadwal mengajar guru
 * @param dayName Nama hari ini dalam bahasa Indonesia ('Senin', 'Selasa', dst.)
 */
export function determineTeacherShift(
  staff: { position?: string | null; name?: string | null },
  schedules: TeacherScheduleItem[] = [],
  dayName?: string
): 'Pagi' | 'Siang' {
  const position = (staff.position || '').toLowerCase()
  const staffName = (staff.name || '').toLowerCase()

  // 1. Staff umum, Tata Usaha, Security, Kebersihan, Kepala Sekolah, & Guru Yanbu'a -> SHIFT PAGI
  if (
    position.includes('staff') ||
    position.includes('tata usaha') ||
    position.includes('tu') ||
    position.includes('security') ||
    position.includes('kebersihan') ||
    position.includes('operator') ||
    position.includes('kepala') ||
    position.includes('yanbua') ||
    position.includes("yanbu'a") ||
    staffName.includes('yanbua') ||
    staffName.includes("yanbu'a")
  ) {
    return 'Pagi'
  }

  // 2. Evaluasi berdasarkan Jadwal Mengajar (classroom_schedules)
  let relevantSchedules = schedules || []
  
  // Jika hari ini ditentukan, prioritaskan jadwal mengajar hari ini
  if (dayName && relevantSchedules.length > 0) {
    const todaySchedules = relevantSchedules.filter(
      s => (s.day || '').trim().toLowerCase() === dayName.trim().toLowerCase()
    )
    if (todaySchedules.length > 0) {
      relevantSchedules = todaySchedules
    }
  }

  if (relevantSchedules.length > 0) {
    // Jika ada jadwal kelas pagi hari ini / kelas pagi yang diajar -> Shift Pagi
    const hasMorningClassSchedule = relevantSchedules.some(s => {
      const clsName = s.classroom?.name || s.classroom_name || ''
      if (isMorningClass(clsName)) return true

      // Cek apakah jam pelajaran mulai di pagi hari (misal jam 07:xx - 10:xx)
      if (s.time) {
        const match = s.time.match(/(\d{1,2})[:.](\d{2})/)
        if (match) {
          const h = parseInt(match[1], 10)
          if (h < 11) return true
        }
      }
      return false
    })

    if (hasMorningClassSchedule) {
      return 'Pagi'
    }

    // Jika semua jadwal adalah kelas siang (Kelas 2, 3, 5 Reguler) -> Shift Siang
    const hasAfternoonClassSchedule = relevantSchedules.some(s => {
      const clsName = s.classroom?.name || s.classroom_name || ''
      return isAfternoonClass(clsName)
    })

    if (hasAfternoonClassSchedule) {
      return 'Siang'
    }
  }

  // Default jika tidak terdeteksi jadwal siang khusus -> Shift Pagi
  return 'Pagi'
}

/**
 * Evaluasi status absensi masuk guru/staff
 * @param shift 'Pagi' | 'Siang'
 * @param hours Jam lokal WIB (0-23)
 * @param minutes Menit lokal WIB (0-59)
 */
export function evaluateTeacherCheckIn(shift: 'Pagi' | 'Siang', hours: number, minutes: number) {
  const currentMinutes = hours * 60 + minutes
  const config = shift === 'Siang' ? TEACHER_ATTENDANCE_CONFIG.AFTERNOON_SHIFT : TEACHER_ATTENDANCE_CONFIG.MORNING_SHIFT

  const limitMinutes = config.ON_TIME_LIMIT.hours * 60 + config.ON_TIME_LIMIT.minutes

  // Sebelum atau pas batas jam: Hadir [Tepat Waktu]
  if (currentMinutes <= limitMinutes) {
    return {
      status: 'HADIR' as const,
      isLate: false,
      shift,
      threshold: config.ON_TIME_LIMIT.timeString,
      message: `Hadir [Tepat Waktu] (${shift} - Batas ${config.ON_TIME_LIMIT.timeString} WIB)`,
      notes: `Hadir Tepat Waktu (${shift})`,
    }
  }

  // Lewat batas jam: Hadir [Datang Terlambat]
  return {
    status: 'TERLAMBAT' as const,
    isLate: true,
    shift,
    threshold: config.ON_TIME_LIMIT.timeString,
    message: `Hadir [Datang Terlambat] (${shift} - Batas ${config.ON_TIME_LIMIT.timeString} WIB)`,
    notes: `Datang Terlambat (${shift})`,
  }
}
