-- 1. Buat tabel tabungan_siswa (Menyimpan saldo utama per siswa)
CREATE TABLE IF NOT EXISTS public.tabungan_siswa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id VARCHAR NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    balance BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id)
);

-- 2. Buat tabel tabungan_transaksi (Menyimpan riwayat mutasi masuk/keluar)
CREATE TABLE IF NOT EXISTS public.tabungan_transaksi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id VARCHAR NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('DEPOSIT', 'WITHDRAWAL')),
    amount BIGINT NOT NULL CHECK (amount > 0),
    balance_after BIGINT NOT NULL,
    description TEXT,
    admin_id VARCHAR REFERENCES public.admins(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Aktifkan RLS (Row Level Security) - opsional, sementara kita allow semua karena via server
ALTER TABLE public.tabungan_siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tabungan_transaksi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for tabungan_siswa" ON public.tabungan_siswa FOR ALL USING (true);
CREATE POLICY "Allow all operations for tabungan_transaksi" ON public.tabungan_transaksi FOR ALL USING (true);

-- 4. Buat Function RPC untuk transaksi atomik (Menjamin keamanan)
CREATE OR REPLACE FUNCTION process_tabungan(
    p_student_id VARCHAR,
    p_type VARCHAR,
    p_amount BIGINT,
    p_description TEXT,
    p_admin_id VARCHAR
) RETURNS JSON AS $$
DECLARE
    v_current_balance BIGINT;
    v_new_balance BIGINT;
    v_account_id UUID;
BEGIN
    -- Validasi amount
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be greater than 0';
    END IF;

    -- Pastikan akun tabungan_siswa ada, jika tidak, buatkan (Upsert)
    INSERT INTO public.tabungan_siswa (student_id, balance)
    VALUES (p_student_id, 0)
    ON CONFLICT (student_id) DO NOTHING;

    -- Kunci baris tabungan_siswa untuk transaksi ini (mencegah race condition)
    SELECT id, balance INTO v_account_id, v_current_balance
    FROM public.tabungan_siswa
    WHERE student_id = p_student_id
    FOR UPDATE;

    -- Hitung saldo baru
    IF p_type = 'DEPOSIT' THEN
        v_new_balance := v_current_balance + p_amount;
    ELSIF p_type = 'WITHDRAWAL' THEN
        IF v_current_balance < p_amount THEN
            RAISE EXCEPTION 'Insufficient balance. Current balance: %', v_current_balance;
        END IF;
        v_new_balance := v_current_balance - p_amount;
    ELSE
        RAISE EXCEPTION 'Invalid transaction type: %', p_type;
    END IF;

    -- Update saldo di tabungan_siswa
    UPDATE public.tabungan_siswa
    SET balance = v_new_balance, updated_at = NOW()
    WHERE id = v_account_id;

    -- Catat di riwayat tabungan_transaksi
    INSERT INTO public.tabungan_transaksi (
        student_id, type, amount, balance_after, description, admin_id
    ) VALUES (
        p_student_id, p_type, p_amount, v_new_balance, p_description, p_admin_id
    );

    -- Kembalikan status sukses beserta saldo baru
    RETURN json_build_object(
        'success', true,
        'new_balance', v_new_balance,
        'student_id', p_student_id
    );

EXCEPTION WHEN OTHERS THEN
    -- Jika error, kembalikan pesan error
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
