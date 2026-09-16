export interface NoticeItem {
  id: string;
  title: string;
  category: 'Pengumuman' | 'Kegiatan' | 'Keuangan' | 'Umum';
  date: string;
  author: string;
  content: string;
  icon: string;
  pillColor: string;
}

export const MOCKUP_NOTICES: NoticeItem[] = [
  {
    id: '1',
    title: 'Libur Maulid Nabi Muhammad SAW',
    category: 'Pengumuman',
    date: '12 Sep 2026',
    author: 'Kepala Madrasah',
    icon: 'megaphone',
    pillColor: 'bg-blue-100 text-blue-700',
    content: 'Diberitahukan kepada seluruh wali murid bahwa kegiatan belajar mengajar diliburkan dalam rangka memperingati Maulid Nabi Muhammad SAW 1448 H pada hari Senin, 14 September 2026.'
  },
  {
    id: '2',
    title: 'Penilaian Akhir Semester 1',
    category: 'Kegiatan',
    date: '10 Sep 2026',
    author: 'Kurikulum MI Attaqwa 15',
    icon: 'calendar',
    pillColor: 'bg-emerald-100 text-emerald-700',
    content: 'Pelaksanaan Penilaian Akhir Semester (PAS) Semester 1 dijadwalkan pada tanggal 1 – 12 Desember 2026. Mohon bimbingan belajar ananda di rumah.'
  },
  {
    id: '3',
    title: 'Pembayaran Infaq Sekolah September',
    category: 'Keuangan',
    date: '5 Sep 2026',
    author: 'Bendahara Madrasah',
    icon: 'credit-card',
    pillColor: 'bg-amber-100 text-amber-700',
    content: 'Batas akhir pembayaran Infaq SPP madrasah bulan September 2026 adalah tanggal 20 September 2026. Pembayaran dapat dilakukan via transfer bank.'
  },
  {
    id: '4',
    title: 'Rapat Orang Tua / Wali Murid',
    category: 'Kegiatan',
    date: '1 Sep 2026',
    author: 'Kesiswaan & Komite',
    icon: 'school',
    pillColor: 'bg-purple-100 text-purple-700',
    content: 'Undangan rapat koordinasi awal tahun ajaran bersama wali murid kelas 1 hingga 6 bertempat di aula MI Attaqwa 15 Babelan.'
  },
];
