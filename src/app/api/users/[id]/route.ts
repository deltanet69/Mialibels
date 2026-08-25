import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/session'
import { hash } from 'bcryptjs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || !['superadmin', 'staff_operator'].includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const { name, email, password, role, is_active } = body

  const validRoles = ['superadmin', 'kepsek', 'guru', 'staff', 'staff_operator']
  if (role && !validRoles.includes(role)) {
    return NextResponse.json({ error: 'Role tidak valid.' }, { status: 400 })
  }

  // Fetch existing user for logging
  const { data: existing } = await supabase
    .from('admins')
    .select('name, email, role')
    .eq('id', id)
    .single()

  const updates: any = { updated_at: new Date().toISOString() }
  if (name !== undefined) updates.name = name.trim()
  if (email !== undefined) updates.email = email.toLowerCase().trim()
  if (role !== undefined) updates.role = role
  if (is_active !== undefined) updates.is_active = is_active
  if (password) updates.password = await hash(password, 12)

  const { data, error } = await supabase
    .from('admins')
    .update(updates)
    .eq('id', id)
    .select('id, name, email, role, is_active, created_at, updated_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log activity
  const changes: string[] = []
  if (name && existing?.name !== name) changes.push(`nama: ${existing?.name} → ${name}`)
  if (role && existing?.role !== role) changes.push(`role: ${existing?.role} → ${role}`)
  if (is_active !== undefined) changes.push(`status: ${is_active ? 'diaktifkan' : 'dinonaktifkan'}`)
  if (password) changes.push('password direset')

  await supabase.from('activity_logs').insert({
    admin_id: session.id,
    admin_name: session.name,
    action: 'UPDATE',
    resource: 'user',
    description: `Update user ${existing?.name} (${existing?.email}): ${changes.join(', ')}`
  })

  return NextResponse.json({ success: true, data })
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (session?.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  // Prevent self-delete
  if (session.id === id) {
    return NextResponse.json({ error: 'Tidak bisa menghapus akun Anda sendiri.' }, { status: 400 })
  }

  // Fetch user for logging
  const { data: existing } = await supabase
    .from('admins')
    .select('name, email')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('admins').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log activity
  await supabase.from('activity_logs').insert({
    admin_id: session.id,
    admin_name: session.name,
    action: 'DELETE',
    resource: 'user',
    description: `Menghapus akun user: ${existing?.name} (${existing?.email})`
  })

  return NextResponse.json({ success: true })
}
