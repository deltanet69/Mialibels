const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

// 2. Run next build
console.log('Running next build...');
try {
  // Use npx to ensure it uses the local next installation
  execSync('npx next build', { stdio: 'inherit' });
} catch (error) {
  // If build failed, restore backup
  if (fs.existsSync(tempBackupDir) && !fs.existsSync(destDir)) {
    fs.renameSync(tempBackupDir, destDir);
  }
  console.error('Next.js build failed');
  process.exit(1);
}

// 3. Restore previous chunks to ensure cached HTML never encounters 404s
if (fs.existsSync(tempBackupDir)) {
  fs.renameSync(tempBackupDir, destDir);
}

// 4. Copy & merge new .next/static to public/_next/static
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
