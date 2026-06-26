### Fitur tabungan siswa


Fitur ini sangat simple namun dengan standard akutansi standard & bisa dipertanggung jawabkan jadi selling point utama aplikasi ini
skema tabungan siswa yang lengkap untuk MI Attaqwa 15:

1. Mudah dilacak (riwayat transaksi jelas)
2. Realtime (bisa pakai Supabase Realtime)
3. Aman (tidak bisa diubah sembarangan)
4. Laporan jelas (saldo, riwayat, rekap per siswa)


### 1. Tabel Database Tabungan

Buat tabel di Supabase:

- tabungan_siswa
- tabungan_transaksi
- tabungan_mutasi (opsional, kalau mau tracking perubahan saldo)
- tabungan_rekap (summary otomatis)


### Alur tabungan siswa

[MENABUNG]
Siswa Menabung (uang dikumpulkan oleh guru kelas)
       ↓
Admin TU mengumpulkan uang dari guru kelas
       ↓
Admin input transaksi ke dashboard
       ↓
Saldo siswa bertambah otomatis
 

[PENARIKAN]
Siswa/orang tua mengajukan penarikan ke kantor TU (Manual/tidak lewat portal)
       ↓
Admin TU memvalidasi & memproses
       ↓
Saldo siswa berkurang otomatis
       ↓
Transaksi tercatat lengkap