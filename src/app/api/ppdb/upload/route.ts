import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { getAdminSupabase } from '@/lib/supabase'

export const runtime = 'nodejs'

const MAX_OUTPUT_BYTES = 500 * 1024 // 500KB max for compressed image

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
    console.warn('PPDB Sharp WebP compression fallback:', err)
    const basicWebp = await sharp(input, { failOn: 'none' })
      .rotate()
      .webp({ quality: 75 })
      .toBuffer()
    return { buffer: basicWebp, contentType: 'image/webp' }
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folder = (formData.get('folder') as string) || 'ppdb'

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang dipilih' }, { status: 400 })
    }

    const isImage = file.type.startsWith('image/')
    const isPdf = file.type === 'application/pdf'

    if (!isImage && !isPdf) {
      return NextResponse.json({ error: 'Format file tidak didukung. Harap upload gambar (JPG/PNG/WebP) atau dokumen PDF.' }, { status: 400 })
    }

    // Limit original file size to 15MB
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ukuran file terlalu besar (maksimal 15MB).' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const inputBuffer = Buffer.from(arrayBuffer)

    let finalBuffer: Buffer
    let contentType: string
    let extension: string

    if (isImage) {
      const compressed = await compressToWebP(inputBuffer)
      finalBuffer = compressed.buffer
      contentType = compressed.contentType
      extension = 'webp'
    } else {
      finalBuffer = inputBuffer
      contentType = 'application/pdf'
      extension = 'pdf'
    }

    const safeName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30)
    const fileName = `${folder}/${Date.now()}_${safeName}.${extension}`

    // CRITICAL FIX FOR "SharedArrayBuffer is not allowed":
    // Allocate a brand-new unshared Uint8Array copy and wrap in Blob or pass directly
    const cleanUint8Array = new Uint8Array(finalBuffer.byteLength)
    cleanUint8Array.set(finalBuffer)
    const fileBlob = new Blob([cleanUint8Array], { type: contentType })

    const supabase: any = getAdminSupabase()

    // Upload to Supabase storage using clean isolated Blob
    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(fileName, fileBlob, {
        contentType,
        cacheControl: '31536000',
        upsert: true
      })

    if (uploadError) {
      console.error('Supabase PPDB upload error:', uploadError)
      return NextResponse.json({ error: 'Gagal mengupload file ke penyimpanan server: ' + uploadError.message }, { status: 500 })
    }

    const { data: publicUrlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(fileName)

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
      fileName,
      size: cleanUint8Array.byteLength
    })
  } catch (error: any) {
    console.error('PPDB Upload API Error:', error)
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan saat upload' }, { status: 500 })
  }
}
