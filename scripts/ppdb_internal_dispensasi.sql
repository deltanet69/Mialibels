-- Data tambahan siswa baru (dispensasi keluarga internal): tetap di ppdb_registrations
-- agar ikut export / ujian masuk / penempatan kelas, tetapi tidak dihitung ke kuota SPMB online.
ALTER TABLE ppdb_registrations ADD COLUMN IF NOT EXISTS is_internal boolean NOT NULL DEFAULT false;
