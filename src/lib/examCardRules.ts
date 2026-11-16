// ─────────────────────────────────────────────────────────────────────────────
// Rules unduh Kartu Ujian ASAS Ganjil 2026/2027 — MI Attaqwa 15
// Sumber: Surat Pemberitahuan ASAS No. 249/MI.A15/SK/X/2026 (26 Oktober 2026)
//
// Satu-satunya sumber kebenaran validasi kartu ujian. Dipakai oleh:
// - CardDownloader (gerbang unduh/cetak kartu)
// - ExamRequirementsModal (checklist syarat di portal orangtua)
// - parent/dashboard/page (isExamCardReady)
// - (admin)/students/page (status kelayakan di daftar siswa)
//
// Syarat (ditetapkan sekolah, Nov 2026):
// 0a. Keuangan PPDB/SPMB lunas (item ppdb/spmb/pendaftaran)
// 0b. Tunggakan tahun sebelumnya lunas (item "Tunggakan ..." + SPP sebelum Juli 2026)
// 1. Uang Buku/LKS lunas (Fullday: Uang Buku)
// 2. Infaq terbayar s/d bulan Desember 2026
// 3. Uang Ulangan Umum (ULUM) minimal Rp110.000
// 4. Khusus Kelas 6: Uang Kegiatan Akhir Tahun minimal Rp1.400.000
// Anak yatim / keluarga guru / yayasan: bebas Infaq & Buku (kebijakan yang sudah berjalan).
// Kartu dibuka mulai 16 November 2026; ASAS 23 Nov – 4 Des 2026.
// ─────────────────────────────────────────────────────────────────────────────

export const EXAM_CARD_RELEASE_DATE = new Date('2026-11-16T00:00:00+07:00');
export const MIN_ULANGAN_UMUM = 110000;
export const MIN_KEGIATAN_AKHIR_TAHUN = 1400000;
const INFAQ_MONTHS = [7, 8, 9, 10, 11, 12];

const MONTH_NAMES: Record<string, number> = {
  januari: 1, februari: 2, maret: 3, april: 4, mei: 5, juni: 6,
  juli: 7, agustus: 8, september: 9, oktober: 10, november: 11, desember: 12,
};

export function monthNumber(month: string | number | undefined | null): number | null {
  if (month === undefined || month === null) return null;
  if (typeof month === 'number') return month >= 1 && month <= 12 ? month : null;
  const raw = String(month).trim().toLowerCase();
  if (/^\d+$/.test(raw)) {
    const n = parseInt(raw, 10);
    return n >= 1 && n <= 12 ? n : null;
  }
  return MONTH_NAMES[raw] ?? null;
}

export function isFeeExempt(waiverType?: string | null): boolean {
  if (!waiverType) return false;
  const val = String(waiverType).toLowerCase().trim();
  return (
    val === 'anak_yatim' ||
    val === 'keluarga guru' ||
    val.includes('yatim') ||
    val.includes('guru') ||
    val.includes('yayasan')
  );
}

export interface ExamCardEvaluation {
  isFullday: boolean;
  isClass6: boolean;
  exemptInfaqAndBuku: boolean;
  ppdbOk: boolean;
  hasUnpaidInfaq: boolean;
  tunggakanOk: boolean;
  infaqOk: boolean;
  bukuOk: boolean;
  ulumOk: boolean;
  akhirTahunOk: boolean;
  isEligible: boolean;
  dueBuku: number;
  paidBuku: number;
  paidUlum: number;
  paidAkhirTahun: number;
  issues: string[];
}

interface SppLike {
  month: string | number;
  year?: number | string | null;
  status: string;
}

interface GeneralLike {
  items?: Array<{ name?: string; amount?: number | string; paid_amount?: number | string }> | null;
}

export function evaluateExamCardRequirements(input: {
  className?: string | null;
  feeWaiverType?: string | null;
  sppInvoices?: SppLike[] | null;
  generalInvoices?: GeneralLike[] | null;
}): ExamCardEvaluation {
  const className = input.className || '';
  // Konvensi project yang sudah berjalan: kelas berakhiran "A" = Fullday.
  const isFullday = !!className.match(/A$/i);
  const isClass6 = className.replace(/^kelas\s+/i, '').startsWith('6');
  const exemptInfaqAndBuku = isFeeExempt(input.feeWaiverType);

  const spp = input.sppInvoices || [];
  const items = (input.generalInvoices || []).flatMap((inv) => inv.items || []);
  const itemName = (item: { name?: string }) => (item.name || '').toLowerCase();
  const sumPaid = (list: typeof items) =>
    list.reduce((sum, item) => sum + (Number(item.paid_amount) || 0), 0);
  const sumDue = (list: typeof items) =>
    list.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  // Item "Tunggakan ..." adalah utang tahun lalu (LKS, ULUM, Infaq, PPDB/SPMB, dll.):
  // masuk syarat tunggakan, TIDAK dihitung ke syarat tahun berjalan.
  const isTunggakan = (item: { name?: string }) => itemName(item).includes('tunggakan');
  const currentItems = items.filter((item) => !isTunggakan(item));

  // Syarat 0a. Keuangan PPDB/SPMB lunas — item bernama ppdb/spmb/pendaftaran
  // (termasuk "Tunggakan PPDB/SPMB") terbayar penuh. Tanpa item = tidak tercatat
  // di keuangan siswa (dibayar saat pendaftaran jalur SPMB) → tidak menahan.
  const ppdbItems = items.filter((item) => {
    const n = itemName(item);
    return n.includes('ppdb') || n.includes('spmb') || n.includes('pendaftaran');
  });
  const ppdbOk = ppdbItems.length === 0 || sumPaid(ppdbItems) >= sumDue(ppdbItems);

  // Syarat 0b. Tunggakan tahun sebelumnya lunas:
  // - setiap item tagihan umum bernama "tunggakan" terbayar penuh, dan
  // - tidak ada SPP sebelum Juli 2026 (TA lalu) yang belum PAID.
  const tunggakanItems = items.filter(isTunggakan);
  const tunggakanItemsOk = tunggakanItems.every(
    (item) => (Number(item.paid_amount) || 0) >= (Number(item.amount) || 0)
  );
  const tunggakanSppOk = !spp.find((inv) => {
    const m = monthNumber(inv.month);
    const y = inv.year === undefined || inv.year === null ? null : Number(inv.year);
    if (m === null || y === null || Number.isNaN(y)) return false;
    const beforeCurrentYear = y < 2026 || (y === 2026 && m < 7);
    return beforeCurrentYear && inv.status !== 'PAID';
  });
  const tunggakanOk = tunggakanItemsOk && tunggakanSppOk;

  // Syarat 2. Infaq s/d Desember 2026 — SETIAP bulan Juli–Desember 2026 wajib punya
  // tagihan berstatus PAID dan tidak boleh ada yang belum PAID. Bulan tanpa
  // tagihan (belum diterbitkan / data terpotong) dianggap BELUM lunas.
  const infaqRange = spp.filter((inv) => {
    const m = monthNumber(inv.month);
    const y = inv.year === undefined || inv.year === null ? null : Number(inv.year);
    if (m === null || m < 7 || m > 12) return false;
    return y === null || Number.isNaN(y) || y === 2026;
  });
  const hasUnpaidInfaq = !exemptInfaqAndBuku && infaqRange.some((inv) => inv.status !== 'PAID');
  const infaqOk =
    exemptInfaqAndBuku ||
    (!hasUnpaidInfaq &&
      INFAQ_MONTHS.every((m) => infaqRange.some((inv) => monthNumber(inv.month) === m)));

  // Syarat 1. Buku/LKS lunas — seluruh item tahun berjalan terbayar penuh
  // (paid >= amount) dan minimal ada satu item tagihannya ("Buku Paket/LKS").
  // Reguler: item "buku" dan/atau "lks". Fullday: item "buku" saja.
  const bukuItems = isFullday
    ? currentItems.filter((item) => itemName(item).includes('buku'))
    : currentItems.filter((item) => {
        const n = itemName(item);
        return n.includes('buku') || n.includes('lks');
      });
  const dueBuku = sumDue(bukuItems);
  const paidBuku = sumPaid(bukuItems);
  const bukuOk = exemptInfaqAndBuku || (bukuItems.length > 0 && paidBuku >= dueBuku);

  // Syarat 3. Ulangan Umum (ULUM) tahun berjalan — terbayar minimal Rp110.000 (pas = lulus).
  const paidUlum = sumPaid(
    currentItems.filter((item) => {
      const n = itemName(item);
      return n.includes('ulangan') || n.includes('ulum');
    })
  );
  const ulumOk = paidUlum >= MIN_ULANGAN_UMUM;

  // Syarat 4. Kegiatan Akhir Tahun — khusus Kelas 6, minimal Rp1.400.000 (pas = lulus).
  const paidAkhirTahun = sumPaid(
    currentItems.filter((item) => itemName(item).includes('akhir tahun'))
  );
  const akhirTahunOk = !isClass6 || paidAkhirTahun >= MIN_KEGIATAN_AKHIR_TAHUN;

  const isEligible = ppdbOk && tunggakanOk && bukuOk && infaqOk && ulumOk && akhirTahunOk;

  const issues: string[] = [];
  if (!ppdbOk) issues.push('Keuangan PPDB/SPMB belum lunas.');
  if (!tunggakanOk) issues.push('Masih ada tunggakan tahun sebelumnya yang belum lunas.');
  if (!infaqOk)
    issues.push('Kartu Ujian tidak dapat diunduh. Pastikan tagihan Infaq/SPP s/d bulan Desember 2026 sudah dilunasi.');
  if (!bukuOk && !exemptInfaqAndBuku)
    issues.push(
      isFullday
        ? `Uang Buku belum lunas (Tagihan: Rp.${dueBuku.toLocaleString('id-ID')}, Terbayar: Rp.${paidBuku.toLocaleString('id-ID')}).`
        : `Uang Buku/LKS belum lunas (Tagihan: Rp.${dueBuku.toLocaleString('id-ID')}, Terbayar: Rp.${paidBuku.toLocaleString('id-ID')}).`
    );
  if (!ulumOk)
    issues.push(
      `Uang Ulangan Umum minimal Rp.${MIN_ULANGAN_UMUM.toLocaleString('id-ID')} belum terpenuhi (Terbayar: Rp.${paidUlum.toLocaleString('id-ID')}).`
    );
  if (!akhirTahunOk)
    issues.push(
      `Uang Kegiatan Akhir Tahun minimal Rp.${MIN_KEGIATAN_AKHIR_TAHUN.toLocaleString('id-ID')} belum terpenuhi (Terbayar: Rp.${paidAkhirTahun.toLocaleString('id-ID')}).`
    );

  return {
    isFullday,
    isClass6,
    exemptInfaqAndBuku,
    ppdbOk,
    hasUnpaidInfaq,
    tunggakanOk,
    infaqOk,
    bukuOk,
    ulumOk,
    akhirTahunOk,
    isEligible,
    dueBuku,
    paidBuku,
    paidUlum,
    paidAkhirTahun,
    issues,
  };
}
