import fs from "node:fs";

function replaceInFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found, skipped: ${filePath}`);
    return;
  }

  let text = fs.readFileSync(filePath, "utf8");

  text = text.replaceAll(
    "process.env.GEMINI_API_KEY",
    "import.meta.env.VITE_GEMINI_API_KEY"
  );

  text = text.replaceAll(
    "process.env.API_KEY",
    "import.meta.env.VITE_GEMINI_API_KEY"
  );

  fs.writeFileSync(filePath, text);
  console.log(`✅ Fixed: ${filePath}`);
}

replaceInFile("src/components/tabs/TruthManuscriptTab.tsx");
replaceInFile("src/services/geminiService.ts");

if (!fs.existsSync("package.json")) {
  console.error("❌ package.json not found. Run this from the project root.");
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
pkg.scripts = pkg.scripts || {};
pkg.scripts.prebuild = "node scripts/guard.js";
fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
console.log("✅ package.json updated: prebuild guard enabled.");

console.log("");
console.log("Next:");
console.log("npm run build");
console.log("firebase deploy --only hosting --project gen-lang-client-0579828362 --force");
