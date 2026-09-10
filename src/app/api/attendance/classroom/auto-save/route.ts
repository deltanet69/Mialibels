import { NextRequest, NextResponse } from 'next/server'
import { supabase, withTimeout } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      classroomId, 
      date, 
      studentId, 
      status, 
      reason, 
      entry_time, 
      exit_time, 
      action,
      studentIds 
    } = body

    if (!classroomId || !date) {
      return NextResponse.json({ error: 'Missing classroomId or date' }, { status: 400 })
    }

    // ── Bulk Reset / Soft Delete seluruh presensi kelas pada tanggal tertentu ──
    if (action === 'bulk-reset') {
      // 1. Delete all classroom_attendances for this class & date
      await withTimeout(
        supabase
          .from('classroom_attendances')
          .delete()
          .eq('classroom_id', classroomId)
          .eq('date', date),
        5000,
        'Bulk reset absensi kelas timeout (5s)'
      )

      // 2. Delete corresponding student_attendances
      const targetIds = Array.isArray(studentIds) && studentIds.length > 0 ? studentIds : null
      if (targetIds) {
        await withTimeout(
          supabase
            .from('student_attendances')
            .delete()
            .in('student_id', targetIds)
            .eq('date', date),
          5000,
          'Bulk reset student_attendances timeout (5s)'
        )
      } else {
        // Fetch all students in classroom to delete their RFID attendances for today
        const { data: classStudents } = await withTimeout(
          supabase
            .from('students')
            .select('id')
            .eq('class_id', classroomId),
          5000,
          'Query siswa kelas timeout (5s)'
        )

        if (classStudents && classStudents.length > 0) {
          const ids = classStudents.map((s: any) => s.id)
          await withTimeout(
            supabase
              .from('student_attendances')
              .delete()
              .in('student_id', ids)
              .eq('date', date),
            5000,
            'Bulk reset student_attendances timeout (5s)'
          )
        }
      }

      return NextResponse.json({ success: true, message: 'Seluruh presensi berhasil direset' })
    }

    if (!studentId) {
      return NextResponse.json({ error: 'Missing studentId' }, { status: 400 })
    }

    // ── Reset / Soft Delete single student attendance ─────────────────────────
    const isReset = !status || action === 'delete' || action === 'reset'

    if (isReset) {
      // 1. Delete from classroom_attendances
      await withTimeout(
        supabase
          .from('classroom_attendances')
          .delete()
          .eq('classroom_id', classroomId)
          .eq('student_id', studentId)
          .eq('date', date),
        5000,
        'Reset classroom_attendances timeout (5s)'
      )

      // 2. Delete from student_attendances (clears RFID scan record as well)
      await withTimeout(
        supabase
          .from('student_attendances')
          .delete()
          .eq('student_id', studentId)
          .eq('date', date),
        5000,
        'Reset student_attendances timeout (5s)'
      )

      return NextResponse.json({ success: true, message: 'Presensi siswa berhasil direset' })
    }

    // ── Update / Insert Attendance (Hadir, Izin, Sakit, Alpha) ────────────────
    const cleanReason = reason || ''

    // 1. Handle classroom_attendances
    const { data: existingClassroom } = await withTimeout(
      supabase
        .from('classroom_attendances')
        .select('id')
        .eq('classroom_id', classroomId)
        .eq('student_id', studentId)
        .eq('date', date)
        .maybeSingle(),
      5000,
      'Cek existing classroom attendance timeout (5s)'
    )

    if (existingClassroom) {
      const { error: errUpdate } = await withTimeout(
        supabase
          .from('classroom_attendances')
          .update({ status, reason: cleanReason } as never)
          .eq('id', (existingClassroom as any).id),
        5000,
        'Update classroom_attendances timeout (5s)'
      )
      if (errUpdate) throw errUpdate
    } else {
      const { error: errInsert } = await withTimeout(
        supabase
          .from('classroom_attendances')
          .insert({
            classroom_id: classroomId,
            student_id: studentId,
            date,
            status,
            reason: cleanReason
          } as any),
        5000,
        'Insert classroom_attendances timeout (5s)'
      )
      if (errInsert) throw errInsert
    }

    // 2. Sync to student_attendances so RFID scanner and mobile apps match
    const { data: existingRfid } = await withTimeout(
      supabase
        .from('student_attendances')
        .select('id, entry_time, exit_time')
        .eq('student_id', studentId)
        .eq('date', date)
        .maybeSingle(),
      5000,
      'Cek existing student_attendances timeout (5s)'
    )

    if (existingRfid) {
      const updatePayload: Record<string, any> = {
        status: status,
        updated_at: new Date().toISOString()
      }
      if (entry_time !== undefined) updatePayload.entry_time = entry_time
      if (exit_time !== undefined) updatePayload.exit_time = exit_time
      if (cleanReason) updatePayload.notes = cleanReason

      await withTimeout(
        supabase
          .from('student_attendances')
          .update(updatePayload as never)
          .eq('id', (existingRfid as any).id),
        5000,
        'Update student_attendances timeout (5s)'
      )
    } else {
      const newEntryTime = entry_time !== undefined ? entry_time : (status === 'Hadir' ? new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':') : null)
      
      await withTimeout(
        supabase
          .from('student_attendances')
          .insert({
            student_id: studentId,
            date,
            status,
            entry_time: newEntryTime,
            exit_time: exit_time || null,
            notes: cleanReason || 'Manual presensi guru'
          } as any),
        5000,
        'Insert student_attendances timeout (5s)'
      )
    }

    return NextResponse.json({ success: true, message: 'Presensi berhasil disimpan' })
  } catch (error: any) {
    console.error('Auto-save attendance error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan internal pada server: ' + (error?.message || '') }, { status: 500 })
  }
}

