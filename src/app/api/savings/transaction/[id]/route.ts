// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * Recalculates ALL balance_after values for every transaction of a student,
 * then syncs the final balance to tabungan_siswa.
 *
 * This is the SINGLE SOURCE OF TRUTH for balance calculation.
 * It starts from 0, processes all transactions in chronological order,
 * and writes the correct balance_after to every row.
 *
 * Returns the final (current) balance.
 */
async function recalculateStudentBalance(studentId: string): Promise<number> {
  // Fetch ALL transactions in strict chronological order
  const { data: transactions, error: fetchError } = await supabase
    .from('tabungan_transaksi')
    .select('id, type, amount, balance_after')
    .eq('student_id', studentId)
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })

  if (fetchError) throw new Error('Gagal mengambil data transaksi: ' + fetchError.message)

  let runningBalance = 0

  // Recompute each row's balance_after from scratch
  for (const trx of transactions ?? []) {
    const amount = Math.round(Number(trx.amount)) // Ensure integer
    if (trx.type === 'DEPOSIT') {
      runningBalance += amount
    } else if (trx.type === 'WITHDRAWAL') {
      runningBalance -= amount
    }

    // Always update balance_after to guarantee sync (no conditional skip)
    const { error: updateErr } = await supabase
      .from('tabungan_transaksi')
      .update({ balance_after: runningBalance })
      .eq('id', trx.id)

    if (updateErr) throw new Error(`Gagal update balance_after transaksi ${trx.id}: ` + updateErr.message)
  }

  // Sync final balance to tabungan_siswa
  const { error: balanceErr } = await supabase
    .from('tabungan_siswa')
    .update({ balance: runningBalance })
    .eq('student_id', studentId)

  if (balanceErr) throw new Error('Gagal update saldo siswa: ' + balanceErr.message)

  return runningBalance
}

/**
 * Calculates the true balance based on summing all transactions,
 * used for negative-balance validation before committing a change.
 */
async function calculateTrueBalance(studentId: string, excludeId?: string): Promise<number> {
  let query = supabase
    .from('tabungan_transaksi')
    .select('id, type, amount')
    .eq('student_id', studentId)

  // Temporarily exclude the transaction being deleted/replaced
  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query
  if (error) throw new Error('Gagal menghitung saldo: ' + error.message)

  let total = 0
  for (const trx of data ?? []) {
    const amount = Math.round(Number(trx.amount))
    if (trx.type === 'DEPOSIT') total += amount
    else if (trx.type === 'WITHDRAWAL') total -= amount
  }
  return total
}

// ─────────────────────────────────────────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id

    // 1. Get the transaction to be deleted
    const { data: trx, error: trxError } = await supabase
      .from('tabungan_transaksi')
      .select('id, type, amount, student_id')
      .eq('id', id)
      .single()

    if (trxError || !trx) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 })
    }

    // 2. Validate: would removing this transaction make the true balance negative?
    const balanceAfterRemoval = await calculateTrueBalance(trx.student_id, id)
    if (balanceAfterRemoval < 0) {
      return NextResponse.json(
        { error: 'Penghapusan transaksi ini akan membuat saldo menjadi negatif' },
        { status: 400 }
      )
    }

    // 3. Delete the transaction
    const { error: deleteError } = await supabase
      .from('tabungan_transaksi')
      .delete()
      .eq('id', id)

    if (deleteError) throw new Error('Gagal menghapus transaksi: ' + deleteError.message)

    // 4. Recalculate ALL balances from scratch to guarantee correctness
    await recalculateStudentBalance(trx.student_id)

    return NextResponse.json({ success: true, message: 'Transaksi berhasil dihapus dan saldo telah dikoreksi' })
  } catch (error: any) {
    console.error('[DELETE transaction]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id
    const body = await request.json()
    const { amount, description, type } = body

    // Basic input validation
    const newAmount = Math.round(Number(amount))
    if (!newAmount || newAmount <= 0) {
      return NextResponse.json({ error: 'Nominal tidak valid' }, { status: 400 })
    }
    if (type !== 'DEPOSIT' && type !== 'WITHDRAWAL') {
      return NextResponse.json({ error: 'Tipe transaksi tidak valid' }, { status: 400 })
    }

    // 1. Get the transaction being edited
    const { data: trx, error: trxError } = await supabase
      .from('tabungan_transaksi')
      .select('id, type, amount, student_id')
      .eq('id', id)
      .single()

    if (trxError || !trx) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 })
    }

    // 2. Validate: simulate what balance would be after the edit,
    //    using the true sum of all OTHER transactions + new amount.
    //    This validation is immune to corrupted balance_after values.
    const balanceOfOthers = await calculateTrueBalance(trx.student_id, id)
    const projectedBalance =
      type === 'DEPOSIT'
        ? balanceOfOthers + newAmount
        : balanceOfOthers - newAmount

    if (projectedBalance < 0) {
      return NextResponse.json(
        { error: 'Perubahan ini akan membuat saldo menjadi negatif' },
        { status: 400 }
      )
    }

    // 3. Update the transaction's amount, type, and description
    const { error: updateTrxError } = await supabase
      .from('tabungan_transaksi')
      .update({
        amount: newAmount,
        description: description ?? trx.description,
        type: type,
      })
      .eq('id', id)

    if (updateTrxError) throw new Error('Gagal mengubah transaksi: ' + updateTrxError.message)

    // 4. Recalculate ALL balance_after values from scratch — ABSOLUTE ACCURACY
    const finalBalance = await recalculateStudentBalance(trx.student_id)

    return NextResponse.json({
      success: true,
      message: 'Transaksi berhasil diubah dan seluruh saldo telah dikoreksi',
      new_balance: finalBalance,
    })
  } catch (error: any) {
    console.error('[PUT transaction]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
