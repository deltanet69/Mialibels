-- ==============================================================================
-- RLS POLICIES UNTUK ABSENSI LANGSUNG (DIRECT BROWSER → SUPABASE)
-- MI Attaqwa 15 Babelan
-- ==============================================================================
-- Jalankan query ini di Supabase SQL Editor (satu kali).
-- Ini mengizinkan anon key untuk membaca data siswa/guru berdasarkan RFID
-- dan menulis data absensi — HANYA untuk keperluan scan absensi.
-- ==============================================================================

-- ============================================================
-- 1. TABLE: students
-- ============================================================
-- Izinkan anon READ siswa aktif (untuk lookup RFID)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'students' AND policyname = 'anon_read_active_students'
  ) THEN
    EXECUTE 'CREATE POLICY anon_read_active_students ON students
      FOR SELECT TO anon
      USING (is_active = true)';
  END IF;
END $$;

-- Pastikan RLS aktif
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. TABLE: student_attendances
-- ============================================================
-- Izinkan anon READ attendance hari ini
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'student_attendances' AND policyname = 'anon_read_student_attendances'
  ) THEN
    EXECUTE 'CREATE POLICY anon_read_student_attendances ON student_attendances
      FOR SELECT TO anon
      USING (true)';
  END IF;
END $$;

-- Izinkan anon INSERT attendance baru
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'student_attendances' AND policyname = 'anon_insert_student_attendances'
  ) THEN
    EXECUTE 'CREATE POLICY anon_insert_student_attendances ON student_attendances
      FOR INSERT TO anon
      WITH CHECK (true)';
  END IF;
END $$;

-- Izinkan anon UPDATE attendance (untuk check-out / exit_time)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'student_attendances' AND policyname = 'anon_update_student_attendances'
  ) THEN
    EXECUTE 'CREATE POLICY anon_update_student_attendances ON student_attendances
      FOR UPDATE TO anon
      USING (true)
      WITH CHECK (true)';
  END IF;
END $$;

-- Pastikan RLS aktif
ALTER TABLE student_attendances ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. TABLE: staffs
-- ============================================================
-- Izinkan anon READ guru/staf aktif (untuk lookup RFID)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'staffs' AND policyname = 'anon_read_active_staffs'
  ) THEN
    EXECUTE 'CREATE POLICY anon_read_active_staffs ON staffs
      FOR SELECT TO anon
      USING (is_active = true)';
  END IF;
END $$;

-- Pastikan RLS aktif
ALTER TABLE staffs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. TABLE: staff_attendance
-- ============================================================
-- Izinkan anon READ
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'staff_attendance' AND policyname = 'anon_read_staff_attendance'
  ) THEN
    EXECUTE 'CREATE POLICY anon_read_staff_attendance ON staff_attendance
      FOR SELECT TO anon
      USING (true)';
  END IF;
END $$;

-- Izinkan anon INSERT
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'staff_attendance' AND policyname = 'anon_insert_staff_attendance'
  ) THEN
    EXECUTE 'CREATE POLICY anon_insert_staff_attendance ON staff_attendance
      FOR INSERT TO anon
      WITH CHECK (true)';
  END IF;
END $$;

-- Izinkan anon UPDATE (check-out)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'staff_attendance' AND policyname = 'anon_update_staff_attendance'
  ) THEN
    EXECUTE 'CREATE POLICY anon_update_staff_attendance ON staff_attendance
      FOR UPDATE TO anon
      USING (true)
      WITH CHECK (true)';
  END IF;
END $$;

-- Pastikan RLS aktif
ALTER TABLE staff_attendance ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. TABLE: classroom_schedules (untuk deteksi shift guru)
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'classroom_schedules' AND policyname = 'anon_read_classroom_schedules'
  ) THEN
    EXECUTE 'CREATE POLICY anon_read_classroom_schedules ON classroom_schedules
      FOR SELECT TO anon
      USING (true)';
  END IF;
END $$;

ALTER TABLE classroom_schedules ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. TABLE: classrooms (untuk deteksi shift guru)
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'classrooms' AND policyname = 'anon_read_classrooms'
  ) THEN
    EXECUTE 'CREATE POLICY anon_read_classrooms ON classrooms
      FOR SELECT TO anon
      USING (true)';
  END IF;
END $$;

ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- VERIFIKASI: Tampilkan semua policy yang baru dibuat
-- ==============================================================================
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename IN ('students', 'student_attendances', 'staffs', 'staff_attendance', 'classroom_schedules', 'classrooms')
ORDER BY tablename, policyname;
