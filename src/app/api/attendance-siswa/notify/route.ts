import { NextRequest, NextResponse } from 'next/server'
import { createNotification } from '@/lib/push'

// Lightweight endpoint for push notifications only.
// Called fire-and-forget from the client after direct Supabase scan.
export async function POST(request: NextRequest) {
  try {
    const { student_id, type, message } = await request.json()
    if (!student_id || !message) return NextResponse.json({ ok: true })

    const title = type === 'check-in' ? 'Info Kehadiran' : 'Info Kepulangan'
    createNotification(student_id, 'parent', 'ATTENDANCE', title, message, '/parent/dashboard/attendance', true).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
