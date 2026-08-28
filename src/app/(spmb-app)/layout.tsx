import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pendaftaran SPMB Online | MI Attaqwa 15 Babelan',
  description: 'Portal Sistem Penerimaan Murid Baru (SPMB) Online MI Attaqwa 15 Babelan. Isi formulir, cek status, dan unggah berkas pendaftaran.',
};

export default function SpmbAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased [&_h1]:font-sans [&_h2]:font-sans [&_h3]:font-sans [&_h4]:font-sans [&_h5]:font-sans [&_h6]:font-sans">
      {children}
    </div>
  );
}
