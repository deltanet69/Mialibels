import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { jwtVerify } from 'jose';
import { hash } from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('admin_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(sessionCookie, secret);

    // admin email and role from jwt
    const adminEmail = payload.email as string;
    const adminRole = payload.role as string;
    const adminId = payload.sub as string;

    // Fetch admin detail
    const { data: adminDataRaw, error: adminError } = await supabase
      .from('admins')
      .select('id, name, email, role, created_at')
      .eq('id', adminId)
      .single();

    const adminData = adminDataRaw as any;

    if (adminError || !adminData) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    let profileData: any = {
      id: adminData.id,
      name: adminData.name,
      email: adminData.email,
      role: adminData.role,
      created_at: adminData.created_at,
      isStaff: false,
    };

    // Case-insensitive role check
    const roleLower = (adminRole || '').toLowerCase();
    const isGuruOrStaff = roleLower === 'staff' || roleLower === 'guru' || roleLower.includes('guru');

    // If role is staff/guru, try to find in staffs table — triple fallback strategy
    if (isGuruOrStaff) {
      const staffId = payload.staffId as string | undefined;
      const adminName = adminData.name as string;

      let staffDataRaw: any = null;

      // Strategy 1: lookup by email (case-insensitive, take first match)
      const { data: byEmails } = await supabase
        .from('staffs')
        .select('id, name, position, image, phone, email, address, education_level, major, rfid, is_active, created_at')
        .ilike('email', adminEmail)
        .limit(1);

      if (byEmails && byEmails.length > 0) {
        staffDataRaw = byEmails[0];
      }

      // Strategy 2: fallback by staffId embedded in JWT (if available)
      if (!staffDataRaw && staffId) {
        const { data: byId } = await supabase
          .from('staffs')
          .select('id, name, position, image, phone, email, address, education_level, major, rfid, is_active, created_at')
          .eq('id', staffId)
          .maybeSingle();
        if (byId) staffDataRaw = byId;
      }

      // Strategy 3: fallback by admin name (case-insensitive, take first match)
      if (!staffDataRaw && adminName) {
        const { data: byNames } = await supabase
          .from('staffs')
          .select('id, name, position, image, phone, email, address, education_level, major, rfid, is_active, created_at')
          .ilike('name', adminName)
          .limit(1);
        if (byNames && byNames.length > 0) staffDataRaw = byNames[0];
      }

      const staffData = staffDataRaw as any;

      if (staffData) {
        profileData.isStaff = true;
        profileData.staffDetail = staffData;
        profileData.image = staffData.image; // photo profile

        // Get classrooms assignment (wali kelas)
        const { data: classrooms } = await supabase
          .from('classrooms')
          .select('id, name')
          .eq('homeroom_teacher_id', staffData.id);

        profileData.assigned_classrooms = classrooms || [];

        // Get staff attendance summary
        const { data: attendanceData } = await supabase
          .from('staff_attendance')
          .select('id, date, status, check_in_time, check_out_time, notes')
          .eq('staff_id', staffData.id)
          .order('date', { ascending: false });

        if (attendanceData) {
          const attendanceSummary = { hadir: 0, sakit: 0, izin: 0, alpha: 0 };
          (attendanceData as any[]).forEach((att: any) => {
            const status = (att.status || '').toLowerCase();
            if (status === 'hadir' || status === 'present') attendanceSummary.hadir++;
            else if (status === 'sakit' || status === 'sick') attendanceSummary.sakit++;
            else if (status === 'izin' || status === 'permitted') attendanceSummary.izin++;
            else attendanceSummary.alpha++;
          });
          profileData.attendance = attendanceSummary;
          // Recent attendance records (last 10 for catatan kehadiran)
          profileData.attendance_records = (attendanceData as any[]).slice(0, 10);
        }

        // Get teaching schedules (jadwal mengajar)
        const { data: scheduleData } = await supabase
          .from('classroom_schedules')
          .select('*, classroom:classrooms(name)')
          .eq('teacher_id', staffData.id)
          .order('time', { ascending: true });

        profileData.schedules = scheduleData || [];
      }
    }

    return NextResponse.json({ success: true, data: profileData });
  } catch (error: any) {
    return NextResponse.json({ error: 'Terjadi kesalahan internal pada server.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('admin_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(sessionCookie, secret);
    const adminId = payload.sub as string;
    const adminEmail = payload.email as string;
    const adminRole = payload.role as string;

    const body = await request.json();
    const { password, email } = body;

    if (!password && !email) {
      return NextResponse.json({ error: 'Password atau email harus diisi' }, { status: 400 });
    }

    const updatePayload: Record<string, any> = {};

    if (password) {
      if (password.length < 6) {
        return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 });
      }
      updatePayload.password = await hash(password, 10);
    }

    if (email) {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: 'Format email tidak valid' }, { status: 400 });
      }
      updatePayload.email = email;
    }

    const { error } = await supabase
      .from('admins')
      .update(updatePayload as never)
      .eq('id', adminId);

    if (error) {
      throw error;
    }

    // If this is a staff/guru user and email changed, also update in staffs table
    if (email && (adminRole === 'staff' || adminRole === 'guru' || adminRole?.includes('guru'))) {
      await supabase
        .from('staffs')
        .update({ email } as never)
        .eq('email', adminEmail);
    }

    return NextResponse.json({ success: true, message: 'Profil berhasil diperbarui' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Terjadi kesalahan internal pada server.' }, { status: 500 });
  }
}
