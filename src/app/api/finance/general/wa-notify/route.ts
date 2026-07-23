import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";
import { sendWhatsAppMessage } from '@/lib/openwa';
import { getSession } from "@/lib/session";

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { invoice_id } = await request.json();

    if (!invoice_id) {
      return NextResponse.json({ error: 'invoice_id wajib diisi' }, { status: 400 });
    }

    const supabase = getAdminSupabase();

    // Ambil data tagihan beserta data siswa
    const { data: invoice, error: invoiceError } = await supabase
      .from('general_invoices')
      .select(`
        *,
        students (
          id,
          name,
          student_number,
          class,
          parent_name,
          parent_phone
        )
      `)
      .eq('id', invoice_id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Tagihan tidak ditemukan' }, { status: 404 });
    }

    const student = invoice.students;

    if (!student || !student.parent_phone) {
      return NextResponse.json({ error: 'Nomor HP orang tua tidak tersedia' }, { status: 400 });
    }

    if (invoice.status === 'PAID') {
      return NextResponse.json({ message: 'Tagihan ini sudah lunas' }, { status: 200 });
    }

    let detailsText = '';
    const items = invoice.items || [];

    items.forEach((item: any, index: number) => {
      const itemAmount = Number(item.amount) || 0;
      const itemPaid = Number(item.paid_amount) || 0;
      const itemSisa = itemAmount - itemPaid;

      if (itemSisa > 0) {
        detailsText += `${index + 1}. ${item.name} - Sisa Rp ${itemSisa.toLocaleString('id-ID')}\n`;
      } else {
        detailsText += `${index + 1}. ${item.name} - Lunas\n`;
      }
    });

    const totalTagihan = Number(invoice.total_amount) || 0;
    const totalTerbayar = Number(invoice.paid_amount) || 0;
    const totalTunggakan = totalTagihan - totalTerbayar;
    const due_date_terdekat = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('id-ID') : '-';

    const messageTemplate = `Assalamu'alaikum Warahmatullahi Wabarakatuh

Kepada Yth. Bapak/Ibu ${student.parent_name || ''}
Orang tua dari: ${student.name} - Kelas ${student.class || ''}

Informasi Tagihan Keuangan MI Attaqwa 15 Babelan, untuk ananda ${student.name}:

Tagihan: ${invoice.title}
${detailsText}
Total Tagihan: Rp ${totalTagihan.toLocaleString('id-ID')}
Total Tunggakan: Rp ${totalTunggakan.toLocaleString('id-ID')}
Total Terbayar: Rp ${totalTerbayar.toLocaleString('id-ID')}
Due Date Terdekat: ${due_date_terdekat}

Mohon segera lakukan pembayaran untuk menghindari denda dan tunggakan lebih lanjut.

Bayar melalui transfer silahkan akses portal orang tua di :
URL : https://parent.miattaqwa15.sch.id
Login ID Siswa : ${student.student_number}

Terima kasih`;

    // Kirim pesan WA
    await sendWhatsAppMessage(student.parent_phone, messageTemplate);

    // Simpan history
    try {
      await supabase.from('wa_history').insert({
        student_id: student.id,
        phone_number: student.parent_phone,
        message: messageTemplate,
        status: 'SUCCESS'
      });
    } catch (historyErr) {
      console.warn('Gagal menyimpan history (tabel mungkin belum ada):', historyErr);
    }

    return NextResponse.json({ success: true, message: 'Notifikasi WA berhasil dikirim' });
  } catch (error: any) {
    console.error('API wa-notify error:', error);

    // Coba simpan history gagal
    try {
      // @ts-ignore
      const { invoice_id } = await request.clone().json().catch(() => ({}));

      if (invoice_id) {
        // Try fetching phone number if possible
        const { data: inv } = await supabase.from('general_invoices').select('students(id, parent_phone)').eq('id', invoice_id).single();
        if (inv && inv.students) {
          await supabase.from('wa_history').insert({
            student_id: inv.students.id,
            phone_number: inv.students.parent_phone,
            message: error.message || 'Failed',
            status: 'FAILED'
          });
        }
      }
    } catch (e) { }

    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}
