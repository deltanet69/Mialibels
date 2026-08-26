import { NextRequest, NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase: any = getAdminSupabase()
    const { data: settings, error } = await supabase
      .from('ppdb_settings')
      .select('*')
      .eq('id', 'current')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: settings })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase: any = getAdminSupabase()

    const {
      is_active,
      active_batch,
      academic_year,
      batch_1_quota,
      batch_2_quota,
      batch_3_quota,
      registration_fee,
      bank_name,
      bank_account_number,
      bank_account_holder,
      whatsapp_contact,
      qris_image_url
    } = body

    const updatePayload: any = {
      updated_at: new Date().toISOString()
    }

    if (is_active !== undefined) updatePayload.is_active = is_active
    if (active_batch !== undefined) updatePayload.active_batch = Number(active_batch)
    if (academic_year !== undefined) updatePayload.academic_year = academic_year
    if (batch_1_quota !== undefined) updatePayload.batch_1_quota = Number(batch_1_quota)
    if (batch_2_quota !== undefined) updatePayload.batch_2_quota = Number(batch_2_quota)
    if (batch_3_quota !== undefined) updatePayload.batch_3_quota = Number(batch_3_quota)
    if (registration_fee !== undefined) updatePayload.registration_fee = Number(registration_fee)
    if (bank_name !== undefined) updatePayload.bank_name = bank_name
    if (bank_account_number !== undefined) updatePayload.bank_account_number = bank_account_number
    if (bank_account_holder !== undefined) updatePayload.bank_account_holder = bank_account_holder
    if (whatsapp_contact !== undefined) updatePayload.whatsapp_contact = whatsapp_contact
    if (qris_image_url !== undefined) updatePayload.qris_image_url = qris_image_url

    const { data: updated, error } = await supabase
      .from('ppdb_settings')
      .upsert({ id: 'current', ...updatePayload })
      .select()
      .single()

    if (error) {
      console.error('Error updating PPDB settings:', error)
      return NextResponse.json({ error: 'Gagal memperbarui pengaturan PPDB: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Pengaturan PPDB berhasil disimpan.',
      data: updated
    })
  } catch (error: any) {
    console.error('Admin PPDB Settings Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
