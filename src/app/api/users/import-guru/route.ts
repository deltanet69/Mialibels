import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSession } from '@/lib/session';
import { hash } from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    // Only superadmin can import users
    if (!session || session.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden. Only Superadmin can import users.' }, { status: 403 });
    }

    const body = await request.json();
    const { guruIds } = body;

    if (!guruIds || !Array.isArray(guruIds) || guruIds.length === 0) {
      return NextResponse.json({ error: 'Pilih minimal satu guru untuk di-import.' }, { status: 400 });
    }

    // 1. Fetch guru data from 'staffs' table
    const { data: gurus, error: guruError } = await supabase
      .from('staffs')
      .select('id, name, email')
      .in('id', guruIds);

    if (guruError) {
      throw new Error(`Gagal mengambil data guru: ${guruError.message}`);
    }
    
    if (!gurus || gurus.length === 0) {
      return NextResponse.json({ error: 'Data guru tidak ditemukan.' }, { status: 404 });
    }

    // 2. Fetch existing emails from 'admins' table
    const emailsToCheck = gurus.map(g => g.email?.toLowerCase().trim()).filter(Boolean);
    const { data: existingAdmins, error: existError } = await supabase
      .from('admins')
      .select('email')
      .in('email', emailsToCheck);

    if (existError) {
      throw new Error(`Gagal mengecek email admin: ${existError.message}`);
    }

    const existingEmails = new Set(existingAdmins?.map(a => a.email) || []);

    // 3. Prepare data to insert
    const defaultPassword = 'Guru_MI15';
    const hashedPassword = await hash(defaultPassword, 10);
    
    const usersToInsert = [];
    const skippedGurus = [];

    for (const guru of gurus) {
      const email = guru.email?.toLowerCase().trim();
      if (!email) {
        skippedGurus.push({ name: guru.name, reason: 'Tidak memiliki email' });
        continue;
      }
      
      if (existingEmails.has(email)) {
        skippedGurus.push({ name: guru.name, reason: 'Email sudah terdaftar di sistem' });
        continue;
      }
      
      usersToInsert.push({
        name: guru.name,
        email: email,
        password: hashedPassword,
        role: 'guru',
        is_active: true,
      });
      // Mark as existing so we don't insert duplicates if gurus list has duplicates
      existingEmails.add(email);
    }

    let insertedCount = 0;
    if (usersToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('admins')
        .insert(usersToInsert);

      if (insertError) {
        throw new Error(`Gagal menyimpan user: ${insertError.message}`);
      }
      insertedCount = usersToInsert.length;
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil meng-import ${insertedCount} guru. ${skippedGurus.length} dilewati.`,
      data: {
        inserted: insertedCount,
        skipped: skippedGurus
      }
    });

  } catch (error: any) {
    console.error('Error importing guru:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan internal pada server.' }, { status: 500 });
  }
}

