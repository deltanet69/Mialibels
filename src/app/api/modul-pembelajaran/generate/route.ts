import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { title, subject, grade, phase } = await request.json()

    if (!title || !subject || !grade || !phase) {
      return NextResponse.json({ error: 'Informasi dasar tidak lengkap' }, { status: 400 })
    }

    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key AI (Deepseek) belum dikonfigurasi.' }, { status: 500 })
    }

    const prompt = `
      Anda adalah asisten ahli penyusun Kurikulum Madrasah yang berpengalaman dengan standar KMA 1503 Tahun 2025 dan KMA 450 Tahun 2024.
      Tugas Anda adalah merumuskan rancangan Modul Pembelajaran berdasarkan informasi berikut:
      - Judul Modul: ${title}
      - Mata Pelajaran: ${subject}
      - Kelas: ${grade}
      - Fase: ${phase}
      
      Buatkan rancangan pembelajaran dengan gaya bahasa yang human-readable, mudah dipahami guru, dan sesuai kurikulum. Jangan menggunakan kalimat robotik.
      Berikan respon murni dalam format JSON (tanpa tag markdown \`\`\`json) dengan struktur yang sama persis seperti ini:
      {
        "learning_outcomes": "Teks Capaian Pembelajaran (CP) sesuai fase",
        "learning_objectives": ["Tujuan 1", "Tujuan 2", "Tujuan 3"],
        "learning_flow": "Alur Tujuan Pembelajaran (ATP) yang logis",
        "core_materials": ["Materi 1", "Materi 2", "Materi 3"],
        "teaching_method": "Metode pembelajaran yang disarankan (misal: Problem Based Learning dll)",
        "assessment_diagnostic": "Pertanyaan pemantik untuk asesmen awal",
        "assessment_formative": "Ide penilaian saat proses belajar",
        "assessment_summative": "Ide evaluasi akhir",
        "teacher_reflection": "1-2 kalimat pertanyaan refleksi untuk guru",
        "student_reflection": "1-2 kalimat pertanyaan refleksi untuk siswa"
      }
    `

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that strictly outputs valid JSON matching the requested schema. No other text. Make sure keys are exactly as requested.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('AI API Error:', errorText)
      throw new Error('Gagal menghubungi layanan AI.')
    }

    const aiData = await response.json()
    const resultText = aiData.choices[0].message.content
    
    let parsedResult;
    try {
      parsedResult = JSON.parse(resultText)
    } catch (e) {
      console.error('Failed to parse AI JSON', resultText)
      throw new Error('Format respon AI tidak valid.')
    }

    return NextResponse.json({ success: true, data: parsedResult })

  } catch (error: any) {
    console.error('Error generating AI:', error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}
