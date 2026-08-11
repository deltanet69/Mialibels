import React from 'react'
import { createClient } from "@supabase/supabase-js";
import PrintButton from '@/components/print/invoice/PrintButton';
import { getSession } from "@/lib/session";
import Script from 'next/script';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

export default async function PrintInvoiceReceipt(props: { params: Promise<{ id: string }>, searchParams: Promise<{ mode?: string, items?: string }> }) {
  const params = await props.params;
  const { id } = params;
  const searchParams = await props.searchParams;
  const mode = searchParams.mode || 'default'; // 'current' or 'all'
  // Items paid in THIS specific transaction (passed from the modal as JSON)
  const itemsParam = searchParams.items || null;

  const session = await getSession()
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

  // Full invoice items (all of them, for totals calculation)
  const allItems = invoice.items || [];
  const invoiceTotalAmount = allItems.reduce((acc: number, i: any) => acc + Number(i.amount || 0), 0);
  const invoiceTotalPaid = allItems.reduce((acc: number, i: any) => acc + Number(i.paid_amount || 0), 0);
  const invoiceTotalSisa = invoiceTotalAmount - invoiceTotalPaid;

  // Determine which items to show in the table
  let itemsToPrint = allItems;

  if (mode === 'all') {
    // Cetak Seluruh Tagihan — all items from all student invoices of this type
    const { data: allStudentInvoices } = await supabase
      .from('general_invoices')
      .select('items')
      .eq('student_id', invoice.student_id);
      
    if (allStudentInvoices && allStudentInvoices.length > 0) {
      itemsToPrint = allStudentInvoices.flatMap((inv: any) => inv.items || []);
    }
  } else if (mode === 'current') {
    // Cetak Pembayaran Saat Ini — ONLY the items paid in THIS specific transaction
    if (itemsParam) {
      try {
        // Use the exact items passed from the modal (items paid just now)
        const parsedItems = JSON.parse(decodeURIComponent(itemsParam));
        itemsToPrint = parsedItems.filter((i: any) => Number(i.paid_amount) > 0);
      } catch {
        // Fallback: show items with paid_amount > 0
        itemsToPrint = allItems.filter((item: any) => Number(item.paid_amount) > 0);
      }
    } else {
      // Fallback if items param missing
      itemsToPrint = allItems.filter((item: any) => Number(item.paid_amount) > 0);
    }
  }

  // Totals for the printed items (transaction totals for mode=current)
  const transactionTotal = itemsToPrint.reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0);
  const transactionPaid = itemsToPrint.reduce((acc: number, curr: any) => acc + Number(curr.paid_amount || 0), 0);

  const formatRp = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

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
          padding: 0.25cm 0.4cm;
          color: black;
          box-sizing: border-box;
          border: 1px dashed #ccc;
        }

        @media print {
          @page {
            /* Ukuran standar continuous form kertas dibagi 2 (9.5 x 5.5 inch) */
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
            padding: 0.25cm 0.4cm !important;
          }
          .print-hide {
            display: none !important;
          }
        }
      `}} />
      <div className="ncr-container flex flex-col justify-between leading-tight">
          <div>
            {/* Header Section */}
            <div className="flex justify-between items-center border-b-[1.5px] tracking-wide border-black pb-1.5 mb-1">
              <div>
                <h2 className="text-[11px] font-bold uppercase tracking-wide">MI ATTAQWA 15 BABELAN</h2>
                <p className="text-[9px]">Jl. Raya Ps. Babelan No.1, Babelan Kota, Kec. Babelan, Kabupaten Bekasi, Jawa Barat 17610</p>
              </div>
              <div className="text-right">
                <h2 className="text-[11px] font-bold tracking-wide">{mode === 'all' ? 'RINCIAN SELURUH TAGIHAN' : 'BUKTI BAYAR'}</h2>
                <p className="text-[9px] tracking-wide">
                  {mode === 'all' ? `Dicetak: ${new Date().toLocaleDateString('id-ID')}` : `No: ${invoice.id.split('-')[0].toUpperCase()}`}
                </p>
              </div>
            </div>

            {/* Info Section */}
            <div className="flex justify-between text-[9px] tracking-wide pb-1 mb-1 mt-0.5 font-semibold">
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
            <div className="border-t-[1px] border-b-[1px] border-black py-0.5 mb-1">
              <table className="w-full text-left text-[9px] tracking-wide">
                <thead>
                  <tr className="border-b border-black font-semibold">
                    <th className="py-0.5 w-6">No</th>
                    <th className="py-0.5">Deskripsi</th>
                    <th className="py-0.5 text-right">Tagihan</th>
                    <th className="py-0.5 text-right">Dibayar</th>
                    {mode === 'all' && <th className="py-0.5 text-right">Tunggakan</th>}
                  </tr>
                </thead>
                <tbody>
                  {(itemsToPrint).map((item: any, idx: number) => {
                    const paid = Number(item.paid_amount) || 0;
                    const itemAmount = Number(item.amount) || 0;
                    const tunggakan = itemAmount - paid;
                    
                    return (
                      <tr key={idx} className="border-b border-gray-300 border-dashed last:border-0 tracking-wide">
                        <td className="py-0.5 align-top">{idx + 1}</td>
                        <td className="py-0.5">
                          {item.name}
                          {mode === 'all' && (
                            <span className="ml-1 text-[7px] italic border border-black px-0.5 rounded">
                              {paid >= itemAmount ? '*lunas' : '*belum lunas'}
                            </span>
                          )}
                        </td>
                        <td className="py-0.5 text-right align-top">{formatRp(itemAmount)}</td>
                        <td className="py-0.5 text-right align-top">{formatRp(paid)}</td>
                        {mode === 'all' && <td className="py-0.5 text-right align-top">{formatRp(tunggakan > 0 ? tunggakan : 0)}</td>}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Calculations */}
            <div className="flex justify-end text-[9px] mb-1 font-semibold tracking-wide">
              <div className="w-1/2 space-y-0.5">
                {mode === 'current' ? (
                  <>
                    {/* Transaction summary — only THIS payment */}
                    <div className="flex justify-between text-[10px] border-t-[1px] border-black pt-0.5">
                      <span>DIBAYAR SAAT INI:</span>
                      <span>{formatRp(transactionPaid)}</span>
                    </div>
                    {/* Separator then full invoice totals */}
                    <div className="border-t border-dashed border-gray-400 mt-1 pt-1 space-y-0.5">
                      <p className="text-[7px] uppercase tracking-wide text-gray-500 font-bold mb-0.5">Rekap Total Tagihan:</p>
                      <div className="flex justify-between">
                        <span>Total Tagihan:</span>
                        <span>{formatRp(invoiceTotalAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Dibayarkan:</span>
                        <span>{formatRp(invoiceTotalPaid)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sisa Tunggakan:</span>
                        <span>{formatRp(invoiceTotalSisa > 0 ? invoiceTotalSisa : 0)}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span>Sub Total:</span>
                      <span>{formatRp(transactionTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tunggakan:</span>
                      <span>{formatRp((transactionTotal - transactionPaid) > 0 ? (transactionTotal - transactionPaid) : 0)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] mt-0.5 border-t-[1px] border-black pt-0.5">
                      <span>TOTAL DIBAYAR:</span>
                      <span>{formatRp(transactionPaid)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          
          <div className="mt-auto">
            {/* Footer Signature */}
            <div className="flex justify-between text-[9px] font-bold tracking-wide">
              <div className="text-center w-28">
                <p className="mb-8">Penyetor,</p>
                <div className="border-b border-black mb-0.5"></div>
                <p className="break-words leading-tight">{invoice.students?.name || '-'}</p>
              </div>
              <div className="text-center w-28">
                <p className="mb-8">Petugas TU,</p>
                <div className="border-b border-black mb-0.5"></div>
                <p className="break-words leading-tight">{session?.name || 'Admin'}</p>
              </div>
            </div>

            <div>
              <p className="text-[8px] text-gray-500 mt-2 italic">*Bukti ini asli dan sah sebagai tanda bukti pembayaran yang sah, harap disimpan dengan baik.</p>
            </div>
          </div>

          <div className="absolute top-2 -right-16 print-hide">
            <PrintButton />
          </div>
      </div>
    </div>
  );
}

