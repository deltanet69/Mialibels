import { NextRequest, NextResponse } from 'next/server';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const SCHOOL_KNOWLEDGE = `
=== PROFIL MADRASAH ===
Nama Resmi: MI Attaqwa 15 Babelan
NPSN: 60709253
Jenis: Madrasah Ibtidaiyah (Setara SD, berbasis Islam)
Yayasan: Yayasan Attaqwa (didirikan oleh Pahlawan Nasional KH. Noer Alie)
Status: Akreditasi A (Unggul) — SK No. 763/BAN-SM/SK/2019
Berdiri: 1970 (50+ tahun mengabdi)
Kurikulum: KMA Nomor 1503 Tahun 2025 (Kemenag)
Tagline: Mendidik Generasi Islami, Berkarakter Pejuang Sejati

=== VISI & MISI ===
VISI: "Terwujudnya generasi yang shalih, cerdas, berdaya saing, dan berkarakter pejuang berdasarkan nilai-nilai Islam Ahlussunnah Wal Jamaah."

MISI:
1. Kurikulum Integratif — memadukan ilmu agama, sains, dan kurikulum nasional KMA 1503/2025
2. Pembiasaan Karakter Islami — shalat dhuha/dzuhur berjamaah, hafalan Juz 30, keteladanan
3. Pembelajaran Aktif & Kreatif — metode interaktif dan ramah anak
4. Literasi Digital Sejak Dini — komputer modern, kecakapan abad 21
5. Jiwa Pejuang & Cinta Tanah Air — warisan KH. Noer Alie
6. Lingkungan Asri & Ramah Anak — bebas perundungan, aman, nyaman, toleran

=== PROGRAM UNGGULAN ===
A. KELAS REGULER
- Kurikulum nasional + Kemenag (Al-Qur'an Hadits, Aqidah Akhlak, Fikih, SKI, Bahasa Arab)
- Shalat dhuha/dzuhur berjamaah setiap hari
- Pembiasaan hafalan Juz 30 dan surat-surat pilihan
- Ekstrakurikuler pilihan
- Maksimal 30 siswa per kelas

B. KELAS FULLDAY MADRASAH (Program Unggulan)
- Semua program reguler PLUS:
- Tahfidz Al-Qur'an intensif (target Juz 30 + Surat Yasin, Al-Mulk, Ar-Rahman)
- Makan siang bersama
- Aktivitas sore terbimbing
- Kuota sangat terbatas: maks. 30 siswa per angkatan

=== AKADEMIK & KEUNGGULAN ===
- Pembelajaran Aktif & Ceria: diskusi, praktik langsung, proyek kreatif
- Pendekatan Personal Guru: rasio guru-murid ideal
- Penguatan Calistung Dasar di kelas awal
- Hafalan Al-Qur'an (Tahfidz): Juz 30 + surat pilihan
- Praktik Ibadah & Adab: wudhu, shalat, doa sehari-hari
- Literasi Digital Sejak Dini: komputer, logika, teknologi positif

=== FASILITAS ===
1. Ruang Kelas Ber-AC & Interaktif (proyektor digital, meja ergonomis)
2. Laboratorium Komputer & IT (PC modern untuk literasi digital & ANBK)
3. Mushola Ibadah Santri (shalat dhuha/dzuhur, bimbingan tahsin)
4. Perpustakaan Literasi Islami (buku cerita, ensiklopedia, pojok baca)
5. Lapangan Olahraga & Area Bermain (outdoor, aman, ramah anak)
6. CCTV 24 Jam & Sistem One-Gate (keamanan non-stop)

=== EKSTRAKURIKULER ===
- Pramuka, Marawis, Futsal, Drumband, dan kegiatan lainnya

=== PRESTASI ===
- Akreditasi A (Unggul) — BAN-SM Resmi (SK No. 763/BAN-SM/SK/2019)
- Madrasah Unggulan Kecamatan Babelan (rujukan utama masyarakat)
- Juara Festival Anak Sholeh & MAPSI (tahfidz, pidato islami, cerdas cermat)
- Program Tahfidz Santri Bersanad (100% lulusan hafal Juz 30)

=== INFORMASI SPMB/PPDB 2027/2028 ===
Tahun Ajaran: 2027/2028
Total Kuota: 120 siswa baru (4 Rombongan Belajar @ 30 siswa)
  - Kelas Fullday: maks. 30 siswa
  - Kelas Reguler: sisa dari total 120

JADWAL:
- Pembukaan: Mulai Bulan Oktober
- Sistem: Satu gelombang tunggal — tutup otomatis saat kuota terpenuhi
- PENTING: Tidak ada gelombang susulan

SYARAT UMUM:
1. Batas Usia Minimal: 6 tahun 5 bulan per 1 Juli 2027
2. Beragama Islam
3. Berkomitmen mengikuti shalat berjamaah dan program tahfidz
4. Orang tua bersedia mematuhi tata tertib madrasah

BIAYA PENDAFTARAN: Rp 300.000
Cara Bayar: Transfer Bank BTN (No. Rek: 00129-01-30-00015-9 a.n MI ATTAQWA 15 BABELAN) atau QRIS

DOKUMEN YANG DIPERLUKAN (diserahkan saat verifikasi):
1. Fotokopi Akta Kelahiran — 2 lembar
2. Fotokopi Kartu Keluarga (KK) — 2 lembar (update barcode Disdukcapil)
3. Fotokopi KTP Orang Tua/Wali — 2 lembar (Ayah & Ibu)
4. Pas Foto Siswa 3x4 terbaru — 4 lembar (background merah)
5. Surat Keterangan Sehat — 1 berkas (dari Dokter/Puskesmas)
6. Ijazah/SKHU RA/TK — 2 lembar (jika ada)

Catatan: Berkas fisik dimasukkan ke dalam map merah (putra) / hijau (putri), dibawa saat verifikasi observasi di sekretariat madrasah.

LINK DAFTAR ONLINE: https://spmb.miattaqwa15.sch.id

=== LOKASI & KONTAK ===
Alamat: Jl. Raya Ps. Babelan No.1, RT.05/RW.01, Babelan Kota, Kec. Babelan, Kabupaten Bekasi, Jawa Barat 17610
Email: info@miattaqwa15.sch.id
WhatsApp Admin: https://wa.me/6281288888888 (hubungi untuk informasi lebih lanjut)

JAM OPERASIONAL:
- Hari: Senin - Jumat
- Jam Pelayanan: 07:00 - 14:00 WIB

=== KONTAK PPDB/SPMB ===
Untuk informasi pendaftaran lebih lanjut, silakan hubungi panitia SPMB via WhatsApp atau kunjungi website resmi di https://spmb.miattaqwa15.sch.id
`;

const SYSTEM_PROMPT = `Anda adalah "Assistance MI 15", asisten virtual resmi MI Attaqwa 15 Babelan. Anda membantu pengunjung website mendapatkan informasi tentang madrasah dengan ramah, singkat, dan akurat.

${SCHOOL_KNOWLEDGE}

=== ATURAN WAJIB ===
1. JAWAB BERDASARKAN DATA: Gunakan HANYA informasi dari knowledge base di atas. Jangan mengarang fakta.
2. RAHASIA TERLINDUNGI: JANGAN pernah memberikan data siswa, guru, nilai, data keuangan internal, data orang tua, atau informasi database sistem. Jika ditanya, jawab: "Mohon maaf, data tersebut bersifat rahasia dan terlindungi. Saya tidak dapat memberikan informasi tersebut."
3. JIKA TIDAK TAHU: Jawab "Untuk informasi lebih detail, silakan hubungi kami di [WhatsApp Admin](https://wa.me/6281288888888) atau email info@miattaqwa15.sch.id"
4. FORMAT: Jawaban singkat, padat, ramah. Gunakan **bold** untuk poin penting. Gunakan daftar bullet (•) untuk info yang banyak.
5. BAHASA: Gunakan Bahasa Indonesia yang baik. Boleh sesekali gunakan salam islami seperti "Alhamdulillah" atau "Insyaallah" agar terasa lebih hangat dan sesuai karakter madrasah.
6. JANGAN MELANTUR: Fokus pada topik yang ditanyakan. Tidak perlu memberikan informasi yang tidak relevan.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
    }

    // Limit context window to last 10 messages to save tokens
    const recentMessages = messages.slice(-10);

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://miattaqwa15.sch.id",
        "X-Title": "MI Attaqwa 15 AI Assistant",
      },
      body: JSON.stringify({
        model: "liquid/lfm-2.5-2.6b:free",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...recentMessages
        ],
        temperature: 0.7,
        max_tokens: 250,
      }),
    });

    if (!res.ok) {
      // Fallback to minimax if nemotron fails
      const fallbackRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://miattaqwa15.sch.id",
          "X-Title": "MI Attaqwa 15 AI Assistant",
        },
        body: JSON.stringify({
          model: "qwen/qwen3.8-27b:free",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...recentMessages
          ],
          temperature: 0.7,
          max_tokens: 250,
        }),
      });

      if (!fallbackRes.ok) {
        throw new Error("Both models failed");
      }

      const fallbackData = await fallbackRes.json();
      return NextResponse.json({ reply: fallbackData.choices[0].message.content });
    }

    const data = await res.json();
    return NextResponse.json({ reply: data.choices[0].message.content });
  } catch (error: unknown) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ 
      error: "Maaf, asisten sedang tidak tersedia. Silakan hubungi kami langsung via WhatsApp." 
    }, { status: 500 });
  }
}
