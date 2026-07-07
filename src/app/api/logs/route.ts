import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSession } from '@/lib/session'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session || !['superadmin', 'kepsek'].includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const resource = searchParams.get('resource') || ''
  const adminId = searchParams.get('admin_id') || ''
  const from = searchParams.get('from') || ''
  const to = searchParams.get('to') || ''

  const start = (page - 1) * limit
  const end = start + limit - 1

  let query = supabase
    .from('activity_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(start, end)

  if (resource) query = query.eq('resource', resource)
  if (adminId) query = query.eq('admin_id', adminId)
  if (from) query = query.gte('created_at', from)
  if (to) query = query.lte('created_at', to + 'T23:59:59Z')

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data, count, page, limit })
}
