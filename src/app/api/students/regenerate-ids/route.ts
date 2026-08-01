// @ts-nocheck
/**
 * API Endpoint untuk migrasi ID Siswa ke format baru.
 * Format baru: {2-digit nomor kelas}{huruf kelas}{4-digit tahun}{3-digit nomor urut}
 * Contoh: Kelas 1A â†’ 01A2026001, Kelas 5B â†’ 05B2026024
 * 
 * PATCH /api/students/regenerate-ids
 * Akan me-regenerate student_number untuk SEMUA siswa sesuai format baru.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
)

/**
 * Fungsi utama pembentuk ID Siswa.
 * Input: rawClass = "Kelas 1A" | "1A" | "kelas 6B" | dll.
 * Output: classCode = "01A" | "06B" | dll.
 */
function parseClassCode(rawClass: string): string | null {
  if (!rawClass) return null
  // Buang prefix "Kelas" dan uppercase
  const clean = rawClass.replace(/^kelas\s*/i, '').trim().toUpperCase()
  // Regex: ambil angka di awal, lalu huruf (opsional) di akhir
  const match = clean.match(/^(\d+)([A-Z]?)$/)
  if (!match) return null
  const num = match[1].padStart(2, '0')  // "1" â†’ "01", "6" â†’ "06"
  const letter = match[2] || ''           // "A", "B", etc.
  return `${num}${letter}`                // "01A", "06B"
}

export async function PATCH(request: NextRequest) {
  try {
    // Ambil semua siswa
    const { data: allStudents, error: fetchError } = await supabase
      .from('students')
      .select('id, class, student_number')
      .order('created_at', { ascending: true })

    if (fetchError) throw fetchError
    if (!allStudents || allStudents.length === 0) {
      return NextResponse.json({ success: true, message: 'Tidak ada siswa untuk diperbarui.', updated: 0 })
    }

    const year = new Date().getFullYear().toString() // e.g. "2026"

    // Kelompokkan siswa per kelas, urut sesuai order DB (ascending created_at)
    const groupedByClass: Record<string, Array<{ id: string; class: string }>> = {}
    for (const s of allStudents) {
      const classCode = parseClassCode(s.class)
      if (!classCode) continue
      const key = `${classCode}${year}`
      if (!groupedByClass[key]) groupedByClass[key] = []
      groupedByClass[key].push(s)
    }

    // Generate ID baru per grup kelas
    const updates: Array<{ id: string; student_number: string }> = []
    for (const [prefix, students] of Object.entries(groupedByClass)) {
      students.forEach((s, idx) => {
        const seq = (idx + 1).toString().padStart(3, '0') // "001", "002", ...
        updates.push({ id: s.id, student_number: `${prefix}${seq}` })
      })
    }

    // Update satu per satu (Supabase tidak mendukung bulk UPDATE dengan nilai berbeda per baris)
    let updatedCount = 0
    const errors: string[] = []

    for (const upd of updates) {
      const { error } = await supabase
        .from('students')
        .update({ student_number: upd.student_number })
        .eq('id', upd.id)
      
      if (error) {
        errors.push(`${upd.id}: ${error.message}`)
      } else {
        updatedCount++
      }
    }

    return NextResponse.json({
      success: true,
      total: allStudents.length,
      updated: updatedCount,
      skipped: allStudents.length - updates.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Berhasil memperbarui ${updatedCount} dari ${allStudents.length} data siswa.`,
    })
  } catch (err: any) {
    console.error('Regenerate IDs error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan internal pada server.' }, { status: 500 })
  }
}

