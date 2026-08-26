import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { getAdminSupabase } from "@/lib/supabase"
import { getSession } from "@/lib/session"

export const runtime = 'nodejs'

// Target max file size in bytes (350KB)
const MAX_OUTPUT_BYTES = 350 * 1024

/**
 * Compress an image buffer using sharp.
 * Strategy:
 *  1. Convert to WebP at quality=85 (lossless off) — already very efficient.
 *  2. If result > MAX_OUTPUT_BYTES, iteratively lower quality until it fits.
 *  3. Always keep resolution at original (never downscale pixels).
 */
async function compressToWebP(input: Buffer): Promise<{ buffer: Buffer; contentType: string }> {
  let quality = 85
  let outputBuffer: Buffer = input

  while (quality >= 40) {
    outputBuffer = await sharp(input)
      .webp({ quality, effort: 4, lossless: false })
      .toBuffer()

    if (outputBuffer.length <= MAX_OUTPUT_BYTES || quality <= 40) {
      break
    }
    quality -= 10
  }

  return { buffer: outputBuffer, contentType: 'image/webp' }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Sesi login telah berakhir. Silakan login kembali.' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file gambar yang dipilih' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Hanya file gambar (JPG, PNG, WebP) yang diizinkan' }, { status: 400 })
    }

    // Validate original file size (15MB max before compression)
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ukuran file terlalu besar (maksimal 15MB)' }, { status: 400 })
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
      console.warn('Sharp compression skipped/failed, using original buffer:', compressError)
    }

    // Create unique filename
    const uniqueId = Date.now().toString() + '-' + Math.round(Math.random() * 1e9)
    const fileExt = isCompressed ? 'webp' : (file.name.split('.').pop() || 'jpg').toLowerCase()
    const fileName = `upload-${uniqueId}.${fileExt}`

    const supabase = getAdminSupabase()

    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(fileName, finalBuffer, {
        contentType,
        upsert: true,
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json({ error: `Gagal mengunggah ke penyimpanan: ${uploadError.message}` }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(fileName)

    console.log(`[Upload Success] ${(file.size / 1024).toFixed(1)}KB -> ${(finalBuffer.length / 1024).toFixed(1)}KB (${fileExt}) URL: ${publicUrl}`)

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (error: any) {
    console.error('Upload API Fatal Error:', error)
    return NextResponse.json({ 
      error: error?.message || 'Terjadi kesalahan saat memproses gambar.' 
    }, { status: 500 })
  }
}
