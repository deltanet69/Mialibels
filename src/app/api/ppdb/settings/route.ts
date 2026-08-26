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
      console.error('Error fetching PPDB settings:', settingsError)
    }

    // Default fallback if table empty
    const currentSettings = settings || {
      id: 'current',
      academic_year: '2027/2028',
      is_active: true,
      active_batch: 1,
      batch_1_name: 'Batch 1 (Gelombang 1)',
      batch_1_period: 'September - November',
      batch_1_quota: 75,
      batch_2_name: 'Batch 2 (Gelombang 2)',
      batch_2_period: 'Desember - Februari',
      batch_2_quota: 75,
      batch_3_name: 'Batch 3 (Gelombang 3)',
      batch_3_period: 'Maret - Mei',
      batch_3_quota: 75,
      registration_fee: 200000,
      bank_name: 'Bank BTN',
      bank_account_number: '00129-01-30-00015-9',
      bank_account_holder: 'MI ATTAQWA 15 BABELAN',
      whatsapp_contact: '6281234567890'
    }

    // 2. Fetch counts per batch for current academic year
    const { data: registrations, error: regError } = await supabase
      .from('ppdb_registrations')
      .select('batch, status')
      .eq('academic_year', currentSettings.academic_year)

    if (regError) {
      console.error('Error counting registrations:', regError)
    }

    const batch1Count = (registrations || []).filter((r: any) => r.batch === 1).length
    const batch2Count = (registrations || []).filter((r: any) => r.batch === 2).length
    const batch3Count = (registrations || []).filter((r: any) => r.batch === 3).length
    const totalCount = (registrations || []).length

    const batch1Approved = (registrations || []).filter((r: any) => r.batch === 1 && r.status === 'approved').length
    const batch2Approved = (registrations || []).filter((r: any) => r.batch === 2 && r.status === 'approved').length
    const batch3Approved = (registrations || []).filter((r: any) => r.batch === 3 && r.status === 'approved').length

    return NextResponse.json({
      success: true,
      data: {
        ...currentSettings,
        stats: {
          total: totalCount,
          batch1: {
            total: batch1Count,
            approved: batch1Approved,
            quota: currentSettings.batch_1_quota,
            isFull: batch1Count >= currentSettings.batch_1_quota
          },
          batch2: {
            total: batch2Count,
            approved: batch2Approved,
            quota: currentSettings.batch_2_quota,
            isFull: batch2Count >= currentSettings.batch_2_quota
          },
          batch3: {
            total: batch3Count,
            approved: batch3Approved,
            quota: currentSettings.batch_3_quota,
            isFull: batch3Count >= currentSettings.batch_3_quota
          }
        }
      }
    })
  } catch (error: any) {
    console.error('PPDB Settings API Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
