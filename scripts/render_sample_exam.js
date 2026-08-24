const path = require('path');
const sharp = require(path.join(__dirname, '../node_modules/sharp'));
const fs = require('fs');

async function renderSampleExamCard() {
  const tplPath = path.join(__dirname, '../public/kartu/kartuujian_template.png');
  const outPath = path.join(__dirname, '../scripts/sample_kartuujian_render.png');

  const W = 2400;
  const H = 2000;

  // Student test data
  const student = {
    name: 'ADZKA WARADANA FITRIANSYAH',
    nisn: '1923619369',
    student_number: '2023001',
    class: 'Kelas 1A'
  };

  const photoX = 150;
  const photoY = 520;
  const photoW = 460;
  const photoH = 613;

  const titleX = 680;
  const titleY = 520;

  const labelX = 680;
  const colonX = 1140;
  const valX = 1200;
  const startY = 660;
  const spacing = 130;

  const rows = [
    { label: 'Nama Lengkap', value: student.name },
    { label: 'NISN', value: student.nisn },
    { label: 'Kelas', value: student.class },
    { label: 'Ruang Kelas', value: 'Ruang ' + student.class }
  ];

  // SVG overlay for text & photo placeholder
  const svgOverlay = `
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <!-- Title -->
      <text x="${titleX}" y="${titleY + 54}" font-family="'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-size="64" font-weight="bold" fill="#172554">KARTU PESERTA UJIAN</text>
      
      <!-- Fields -->
      ${rows.map((r, i) => `
        <text x="${labelX}" y="${startY + (i * spacing) + 40}" font-family="'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-size="46" font-weight="bold" fill="#334155">${r.label}</text>
        <text x="${colonX}" y="${startY + (i * spacing) + 40}" font-family="'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-size="46" font-weight="bold" fill="#334155">:</text>
        <text x="${valX}" y="${startY + (i * spacing) + 40}" font-family="'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-size="46" font-weight="500" fill="#0f172a">${r.value}</text>
      `).join('')}

      <!-- Photo Box Placeholder (Red bg like contohkartuujian or student photo) -->
      <rect x="${photoX}" y="${photoY}" width="${photoW}" height="${photoH}" fill="#e2e8f0" rx="12" />
      <text x="${photoX + photoW/2}" y="${photoY + photoH/2 - 10}" text-anchor="middle" font-family="'Segoe UI', Roboto, sans-serif" font-size="40" font-weight="bold" fill="#64748b">FOTO</text>
      <text x="${photoX + photoW/2}" y="${photoY + photoH/2 + 40}" text-anchor="middle" font-family="'Segoe UI', Roboto, sans-serif" font-size="34" fill="#94a3b8">3 x 4</text>
      
      <text x="${photoX + photoW/2}" y="${photoY + photoH + 45}" text-anchor="middle" font-family="'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="bold" fill="#475569" letter-spacing="1">MI ATTAQWA 15 BABELAN</text>
    </svg>
  `;

  const result = await sharp(tplPath)
    .composite([
      { input: Buffer.from(svgOverlay), top: 0, left: 0 }
    ])
    .png()
    .toFile(outPath);

  console.log('Sample exam card rendered at:', outPath);
}

renderSampleExamCard().catch(console.error);
