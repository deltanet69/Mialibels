import React from 'react';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { createClient } from '@supabase/supabase-js';
import { ParentDashboardClient } from '@/components/parent/ParentDashboardClient';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET!;

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

// Resolve the actual student UUID and classroom details from JWT payload
async function resolveStudent(payload: any) {
  const tokenId = payload.sub as string;
  const tokenNis = payload.nis as string | undefined;
  const tokenNisn = payload.nisn as string | undefined;

  const supabase = getAdminSupabase();

  let studentData: any = null;

  // 1. Try by UUID (fastest path)
  if (tokenId) {
    const { data } = await supabase
      .from('students')
      .select('id, name, student_number, nisn, class, class_id, image, parent_name, parent_phone, address, fee_waiver_type')
      .eq('id', tokenId)
      .maybeSingle();
    studentData = data;
  }

  // 2. Fallback: student_number (NIS)
  if (!studentData && tokenNis) {
    const { data } = await supabase
      .from('students')
      .select('id, name, student_number, nisn, class, class_id, image, parent_name, parent_phone, address, fee_waiver_type')
      .ilike('student_number', tokenNis.trim())
      .maybeSingle();
    studentData = data;
  }

  // 3. Fallback: nisn (NISN)
  if (!studentData && tokenNisn) {
    const { data } = await supabase
      .from('students')
      .select('id, name, student_number, nisn, class, class_id, image, parent_name, parent_phone, address, fee_waiver_type')
      .eq('nisn', tokenNisn.trim())
      .maybeSingle();
    studentData = data;
  }

  if (!studentData) return null;


  // Resolve classroom and homeroom teacher accurately
  let classroom: any = null;
  if (studentData.class_id) {
    const { data: cls } = await supabase
      .from('classrooms')
      .select('id, name, homeroom_teacher_id, homeroom_teacher:staffs!homeroom_teacher_id(id, name, position, phone, image)')
      .eq('id', studentData.class_id)
      .maybeSingle();
    classroom = cls;
  }

  if (!classroom && studentData.class) {
    const { data: cls } = await supabase
      .from('classrooms')
      .select('id, name, homeroom_teacher_id, homeroom_teacher:staffs!homeroom_teacher_id(id, name, position, phone, image)')
      .eq('name', studentData.class)
      .maybeSingle();
    classroom = cls;
  }

  return {
    ...studentData,
    classroom
  };
}

async function getDashboardData(studentId: string, feeWaiverType?: string | null) {
  const supabase = getAdminSupabase();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
  const endOfMonth = new Date(year, month, 0).toISOString().split('T')[0];
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

  // Calculate Monday to Friday of current week
  const curr = new Date();
  const day = curr.getDay(); // 0=Sun, 1=Mon...
  const diffToMon = curr.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(curr);
  monday.setDate(diffToMon);

  const weekDayDates: { dayName: string; dateStr: string; dayNumber: number; isToday: boolean }[] = [];
  const DAY_NAMES = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dStr = d.toISOString().split('T')[0];
    weekDayDates.push({
      dayName: DAY_NAMES[i],
      dateStr: dStr,
      dayNumber: d.getDate(),
      isToday: dStr === todayStr
    });
  }

  const mondayStr = weekDayDates[0].dateStr;
  const fridayStr = weekDayDates[4].dateStr;

  const [
    { data: classroomAttMonth },
    { data: rfidAttMonth },
    { data: classroomAttRecent },
    { data: rfidAttRecent },
    { data: classroomAttWeek },
    { data: rfidAttWeek },
    { data: savings },
    { data: savingsTransactions },
    { data: sppInvoices },
    { data: generalInvoices }
  ] = await Promise.all([
    supabase
      .from('classroom_attendances')
      .select('id, date, status, reason')
      .eq('student_id', studentId)
      .gte('date', startOfMonth)
      .lte('date', endOfMonth)
      .order('date', { ascending: false }),
    supabase
      .from('student_attendances')
      .select('id, date, status, entry_time, exit_time')
      .eq('student_id', studentId)
      .gte('date', startOfMonth)
      .lte('date', endOfMonth)
      .order('date', { ascending: false }),
    supabase
      .from('classroom_attendances')
      .select('id, date, status, reason')
      .eq('student_id', studentId)
      .order('date', { ascending: false })
      .limit(5),
    supabase
      .from('student_attendances')
      .select('id, date, status, entry_time, exit_time')
      .eq('student_id', studentId)
      .order('date', { ascending: false })
      .limit(5),
    supabase
      .from('classroom_attendances')
      .select('id, date, status, reason')
      .eq('student_id', studentId)
      .gte('date', mondayStr)
      .lte('date', fridayStr),
    supabase
      .from('student_attendances')
      .select('id, date, status, entry_time, exit_time')
      .eq('student_id', studentId)
      .gte('date', mondayStr)
      .lte('date', fridayStr),
    supabase
      .from('tabungan_siswa')
      .select('balance')
      .eq('student_id', studentId)
      .maybeSingle(),
    supabase
      .from('tabungan_transaksi')
      .select('id, type, amount, balance_after, description, created_at')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('spp_invoices')
      .select('id, title, month, year, amount, paid_amount, status, due_date')
      .eq('student_id', studentId)
      .order('year', { ascending: true })
      .order('month', { ascending: true }),
    supabase
      .from('general_invoices')
      .select('id, title, items, total_amount, paid_amount, status, due_date, created_at')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
  ]);

  // Merge monthly attendance records
  const dateMap: Record<string, any> = {};
  (rfidAttMonth || []).forEach((r: any) => {
    dateMap[r.date] = { date: r.date, status: r.status || 'Hadir', entry_time: r.entry_time, exit_time: r.exit_time, reason: '' };
  });
  (classroomAttMonth || []).forEach((c: any) => {
    if (dateMap[c.date]) {
      dateMap[c.date].status = c.status || dateMap[c.date].status;
      dateMap[c.date].reason = c.reason || '';
    } else {
      dateMap[c.date] = { date: c.date, status: c.status, reason: c.reason || '', entry_time: null, exit_time: null };
    }
  });
  const attendance = Object.values(dateMap);

  // Merge recent attendance records (5 latest)
  const recentDateMap: Record<string, any> = {};
  (rfidAttRecent || []).forEach((r: any) => {
    recentDateMap[r.date] = { id: r.id, date: r.date, status: r.status || 'Hadir', reason: r.entry_time ? `Scan ${r.entry_time}` : '' };
  });
  (classroomAttRecent || []).forEach((c: any) => {
    if (recentDateMap[c.date]) {
      recentDateMap[c.date].status = c.status || recentDateMap[c.date].status;
      recentDateMap[c.date].reason = c.reason || recentDateMap[c.date].reason;
    } else {
      recentDateMap[c.date] = { id: c.id, date: c.date, status: c.status, reason: c.reason || '' };
    }
  });
  const recentAttendance = Object.values(recentDateMap).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  // Attendance summary for month
  const attendanceSummary = { hadir: 0, sakit: 0, izin: 0, alpha: 0, total: attendance.length };
  attendance.forEach((r: any) => {
    const s = (r.status || '').toLowerCase();
    if (s === 'hadir' || s === 'present' || s === 'tepat waktu' || s === 'terlambat') attendanceSummary.hadir++;
    else if (s === 'sakit' || s === 'sick') attendanceSummary.sakit++;
    else if (s === 'izin' || s === 'permitted') attendanceSummary.izin++;
    else if (attendanceSummary.total > 0) attendanceSummary.alpha++;
  });

  const persentaseHadir = attendanceSummary.total > 0
    ? Math.round((attendanceSummary.hadir / attendanceSummary.total) * 100)
    : 100;

  // Build week days array with merged RFID + manual status
  const weekDays = weekDayDates.map(wd => {
    const rMatch = rfidAttWeek?.find((r: any) => r.date === wd.dateStr);
    const cMatch = classroomAttWeek?.find((c: any) => c.date === wd.dateStr);
    const status = cMatch?.status || rMatch?.status || null;
    const reason = cMatch?.reason || (rMatch?.entry_time ? `Scan ${rMatch.entry_time}` : undefined);
    return {
      ...wd,
      status,
      reason,
      entry_time: rMatch?.entry_time || null,
      exit_time: rMatch?.exit_time || null
    };
  });

  // Today attendance
  const todayAttendance = attendance.find((a: any) => a.date === todayStr) || null;

  // SPP calculations (chronological order)
  const allSpp = sppInvoices || [];
  const unpaidSpps = allSpp.filter(
    (s: any) => s.status === 'UNPAID' || s.status === 'LATE' || s.status === 'PARTIAL'
  );
  const paidSpps = allSpp.filter((s: any) => s.status === 'PAID');
  const pendingSPP = unpaidSpps.length > 0 ? unpaidSpps[0] : null;
  const totalUnpaidSPP = unpaidSpps.reduce((acc, cur: any) => acc + (cur.amount - (cur.paid_amount || 0)), 0);
  const lastPaidSpp = paidSpps.length > 0 ? paidSpps[paidSpps.length - 1] : null;

  // General Invoices calculations
  const allGeneral = generalInvoices || [];
  const unpaidGeneral = allGeneral.filter(
    (g: any) => g.status === 'UNPAID' || g.status === 'PARTIAL' || g.status === 'PENDING_VERIFICATION'
  );
  const totalGeneralAmount = allGeneral.reduce((acc, cur: any) => acc + (cur.total_amount || 0), 0);
  const totalGeneralPaid = allGeneral.reduce((acc, cur: any) => acc + (cur.paid_amount || 0), 0);
  const totalUnpaidGeneral = unpaidGeneral.reduce(
    (acc, cur: any) => acc + ((cur.total_amount || 0) - (cur.paid_amount || 0)), 0
  );

  // Check exam card requirements (SPP through September is paid, or fee exempt)
  const isExempt = (w?: string | null) => {
    if (!w) return false;
    const val = String(w).toLowerCase().trim();
    return val === 'anak_yatim' || val.includes('yatim') || val.includes('guru');
  };
  const exemptInfaqAndBuku = isExempt(feeWaiverType);

  const targetMonths = ['Juli', 'Agustus', 'September', '7', '8', '9', 7, 8, 9];
  const unpaidSeptemberSpp = allSpp.find(inv => {
    const isTarget = targetMonths.includes(String(inv.month));
    const isPaid = inv.status === 'PAID';
    return isTarget && !isPaid;
  });
  const sppSeptemberPaid = exemptInfaqAndBuku || !unpaidSeptemberSpp;

  return {
    attendance: attendanceSummary,
    persentaseHadir,
    recentAttendance: recentAttendance || [],
    weekDays,
    todayAttendance,
    balance: savings?.balance || 0,
    recentSavingsTransactions: (savingsTransactions || []) as any[],
    sppInvoices: unpaidSpps.length > 0 ? unpaidSpps.slice(0, 4) : allSpp.slice(0, 4),
    allSppInvoices: allSpp,
    pendingSPP,
    totalUnpaidSPP,
    unpaidSppCount: unpaidSpps.length,
    paidSppCount: paidSpps.length,
    lastPaidSppTitle: lastPaidSpp?.title || null,
    generalInvoices: allGeneral.slice(0, 5),
    totalGeneralAmount,
    totalGeneralPaid,
    totalUnpaidGeneral,
    isExamCardReady: sppSeptemberPaid,
    examCardRequirements: {
      sppSeptemberPaid,
      ulumFiftyPercent: true,
      lksMinimumPaid: true
    }
  };
}

export default async function ParentDashboardHome() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('parent_session')?.value;

  let studentObj: any = null;

  if (sessionCookie) {
    try {
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jwtVerify(sessionCookie, secret);
      studentObj = await resolveStudent(payload);
    } catch {
      // Fallback
    }
  }

  const student = {
    id: studentObj?.id || '',
    name: studentObj?.name || 'Siswa',
    className: studentObj?.classroom?.name || studentObj?.class || '-',
    nisn: studentObj?.nisn || '',
    studentNumber: studentObj?.student_number || '',
    parentName: studentObj?.parent_name || 'Wali Murid',
    parentPhone: studentObj?.parent_phone || '',
    image: studentObj?.image || undefined,
    address: studentObj?.address || undefined,
    feeWaiverType: studentObj?.fee_waiver_type || undefined,
    homeroomTeacher: studentObj?.classroom?.homeroom_teacher || null
  };

  const dashboardData = student.id
    ? await getDashboardData(student.id, student.feeWaiverType)
    : {
        attendance: { hadir: 0, sakit: 0, izin: 0, alpha: 0, total: 0 },
        persentaseHadir: 100,
        recentAttendance: [],
        weekDays: [],
        todayAttendance: null,
        balance: 0,
        recentSavingsTransactions: [],
        sppInvoices: [],
        allSppInvoices: [],
        pendingSPP: null,
        totalUnpaidSPP: 0,
        unpaidSppCount: 0,
        paidSppCount: 0,
        lastPaidSppTitle: null,
        generalInvoices: [],
        totalGeneralAmount: 0,
        totalGeneralPaid: 0,
        totalUnpaidGeneral: 0,
        isExamCardReady: true,
        examCardRequirements: {
          sppSeptemberPaid: true,
          ulumFiftyPercent: true,
          lksMinimumPaid: true
        }
      };

  return (
    <ParentDashboardClient
      student={student}
      data={dashboardData}
    />
  );
}
