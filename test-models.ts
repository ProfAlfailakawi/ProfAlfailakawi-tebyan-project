import process from "node:process";

async function list() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
    headers: {
      "x-goog-api-key": apiKey,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    console.error(data);
    throw new Error("Failed to fetch Gemini models");
  }

  console.log(data.models.map((m: any) => m.name));
}

list();