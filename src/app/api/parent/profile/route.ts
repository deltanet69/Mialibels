// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import { jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { getJwtSecretKey } from '@/lib/jwt';

export async function PATCH(request: NextRequest) {
  try {
    const supabase = getAdminSupabase();
    const sessionCookie = request.cookies.get('parent_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = getJwtSecretKey();
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

export async function PUT(request: NextRequest) {
  try {
    const supabase = getAdminSupabase();
    const sessionCookie = request.cookies.get('parent_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = getJwtSecretKey();
    const { payload } = await jwtVerify(sessionCookie, secret);
    const studentId = payload.sub as string;

    const body = await request.json();
    
    // Allow updating gender, birth_place, birth_date, address, parent_phone, parent_email
    const updateData: any = {};
    if (body.gender !== undefined) {
      if (!['Laki-laki', 'Perempuan'].includes(body.gender)) {
        return NextResponse.json({ error: 'Jenis kelamin tidak valid.' }, { status: 400 });
      }
      updateData.gender = body.gender;
    }
    if (body.birth_place !== undefined) updateData.birth_place = String(body.birth_place).trim().slice(0, 100);
    if (body.birth_date !== undefined) {
      if (body.birth_date && isNaN(new Date(body.birth_date).getTime())) {
        return NextResponse.json({ error: 'Tanggal lahir tidak valid.' }, { status: 400 });
      }
      updateData.birth_date = body.birth_date || null;
    }
    if (body.address !== undefined) updateData.address = String(body.address).trim().slice(0, 500);
    if (body.parent_phone !== undefined) updateData.parent_phone = String(body.parent_phone).trim().slice(0, 20);
    if (body.parent_email !== undefined) updateData.parent_email = String(body.parent_email).trim().slice(0, 150) || null;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Tidak ada data untuk diupdate' }, { status: 400 });
    }

    updateData.updated_at = new Date().toISOString();

    const { error: updateErr } = await supabase
      .from('students')
      .update(updateData)
      .eq('id', studentId);

    if (updateErr) throw updateErr;

    return NextResponse.json({ success: true, message: 'Data berhasil diperbarui.' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Terjadi kesalahan internal pada server.' }, { status: 500 });
  }
}

