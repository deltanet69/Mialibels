// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET!;

/**
 * POST /api/students/reset-parent-passwords
 * Superadmin only. Resets ALL parent_password fields to NULL so that
 * the default login flow (via generate-parent-access CSV) is enforced again.
 * Any previously set custom passwords will no longer work.
 */
export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('admin_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify JWT and require superadmin role
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(sessionCookie, secret).catch(() => {
      return { payload: null };
    });

    if (!payload || payload.role !== 'superadmin') {
      return NextResponse.json({ error: 'Akses ditolak. Hanya Superadmin yang dapat mereset seluruh password orang tua.' }, { status: 403 });
    }

    // Nullify all parent_password — forces re-login via new generated password
    const { error, count } = await supabase
      .from('students')
      .update({ parent_password: null, updated_at: new Date().toISOString() })
      .neq('id', '00000000-0000-0000-0000-000000000000') // match all rows
      .select('id', { count: 'exact', head: true });

    if (error) throw error;

    return NextResponse.json({ success: true, message: `Seluruh password orang tua telah direset. Generate ulang akses orang tua untuk mendistribusikan password baru.` });
  } catch (error: any) {
    console.error('Error resetting parent passwords:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan internal: ' + error.message }, { status: 500 });
  }
}
