import { getAdminSupabase } from '@/lib/supabase'

// Perhitungan kuota baru berjalan mulai Sabtu 7 Nov 2026 08.00 WIB; sebelumnya dikunci 150 tersedia.
const QUOTA_LIVE_AT_MS = Date.parse('2026-11-07T08:00:00+07:00')

// Waktu buka form default bila admin belum menyetel ppdb_settings.open_at.
export const DEFAULT_OPEN_AT = '2026-11-07T08:00:00+07:00'

export function getOpenAtMs(openAt?: string | null) {
  const t = Date.parse(openAt || DEFAULT_OPEN_AT)
  return Number.isNaN(t) ? Date.parse(DEFAULT_OPEN_AT) : t
}

// Saat open_at tiba, otomatis ON satu kali. Bila admin sudah menyentuh pengaturan setelah open_at
// (updated_at >= open_at, termasuk mematikan toggle), pilihannya dihormati dan tidak dinyalakan lagi.
export async function applyAutoOpen(supabase: any, row: any) {
  const openAtMs = getOpenAtMs(row?.open_at)
  if (!row || row.is_active || Date.now() < openAtMs || Date.parse(row.updated_at) >= openAtMs) return row
  const { data } = await supabase
    .from('ppdb_settings')
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq('id', 'current')
    .eq('is_active', false)
    .lt('updated_at', new Date(openAtMs).toISOString())
    .select()
    .maybeSingle()
  return data ? { ...row, ...data } : { ...row, is_active: true }
}

export async function getSpmbSettings() {
  try {
    const supabase: any = getAdminSupabase()
    const { data: settings, error: settingsError } = await supabase
      .from('ppdb_settings')
      .select('*')
      .eq('id', 'current')
      .single()

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('Error fetching SPMB settings from db:', settingsError)
    }

    const currentSettings = (settings && (await applyAutoOpen(supabase, settings))) || {
      id: 'current',
      academic_year: '2027/2028',
      is_active: false,
      active_batch: 1,
      batch_1_name: 'Periode Pendaftaran 2027/2028',
      batch_1_period: 'Oktober – Kuota Terpenuhi',
      batch_1_quota: 150,
      registration_fee: 300000,
      bank_name: 'Bank BTN',
      bank_account_number: '2820-15-0010-3158',
      bank_account_holder: 'MI ATTAQWA 15 BABELAN',
      whatsapp_contact: '628567858268'
    }

    const { data: registrations, error: regError } = await supabase
      .from('ppdb_registrations')
      .select('student_nickname, special_needs, status')
      .eq('academic_year', currentSettings.academic_year)

    if (regError) {
      console.error('Error counting SPMB registrations in db:', regError)
    }

    // Pendaftar yang ditolak melepas kuotanya.
    const allRegs = Date.now() < QUOTA_LIVE_AT_MS ? [] : (registrations || []).filter((r: any) => r.status !== 'rejected')
    const totalCount = allRegs.length

    // Fullday program count (75 siswa)
    const fulldayRegs = allRegs.filter((r: any) => 
      (r.student_nickname && String(r.student_nickname).toLowerCase().includes('fullday')) ||
      (r.special_needs && String(r.special_needs).toLowerCase().includes('fullday'))
    )
    const fulldayCount = fulldayRegs.length
    const fulldayApproved = fulldayRegs.filter((r: any) => r.status === 'approved').length
    const fulldayQuota = 75
    const isFulldayFull = fulldayCount >= fulldayQuota

    // Regular program count (75 siswa)
    const regularRegs = allRegs.filter((r: any) => 
      !((r.student_nickname && String(r.student_nickname).toLowerCase().includes('fullday')) ||
        (r.special_needs && String(r.special_needs).toLowerCase().includes('fullday')))
    )
    const regularCount = regularRegs.length
    const regularApproved = regularRegs.filter((r: any) => r.status === 'approved').length
    const totalQuota = Number(currentSettings.batch_1_quota) || 150
    const regularQuota = 75
    const isRegularFull = regularCount >= regularQuota
    const isTotalFull = totalCount >= totalQuota || (isFulldayFull && isRegularFull)

    return {
      ...currentSettings,
      open_at: new Date(getOpenAtMs(currentSettings.open_at)).toISOString(),
      server_now: Date.now(),
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
        batch1: {
          total: totalCount,
          approved: allRegs.filter((r: any) => r.status === 'approved').length,
          quota: totalQuota,
          isFull: isTotalFull
        }
      }
    }
  } catch (error: any) {
    console.error('SPMB getSpmbSettings error:', error)
    return {
      academic_year: '2027/2028',
      is_active: false,
      batch_1_quota: 150,
      registration_fee: 300000,
      bank_name: 'Bank BTN',
      bank_account_number: '2820-15-0010-3158',
      bank_account_holder: 'MI ATTAQWA 15 BABELAN',
      whatsapp_contact: '628567858268',
      open_at: new Date(getOpenAtMs()).toISOString(),
      server_now: Date.now(),
      stats: {
        total: 0,
        totalQuota: 150,
        isTotalFull: false,
        fullday: { total: 0, approved: 0, quota: 75, isFull: false },
        regular: { total: 0, approved: 0, quota: 75, isFull: false },
        batch1: { total: 0, approved: 0, quota: 150, isFull: false }
      }
    }
  }
}
