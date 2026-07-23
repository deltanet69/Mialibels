import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendWhatsAppMessage } from '@/lib/openwa';

export async function POST(request: NextRequest) {
  try {
    const { student_id } = await request.json();

    if (!student_id) {
      return NextResponse.json({ error: 'student_id wajib diisi' }, { status: 400 });
    }

    // Ambil data siswa
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', student_id)
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 404 });
    }

    if (!student.parent_phone) {
      return NextResponse.json({ error: 'Nomor HP orang tua tidak tersedia' }, { status: 400 });
    }

    // Ambil semua tagihan yang belum lunas
    const { data: invoices, error: invoicesError } = await supabase
      .from('spp_invoices')
      .select('*')
      .eq('student_id', student_id)
      .neq('status', 'PAID')
      .order('due_date', { ascending: true });

    if (invoicesError) {
      return NextResponse.json({ error: 'Gagal mengambil data tagihan' }, { status: 500 });
    }

    if (!invoices || invoices.length === 0) {
      return NextResponse.json({ message: 'Tidak ada tagihan tertunggak untuk siswa ini' }, { status: 200 });
    }

    let totalTagihan = 0;
    let totalTerbayar = 0;
    let detailsText = '';
    
    // Nearest due date is the first one since we ordered by due_date ascending
    const due_date_terdekat = invoices[0].due_date ? new Date(invoices[0].due_date).toLocaleDateString('id-ID') : '-';

    invoices.forEach((inv, index) => {
      totalTagihan += inv.amount || 0;
      totalTerbayar += inv.paid_amount || 0;
      
      const sisa = (inv.amount || 0) - (inv.paid_amount || 0);
      detailsText += `${index + 1}. ${inv.title} - Sisa Rp ${sisa.toLocaleString('id-ID')}\n`;
    });

    const totalTunggakan = totalTagihan - totalTerbayar;

    const messageTemplate = `Assalamu'alaikum Warahmatullahi Wabarakatuh

Kepada Yth. Bapak/Ibu ${student.parent_name || ''}
Orang tua dari: ${student.name} - Kelas ${student.class || ''}

Informasi Tagihan Keuangan MI Attaqwa 15 Babelan, untuk ananda ${student.name}:

${detailsText}
Total Tagihan: Rp ${totalTagihan.toLocaleString('id-ID')}
Total Tunggakan: Rp ${totalTunggakan.toLocaleString('id-ID')}
Total Terbayar: Rp ${totalTerbayar.toLocaleString('id-ID')}
Due Date Terdekat: ${due_date_terdekat}

Mohon segera lakukan pembayaran untuk menghindari denda dan tunggakan lebih lanjut.

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
      });
    } catch (historyErr) {
      console.warn('Gagal menyimpan history (tabel mungkin belum ada):', historyErr);
    }

    return NextResponse.json({ success: true, message: 'Notifikasi WA berhasil dikirim' });
  } catch (error: any) {
    console.error('API wa-notify error:', error);
    
    // Coba simpan history gagal
    try {
      // @ts-ignore (we know student_id might not be available here, but we try)
      const { student_id, phone } = await request.clone().json().catch(() => ({}));
      if (student_id && phone) {
        await supabase.from('wa_history').insert({
          student_id,
          phone_number: phone,
          message: error.message || 'Failed',
          status: 'FAILED'
        });
      }
    } catch (e) {}

    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 });
  }
}
