export interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  date: string;
  author: string;
  imageUrl: string;
  isFeatured: boolean;
  readTime: string;
}

export const dummyNews: NewsArticle[] = [
  {
    id: '1',
    slug: 'mi-attaqwa-15-raih-akreditasi-a-unggul',
    title: 'MI Attaqwa 15 Sukses Mempertahankan Predikat Akreditasi A (Unggul)',
    excerpt: 'Prestasi membanggakan kembali ditorehkan oleh keluarga besar MI Attaqwa 15 Babelan dengan kembali meraih nilai maksimal pada penilaian Badan Akreditasi Nasional.',
    content: `<p>Babelan, Bekasi — MI Attaqwa 15 kembali menorehkan prestasi gemilang dengan berhasil mempertahankan predikat Akreditasi A (Unggul) dari Badan Akreditasi Nasional Sekolah/Madrasah (BAN-S/M). Keputusan ini tertuang dalam Surat Keputusan terbaru yang diterima oleh pihak sekolah.</p>
    <p>Pencapaian ini tidak terlepas dari dedikasi seluruh dewan guru, staf, serta dukungan penuh dari Yayasan Attaqwa dan para orang tua siswa. Dalam proses akreditasi yang berlangsung ketat, madrasah dinilai unggul dalam 8 standar nasional pendidikan, terutama pada standar isi, proses, dan kompetensi lulusan.</p>
    <p>Kepala Madrasah menyampaikan rasa syukurnya, "Ini adalah hasil dari kerja keras kolektif. Predikat ini memotivasi kami untuk terus berinovasi dan memberikan pelayanan pendidikan dasar Islam terbaik bagi masyarakat Babelan."</p>
    <blockquote>"Predikat A ini bukan tujuan akhir, melainkan standar awal bagi kami untuk terus memberikan pelayanan pendidikan Islam berkualitas prima di era digital ini."</blockquote>
    <p>Ke depannya, MI Attaqwa 15 berkomitmen untuk meningkatkan fasilitas teknologi, termasuk penambahan lab komputer untuk menunjang program ekstra kurikuler *Coding & AI* yang baru saja diluncurkan.</p>`,
    category: 'Berita Sekolah',
    date: '10 Juni 2026',
    author: 'Tim Humas MIA 15',
    imageUrl: '/images/school_building.png',
    isFeatured: true,
    readTime: '3 Menit'
  },
  {
    id: '2',
    slug: 'pentingnya-pendidikan-agama-di-era-digital',
    title: 'Menyeimbangkan Ilmu Agama dan Teknologi: Kunci Mendidik Generasi Z & Alpha',
    excerpt: 'Di tengah derasnya arus informasi digital, pendidikan agama menjadi jangkar yang tak tergantikan dalam membentuk karakter anak-anak masa kini.',
    content: `<p>Mendidik anak di era digital tentu memiliki tantangan tersendiri. Generasi Z dan Alpha tumbuh dengan perangkat pintar di genggaman mereka. Arus informasi yang tiada henti membuat mereka rentan terpapar konten yang tidak sesuai jika tanpa pengawasan dan pondasi keagamaan yang kuat.</p>
    <p>Oleh karena itu, peran madrasah ibtidaiyah menjadi sangat krusial. Melalui kurikulum yang memadukan ilmu agama dan teknologi dasar, anak tidak hanya diajarkan bagaimana menggunakan teknologi, tetapi juga bagaimana memiliki adab dan batasan moral ketika berselancar di dunia maya.</p>
    <p>Di MI Attaqwa 15, kami menekankan program Tahfidz harian dan pembiasaan ibadah sunnah untuk membentengi jiwa siswa. Kombinasi antara kemampuan literasi digital dan keteguhan spiritual inilah yang akan melahirkan insan kamil yang tidak mudah terombang-ambing oleh zaman.</p>`,
    category: 'Artikel Pendidikan',
    date: '05 Juni 2026',
    author: 'Ust. Abdullah',
    imageUrl: '/images/classroom_view.png',
    isFeatured: false,
    readTime: '4 Menit'
  },
  {
    id: '3',
    slug: 'juara-umum-mapsi-tingkat-kecamatan-2026',
    title: 'Luar Biasa! Siswa MI Attaqwa 15 Raih Juara Umum Lomba MAPSI 2026',
    excerpt: 'Kontingen MI Attaqwa 15 Babelan menyabet 5 medali emas pada ajang Lomba Mata Pelajaran Pendidikan Agama Islam dan Seni (MAPSI) tingkat Kecamatan.',
    content: `<p>Alhamdulillah, puji syukur ke hadirat Allah SWT, kontingen MI Attaqwa 15 Babelan berhasil memboyong gelar Juara Umum pada ajang Lomba Mata Pelajaran Pendidikan Agama Islam dan Seni (MAPSI) Tingkat Kecamatan tahun 2026.</p>
    <p>Sebanyak lima medali emas berhasil dibawa pulang dari berbagai cabang lomba, di antaranya: Lomba Cerdas Cermat PAI, Tilawah Al-Qur'an putra, Kaligrafi, Khitobah, dan Rebana. Prestasi ini mengukuhkan posisi MI Attaqwa 15 sebagai salah satu madrasah paling kompetitif di Kabupaten Bekasi.</p>
    <p>Prestasi ini dipersembahkan berkat latihan gigih para siswa serta keikhlasan para guru pembimbing yang meluangkan waktunya di luar jam pelajaran sekolah. Kami berharap para pemenang dapat terus membawa nama baik sekolah di tingkat Kabupaten hingga Provinsi nanti.</p>`,
    category: 'Prestasi',
    date: '28 Mei 2026',
    author: 'Tim Ekstrakurikuler',
    imageUrl: '/images/student_activity.png',
    isFeatured: true,
    readTime: '2 Menit'
  },
  {
    id: '4',
    slug: 'pembukaan-ppdb-tahun-ajaran-baru',
    title: 'Segera Daftar! Gelombang Pertama PPDB MI Attaqwa 15 Resmi Dibuka',
    excerpt: 'Kabar gembira bagi ayah/bunda. Penerimaan Peserta Didik Baru (PPDB) MI Attaqwa 15 Tahun Ajaran 2027/2028 kini telah dibuka dengan promo khusus.',
    content: `<p>MI Attaqwa 15 secara resmi telah membuka Penerimaan Peserta Didik Baru (PPDB) untuk Tahun Ajaran 2027/2028. Pendaftaran gelombang pertama ini memberikan kesempatan khusus bagi calon wali murid untuk mendapatkan keringanan biaya pangkal.</p>
    <p>Persyaratan yang dibutuhkan cukup mudah. Calon siswa diharapkan telah berusia minimal 6 tahun pada bulan Juli tahun depan, membawa salinan Akta Kelahiran, Kartu Keluarga, dan pas foto.</p>
    <p>Kami menyadari antusiasme yang tinggi dari masyarakat sekitar Babelan setiap tahunnya. Oleh karena itu, kuota untuk gelombang pertama sangat terbatas demi menjaga rasio ideal kelas (25 siswa per rombongan belajar).</p>
    <p>Jangan lewatkan kesempatan emas ini, mari bergabung dengan keluarga besar MI Attaqwa 15 untuk memberikan pendidikan yang terbaik bagi buah hati tercinta.</p>`,
    category: 'Berita Sekolah',
    date: '20 Mei 2026',
    author: 'Panitia PPDB',
    imageUrl: '/images/flyer_ppdb.png',
    isFeatured: false,
    readTime: '2 Menit'
  },
  {
    id: '5',
    slug: 'perayaan-idul-adha-dan-kurban-bersama',
    title: 'Syahdunya Idul Adha 1447 H: Mengajarkan Siswa Makna Ikhlas dan Berbagi',
    excerpt: 'Ratusan siswa memadati halaman sekolah untuk mengikuti salat Idul Adha dan menyaksikan langsung pemotongan hewan kurban sebagai pembelajaran nyata.',
    content: `<p>Dalam rangka merayakan Hari Raya Idul Adha 1447 H, MI Attaqwa 15 menyelenggarakan kegiatan Salat Id berjamaah yang diikuti oleh seluruh siswa kelas 4, 5, dan 6 serta dewan guru.</p>
    <p>Kegiatan dilanjutkan dengan penyembelihan hewan kurban berupa 2 ekor sapi dan 5 ekor kambing. Daging kurban tersebut kemudian dibagikan kepada masyarakat sekitar sekolah yang berhak menerimanya. Siswa-siswi dilibatkan secara langsung dalam proses pengemasan untuk melatih kepekaan sosial mereka.</p>
    <p>"Kegiatan ini rutin kami adakan untuk menanamkan nilai-nilai keikhlasan dari kisah Nabi Ibrahim dan Nabi Ismail AS," terang Kepala Sekolah. "Siswa tidak hanya belajar secara teori di kelas, melainkan melihat dan mempraktikkannya secara nyata di lapangan."</p>`,
    category: 'Berita Sekolah',
    date: '02 Mei 2026',
    author: 'Tim Keagamaan',
    imageUrl: '/images/flyer_eid.png',
    isFeatured: false,
    readTime: '3 Menit'
  },
  {
    id: '6',
    slug: 'wisuda-tahfidz-angkatan-ke-12',
    title: 'Mengharukan! 150 Siswa Kelas 6 Mengikuti Wisuda Tahfidz Juz 30',
    excerpt: 'Momen penuh air mata kebahagiaan terjadi tatkala para siswa menyematkan mahkota kepada orang tua mereka sebagai simbol syafaat di akhirat kelak.',
    content: `<p>Suasana haru menyelimuti aula utama MI Attaqwa 15 saat 150 siswa kelas 6 diwisuda dalam program Tahfidz Qur'an. Mereka telah berhasil menyelesaikan hafalan minimal Juz 30 ditambah beberapa surat pilihan yang diujikan dalam sidang munaqasyah.</p>
    <p>Puncak acara terjadi saat anak-anak turun panggung dan memakaikan mahkota buatan ke atas kepala orang tua masing-masing. Ini melambangkan hadis Nabi yang menyatakan bahwa anak penghafal Al-Qur'an kelak akan memakaikan mahkota kemuliaan untuk orang tuanya di surga.</p>
    <p>Tampak banyak orang tua yang meneteskan air mata haru bercampur bangga. "Alhamdulillah, usaha kami mendidik anak di madrasah ini tidak sia-sia," ujar Ibu Fatimah, salah satu wali murid yang hadir.</p>`,
    category: 'Prestasi',
    date: '15 April 2026',
    author: 'Tim Tahfidz',
    imageUrl: '/images/graduation_day.png',
    isFeatured: false,
    readTime: '3 Menit'
  }
];
