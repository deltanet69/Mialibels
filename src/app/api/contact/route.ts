import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key so we bypass RLS for admin operations
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Nama, Email, Subjek, dan Pesan wajib diisi.' },
        { status: 400 }
      );
    }

    // Save to database via Supabase JS client (uses HTTP, not port 5432)
    const supabase = getAdminClient();
    const { error: dbError } = await supabase
      .from('contact_messages')
      .insert({
        name,
        email,
        phone: phone || null,
        subject,
        message,
      });

    if (dbError) {
      console.error('DB insert error:', dbError);
      return NextResponse.json(
        { error: 'Gagal menyimpan pesan. Silakan coba lagi.' },
        { status: 500 }
      );
    }

    // Try to send email — wrapped so it never breaks the response
    try {
      const RESEND_KEY = process.env.RESEND_API_KEY;
      if (RESEND_KEY) {
        const { Resend } = await import('resend');
        const resend = new Resend(RESEND_KEY);

        const senderEmail = 'contact@miattaqwa15.sch.id';
        const adminEmail = process.env.ADMIN_EMAIL || senderEmail;

        const adminHtml =
          '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">' +
          '<div style="background: #001d3d; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">' +
          '<h2 style="color: #fff; margin: 0;">Notifikasi Pesan Baru</h2>' +
          '<p style="color: #94a3b8; margin: 8px 0 0;">Dari Form Kontak Website MI Attaqwa 15</p>' +
          '</div>' +
          '<div style="background: #fff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">' +
          '<table style="width:100%; border-collapse:collapse;">' +
          '<tr><td style="padding:10px 0; border-bottom:1px solid #f3f4f6; color:#64748b; width:30%; font-weight:600;">Nama</td>' +
          '<td style="padding:10px 0; border-bottom:1px solid #f3f4f6;">' + name + '</td></tr>' +
          '<tr><td style="padding:10px 0; border-bottom:1px solid #f3f4f6; color:#64748b; font-weight:600;">Email</td>' +
          '<td style="padding:10px 0; border-bottom:1px solid #f3f4f6;"><a href="mailto:' + email + '" style="color:#2563eb;">' + email + '</a></td></tr>' +
          '<tr><td style="padding:10px 0; border-bottom:1px solid #f3f4f6; color:#64748b; font-weight:600;">Telepon</td>' +
          '<td style="padding:10px 0; border-bottom:1px solid #f3f4f6;">' + (phone || '-') + '</td></tr>' +
          '<tr><td style="padding:10px 0; border-bottom:1px solid #f3f4f6; color:#64748b; font-weight:600;">Subjek</td>' +
          '<td style="padding:10px 0; border-bottom:1px solid #f3f4f6; font-weight:500;">' + subject + '</td></tr>' +
          '</table>' +
          '<div style="background:#f8fafc; padding:20px; border-radius:8px; border-left:4px solid #001d3d; margin-top:20px;">' +
          '<p style="margin:0 0 8px; color:#64748b; font-size:13px; font-weight:600;">PESAN:</p>' +
          '<p style="margin:0; color:#334155; font-size:15px; line-height:1.6; white-space:pre-wrap;">' + message + '</p>' +
          '</div></div></div>';

        const preview = message.length > 100 ? message.substring(0, 100) + '...' : message;

        const userHtml =
          '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden;">' +
          '<div style="background: #001d3d; padding: 40px 30px; text-align: center;">' +
          '<h1 style="color: #fff; margin: 0; font-size: 26px;">Terima Kasih, ' + name + '!</h1>' +
          '<p style="color: #93c5fd; margin: 10px 0 0;">Pesan Anda telah kami terima.</p>' +
          '</div>' +
          '<div style="padding: 32px; background: #fff;">' +
          '<p style="color:#334155; font-size:16px;">Halo <strong>' + name + '</strong>,</p>' +
          '<p style="color:#334155; font-size:16px;">Kami telah menerima pesan Anda mengenai <strong>' + subject + '</strong>.</p>' +
          '<div style="background:#f8fafc; border-radius:12px; padding:20px; margin:20px 0; border:1px dashed #cbd5e1;">' +
          '<p style="margin:0; color:#475569; font-style:italic;">"' + preview + '"</p>' +
          '</div>' +
          '<p style="color:#334155;">Tim MI Attaqwa 15 akan merespons dalam 1-2 hari kerja.</p>' +
          '</div>' +
          '<div style="background:#f8fafc; padding:20px; text-align:center; border-top:1px solid #e5e7eb;">' +
          '<p style="color:#64748b; margin:0;">MI Attaqwa 15 Babelan</p>' +
          '</div></div>';

        await resend.emails.send({
          from: 'Notifikasi Website <' + senderEmail + '>',
          to: adminEmail,
          replyTo: email,
          subject: '[Kontak Baru] ' + subject,
          html: adminHtml,
        });

        await resend.emails.send({
          from: 'MI Attaqwa 15 Babelan <' + senderEmail + '>',
          to: email,
          subject: 'Terima Kasih telah Menghubungi MI Attaqwa 15 - ' + subject,
          html: userHtml,
        });
      }
    } catch (emailError) {
      console.error('Email sending failed, message saved to DB:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Pesan berhasil dikirim dan tersimpan di sistem kami.'
    });

  } catch (error: unknown) {
    console.error('Contact API Error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memproses permintaan. Coba lagi nanti.' },
      { status: 500 }
    );
  }
}
