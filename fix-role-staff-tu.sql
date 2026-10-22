-- ============================================================================
-- Script: fix-role-staff-tu.sql
-- Tujuan: Memperbaiki role akun Staff TU agar dapat mengelola transaksi keuangan.
--         Di src/lib/rbac.ts, canManageFinance() memerlukan role 'administrasi'.
-- ============================================================================

-- 1. Cek semua akun admin/staff dan role saat ini
SELECT id, name, email, role, is_active FROM admins ORDER BY role;

-- 2. Template update role staff TU menjadi 'administrasi'
--    Ganti '<isi-email-staff-tu>' dengan email staf TU yang bersangkutan,
--    lalu jalankan query di Supabase SQL Editor / database client.
--
-- Contoh jika ada beberapa email:
-- UPDATE admins SET role = 'administrasi' WHERE email IN (
--   'staff1@example.com',
--   'staff2@example.com'
-- );

UPDATE admins SET role = 'administrasi' WHERE email = '<isi-email-staff-tu>';
