## DETAIL FITUR SPP SEKOLAH



Membangun sistem SPP yang:
1. **Otomatis generate tagihan** setiap bulan
2. **Mengirim notifikasi** ke orang tua siswa
3. **Mendukung 2 metode pembayaran** (transfer rek. Sekolah & tunai ke kantor TU)
4. **Memiliki sistem verifikasi** oleh TU/admin sekolah
5. **Mencatat riwayat** pembayaran dengan rapi
6. **Memiliki Dashboard** yang menampilkan data pembayaran


# Ringkasan/overview

pada overview terdapat 3 card utama :
1.  **Total Tagihan Bulan Ini**
    - Menampilkan jumlah total tagihan SPP bulan ini (contoh : Rp. 100.000.000)
    - mepampilkan total siwa yang sudah bayar dari total siswa, contoh (200 dari 210 siswa)
    - menampilkan total tagihan SPP bulan ini yang sudah dibayar, contoh (Rp. 20.000.000)
2.  **Total Yang Sudah Bayar**
    - Menampilkan jumlah total tagihan SPP bulan ini yang sudah dibayar
    - Menampilkan total siswa yang sudah melakukan pembayaran
3.  **Total Yang Belum Bayar**
    - Menampilkan total siswa yang belum melakukan pembayaran


**Grafik Per Kelas**
- Menampilkan grafik persentase pembayaran SPP per kelas, dapat di filter berdasarkan datakelas. Gunakan chart yang interaktif, detail, simple, dan mudah dimengerti.


## tagihan siswa
pada tagihan siswa adalah listing seluruh siswa, dapat di filter berdasarkan kelas maupun status pembayaran (transfer/ke kantor TU), berikan tanda untuk jenis payment (transfer/manual)




**Listing data siswa**

Dapat di filter berdasarkan : tahun, bulan, kelas, status, jenis payment. search by nisn dan nama siswa.

| No |NISN| Nama Siswa | Kelas | Status | Jumlah Tagihan | Jenis Payment | Aksi |
|----|----|----|----|----|----|----|----|

**Detail data siswa**
- Jika mengklik salah satu siswa, maka akan masuk ke halaman detail data siswa
- pada halaman detail data siswa terdapat informasi siswa seperti nama, nisn, kelas, detail orang tua/wali, alamat dll
- terdapat juga riwayat pembayaran siswa
- pada bagian riwayat pembayaran siswa terdapat detail pembayaran siswa seperti jumlah tagihan, jumlah yang sudah dibayar, jumlah yang belum dibayar, jenis payment, status, dll
- dan di bagian payment, jika orang tua melakukan membayaran transfer maka akan ada bukti transfer yang dapat di download, jika manual maka admin/TU dapat input pembayaran manual. pastikan juga bisa menambah nominal pembayaran.
- pada bagian riwayat pembayaran siswa, jika jenis payment adalah transfer maka akan ada tombol verifikasi, jika di klik maka akan masuk ke halaman verifikasi pembayaran.



## Kelola tagihan

Kelola tagihan adalah pendataan daripada tagihan spp sekolah, ataupun pembayaran lainnya terkait di sekolah. dimana admin dapat menambahkan, mengedit, maupun menghapus tagihan siswa.


**Listing data siswa**

Dapat di filter berdasarkan : tahun, bulan, kelas, status, jenis payment

| No |NISN| Nama Siswa | Kelas | Status | Jumlah Tagihan | Jenis Payment | Aksi |
|----|----|----|----|----|----|----|----|