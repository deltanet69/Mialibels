const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('src/app', function(filePath) {
  if (filePath.endsWith('page.tsx') || filePath.endsWith('layout.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    const regex = /export\s+const\s+dynamic\s*=\s*['"]force-dynamic['"];?/g;
    if (regex.test(content)) {
      console.log('Cleaning', filePath);
      content = content.replace(regex, '');
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }
});
console.log('Done!');
