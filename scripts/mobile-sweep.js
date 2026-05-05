import fs from 'fs';
import path from 'path';

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Make paddings responsive
  content = content.replace(/p-8 md:p-12/g, 'p-5 md:p-8 lg:p-12');
  content = content.replace(/p-6 text-xl/g, 'p-4 md:p-6 text-base md:text-xl');
  content = content.replace(/pl-32/g, 'pl-24 md:pl-32');
  content = content.replace(/pr-32/g, 'pr-24 md:pr-32');
  
  // Make headings responsive
  content = content.replace(/text-3xl/g, 'text-2xl md:text-3xl');
  content = content.replace(/text-4xl/g, 'text-3xl md:text-4xl');
  content = content.replace(/text-5xl/g, 'text-4xl md:text-5xl');
  
  // Ensure flex layouts wrap on mobile
  content = content.replace(/flex gap-4/g, 'flex flex-wrap gap-4');
  content = content.replace(/flex items-center gap-4/g, 'flex flex-wrap md:flex-nowrap items-center gap-4');
  
  // Refine border radius on mobile
  content = content.replace(/rounded-\[32px\]/g, 'rounded-[24px] md:rounded-[32px]');
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Mobile Updated:', filePath);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      replaceInFile(fullPath);
    }
  }
}

walkDir('./src');
