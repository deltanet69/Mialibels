import React from 'react';
import { 
  UserCircle, 
  Wallet, 
  CalendarCheck, 
  CreditCard,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Clock as ClockIcon
} from 'lucide-react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { createClient } from '@supabase/supabase-js';

const JWT_SECRET = process.env.JWT_SECRET!;

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

// Resolve the actual student UUID from JWT payload — handles stale tokens by falling back to NIS/NISN
async function resolveStudentId(payload: any): Promise<string | null> {
  const tokenId = payload.sub as string;
  const tokenNis = payload.nis as string | undefined;
  const tokenNisn = payload.nisn as string | undefined;

  const supabase = getAdminSupabase();

  // 1. Try by UUID (fastest path)
  const { data: byId } = await supabase
    .from('students')
    .select('id')
    .eq('id', tokenId)
    .maybeSingle();
  if (byId) return byId.id;

  // 2. Fallback: student_number (NIS internal)
  if (tokenNis) {
    const { data: byNis } = await supabase
      .from('students')
      .select('id')
      .eq('student_number', tokenNis)
      .maybeSingle();
    if (byNis) return byNis.id;
  }

  // 3. Fallback: nisn (NISN national)
  if (tokenNisn) {
    const { data: byNisn } = await supabase
      .from('students')
      .select('id')
      .eq('nisn', tokenNisn)
      .maybeSingle();
    if (byNisn) return byNisn.id;
  }

  return null;
}

async function getDashboardData(studentId: string) {
  const supabase = getAdminSupabase();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
  const endOfMonth = new Date(year, month, 0).toISOString().split('T')[0];

  const { data: attendance } = await supabase
    .from('classroom_attendances')
    .select('id, date, status, reason')
    .eq('student_id', studentId)
    .gte('date', startOfMonth)
    .lte('date', endOfMonth)
    .order('date', { ascending: false });

  const { data: recentAttendance } = await supabase
    .from('classroom_attendances')
    .select('id, date, status, reason')
    .eq('student_id', studentId)
    .order('date', { ascending: false })
    .limit(5);

  const { data: savings } = await supabase
    .from('tabungan_siswa')
    .select('balance')
    .eq('student_id', studentId)
    .maybeSingle();

  const { data: sppInvoices } = await supabase
    .from('spp_invoices')
    .select('id, title, month, year, amount, paid_amount, status, due_date')
    .eq('student_id', studentId)
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .limit(3);

  const { data: generalInvoices } = await supabase
    .from('general_invoices')
    .select('id, title, total_amount, paid_amount, status, due_date')
    .eq('student_id', studentId)
    .in('status', ['UNPAID', 'PARTIAL', 'PENDING_VERIFICATION'])
    .order('created_at', { ascending: false })
    .limit(3);

  const attendanceSummary = { hadir: 0, sakit: 0, izin: 0, alpha: 0, total: attendance?.length || 0 };
  attendance?.forEach((r: any) => {
    const s = (r.status || '').toLowerCase();
    if (s === 'hadir' || s === 'present') attendanceSummary.hadir++;
    else if (s === 'sakit' || s === 'sick') attendanceSummary.sakit++;
    else if (s === 'izin' || s === 'permitted') attendanceSummary.izin++;
    else if (attendanceSummary.total > 0) attendanceSummary.alpha++;
  });

  const persentaseHadir = attendanceSummary.total > 0
    ? Math.round((attendanceSummary.hadir / attendanceSummary.total) * 100)
    : 0;

  const pendingSPP = sppInvoices?.find(
    (s: any) => s.status === 'UNPAID' || s.status === 'LATE' || s.status === 'PARTIAL'
  ) || null;

  return {
    attendance: attendanceSummary,
    persentaseHadir,
    recentAttendance: recentAttendance || [],
    balance: savings?.balance || 0,
    sppInvoices: sppInvoices || [],
    pendingSPP,
    generalInvoices: generalInvoices || [],
  };
}

export default async function ParentDashboardHome() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('parent_session')?.value;
  
  let studentData = {
    name: 'Siswa',
    className: '-',
    parentName: 'Wali Murid',
    nis: '',
    studentId: '',
  };

  let dashboardData = {
    attendance: { hadir: 0, sakit: 0, izin: 0, alpha: 0, total: 0 },
    persentaseHadir: 0,
    recentAttendance: [] as any[],
    balance: 0,
    sppInvoices: [] as any[],
    pendingSPP: null as any,
    generalInvoices: [] as any[],
  };

  if (sessionCookie) {
    try {
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jwtVerify(sessionCookie, secret);
      studentData = {
        name: (payload.studentName as string) || 'Siswa',
        className: (payload.class as string) || '-',
        parentName: (payload.parentName as string) || 'Wali Murid',
        nis: (payload.nis as string) || '',
        studentId: payload.sub as string,
      };
      // Resolve actual student ID (handles stale tokens)
      const resolvedId = await resolveStudentId(payload);
      if (resolvedId) {
        studentData.studentId = resolvedId;
        dashboardData = await getDashboardData(resolvedId);
      }
    } catch (e) {
      // Silent fail — token might be invalid/expired
    }
  }

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

  const getStatusInfo = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'hadir' || s === 'present') return { label: 'Hadir', color: 'bg-emerald-500', textColor: 'text-emerald-700' };
    if (s === 'sakit' || s === 'sick') return { label: 'Sakit', color: 'bg-amber-400', textColor: 'text-amber-700' };
    if (s === 'izin' || s === 'permitted') return { label: 'Izin', color: 'bg-blue-400', textColor: 'text-blue-700' };
    return { label: 'Alpha', color: 'bg-red-500', textColor: 'text-red-700' };
  };

  const getSPPStatusInfo = (status: string) => {
    if (status === 'PAID') return { label: 'Lunas', color: 'text-emerald-600 bg-emerald-50', icon: CheckCircle2 };
    if (status === 'UNPAID') return { label: 'Belum Bayar', color: 'text-red-600 bg-red-50', icon: AlertTriangle };
    if (status === 'LATE') return { label: 'Terlambat', color: 'text-red-700 bg-red-100', icon: AlertCircle };
    if (status === 'PENDING_VERIFICATION') return { label: 'Verifikasi', color: 'text-blue-600 bg-blue-50', icon: ClockIcon };
    if (status === 'PARTIAL') return { label: 'Cicilan', color: 'text-amber-600 bg-amber-50', icon: AlertTriangle };
    return { label: status, color: 'text-slate-600 bg-slate-50', icon: AlertCircle };
  };

  // Simple date format for current date to match admin real-time clock style (static version for SSR)
  const today = new Date();
  const dateString = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(today);

  return (
    <div className="space-y-6 w-full pb-10">
      {/* Welcome Message */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2 font-sans">
          Halo, {studentData.parentName} <span className="text-2xl"></span>
        </h1>
        <p className="text-slate-500 mt-1">
          Selamat datang di Portal Wali Murid MI Attaqwa 15.
        </p>
      </div>

      {/* Top Stats Row (Match Admin DashboardCards structure) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Realtime/Hero Card - Gradient matching Admin */}
        <div className="lg:col-span-2 bg-gradient-to-r from-blue-500 to-cyan-400 p-6 rounded-2xl shadow-lg shadow-blue-500/20 relative overflow-hidden flex flex-col justify-between min-h-[160px] border border-blue-400/30">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none mix-blend-overlay"></div>
          <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-white/10 rounded-full blur-2xl -mb-20 pointer-events-none mix-blend-overlay"></div>
          
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 h-full">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-blue-100 mb-2">
                <UserCircle size={16} />
                <span className="text-sm font-medium tracking-wider opacity-90">PROFIL SISWA</span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1 font-sans">
                {studentData.name}
              </div>
              <div className="text-blue-100 text-sm flex items-center gap-1.5 opacity-90">
                Kelas {studentData.className} · NISN {studentData.nis}
              </div>
            </div>

            <div className="hidden sm:block w-px h-full bg-white/20"></div>

            <div className="flex-1 w-full flex flex-col gap-4">
              <div>
                <div className="flex justify-between items-end mb-1.5">
                  <span className="text-xs font-medium text-blue-100">Kehadiran Bulan Ini</span>
                  <span className="text-xs font-bold text-white">{dashboardData.persentaseHadir}%</span>
                </div>
                <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden shadow-inner">
                  <div className="bg-teal-400 h-2 rounded-full shadow-[0_0_10px_rgba(45,212,191,0.6)]" style={{ width: `${dashboardData.persentaseHadir}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabungan Card */}
        <Link href="/parent/dashboard/savings" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:border-blue-300 transition-colors group">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-slate-500 text-sm font-medium mb-1 font-sans">Total Tabungan</h3>
              <p className="text-2xl font-bold text-slate-800 font-sans">{formatCurrency(dashboardData.balance)}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100 group-hover:bg-blue-100 transition-colors">
              <Wallet size={24} />
            </div>
          </div>
          <div className="flex gap-4 border-t border-slate-50 pt-4">
            <span className="text-md font-semibold text-blue-600 flex items-center gap-1">Lihat Riwayat &rarr;</span>
          </div>
        </Link>

        {/* SPP Card */}
        <Link href="/parent/dashboard/spp" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:border-amber-300 transition-colors group">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-slate-500 text-sm font-medium mb-1 font-sans">Status SPP</h3>
              {dashboardData.pendingSPP ? (
                <div>
                  <p className="text-xl font-bold text-red-600 font-sans">Ada Tagihan</p>
                  <p className="text-xs text-slate-500 mt-1 truncate max-w-[120px]">{dashboardData.pendingSPP.title}</p>
                </div>
              ) : (
                <p className="text-xl font-bold text-emerald-600 font-sans">Lunas Semua</p>
              )}
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm border border-amber-100 group-hover:bg-amber-100 transition-colors">
              <CreditCard size={24} />
            </div>
          </div>
          <div className="flex gap-4 border-t border-slate-50 pt-4">
            <span className="text-md font-semibold text-amber-600 flex items-center gap-1">Buka Pembayaran &rarr;</span>
          </div>
        </Link>

        {/* Tagihan Umum Card */}
        <Link href="/parent/dashboard/general" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:border-purple-300 transition-colors group">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-slate-500 text-sm font-medium mb-1 font-sans">Tagihan Umum</h3>
              {dashboardData.generalInvoices.length > 0 ? (
                <div>
                  <p className="text-xl font-bold text-red-600 font-sans">Ada Tagihan</p>
                  <p className="text-xs text-slate-500 mt-1 truncate max-w-[120px]">{dashboardData.generalInvoices[0].title}</p>
                </div>
              ) : (
                <p className="text-xl font-bold text-emerald-600 font-sans">Lunas Semua</p>
              )}
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 shadow-sm border border-purple-100 group-hover:bg-purple-100 transition-colors">
              <CreditCard size={24} />
            </div>
          </div>
          <div className="flex gap-4 border-t border-slate-50 pt-4">
            <span className="text-md font-semibold text-purple-600 flex items-center gap-1">Lihat Tagihan &rarr;</span>
          </div>
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 mt-6">
        
        {/* Kehadiran Terkini */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-slate-800 font-sans">Kehadiran Terkini</h3>
            <Link href="/parent/dashboard/attendance" className="text-md font-bold text-blue-600 hover:text-blue-700">Detail &rarr;</Link>
          </div>
          <div className="space-y-4">
            {dashboardData.recentAttendance.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-md">
                Belum ada data kehadiran
              </div>
            ) : (
              dashboardData.recentAttendance.map((record: any) => {
                const statusInfo = getStatusInfo(record.status);
                return (
                  <div key={record.id} className="flex items-start gap-4 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                    <div className={`w-3 h-3 mt-1.5 rounded-full ${statusInfo.color} shrink-0 shadow-sm`}></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-slate-800 text-sm">{statusInfo.label}</p>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${statusInfo.textColor} bg-opacity-10`}>
                          {new Date(record.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      {record.reason && (
                        <p className="text-sm text-slate-500 mt-1 italic">Keterangan: {record.reason}</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Tagihan Terbaru */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-slate-800 font-sans">Tagihan Terbaru</h3>
            <Link href="/parent/dashboard/spp" className="text-md font-bold text-blue-600 hover:text-blue-700">Selengkapnya &rarr;</Link>
          </div>
          <div className="space-y-3">
            {dashboardData.sppInvoices.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Belum ada tagihan SPP</p>
            ) : (
              dashboardData.sppInvoices.slice(0, 4).map((inv: any) => {
                const sppInfo = getSPPStatusInfo(inv.status);
                const SppIcon = sppInfo.icon;
                return (
                  <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{inv.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Bulan {String(inv.month).padStart(2,'0')}/{inv.year} · <strong>{formatCurrency(inv.amount)}</strong></p>
                    </div>
                    <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${sppInfo.color}`}>
                      <SppIcon size={12} />
                      <span className="hidden sm:inline">{sppInfo.label}</span>
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
