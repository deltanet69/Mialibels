import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const studentId = (await params).studentId
    
    // 1. Get student info and current balance
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select(`
        id, 
        name, 
        student_number,
        class,
        classrooms(name),
        tabungan:tabungan_siswa(balance)
      `)
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // 2. Get transaction history
    const { data: history, error: historyError } = await supabase
      .from('tabungan_transaksi')
      .select(`
        id,
        type,
        amount,
        balance_after,
        description,
        created_at,
        admin:admins(name)
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })

    if (historyError) throw historyError

    return NextResponse.json({
      success: true,
      data: {
        student: {
          id: student.id,
          name: student.name,
          studentNumber: student.student_number,
          className: student.classrooms ? student.classrooms.name : (student.class || '-'),
          balance: student.tabungan ? student.tabungan.balance : 0
        },
        transactions: history.map((t: any) => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          balanceAfter: t.balance_after,
          description: t.description,
          date: t.created_at,
          adminName: t.admin ? t.admin.name : 'System'
        }))
      }
    })

  } catch (error: any) {
    console.error('Error fetching student savings details:', error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}
