const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const destDir = path.join(__dirname, 'public', '_next');

// 1. Delete public/_next if it exists so Next.js build doesn't fail
if (fs.existsSync(destDir)) {
  console.log('Cleaning up public/_next before build...');
  fs.rmSync(destDir, { recursive: true, force: true });
}

// 2. Run next build
console.log('Running next build...');
try {
  // Use npx to ensure it uses the local next installation
  execSync('npx next build', { stdio: 'inherit' });
} catch (error) {
  console.error('Next.js build failed');
  process.exit(1);
}

// 3. Copy .next/static to public/_next/static
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
  console.log('Copying .next/static to public/_next/static for Hostinger...');
  copyDirectory(sourceStaticDir, destStaticDir);
  console.log('Copy completed successfully!');
} else {
  console.log('Source directory .next/static does not exist. Skipping copy.');
}
