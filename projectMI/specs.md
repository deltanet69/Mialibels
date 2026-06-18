# MI Attaqwa 15 Babelan Bekasi - Project Specification for AI Agent

## 🎯 PROJECT OVERVIEW

| Property | Value |
|----------|-------|
| Project Name | MI Attaqwa 15 - School Profile & Management System |
| School Name | MIS AT-TAQWA 15 (MI Attaqwa 15 Babelan Bekasi) |
| NPSN | 60709253 |
| Status | Swasta |
| Accreditation | A (Unggul) - SK No. 763/BAN-SM/SK/2019, 9 September 2019 |
| Established | 1 Januari 1970 |
| Address | Jl. Raya Pasar Babelan RT.05/RW.01, Kec. Babelan, Kab. Bekasi, Jawa Barat |
| Sub-district | Babelan (alternate spelling: Bebelan) |
| Area | 63.36 km² |
| Founder Foundation | KH. Noer Alie (Pahlawan Nasional) |
| Foundation Name | Yayasan Attaqwa |
| Head of School | H. Zarkasyi, S.Ag |
| Operator | Saldi Rusli |

---

## 🏗️ TECH STACK

| Category | Technology | Version |
|----------|------------|---------|
| Framework | Next.js | latest (App Router) |
| Styling | TailwindCSS | latest |
| Database | Supabase | PostgreSQL |
| Auth | Supabase Auth / NextAuth.js | - |
| Language | TypeScript | latest |

// MAKE SURE MOBILE RESPONSIVE SECARA PERFECT


---

## Font
Open sans condensed (Headline)
Open sans (body)

## COlor pallete

Primary: #009688 (Teal - Madrasah Logo Primary)
Secondary: #263238 (Dark Slate Gray - Headers)
Accent: #FF9800 (Orange - Action Buttons)
Light: #F5F5F5 (Backgrounds)
Text : #303030 (Text, body)
Dark: #0f172a (Dark Slate Gray - Headers)

Web background  : #EFF3FB
button : #002957 
Second button  : #F26430

## Icons
lucide react

---

## 🗄️ DATABASE SCHEMA

### ⚠️ CRITICAL INSTRUCTION FOR AI AGENT

**ALL TABLES MUST USE SUPABASE UUID PRIMARY KEY: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`**

**ALL TABLES MUST HAVE:**
- `created_at TIMESTAMPTZ DEFAULT NOW()`
- `updated_at TIMESTAMPTZ DEFAULT NOW()`

**REALTIME MUST BE ENABLED for:**
- `student_accounts`
- `saving_transactions`
- `spp_payments`
- `school_finances`

---

### FRONTEND TABLES

#### 1. posts

```sql
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    thumbnail TEXT,
    category TEXT NOT NULL CHECK (category IN ('berita', 'pengumuman', 'artikel', 'kegiatan')),
    slug TEXT UNIQUE NOT NULL,
    author TEXT NOT NULL,
    reading_time INT DEFAULT 1,
    view_count INT DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE galleries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    image TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('kegiatan', 'prestasi', 'fasilitas', 'acara')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


// Purpose: Menyimpan pesan dari form kontak.
// RLS Policy: INSERT untuk publik (tanpa auth). SELECT/UPDATE/DELETE hanya admin.

CREATE TABLE banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    image TEXT NOT NULL,
    link TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

Purpose: Banner carousel di halaman home.



CREATE TABLE testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    message TEXT NOT NULL,
    image TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

Purpose: Testimoni wali murid.


CREATE TABLE staffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    description TEXT,
    image TEXT,
    email TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

Purpose: Data guru dan karyawan.

CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    student_number TEXT UNIQUE NOT NULL,
    class TEXT NOT NULL,
    position TEXT,
    image TEXT,
    parent_name TEXT NOT NULL,
    parent_phone TEXT NOT NULL,
    parent_email TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

Purpose: Data siswa.
Constraint: student_number harus UNIQUE (format: NISN).


CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('superadmin', 'admin', 'kepsek', 'bendahara')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

Purpose: Data admin dengan akses CMS.

### Roles:
- superadmin - akses penuh, bisa kelola admin lain
- admin - kelola konten (posts, galleries, banners, testimonials)
- kepsek - lihat dashboard & laporan
- bendahara - kelola keuangan
Password: Harus di-hash dengan bcrypt.


CREATE TABLE student_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID UNIQUE NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    balance INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

Purpose: Menyimpan saldo tabungan setiap siswa.
Constraint: 1 siswa = 1 account (UNIQUE student_id).
Auto-creation: Trigger after_student_insert otomatis membuat account saat student ditambahkan.


CREATE TABLE saving_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES student_accounts(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('DEPOSIT', 'WITHDRAWAL')),
    amount INT NOT NULL CHECK (amount > 0),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

Purpose: Riwayat setor/tarik tabungan siswa.
Rules:
DEPOSIT = menambah balance student_accounts
WITHDRAWAL = mengurangi balance student_accounts
Amount tidak boleh 0 atau negatif.


CREATE TABLE spp_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES student_accounts(id) ON DELETE CASCADE,
    month TEXT NOT NULL,
    year INT NOT NULL,
    amount INT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PAID', 'UNPAID', 'LATE')),
    paid_at TIMESTAMPTZ,
    due_date DATE NOT NULL,
    late_fee INT DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, month, year)
);

Purpose: Pencatatan pembayaran SPP per siswa per bulan.

Rules:
status = 'PAID' → sudah bayar
status = 'UNPAID' → belum bayar
status = 'LATE' → bayar tapi melewati due_date, kena late_fee
Unique constraint: 1 siswa hanya punya 1 record per (month, year)


CREATE TABLE school_finances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    description TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    amount INT NOT NULL CHECK (amount > 0),
    category TEXT NOT NULL CHECK (category IN ('tabungan', 'spp', 'donasi', 'operasional', 'pembangunan', 'lainnya')),
    transaction_date DATE NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

Purpose: Kas sekolah (pemasukan & pengeluaran selain dari tabungan/SPP).

Examples:
INCOME: donasi, bantuan pemerintah, hasil bazar
EXPENSE: beli ATK, renovasi, kegiatan sekolah

