import fs from 'fs';
import path from 'path';

function fixPaddings(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  content = content.replace(/p-5 md:p-8 lg:p-12 md:p-16/g, 'p-6 md:p-12 lg:p-16');
  content = content.replace(/p-8 md:p-5 md:p-8 lg:p-12/g, 'p-5 md:p-8 lg:p-12');
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed paddings in:', filePath);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      fixPaddings(fullPath);
    }
  }
}

walkDir('./src/components');
