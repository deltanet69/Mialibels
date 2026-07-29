import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Or anon key if service role is not available

const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    // Cari siswa kelas 1 A-D yang nisn-nya null atau kosong
    const { data: students, error: fetchError } = await supabase
      .from('students')
      .select('id, name, class, nisn')
      .in('class', ['Kelas 1A', 'Kelas 1B', 'Kelas 1C', 'Kelas 1D'])
      .or('nisn.is.null,nisn.eq.')

    if (fetchError) throw fetchError

    if (!students || students.length === 0) {
      return NextResponse.json({ message: 'Tidak ada siswa kelas 1 A-D yang membutuhkan dummy NISN.' })
    }

    const updates = []
    for (let i = 0; i < students.length; i++) {
      const student = students[i]
      // Generate dummy NISN 6 angka: "9" + 5 random digits, or just a sequential 6 digit
      const dummyNisn = Math.floor(100000 + Math.random() * 900000).toString()
      updates.push(
        supabase
          .from('students')
          .update({ nisn: dummyNisn })
          .eq('id', student.id)
      )
    }

    await Promise.all(updates)

    return NextResponse.json({ 
      success: true,
      message: `Berhasil men-generate dummy NISN untuk ${students.length} siswa kelas 1 A-D.`,
      updated_students: students
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
