import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const classId = searchParams.get('classId')

    // Using a left join with students and their classroom
    let query = supabase
      .from('students')
      .select(`
        id,
        name,
        student_number,
        class,
        classrooms(name),
        tabungan:tabungan_siswa(balance, updated_at)
      `)

    if (search) {
      query = query.or(`name.ilike.%${search}%,student_number.ilike.%${search}%`)
    }

    if (classId) {
      query = query.eq('classroom_id', classId)
    }

    const { data, error } = await query

    if (error) throw error

    // Fetch today's deposits
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    
    const { data: todayTx } = await supabase
      .from('tabungan_transaksi')
      .select('student_id, amount')
      .eq('type', 'DEPOSIT')
      .gte('created_at', startOfDay.toISOString())

    const todayDepositMap: Record<string, number> = {}
    if (todayTx) {
      todayTx.forEach(tx => {
        if (!todayDepositMap[tx.student_id]) {
          todayDepositMap[tx.student_id] = 0
        }
        todayDepositMap[tx.student_id] += tx.amount
      })
    }

    // Transform data for frontend convenience
    const formattedData = data.map((student: any) => ({
      id: student.id,
      name: student.name,
      studentNumber: student.student_number,
      className: student.classrooms ? student.classrooms.name : (student.class || '-'),
      balance: student.tabungan ? student.tabungan.balance : 0,
      todayDeposit: todayDepositMap[student.id] || 0,
      lastUpdated: student.tabungan ? student.tabungan.updated_at : null
    }))

    // Sort by class name then student name
    formattedData.sort((a, b) => {
      if (a.className === b.className) {
        return a.name.localeCompare(b.name)
      }
      return a.className.localeCompare(b.className)
    })

    const res = NextResponse.json({ success: true, data: formattedData })
    res.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate')
    return res
  } catch (error: any) {
    console.error('Error fetching savings list:', error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}
