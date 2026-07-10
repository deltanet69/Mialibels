import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, subject, message } = await req.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Nama, Email, Subjek, dan Pesan wajib diisi.' },
        { status: 400 }
      );
    }

    const smtpEmail = process.env.SMTP_EMAIL;
    const smtpPassword = process.env.SMTP_PASSWORD;
    const adminEmail = process.env.ADMIN_EMAIL || smtpEmail;

    // Jika SMTP belum di-set, kita bypass dan simulasikan sukses (untuk development/testing)
    if (!smtpEmail || !smtpPassword) {
      console.warn('⚠️ SMTP_EMAIL atau SMTP_PASSWORD belum diatur di .env.local');
      console.log('Simulasi pengiriman form kontak:', { name, email, phone, subject, message });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Pesan berhasil dikirim (Simulasi - SMTP belum dikonfigurasi).' 
      });
    }

    // Konfigurasi transporter (menggunakan Gmail)
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: smtpEmail,
        pass: smtpPassword,
      },
    });

    // 1. Email notifikasi ke Admin
    await transporter.sendMail({
      from: `"${name}" <${smtpEmail}>`, // Karena Gmail akan menggunakan email akun smtp, kita tulis nama pengirimnya
      replyTo: email,
      to: adminEmail,
      subject: `[Kontak Website] ${subject}`,
      html: `
        <h3>Pesan Baru dari Form Kontak Website</h3>
        <p><strong>Nama:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Telepon:</strong> ${phone || '-'}</p>
        <p><strong>Subjek:</strong> ${subject}</p>
        <hr />
        <p><strong>Pesan:</strong></p>
        <p>${message.replace(/\n/g, '<br />')}</p>
      `,
    });

    // 2. Email auto-response ke Pengirim (User)
    await transporter.sendMail({
      from: `"MI Attaqwa 15 Babelan" <${smtpEmail}>`,
      to: email,
      subject: `Pesan Diterima: ${subject}`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
          <h2>Halo ${name},</h2>
          <p>Terima kasih telah menghubungi MI Attaqwa 15 Babelan.</p>
          <p>Pesan Anda dengan subjek <strong>"${subject}"</strong> telah kami terima. Tim kami akan segera menindaklanjuti pesan Anda dan membalas melalui email atau telepon sesegera mungkin.</p>
          <br />
          <p><strong>Salam hangat,</strong><br />Tim Admin MI Attaqwa 15 Babelan</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: 'Pesan berhasil dikirim.' });

  } catch (error: any) {
    console.error('Contact API Error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengirim pesan. Coba lagi nanti.' },
      { status: 500 }
    );
  }
}
