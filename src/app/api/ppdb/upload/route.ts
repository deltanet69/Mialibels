import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { getAdminSupabase } from '@/lib/supabase'

export const runtime = 'nodejs'

const MAX_OUTPUT_BYTES = 500 * 1024 // 500KB max for compressed image

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

    // Limit original file size to 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ukuran file terlalu besar (maksimal 10MB).' }, { status: 400 })
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

    const supabase: any = getAdminSupabase()

    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(fileName, finalBuffer, {
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
      size: finalBuffer.length
    })
  } catch (error: any) {
    console.error('PPDB Upload API Error:', error)
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan saat upload' }, { status: 500 })
  }
}
