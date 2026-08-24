const path = require('path');
const sharp = require(path.join(__dirname, '../node_modules/sharp'));
const fs = require('fs');

async function buildExamTemplate() {
  const tplPath = path.join(__dirname, '../public/kartu/kartutemplate.png');
  const outPath = path.join(__dirname, '../public/kartu/kartuujian_template.png');
  const tpl = sharp(tplPath);
  const origMeta = await tpl.metadata();
  
  // 12cm x 10cm at 200 px/cm = 2400 x 2000 px (exact 1.2 aspect ratio)
  const W = 2400;
  const H = 2000;
  
  // 1. Top Header: extract top 515px from 3150x1800, scale to W=2400
  const headerOrigH = 515;
  const headerH = Math.round(headerOrigH * W / origMeta.width); // ~392px
  const headerBuf = await sharp(tplPath)
    .extract({ left: 0, top: 0, width: origMeta.width, height: headerOrigH })
    .resize(W, headerH)
    .toBuffer();

  // 2. Bottom Footer: extract bottom from y=1340 to 1800 (height 460) from original
  const footerOrigH = 460;
  const footerOrigTop = origMeta.height - footerOrigH; // 1340
  
  const footerRaw = await sharp(tplPath)
    .extract({ left: 0, top: footerOrigTop, width: origMeta.width, height: footerOrigH })
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  const fW = footerRaw.info.width;
  const fH = footerRaw.info.height;
  
  // Clean middle ghost watermark with true #fdfdff (253, 253, 255)
  for (let y = 0; y < 220; y++) {
    for (let x = 850; x < 2280; x++) {
      const idx = (y * fW + x) * 3;
      footerRaw.data[idx] = 253;
      footerRaw.data[idx + 1] = 253;
      footerRaw.data[idx + 2] = 255;
    }
  }

  // Add soft alpha feathering to top of footer section (y: 0..40)
  const footerRgba = Buffer.alloc(fW * fH * 4);
  for (let y = 0; y < fH; y++) {
    const alpha = y < 35 ? Math.round((y / 35) * 255) : 255;
    for (let x = 0; x < fW; x++) {
      const srcIdx = (y * fW + x) * 3;
      const dstIdx = (y * fW + x) * 4;
      footerRgba[dstIdx] = footerRaw.data[srcIdx];
      footerRgba[dstIdx + 1] = footerRaw.data[srcIdx + 1];
      footerRgba[dstIdx + 2] = footerRaw.data[srcIdx + 2];
      footerRgba[dstIdx + 3] = alpha;
    }
  }

  const footerH = Math.round(footerOrigH * W / origMeta.width); // ~350px
  const cleanFooterBuf = await sharp(footerRgba, {
    raw: {
      width: fW,
      height: fH,
      channels: 4
    }
  })
    .resize(W, footerH)
    .png()
    .toBuffer();

  // 3. Middle Watermark: extract the emblem precisely (550 to 1620, left 1040 to 2110)
  const wmExtract = await sharp(tplPath)
    .extract({ left: 1040, top: 550, width: 1070, height: 1070 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  const wmWidth = wmExtract.info.width;
  const wmHeight = wmExtract.info.height;
  const wmRgba = Buffer.alloc(wmWidth * wmHeight * 4);
  
  for (let y = 0; y < wmHeight; y++) {
    for (let x = 0; x < wmWidth; x++) {
      const idx = (y * wmWidth + x);
      const r = wmExtract.data[idx * 3];
      const g = wmExtract.data[idx * 3 + 1];
      const b = wmExtract.data[idx * 3 + 2];
      
      wmRgba[idx * 4] = r;
      wmRgba[idx * 4 + 1] = g;
      wmRgba[idx * 4 + 2] = b;
      
      const brightness = (r + g + b) / 3;
      if (brightness >= 250) {
        wmRgba[idx * 4 + 3] = 0;
      } else {
        const alpha = Math.min(255, Math.max(0, Math.round((250 - brightness) * 4.5)));
        const distFromEdgeX = Math.min(x, wmWidth - 1 - x);
        const distFromEdgeY = Math.min(y, wmHeight - 1 - y);
        const feather = Math.min(1, Math.min(distFromEdgeX, distFromEdgeY) / 25);
        wmRgba[idx * 4 + 3] = Math.round(alpha * feather);
      }
    }
  }

  const targetWmW = 980;
  const targetWmH = 980;
  const cleanWatermarkBuf = await sharp(wmRgba, {
    raw: {
      width: wmWidth,
      height: wmHeight,
      channels: 4
    }
  })
    .resize(targetWmW, targetWmH)
    .png()
    .toBuffer();

  // 4. Background gradient: top is rgb(243,243,247), fading to rgb(253,253,255) by y=800
  const bgSvg = Buffer.from(`
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#f3f3f7" />
          <stop offset="35%" stop-color="#f8f8fb" />
          <stop offset="55%" stop-color="#fdfdff" />
          <stop offset="100%" stop-color="#fdfdff" />
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#bgGrad)" />
    </svg>
  `);
  const baseBg = await sharp(bgSvg).png().toBuffer();

  const watermarkX = Math.round((W - targetWmW) / 2);
  const watermarkY = Math.round(headerH + ((H - headerH - footerH) - targetWmH) / 2) + 20;

  const result = await sharp(baseBg)
    .composite([
      { input: cleanWatermarkBuf, top: watermarkY, left: watermarkX, blend: 'over' },
      { input: cleanFooterBuf, top: H - footerH, left: 0 },
      { input: headerBuf, top: 0, left: 0 },
    ])
    .png()
    .toFile(outPath);

  console.log('Seamlessly blended Exam Template generated:', result);
}

buildExamTemplate().catch(console.error);
