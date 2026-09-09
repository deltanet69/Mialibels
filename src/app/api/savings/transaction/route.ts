// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/session'
import { canManageFinance } from '@/lib/rbac'
import { createNotification } from '@/lib/push'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || !canManageFinance(session.role)) {
      return NextResponse.json({ error: 'Forbidden: Anda tidak memiliki akses untuk melakukan transaksi' }, { status: 403 })
    }

    const body = await request.json()
    const { studentId, type, amount, description } = body

    if (!studentId || !type || !amount) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'Nominal harus lebih dari 0' }, { status: 400 })
    }

    if (type !== 'DEPOSIT' && type !== 'WITHDRAWAL') {
      return NextResponse.json({ error: 'Tipe transaksi tidak valid' }, { status: 400 })
    }

    // Call the RPC function for atomic transaction
    const { data, error } = await supabase.rpc('process_tabungan', {
      p_student_id: studentId,
      p_type: type,
      p_amount: amount,
      p_description: description || '',
      p_admin_id: session.id
    })

    if (error) {
      console.error('RPC process_tabungan error:', error)
      return NextResponse.json({ error: 'Gagal memproses transaksi: ' + error.message }, { status: 500 })
    }

    // The RPC returns a JSON object { success, error?, new_balance, student_id }
    if (!data.success) {
      return NextResponse.json({ error: data.error || 'Transaksi ditolak oleh sistem.' }, { status: 400 })
    }

    // Format IDR helper
    const formatIDR = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
    
    // Trigger notification
    const msg = type === 'DEPOSIT' 
      ? `Setoran sebesar ${formatIDR(amount)} berhasil ditambahkan ke saldo tabungan.`
      : `Penarikan sebesar ${formatIDR(amount)} berhasil dilakukan.`;

    try {
      await createNotification(
        studentId,
        'parent',
        'INFO',
        type === 'DEPOSIT' ? 'Setoran Tabungan Berhasil' : 'Penarikan Tabungan Berhasil',
        msg,
        '/parent/dashboard/savings',
        true
      );
    } catch (err) {
      console.error('Savings Notif Error:', err);
    }

    return NextResponse.json({ success: true, data })

  } catch (error: any) {
    console.error('Error processing transaction:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan internal pada server.' }, { status: 500 })
  }
}

