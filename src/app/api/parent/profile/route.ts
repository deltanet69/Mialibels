// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET!;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function PATCH(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('parent_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(sessionCookie, secret);
    const studentId = payload.sub as string;

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Password lama dan baru wajib diisi.' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password baru minimal 6 karakter.' }, { status: 400 });
    }

    // Fetch current password hash
    const { data: student, error: fetchErr } = await supabase
      .from('students')
      .select('id, parent_password')
      .eq('id', studentId)
      .single();

    if (fetchErr || !student) {
      return NextResponse.json({ error: 'Data siswa tidak ditemukan.' }, { status: 404 });
    }

    // Verify current password
    let isCurrentValid = false;
    if (student.parent_password) {
      isCurrentValid = await bcrypt.compare(currentPassword, student.parent_password);
    } else {
      // default password
      isCurrentValid = currentPassword === 'mialibels15';
    }

    if (!isCurrentValid) {
      return NextResponse.json({ error: 'Password lama tidak sesuai.' }, { status: 400 });
    }

    // Hash new password
    const hashedNew = await bcrypt.hash(newPassword, 12);

    const { error: updateErr } = await supabase
      .from('students')
      .update({ parent_password: hashedNew, updated_at: new Date().toISOString() })
      .eq('id', studentId);

    if (updateErr) throw updateErr;

    return NextResponse.json({ success: true, message: 'Password berhasil diubah.' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Terjadi kesalahan internal pada server.' }, { status: 500 });
  }
}

