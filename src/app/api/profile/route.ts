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

    // If role is staff, try to find in staffs table by email
    if (adminRole === 'staff' || adminRole === 'guru') {
      const { data: staffDataRaw, error: staffError } = await supabase
        .from('staffs')
        .select('id, name, position, image, phone')
        .eq('email', adminEmail)
        .single();
        
      const staffData = staffDataRaw as any;

      if (staffData && !staffError) {
        profileData.isStaff = true;
        profileData.staffDetail = staffData;
        profileData.image = staffData.image; // photo profile

        // Get classrooms assignment
        const { data: classrooms } = await supabase
          .from('classrooms')
          .select('id, name')
          .eq('homeroom_teacher_id', staffData.id);
        
        profileData.assigned_classrooms = classrooms || [];

        // Get staff attendance summary
        const { data: attendanceData } = await supabase
          .from('staff_attendance')
          .select('status')
          .eq('staff_id', staffData.id);

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
        }
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

    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const hashedPassword = await hash(password, 10);

    const { error } = await supabase
      .from('admins')
      .update({ password: hashedPassword } as never)
      .eq('id', adminId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Terjadi kesalahan internal pada server.' }, { status: 500 });
  }
}

