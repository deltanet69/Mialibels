-- ==============================================================================
-- DATABASE INDEX OPTIMIZATION FOR ATTENDANCE & RFID SCAN PERFORMANCE
-- MI Attaqwa 15 Babelan
-- ==============================================================================
-- Jalankan query berikut di Supabase SQL Editor untuk mempercepat query absensi
-- dan menghilangkan sequential table scan (penyebab utama query lambat 200-600s).

-- 1. Index pada student_attendances (Pencarian absensi harian siswa)
CREATE INDEX IF NOT EXISTS idx_student_attendances_date_student 
ON student_attendances(date, student_id);

CREATE INDEX IF NOT EXISTS idx_student_attendances_student_date 
ON student_attendances(student_id, date);

CREATE INDEX IF NOT EXISTS idx_student_attendances_date_status 
ON student_attendances(date, status);

-- 2. Index pada students (Pencarian data siswa aktif, filter kelas, & RFID)
CREATE INDEX IF NOT EXISTS idx_students_is_active_class 
ON students(is_active, class);

CREATE INDEX IF NOT EXISTS idx_students_rfid_number 
ON students(rfid_number) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_students_class 
ON students(class);

-- 3. Index pada staff_attendance (Pencarian absensi harian guru/staf)
CREATE INDEX IF NOT EXISTS idx_staff_attendance_date_staff 
ON staff_attendance(date, staff_id);

CREATE INDEX IF NOT EXISTS idx_staff_attendance_staff_date 
ON staff_attendance(staff_id, date);

-- 4. Index pada staffs (Pencarian guru aktif & RFID)
CREATE INDEX IF NOT EXISTS idx_staffs_rfid 
ON staffs(rfid) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_staffs_is_active 
ON staffs(is_active);

-- 5. Index pada classroom_attendances & schedules
CREATE INDEX IF NOT EXISTS idx_classroom_attendances_date_classroom 
ON classroom_attendances(date, classroom_id);

CREATE INDEX IF NOT EXISTS idx_classroom_schedules_teacher_id 
ON classroom_schedules(teacher_id);

-- Selesai! Indeks ini membuat query pencarian tanggal & RFID menjadi instan (sub-millisecond).
