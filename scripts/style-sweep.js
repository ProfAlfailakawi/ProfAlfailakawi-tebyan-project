import fs from 'fs';
import path from 'path';

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Ultra-Premium styling substitutions
  content = content.replace(/slate/g, 'zinc');
  
  // Make primary colors jet black for extreme elegance
  content = content.replace(/bg-zinc-900/g, 'bg-black');
  content = content.replace(/bg-zinc-800/g, 'bg-zinc-900');
  content = content.replace(/text-zinc-900/g, 'text-black');
  content = content.replace(/border-zinc-900/g, 'border-black');
  content = content.replace(/ring-zinc-900/g, 'ring-black');
  
  // Refine shapes
  content = content.replace(/rounded-\[2rem\]/g, 'rounded-[32px]');
  content = content.replace(/rounded-3xl/g, 'rounded-[24px]');
  content = content.replace(/rounded-2xl/g, 'rounded-[16px]');
  
  // Custom container background replacements for extreme clean look
  content = content.replace(/bg-\[\#FDFBF7\]/gi, 'bg-white/60 backdrop-blur-2xl');
  content = content.replace(/bg-zinc-50\/50/g, 'bg-transparent');
  
  // Re-engineer borders and shadows to Apple/Vercel spec
  content = content.replace(/border-zinc-200\/50/g, 'border-zinc-200/80');
  content = content.replace(/border-zinc-200/g, 'border-zinc-200/80');
  content = content.replace(/shadow-sm/g, 'shadow-[0_2px_8px_rgba(0,0,0,0.04)]');
  content = content.replace(/shadow-md/g, 'shadow-[0_8px_30px_rgb(0,0,0,0.04)]');
  content = content.replace(/shadow-xl/g, 'shadow-[0_16px_40px_rgb(0,0,0,0.06)]');
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', filePath);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      replaceInFile(fullPath);
    }
  }
}

walkDir('./src/components/tabs');
