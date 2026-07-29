import React from 'react'
import { createClient } from "@supabase/supabase-js";
import PrintButton from '@/components/print/invoice/PrintButton';
import { getSession } from "@/lib/session";
import Script from 'next/script';

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

export default async function PrintSppReceipt(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;

  const session = await getSession();
  const supabase = getAdminSupabase();

  const { data: invoice, error } = await supabase
    .from("spp_invoices")
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

  const { data: otherUnpaidInvoices } = await supabase
    .from('spp_invoices')
    .select('*')
    .eq('student_id', invoice.student_id)
    .in('status', ['UNPAID', 'PARTIAL'])
    .neq('id', id)
    .order('due_date', { ascending: true });

  const allInvoices = [invoice, ...(otherUnpaidInvoices || [])].sort(
    (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  );

  const formatRp = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

  const totalAmount = allInvoices.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0);
  const totalPaid = allInvoices.reduce((acc: number, curr: any) => acc + Number(curr.paid_amount || 0), 0);
  const sisa = totalAmount - totalPaid;

  return (
    <div className="bg-gray-100 min-h-screen text-black flex justify-center items-start pt-8">
      <title>{`Bukti Pembayaran - ${invoice.students?.name || 'Siswa'}`}</title>
      <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        
        body {
          font-family: 'Inter', sans-serif;
          background-color: #f3f4f6;
          color: black;
        }
        
        .ncr-container {
          width: 20cm;
          min-height: 13cm;
          background-color: white;
          position: relative;
          padding: 0.4cm;
          color: black;
          box-sizing: border-box;
          border: 1px dashed #ccc;
        }

        @media print {
          @page {
            size: 9.5in 5.5in portrait;
            margin: 0;
          }
          * {
            -webkit-print-color-adjust: economy !important;
            print-color-adjust: economy !important;
            background-color: transparent !important;
            box-shadow: none !important;
          }
          body {
            background-color: transparent !important;
            margin: 0;
          }
          .ncr-container {
            margin: 0;
            width: 19.5cm !important;
            height: 13cm !important;
            border: none !important;
            padding: 0.5cm;
          }
          .print-hide {
            display: none !important;
          }
        }
      `}} />
      <div className="ncr-container flex flex-col justify-between">
          <div>
            {/* Header Section */}
            <div className="flex justify-between items-center border-b-[1.5px] tracking-wide border-black pb-3 mb-2">
              <div>
                <h2 className="text-[12px] font-bold uppercase tracking-wide">MI ATTAQWA 15 BABELAN</h2>
                <p className="text-[10px]">Jl. Raya Ps. Babelan No.1, Babelan Kota, Kec. Babelan, Kabupaten Bekasi, Jawa Barat 17610</p>
              </div>
              <div className="text-right">
                <h2 className="text-[12px] font-bold tracking-wide">BUKTI BAYAR INFAQ</h2>
                <p className="text-[10px] tracking-wide">No: {invoice.id.split('-')[0].toUpperCase()}</p>
              </div>
            </div>

            {/* Info Section */}
            <div className="flex justify-between text-[10px] tracking-wide pb-1 mb-1.5 mt-1 font-semibold">
              <div className="space-y-0.5">
                <p>Nama &nbsp;&nbsp;&nbsp;&nbsp;: {invoice.students?.name || '-'}</p>
                <p>Kls/NISN : {invoice.students?.class || '-'} / {invoice.students?.nisn || '-'}</p>
              </div>
              <div className="text-right space-y-0.5 tracking-wide">
                <p>Tgl &nbsp;&nbsp;&nbsp;&nbsp;: {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                <p>Metode : {invoice.payment_method === 'TRANSFER' ? 'Transfer' : 'Tunai'}</p>
              </div>
            </div>

            {/* Table Section */}
            <div className="border-t-[1.5px] border-b-[1.5px] border-black py-0.5 mb-1.5">
              <table className="w-full text-left text-[10px] tracking-wide">
                <thead>
                  <tr className="border-b border-black font-semibold">
                    <th className="py-0.5 w-6">No</th>
                    <th className="py-0.5">Deskripsi</th>
                    <th className="py-0.5 text-right">Tagihan</th>
                    <th className="py-0.5 text-right">Dibayar</th>
                  </tr>
                </thead>
                <tbody>
                  {allInvoices.map((inv: any, idx: number) => (
                    <tr key={inv.id} className="border-b border-gray-300 border-dashed last:border-0 tracking-wide">
                      <td className="py-1 align-top">{idx + 1}</td>
                      <td className="py-1">
                        {inv.title}
                        <span className="ml-1 text-[7px] italic border border-black px-0.5 rounded">
                          {Number(inv.paid_amount) >= Number(inv.amount) ? '*lunas' : '*belum lunas'}
                        </span>
                      </td>
                      <td className="py-1 text-right align-top">{formatRp(Number(inv.amount))}</td>
                      <td className="py-1 text-right align-top">{formatRp(Number(inv.paid_amount))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations */}
            <div className="flex justify-end text-[10px] mb-2 font-semibold tracking-wide">
              <div className="w-1/2 space-y-0.5">
                <div className="flex justify-between">
                  <span>Sub Total:</span>
                  <span>{formatRp(totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tunggakan:</span>
                  <span>{formatRp(sisa > 0 ? sisa : 0)}</span>
                </div>
                <div className="flex justify-between text-[10px] mt-0.5 border-t-[1.5px] border-black pt-0.5">
                  <span>TOTAL DIBAYAR:</span>
                  <span>{formatRp(totalPaid)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Signature */}
          <div className="flex justify-between text-[10px] font-bold tracking-wide mt-auto">
            <div className="text-center w-32">
              <p className="mb-12">Penyetor,</p>
              <div className="border-b border-black mb-0.5"></div>
              <p className="break-words leading-tight">{invoice.students?.name || '-'}</p>
            </div>
            <div className="text-center w-32">
              <p className="mb-12">Petugas TU,</p>
              <div className="border-b border-black mb-0.5"></div>
              <p className="break-words leading-tight">{session?.name || 'Admin'}</p>
            </div>
          </div>

          <div className="absolute top-2 -right-16 print-hide">
            <PrintButton />
          </div>
      </div>
    </div>
  );
}
