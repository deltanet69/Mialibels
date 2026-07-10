# Panduan Setup Domain & Subdomain di cPanel untuk Next.js

Karena aplikasi Anda adalah **satu project Next.js (Monolith)** yang di dalamnya sudah memuat Front-End, Admin Portal, dan Parent Portal, Anda perlu melakukan konfigurasi di cPanel agar ketiga domain/subdomain tersebut mengarah ke aplikasi yang sama, lalu aplikasi akan membagi tampilannya berdasarkan URL.

Berikut adalah langkah singkat, jelas, dan rapi untuk setup di cPanel:

## Tahap 1: Setup Domain & Subdomain di cPanel

1. **Pastikan Domain Utama Sudah Aktif**
   - Pastikan domain `miattaqwa15.sch.id` sudah ditambahkan di cPanel (pada menu **Domains** atau **Addon Domains**) dan mengarah ke folder publik (biasanya `public_html`).

2. **Buat Subdomain untuk Admin & Parent**
   - Di cPanel, cari dan buka menu **Subdomains** (atau menu **Domains** di versi cPanel terbaru).
   - Buat subdomain pertama: 
     - **Subdomain:** `portal`
     - **Domain:** `miattaqwa15.sch.id`
     - **Document Root:** Arahkan ke folder yang sama persis dengan domain utama (misal: `public_html` atau `miattaqwa15`).
   - Buat subdomain kedua:
     - **Subdomain:** `parent`
     - **Domain:** `miattaqwa15.sch.id`
     - **Document Root:** Sama seperti di atas (harus 1 folder yang sama dengan aplikasi Next.js Anda).

*(Intinya: Ketiga domain/subdomain harus diarahkan ke satu folder (Document Root) yang sama di cPanel).*

---

## Tahap 2: Setup Node.js App di cPanel

Karena Next.js berjalan di atas Node.js, Anda tidak bisa sekadar menaruh file di File Manager.

1. Buka menu **Setup Node.js App** di cPanel.
2. Klik **Create Application**.
3. **Konfigurasi:**
   - **Node.js version:** Pilih versi 18.x atau terbaru.
   - **Application mode:** `Production`
   - **Application root:** Nama folder tempat Anda mengunggah file Next.js (misal: `public_html`).
   - **Application URL:** Pilih domain utama `miattaqwa15.sch.id`.
   - **Startup file:** `server.js` *(Pastikan Anda mem-build Next.js sebagai `standalone` atau menggunakan file server kustom).*
4. Klik **Create / Start App**.

*(Catatan: Setelah Node.js app berjalan, domain utama dan kedua subdomain akan menampilkan halaman yang sama karena mengarah ke aplikasi yang sama).*

---

## Tahap 3: Penyesuaian di Kode Next.js (Wajib)

Agar aplikasi Next.js Anda tahu mana yang harus ditampilkan saat pengunjung mengakses `portal.mi...` atau `parent.mi...`, kita **wajib** menggunakan fitur **Next.js Middleware**.

Di tahap *development* selanjutnya, kita harus membuat file `src/middleware.ts` dengan logika sederhana seperti ini:

```typescript
// Contoh sederhana src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone()
  const hostname = req.headers.get('host') || ''

  // 1. Jika akses portal.miattaqwa15.sch.id
  if (hostname.startsWith('portal.')) {
    url.pathname = `/dashboard${url.pathname === '/' ? '' : url.pathname}`
    return NextResponse.rewrite(url)
  }

  // 2. Jika akses parent.miattaqwa15.sch.id
  if (hostname.startsWith('parent.')) {
    url.pathname = `/parent${url.pathname === '/' ? '' : url.pathname}`
    return NextResponse.rewrite(url)
  }

  // 3. Jika akses miattaqwa15.sch.id (Otomatis ke Front-End Utama)
  return NextResponse.next()
}
```

### Kesimpulan Alur:
1. cPanel menerima *request* dari `portal`, `parent`, atau domain utama.
2. cPanel meneruskannya ke satu aplikasi Node.js (Next.js) yang sama.
3. **Middleware Next.js** mendeteksi nama domainnya secara otomatis, dan me-render halaman yang tepat (`/dashboard` untuk portal, `/parent` untuk parent portal, dan `/` untuk website sekolah).


## ------------------------ ##
## ------------------------ ##



## Tahap 4: Setup Auto-Deployment (GitHub ke Vercel & cPanel)

Agar setiap kali Anda melakukan `git push` ke GitHub otomatis terupdate di server (tanpa perlu upload manual), ikuti langkah berikut:

### 1. Auto-Deployment ke Vercel
Vercel menangani ini secara **Otomatis**.
1. Login ke Vercel dan buat *Project* baru.
2. Hubungkan (*Import*) repository GitHub Anda (`Mialibels`).
3. Vercel akan secara otomatis melakukan *Build* dan *Deploy* setiap kali ada kode baru yang di-push ke branch utama (`master`). Tidak perlu konfigurasi server apapun.

### 2. Auto-Deployment ke cPanel
Agar cPanel otomatis menarik pembaruan dari GitHub saat Anda melakukan push, gunakan fitur **Git Version Control**.

**A. Hubungkan Repository**
1. Buka menu **Git Version Control** di cPanel, lalu klik **Create**.
2. Masukkan **Clone URL** dari repository GitHub Anda.
3. Masukkan **Repository Path** (arahkan ke folder yang menjadi *Application root* di Node.js App Anda).
4. Klik **Create**.

**B. Buat Pembaruan Otomatis (Webhook)**
Agar Anda tidak perlu mengeklik *Pull* manual di cPanel setiap update:
1. Di halaman Git Version Control cPanel, klik **Manage** pada repository yang baru ditambahkan.
2. Pilih tab **Pull or Deploy**.
3. Salin **Webhook URL** yang tertera di layar.
4. Buka **GitHub** -> Buka repository Anda -> Masuk ke tab **Settings** -> Pilih menu **Webhooks** (di sidebar kiri) -> Klik **Add webhook**.
5. *Paste* URL dari cPanel tadi ke kolom **Payload URL**.
6. Set *Content type* ke `application/json`, lalu klik **Add webhook**.

*(Jika Node.js App Anda di cPanel mati setelah deploy, cPanel bisa dikonfigurasi untuk menjalankan skrip `npm run build` dan me-restart Node.js app melalui fitur `.cpanel.yml`)*.

---

Sekarang, setiap kali Anda mengetikkan `git push origin master`, kode terbaru Anda akan langsung meluncur ke Vercel dan cPanel secara otomatis dan bersamaan!

Beri tahu saya jika Anda ingin saya langsung membuatkan dan mengimplementasikan file `middleware.ts` (untuk kebutuhan routing domain) sekarang!
