import fs from 'fs';
import path from 'path';

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace structural container tokens to be more elegant
  content = content.replace(/rounded-\[2\.5rem\]/g, 'rounded-[2rem]');
  content = content.replace(/rounded-\[3rem\]/g, 'rounded-[2rem]');
  content = content.replace(/rounded-\[3\.5rem\]/g, 'rounded-3xl');
  content = content.replace(/rounded-\[4rem\]/g, 'rounded-[2.5rem]');
  
  content = content.replace(/p-10/g, 'p-8 md:p-12');
  
  content = content.replace(/shadow-xl/g, 'shadow-sm');
  content = content.replace(/shadow-2xl/g, 'shadow');
  
  content = content.replace(/border-2 border-slate-100/g, 'border border-slate-200');
  content = content.replace(/border-4 border-slate-100/g, 'border-2 border-slate-200');
  content = content.replace(/border-2 border-slate-50/g, 'border border-slate-200');
  
  // Update brand colors
  content = content.replace(/bg-brand-primary/g, 'bg-slate-900');
  content = content.replace(/text-brand-primary/g, 'text-slate-900');
  content = content.replace(/bg-brand-accent/g, 'bg-slate-900');
  content = content.replace(/text-brand-accent/g, 'text-slate-900');
  content = content.replace(/border-brand-accent/g, 'border-slate-900');
  content = content.replace(/hover:bg-brand-accent/g, 'hover:bg-slate-800');

  // Change generic font-black to font-bold or font-semibold for a refined look
  content = content.replace(/font-black/g, 'font-bold');
  
  // Specific buttons
  content = content.replace(/bg-blue-600/g, 'bg-slate-900');
  content = content.replace(/text-blue-600/g, 'text-slate-900');
  
  content = content.replace(/bg-emerald-600/g, 'bg-slate-900');
  content = content.replace(/hover:bg-emerald-700/g, 'hover:bg-slate-800');

  content = content.replace(/text-red-500/g, 'text-rose-500');

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
