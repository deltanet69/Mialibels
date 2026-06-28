import { z } from "zod";

export const sppVerificationSchema = z.object({
  invoice_id: z.string().uuid("ID Tagihan tidak valid"),
  action: z.enum(["APPROVE", "REJECT"]),
});

export const sppCashPaymentSchema = z.object({
  invoice_id: z.string().uuid("ID Tagihan tidak valid"),
  amount: z
    .number({
      message: "Nominal pembayaran harus berupa angka",
    })
    .positive("Nominal pembayaran harus lebih dari 0"),
  description: z.string().optional(),
});
