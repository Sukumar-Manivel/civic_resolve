import { GoogleGenAI } from "@google/genai";
import { classifyIssueWithRules } from "./triageRules.js";
import { ISSUE_CATEGORIES, ISSUE_PRIORITIES } from "../utils/constants.js";

const CACHE_TTL_MS = 15 * 60 * 1000;
const MAX_CACHE_ENTRIES = 100;
export const triageCache = new Map();

const TRIAGE_SCHEMA = {
  type: "object",
  properties: {
    category: { type: "string", enum: ISSUE_CATEGORIES },
    priority: { type: "string", enum: ISSUE_PRIORITIES },
    department: { type: "string" },
    urgencyReason: { type: "string" },
    estimatedResolutionHours: { type: "number" }
  },
  required: ["category", "priority", "department", "urgencyReason", "estimatedResolutionHours"]
};

/**
 * Builds a deterministic cache key from grievance content.
 * @param {object} issue - Target issue record
 * @returns {string} Normalized cache key
 */
function buildCacheKey(issue) {
  const t = (issue.title || "").toLowerCase().trim();
  const d = (issue.description || "").toLowerCase().trim();
  const c = (issue.category || "auto").toLowerCase().trim();
  return `${t}::${d}::${c}`;
}

/**
 * Retrieves valid unexpired triage result from memoization cache.
 * @param {string} key - Cache lookup key
 * @param {number} [now=Date.now()] - Current timestamp
 * @returns {object|null} Cached triage result or null
 */
export function getCachedTriage(key, now = Date.now()) {
  const entry = triageCache.get(key);
  if (!entry) return null;
  if (now - entry.cachedAt > CACHE_TTL_MS) {
    triageCache.delete(key);
    return null;
  }
  return entry.data;
}

/**
 * Stores triage result into memoization cache with FIFO capacity cap.
 * @param {string} key - Cache key
 * @param {object} data - Triage assessment data
 * @param {number} [now=Date.now()] - Timestamp
 */
export function setCachedTriage(key, data, now = Date.now()) {
  if (triageCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = triageCache.keys().next().value;
    triageCache.delete(oldestKey);
  }
  triageCache.set(key, { cachedAt: now, data });
}

/**
 * Resets the triage memoization cache (for tests/maintenance).
 */
export function resetTriageCache() {
  triageCache.clear();
}

/**
 * Formats prompt for Google Gemini triage.
 * @param {object} issue - Raw issue payload
 * @returns {string} Structured prompt
 */
function buildPrompt(issue) {
  return [
    "You are a municipal dispatch AI. Triage this citizen complaint into exact category, priority, department, urgencyReason, and estimatedResolutionHours.",
    `Title: ${issue.title}`,
    `Description: ${issue.description}`,
    `Location: ${issue.location}`,
    `Preferred Category: ${issue.category || "Auto-Detect"}`
  ].join("\n");
}

/**
 * Invokes Google GenAI with strict JSON schema and 5s timeout.
 * @param {string} apiKey - Gemini API Key
 * @param {string} promptText - Prompt content
 * @returns {Promise<object>} Parsed JSON response
 */
async function callGeminiApi(apiKey, promptText) {
  const ai = new GoogleGenAI({ apiKey });
  const signal = AbortSignal.timeout(5000);
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: promptText,
    config: {
      responseMimeType: "application/json",
      responseSchema: TRIAGE_SCHEMA,
      abortSignal: signal
    }
  });
  return JSON.parse(response.text);
}

/**
 * Executes triage through Gemini if key is provided, or falls back to rule engine.
 * @param {object} issue - Issue payload
 * @param {string} [apiKey] - API Key
 * @returns {Promise<object>} Triage classification
 */
async function executeTriage(issue, apiKey) {
  if (!apiKey) {
    return classifyIssueWithRules(issue);
  }
  try {
    const prompt = buildPrompt(issue);
    const parsed = await callGeminiApi(apiKey, prompt);
    return {
      category: parsed.category || "General Administration",
      priority: parsed.priority || "Medium",
      department: parsed.department || "Citizen Grievance Redressal Cell",
      urgencyReason: parsed.urgencyReason || "Assessed via automated triage.",
      estimatedResolutionHours: Number(parsed.estimatedResolutionHours) || 24,
      triageSource: "gemini"
    };
  } catch (err) {
    process.stderr.write(`[Gemini Triage Warning] Upstream failure (${err.message}). Using fallback.\n`);
    return classifyIssueWithRules(issue);
  }
}

/**
 * Triages an issue with memoization caching.
 * @param {object} issue - Complaint payload
 * @returns {Promise<object>} Triage assessment
 */
export async function triageIssue(issue) {
  const cacheKey = buildCacheKey(issue);
  const cached = getCachedTriage(cacheKey);
  if (cached) {
    return cached;
  }
  const result = await executeTriage(issue, process.env.GEMINI_API_KEY);
  setCachedTriage(cacheKey, result);
  return result;
}
