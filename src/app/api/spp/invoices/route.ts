import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ambil parameter status dari query URL (misal ?status=PENDING_VERIFICATION)
    const url = new URL(request.url);
    const status = url.searchParams.get("status") || "PENDING_VERIFICATION";

    // Ambil semua tagihan dengan status tertentu beserta data siswa
    // catatan: Kita harus query spp_invoices join dengan students
    const { data, error } = await supabase
      .from("spp_invoices")
      .select(`
        *,
        students (
          id,
          name,
          student_number,
          class
        )
      `)
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase Error fetch invoices:", error);
      return NextResponse.json(
        { error: "Gagal mengambil data tagihan: " + error.message },
        { status: 500 }
      );
    }

    // Bersihkan data jika diperlukan untuk kemudahan frontend
    const formattedData = data?.map((item: any) => ({
      id: item.id,
      title: item.title,
      amount: item.amount,
      month: item.month,
      year: item.year,
      due_date: item.due_date,
      status: item.status,
      payment_method: item.payment_method,
      bukti_transfer: item.bukti_transfer,
      student_id: item.student_id,
      student_name: item.students?.name || "Unknown",
      student_number: item.students?.student_number || "-",
      student_class: item.students?.class || "-",
      created_at: item.created_at,
    }));

    return NextResponse.json({ success: true, data: formattedData });
  } catch (error: any) {
    console.error("Error fetching SPP invoices:", error);
    return NextResponse.json(
      { error: error.message || "Server Error" },
      { status: 500 }
    );
  }
}
