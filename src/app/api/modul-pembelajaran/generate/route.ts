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

    // Try Google AI Studio (Gemini), DeepSeek, OpenAI
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY
    const deepseekKey = process.env.DEEPSEEK_API_KEY
    const openaiKey = process.env.OPENAI_API_KEY

    let resultText = ''
    let lastError = ''

    // === Attempt 1: Google AI Studio (Gemini) ===
    if (geminiKey) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemMsg}\n\n${prompt}` }]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              responseMimeType: 'application/json'
            }
          })
        })

        if (res.ok) {
          const geminiData = await res.json()
          resultText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''
          console.log('AI generated via Google AI Studio (Gemini)')
        } else {
          const errText = await res.text()
          console.warn('Google AI Studio failed. Status:', res.status, errText)
          lastError = `Google AI Studio: ${errText}`
        }
      } catch (e: any) {
        console.warn('Google AI Studio network error:', e.message)
        lastError = e.message
      }
    }

    if (!resultText) {
      return NextResponse.json({ error: `Semua layanan AI gagal merespons. Detail: ${lastError}` }, { status: 503 })
    }

    
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
