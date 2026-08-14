import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import { getSession } from "@/lib/session"

export const runtime = 'nodejs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Target max file size in bytes (250KB)
const MAX_OUTPUT_BYTES = 250 * 1024

/**
 * Compress an image buffer using sharp.
 * Strategy:
 *  1. Convert to WebP at quality=85 (lossless off) â€” already very efficient.
 *  2. If result > MAX_OUTPUT_BYTES, iteratively lower quality until it fits.
 *  3. Always keep resolution at original (never downscale pixels).
 */
async function compressToWebP(input: Buffer): Promise<{ buffer: Buffer; contentType: string }> {
  // Determine initial quality â€” start at 85 for great balance
  let quality = 85
  let outputBuffer: Buffer

  while (quality >= 40) {
    outputBuffer = await sharp(input)
      .webp({ quality, effort: 6, lossless: false })
      .toBuffer()

    if (outputBuffer.length <= MAX_OUTPUT_BYTES || quality <= 40) {
      break
    }
    quality -= 5
  }

  return { buffer: outputBuffer!, contentType: 'image/webp' }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
    }

    // Validate original file size (15MB max before compression)
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 15MB' }, { status: 400 })
    }

    // Read file as buffer
    const bytes = await file.bytes()
    const inputBuffer = Buffer.from(bytes)

    // Compress to WebP
    let finalBuffer: Buffer = inputBuffer
    let contentType = file.type
    let isCompressed = false

    try {
      const result = await compressToWebP(inputBuffer)
      finalBuffer = result.buffer
      contentType = result.contentType
      isCompressed = true
    } catch (compressError) {
      console.warn('Sharp compression failed, using original buffer', compressError)
    }

    // Create unique filename
    const uniqueId = Date.now().toString() + '-' + Math.round(Math.random() * 1e9)
    const fileExt = isCompressed ? 'webp' : file.name.split('.').pop() || 'jpg'
    const fileName = `upload-${uniqueId}.${fileExt}`

    // Upload to Supabase storage
    const { error } = await supabase.storage
      .from('uploads')
      .upload(fileName, finalBuffer, {
        contentType,
        upsert: false,
      })

    if (error) {
      console.error('Supabase upload error:', error)
      throw error
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(fileName)

    console.log(`[Upload] Original: ${(file.size / 1024).toFixed(1)}KB -> Result: ${(finalBuffer.length / 1024).toFixed(1)}KB (${fileExt})`)

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (error: any) {
    console.error('Upload API Error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan internal pada server.' }, { status: 500 })
  }
}

