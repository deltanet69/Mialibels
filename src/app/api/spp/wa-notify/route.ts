import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";
import { sendWhatsAppMessage } from '@/lib/openwa';

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  const supabase = getAdminSupabase();
  try {
    const { invoice_id, item_name } = await request.json();

    if (!invoice_id || !item_name) {
      return NextResponse.json({ error: 'invoice_id dan item_name wajib diisi' }, { status: 400 });
    }

    // Ambil data tagihan dari general_invoices
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

    const student: any = Array.isArray(invoice.students) ? invoice.students[0] : invoice.students;

    if (!student || !student.parent_phone) {
      return NextResponse.json({ error: 'Nomor HP orang tua tidak tersedia' }, { status: 400 });
    }

    // Cari semua item yang belum lunas
    const items = invoice.items || [];
    const unpaidItems = items.filter((i: any) => {
      const sisa = (Number(i.amount) || 0) - (Number(i.paid_amount) || 0);
      return sisa > 0;
    });

    if (unpaidItems.length === 0) {
      return NextResponse.json({ message: 'Semua tagihan di rincian ini sudah lunas' }, { status: 200 });
    }
    
    // Nearest due date
    const due_date_terdekat = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('id-ID') : '-';

    let detailsText = '';
    unpaidItems.forEach((item: any, index: number) => {
      const itemSisa = (Number(item.amount) || 0) - (Number(item.paid_amount) || 0);
      detailsText += `${index + 1}. ${item.name} - Sisa Rp ${itemSisa.toLocaleString('id-ID')}\n`;
    });

    const totalTagihan = Number(invoice.total_amount) || 0;
    const totalTerbayar = Number(invoice.paid_amount) || 0;
    const totalTunggakan = totalTagihan - totalTerbayar;

    const messageTemplate = `Assalamu'alaikum Warahmatullahi Wabarakatuh

Kepada Yth. Bapak/Ibu ${student.parent_name || ''}
Orang tua dari: ${student.name} - Kelas ${student.class || ''}

Informasi Tagihan Keuangan MI Attaqwa 15 Babelan, untuk ananda ${student.name}:

${detailsText}
Total Keseluruhan Tagihan: Rp ${totalTagihan.toLocaleString('id-ID')}
Total Telah Terbayar: Rp ${totalTerbayar.toLocaleString('id-ID')}
Sisa Tunggakan: Rp ${totalTunggakan.toLocaleString('id-ID')}
Due Date Terdekat: ${due_date_terdekat}

Mohon segera lakukan pembayaran untuk menghindari tunggakan lebih lanjut.

Bayar melalui transfer silahkan akses portal orang tua di :
URL : https://parent.miattaqwa15.sch.id
Login ID Siswa : ${student.student_number}
Password : 123456 (Bawaan: mialibels15 jika belum diubah)

Terima kasih`;

    // Kirim pesan WA
    await sendWhatsAppMessage(student.parent_phone, messageTemplate);

    // Simpan history (dibungkus try-catch agar tidak menggagalkan response jika tabel belum ada)
    try {
      await supabase.from('wa_history').insert({
        student_id: student.id,
        phone_number: student.parent_phone,
        message: messageTemplate,
        status: 'SUCCESS'
      } as any);
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
        const { data: inv } = await supabase.from('general_invoices').select('students(id, parent_phone)').eq('id', invoice_id).single();
        if (inv && inv.students) {
          const studentData: any = Array.isArray(inv.students) ? inv.students[0] : inv.students;
          if (studentData) {
            await supabase.from('wa_history').insert({
              student_id: studentData.id,
              phone_number: studentData.parent_phone,
              message: error.message || 'Failed',
              status: 'FAILED'
            } as any);
          }
        }
      }
    } catch (e) {}

    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}
