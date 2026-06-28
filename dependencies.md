# Catatan Dependencies (Paket Aplikasi)

Dokumen ini menjelaskan fungsi dari masing-masing paket (dependency) yang terinstall di dalam file `package.json` dan peran pentingnya di dalam proyek aplikasi kamu.

## Framework Inti
* **`next`**: Ini adalah pondasi utama aplikasi kita (React framework). `next` memberikan fitur-fitur keren seperti server-side rendering (SSR) bikin web lebih cepat, rute API, dan sistem rute berdasarkan halaman.
* **`react`** & **`react-dom`**: Ini adalah library utama untuk membangun tampilan antarmuka (UI) yang interaktif dan menampilkannya ke layar (DOM).

## Database & Backend (BaaS)
* **`@prisma/client`**: Ini adalah alat bantu (ORM) yang sangat aman dan otomatis untuk menghubungkan serta mengelola data di database kita dengan mudah tanpa pusing memikirkan query SQL yang rumit.
* **`@supabase/supabase-js`**: Alat resmi untuk menyambungkan aplikasi kita ke layanan Supabase (seperti Login/Auth, Database, dan penyimpanan file/Storage).
* **`@supabase/ssr`**: Alat tambahan dari Supabase yang dirancang khusus untuk Next.js agar sistem login dan status akun pengguna bisa berjalan mulus di sisi server (Server-Side Rendering).

## Keamanan & Login (Autentikasi)
* **`bcryptjs`** & **`@types/bcryptjs`**: Digunakan untuk mengacak (hash) kata sandi pengguna secara aman. Jadi kalau ada yang daftar atau login, password-nya tidak akan bocor.
* **`jose`**: Library ini bertugas untuk mengurus 'Karcis Masuk' atau token JWT (JSON Web Tokens). Sangat penting untuk sistem keamanan saat pengguna login dan menyimpan sesi mereka.

## Komponen Tampilan (UI) & Grafik Data
* **`lucide-react`**: Kumpulan ikon-ikon yang rapi, cantik, dan konsisten. Kita pakai ini untuk semua ikon yang ada di tampilan antarmuka.
* **`react-quill-new`**: Komponen khusus untuk membuat teks editor yang canggih (seperti di Microsoft Word) untuk menulis postingan atau pengumuman (digunakan di halaman `PostForm.tsx`).
* **`recharts`**: Library untuk membuat grafik visual yang cantik dan interaktif. Kita pakai ini untuk menampilkan data dalam bentuk grafik (misalnya di halaman `ClassroomOverview.tsx`).
* **`zod`**: Penjaga keamanan data formulir! Alat ini bertugas untuk memvalidasi dan memastikan bahwa data yang dikirimkan oleh pengguna (misalnya saat mengisi form) sudah benar formatnya.

## Alat Bantu (Utilitas) & Pemrosesan File
* **`papaparse`** & **`@types/papaparse`**: Alat pembaca file CSV yang sangat kuat. Ini kita pakai buat fitur unggah dan proses data berbentuk tabel CSV (misalnya saat mengimpor data siswa).
* **`sharp`**: Library super cepat untuk memproses gambar. Kalau ada gambar yang diunggah, `sharp` bertugas mengecilkan ukuran atau mengubah resolusinya biar website tetap ringan (dipakai di `api/upload/route.ts`).

## Animasi
* **`gsap`** & **`@gsap/react`**: Alat ajaib (GreenSock) untuk membuat animasi yang sangat halus, kompleks, namun tetap ringan di website (digunakan di halaman `AnimatedSection.tsx`).

---

## 🗑️ Paket yang Tidak Digunakan (Telah Dihapus)
Setelah dicek ulang secara menyeluruh, ternyata ada beberapa paket yang terpasang tapi **tidak dipakai sama sekali**. Jadi paket-paket ini sudah dihapus supaya proyek kita jadi lebih ringan dan bersih:
* **`lenis`**: Library untuk membuat *scroll* website jadi mulus. Setelah di cek, library ini sama sekali tidak ada kodenya yang dipakai di aplikasi kita.
* **`pg`** & **`@types/pg`**: Ini adalah klien database PostgreSQL manual. Karena kita sudah pakai `@prisma/client` untuk urusan database PostgreSQL, paket ini jadi mubazir dan tidak diperlukan lagi.
