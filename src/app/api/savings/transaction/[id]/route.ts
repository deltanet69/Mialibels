import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    
    // 1. Get the transaction
    const { data: trx, error: trxError } = await supabase
      .from('tabungan_transaksi')
      .select('*')
      .eq('id', id)
      .single()

    if (trxError || !trx) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 })
    }

    // 2. Get current balance
    const { data: tabungan, error: tabunganError } = await supabase
      .from('tabungan_siswa')
      .select('balance')
      .eq('student_id', trx.student_id)
      .single()

    if (tabunganError || !tabungan) {
      return NextResponse.json({ error: 'Data tabungan tidak ditemukan' }, { status: 404 })
    }

    // 3. Calculate new balance (Reverse the transaction)
    let newBalance = tabungan.balance
    if (trx.type === 'DEPOSIT') {
      newBalance -= trx.amount
    } else {
      newBalance += trx.amount
    }

    if (newBalance < 0) {
        return NextResponse.json({ error: 'Penghapusan akan membuat saldo menjadi negatif' }, { status: 400 })
    }

    // 4. Update balance
    const { error: updateError } = await supabase
      .from('tabungan_siswa')
      .update({ balance: newBalance })
      .eq('student_id', trx.student_id)

    if (updateError) throw updateError

    // 5. Delete transaction (hard delete as there is no is_deleted column)
    const { error: deleteError } = await supabase
      .from('tabungan_transaksi')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true, message: 'Transaksi berhasil dihapus' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;
    const body = await request.json()
    const { amount, description, type } = body
    
    // 1. Get the old transaction
    const { data: trx, error: trxError } = await supabase
      .from('tabungan_transaksi')
      .select('*')
      .eq('id', id)
      .single()

    if (trxError || !trx) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 })
    }

    // 2. Get current balance
    const { data: tabungan, error: tabunganError } = await supabase
      .from('tabungan_siswa')
      .select('balance')
      .eq('student_id', trx.student_id)
      .single()

    if (tabunganError || !tabungan) {
      return NextResponse.json({ error: 'Data tabungan tidak ditemukan' }, { status: 404 })
    }

    // 3. Calculate balance after reversing old transaction
    let tempBalance = tabungan.balance
    if (trx.type === 'DEPOSIT') {
      tempBalance -= trx.amount
    } else {
      tempBalance += trx.amount
    }

    // 4. Apply new transaction
    let newBalance = tempBalance
    if (type === 'DEPOSIT') {
      newBalance += amount
    } else {
      newBalance -= amount
    }

    if (newBalance < 0) {
        return NextResponse.json({ error: 'Perubahan akan membuat saldo menjadi negatif' }, { status: 400 })
    }

    // 5. Update transaction
    // Note: We also update balance_after to reflect the local state of that time, 
    // though subsequent balance_after might be out of sync.
    let newBalanceAfter = trx.balance_after;
    if (trx.type === 'DEPOSIT') {
        newBalanceAfter -= trx.amount;
    } else {
        newBalanceAfter += trx.amount;
    }
    if (type === 'DEPOSIT') {
        newBalanceAfter += amount;
    } else {
        newBalanceAfter -= amount;
    }

    const { error: updateTrxError } = await supabase
      .from('tabungan_transaksi')
      .update({
        amount: amount,
        description: description,
        type: type,
        balance_after: newBalanceAfter
      })
      .eq('id', id)

    if (updateTrxError) throw updateTrxError

    // 6. Update student balance
    const { error: updateError } = await supabase
      .from('tabungan_siswa')
      .update({ balance: newBalance })
      .eq('student_id', trx.student_id)

    if (updateError) throw updateError

    return NextResponse.json({ success: true, message: 'Transaksi berhasil diubah' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
