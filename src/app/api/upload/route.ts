import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Use service role key to bypass RLS for uploads if available, otherwise anon key
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // Convert to webp
    const webpBuffer = await sharp(buffer)
      .webp({ quality: 80 })
      .toBuffer()

    // Create unique filename
    const uniqueId = Date.now().toString() + '-' + Math.round(Math.random() * 1e9)
    const fileName = `thumbnail-${uniqueId}.webp`

    // Upload to supabase
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(fileName, webpBuffer, {
        contentType: 'image/webp',
        upsert: false
      })

    if (error) {
      console.error('Supabase upload error:', error)
      throw error
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(fileName)

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (error: any) {
    console.error('Upload API Error:', error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}
