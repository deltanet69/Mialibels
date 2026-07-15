import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { title, subject, grade, phase } = await request.json()

    if (!title || !subject || !grade) {
      return NextResponse.json({ error: 'Informasi dasar tidak lengkap (Judul, Mapel, Kelas wajib diisi)' }, { status: 400 })
    }

    // Phase is auto-computed from grade if not provided
    const computedPhase = phase || (() => {
      const match = (grade as string).match(/\d+/)
      if (!match) return 'B'
      const g = parseInt(match[0], 10)
      if (g <= 2) return 'A'
      if (g <= 4) return 'B'
      return 'C'
    })()

    const prompt = `
      Anda adalah asisten ahli penyusun Kurikulum Madrasah yang berpengalaman dengan standar KMA 1503 Tahun 2025 dan KMA 450 Tahun 2024.
      Tugas Anda adalah merumuskan rancangan Modul Pembelajaran berdasarkan informasi berikut:
      - Judul Modul: ${title}
      - Mata Pelajaran: ${subject}
      - Kelas: ${grade}
      - Fase: ${computedPhase}
      
      Buatkan rancangan pembelajaran dengan gaya bahasa yang human-readable, mudah dipahami guru, dan sesuai kurikulum. Jangan menggunakan kalimat robotik.
      Berikan respon murni dalam format JSON (tanpa tag markdown) dengan struktur yang sama persis seperti ini:
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

    const systemMsg = 'You are a helpful assistant that strictly outputs valid JSON matching the requested schema. No other text. Make sure keys are exactly as requested.'

    // Try DeepSeek first, fall back to OpenAI
    const deepseekKey = process.env.DEEPSEEK_API_KEY
    const openaiKey = process.env.OPENAI_API_KEY

    let aiResponse: any = null
    let lastError = ''

    // === Attempt 1: Deepseek ===
    if (deepseekKey) {
      try {
        const res = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${deepseekKey}`
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: systemMsg },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            response_format: { type: "json_object" }
          })
        })

        if (res.ok) {
          aiResponse = await res.json()
          console.log('AI generated via DeepSeek')
        } else {
          const errText = await res.text()
          console.warn('DeepSeek failed, trying OpenAI. Status:', res.status, errText)
          lastError = `DeepSeek: ${errText}`
        }
      } catch (e: any) {
        console.warn('DeepSeek network error:', e.message)
        lastError = e.message
      }
    }

    // === Attempt 2: OpenAI fallback ===
    if (!aiResponse && openaiKey) {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemMsg },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            response_format: { type: "json_object" }
          })
        })

        if (res.ok) {
          aiResponse = await res.json()
          console.log('AI generated via OpenAI (fallback)')
        } else {
          const errText = await res.text()
          console.error('OpenAI also failed. Status:', res.status, errText)
          lastError = `OpenAI: ${errText}`
        }
      } catch (e: any) {
        console.error('OpenAI network error:', e.message)
        lastError = e.message
      }
    }

    if (!aiResponse) {
      throw new Error(`Semua layanan AI gagal merespons. Detail: ${lastError}`)
    }

    const resultText = aiResponse.choices[0].message.content
    
    let parsedResult;
    try {
      parsedResult = JSON.parse(resultText)
    } catch (e) {
      // Try to extract JSON from text if it contains extra content
      const jsonMatch = resultText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          parsedResult = JSON.parse(jsonMatch[0])
        } catch {
          console.error('Failed to parse AI JSON even after extraction:', resultText)
          throw new Error('Format respon AI tidak valid. Coba lagi.')
        }
      } else {
        console.error('No JSON found in AI response:', resultText)
        throw new Error('Format respon AI tidak valid. Coba lagi.')
      }
    }

    return NextResponse.json({ success: true, data: parsedResult })

  } catch (error: any) {
    console.error('Error generating AI:', error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}
