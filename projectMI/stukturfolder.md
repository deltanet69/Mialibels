src/
├── app/
│   │
│   ├── (frontend)/                  # Domain: miattaqwa15.sch.id
│   │   ├── layout.tsx               # Layout publik (header, footer)
│   │   ├── page.tsx                 # Homepage
│   │   ├── about/
│   │   ├── akademik/
│   │   ├── berita/
│   │   ├── galeri/
│   │   ├── kontak/
│   │   └── ppdb/
│   │
│   ├── (portal)/                    # Domain: portal.miattaqwa15.sch.id
│   │   ├── layout.tsx               # Layout admin (sidebar, navbar)
│   │   │
│   │   ├── login/
│   │   │   └── page.tsx             # Halaman login portal
│   │   │
│   │   ├── dashboard/
│   │   │   └── page.tsx             # Dashboard utama portal
│   │   │
│   │   ├── content/                 # Kelola konten frontend
│   │   │   ├── posts/
│   │   │   ├── galleries/
│   │   │   ├── banners/
│   │   │   ├── testimonials/
│   │   │   └── staffs/
│   │   │
│   │   ├── finance/                 # Management keuangan
│   │   │   ├── savings/
│   │   │   ├── spp/
│   │   │   └── cash/
│   │   │
│   │   ├── students/                # Data siswa (detail)
│   │   │   ├── page.tsx             # List siswa
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx         # Detail siswa per kelas
│   │   │   └── class/
│   │   │       └── [class]/
│   │   │           └── page.tsx     # Siswa per kelas tertentu
│   │   │
│   │   ├── attendance/              # Absensi guru
│   │   │   ├── page.tsx
│   │   │   └── report/
│   │   │       └── page.tsx
│   │   │
│   │   ├── reports/                 # Laporan untuk Kepsek
│   │   │   ├── finance/
│   │   │   ├── academic/
│   │   │   └── attendance/
│   │   │
│   │   └── users/                   # Manajemen user (superadmin only)
│   │       └── page.tsx
│   │
│   └── api/                         # API Routes (1 untuk semua)
│       ├── auth/
│       │   ├── login/
│       │   ├── logout/
│       │   └── me/
│       ├── content/
│       │   ├── posts/
│       │   ├── galleries/
│       │   └── ...
│       ├── finance/
│       │   ├── savings/
│       │   ├── spp/
│       │   └── cash/
│       ├── students/
│       └── reports/
│
├── components/
│   ├── frontend/        # UI untuk public website
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── HeroSection.tsx
│   │   └── ...
│   │
│   ├── portal/          # UI untuk admin portal
│   │   ├── Sidebar.tsx
│   │   ├── Navbar.tsx
│   │   ├── DataTable.tsx
│   │   ├── FinanceChart.tsx
│   │   └── ...
│   │
│   └── shared/          # UI yang dipakai kedua domain
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       └── Modal.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts    # Untuk frontend & portal
│   │   ├── server.ts
│   │   └── admin.ts     # Service role (hanya di server)
│   │
│   ├── auth/
│   │   ├── config.ts    # Auth config
│   │   └── roles.ts     # RBAC definitions
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useRealtime.ts
│   │
│   └── utils/
│       ├── formatDate.ts
│       ├── formatCurrency.ts
│       └── domain.ts    # Deteksi domain helper
│
├── types/
│   ├── database.ts
│   ├── auth.ts
│   └── finance.ts
│
├── middleware.ts        # Deteksi domain & proteksi route
└── .env.local