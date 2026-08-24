import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    const role = session?.role?.toLowerCase() || ''
    const isAdmin = role.includes('admin') || role.includes('yayasan')

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const formData = await request.formData()
    const photo = formData.get('photo') as File
    const studentName = formData.get('studentName') as string

    if (!photo || !studentName) {
      return NextResponse.json({ error: 'Data foto atau nama siswa tidak lengkap' }, { status: 400 })
    }

    // 1. Cari siswa berdasarkan nama (case-insensitive)
    const { data: students, error: searchError } = await supabase
      .from('students')
      .select('id, name')
      .ilike('name', studentName) // ilike for case-insensitive

    if (searchError || !students || students.length === 0) {
      return NextResponse.json({ error: `Siswa dengan nama "${studentName}" tidak ditemukan` }, { status: 404 })
    }

    // Jika ada lebih dari 1 dengan nama sama, ini bisa ambigu.
    // Kita ambil yang pertama atau bisa lempar error jika ingin ketat.
    const student = students[0]

    // 2. Upload file ke Supabase Storage
    const fileExt = photo.name.split('.').pop()
    const fileName = `${student.id}-${Date.now()}.${fileExt}`
    
    // We need to convert File to ArrayBuffer or Blob for Supabase JS client
    const arrayBuffer = await photo.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('student_photos')
      .upload(fileName, buffer, {
        contentType: photo.type,
        upsert: true
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: 'Gagal mengupload foto ke penyimpanan' }, { status: 500 })
    }

    // Dapatkan Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('student_photos')
      .getPublicUrl(fileName)

    // 3. Update data siswa
    const { error: updateError } = await supabase
      .from('students')
      .update({ photo_url: publicUrl })
      .eq('id', student.id)

    if (updateError) {
      console.error('Database update error:', updateError)
      return NextResponse.json({ error: 'Gagal memperbarui data siswa' }, { status: 500 })
    }

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (error: any) {
    console.error('Bulk photo upload error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan internal server' }, { status: 500 })
  }
}
