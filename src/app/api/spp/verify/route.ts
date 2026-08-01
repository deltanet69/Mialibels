// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";
import { sppVerificationSchema, sppCashPaymentSchema } from "@/lib/validations/spp";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Tentukan aksi berdasarkan input payload
    // Jika ada `amount`, kemungkinan adalah CASH_PAYMENT
    const isCashPayment = body.action === "CASH_PAYMENT";

    let validatedData;
    
    if (isCashPayment) {
      try {
        validatedData = sppCashPaymentSchema.parse(body);
      } catch (err) {
        if (err instanceof z.ZodError) {
          return NextResponse.json(
            { error: "Validasi gagal", details: err.errors },
            { status: 400 }
          );
        }
      }
    } else {
      try {
        validatedData = sppVerificationSchema.parse(body);
      } catch (err) {
        if (err instanceof z.ZodError) {
          return NextResponse.json(
            { error: "Validasi gagal", details: err.errors },
            { status: 400 }
          );
        }
      }
    }

    // Call RPC function for atomic update
    const { data, error } = await supabase.rpc("verify_spp_payment", {
      p_invoice_id: body.invoice_id,
      p_action: body.action, // 'APPROVE', 'REJECT', or 'CASH_PAYMENT'
      p_admin_id: session.id,
      p_amount: body.amount || 0,
      p_description: body.description || "",
    });

    if (error) {
      console.error("RPC verify_spp_payment error:", error);
      return NextResponse.json(
        { error: "Gagal memproses verifikasi: " + error.message },
        { status: 500 }
      );
    }

    if (!data.success) {
      return NextResponse.json(
        { error: data.error || "Aksi ditolak oleh sistem." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error verifying SPP:", error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan internal pada server.' },
      { status: 500 }
    );
  }
}

