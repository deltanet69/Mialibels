import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { hash } from 'bcryptjs';

// Random password generator (8 characters)
const generateRandomPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars like I, 1, O, 0
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('admin_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetClass } = await request.json();

    if (!targetClass) {
      return NextResponse.json({ error: 'Target kelas tidak disertakan' }, { status: 400 });
    }

    let query = supabase.from('students').select('id, name, nisn, student_number, parent_name, parent_phone, class');
    
    if (targetClass !== 'all') {
      query = query.eq('class', targetClass);
    }

    const { data: students, error: fetchError } = await query;

    if (fetchError || !students || students.length === 0) {
      return NextResponse.json({ error: 'Tidak ada data siswa ditemukan untuk kelas ini.' }, { status: 404 });
    }

    const generatedData = [];
    const updates = [];

    // Pre-generate passwords and prepare promises
    for (const student of students) {
      const plainPassword = generateRandomPassword();
      const hashedPassword = await hash(plainPassword, 10);

      // Add to data that will be returned to client
      generatedData.push({
        name: student.name,
        nisn: student.nisn || student.student_number || '-',
        password: plainPassword,
        parent_name: student.parent_name || '-',
        parent_phone: student.parent_phone || '-',
        class: student.class || '-'
      });

      // Prepare update promise
      updates.push(
        supabase
          .from('students')
          .update({ parent_password: hashedPassword, updated_at: new Date().toISOString() })
          .eq('id', student.id)
      );
    }

    // Execute all updates in parallel (chunked if too large, but typically a class is ~30-40 students)
    // To be safe, let's chunk them by 50
    const chunkSize = 50;
    for (let i = 0; i < updates.length; i += chunkSize) {
      const chunk = updates.slice(i, i + chunkSize);
      await Promise.all(chunk);
    }

    return NextResponse.json({ success: true, data: generatedData });
  } catch (error: any) {
    console.error('Error generating parent access:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan internal pada server.' }, { status: 500 });
  }
}
