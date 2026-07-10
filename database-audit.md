# 🗄️ Database Audit — MI Attaqwa 15 Babelan

> **Project:** `ziijftyfmhpnlqcfhtht` · Supabase · Region: ap-northeast-1
> **Audit Date:** 2026-07-09
> **Total Tabel Ditemukan:** 23 tabel
> **Tabel Dihapus:** 4 tabel (tidak terpakai)
> **Tabel Aktif:** 19 tabel

---

## 📋 Ringkasan Status

| Status | Jumlah |
|--------|--------|
| ✅ Aktif & digunakan | 15 tabel |
| 🟡 Ada UI tapi belum ada query | 3 tabel |
| ⚠️ Legacy (ada query, data kosong) | 1 tabel |
| 🗑️ Dihapus (tidak terpakai sama sekali) | 4 tabel |

---

## ✅ Tabel Aktif — Dipertahankan

### 👤 Modul Pengguna & Autentikasi

---

#### `admins`
- **Rows:** 2
- **Fungsi:** Menyimpan data admin/operator sistem portal MI15.
- **Kolom penting:** `name`, `email`, `password_hash`, `role`
- **Role yang ada:** `superadmin`, `admin`, `kepsek`
- **Digunakan di:**
  - `POST/GET /api/users` — CRUD admin
  - `POST /api/auth/login` — login portal admin
  - Relasi: `spp_invoices.verified_by`, `spp_transactions.admin_id`, `tabungan_transaksi.admin_id`

---

#### `students`
- **Rows:** 237
- **Fungsi:** Tabel **induk utama** data siswa. Hampir semua tabel lain mereferensi tabel ini.
- **Kolom penting:** `name`, `student_number` (NISN), `class`, `class_id`, `parent_name`, `parent_phone`, `parent_email`, `is_active`, `image`
- **Digunakan di:**
  - `GET /api/students` — daftar siswa
  - `GET /api/students/[id]` — detail siswa
  - `GET /api/spp/manage` — generate tagihan SPP
  - Hampir semua modul keuangan & absensi

---

#### `student_accounts`
- **Rows:** 237
- **Fungsi:** Akun login portal wali murid. Dibuat otomatis saat siswa didaftarkan.
- **Kolom penting:** `student_id` (FK), `username`, `password_hash`
- **Relasi:** 1:1 dengan `students`
- **Digunakan di:**
  - `POST /api/auth/parent/login` — login wali murid
  - `POST /api/students` — auto-create saat tambah siswa

---

#### `staffs`
- **Rows:** 39
- **Fungsi:** Data guru & staf sekolah.
- **Kolom penting:** `name`, `nip`, `position`, `subject`, `phone`, `email`
- **Digunakan di:**
  - `GET /api/guru` — daftar guru dengan jadwal kelas
  - Relasi: `classrooms.homeroom_teacher_id`, `classroom_schedules.teacher_id`, `staff_attendance.staff_id`

---

### 🏫 Modul Kelas & Akademik

---

#### `classrooms`
- **Rows:** 12
- **Fungsi:** Data kelas yang ada di sekolah.
- **Kolom penting:** `name` (misal: "6A"), `capacity`, `homeroom_teacher_id` (FK ke `staffs`)
- **Digunakan di:**
  - `GET /api/students` — filter siswa per kelas
  - Dashboard attendance chart
  - Relasi: `students.class_id`, `classroom_attendances.classroom_id`, `classroom_schedules.classroom_id`

---

#### `classroom_attendances`
- **Rows:** 18
- **Fungsi:** Rekap absensi siswa per sesi/tanggal di kelas tertentu.
- **Kolom penting:** `student_id`, `classroom_id`, `date`, `status` (hadir/sakit/izin/alpha)
- **Digunakan di:**
  - `GET /parent/dashboard` — menampilkan rekap absensi anak ke wali murid
  - Dashboard admin — chart absensi

---

#### `classroom_schedules`
- **Rows:** 0 *(belum ada data)*
- **Fungsi:** Jadwal mata pelajaran per kelas: hari, jam, guru pengajar, mata pelajaran.
- **Kolom penting:** `classroom_id`, `teacher_id`, `subject`, `day`, `start_time`, `end_time`
- **Digunakan di:**
  - `GET /api/schedules` — CRUD jadwal
  - `GET /api/guru` — embed jadwal ke data guru

---

#### `classroom_infos`
- **Rows:** 0 *(belum ada data)*
- **Fungsi:** Pengumuman atau informasi penting spesifik per kelas (dari wali kelas ke orang tua).
- **Kolom penting:** `classroom_id`, `title`, `content`, `attachment_url`, `created_by`
- **Digunakan di:**
  - `GET/POST/DELETE /api/infos` — CRUD info kelas

---

#### `staff_attendance`
- **Rows:** 1
- **Fungsi:** Rekap kehadiran guru/staf sekolah per hari.
- **Kolom penting:** `staff_id`, `date`, `status`, `note`
- **Digunakan di:**
  - Modul manajemen guru di portal admin

---

### 💰 Modul Keuangan — SPP

---

#### `spp_invoices`
- **Rows:** 237
- **Fungsi:** **Sistem SPP utama yang aktif.** Tagihan SPP bulanan per siswa yang di-generate oleh admin.
- **Kolom penting:** `student_id`, `month`, `year`, `amount`, `status` (unpaid/paid/late), `due_date`, `verified_by`, `paid_at`
- **Digunakan di:**
  - `GET/POST/PATCH/DELETE /api/spp/manage` — kelola tagihan SPP
  - `GET /parent/dashboard` — tampil tagihan ke wali murid
  - `GET /parent/dashboard/spp` — detail SPP wali murid

---

#### `spp_transactions`
- **Rows:** 0 *(belum ada data)*
- **Fungsi:** Log transaksi setiap kali pembayaran SPP diproses. Mencatat admin yang memverifikasi.
- **Kolom penting:** `invoice_id`, `student_id`, `admin_id`, `amount`, `payment_method`, `created_at`
- **Relasi:** FK ke `spp_invoices`, `students`, `admins`
- **Digunakan di:**
  - `GET /api/spp/transactions` — riwayat transaksi SPP
  - Dashboard admin — 5 transaksi terakhir

---

#### `spp_payments` ⚠️ Legacy
- **Rows:** 0
- **Status:** **LEGACY** — Sistem SPP lama, sudah digantikan oleh `spp_invoices` + `spp_transactions`.
- **Fungsi:** Sistem pembayaran SPP versi pertama (per bulan dengan field month sebagai string).
- **Kolom penting:** `student_id`, `account_id`, `month`, `year`, `amount`, `status`, `due_date`
- **Masih direferensi di:**
  - `GET /api/students/[id]` — select embed `spp_payments (*)`
  - `/students/[id]/page.tsx` — tab "Riwayat SPP" masih render dari tabel ini
- **Catatan:** Data kosong, tapi ada query aktif. Perlu migrasi kode ke `spp_invoices` sebelum dihapus.

---

### 💰 Modul Keuangan — Tabungan Siswa

---

#### `tabungan_siswa`
- **Rows:** 1
- **Fungsi:** Rekening tabungan siswa — menyimpan saldo aktif. Dibuat otomatis per siswa.
- **Kolom penting:** `student_id`, `balance`, `updated_at`
- **Relasi:** 1:1 dengan `students`
- **Digunakan di:**
  - `GET /api/savings` — daftar tabungan semua siswa
  - `GET /api/savings/[studentId]` — detail tabungan
  - `GET /api/savings/summary` — total tabungan keseluruhan
  - `GET /parent/dashboard` — saldo tabungan anak
  - RPC `process_tabungan` — update balance otomatis saat transaksi

---

#### `tabungan_transaksi`
- **Rows:** 1
- **Fungsi:** Riwayat transaksi tabungan (setor & tarik). Setiap transaksi masuk ke sini dan memperbarui `tabungan_siswa.balance` via RPC.
- **Kolom penting:** `student_id`, `admin_id`, `type` (setor/tarik), `amount`, `note`, `created_at`
- **Relasi:** FK ke `students` & `admins`
- **Digunakan di:**
  - `POST /api/savings/transaction` — via RPC `process_tabungan`
  - `GET /api/savings/[studentId]` — riwayat transaksi per siswa
  - `GET /api/savings/summary` — rekap transaksi hari ini
  - `GET /api/parent/savings` — riwayat transaksi untuk wali murid

---

### 📣 Modul Konten & Website

---

#### `posts`
- **Rows:** 2
- **Fungsi:** Artikel/berita/pengumuman sekolah untuk halaman frontend publik.
- **Kolom penting:** `title`, `content`, `thumbnail`, `category`, `slug`, `is_published`, `author`, `created_at`
- **Digunakan di:**
  - `GET/POST/PATCH /api/posts` — CRUD artikel
  - Frontend `NewsSection.tsx` — tampil di halaman utama
  - `/content/posts` — manajemen di portal admin

---

#### `activity_logs`
- **Rows:** 1
- **Fungsi:** Audit trail — mencatat semua aksi penting yang dilakukan admin (tambah/edit/hapus user, dll).
- **Kolom penting:** `admin_id`, `action`, `target`, `description`, `created_at`
- **Digunakan di:**
  - `POST /api/users` & `POST /api/users/[id]` — auto-insert saat ada perubahan user
  - `/reports/logs` — halaman laporan aktivitas admin

---

### 🟡 Tabel Belum Aktif (Ada UI, Belum Ada Query)

> Tabel ini **DIPERTAHANKAN** karena sudah ada halaman manajemen di sidebar portal admin. Tinggal implementasi query-nya.

---

#### `galleries`
- **Rows:** 0
- **Fungsi:** Galeri foto kegiatan/dokumentasi sekolah untuk halaman publik.
- **Kolom penting:** `title`, `description`, `image`, `category`, `created_at`
- **UI tersedia di:** `/content/galleries`
- **Status:** Halaman placeholder, query belum diimplementasikan.

---

#### `banners`
- **Rows:** 0
- **Fungsi:** Banner/hero slider untuk halaman utama website publik.
- **Kolom penting:** `title`, `description`, `image`, `link`, `is_active`, `created_at`
- **UI tersedia di:** `/content/banners`
- **Status:** Halaman placeholder, query belum diimplementasikan.

---

#### `testimonials`
- **Rows:** 0
- **Fungsi:** Testimoni dari orang tua/guru untuk ditampilkan di halaman publik.
- **Kolom penting:** `name`, `position`, `message`, `image`, `is_active`, `created_at`
- **UI tersedia di:** `/content/testimonials`
- **Status:** Halaman placeholder, query belum diimplementasikan.

---

## 🗑️ Tabel Dihapus

> Tabel berikut **sudah dihapus** karena tidak ada satu pun referensi di source code dan data tidak penting.

| Tabel | Rows Saat Dihapus | Alasan |
|-------|-------------------|--------|
| `saving_transactions` | 0 | Duplikat — sudah digantikan sepenuhnya oleh `tabungan_transaksi`. Tidak ada query aktif. |
| `school_finances` | 0 | Tidak pernah diimplementasikan. Tidak ada referensi di source code manapun. |
| `contacts` | 0 | Tidak pernah diimplementasikan. Form kontak frontend belum dibuat. |
| `User` | 1 | Sisa migrasi Prisma lama (PascalCase). Tidak ada query `.from('User')` di source code. Berisi 1 baris data dummy. |

---

## 🔗 Entity Relationship (ERD Ringkas)

```
┌─────────────┐     ┌──────────────────┐
│   students  │────▶│ student_accounts │  (1:1)
│   (237)     │     └──────────────────┘
│             │
│             │────▶┌────────────────────────┐
│             │     │ classroom_attendances  │  (1:N)
│             │     └────────────────────────┘
│             │
│             │────▶┌──────────────┐
│             │     │tabungan_siswa│  (1:1)
│             │     └──────────────┘
│             │
│             │────▶┌────────────────────┐
│             │     │tabungan_transaksi  │  (1:N)
│             │     └────────────────────┘
│             │
│             │────▶┌──────────────┐
│             │     │ spp_invoices │  (1:N)
│             │     └──────┬───────┘
│             │            │
│             │            └────▶┌──────────────────┐
│             │                  │ spp_transactions │  (1:N)
│             │                  └──────────────────┘
└─────────────┘

┌────────────┐     ┌──────────────┐
│ classrooms │────▶│   students   │  (1:N, via class_id)
│   (12)     │────▶│class_attend  │  (1:N)
│            │────▶│class_schedule│  (1:N)
│            │────▶│class_infos   │  (1:N)
└────────────┘

┌────────┐     ┌──────────────────┐
│ staffs │────▶│ classrooms       │  (wali kelas)
│  (39)  │────▶│class_schedules   │  (guru pengajar)
│        │────▶│ staff_attendance │  (1:N)
└────────┘

┌────────┐     ┌───────────────┐
│ admins │────▶│ spp_invoices  │  (verified_by)
│  (2)   │────▶│spp_transaction│  (admin_id)
│        │────▶│tab_transaksi  │  (admin_id)
│        │────▶│activity_logs  │  (1:N)
└────────┘
```

---

## ⚠️ Catatan & Rekomendasi

### 1. `spp_payments` perlu dimigrasikan
Tab "Riwayat SPP" di halaman `/students/[id]` masih membaca dari `spp_payments` (sistem lama).
Harus dimigrasikan untuk membaca dari `spp_invoices` agar konsisten, lalu tabel `spp_payments` bisa dihapus.

```typescript
// ❌ Sekarang (lama):
.select('*, student_accounts (*), spp_payments (*)')

// ✅ Seharusnya (baru):
.select('*, student_accounts (*), spp_invoices (*)')
```

### 2. RLS belum diaktifkan di beberapa tabel penting
Tabel berikut **belum mengaktifkan Row Level Security (RLS)**:
- `posts`, `staffs`, `students`, `admins`, `student_accounts`
- `spp_payments`, `staff_attendance`, `activity_logs`

> ⚠️ Ini berarti siapapun yang punya `anon key` bisa membaca/menulis data tersebut langsung via Supabase client. Pastikan akses dilindungi via API route (server-side) dan pertimbangkan untuk mengaktifkan RLS dengan policy yang tepat.

### 3. `classroom_schedules` & `classroom_infos` — data kosong
Fitur jadwal kelas dan info kelas sudah ada API-nya tapi belum pernah diisi data. Perlu ditambahkan UI untuk input data di portal admin.

---

*Dibuat oleh: Database Audit Tool — Antigravity AI*
