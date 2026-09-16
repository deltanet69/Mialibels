/**
 * Utility functions for Jakarta / WIB (UTC+7) Date and Time Handling
 * MI Attaqwa 15 Portal
 */

/**
 * Returns YYYY-MM-DD string in Asia/Jakarta timezone
 */
export function getWIBDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

/**
 * Returns HH:mm or HH:mm:ss string in Asia/Jakarta timezone (24-hour format)
 */
export function getWIBTimeString(date: Date = new Date(), withSeconds = false): string {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    second: withSeconds ? '2-digit' : undefined,
    hour12: false
  }).format(date).replace('.', ':');
}

/**
 * Returns integer parts (year, month, day, dayOfWeek, hours, minutes, seconds)
 * strictly evaluated in Asia/Jakarta (WIB / UTC+7) timezone.
 */
export function getWIBParts(date: Date = new Date()): {
  year: number;
  month: number; // 1 - 12
  day: number; // 1 - 31
  dayOfWeek: number; // 0=Minggu, 1=Senin, 2=Selasa, 3=Rabu, 4=Kamis, 5=Jumat, 6=Sabtu
  hours: number; // 0 - 23
  minutes: number;
  seconds: number;
} {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  });

  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};
  parts.forEach((p) => {
    map[p.type] = p.value;
  });

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6
  };

  const rawHour = parseInt(map.hour, 10);
  const hour = rawHour === 24 ? 0 : rawHour;

  return {
    year: parseInt(map.year, 10),
    month: parseInt(map.month, 10),
    day: parseInt(map.day, 10),
    dayOfWeek: weekdayMap[map.weekday] ?? 0,
    hours: hour,
    minutes: parseInt(map.minute, 10),
    seconds: parseInt(map.second, 10)
  };
}

/**
 * Returns Indonesian formatted date string in Asia/Jakarta timezone
 * e.g. "Rabu, 16 September 2026"
 */
export function formatWIBDateIndo(date: Date = new Date(), options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  };

  return new Intl.DateTimeFormat('id-ID', {
    ...defaultOptions,
    ...(options || {})
  }).format(date);
}

/**
 * Returns Islamic / Indonesian greeting based on WIB hour
 */
export function getWIBGreeting(date: Date = new Date()): string {
  const { hours } = getWIBParts(date);
  if (hours >= 4 && hours < 11) return 'Selamat Pagi';
  if (hours >= 11 && hours < 15) return 'Selamat Siang';
  if (hours >= 15 && hours < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

/**
 * Generates the 5 school weekdays (Senin - Jumat) for the current week in Asia/Jakarta timezone.
 * Avoids any timezone shift bugs by anchoring at noon UTC.
 */
export function getWIBWeekDays(referenceDate: Date = new Date()) {
  const parts = getWIBParts(referenceDate);
  const todayStr = getWIBDateString(referenceDate);

  // dayOfWeek: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  const dayOfWeek = parts.dayOfWeek;
  const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  // Anchor at noon UTC using WIB date parts
  const refNoonUTC = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12, 0, 0));
  const mondayDate = new Date(refNoonUTC);
  mondayDate.setUTCDate(refNoonUTC.getUTCDate() + diffToMon);

  const DAY_NAMES = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
  const weekDays: Array<{
    dayName: string;
    dateStr: string;
    dayNumber: number;
    isToday: boolean;
    isPast: boolean;
  }> = [];

  for (let i = 0; i < 5; i++) {
    const d = new Date(mondayDate);
    d.setUTCDate(mondayDate.getUTCDate() + i);

    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dayNum = d.getUTCDate();
    const dateStr = `${y}-${m}-${String(dayNum).padStart(2, '0')}`;

    const isToday = dateStr === todayStr;
    const isPast = dateStr < todayStr;

    weekDays.push({
      dayName: DAY_NAMES[i],
      dateStr,
      dayNumber: dayNum,
      isToday,
      isPast
    });
  }

  return {
    weekDays,
    mondayStr: weekDays[0].dateStr,
    fridayStr: weekDays[4].dateStr,
    todayStr
  };
}

/**
 * Determines target schedule info (day, date, badge) based on WIB rules:
 * - Weekend (Sat & Sun) -> Senin
 * - Active weekdays (Mon - Fri):
 *   - Before 18:00 WIB -> Today
 *   - After 18:00 WIB -> Next school day (Fri > 18:00 -> Senin)
 */
export function getWIBTargetScheduleInfo(date: Date = new Date()) {
  const parts = getWIBParts(date);
  const { dayOfWeek, hours } = parts;

  // Anchor at noon UTC using WIB date parts
  const refNoonUTC = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12, 0, 0));

  // 1. Weekend: Saturday (6) or Sunday (0) -> Target is Monday
  if (dayOfWeek === 6 || dayOfWeek === 0) {
    const daysToAdd = dayOfWeek === 6 ? 2 : 1;
    const targetDate = new Date(refNoonUTC);
    targetDate.setUTCDate(refNoonUTC.getUTCDate() + daysToAdd);

    const targetDateStr = formatWIBDateIndo(targetDate);

    return {
      dayName: 'Senin' as const,
      labelBadge: dayOfWeek === 0 ? 'Besok (Senin)' : 'Senin Depan',
      targetDateStr,
      reasonBadge: 'Persiapan Awal Pekan',
      isTomorrow: dayOfWeek === 0,
      isToday: false,
      isWeekend: true
    };
  }

  // 2. Active School Weekdays (1=Mon .. 5=Fri)
  // Before 18:00 WIB -> Today's schedule
  if (hours < 18) {
    const mapDays: Record<number, 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat'> = {
      1: 'Senin',
      2: 'Selasa',
      3: 'Rabu',
      4: 'Kamis',
      5: 'Jumat'
    };
    const dayName = mapDays[dayOfWeek] || 'Senin';
    const targetDateStr = formatWIBDateIndo(date);

    return {
      dayName,
      labelBadge: 'Hari Ini',
      targetDateStr,
      reasonBadge: 'Jadwal Hari Ini',
      isTomorrow: false,
      isToday: true,
      isWeekend: false
    };
  }

  // 3. After 18:00 WIB on Friday (5) -> Next school day is Monday (+3 days)
  if (dayOfWeek === 5) {
    const targetDate = new Date(refNoonUTC);
    targetDate.setUTCDate(refNoonUTC.getUTCDate() + 3);
    const targetDateStr = formatWIBDateIndo(targetDate);

    return {
      dayName: 'Senin' as const,
      labelBadge: 'Senin Depan',
      targetDateStr,
      reasonBadge: 'Persiapan Pekan Depan',
      isTomorrow: false,
      isToday: false,
      isWeekend: false
    };
  }

  // 4. Monday - Thursday after 18:00 WIB -> Tomorrow (+1 day)
  const nextDayMap: Record<number, 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat'> = {
    1: 'Selasa',
    2: 'Rabu',
    3: 'Kamis',
    4: 'Jumat'
  };
  const targetDate = new Date(refNoonUTC);
  targetDate.setUTCDate(refNoonUTC.getUTCDate() + 1);
  const targetDateStr = formatWIBDateIndo(targetDate);
  const dayName = nextDayMap[dayOfWeek] || 'Senin';

  return {
    dayName,
    labelBadge: `Besok (${dayName})`,
    targetDateStr,
    reasonBadge: 'Persiapan Belajar Besok',
    isTomorrow: true,
    isToday: false,
    isWeekend: false
  };
}
