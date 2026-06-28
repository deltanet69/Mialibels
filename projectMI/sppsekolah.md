## Spesifikasi Lengkap Fitur SPP Sekolah

Membangun sistem SPP yang:
1. **Otomatis generate tagihan** setiap bulan
2. **Mengirim notifikasi** ke orang tua siswa
3. **Mendukung 2 metode pembayaran** (transfer rek. Sekolah & tunai ke kantor TU)
4. **Memiliki sistem verifikasi** oleh TU/admin sekolah
5. **Mencatat riwayat** pembayaran dengan rapi
6. **Memiliki Dashboard** yang menampilkan data pembayaran



## FLOW PEMBAYARAN SPP

1. ADMIN TU generate tagihan SPP bulanan
    ↓

2. Sistem kirim notifikasi ke orang tua via WhatsApp/Email
    ↓

3. Orang tua pilih metode pembayaran:
    ├── [TRANSFER] → Bayar ke rekening sekolah
    │ ↓
    │ Upload bukti transfer
    │ ↓
    │ Status: PENDING VERIFIKASI
    │ ↓
    │ TU verifikasi bukti
    │ ↓
    │ Status: LUNAS / REJECTED
    │
    └── [TUNAI] → Bayar langsung ke TU
        ↓
        TU input pembayaran manual
        ↓
        Status: LUNAS
        ↓

4. Sistem catat riwayat pembayaran
    ↓

5. Sistem update status SPP siswa




## ADMIN DASHBOARD - FITUR SPP

💰 SPP MANAGEMENT
├── Dashboard SPP
│   ├── Total Tagihan Bulan Ini
│   ├── Total Yang Sudah Bayar
│   ├── Total Yang Belum Bayar
│   └── Grafik Per Kelas
│
├── Kelola SPP/Tagihan
│   ├── Generate Tagihan Bulanan
│   ├── Lihat Semua Tagihan
│   ├── Edit Tagihan
│   └── Hapus Tagihan
│
├── Verifikasi Pembayaran
│   ├── List Pending Verifikasi
│   ├── Verifikasi Transfer
│   ├── Reject Transfer
│   └── Input Pembayaran Tunai
│
├── Kirim Notifikasi
│   ├── Kirim Reminder ke Semua
│   ├── Kirim ke Siswa Tertentu
│   └── History Notifikasi
│
├──  Laporan
│   ├── Laporan Bulanan
│   ├── Laporan Tahunan
│   ├── Rekap Per Kelas
│   └── Rekap Per Siswa
│
└── Pengaturan
    ├── Rekening Sekolah
    ├── Nominal SPP
    ├── Jatuh Tempo
    └── Denda




## ORANG TUA - FITUR (Website/App)
Yang Bisa Dilihat Orang Tua

Fitur		            Deskripsi
Dashboard		        Ringkasan tagihan, status SPP, histori
Tagihan SPP		        Lihat tagihan per bulan (UNPAID/PAID/LATE)
Detail Tagihan		    Nominal, jatuh tempo, denda
Bayar SPP		        Pilih metode (Transfer/Tunai)
Transfer		        Lihat rekening sekolah, upload bukti
Tunai	                Konfirmasi akan bayar ke TU
Riwayat	                Semua pembayaran SPP
Notifikasi	            Reminder & konfirmasi pembayaran     


## IMPLEMENTASI TEKNIS SPP (Rekomendasi)

Pembayran tagihan SPP bisa di lakukan dengan 2 cara :

1. Orang tua transfer ke rekening sekolah, lalu upload bukti transfer. Lalu admin akan memverifikasi bukti transfer tersebut dan update status tagihan menjadi PAID
2. Orang tua bayar tunai ke TU, lalu TU input pembayaran manual dan update status tagihan menjadi PAID


1. Tabel Tagihan (spp_invoices)
Struktur:
  - id (PK)
  - student_id (FK ke students)
  - kelas_id (FK ke classrooms)
  - jenis tagihan (spp sekolah/iuran/lainnya)
  - nominal (rupiah)
  - periode_bulan (misal: 7 untuk Juli)
  - periode_tahun (misal: 2024)
  - due_date (tanggal jatuh tempo)
  - status (PENDING / PAID / LATE / CANCELLED)
  - paid_amount (berapa yang sudah dibayar)
  - discount_amount (potongan/beasiswa)
  - late_fee (denda)
  - payment_method (TRANSFER / CASH / VOUCHER)
  - bukti_transfer (URL gambar)
  - verified_at (kapan diverifikasi)
  - verified_by (admin yang verifikasi)
  - created_at, updated_at

2. Tabel Transaksi (spp_transactions)
Struktur:
  - id (PK)
  - invoice_id (FK ke spp_invoices)
  - student_id (FK)
  - amount (jumlah bayar)
  - payment_method (TRANSFER / CASH / VOUCHER)
  - bukti_transfer (URL gambar)
  - description
  - admin_id (siapa yang input/verifikasi)
  - verified_at, verified_by
  - created_at, updated_at




  PASTIKAN :
  1. Saat Admin generate tagihan, cek apakah siswa sudah punya tagihan SPP bulan tersebut. Kalau sudah, jangan buat lagi, tapi update tagihan yang sudah ada.
  2. Saat orang tua bayar SPP, pastikan saldo siswa mencukupi (tidak minus). Kalau tidak mencukupi, tampilkan error "Saldo tidak mencukupi".
  3. Saat TU input pembayaran manual, pastikan admin sudah login dan memiliki role admin.
  4. Saat TU verifikasi pembayaran, pastikan bukti transfer valid (bukan screenshot kosong atau gambar yang tidak jelas).
  5. Pastikan status tagihan berubah menjadi PAID setelah pembayaran diverifikasi.
  6. Saat orang tua melihat riwayat pembayaran, pastikan hanya melihat riwayat pembayaran mereka sendiri (private).
  7. Saat orang tua melihat tagihan, pastikan hanya melihat tagihan mereka sendiri (private).