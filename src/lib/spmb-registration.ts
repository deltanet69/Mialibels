// Validasi + pemetaan data pendaftaran SPMB — dipakai bersama oleh form publik dan CRUD admin
// supaya data yang tersimpan identik. Murni (tanpa akses DB) agar aman diimpor client maupun server.

const isFulldayText = (v: any) => !!v && String(v).toLowerCase().includes('fullday')

export function isFulldayRow(r: any): boolean {
  return isFulldayText(r?.student_nickname) || isFulldayText(r?.special_needs)
}

// Usia pada 16 Juli 2027: minimum 6 tahun 5 bulan
export function calculateAgeAsOfJuly16_2027(birthDateStr: string, cutoffYear = 2027) {
  let bYear: number, bMonth: number, bDay: number
  let cleanStr = birthDateStr
  if (cleanStr.includes('T')) cleanStr = cleanStr.split('T')[0]
  const parts = cleanStr.split('-').map(Number)
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    bYear = parts[0]
    bMonth = parts[1] - 1
    bDay = parts[2]
  } else {
    const d = new Date(birthDateStr)
    bYear = d.getFullYear()
    bMonth = d.getMonth()
    bDay = d.getDate()
  }

  const cMonth = 6
  const cDay = 16
  let years = cutoffYear - bYear
  let months = cMonth - bMonth
  let days = cDay - bDay

  if (days < 0) {
    months -= 1
    days += new Date(cutoffYear, cMonth, 0).getDate()
  }
  if (months < 0) {
    years -= 1
    months += 12
  }

  const isValid = years > 6 || (years === 6 && months >= 5)
  return { years, months, days, totalMonths: years * 12 + months, isValid }
}

export type ParsedRegistration =
  | { error: string }
  | { isFullday: boolean; fields: Record<string, any> }

/** Validasi input form (publik/admin) → kolom ppdb_registrations yang berasal dari input. */
export function parseRegistration(body: any): ParsedRegistration {
  const {
    student_name, nisn, birth_place, birth_date, gender,
    religion = 'Islam',
    class_program = 'regular',
    parent_name, parent_nik, parent_occupation,
    parent_religion = 'Islam',
    parent_relation = 'Ayah Kandung',
    parent_phone, parent_email, home_address,
    document_birth_certificate, document_family_card, document_parent_id, document_report_card,
    declaration_agreed,
    payment_method = 'transfer_btn',
    payment_proof_url
  } = body || {}

  if (!student_name?.trim() || !birth_place?.trim() || !birth_date) {
    return { error: 'Data calon siswa (Nama Lengkap, Tempat Lahir, Tanggal Lahir) wajib diisi lengkap.' }
  }
  if (!parent_name?.trim() || !parent_nik?.trim() || !parent_occupation?.trim() || !parent_phone?.trim() || !parent_email?.trim() || !home_address?.trim()) {
    return { error: 'Data orang tua/wali (Nama, NIK, Pekerjaan, No WA, Email, Alamat) wajib diisi lengkap.' }
  }
  if (!/^\d{16}$/.test(parent_nik.trim())) {
    return { error: 'NIK Orang Tua/Wali harus terdiri dari 16 digit angka.' }
  }
  if (!document_birth_certificate || !document_family_card || !document_parent_id) {
    return { error: 'Dokumen wajib (Akta Kelahiran Anak, Kartu Keluarga, dan KTP Orang Tua/Wali) wajib diunggah.' }
  }
  if (!declaration_agreed) {
    return { error: 'Anda wajib menyetujui Surat Pernyataan Calon Siswa & Wali Murid (Declaration Checklist) sebelum melanjutkan.' }
  }
  if (!payment_proof_url) {
    return { error: 'Bukti transfer biaya pendaftaran ke rekening Bank BTN sekolah wajib diunggah.' }
  }

  const age = calculateAgeAsOfJuly16_2027(birth_date, 2027)
  if (!age.isValid) {
    return {
      error: `Usia calon siswa pada 16 Juli 2027 adalah ${age.years} tahun ${age.months} bulan. Syarat usia minimum pendaftaran adalah 6 tahun 5 bulan pertanggal 16 Juli 2027 (lahir maksimal 16 Februari 2021).`
    }
  }

  const isFullday = String(class_program).toLowerCase() === 'fullday'
  const parent = {
    name: parent_name.trim(),
    nik: parent_nik.trim(),
    occupation: parent_occupation.trim(),
    phone: parent_phone.trim(),
    email: parent_email.trim()
  }

  return {
    isFullday,
    fields: {
      student_name: student_name.trim(),
      student_nickname: isFullday ? 'fullday' : 'regular',
      birth_place: birth_place.trim(),
      birth_date,
      gender: gender || 'Laki-laki',
      nisn: nisn ? nisn.trim() : null,
      previous_school: religion ? `Agama: ${religion}` : 'Agama: Islam',
      special_needs: isFullday ? 'Program Kelas Fullday (75 Siswa)' : 'Program Kelas Regular (75 Siswa)',
      medical_history: `Hubungan: ${parent_relation} | Agama Ortu: ${parent_religion}`,
      father_name: parent.name,
      father_nik: parent.nik,
      father_occupation: parent.occupation,
      father_phone: parent.phone,
      father_email: parent.email,
      mother_name: parent.name,
      mother_nik: parent.nik,
      mother_occupation: parent.occupation,
      mother_phone: parent.phone,
      mother_email: parent.email,
      home_address: home_address.trim(),
      document_birth_certificate: document_birth_certificate || null,
      document_family_card: document_family_card || null,
      document_parent_id: document_parent_id || null,
      document_report_card: document_report_card || null,
      payment_method: payment_method || 'transfer_btn',
      payment_proof_url
    }
  }
}

/** Kebalikan parseRegistration: baris DB → nilai awal form (untuk edit oleh admin). */
export function registrationToForm(r: any) {
  const after = (s: any, prefix: string) => {
    const m = String(s || '').match(new RegExp(prefix + ':\\s*([^|]+)'))
    return m ? m[1].trim() : ''
  }
  return {
    student_name: r.student_name || '',
    nisn: r.nisn || '',
    birth_place: r.birth_place || '',
    birth_date: String(r.birth_date || '').split('T')[0],
    gender: r.gender || 'Laki-laki',
    religion: after(r.previous_school, 'Agama') || 'Islam',
    class_program: isFulldayRow(r) ? 'fullday' : 'regular',
    parent_name: r.father_name || '',
    parent_nik: r.father_nik || '',
    parent_occupation: r.father_occupation || '',
    parent_religion: after(r.medical_history, 'Agama Ortu') || 'Islam',
    parent_relation: after(r.medical_history, 'Hubungan') || 'Ayah Kandung',
    parent_phone: r.father_phone || '',
    parent_email: r.father_email || '',
    home_address: r.home_address || '',
    document_birth_certificate: r.document_birth_certificate || '',
    document_family_card: r.document_family_card || '',
    document_parent_id: r.document_parent_id || '',
    document_report_card: r.document_report_card || '',
    declaration_agreed: true, // sudah disetujui saat mendaftar
    payment_method: r.payment_method || 'transfer_btn',
    payment_proof_url: r.payment_proof_url || ''
  }
}
