import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";
import { sendWhatsAppMessage, OPENWA_URL } from '@/lib/openwa';

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
    const { invoice_id, student_id } = await request.json();

    if (!invoice_id && !student_id) {
      return NextResponse.json({ error: 'invoice_id atau student_id wajib diisi' }, { status: 400 });
    }

    let targetStudentId = student_id;
    let due_date_terdekat = '-';

    if (!targetStudentId) {
      // Get student_id from invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('spp_invoices')
        .select('student_id, due_date')
        .eq('id', invoice_id)
        .single();
        
      if (invoiceError || !invoice) {
         return NextResponse.json({ error: 'Tagihan tidak ditemukan' }, { status: 404 });
      }
      targetStudentId = invoice.student_id;
      if (invoice.due_date) {
         due_date_terdekat = new Date(invoice.due_date).toLocaleDateString('id-ID');
      }
    }

    // Ambil data siswa
    const { data: student, error: studentErr } = await supabase
      .from('students')
      .select('id, name, student_number, nisn, class, parent_name, parent_phone')
      .eq('id', targetStudentId)
      .single();

    if (studentErr || !student) {
      return NextResponse.json({ error: 'Data siswa tidak ditemukan' }, { status: 404 });
    }

    if (!student.parent_phone) {
      return NextResponse.json({ error: 'Nomor HP orang tua tidak tersedia' }, { status: 400 });
    }

    // Ambil semua tagihan Infaq belum lunas untuk siswa ini
    const { data: unpaidInvoices, error: unpaidErr } = await supabase
      .from('spp_invoices')
      .select('*')
      .eq('student_id', targetStudentId)
      .in('status', ['UNPAID', 'PARTIAL'])
      .order('year', { ascending: true })
      .order('month', { ascending: true });

    if (unpaidErr) throw unpaidErr;

    if (!unpaidInvoices || unpaidInvoices.length === 0) {
      return NextResponse.json({ message: 'Semua tagihan Infaq/SPP siswa ini sudah lunas' }, { status: 200 });
    }
    
    let detailsText = '';
    let totalTagihan = 0;
    let totalTerbayar = 0;
    
    if (due_date_terdekat === '-' && unpaidInvoices.length > 0 && unpaidInvoices[0].due_date) {
       due_date_terdekat = new Date(unpaidInvoices[0].due_date).toLocaleDateString('id-ID');
    }

    unpaidInvoices.forEach((item: any, index: number) => {
      const itemAmount = Number(item.amount) || 0;
      const itemPaid = Number(item.paid_amount) || 0;
      const itemSisa = itemAmount - itemPaid;
      
      totalTagihan += itemAmount;
      totalTerbayar += itemPaid;
      
      detailsText += `${index + 1}. ${item.title} - Sisa Rp ${itemSisa.toLocaleString('id-ID')}\n`;
    });

    const totalTunggakan = totalTagihan - totalTerbayar;

    const messageTemplate = `Assalamu'alaikum Warahmatullahi Wabarakatuh

Kepada Yth. Bapak/Ibu ${student.parent_name || ''}
Orang tua dari: ${student.name} - Kelas ${student.class || ''}

Informasi Tagihan SPP/Infaq MI Attaqwa 15 Babelan, untuk ananda ${student.name}:

${detailsText}
Total Keseluruhan Tagihan: Rp ${totalTagihan.toLocaleString('id-ID')}
Total Telah Terbayar: Rp ${totalTerbayar.toLocaleString('id-ID')}
Sisa Tunggakan: Rp ${totalTunggakan.toLocaleString('id-ID')}
Due Date Terdekat: ${due_date_terdekat}

Mohon segera lakukan pembayaran untuk menghindari tunggakan lebih lanjut.

Bayar melalui transfer silahkan akses portal orang tua di :
URL : https://parent.miattaqwa15.sch.id
Login ID Siswa : ${student.nisn || student.student_number}
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
      const { invoice_id, student_id } = await request.clone().json().catch(() => ({}));
      let targetId = student_id;
      if (invoice_id && !targetId) {
        const { data: inv } = await supabase.from('spp_invoices').select('student_id').eq('id', invoice_id).single();
        if (inv) targetId = inv.student_id;
      }
      
      if (targetId) {
        const { data: student } = await supabase.from('students').select('parent_phone').eq('id', targetId).single();
        if (student) {
            await supabase.from('wa_history').insert({
              student_id: targetId,
              phone_number: student.parent_phone,
              message: error.message || 'Failed',
              status: 'FAILED'
            } as any);
        }
      }
    } catch (e) {}

    return NextResponse.json({ error: (error.message || 'Server Error') + ` (URL: ${OPENWA_URL})` }, { status: 500 });
  }
}
