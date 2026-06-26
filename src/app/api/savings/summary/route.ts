import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

function getStartDateStr(period: string) {
  const startDate = new Date()
  if (period === 'today') {
    startDate.setHours(0, 0, 0, 0)
  } else if (period === 'week') {
    const day = startDate.getDay()
    const diff = startDate.getDate() - day + (day === 0 ? -6 : 1)
    startDate.setDate(diff)
    startDate.setHours(0, 0, 0, 0)
  } else if (period === 'month') {
    startDate.setDate(1)
    startDate.setHours(0, 0, 0, 0)
  } else if (period === 'all') {
    return '1970-01-01T00:00:00.000Z'
  }
  return startDate.toISOString()
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const depositPeriod = searchParams.get('depositPeriod') || 'month'
    const withdrawalPeriod = searchParams.get('withdrawalPeriod') || 'month'

    // Get total balance from tabungan_siswa
    const { data: totalBalanceData, error: balanceError } = await supabase
      .from('tabungan_siswa')
      .select('balance')

    if (balanceError) throw balanceError

    const totalBalance = totalBalanceData.reduce((acc, curr) => acc + Number(curr.balance), 0)

    // Deposit Query
    const { data: deposits, error: depError } = await supabase
      .from('tabungan_transaksi')
      .select('amount')
      .eq('type', 'DEPOSIT')
      .gte('created_at', getStartDateStr(depositPeriod))

    if (depError) throw depError

    const totalDeposit = deposits.reduce((acc, curr) => acc + Number(curr.amount), 0)

    // Withdrawal Query
    const { data: withdrawals, error: wdError } = await supabase
      .from('tabungan_transaksi')
      .select('amount')
      .eq('type', 'WITHDRAWAL')
      .gte('created_at', getStartDateStr(withdrawalPeriod))

    if (wdError) throw wdError

    const totalWithdrawal = withdrawals.reduce((acc, curr) => acc + Number(curr.amount), 0)

    const res = NextResponse.json({
      success: true,
      data: {
        totalBalance,
        totalDeposit,
        totalWithdrawal
      }
    })
    
    res.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate')
    return res

  } catch (error: any) {
    console.error('Error fetching savings summary:', error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}
