### MODUL PEMBELAJARAN INTERAKTIF

## TUJUAN

Membangun sistem manajemen modul pembelajaran yang memudahkan guru dalam:
1. **Membuat dan menyusun** modul ajar sesuai standar kurikulum madrasah
2. **Mengelola** modul ajar (edit, revisi, arsip)
3. **Berbagi** modul ajar antar guru
4. **Memonitor** ketersediaan modul oleh Kepala Madrasah
5. **Merekap** modul ajar per guru, per mapel, per kelas


### STANDAR KURIKULUM YANG DIGUNAKAN ###

Regulasi Acuan

| Regulasi                                         | Keterangan | 
| **KMA 1503 Tahun 2025**                          | Pedoman implementasi kurikulum madrasah terbaru, mencakup **Kurikulum Berbasis Cinta (KBC)** dan **Pembelajaran Mendalam (Deep Learning)** |
| **KMA 450 Tahun 2024**                           | Struktur kurikulum madrasah (masih menjadi acuan dasar) |


## Komponen Wajib Modul Ajar Madrasah

Berdasarkan regulasi Kemenag, setiap modul ajar harus mencakup:

| Komponen                                  | Wajib?    | Keterangan |

| Capaian Pembelajaran (CP)                 | ✅       | Per fase (A, B, C) |
| Tujuan Pembelajaran (TP)                  | ✅       | Minimal 3-5 tujuan per modul |
| Alur Tujuan Pembelajaran (ATP)            | ✅       | Urutan pencapaian TP |
| Profil lulusan                            | ✅       | Karakter  |
| Pembelajaran Diferensiasi                 | ✅       | Konten, proses, produk | 
| Asesmen Diagnostik                        | ✅       | Awal pembelajaran |
| Asesmen Formatif                          | ✅       | Selama pembelajaran |
| Asesmen Sumatif                           | ✅       | Akhir pembelajaran |
| Refleksi Guru                             | ✅       | Evaluasi diri |
| Refleksi Siswa                            | ✅       | Evaluasi diri siswa |


----------------


## UI/UX SPECIFICATION

1. Halaman List Modul (/modul-pembelajaran)
Fungsi: Menampilkan semua modul ajar dengan filter dan search.

Komponen:
- Search bar (by title, mapel, kelas)
- Filter dropdown: Mapel, Kelas, Semester, Status
- Grid/List view toggle
- Card per modul dengan:
  - Judul
  - Mapel & Kelas
  - Status badge (Draft/Published/Revisi/Arsip)
  - Tanggal dibuat
- Aksi: Preview, Edit, Download
- Pagination

Role-based:
- Guru: Hanya melihat modul sendiri + modul published dari guru lain
- Admin: Melihat semua modul
- Kepsek: Melihat semua modul (read only)


2. Halaman Buat Modul (/modul-pembelajaran/baru)

Fungsi: Form untuk membuat modul ajar baru.

Layout:
- Tab/Step form:
    - Informasi Dasar
    - Capaian & Tujuan
    - Materi & Metode
    - Asesmen & Refleksi
    - Lampiran & Publikasi

Field yang Wajib Diisi:
- Judul, Mapel, Kelas, Semester, Fase
- Capaian Pembelajaran (CP)
- Tujuan Pembelajaran (TP) - min 3
- Alur Tujuan Pembelajaran (ATP)
- Materi Pokok - min 3
- Metode Pembelajaran
- Asesmen Diagnostik, Formatif, Sumatif


Tombol:
- [Simpan Draft] → Status = Draft
- [Publikasikan] → Status = Published
- [Batal] → Kembali ke list


3. Halaman Detail Modul (/modul-pembelajaran/[id])

Fungsi: Menampilkan detail lengkap modul ajar. 

Layout:
- Header: Judul, Mapel, Kelas, Semester, Status badge
- Tab:
    - Preview (tampilan modul lengkap seperti PDF)
    - Edit (form yang sama dengan create)
    - Riwayat Revisi
    - Aktivitas (log)
    
Aksi (berdasarkan role):
- Guru: Edit (jika draft/revisi), Publish, Arsip
- Admin: Edit, Publish, Arsip, Approve, Minta Revisi
- Kepsek: Lihat saja


4. Halaman Rekap Modul (/modul-pembelajaran/rekap)

Fungsi: Laporan untuk Admin/Kepsek.

Filter:
- Periode: Semester + Tahun Ajaran
- Mapel
- Kelas
- Status

Statistik:
- Total modul
- Per Status: Draft, Published, Revisi, Arsip
- Per Guru: Jumlah modul per guru
- Per Mapel: Jumlah modul per mapel

    
Tabel Rekap:

Guru	             Mapel	        Total	Draft	Published	Revisi	    Arsip	    Aksi
Ust. Ahmad	         Fikih    	    8	    2	    5	        1	        0	        [Detail]
Ust. Siti	         Al-Quran 	    6	    0	    6	        0	        0	        [Detail]

Export:
- Export ke PDF
- Export ke Excel



-----------


### ALUR KERJA (USER FLOW)

# Alur 1: Guru Membuat Modul Baru

1. Login ke portal.miattaqwa15.sch.id
2. Klik menu "Modul Pembelajaran" di sidebar
3. Klik tombol "Buat Modul Baru"
4. Isi form (5 step):
   a. Informasi Dasar (judul, mapel, kelas, semester)
   b. Capaian & Tujuan (CP, TP, ATP)
   c. Materi & Metode (materi pokok, metode)
   d. Asesmen & Refleksi (diagnostik, formatif, sumatif)
   e. Lampiran & Publikasi (upload file, pilih status)
5. Pilih:
   - [Simpan Draft] → Modul tersimpan dengan status Draft
   - [Publikasikan] → Modul tersimpan dengan status Published
6. Modul muncul di list

---

### Alur 2: Admin/Kepsek Memonitor Modul

1. Login sebagai Admin atau Kepsek
2. Klik menu "Modul Pembelajaran"
3. Lihat rekap statistik:
   - Total modul per guru
   - Perbandingan status
4. Filter berdasarkan kelas, mapel, atau semester
5. Klik tombol [Detail] untuk melihat modul tertentu

Contoh tampilan:

Status Modul Pembelajaran MI Attaqwa 15
(Periode: Semester Genap 2024/2025)

Statistik Keseluruhan
    Total Modul: 14
    ✓ Published: 11
    ○ Draft: 2
    △ Revisi: 1


Distribusi per Guru

Ust. Ahmad (Fikih): 8 modul
  ✓ 5 Published
  ○ 2 Draft
  △ 1 Revisi

Ust. Siti (Al-Quran): 6 modul
  ✓ 6 Published


---

### Alur 3: Admin/Kepsek Mengelola Revisi


-----



### DATA API KEY ###

Deepseek : [SECRET REMOVED]
ChatGPT  : [SECRET REMOVED]