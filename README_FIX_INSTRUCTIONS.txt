TEBYAN GOOGLE STUDIO PERMANENT FIX

Upload/add these files to the same paths in Google Studio:

1) scripts/guard.js
2) .env.example

Then edit package.json:
Inside "scripts", add this line:

"prebuild": "node scripts/guard.js",

Example:

"scripts": {
  "prebuild": "node scripts/guard.js",
  "dev": "...",
  "start": "...",
  "build": "vite build && esbuild server.ts --bundle --platform=node --format=esm --packages=external --outfile=dist/server.js",
  "preview": "vite preview",
  "clean": "rm -rf dist",
  "lint": "tsc --noEmit"
}

Then fix these two files:

src/components/tabs/TruthManuscriptTab.tsx
src/services/geminiService.ts

Replace every:
process.env.GEMINI_API_KEY

With:
import.meta.env.VITE_GEMINI_API_KEY

Do not upload .env to GitHub.
In Google Studio, keep the real .env only inside the environment/project settings or local project root.

Before commit/deploy, run:
npm run build

If Google Studio changes process.env.GEMINI_API_KEY again, the build will fail and prevent a broken deploy.
