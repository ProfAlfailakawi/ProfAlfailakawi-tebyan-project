import fs from 'fs';
import path from 'path';

function checkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            checkDir(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('process.env.GEMINI_API_KEY')) {
                console.error(`ERROR: process.env.GEMINI_API_KEY found in ${fullPath}. Use import.meta.env.VITE_GEMINI_API_KEY instead.`);
                process.exit(1);
            }
        }
    }
}

checkDir(path.join(process.cwd(), 'src'));
console.log('Build guard passed.');
