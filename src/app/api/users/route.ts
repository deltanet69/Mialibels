import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/session'
import { hash } from 'bcryptjs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function isAllowed(role: string | undefined, minRole: 'view' | 'manage') {
  if (!role) return false
  if (minRole === 'view') return ['superadmin', 'kepsek', 'staff_operator'].includes(role)
  if (minRole === 'manage') return ['superadmin', 'staff_operator'].includes(role)
  return false
}

export async function GET() {
  const session = await getSession()
  if (!isAllowed(session?.role, 'view')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('admins')
    .select('id, name, email, role, is_active, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch staff images
  const emails = data.map((u: any) => u.email).filter(Boolean)
  const { data: staffs } = await supabase
    .from('staffs')
    .select('email, image')
    .in('email', emails)

  if (staffs) {
    const staffMap = staffs.reduce((acc: any, curr: any) => {
      acc[curr.email] = curr.image
      return acc
    }, {})

    data.forEach((u: any) => {
      if (staffMap[u.email]) {
        u.image = staffMap[u.email]
      }
    })
  }

  return NextResponse.json({ success: true, data })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!isAllowed(session?.role, 'manage')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { name, email, password, role, is_active = true } = body

  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: 'Nama, email, password, dan role wajib diisi.' }, { status: 400 })
  }

  const validRoles = ['superadmin', 'kepsek', 'guru', 'staff', 'staff_operator']
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: 'Role tidak valid.' }, { status: 400 })
  }

  // Check duplicate email
  const { data: existing } = await supabase
    .from('admins')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Email sudah terdaftar.' }, { status: 409 })
  }

  const hashedPassword = await hash(password, 12)

  const { data, error } = await supabase
    .from('admins')
    .insert({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      is_active
    })
    .select('id, name, email, role, is_active, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log activity
  await supabase.from('activity_logs').insert({
    admin_id: session?.id,
    admin_name: session?.name,
    action: 'CREATE',
    resource: 'user',
    description: `Membuat akun user baru: ${data.name} (${data.email}) dengan role ${data.role}`
  })

  return NextResponse.json({ success: true, data })
}
