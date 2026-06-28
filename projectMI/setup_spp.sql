-- =================================================================================
-- SPP Payment Verification Schema & RPC
-- =================================================================================

-- 1. Create spp_invoices table
CREATE TABLE IF NOT EXISTS public.spp_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id VARCHAR(255) NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    amount INT NOT NULL CHECK (amount >= 0),
    month INT NOT NULL CHECK (month >= 1 AND month <= 12),
    year INT NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'UNPAID' CHECK (status IN ('UNPAID', 'PENDING_VERIFICATION', 'PARTIAL', 'PAID', 'LATE', 'CANCELLED')),
    paid_amount INT DEFAULT 0,
    discount_amount INT DEFAULT 0,
    late_fee INT DEFAULT 0,
    payment_method VARCHAR(50) CHECK (payment_method IN ('TRANSFER', 'CASH', 'VOUCHER', NULL)),
    bukti_transfer VARCHAR(500),
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by VARCHAR(255) REFERENCES public.admins(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, month, year) -- 1 student can only have 1 invoice per month/year
);

-- 2. Create spp_transactions table (history of payments)
CREATE TABLE IF NOT EXISTS public.spp_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.spp_invoices(id) ON DELETE CASCADE,
    student_id VARCHAR(255) NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    amount INT NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('TRANSFER', 'CASH', 'VOUCHER')),
    bukti_transfer VARCHAR(500),
    description TEXT,
    admin_id VARCHAR(255) REFERENCES public.admins(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.spp_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spp_transactions ENABLE ROW LEVEL SECURITY;

-- Temporary bypass RLS for server-side
CREATE POLICY "Allow all operations for spp_invoices" ON public.spp_invoices FOR ALL USING (true);
CREATE POLICY "Allow all operations for spp_transactions" ON public.spp_transactions FOR ALL USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_spp_invoices_student_id ON public.spp_invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_spp_invoices_status ON public.spp_invoices(status);
CREATE INDEX IF NOT EXISTS idx_spp_transactions_invoice_id ON public.spp_transactions(invoice_id);

-- 3. Create RPC Function to process verification atomically
CREATE OR REPLACE FUNCTION public.verify_spp_payment(
    p_invoice_id UUID,
    p_action VARCHAR,
    p_admin_id VARCHAR,
    p_amount INT DEFAULT 0,
    p_description TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_invoice RECORD;
    v_new_paid_amount INT;
    v_new_status VARCHAR(50);
BEGIN
    -- Validasi Input Action
    IF p_action NOT IN ('APPROVE', 'REJECT', 'CASH_PAYMENT') THEN
        RAISE EXCEPTION 'Invalid action: %', p_action;
    END IF;

    -- Lock the invoice row to prevent race conditions
    SELECT * INTO v_invoice
    FROM public.spp_invoices
    WHERE id = p_invoice_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invoice not found';
    END IF;

    IF v_invoice.status = 'PAID' THEN
        RAISE EXCEPTION 'Invoice is already paid';
    END IF;

    -- Process action
    IF p_action = 'APPROVE' THEN
        IF v_invoice.status != 'PENDING_VERIFICATION' THEN
            RAISE EXCEPTION 'Invoice is not in pending verification state';
        END IF;

        -- Update Invoice to PAID
        UPDATE public.spp_invoices
        SET status = 'PAID',
            paid_amount = v_invoice.amount,
            verified_at = NOW(),
            verified_by = p_admin_id,
            updated_at = NOW()
        WHERE id = p_invoice_id;

        -- Create Transaction History
        INSERT INTO public.spp_transactions (
            invoice_id, student_id, amount, payment_method, bukti_transfer, description, admin_id
        ) VALUES (
            p_invoice_id, v_invoice.student_id, v_invoice.amount, v_invoice.payment_method, v_invoice.bukti_transfer, 'Verifikasi Transfer Disetujui', p_admin_id
        );

    ELSIF p_action = 'REJECT' THEN
        IF v_invoice.status != 'PENDING_VERIFICATION' THEN
            RAISE EXCEPTION 'Invoice is not in pending verification state';
        END IF;

        -- Reset Invoice back to UNPAID and clear transfer data
        UPDATE public.spp_invoices
        SET status = 'UNPAID',
            payment_method = NULL,
            bukti_transfer = NULL,
            updated_at = NOW()
        WHERE id = p_invoice_id;

        -- No transaction recorded for rejection, just status reset

    ELSIF p_action = 'CASH_PAYMENT' THEN
        -- Cash payment doesn't need to be PENDING_VERIFICATION, can be UNPAID, PARTIAL or LATE
        IF p_amount <= 0 THEN
            RAISE EXCEPTION 'Amount must be greater than 0';
        END IF;

        -- Calculate new paid amount
        v_new_paid_amount := COALESCE(v_invoice.paid_amount, 0) + p_amount;
        
        IF v_new_paid_amount >= v_invoice.amount THEN
            v_new_status := 'PAID';
        ELSE
            v_new_status := 'PARTIAL';
        END IF;

        -- Update Invoice
        UPDATE public.spp_invoices
        SET status = v_new_status,
            payment_method = 'CASH',
            paid_amount = v_new_paid_amount,
            verified_at = NOW(),
            verified_by = p_admin_id,
            updated_at = NOW()
        WHERE id = p_invoice_id;

        -- Create Transaction History
        INSERT INTO public.spp_transactions (
            invoice_id, student_id, amount, payment_method, description, admin_id
        ) VALUES (
            p_invoice_id, v_invoice.student_id, p_amount, 'CASH', p_description, p_admin_id
        );
    END IF;

    RETURN json_build_object(
        'success', true,
        'invoice_id', p_invoice_id,
        'action', p_action
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
