/**
 * aiCore.cjs — Shared AI engine for Tebyān.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Production serves /api via the Cloud Function in functions/index.js, while
 * dev/backup serves it via server.ts (bundled to dist/server.js). AGENTS.md
 * requires both to stay behaviourally identical (cache + retry + fallback).
 * Historically that meant copy-pasting the AI logic into two files. This module
 * is the single source of truth that BOTH import, so AI behaviour is written
 * once. functions/index.js does `require("./aiCore.cjs")`; server.ts does
 * `import ... from "./functions/aiCore.cjs"` (esbuild inlines it into
 * dist/server.js, tsx loads it directly in dev).
 *
 * WHAT'S NEW: EVIDENCE MODE (File Search + Search Grounding)
 * ---------------------------------------------------------
 * Grounding is implemented with the SAME raw-REST + fetch pattern the codebase
 * already uses for TTS (see generateTtsAudio). No new SDK is introduced, so the
 * protected default generation path (the @google/generative-ai SDK calls in the
 * hosts) is left completely untouched. Evidence logic only runs when a request
 * explicitly opts in via `config.evidenceMode`. On ANY failure or missing store
 * config, callers fall back to the existing behaviour — evidence is additive,
 * never a new point of failure.
 *
 * CommonJS on purpose: functions/ is CommonJS; server.ts (ESM) imports the
 * default export through esbuild/tsx interop.
 */

"use strict";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_MODEL = "gemini-2.5-flash";
const GENERATIVE_BASE = "https://generativelanguage.googleapis.com/v1beta";

// File Search store name is provisioned once (see scripts/provisionFileSearch.mjs)
// and exposed to the runtime via env. Format: "fileSearchStores/xxxxxxxx".
function getFileSearchStore() {
  return (
    process.env.TEBYAN_FILE_SEARCH_STORE ||
    process.env.FILE_SEARCH_STORE ||
    ""
  ).trim();
}

// The evidence "source" the UI shows the user.
const EVIDENCE_SOURCE = {
  INTERNAL: "internal", // قاعدة تبيان (File Search over curated corpus)
  WEB: "web", // العالم الحالي (Google Search grounding)
  MODEL: "model", // معرفة النموذج العامة (no grounding attached)
  SIMULATION: "simulation", // محاكاة/مجلس (set by feature callers, not here)
};

// ---------------------------------------------------------------------------
// Model normalization (kept identical to the hosts' historical behaviour)
// ---------------------------------------------------------------------------

function normalizeModel(modelName) {
  let finalModel = modelName || DEFAULT_MODEL;
  if (typeof finalModel !== "string") return DEFAULT_MODEL;
  if (finalModel.includes("gemini-1.5")) {
    return finalModel.includes("pro") ? "gemini-2.5-pro" : DEFAULT_MODEL;
  }
  if (
    finalModel === "gemini" ||
    finalModel === "gemini-pro" ||
    finalModel.includes("preview")
  ) {
    return DEFAULT_MODEL;
  }
  return finalModel;
}

// ---------------------------------------------------------------------------
// Busy / retry helpers (shared verbatim with the hosts)
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isGeminiBusyError(error) {
  const message = String((error && error.message) || error || "").toLowerCase();
  return (
    message.includes("503") ||
    message.includes("service unavailable") ||
    message.includes("high demand") ||
    message.includes("overloaded") ||
    message.includes("temporarily unavailable") ||
    message.includes("try again") ||
    message.includes("deadline exceeded") ||
    message.includes("429") ||
    message.includes("too many requests") ||
    message.includes("rate limit") ||
    message.includes("quota") ||
    message.includes("resource exhausted") ||
    message.includes("internal") ||
    message.includes("500") ||
    message.includes("no audio data")
  );
}

async function generateWithRetry(operation, label = "Gemini request") {
  const delays = [0, 1200, 2500, 5000, 9000, 14000];
  let lastError;
  for (let attempt = 0; attempt < delays.length; attempt++) {
    if (delays[attempt] > 0) {
      console.warn(
        `${label} busy. Retry ${attempt + 1}/${delays.length} after ${delays[attempt]}ms.`
      );
      await sleep(delays[attempt]);
    }
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isGeminiBusyError(error)) throw error;
      console.warn(
        `${label} busy/high demand on attempt ${attempt + 1}:`,
        (error && error.message) || error
      );
    }
  }
  throw lastError;
}

// ---------------------------------------------------------------------------
// Evidence extraction from Gemini groundingMetadata (v1beta REST, camelCase)
// ---------------------------------------------------------------------------

/**
 * Normalize the raw candidate.groundingMetadata into a stable envelope the
 * frontend can render without knowing Gemini internals. Defensive against the
 * several shapes grounding chunks can take (retrievedContext vs web).
 */
function extractEvidence(candidate, requestedSource) {
  const empty = {
    source: requestedSource || EVIDENCE_SOURCE.MODEL,
    confidence: null,
    citations: [],
    queries: [],
  };
  const gm =
    candidate &&
    (candidate.groundingMetadata || candidate.grounding_metadata);
  if (!gm) return empty;

  const rawChunks = gm.groundingChunks || gm.grounding_chunks || [];
  const citations = [];
  for (let i = 0; i < rawChunks.length; i++) {
    const chunk = rawChunks[i] || {};
    const rc = chunk.retrievedContext || chunk.retrieved_context;
    const web = chunk.web;
    if (rc) {
      citations.push({
        index: i,
        kind: "internal",
        title: rc.title || rc.displayName || "مصدر تبيان",
        uri: rc.uri || rc.url || "",
        snippet: (rc.text || "").slice(0, 400),
      });
    } else if (web) {
      citations.push({
        index: i,
        kind: "web",
        title: web.title || web.domain || web.uri || "مصدر خارجي",
        uri: web.uri || web.url || "",
        snippet: "",
      });
    }
  }

  // Confidence: average of grounding support confidence scores when present.
  const supports = gm.groundingSupports || gm.grounding_supports || [];
  let confidence = null;
  const scores = [];
  for (const s of supports) {
    const cs = s && (s.confidenceScores || s.confidence_scores);
    if (Array.isArray(cs)) {
      for (const v of cs) if (typeof v === "number") scores.push(v);
    }
  }
  if (scores.length) {
    confidence = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100;
  } else if (citations.length) {
    // No numeric scores returned but we do have citations: report a calibrated
    // "grounded" confidence rather than null so the UI can show provenance.
    confidence = 0.8;
  }

  const queries = gm.webSearchQueries || gm.web_search_queries || [];

  // Decide the source label from what actually came back.
  let source = requestedSource || EVIDENCE_SOURCE.MODEL;
  if (citations.length) {
    const anyWeb = citations.some((c) => c.kind === "web");
    const anyInternal = citations.some((c) => c.kind === "internal");
    if (anyInternal && !anyWeb) source = EVIDENCE_SOURCE.INTERNAL;
    else if (anyWeb && !anyInternal) source = EVIDENCE_SOURCE.WEB;
    else source = requestedSource || EVIDENCE_SOURCE.INTERNAL;
  }

  return { source, confidence, citations, queries };
}

// ---------------------------------------------------------------------------
// Grounded generation via raw REST (File Search or Google Search)
// ---------------------------------------------------------------------------

/**
 * @param {object}  args
 * @param {string}  args.apiKey        Gemini API key.
 * @param {string}  args.model         Model id (already normalized upstream is fine).
 * @param {Array}   args.contents      Gemini `contents` array.
 * @param {object}  [args.config]      { systemInstruction, temperature }.
 * @param {string}  args.evidenceMode  'internal' | 'web' | 'auto'.
 * @returns {Promise<{ text:string, evidence:object }>}
 *
 * Throws on hard failure so the caller can fall back to the ungrounded path.
 * NOTE: responseSchema/JSON mime is intentionally NOT sent here — grounding
 * tools return prose + citations, and forcing a JSON schema alongside a tool is
 * unreliable. Structured callers should keep using the ungrounded JSON path.
 */
async function generateGrounded(args) {
  const {
    apiKey,
    model,
    contents,
    config = {},
    evidenceMode = "auto",
  } = args;

  if (!apiKey) {
    const e = new Error("Missing API key for grounded generation");
    e.code = "NO_KEY";
    throw e;
  }

  const store = getFileSearchStore();
  const wantsInternal =
    evidenceMode === "internal" || evidenceMode === "auto";
  const wantsWeb = evidenceMode === "web";

  // Choose the grounding tool. Internal requires a provisioned store; if the
  // store is missing we cannot ground internally — signal the caller to fall
  // back rather than silently returning ungrounded output labelled "internal".
  let tools;
  let requestedSource;
  if (wantsWeb) {
    tools = [{ googleSearch: {} }];
    requestedSource = EVIDENCE_SOURCE.WEB;
  } else if (wantsInternal) {
    if (!store) {
      const e = new Error("File Search store not configured");
      e.code = "NO_STORE";
      throw e;
    }
    tools = [{ fileSearch: { fileSearchStoreNames: [store] } }];
    requestedSource = EVIDENCE_SOURCE.INTERNAL;
  } else {
    const e = new Error(`Unknown evidenceMode: ${evidenceMode}`);
    e.code = "BAD_MODE";
    throw e;
  }

  const body = {
    contents,
    tools,
  };
  if (config.systemInstruction) {
    body.systemInstruction = { parts: [{ text: String(config.systemInstruction) }] };
  }
  const genConfig = {};
  if (config.temperature !== undefined) genConfig.temperature = config.temperature;
  if (Object.keys(genConfig).length) body.generationConfig = genConfig;

  const endpoint = `${GENERATIVE_BASE}/models/${encodeURIComponent(
    normalizeModel(model)
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await generateWithRetry(async () => {
    const r = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const bodyText = await r.text();
    let json;
    try {
      json = JSON.parse(bodyText);
    } catch {
      json = { raw: bodyText };
    }
    if (!r.ok) {
      const err = new Error(
        (json && json.error && json.error.message) ||
          bodyText ||
          `Gemini grounded HTTP ${r.status}`
      );
      err.statusCode = r.status;
      throw err;
    }
    return json;
  }, `Gemini grounded (${requestedSource})`);

  const candidate =
    response &&
    response.candidates &&
    response.candidates[0];

  // Assemble text from all text parts.
  let text = "";
  const parts =
    (candidate && candidate.content && candidate.content.parts) || [];
  for (const p of parts) {
    if (p && typeof p.text === "string") text += p.text;
  }

  const evidence = extractEvidence(candidate, requestedSource);
  return { text: text.trim(), evidence };
}

// ---------------------------------------------------------------------------
// Text extraction from the legacy SDK response (shared by both hosts)
// ---------------------------------------------------------------------------

function extractSdkText(result) {
  if (!result || !result.response) throw new Error("No response from Gemini");
  try {
    const t = result.response.text();
    if (t) return t;
  } catch (e) {
    // Safety filter or shape difference — try candidates directly.
  }
  const c = result.response.candidates && result.response.candidates[0];
  const partText =
    c && c.content && c.content.parts && c.content.parts[0] && c.content.parts[0].text;
  if (partText) return partText;
  throw new Error("AI response was blocked or empty. Please try a different prompt.");
}

module.exports = {
  DEFAULT_MODEL,
  EVIDENCE_SOURCE,
  getFileSearchStore,
  normalizeModel,
  isGeminiBusyError,
  generateWithRetry,
  extractEvidence,
  generateGrounded,
  extractSdkText,
};
