import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase: any = getAdminSupabase()

    // 1. Fetch current PPDB settings
    const { data: settings, error: settingsError } = await supabase
      .from('ppdb_settings')
      .select('*')
      .eq('id', 'current')
      .single()

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('Error fetching SPMB settings:', settingsError)
    }

    // Default fallback if table empty
    const currentSettings = settings || {
      id: 'current',
      academic_year: '2027/2028',
      is_active: true,
      active_batch: 1,
      batch_1_name: 'Periode Pendaftaran 2027/2028',
      batch_1_period: 'Oktober – Kuota Terpenuhi',
      batch_1_quota: 120,
      registration_fee: 200000,
      bank_name: 'Bank BTN',
      bank_account_number: '00129-01-30-00015-9',
      bank_account_holder: 'MI ATTAQWA 15 BABELAN',
      whatsapp_contact: '6281234567890'
    }

    // 2. Fetch registrations for current academic year to calculate single-period & class quotas
    const { data: registrations, error: regError } = await supabase
      .from('ppdb_registrations')
      .select('student_nickname, special_needs, status')
      .eq('academic_year', currentSettings.academic_year)

    if (regError) {
      console.error('Error counting SPMB registrations:', regError)
    }

    const allRegs = registrations || []
    const totalCount = allRegs.length

    // Fullday program count (Max 30)
    const fulldayRegs = allRegs.filter((r: any) => 
      (r.student_nickname && String(r.student_nickname).toLowerCase().includes('fullday')) ||
      (r.special_needs && String(r.special_needs).toLowerCase().includes('fullday'))
    )
    const fulldayCount = fulldayRegs.length
    const fulldayApproved = fulldayRegs.filter((r: any) => r.status === 'approved').length
    const fulldayQuota = 30
    const isFulldayFull = fulldayCount >= fulldayQuota

    // Regular program count
    const regularRegs = allRegs.filter((r: any) => 
      !((r.student_nickname && String(r.student_nickname).toLowerCase().includes('fullday')) ||
        (r.special_needs && String(r.special_needs).toLowerCase().includes('fullday')))
    )
    const regularCount = regularRegs.length
    const regularApproved = regularRegs.filter((r: any) => r.status === 'approved').length
    const totalQuota = Number(currentSettings.batch_1_quota) || 120
    const regularQuota = Math.max(0, totalQuota - fulldayQuota)
    const isRegularFull = regularCount >= regularQuota
    const isTotalFull = totalCount >= totalQuota

    return NextResponse.json({
      success: true,
      data: {
        ...currentSettings,
        stats: {
          total: totalCount,
          totalQuota,
          isTotalFull,
          fullday: {
            total: fulldayCount,
            approved: fulldayApproved,
            quota: fulldayQuota,
            isFull: isFulldayFull
          },
          regular: {
            total: regularCount,
            approved: regularApproved,
            quota: regularQuota,
            isFull: isRegularFull
          },
          // Backwards compatibility for components reading batch1
          batch1: {
            total: totalCount,
            approved: allRegs.filter((r: any) => r.status === 'approved').length,
            quota: totalQuota,
            isFull: isTotalFull
          }
        }
      }
    })
  } catch (error: any) {
    console.error('SPMB Settings API Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
