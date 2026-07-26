// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    let query = supabase
      .from('staffs')
      .select(`
        *,
        homeroom_classrooms:classrooms!homeroom_teacher_id(id, name),
        schedules:classroom_schedules(id, classroom:classrooms(name))
      `)
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`name.ilike.%${search}%,position.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) throw error

    // Transform data to ensure distinct teaching classes are easily accessible
    const formattedData = data.map((staff: any) => {
      const teachingClasses = [...new Set(
        staff.schedules?.map((s: any) => s.classroom?.name).filter(Boolean)
      )];
      
      return {
        ...staff,
        teaching_classes: teachingClasses
      }
    });

    const res = NextResponse.json({ success: true, data: formattedData })
    res.headers.set('Cache-Control', 'private, max-age=10, stale-while-revalidate=30')
    return res
  } catch (error: any) {
    console.error('Error fetching guru:', error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { isBulk, staffs } = body

    if (isBulk && Array.isArray(staffs)) {
      const { error } = await supabase
        .from('staffs')
        .insert(staffs)
      
      if (error) throw error
      return NextResponse.json({ success: true, message: `${staffs.length} staffs imported successfully` })
    }

    // Single insert
    const { classroom_id, ...staffData } = body
    if (staffData.rfid === '') {
      staffData.rfid = null
    }
    
    const { data: guru, error } = await supabase
      .from('staffs')
      .insert([staffData])
      .select()
      .single()

    if (error) throw error

    // Handle homeroom assignment
    if (classroom_id) {
      await supabase
        .from('classrooms')
        .update({ homeroom_teacher_id: guru.id })
        .eq('id', classroom_id)
    }

    return NextResponse.json({ success: true, data: guru })
  } catch (error: any) {
    console.error('Error creating guru:', error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}
