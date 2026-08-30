/**
 * Tebyan Orchestrator — shared types.
 *
 * The orchestrator is the single "mind" that turns a free-text expression of
 * intent ("قل ما يشغلك") into (1) an immediate, human answer and (2) the single
 * best next step, choosing internally which engine (Decision Room, Simulation,
 * Roadmap, Council, Ripple, Knowledge Center, Creative Lab, …) to use — without
 * ever asking the user to know those names.
 *
 * Responsibility split (kept deliberately separate):
 *   intentClassifier  — understand WHAT the user needs (fast, local, offline-safe)
 *   engineRegistry    — declares each engine's capabilities + how to hand off to it
 *   engineRouter      — pick the engine(s) + the single Next Best Action
 *   answerComposer    — produce the human answer (AI, with a local fallback)
 *   contextMemory     — remember sessions so returning users can resume
 */

export type Language = 'ar' | 'en';

/** The kinds of need Tebyan recognises. `mixed` = more than one strong signal. */
export type IntentType =
  | 'understand' // explain / clarify a topic
  | 'decide' // torn between options
  | 'conflict' // interpersonal / negotiation / confrontation
  | 'plan' // turn a goal/project into steps
  | 'create' // ideate / develop an idea
  | 'simulate' // rehearse a conversation or situation
  | 'research' // deep retrieval / grounded knowledge
  | 'write' // shape thoughts into polished text
  | 'learn' // study / test understanding
  | 'future' // scenarios / consequences over time
  | 'emotional' // emotionally charged / urgent, needs care first
  | 'mixed'; // several strong intents at once

export type Emotion = 'neutral' | 'stress' | 'urgent' | 'sad' | 'hopeful';

export type Urgency = 'low' | 'normal' | 'high';

/** Coarse life-domain, used only to pick warmer copy and better examples. */
export type Domain =
  | 'parenting'
  | 'work'
  | 'money'
  | 'relationship'
  | 'health'
  | 'study'
  | 'idea'
  | 'self'
  | 'general';

export interface ClassifiedIntent {
  /** The dominant need. */
  primary: IntentType;
  /** Other strong needs, most-significant first (may be empty). */
  secondary: IntentType[];
  emotion: Emotion;
  urgency: Urgency;
  domain: Domain;
  /** 0..1 — how confident the local classifier is in `primary`. */
  confidence: number;
  /**
   * True when the situation is a human interaction that is better *rehearsed*
   * than *read about* (a manager, a teenager, a spouse, a client, an angry
   * party). Drives Tebyan's offer to run a live simulation.
   */
  isSocialSituation: boolean;
  /** True when the query is too vague to answer well without one clarification. */
  needsClarification: boolean;
}

/** How deep an answer the user currently wants. */
export type ResponseMode = 'quick' | 'simple' | 'deep';

/** The human answer shown first, before any complexity. */
export interface ComposedAnswer {
  /** "فهمت منك …" — Tebyan reflecting the intent back in one or two lines. */
  understanding: string;
  /** "الخلاصة" — the answer itself. */
  summary: string;
  /** "ابدأ بهذا الآن" — the first concrete step. */
  action: string;
  /** At most one clarifying question, only when it would change the answer. */
  clarifyingQuestion?: string | null;
  /** Engine the AI itself thinks fits best (validated against the registry). */
  engineHint?: IntentType | null;
  /** Where the answer came from — for honest degradation, never shown raw. */
  source: 'ai' | 'local';
}

/**
 * A human-worded action the user can take next. The engine name is NEVER shown;
 * only `label` (the button) and `pitch` (one warm line) are user-facing.
 */
export interface EngineAction {
  /** Registry engine id (internal). */
  engineId: string;
  /** Tab id `handleTabChange` navigates to (internal). */
  tabId: string;
  /** Button text in human language, e.g. "ابدأ التدريب". */
  label: string;
  /** One-line invitation, e.g. "هل تريد أن أمثل دور مديرك ونجرب الحوار؟". */
  pitch: string;
  /** The full context string handed to the engine on navigation. */
  handoffContext: string;
  /** Lucide icon name hint (resolved by the UI). */
  icon?: string;
}

/** The result the orchestrator hands the UI for one query. */
export interface OrchestrationResult {
  query: string;
  intent: ClassifiedIntent;
  answer: ComposedAnswer;
  /** The one suggestion Tebyan leads with. */
  nextBestAction: EngineAction;
  /** Revealed only behind "خيارات أخرى". Human-worded, never engine names. */
  alternatives: EngineAction[];
}

/** A remembered working session, grouped by intent for "مكتبتي". */
export interface MemorySession {
  id: string;
  query: string;
  /** The intent bucket this belongs to (drives library grouping). */
  intent: IntentType;
  domain: Domain;
  /** Short human summary of where we got to, for the resume card. */
  note?: string;
  /** Engine last used, so we can reopen exactly where we were. */
  lastEngineId?: string;
  lastTabId?: string;
  at: number;
  uid?: string | null;
}
