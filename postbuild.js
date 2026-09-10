const fs = require('fs');
const path = require('path');

const destDir = path.join(__dirname, 'public', '_next');
const tempBackupDir = path.join(__dirname, '.temp_public_next');

// 1. Restore previous chunks to ensure cached HTML never encounters 404s
if (fs.existsSync(tempBackupDir)) {
  fs.renameSync(tempBackupDir, destDir);
}

// 2. Copy & merge new .next/static to public/_next/static
const sourceStaticDir = path.join(__dirname, '.next', 'static');
const destStaticDir = path.join(destDir, 'static');

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

if (fs.existsSync(sourceStaticDir)) {
  console.log('Merging .next/static into public/_next/static for Hostinger...');
  copyDirectory(sourceStaticDir, destStaticDir);
  console.log('Build and static assets sync completed successfully!');
} else {
  console.log('Source directory .next/static does not exist. Skipping copy.');
}
