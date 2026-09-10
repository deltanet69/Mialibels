const fs = require('fs');
const path = require('path');

const destDir = path.join(__dirname, 'public', '_next');
const tempBackupDir = path.join(__dirname, '.temp_public_next');

// 1. Temporarily move public/_next to .temp_public_next so Next.js build doesn't fail on reserved name
if (fs.existsSync(destDir)) {
  console.log('Preserving existing chunks before build...');
  if (fs.existsSync(tempBackupDir)) {
    fs.rmSync(tempBackupDir, { recursive: true, force: true });
  }
  fs.renameSync(destDir, tempBackupDir);
}
