// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/session'
import { canManageFinance } from '@/lib/rbac'

/**
 * GET /api/savings/[studentId]/recalculate
 * 
 * Force-recalculates all balance_after values for every transaction
 * of a specific student and syncs the final balance to tabungan_siswa.
 * 
 * Use this to fix corrupted/stale balance data.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const session = await getSession()
    if (!session || !canManageFinance(session.role)) {
      return NextResponse.json({ error: 'Forbidden: Anda tidak memiliki akses untuk rekonsiliasi saldo' }, { status: 403 })
    }

    const studentId = (await params).studentId

    // 1. Fetch ALL transactions in strict chronological order
    const { data: transactions, error: fetchError } = await supabase
      .from('tabungan_transaksi')
      .select('id, type, amount, balance_after, created_at')
      .eq('student_id', studentId)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })

    if (fetchError) throw new Error('Gagal mengambil transaksi: ' + fetchError.message)

    if (!transactions || transactions.length === 0) {
      // No transactions — ensure balance is 0
      await supabase
        .from('tabungan_siswa')
        .update({ balance: 0 })
        .eq('student_id', studentId)

      return NextResponse.json({
        success: true,
        message: 'Tidak ada transaksi. Saldo direset ke 0.',
        final_balance: 0,
        corrections: 0,
      })
    }

    let runningBalance = 0
    let corrections = 0
    const log: any[] = []

    // 2. Recompute every row's balance_after from zero
    for (const trx of transactions) {
      const amount = Math.round(Number(trx.amount))
      const oldBalanceAfter = Math.round(Number(trx.balance_after ?? 0))

      if (trx.type === 'DEPOSIT') {
        runningBalance += amount
      } else if (trx.type === 'WITHDRAWAL') {
        runningBalance -= amount
      }

      // Always update to guarantee correctness
      const { error: updateErr } = await supabase
        .from('tabungan_transaksi')
        .update({ balance_after: runningBalance })
        .eq('id', trx.id)

      if (updateErr) throw new Error(`Gagal update baris ${trx.id}: ` + updateErr.message)

      if (oldBalanceAfter !== runningBalance) {
        corrections++
        log.push({
          id: trx.id,
          created_at: trx.created_at,
          type: trx.type,
          amount,
          old_balance_after: oldBalanceAfter,
          new_balance_after: runningBalance,
        })
      }
    }

    // 3. Sync final balance to tabungan_siswa
    const { error: balanceErr } = await supabase
      .from('tabungan_siswa')
      .update({ balance: runningBalance })
      .eq('student_id', studentId)

    if (balanceErr) throw new Error('Gagal update saldo: ' + balanceErr.message)

    return NextResponse.json({
      success: true,
      message: `Rekonsiliasi selesai. ${corrections} baris dikoreksi.`,
      final_balance: runningBalance,
      corrections,
      correction_log: log,
    })
  } catch (error: any) {
    console.error('[recalculate]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
