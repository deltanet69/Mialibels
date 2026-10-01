const fs = require('fs');
const path = require('path');

const destDir = path.join(__dirname, 'public', '_next');
const tempBackupDir = path.join(__dirname, '.temp_public_next');

function copyDirectory(src, dest) {
  try {
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
  } catch (err) {
    console.warn(`Notice: copyDirectory warning for ${src} -> ${dest}:`, err.message);
  }
}

// 1. Restore previous chunks to ensure cached HTML never encounters 404s
if (fs.existsSync(tempBackupDir)) {
  try {
    if (!fs.existsSync(destDir)) {
      fs.renameSync(tempBackupDir, destDir);
    } else {
      copyDirectory(tempBackupDir, destDir);
      fs.rmSync(tempBackupDir, { recursive: true, force: true });
    }
  } catch (err) {
    console.warn('Notice (postbuild): Could not restore temp chunks:', err.message);
  }
}

// 2. Copy & merge new .next/static to public/_next/static
const sourceStaticDir = path.join(__dirname, '.next', 'static');
const destStaticDir = path.join(destDir, 'static');

if (fs.existsSync(sourceStaticDir)) {
  console.log('Merging .next/static into public/_next/static for Hostinger...');
  copyDirectory(sourceStaticDir, destStaticDir);
  console.log('Build and static assets sync completed successfully!');
} else {
  console.log('Source directory .next/static does not exist. Skipping copy.');
}
