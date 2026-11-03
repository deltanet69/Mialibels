// @ts-nocheck
import { NextRequest, NextResponse } from "next/server"
import { getAdminSupabase } from "@/lib/supabase"
import { jwtVerify } from "jose"
import { getJwtSecretKey } from "@/lib/jwt"

export const runtime = "nodejs"

const MAX_OUTPUT_BYTES = 300 * 1024 // 300 KB target

async function compressImage(input: Buffer): Promise<{ buffer: Buffer; ext: string; contentType: string }> {
  const sharp = (await import("sharp")).default
  // Validasi dulu: buffer harus gambar UTUH yang metadata + dimensinya bisa dibaca.
  // File terpotong (mis. header PNG saja) gagal di sini dan ditolak, bukan disimpan.
  const meta0 = await sharp(input, { failOn: "error" }).metadata().catch(() => null)
  if (!meta0 || !meta0.width || !meta0.height) {
    throw new Error("INVALID_IMAGE")
  }
  // Probe decode PENUH: file yang header-nya utuh tapi datanya terpotong di
  // tengah (IDAT) lolos metadata, tapi gagal di sini.
  try {
    await sharp(input, { failOn: "error" }).raw().toBuffer()
  } catch {
    throw new Error("INVALID_IMAGE")
  }
  try {
    let s = sharp(input, { failOn: "none" }).rotate()
    const meta = await s.metadata()
    const maxDim = 1600
    if ((meta.width && meta.width > maxDim) || (meta.height && meta.height > maxDim)) {
      s = s.resize({
        width: meta.width && meta.width > maxDim ? maxDim : undefined,
        height: meta.height && meta.height > maxDim ? maxDim : undefined,
        fit: "inside",
        withoutEnlargement: true,
      })
    }
    let quality = 80
    let buf = await s.webp({ quality, effort: 4, lossless: false }).toBuffer()
    while (buf.length > MAX_OUTPUT_BYTES && quality > 40) {
      quality -= 15
      buf = await sharp(input, { failOn: "none" })
        .rotate()
        .resize({
          width: meta.width && meta.width > maxDim ? maxDim : undefined,
          height: meta.height && meta.height > maxDim ? maxDim : undefined,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality, effort: 4, lossless: false })
        .toBuffer()
    }
    return { buffer: buf, ext: "webp", contentType: "image/webp" }
  } catch (err) {
    console.warn("[upload-proof] Sharp compression failed, using original:", err)
    // Fallback: simpan file asli dengan label format ASLINYA (jangan paksa .jpg —
    // PNG berlabel jpeg membuat gambar tidak bisa dibuka di sebagian penampil).
    if (meta0.format === "png") return { buffer: input, ext: "png", contentType: "image/png" }
    if (meta0.format === "webp") return { buffer: input, ext: "webp", contentType: "image/webp" }
    return { buffer: input, ext: "jpg", contentType: "image/jpeg" }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate: require parent_session
    const sessionCookie = request.cookies.get("parent_session")?.value
    if (!sessionCookie) {
      return NextResponse.json({ error: "Sesi login telah berakhir. Silakan login kembali." }, { status: 401 })
    }

    const secret = getJwtSecretKey()
    let payload: any
    try {
      const result = await jwtVerify(sessionCookie, secret)
      payload = result.payload
    } catch {
      return NextResponse.json({ error: "Sesi tidak valid atau sudah kadaluarsa." }, { status: 401 })
    }

    const studentId = payload.sub as string

    // Parse form data
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const type = (formData.get("type") as string) || "spp"
    const invoiceId = formData.get("invoiceId") as string | null
    const amountStr = formData.get("amount") as string | null

    if (!file) {
      return NextResponse.json({ error: "Tidak ada file gambar yang dipilih." }, { status: 400 })
    }
    if (!invoiceId) {
      return NextResponse.json({ error: "Invoice ID tidak ditemukan." }, { status: 400 })
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Hanya file gambar (JPG, PNG, WebP) yang diizinkan." }, { status: 400 })
    }
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: "Ukuran file terlalu besar (maksimal 15MB)." }, { status: 400 })
    }

    const adminSupabase = getAdminSupabase()

    // Verify invoice ownership
    const table = type === "spp" ? "spp_invoices" : "general_invoices"
    const { data: invoiceRaw, error: invErr } = await (adminSupabase as any)
      .from(table)
      .select("id, title, status, amount, paid_amount, student_id, students(name, class)")
      .eq("id", invoiceId)
      .maybeSingle()

    const invoice = invoiceRaw as any

    if (invErr || !invoice) {
      return NextResponse.json({ error: "Tagihan tidak ditemukan." }, { status: 404 })
    }
    if (invoice.student_id !== studentId) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 })
    }
    if (invoice.status === "PAID") {
      return NextResponse.json({ error: "Tagihan ini sudah lunas." }, { status: 400 })
    }

    // Compress & upload image
    const arrayBuffer = await file.arrayBuffer()
    const inputBuffer = Buffer.from(arrayBuffer)

    // Tolak file yang tidak terbaca utuh (terpotong di tengah jalan) — jangan
    // sampai tersimpan sebagai bukti rusak yang tidak bisa dibuka admin.
    if (inputBuffer.length !== file.size || inputBuffer.length < 1024) {
      return NextResponse.json({
        error: "File bukti tidak terbaca utuh (" + inputBuffer.length + " dari " + file.size + " byte). Periksa koneksi internet Anda, lalu coba unggah kembali.",
      }, { status: 422 })
    }

    let finalBuffer: Buffer
    let ext: string
    let contentType: string
    try {
      const compressed = await compressImage(inputBuffer)
      finalBuffer = compressed.buffer
      ext = compressed.ext
      contentType = compressed.contentType
    } catch {
      return NextResponse.json({
        error: "File gambar tidak valid atau rusak. Silakan pilih ulang foto/screenshot bukti transfer yang jelas, lalu coba lagi.",
      }, { status: 422 })
    }

    const uniqueId = Date.now() + "-" + Math.round(Math.random() * 1e9)
    const fileName = `bukti-${type}-${uniqueId}.${ext}`

    const cleanUint8 = new Uint8Array(finalBuffer.byteLength)
    cleanUint8.set(finalBuffer)
    const fileBlob = new Blob([cleanUint8], { type: contentType })

    const { error: uploadError } = await adminSupabase.storage
      .from("uploads")
      .upload(fileName, fileBlob, { contentType, cacheControl: "31536000", upsert: true })

    if (uploadError) {
      console.error("[upload-proof] Supabase upload error:", uploadError)
      return NextResponse.json({ error: "Gagal mengunggah ke penyimpanan: " + uploadError.message }, { status: 500 })
    }

    // Verifikasi objek yang tersimpan ukurannya sama persis dengan buffer yang
    // dikirim. Beda ukuran = tersimpan tidak utuh -> hapus dan minta unggah ulang.
    const { data: listed } = await adminSupabase.storage.from("uploads").list("", { search: fileName })
    const storedObj: any = (listed || []).find((o: any) => o.name === fileName)
    const storedSize = storedObj?.metadata?.size
    if (typeof storedSize === "number" && storedSize !== finalBuffer.length) {
      await adminSupabase.storage.from("uploads").remove([fileName])
      console.error("[upload-proof] Stored size mismatch:", storedSize, "vs", finalBuffer.length)
      return NextResponse.json({ error: "Unggahan tidak tersimpan utuh di server. Silakan coba unggah kembali." }, { status: 502 })
    }

    const { data: { publicUrl } } = adminSupabase.storage.from("uploads").getPublicUrl(fileName)

    // Update invoice status
    const nominal = amountStr ? Number(amountStr) : (invoice.amount - (invoice.paid_amount || 0))
    const { error: updateError } = await (adminSupabase as any)
      .from(table)
      .update({ status: "PENDING_VERIFICATION", bukti_transfer: publicUrl })
      .eq("id", invoiceId)

    if (updateError) {
      console.error("[upload-proof] Update error:", updateError)
      throw updateError
    }

    // Notifications (fire-and-forget, never block response)
    const studentInfo = (invoice as any)?.students
    const studentName = studentInfo?.name || payload.studentName || "Siswa"
    const studentClass = studentInfo?.class || payload.class || ""

    ;(adminSupabase as any).from("in_app_notifications").insert([
      {
        role: "admin",
        user_id: null,
        type: "PAYMENT",
        title: "Bukti Pembayaran Baru",
        message: "Bukti transfer " + (invoice.title || "tagihan") + " dari " + studentName + " (" + studentClass + ") menunggu verifikasi. Nominal: Rp " + nominal.toLocaleString("id-ID") + ".",
      },
      {
        role: "parent",
        user_id: studentId,
        type: "PAYMENT",
        title: "Bukti Pembayaran Terkirim",
        message: "Bukti transfer untuk " + (invoice.title || "tagihan") + " berhasil dikirim dan sedang menunggu verifikasi admin.",
      },
    ]).then(({ error }: { error: any }) => {
      if (error) console.warn("[upload-proof] Notification warning:", error)
    })

    console.log("[upload-proof] OK: student=" + studentName + " type=" + type + " invoice=" + invoiceId)

    return NextResponse.json({ success: true, url: publicUrl, message: "Bukti transfer berhasil diunggah!" })
  } catch (error: any) {
    console.error("[upload-proof] Fatal:", error)
    return NextResponse.json({
      error: error?.message || "Terjadi kesalahan saat memproses bukti transfer.",
    }, { status: 500 })
  }
}
