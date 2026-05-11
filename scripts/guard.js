import { execSync } from "node:child_process";

const forbidden = "process.env.GEMINI_API_KEY";

try {
  const result = execSync(`grep -R "${forbidden}" src || true`, {
    encoding: "utf8",
  }).trim();

  if (result) {
    console.error("❌ Invalid browser env usage found:");
    console.error(result);
    console.error("");
    console.error("This is a Vite browser app.");
    console.error("Use import.meta.env.VITE_GEMINI_API_KEY instead of process.env.GEMINI_API_KEY inside src/.");
    process.exit(1);
  }

  console.log("✅ Env usage check passed.");
} catch (error) {
  console.error("❌ Env guard failed:");
  console.error(error);
  process.exit(1);
}
