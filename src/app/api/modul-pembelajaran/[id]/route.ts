import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('learning_modules')
      .select('*, admins:created_by (name)')
      .eq('id', id)
      .single()

    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Not Found' }, { status: 404 })

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error fetching learning module:', error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check ownership or admin
    const { data: existing } = await supabase
      .from('learning_modules')
      .select('created_by')
      .eq('id', id)
      .single()
      
    if (!existing) return NextResponse.json({ error: 'Not Found' }, { status: 404 })
    if (session.role === 'guru' && existing.created_by !== session.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { data, error } = await supabase
      .from('learning_modules')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error updating learning module:', error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    // Only admins can delete for now, or owners (guru) if draft? Let's say admin/superadmin only as per ModulCard
    if (session.role === 'guru') {
      const { data: existing } = await supabase
        .from('learning_modules')
        .select('created_by')
        .eq('id', id)
        .single()
      if (!existing || existing.created_by !== session.id) {
         return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const { error } = await supabase
      .from('learning_modules')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting learning module:', error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}
