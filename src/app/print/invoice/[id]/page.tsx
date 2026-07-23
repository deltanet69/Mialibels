import React from 'react'
import { createClient } from "@supabase/supabase-js";
import PrintButton from './PrintButton';
import { getSession } from "@/lib/session";

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

export default async function PrintInvoiceReceipt(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;

  const session = await getSession();
  const supabase = getAdminSupabase();

  const { data: invoice, error } = await supabase
    .from("general_invoices")
    .select(`
      *,
      students (
        name, nisn, student_number, class, parent_name
      )
    `)
    .eq("id", id)
    .single();

  if (error || !invoice) {
    return <div className="p-4 text-center font-bold">Data tagihan tidak ditemukan.</div>;
  }

  const formatRp = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

  const sisa = Number(invoice.total_amount) - Number(invoice.paid_amount);

  return (
    <div className="bg-[#f1f5f9] min-h-screen text-[#333]">
      <title>{`Bukti Pembayaran - ${invoice.students?.name || 'Siswa'}`}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        body {
          font-family: 'Inter', sans-serif;
          background-color: #f1f5f9;
          color: #333;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .a4-container {
          width: 210mm;
          min-height: 297mm;
          margin: 2rem auto;
          background-color: white;
          box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.1);
          position: relative;
          padding: 0;
        }

        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            background-color: white;
            margin: 0;
          }
          .a4-container {
            margin: 0;
            box-shadow: none;
            width: 100%;
            min-height: 100vh;
          }
          .print-hide {
            display: none !important;
          }
        }
      `}} />
      <div className="a4-container flex flex-col">
          {/* Header Section */}
          <div className="px-12 pt-0 pb-0 flex justify-between items-center border-b border-gray-200">
            <div className="flex items-center gap-0">
              <img src="/logomi.png" alt="Logo" className="w-40 h-40 object-contain" />
              
            </div>
            
            <div className="text-right">
              <h2 className="text-3xl font-bold tracking-wider">BUKTI BAYAR</h2>
              <p className="text-gray-400 text-sm mt-1">Simpan sebagai bukti sah</p>
            </div>
          </div>
          <div className="px-12 pb-6 flex justify-between items-center">
                <p className="text-sm text-gray-500 font-medium mt-1">Jl. Raya Ps. Babelan No.1, Babelan Kota, Kec. Babelan, Kabupaten Bekasi, Jawa Barat 17610</p>
              </div>

          {/* Info Section */}
          <div className="px-12 py-6 flex justify-between items-center bg-gray-50/50 border-b border-gray-100">
            <div className="flex gap-16">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">No. Tagihan</p>
                <p className="font-semibold text-gray-800">{invoice.id.split('-')[0].toUpperCase()}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Tanggal Cetak</p>
                <p className="font-semibold text-gray-800">
                  {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Metode Pembayaran</p>
              <h3 className="font-bold text-gray-800">{invoice.payment_method === 'TRANSFER' ? 'Transfer Bank' : invoice.payment_method === 'CASH' ? 'Tunai (TU)' : '-'}</h3>
            </div>
          </div>

          {/* Table Section */}
          <div className="px-12 py-8 flex-1">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-600 text-white">
                  <th className="py-3 px-4 font-semibold text-sm w-12 rounded-tl-lg">No</th>
                  <th className="py-3 px-4 font-semibold text-sm">Deskripsi Tagihan</th>
                  <th className="py-3 px-4 font-semibold text-sm text-right">Total Tagihan</th>
                  <th className="py-3 px-4 font-semibold text-sm text-right rounded-tr-lg">Nominal Dibayar</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.items || []).map((item: any, idx: number) => {
                  const paid = Number(item.paid_amount) || 0;
                  const itemAmount = Number(item.amount) || 0;
                  
                  return (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="py-4 px-4 text-sm text-gray-500 font-medium">{idx + 1}</td>
                      <td className="py-4 px-4 text-sm text-gray-800 font-medium">
                        {item.name}
                        {paid === 0 && <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">Belum Dibayar</span>}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600 text-right">{formatRp(itemAmount)}</td>
                      <td className="py-4 px-4 text-sm text-gray-800 font-semibold text-right">{formatRp(paid)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Calculations */}
            <div className="mt-8 flex justify-end">
              <div className="w-80 space-y-3">
                <div className="flex justify-between text-sm text-gray-600 px-4 mt-20">
                  <span>Sub Total Tagihan:</span>
                  <span className="font-medium">{formatRp(invoice.total_amount)}</span>
                </div>
                <div className="flex justify-between text-sm text-red-500 px-4">
                  <span>Sisa Tagihan (Tunggakan):</span>
                  <span className="font-semibold">{formatRp(sisa > 0 ? sisa : 0)}</span>
                </div>
                <div className="flex justify-between items-center bg-gray-600 text-white px-4 py-2 rounded-lg shadow-sm mt-4">
                  <span className="font-semibold">Total Dibayar Saat Ini</span>
                  <span className="font-bold text-lg">{formatRp(invoice.paid_amount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Signature */}
          <div className="px-12 pb-12 pt-16">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Diterima Dari:</p>
                <h3 className="font-bold text-lg text-gray-800">{invoice.students?.name || '-'}</h3>
                <p className="text-sm text-gray-600">NISN / ID: {invoice.students?.student_number || '-'}</p>
                <p className="text-sm text-gray-600">Kelas: {invoice.students?.class || '-'}</p>
                <p className="text-sm text-gray-600">Nama Orang Tua: {invoice.students?.parent_name || '-'}</p>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-20">Admin / Tata Usaha</p>
                <div className="w-56 border-b border-gray-400 mb-2"></div>
                <p className="text-sm text-gray-800 font-bold">{session?.name || 'Admin Keuangan'}</p>
                <p className="text-xs text-gray-500 mt-0.5">Staff TU</p>
              </div>
            </div>
          </div>

          <div className="absolute top-4 right-4 print-hide">
            <PrintButton />
          </div>
        </div>
    </div>
  );
}
