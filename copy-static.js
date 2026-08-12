const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '.next', 'static');
const destDir = path.join(__dirname, 'public', '_next', 'static');

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (fs.existsSync(sourceDir)) {
  console.log('Copying .next/static to public/_next/static for Hostinger deployment...');
  copyDirectory(sourceDir, destDir);
  console.log('Copy completed successfully!');
} else {
  console.log('Source directory .next/static does not exist. Skipping copy.');
}
