import { execSync } from "node:child_process";

const forbiddenPatterns = [
  "process.env.GEMINI_API_KEY",
  "process.env.API_KEY",
  "process.env.VITE_GEMINI_API_KEY",
  "import.meta.env.VITE_GEMINI_API_KEY",
  "new GoogleGenAI",
  "apiKey: ''",
  'apiKey: ""',
  "apiKey: undefined",
  "apiKey: void 0"
];

let failed = false;

for (const pattern of forbiddenPatterns) {
  const result = execSync(`grep -R "${pattern}" src || true`, {
    encoding: "utf8",
  }).trim();

  if (result) {
    failed = true;
    console.error(`❌ Invalid browser env usage found: ${pattern}`);
    console.error(result);
    console.error("");
  }
}

if (failed) {
  console.error("This is a Vite browser app.");
  console.error("Do not use Gemini API keys in frontend code.");
  console.error("Send requests to /api/ai/generate instead.");
  process.exit(1);
}

console.log("✅ Env usage check passed.");
