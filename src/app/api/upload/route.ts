import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { getAdminSupabase } from "@/lib/supabase"
import { getAnySession } from "@/lib/session"

export const runtime = 'nodejs'

// Target max file size in bytes (300KB)
const MAX_OUTPUT_BYTES = 300 * 1024

/**
 * Compress an image buffer using sharp:
 *  1. Auto-orient from EXIF (.rotate()) — crucial for smartphone camera photos
 *  2. Downscale if dimensions exceed 1600px (keeps text sharp while reducing megabyte memory usage)
 *  3. Convert to WebP starting at quality 80, stepping down to 40 if needed
 */
async function compressToWebP(input: Buffer): Promise<{ buffer: Buffer; contentType: string }> {
  try {
    let sharpInstance = sharp(input, { failOn: 'none' }).rotate()
    const metadata = await sharpInstance.metadata()

    const maxDim = 1600
    if ((metadata.width && metadata.width > maxDim) || (metadata.height && metadata.height > maxDim)) {
      sharpInstance = sharpInstance.resize({
        width: metadata.width && metadata.width > maxDim ? maxDim : undefined,
        height: metadata.height && metadata.height > maxDim ? maxDim : undefined,
        fit: 'inside',
        withoutEnlargement: true,
      })
    }

    let quality = 80
    let outputBuffer = await sharpInstance
      .webp({ quality, effort: 4, lossless: false })
      .toBuffer()

    while (outputBuffer.length > MAX_OUTPUT_BYTES && quality > 40) {
      quality -= 15
      outputBuffer = await sharp(input, { failOn: 'none' })
        .rotate()
        .resize({
          width: metadata.width && metadata.width > maxDim ? maxDim : undefined,
          height: metadata.height && metadata.height > maxDim ? maxDim : undefined,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality, effort: 4, lossless: false })
        .toBuffer()
    }

    return { buffer: outputBuffer, contentType: 'image/webp' }
  } catch (err) {
    console.warn('Sharp WebP compression failed, attempting basic fallback:', err)
    // Fallback: try basic webp without resize
    const basicWebp = await sharp(input, { failOn: 'none' })
      .rotate()
      .webp({ quality: 75 })
      .toBuffer()
    return { buffer: basicWebp, contentType: 'image/webp' }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate: Allow both Admin and Parent sessions
    const session = await getAnySession(request)
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

    // Read file as ArrayBuffer & Buffer
    const arrayBuffer = await file.arrayBuffer()
    const inputBuffer = Buffer.from(arrayBuffer)

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

    // CRITICAL FIX FOR "SharedArrayBuffer is not allowed":
    // Allocate a brand-new unshared Uint8Array copy and wrap in Blob or pass directly
    const cleanUint8Array = new Uint8Array(finalBuffer.byteLength)
    cleanUint8Array.set(finalBuffer)
    const fileBlob = new Blob([cleanUint8Array], { type: contentType })

    const supabase = getAdminSupabase()

    // Upload to Supabase storage using isolated Blob
    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(fileName, fileBlob, {
        contentType,
        cacheControl: '31536000',
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

    console.log(`[Upload Success] User: ${session.name} (${session.role}) | ${(file.size / 1024).toFixed(1)}KB -> ${(cleanUint8Array.byteLength / 1024).toFixed(1)}KB (${fileExt}) URL: ${publicUrl}`)

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (error: any) {
    console.error('Upload API Fatal Error:', error)
    return NextResponse.json({ 
      error: error?.message || 'Terjadi kesalahan saat memproses gambar.' 
    }, { status: 500 })
  }
}

