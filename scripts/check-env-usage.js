const { execSync } = require("child_process");

try {
  const result = execSync(
    "grep -R \"process.env.GEMINI_API_KEY\" src || true",
    { encoding: "utf8" }
  ).trim();

  if (result) {
    console.error("❌ Invalid browser env usage found:");
    console.error(result);
    console.error("\nUse import.meta.env.VITE_GEMINI_API_KEY instead.");
    process.exit(1);
  }

  console.log("✅ Env usage check passed.");
} catch (error) {
  console.error(error);
  process.exit(1);
}
