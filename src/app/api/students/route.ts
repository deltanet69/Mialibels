// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    let query = supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`name.ilike.%${search}%,student_number.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) throw error

    const res = NextResponse.json({ success: true, data })
    res.headers.set('Cache-Control', 'private, max-age=10, stale-while-revalidate=30')
    return res
  } catch (error: any) {
    console.error('Error fetching students:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan internal pada server.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { isBulk, students } = body

    // Build class map (name â†’ id)
    const { data: classroomsData } = await supabase.from('classrooms').select('id, name').order('name', { ascending: true })
    const classMap: Record<string, string> = {}
    if (classroomsData) {
      classroomsData.forEach(c => {
        classMap[c.name.toLowerCase()] = c.id
      })
    }

    // Auto-create any classrooms that don't exist yet
    if (isBulk && Array.isArray(students)) {
      const uniqueClasses = [...new Set(
        students
          .map((s: any) => {
            if (!s.class) return null;
            let c = s.class.replace(/^kelas\s+/i, '').trim().toUpperCase();
            c = c.replace(/^(\d+)\s+([A-Z])$/, '$1$2');
            return c;
          })
          .filter(Boolean)
      )]
      const missingClasses = uniqueClasses.filter((cls: any) => !classMap[cls.toLowerCase()])
      if (missingClasses.length > 0) {
        const { data: newClassrooms } = await supabase
          .from('classrooms')
          .insert(missingClasses.map((name: any) => ({ name })))
          .select('id, name')
        if (newClassrooms) {
          newClassrooms.forEach((c: any) => {
            classMap[c.name.toLowerCase()] = c.id
          })
        }
      }
    }

    const getClassId = (rawClass: string) => {
      if (!rawClass) return null
      let cleanName = rawClass.replace(/^kelas\s+/i, '').trim().toUpperCase()
      cleanName = cleanName.replace(/^(\d+)\s+([A-Z])$/, '$1$2')
      return classMap[cleanName.toLowerCase()] || null
    }

    // Helper to generate unique student IDs
    // Format: {2-digit class number}{class letter}{4-digit year}{3-digit sequence}
    // Example: Kelas 1A â†’ 01A2026001, Kelas 5B â†’ 05B2026024
    const sequenceMap: Record<string, number> = {}
    const getNextStudentId = async (rawClass: string) => {
      if (!rawClass) return `TMP${Date.now()}${Math.floor(Math.random() * 1000)}`

      // Strip prefix "Kelas" and normalize
      let cleanClass = rawClass.replace(/^kelas\s*/i, '').trim().toUpperCase()
      cleanClass = cleanClass.replace(/^(\d+)\s+([A-Z])$/, '$1$2')
      // Extract leading digits (class number) and trailing letters (class letter)
      const matchResult = cleanClass.match(/^(\d+)([A-Z]?)$/)
      if (!matchResult) return `TMP${Date.now()}`
      
      const classNum  = matchResult[1].padStart(2, '0')  // e.g. "1" â†’ "01"
      const classLetter = matchResult[2] || ''            // e.g. "A"
      const classCode = `${classNum}${classLetter}`       // e.g. "01A"
      const year = new Date().getFullYear().toString()    // e.g. "2026"
      const prefix = `${classCode}${year}`               // e.g. "01A2026"

      if (sequenceMap[prefix] === undefined) {
        // Query the DB for the last existing student_number with this prefix
        const { data } = await supabase
          .from('students')
          .select('student_number')
          .like('student_number', `${prefix}%`)
          .order('student_number', { ascending: false })
          .limit(1)
        
        let seq = 1
        if (data && data.length > 0 && data[0].student_number) {
          const suffix = data[0].student_number.slice(prefix.length) // last 3 digits
          const parsed = parseInt(suffix, 10)
          if (!isNaN(parsed) && parsed > 0) seq = parsed + 1
        }
        sequenceMap[prefix] = seq
      } else {
        sequenceMap[prefix]++
      }

      return `${prefix}${sequenceMap[prefix].toString().padStart(3, '0')}`
    }

    if (isBulk && Array.isArray(students)) {
      // Bulk Insert Mode (e.g. from CSV)
      const studentsToInsert = []
      for (const s of students) {
        studentsToInsert.push({
          ...s,
          student_number: await getNextStudentId(s.class),
          class_id: getClassId(s.class)
        })
      }

      const { data: newStudents, error: insertError } = await supabase
        .from('students')
        .insert(studentsToInsert)
        .select('id')

      if (insertError) throw insertError

      // Then create accounts for each of them
      if (newStudents && newStudents.length > 0) {
        const accounts = newStudents.map(s => ({
          student_id: s.id,
          balance: 0
        }))
        
        const { error: accError } = await supabase
          .from('student_accounts')
          .insert(accounts)

        if (accError) {
          console.error('Error creating bulk student accounts:', accError)
        }
      }

      return NextResponse.json({ success: true, count: newStudents?.length || 0 })
    } else {
      // Single Insert Mode
      const generatedId = await getNextStudentId(body.class)
      const payload = {
        ...body,
        student_number: generatedId,
        class_id: getClassId(body.class)
      }

      const { data: student, error: insertError } = await supabase
        .from('students')
        .insert([payload])
        .select()
        .single()

      if (insertError) throw insertError

      // Automatically create a student_account with 0 balance
      const { error: accError } = await supabase
        .from('student_accounts')
        .insert([{ student_id: student.id, balance: 0 }])

      if (accError) throw accError

      return NextResponse.json({ success: true, data: student })
    }

  } catch (error: any) {
    console.error('Error creating student(s):', error)
    return NextResponse.json({ error: 'Terjadi kesalahan internal pada server.' }, { status: 500 })
  }
}

